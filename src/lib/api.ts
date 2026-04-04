import type {
  Note, NoteCategory, NoteFile, Song, Score, ModelCard, HonorCard,
  TimelineItem, ResourceLink, Project, GuestRequest, Summary, ApiResponse
} from '@/types'

export const API_BASE = (import.meta.env.VITE_API_BASE as string) || ''

async function req<T>(
  path: string, init: RequestInit = {},
  token?: string | null, guestToken?: string | null
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (guestToken) headers['X-Guest-Token'] = guestToken
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
    return await res.json() as ApiResponse<T>
  } catch (e) { return { ok: false, error: String(e) } }
}

function makeApi<T>(slug: string) {
  return {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req<T[]>(`/api/${slug}${qs}`)
    },
    get:    (id: string) => req<T>(`/api/${slug}/${id}`),
    create: (token: string, body: Record<string, unknown>) =>
      req<{ id: string }>(`/api/${slug}`, { method: 'POST', body: JSON.stringify(body) }, token),
    update: (token: string, id: string, body: Record<string, unknown>) =>
      req<void>(`/api/${slug}/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
    remove: (token: string, id: string) =>
      req<void>(`/api/${slug}/${id}`, { method: 'DELETE' }, token),
  }
}

export const summaryApi  = { get: () => req<Summary>('/api/summary') }
export const timelineApi = makeApi<TimelineItem>('timeline')
export const noteCatApi  = makeApi<NoteCategory>('note-categories')
export const notesApi    = makeApi<Note>('notes')
export const noteFilesApi = makeApi<NoteFile>('note-files')
export const resourceApi = makeApi<ResourceLink>('resource-links')
export const songsApi    = makeApi<Song>('songs')
export const scoresApi   = makeApi<Score>('scores')
export const modelsApi   = makeApi<ModelCard>('models')
export const honorsApi   = makeApi<HonorCard>('honors')
export const projectsApi = makeApi<Project>('projects')
export const authApi     = {
  login: (pw: string) =>
    req<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password: pw }) })
}
export const guestApi = {
  apply: (body: { nickname: string; email: string; contact: string; reason: string }) =>
    req<{ id: string }>('/api/guest/apply', { method: 'POST', body: JSON.stringify(body) }),
  check: (id: string) => req<{ status: string; nickname: string }>(`/api/guest/check?id=${id}`),
  list:  (token: string, status = 'pending') =>
    req<GuestRequest[]>(`/api/guests?status=${status}`, {}, token),
  approve: (token: string, id: string) =>
    req<void>(`/api/guests/${id}/approve`, { method: 'PATCH' }, token),
  reject:  (token: string, id: string) =>
    req<void>(`/api/guests/${id}/reject`, { method: 'PATCH' }, token),
}

export const fileApi = {
  upload: async (token: string, file: File): Promise<string | null> => {
    const meta = await req<{ file_key: string }>(
      '/api/upload/request', { method: 'POST', body: JSON.stringify({ filename: file.name }) }, token
    )
    if (!meta.ok || !meta.data) return null
    const key = meta.data.file_key
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Key': key,
        },
        body: file,
      })
      return res.ok ? key : null
    } catch { return null }
  },
  updateText: async (token: string, file_key: string, content: string): Promise<boolean> => {
    const r = await req<void>('/api/file-update', {
      method: 'PUT', body: JSON.stringify({ file_key, content })
    }, token)
    return r.ok
  },
  url: (key: string) => `${API_BASE}/api/file/${encodeURIComponent(key)}`,
}

// Tree builder for note categories
export function buildCategoryTree(cats: NoteCategory[]): NoteCategory[] {
  const map = new Map<string, NoteCategory>()
  cats.forEach(c => map.set(c.id, { ...c, children: [] }))
  const roots: NoteCategory[] = []
  cats.forEach(c => {
    const node = map.get(c.id)!
    if (!c.parent_id) {
      roots.push(node)
    } else {
      const parent = map.get(c.parent_id)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(node)
      } else {
        roots.push(node) // orphan → treat as root
      }
    }
  })
  const sort = (arr: NoteCategory[]) =>
    arr.sort((a, b) => a.sort_order - b.sort_order).map(n => ({ ...n, children: sort(n.children ?? []) }))
  return sort(roots)
}

// Helpers
export const tl  = (o: { title_en: string; title_zh: string }, l: string) => l === 'zh' ? o.title_zh : o.title_en
export const dl  = (o: { desc_en?: string; desc_zh?: string }, l: string) => l === 'zh' ? (o.desc_zh ?? '') : (o.desc_en ?? '')
export const parseTags   = (t: string): string[] => { try { return JSON.parse(t) } catch { return [] } }
export const fmtDate     = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
export const fmtDuration = (s: number) => { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}` }
export const titleFromFilename = (fn: string) => fn.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
export const fileTypeFromName  = (fn: string): NoteFile['file_type'] => {
  const ext = fn.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf')  return 'pdf'
  if (ext === 'md')   return 'markdown'
  if (ext === 'txt')  return 'txt'
  if (ext === 'docx') return 'docx'
  if (ext === 'pptx') return 'pptx'
  if (ext === 'xlsx') return 'xlsx'
  if (['jpg','jpeg','png','webp','gif','svg'].includes(ext)) return 'image'
  return 'other'
}
