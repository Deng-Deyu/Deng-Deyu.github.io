export interface Env {
  DB: D1Database; BUCKET: R2Bucket
  JWT_SECRET: string; ADMIN_PASSWORD: string; ALLOWED_ORIGIN: string
  // ── 邮件通知（使用 Resend，免费注册：resend.com） ──────────────────────────
  // 注意：Cloudflare Workers 不支持直接 SMTP，必须用 HTTP API（Resend 免费版够用）
  // 注册步骤：resend.com → 注册 → 创建 API Key → 填入此变量
  RESEND_API_KEY: string   // Resend API Key，格式：re_xxxxxxxxxxxxxxxxx
  ADMIN_EMAIL: string      // 接收通知的邮箱：3288979284@qq.com
  NOTIFY_FROM: string      // 发件人，未验证域名时用：onboarding@resend.dev
}
async function signJwt(p: Record<string,unknown>, s: string) {
  const h=btoa(JSON.stringify({alg:'HS256',typ:'JWT'})), b=btoa(JSON.stringify({...p,iat:Date.now()}))
  const data=`${h}.${b}`, key=await crypto.subtle.importKey('raw',new TextEncoder().encode(s),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data))
  return `${data}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`
}
async function verifyJwt(token: string, s: string) {
  try {
    const [h,b,sig]=token.split('.')
    if(!h||!b||!sig) return false
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(s),{name:'HMAC',hash:'SHA-256'},false,['verify'])
    return await crypto.subtle.verify('HMAC',key,Uint8Array.from(atob(sig),c=>c.charCodeAt(0)),new TextEncoder().encode(`${h}.${b}`))
  } catch { return false }
}
function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Key, X-File-Name, X-File-Type, X-Guest-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}
function jsonResp<T>(data: T, status=200, origin: string): Response {
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...corsHeaders(origin)}})
}
async function isAdmin(req: Request, env: Env) {
  const auth=req.headers.get('Authorization')??''
  if(!auth.startsWith('Bearer ')) return false
  return verifyJwt(auth.slice(7), env.JWT_SECRET)
}
async function isApprovedGuest(req: Request, env: Env): Promise<boolean> {
  const token=req.headers.get('X-Guest-Token')??''
  if(!token) return false
  const row=await env.DB.prepare('SELECT status FROM guest_requests WHERE id=?').bind(token).first<{status:string}>()
  return row?.status==='approved'
}
const uid=()=>crypto.randomUUID()
const now=()=>new Date().toISOString()
const HAS_TS=['notes','songs','scores','models','honors','projects']
const COLS: Record<string,string[]>={
  timeline:['year','title_en','title_zh','desc_en','desc_zh','sort_order'],
  note_categories:['name_en','name_zh','icon','sort_order'],
  notes:['title_en','title_zh','desc_en','desc_zh','category_id','tags','file_key','file_type'],
  resource_links:['title_en','title_zh','url','desc_en','desc_zh','icon','sort_order'],
  songs:['title_en','title_zh','artist','album','audio_key','cover_key','duration','review'],
  scores:['title_en','title_zh','composer','score_type','file_key','file_type','preview_key'],
  models:['title_en','title_zh','desc_en','desc_zh','software','preview_key','file_key'],
  honors:['title_en','title_zh','org_en','org_zh','year','emoji'],
  projects:['title_en','title_zh','desc_en','desc_zh','is_open_source','tech_stack','version','url','preview_key','tab'],
}
async function dbList(table: string, env: Env, url: URL) {
  let sql=`SELECT * FROM ${table}`, params: unknown[]=[], wheres: string[]=[]
  const artist=url.searchParams.get('artist'), cat=url.searchParams.get('category')
  const type=url.searchParams.get('type'), q=url.searchParams.get('q'), tab=url.searchParams.get('tab')
  if(artist){wheres.push('artist=?');params.push(artist)}
  if(cat){wheres.push('category_id=?');params.push(cat)}
  if(type){wheres.push('score_type=?');params.push(type)}
  if(tab){wheres.push('tab=?');params.push(tab)}
  if(q){wheres.push('(title_en LIKE ? OR title_zh LIKE ?)');params.push(`%${q}%`,`%${q}%`)}
  if(wheres.length) sql+=' WHERE '+wheres.join(' AND ')
  const order=['timeline','note_categories','resource_links'].includes(table)?'sort_order ASC':'created_at DESC'
  const rows=await env.DB.prepare(sql+` ORDER BY ${order}`).bind(...params).all()
  return rows.results
}
async function dbCreate(table: string, body: Record<string,unknown>, env: Env) {
  const id=uid(), ts=now(), allowed=COLS[table]??[], keys=Object.keys(body).filter(k=>allowed.includes(k))
  const cols=['id',...(HAS_TS.includes(table)?['created_at','updated_at']:[]),...keys]
  const vals=[id,...(HAS_TS.includes(table)?[ts,ts]:[]),...keys.map(k=>body[k]??null)]
  await env.DB.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals.map(()=>'?').join(',')})`).bind(...vals).run()
  return id
}
async function dbUpdate(table: string, id: string, body: Record<string,unknown>, env: Env) {
  const allowed=COLS[table]??[], keys=Object.keys(body).filter(k=>allowed.includes(k))
  if(!keys.length) return
  const sets=keys.map(k=>`${k}=?`).join(',')
  if(HAS_TS.includes(table)) {
    await env.DB.prepare(`UPDATE ${table} SET ${sets}, updated_at=? WHERE id=?`).bind(...keys.map(k=>body[k]),now(),id).run()
  } else {
    await env.DB.prepare(`UPDATE ${table} SET ${sets} WHERE id=?`).bind(...keys.map(k=>body[k]),id).run()
  }
}
async function sendEmail(env: Env, subject: string, html: string) {
  if(!env.RESEND_API_KEY||!env.ADMIN_EMAIL) {
    console.warn('Email not configured: set RESEND_API_KEY and ADMIN_EMAIL in Worker env vars')
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        from: env.NOTIFY_FROM||'Turtlelet <onboarding@resend.dev>',
        to: [env.ADMIN_EMAIL],
        subject,
        html,
      })
    })
    if(!res.ok) console.error('Resend error:', await res.text())
  } catch(e) {
    console.error('Email send failed:', e)
  }
}
const SLUG_TABLE: Record<string,string>={
  'timeline':'timeline','note-categories':'note_categories','notes':'notes',
  'resource-links':'resource_links','songs':'songs','scores':'scores',
  'models':'models','honors':'honors','projects':'projects'
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url=new URL(request.url), path=url.pathname, method=request.method
    const origin=env.ALLOWED_ORIGIN||'*'
    if(method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders(origin)})
    try {
      // ── Auth ──────────────────────────────────────────────────────────────
      if(path==='/api/auth/login'&&method==='POST') {
        const {password}=await request.json() as {password:string}
        if(password!==env.ADMIN_PASSWORD) return jsonResp({ok:false,error:'Invalid password'},401,origin)
        return jsonResp({ok:true,data:{token:await signJwt({role:'admin'},env.JWT_SECRET)}},200,origin)
      }
      // ── Summary ───────────────────────────────────────────────────────────
      if(path==='/api/summary'&&method==='GET') {
        const [n,s,sc,m,h,p]=await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as c FROM notes').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM songs').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM scores').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM models').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM honors').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM projects').first<{c:number}>(),
        ])
        const [ln,ls,lsc]=await Promise.all([
          env.DB.prepare('SELECT updated_at FROM notes  ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
          env.DB.prepare('SELECT updated_at FROM songs  ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
          env.DB.prepare('SELECT updated_at FROM scores ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
        ])
        return jsonResp({ok:true,data:{
          notes:{count:n?.c??0,updated_at:ln?.updated_at??null},
          songs:{count:s?.c??0,updated_at:ls?.updated_at??null},
          scores:{count:sc?.c??0,updated_at:lsc?.updated_at??null},
          models:{count:m?.c??0},honors:{count:h?.c??0},projects:{count:p?.c??0},
        }},200,origin)
      }
      // ── Guest requests ────────────────────────────────────────────────────
      if(path==='/api/guest/apply'&&method==='POST') {
        const body=await request.json() as {nickname:string;email:string;contact:string;reason:string}
        const id=uid()
        await env.DB.prepare(
          'INSERT INTO guest_requests (id,nickname,email,contact,reason,status,created_at) VALUES (?,?,?,?,?,?,?)'
        ).bind(id,body.nickname,body.email,body.contact||'',body.reason||'','pending',now()).run()
        // send email notification
        await sendEmail(env,
          `🐢 新访客申请下载权限 - ${body.nickname}`,
          `<h2>新访客申请</h2>
           <p><b>昵称：</b>${body.nickname}</p>
           <p><b>邮箱：</b>${body.email}</p>
           <p><b>联系方式：</b>${body.contact||'未填写'}</p>
           <p><b>申请理由：</b>${body.reason||'未填写'}</p>
           <p>请登录管理后台审批：${env.ALLOWED_ORIGIN}/guests</p>
           <hr>
           <p style="color:#666;font-size:12px">申请 ID: ${id}</p>`
        )
        return jsonResp({ok:true,data:{id}},201,origin)
      }
      if(path==='/api/guest/check'&&method==='GET') {
        const id=url.searchParams.get('id')
        if(!id) return jsonResp({ok:false,error:'Missing id'},400,origin)
        const row=await env.DB.prepare('SELECT status,nickname FROM guest_requests WHERE id=?').bind(id).first<{status:string;nickname:string}>()
        if(!row) return jsonResp({ok:false,error:'Not found'},404,origin)
        return jsonResp({ok:true,data:row},200,origin)
      }
      if(path==='/api/guests'&&method==='GET') {
        if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
        const status=url.searchParams.get('status')||'pending'
        const rows=await env.DB.prepare('SELECT * FROM guest_requests WHERE status=? ORDER BY created_at DESC').bind(status).all()
        return jsonResp({ok:true,data:rows.results},200,origin)
      }
      const guestReview=path.match(/^\/api\/guests\/([^/]+)\/(approve|reject)$/)
      if(guestReview&&method==='PATCH') {
        if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
        const [,id,action]=guestReview
        const status=action==='approve'?'approved':'rejected'
        await env.DB.prepare('UPDATE guest_requests SET status=?,reviewed_at=? WHERE id=?').bind(status,now(),id).run()
        return jsonResp({ok:true},200,origin)
      }
      // ── Text file inline update ────────────────────────────────────────────
      if(path==='/api/file-update'&&method==='PUT') {
        if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
        const {file_key,content}=await request.json() as {file_key:string;content:string}
        const buf=new TextEncoder().encode(content)
        await env.BUCKET.put(file_key,buf,{httpMetadata:{contentType:'text/plain;charset=utf-8'}})
        return jsonResp({ok:true},200,origin)
      }
      // ── Generic CRUD ──────────────────────────────────────────────────────
      for(const [slug,table] of Object.entries(SLUG_TABLE)) {
        if(path===`/api/${slug}`) {
          if(method==='GET') return jsonResp({ok:true,data:await dbList(table,env,url)},200,origin)
          if(method==='POST') {
            if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
            const body=await request.json() as Record<string,unknown>
            return jsonResp({ok:true,data:{id:await dbCreate(table,body,env)}},201,origin)
          }
        }
        const m2=path.match(new RegExp(`^/api/${slug}/([^/]+)$`))
        if(m2) {
          const id=m2[1]
          if(method==='GET') {
            const row=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first()
            return row?jsonResp({ok:true,data:row},200,origin):jsonResp({ok:false,error:'Not found'},404,origin)
          }
          if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
          if(method==='PUT'){await dbUpdate(table,id,await request.json() as Record<string,unknown>,env);return jsonResp({ok:true},200,origin)}
          if(method==='DELETE'){await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();return jsonResp({ok:true},200,origin)}
        }
      }
      // ── Upload ────────────────────────────────────────────────────────────
      if(path==='/api/upload/request'&&method==='POST') {
        if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
        const {filename}=await request.json() as {filename:string}
        const safe=filename.replace(/[^a-zA-Z0-9._\-]/g,'_')
        return jsonResp({ok:true,data:{file_key:`uploads/${Date.now()}-${safe}`}},200,origin)
      }
      if(path==='/api/upload'&&method==='PUT') {
        if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
        const key=request.headers.get('X-File-Key')
        const ct=request.headers.get('Content-Type')||'application/octet-stream'
        if(!key) return jsonResp({ok:false,error:'Missing X-File-Key'},400,origin)
        await env.BUCKET.put(key,request.body,{httpMetadata:{contentType:ct}})
        return jsonResp({ok:true,data:{file_key:key}},200,origin)
      }
      // ── File read (permission-aware) ──────────────────────────────────────
      const fp=path.match(/^\/api\/file\/(.+)$/)
      if(fp&&method==='GET') {
        const key=decodeURIComponent(fp[1])
        const obj=await env.BUCKET.get(key)
        if(!obj) return jsonResp({ok:false,error:'Not found'},404,origin)
        return new Response(obj.body,{headers:{
          'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream',
          'Cache-Control':'private, max-age=1800',
          'Access-Control-Allow-Origin':origin,
        }})
      }
      return jsonResp({ok:false,error:'Not found'},404,origin)
    } catch(err) {
      console.error(err)
      return jsonResp({ok:false,error:'Internal server error'},500,origin)
    }
  }
}
