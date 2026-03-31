export interface Env {
  DB: D1Database; BUCKET: R2Bucket
  JWT_SECRET: string; ADMIN_PASSWORD: string; ALLOWED_ORIGIN: string
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name, X-File-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
const uid=()=>crypto.randomUUID()
const now=()=>new Date().toISOString()
const HAS_TS=['notes','songs','scores','models','honors','projects']
const COLS: Record<string,string[]>={
  timeline:['year','title_en','title_zh','desc_en','desc_zh','sort_order'],
  note_categories:['name_en','name_zh','icon','sort_order'],
  notes:['title_en','title_zh','desc_en','desc_zh','category_id','tags','file_key','file_type'],
  resource_links:['title_en','title_zh','url','desc_en','desc_zh','icon','sort_order'],
  songs:['title_en','title_zh','artist','album','audio_key','cover_key','duration'],
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
      // Auth
      if(path==='/api/auth/login'&&method==='POST') {
        const {password}=await request.json() as {password:string}
        if(password!==env.ADMIN_PASSWORD) return jsonResp({ok:false,error:'Invalid password'},401,origin)
        return jsonResp({ok:true,data:{token:await signJwt({role:'admin'},env.JWT_SECRET)}},200,origin)
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
      // Generic CRUD
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
      // Upload: get a key first
      if(path==='/api/upload/request'&&method==='POST') {
        if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
        const {filename}=await request.json() as {filename:string}
        const safe=filename.replace(/[^a-zA-Z0-9._\-]/g,'_')
        const key=`uploads/${Date.now()}-${safe}`
        return jsonResp({ok:true,data:{file_key:key}},200,origin)
      }
      // Upload: stream file to R2
      // Key comes as base64 in header to avoid URL encoding issues
      if(path==='/api/upload'&&method==='PUT') {
        if(!await isAdmin(request,env)) return jsonResp({ok:false,error:'Unauthorized'},401,origin)
        const key=request.headers.get('X-File-Key')
        const ct=request.headers.get('Content-Type')||'application/octet-stream'
        if(!key) return jsonResp({ok:false,error:'Missing X-File-Key header'},400,origin)
        await env.BUCKET.put(key,request.body,{httpMetadata:{contentType:ct}})
        return jsonResp({ok:true,data:{file_key:key}},200,origin)
      }
      // File read
      const fp=path.match(/^\/api\/file\/(.+)$/)
      if(fp&&method==='GET') {
        const key=decodeURIComponent(fp[1])
        const obj=await env.BUCKET.get(key)
        if(!obj) return jsonResp({ok:false,error:'Not found'},404,origin)
        const headers=new Headers({
          'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream',
          'Cache-Control':'private, max-age=1800',
          'Access-Control-Allow-Origin':origin,
        })
        return new Response(obj.body,{headers})
      }
      return jsonResp({ok:false,error:'Not found'},404,origin)
    } catch(err) {
      console.error(err)
      return jsonResp({ok:false,error:'Internal server error'},500,origin)
    }
  }
}
