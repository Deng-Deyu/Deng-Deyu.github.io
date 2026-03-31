export interface Env {
  DB: D1Database; BUCKET: R2Bucket
  JWT_SECRET: string; ADMIN_PASSWORD: string; ALLOWED_ORIGIN: string
}
async function sign(p: Record<string,unknown>, s: string) {
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
function cors(origin: string) {
  return {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS'}
}
function json<T>(data: T, status=200, origin: string): Response {
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...cors(origin)}})
}
async function isAdmin(req: Request, env: Env) {
  const auth=req.headers.get('Authorization')??''
  if(!auth.startsWith('Bearer ')) return false
  return verifyJwt(auth.slice(7),env.JWT_SECRET)
}
const uid=()=>crypto.randomUUID()
const now=()=>new Date().toISOString()
const COLS: Record<string,string[]>={
  timeline:['year','title_en','title_zh','desc_en','desc_zh','sort_order'],
  note_categories:['name_en','name_zh','icon','sort_order'],
  notes:['title_en','title_zh','desc_en','desc_zh','category_id','tags','file_key','file_type'],
  resource_links:['title_en','title_zh','url','desc_en','desc_zh','icon','sort_order'],
  songs:['title_en','title_zh','artist','album','audio_key','cover_key','duration'],
  scores:['title_en','title_zh','composer','score_type','file_key','file_type','preview_key'],
  models:['title_en','title_zh','desc_en','desc_zh','software','preview_key','file_key'],
  honors:['title_en','title_zh','org_en','org_zh','year','emoji'],
  software_projects:['title_en','title_zh','desc_en','desc_zh','is_open_source','github_url','download_url','preview_key','tags'],
}
const HAS_TS=['notes','songs','scores','models','honors','software_projects']
async function dbList(table: string, env: Env, url: URL) {
  let sql=`SELECT * FROM ${table}`, params: unknown[]=[], wheres: string[]=[]
  const artist=url.searchParams.get('artist'), cat=url.searchParams.get('category')
  const type=url.searchParams.get('type'), q=url.searchParams.get('q')
  if(artist){wheres.push('artist=?');params.push(artist)}
  if(cat){wheres.push('category_id=?');params.push(cat)}
  if(type){wheres.push('score_type=?');params.push(type)}
  if(q){wheres.push('(title_en LIKE ? OR title_zh LIKE ?)');params.push(`%${q}%`,`%${q}%`)}
  if(wheres.length) sql+=' WHERE '+wheres.join(' AND ')
  const order=['timeline','note_categories','resource_links'].includes(table)?'sort_order ASC':'created_at DESC'
  const rows=await env.DB.prepare(sql+` ORDER BY ${order}`).bind(...params).all()
  return rows.results
}
async function dbCreate(table: string, body: Record<string,unknown>, env: Env) {
  const id=uid(), ts=now(), allowed=COLS[table]??[]
  // 修复类型问题，防止 500
  if(table==='songs') body.duration = Number(body.duration)||0;
  if(table==='software_projects') body.is_open_source = body.is_open_source ? 1 : 0;
  
  const keys=Object.keys(body).filter(k=>allowed.includes(k))
  const cols=['id',...(HAS_TS.includes(table)?['created_at','updated_at']:[]),...keys]
  const vals=[id,...(HAS_TS.includes(table)?[ts,ts]:[]),...keys.map(k=>body[k]??null)]
  await env.DB.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals.map(()=>'?').join(',')})`).bind(...vals).run()
  return id
}
async function dbUpdate(table: string, id: string, body: Record<string,unknown>, env: Env) {
  const allowed=COLS[table]??[]
  if(table==='songs' && body.duration !== undefined) body.duration = Number(body.duration)||0;
  if(table==='software_projects' && body.is_open_source !== undefined) body.is_open_source = body.is_open_source ? 1 : 0;
  
  const keys=Object.keys(body).filter(k=>allowed.includes(k))
  if(!keys.length) return
  const sets=keys.map(k=>`${k}=?`).join(',')
  if(HAS_TS.includes(table)) {
    await env.DB.prepare(`UPDATE ${table} SET ${sets}, updated_at=? WHERE id=?`).bind(...keys.map(k=>body[k]),now(),id).run()
  } else {
    await env.DB.prepare(`UPDATE ${table} SET ${sets} WHERE id=?`).bind(...keys.map(k=>body[k]),id).run()
  }
}
const SLUG_TABLE: Record<string,string>={
  'timeline':'timeline','note-categories':'note_categories','notes':'notes',
  'resource-links':'resource_links','songs':'songs','scores':'scores',
  'models':'models','honors':'honors','software':'software_projects'
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url=new URL(request.url), path=url.pathname, method=request.method
    const origin=env.ALLOWED_ORIGIN||'*'
    if(method==='OPTIONS') return new Response(null,{headers:cors(origin)})
    try {
      if(path==='/api/auth/login'&&method==='POST') {
        const {password}=await request.json() as {password:string}
        if(password!==env.ADMIN_PASSWORD) return json({ok:false,error:'Invalid password'},401,origin)
        return json({ok:true,data:{token:await sign({role:'admin'},env.JWT_SECRET)}},200,origin)
      }
      if(path==='/api/summary'&&method==='GET') {
        const [n,s,sc,m,h,sw]=await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as c FROM notes').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM songs').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM scores').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM models').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM honors').first<{c:number}>(),
          env.DB.prepare('SELECT COUNT(*) as c FROM software_projects').first<{c:number}>(),
        ])
        const [ln,ls,lsc,lsw]=await Promise.all([
          env.DB.prepare('SELECT updated_at FROM notes ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
          env.DB.prepare('SELECT updated_at FROM songs ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
          env.DB.prepare('SELECT updated_at FROM scores ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
          env.DB.prepare('SELECT updated_at FROM software_projects ORDER BY updated_at DESC LIMIT 1').first<{updated_at:string}>(),
        ])
        return json({ok:true,data:{
          notes:{count:n?.c??0,updated_at:ln?.updated_at??null},
          songs:{count:s?.c??0,updated_at:ls?.updated_at??null},
          scores:{count:sc?.c??0,updated_at:lsc?.updated_at??null},
          software:{count:sw?.c??0,updated_at:lsw?.updated_at??null},
          models:{count:m?.c??0},honors:{count:h?.c??0},
        }},200,origin)
      }
      for(const [slug,table] of Object.entries(SLUG_TABLE)) {
        if(path===`/api/${slug}`) {
          if(method==='GET') return json({ok:true,data:await dbList(table,env,url)},200,origin)
          if(method==='POST') {
            if(!await isAdmin(request,env)) return json({ok:false,error:'Unauthorized'},401,origin)
            const body=await request.json() as Record<string,unknown>
            return json({ok:true,data:{id:await dbCreate(table,body,env)}},201,origin)
          }
        }
        const m2=path.match(new RegExp(`^/api/${slug}/([^/]+)$`))
        if(m2) {
          const id=m2[1]
          if(method==='GET') {
            const row=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first()
            return row?json({ok:true,data:row},200,origin):json({ok:false,error:'Not found'},404,origin)
          }
          if(!await isAdmin(request,env)) return json({ok:false,error:'Unauthorized'},401,origin)
          if(method==='PUT'){await dbUpdate(table,id,await request.json() as Record<string,unknown>,env);return json({ok:true},200,origin)}
          if(method==='DELETE'){await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();return json({ok:true},200,origin)}
        }
      }
      if(path==='/api/upload/request'&&method==='POST') {
        if(!await isAdmin(request,env)) return json({ok:false,error:'Unauthorized'},401,origin)
        const {filename}=await request.json() as {filename:string}
        const safe=filename.replace(/[^a-zA-Z0-9._-]/g,'_')
        return json({ok:true,data:{file_key:`uploads/${Date.now()}-${safe}`}},200,origin)
      }
      const up=path.match(/^\/api\/upload\/(.+)$/)
      if(up&&method==='PUT') {
        if(!await isAdmin(request,env)) return json({ok:false,error:'Unauthorized'},401,origin)
        const key=decodeURIComponent(up[1]), ct=request.headers.get('Content-Type')?? 'application/octet-stream'
        await env.BUCKET.put(key,request.body,{httpMetadata:{contentType:ct}})
        return json({ok:true,data:{file_key:key}},200,origin)
      }
      const fp=path.match(/^\/api\/file\/(.+)$/)
      if(fp&&method==='GET') {
        const key=decodeURIComponent(fp[1]), obj=await env.BUCKET.get(key)
        if(!obj) return json({ok:false,error:'Not found'},404,origin)
        return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType?? 'application/octet-stream','Cache-Control':'private, max-age=1800','Access-Control-Allow-Origin':origin}})
      }
      return json({ok:false,error:'Not found'},404,origin)
    } catch(err:any) {
      console.error(err);
      // 抛出详细错误而不是简单的 500
      return json({ok:false,error:err.message||'Internal server error'},500,origin)
    }
  }
}