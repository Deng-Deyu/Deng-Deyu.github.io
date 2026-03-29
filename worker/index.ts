/**
 * Turtlelet API — Cloudflare Worker
 *
 * Routes:
 *   POST /api/auth/login          → 管理员登录，返回 JWT
 *   GET  /api/cards/:type         → 获取卡片列表（公开）
 *   POST /api/cards/:type         → 新建卡片（需 admin JWT）
 *   PUT  /api/cards/:type/:id     → 更新卡片（需 admin JWT）
 *   DELETE /api/cards/:type/:id   → 删除卡片（需 admin JWT）
 *   POST /api/upload/request      → 获取 R2 预签名上传 URL（需 admin JWT）
 *   GET  /api/file/:key           → 获取 R2 预签名读取 URL（公开，30min 有效）
 *   GET  /api/timeline            → 获取时间轴（公开）
 *   POST /api/timeline            → 新建时间轴条目（需 admin JWT）
 *   PUT  /api/timeline/:id        → 更新时间轴条目（需 admin JWT）
 *   DELETE /api/timeline/:id      → 删除时间轴条目（需 admin JWT）
 */

export interface Env {
  DB: D1Database
  BUCKET: R2Bucket
  JWT_SECRET: string
  ADMIN_PASSWORD: string
  ALLOWED_ORIGIN: string
}

// ─── JWT (lightweight, no external deps) ─────────────────────────────────────

async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = btoa(JSON.stringify({ ...payload, iat: Date.now() }))
  const data   = `${header}.${body}`
  const key    = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig    = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return `${data}.${sigB64}`
}

async function verifyJWT(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const data = `${parts[0]}.${parts[1]}`
    const key  = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const sigBytes = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0))
    return await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
  } catch { return false }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json<T>(data: T, status = 200, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    }
  })
}

async function requireAdmin(req: Request, env: Env): Promise<boolean> {
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return false
  return verifyJWT(auth.slice(7), env.JWT_SECRET)
}

