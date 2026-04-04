export interface Env {
  DB: D1Database; BUCKET: R2Bucket
  JWT_SECRET: string; ADMIN_PASSWORD: string; ALLOWED_ORIGIN: string
  RESEND_API_KEY: string; ADMIN_EMAIL: string; NOTIFY_FROM: string
}
async function signJwt(p: Record<string,unknown>, s: string) {
  const h=btoa(JSON.stringify({alg:'HS256',typ:'JWT'})), b=btoa(JSON.stringify({...p,iat:Date.now()}))
  const data=`${h}.${b}`, key=await crypto.subtle.importKey('raw',new TextEncoder().encode(s),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data))
  return `${data}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`
}
async function verifyJwt(token: string, s: string): Promise<boolean> {
  try {
    const [h,b,sig]=token.split('.')
    if(!h||!b||!sig) return false
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(s),{name:'HMAC',hash:'SHA-256'},false,['verify'])
    return await crypto.subtle.verify('HMAC',key,Uint8Array.from(atob(sig),c=>c.charCodeAt(0)),new TextEncoder().encode(`${h}.${b}`))
  } catch { return false }
}
function corsH(origin: string): Record<string,string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Key, X-Guest-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}
function ok<T>(data: T, status=200, origin: string): Response {
  return new Response(JSON.stringify({ok:true,data}),{status,headers:{'Content-Type':'application/json',...corsH(origin)}})
}
function err(msg: string, status=400, origin: string): Response {
  return new Response(JSON.stringify({ok:false,error:msg}),{status,headers:{'Content-Type':'application/json',...corsH(origin)}})
}
async function isAdmin(req: Request, env: Env): Promise<boolean> {
  const auth=req.headers.get('Authorization')??''
  if(!auth.startsWith('Bearer ')) return false
  return verifyJwt(auth.slice(7), env.JWT_SECRET)
}
async function isApprovedGuest(req: Request, env: Env): Promise<boolean> {
  const t=req.headers.get('X-Guest-Token')??''
  if(!t) return false
  const row=await env.DB.prepare('SELECT status FROM guest_requests WHERE id=?').bind(t).first<{status:string}>()
  return row?.status==='approved'
}
const uid=()=>crypto.randomUUID()
const now=()=>new Date().toISOString()
const HAS_TS=['notes','songs','scores','models','honors','projects','note_files','guest_requests']
const COLS: Record<string,string[]>={
  timeline:['year','title_en','title_zh','desc_en','desc_zh','sort_order'],
  note_categories:['parent_id','name_en','name_zh','icon','sort_order'],
  notes:['title_en','title_zh','desc_en','desc_zh','category_id','tags'],
  note_files:['note_id','file_key','file_type','filename','sort_order'],
  resource_links:['title_en','title_zh','url','desc_en','desc_zh','icon','sort_order'],
  songs:['title_en','title_zh','artist','album','audio_key','cover_key','duration','review'],
  scores:['title_en','title_zh','composer','score_type','file_key','file_type','preview_key'],
  models:['title_en','title_zh','desc_en','desc_zh','software','url','preview_key'],
  honors:['title_en','title_zh','org_en','org_zh','year','emoji'],
  projects:['title_en','title_zh','desc_en','desc_zh','is_open_source','tech_stack','version','url','preview_key','tab'],
}
async function dbList(table: string, env: Env, url: URL) {
  let sql=`SELECT * FROM ${table}`, params: unknown[]=[], ws: string[]=[]
  const p=(k: string)=>url.searchParams.get(k)
  if(p('artist')){ws.push('artist=?');params.push(p('artist'))}
  if(p('category')){ws.push('category_id=?');params.push(p('category'))}
  if(p('type')){ws.push('score_type=?');params.push(p('type'))}
  if(p('tab')){ws.push('tab=?');params.push(p('tab'))}
  if(p('note_id')){ws.push('note_id=?');params.push(p('note_id'))}
  if(p('parent_id')){
    const pid=p('parent_id')
    ws.push(pid==='null'?'parent_id IS NULL':'parent_id=?')
    if(pid!=='null') params.push(pid)
  }
  if(p('q')){ws.push('(title_en LIKE ? OR title_zh LIKE ?)');params.push(`%${p('q')}%`,`%${p('q')}%`)}
  if(ws.length) sql+=' WHERE '+ws.join(' AND ')
  const order=['timeline','note_categories','resource_links','note_files'].includes(table)?'sort_order ASC':'created_at DESC'
  try {
    const rows=await env.DB.prepare(sql+` ORDER BY ${order}`).bind(...params).all()
    return rows.results
  } catch (e) {
    console.error('DB list query failed', { table, sql, params, error: e })
    throw e
  }
}
async function dbCreate(table: string, body: Record<string,unknown>, env: Env): Promise<string> {
  const id=uid(), ts=now()
  const allowed=COLS[table]??[]
  const keys=Object.keys(body).filter(k=>allowed.includes(k))
  const cols=['id',...(HAS_TS.includes(table)?['created_at','updated_at']:[]),...keys]
  const vals=[id,...(HAS_TS.includes(table)?[ts,ts]:[]),...keys.map(k=>body[k]??null)]
  await env.DB.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals.map(()=>'?').join(',')})`).bind(...vals).run()
  return id
}
async function dbUpdate(table: string, id: string, body: Record<string,unknown>, env: Env): Promise<void> {
  const allowed=COLS[table]??[], keys=Object.keys(body).filter(k=>allowed.includes(k))
  if(!keys.length) return
  const sets=keys.map(k=>`${k}=?`).join(',')
  const vals=[...keys.map(k=>body[k])]
  if(HAS_TS.includes(table)) {
    await env.DB.prepare(`UPDATE ${table} SET ${sets}, updated_at=? WHERE id=?`).bind(...vals,now(),id).run()
  } else {
    await env.DB.prepare(`UPDATE ${table} SET ${sets} WHERE id=?`).bind(...vals,id).run()
  }
}
async function sendEmail(env: Env, subject: string, html: string): Promise<void> {
  if(!env.RESEND_API_KEY||!env.ADMIN_EMAIL) return
  try {
    const res=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:env.NOTIFY_FROM||'Turtlelet <onboarding@resend.dev>',to:[env.ADMIN_EMAIL],subject,html})
    })
    if(!res.ok) console.error('Resend error:',await res.text())
  } catch(e){console.error('Email error:',e)}
}
const SLUG: Record<string,string>={
  'timeline':'timeline','note-categories':'note_categories',
  'notes':'notes','note-files':'note_files',
  'resource-links':'resource_links','songs':'songs','scores':'scores',
  'models':'models','honors':'honors','projects':'projects'
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url=new URL(request.url), path=url.pathname, method=request.method
    const origin=env.ALLOWED_ORIGIN||'*'
    if(method==='OPTIONS') return new Response(null,{status:204,headers:corsH(origin)})
    try {
      // Auth
      if(path==='/api/auth/login'&&method==='POST') {
        const {password}=await request.json() as {password:string}
        if(password!==env.ADMIN_PASSWORD) return err('Invalid password',401,origin)
        return ok({token:await signJwt({role:'admin'},env.JWT_SECRET)},200,origin)
      }
      // Summary
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
          env.DB.prepare('SELECT updated_at FROM notes ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
          env.DB.prepare('SELECT updated_at FROM songs ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
          env.DB.prepare('SELECT updated_at FROM scores ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
        ])
        return ok({
          notes:{count:n?.c??0,updated_at:ln?.updated_at??null},
          songs:{count:s?.c??0,updated_at:ls?.updated_at??null},
          scores:{count:sc?.c??0,updated_at:lsc?.updated_at??null},
          models:{count:m?.c??0},honors:{count:h?.c??0},projects:{count:p?.c??0},
        },200,origin)
      }
      // Guest system
      if(path==='/api/guest/apply'&&method==='POST') {
        const body=await request.json() as {nickname:string;email:string;contact:string;reason:string}
        const id=uid()
        await env.DB.prepare('INSERT INTO guest_requests (id,nickname,email,contact,reason,status,created_at) VALUES (?,?,?,?,?,?,?)')
          .bind(id,body.nickname,body.email,body.contact||'',body.reason||'','pending',now()).run()
        await sendEmail(env,`🐢 新访客申请 - ${body.nickname}`,
          `<h2>访客申请下载权限</h2><p><b>昵称：</b>${body.nickname}</p><p><b>邮箱：</b>${body.email}</p><p><b>联系方式：</b>${body.contact||'未填'}</p><p><b>理由：</b>${body.reason||'未填'}</p><p>审批地址：${env.ALLOWED_ORIGIN}/guests</p><hr><small>ID: ${id}</small>`)
        return ok({id},201,origin)
      }
      if(path==='/api/guest/check'&&method==='GET') {
        const id=url.searchParams.get('id')
        if(!id) return err('Missing id',400,origin)
        const row=await env.DB.prepare('SELECT status,nickname FROM guest_requests WHERE id=?').bind(id).first<{status:string;nickname:string}>()
        if(!row) return err('Not found',404,origin)
        return ok(row,200,origin)
      }
      if(path==='/api/guests'&&method==='GET') {
        if(!await isAdmin(request,env)) return err('Unauthorized',401,origin)
        const status=url.searchParams.get('status')||'pending'
        const rows=await env.DB.prepare('SELECT * FROM guest_requests WHERE status=? ORDER BY created_at DESC').bind(status).all()
        return ok(rows.results,200,origin)
      }
      const gr=path.match(/^\/api\/guests\/([^/]+)\/(approve|reject)$/)
      if(gr&&method==='PATCH') {
        if(!await isAdmin(request,env)) return err('Unauthorized',401,origin)
        const [,id,action]=gr
        await env.DB.prepare('UPDATE guest_requests SET status=?,reviewed_at=? WHERE id=?')
          .bind(action==='approve'?'approved':'rejected',now(),id).run()
        return ok({},200,origin)
      }
      // Inline text update
      if(path==='/api/file-update'&&method==='PUT') {
        if(!await isAdmin(request,env)) return err('Unauthorized',401,origin)
        const {file_key,content}=await request.json() as {file_key:string;content:string}
        await env.BUCKET.put(file_key,new TextEncoder().encode(content),{httpMetadata:{contentType:'text/plain;charset=utf-8'}})
        return ok({},200,origin)
      }
      // Explicit note-files and note-categories routing for safer handling
      if(path==='/api/note-files'&&method==='GET') {
        try {
          return ok(await dbList('note_files',env,url),200,origin)
        } catch (e) {
          console.error('note_files list failed', { query: url.searchParams.toString(), error: e })
          throw e
        }
      }
      if(path==='/api/note-categories'&&method==='POST') {
        if(!await isAdmin(request,env)) return err('Unauthorized',401,origin)
        const body=await request.json() as Record<string,unknown>
        try {
          return ok({id:await dbCreate('note_categories',body,env)},201,origin)
        } catch (e) {
          console.error('note_categories create failed', { body, error: e })
          throw e
        }
      }
      // Generic CRUD
      for(const [slug,table] of Object.entries(SLUG)) {
        if(path===`/api/${slug}`) {
          if(method==='GET') return ok(await dbList(table,env,url),200,origin)
          if(method==='POST') {
            if(!await isAdmin(request,env)) return err('Unauthorized',401,origin)
            const body=await request.json() as Record<string,unknown>
            return ok({id:await dbCreate(table,body,env)},201,origin)
          }
        }
        const m2=path.match(new RegExp(`^/api/${slug}/([^/]+)$`))
        if(m2) {
          const id=m2[1]
          if(method==='GET') {
            const row=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first()
            return row?ok(row,200,origin):err('Not found',404,origin)
          }
          if(!await isAdmin(request,env)) return err('Unauthorized',401,origin)
          if(method==='PUT'){await dbUpdate(table,id,await request.json() as Record<string,unknown>,env);return ok({},200,origin)}
          if(method==='DELETE'){await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();return ok({},200,origin)}
        }
      }
      // Upload
      if(path==='/api/upload/request'&&method==='POST') {
        if(!await isAdmin(request,env)) return err('Unauthorized',401,origin)
        const {filename}=await request.json() as {filename:string}
        const safe=filename.replace(/[^a-zA-Z0-9._\-]/g,'_')
        return ok({file_key:`uploads/${Date.now()}-${safe}`},200,origin)
      }
      if(path==='/api/upload'&&method==='PUT') {
        if(!await isAdmin(request,env)) return err('Unauthorized',401,origin)
        const key=request.headers.get('X-File-Key')
        if(!key) return err('Missing X-File-Key',400,origin)
        const ct=request.headers.get('Content-Type')||'application/octet-stream'
        try {
          const data = await request.arrayBuffer()
          await env.BUCKET.put(key,data,{httpMetadata:{contentType:ct}})
        } catch (e) {
          console.error('Upload failed', e)
          return err('Upload failed',500,origin)
        }
        return ok({file_key:key},200,origin)
      }
      // File read
      const fp=path.match(/^\/api\/file\/(.+)$/)
      if(fp&&method==='GET') {
        const key=decodeURIComponent(fp[1])
        const obj=await env.BUCKET.get(key)
        if(!obj) return err('Not found',404,origin)
        return new Response(obj.body,{headers:{
          'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream',
          'Cache-Control':'private, max-age=1800',
          'Access-Control-Allow-Origin':origin,
        }})
      }
      return err('Not found',404,origin)
    } catch(e){
      console.error(e)
      return err('Internal server error',500,origin)
    }
  }
}