function newId(): string {
  return crypto.randomUUID()
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url    = new URL(request.url)
    const path   = url.pathname
    const method = request.method
    const origin = env.ALLOWED_ORIGIN || '*'

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        }
      })
    }

    try {
      // ── Auth ──────────────────────────────────────────────────────────────
      if (path === '/api/auth/login' && method === 'POST') {
        const { password } = await request.json() as { password: string }
        if (password !== env.ADMIN_PASSWORD)
          return json({ ok: false, error: 'Invalid password' }, 401, origin)
        const token = await signJWT({ role: 'admin' }, env.JWT_SECRET)
        return json({ ok: true, data: { token } }, 200, origin)
      }

      // ── Timeline ──────────────────────────────────────────────────────────
      if (path === '/api/timeline') {
        if (method === 'GET') {
          const rows = await env.DB.prepare(
            'SELECT * FROM timeline ORDER BY sort_order ASC'
          ).all()
          return json({ ok: true, data: rows.results }, 200, origin)
        }
        if (method === 'POST') {
          if (!await requireAdmin(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, origin)
          const body = await request.json() as Record<string, unknown>
          const id   = newId()
          await env.DB.prepare(
            `INSERT INTO timeline (id,year,title_en,title_zh,desc_en,desc_zh,sort_order)
             VALUES (?,?,?,?,?,?,?)`
          ).bind(id, body.year, body.title_en, body.title_zh, body.desc_en, body.desc_zh, body.sort_order ?? 0).run()
          return json({ ok: true, data: { id } }, 201, origin)
        }
      }

      const tlMatch = path.match(/^\/api\/timeline\/([^/]+)$/)
      if (tlMatch) {
        const id = tlMatch[1]
        if (!await requireAdmin(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, origin)
        if (method === 'PUT') {
          const body = await request.json() as Record<string, unknown>
          await env.DB.prepare(
            `UPDATE timeline SET year=?,title_en=?,title_zh=?,desc_en=?,desc_zh=?,sort_order=? WHERE id=?`
          ).bind(body.year, body.title_en, body.title_zh, body.desc_en, body.desc_zh, body.sort_order, id).run()
          return json({ ok: true }, 200, origin)
        }
        if (method === 'DELETE') {
          await env.DB.prepare('DELETE FROM timeline WHERE id=?').bind(id).run()
          return json({ ok: true }, 200, origin)
        }
      }

      // ── Cards ─────────────────────────────────────────────────────────────
      const cardsMatch = path.match(/^\/api\/cards\/(notes|music|models|honors)$/)
      if (cardsMatch) {
        const table = cardsMatch[1]
        if (method === 'GET') {
          const rows = await env.DB.prepare(
            `SELECT * FROM ${table} ORDER BY created_at DESC`
          ).all()
          return json({ ok: true, data: rows.results }, 200, origin)
        }
        if (method === 'POST') {
          if (!await requireAdmin(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, origin)
          const body = await request.json() as Record<string, unknown>
          const id   = newId()
          const now  = new Date().toISOString()
          // Build columns dynamically from body keys (whitelist approach)
          const allowed = getAllowedColumns(table)
          const cols    = ['id', 'created_at', 'updated_at', ...Object.keys(body).filter(k => allowed.includes(k))]
          const vals    = ['?', '?', '?', ...cols.slice(3).map(() => '?')]
          await env.DB.prepare(
            `INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals.join(',')})`
          ).bind(id, now, now, ...cols.slice(3).map(c => body[c] ?? null)).run()
          return json({ ok: true, data: { id } }, 201, origin)
        }
      }

      const cardItemMatch = path.match(/^\/api\/cards\/(notes|music|models|honors)\/([^/]+)$/)
      if (cardItemMatch) {
        const [, table, id] = cardItemMatch
        // Public GET single item (used by FileViewer)
        if (method === 'GET') {
          const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first()
          if (!row) return json({ ok: false, error: 'Not found' }, 404, origin)
          return json({ ok: true, data: row }, 200, origin)
        }
        if (!await requireAdmin(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, origin)
        if (method === 'PUT') {
          const body    = await request.json() as Record<string, unknown>
          const allowed = getAllowedColumns(table)
          const sets    = Object.keys(body).filter(k => allowed.includes(k)).map(k => `${k}=?`)
          const vals    = Object.keys(body).filter(k => allowed.includes(k)).map(k => body[k])
          await env.DB.prepare(
            `UPDATE ${table} SET ${sets.join(',')}, updated_at=? WHERE id=?`
          ).bind(...vals, new Date().toISOString(), id).run()
          return json({ ok: true }, 200, origin)
        }
        if (method === 'DELETE') {
          await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run()
          return json({ ok: true }, 200, origin)
        }
      }

      // ── Upload: request a file_key, then PUT file to /api/upload/<key> ───
      if (path === '/api/upload/request' && method === 'POST') {
        if (!await requireAdmin(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, origin)
        const { filename, content_type } = await request.json() as { filename: string; content_type: string }
        const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
        const key  = `uploads/${Date.now()}-${safe}`
        return json({ ok: true, data: { file_key: key, content_type } }, 200, origin)
      }

      // ── Upload proxy (client sends file body here) ────────────────────────
      const uploadMatch = path.match(/^\/api\/upload\/(.+)$/)
      if (uploadMatch && method === 'PUT') {
        if (!await requireAdmin(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401, origin)
        const key = decodeURIComponent(uploadMatch[1])
        const ct  = request.headers.get('Content-Type') ?? 'application/octet-stream'
        await env.BUCKET.put(key, request.body, { httpMetadata: { contentType: ct } })
        return json({ ok: true, data: { file_key: key } }, 200, origin)
      }

      // ── File read (presigned R2 URL, 30 min) ─────────────────────────────
      const fileMatch = path.match(/^\/api\/file\/(.+)$/)
      if (fileMatch && method === 'GET') {
        const key = decodeURIComponent(fileMatch[1])
        const obj = await env.BUCKET.get(key)
        if (!obj) return json({ ok: false, error: 'Not found' }, 404, origin)
        // Stream the file directly (avoids needing presigned URL setup)
        const headers = new Headers({
          'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
          'Cache-Control': 'private, max-age=1800',
          'Access-Control-Allow-Origin': origin,
        })
        return new Response(obj.body, { headers })
      }

      return json({ ok: false, error: 'Not found' }, 404, origin)
    } catch (err) {
      console.error(err)
      return json({ ok: false, error: 'Internal server error' }, 500, origin)
    }
  }
}

// ─── Column whitelist per table ───────────────────────────────────────────────

function getAllowedColumns(table: string): string[] {
  const map: Record<string, string[]> = {
    notes:  ['title_en','title_zh','desc_en','desc_zh','category','tags','file_key','file_type'],
    music:  ['title_en','title_zh','instrument','pages','sheet_key','audio_key'],
    models: ['title_en','title_zh','desc_en','desc_zh','software','preview_key','file_key'],
    honors: ['title_en','title_zh','org_en','org_zh','year','emoji'],
  }
  return map[table] ?? []
}
