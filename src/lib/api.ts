import type { Note, NoteCategory, Song, Score, ModelCard, HonorCard, TimelineItem, ResourceLink, Summary, ApiResponse, SoftwareProject } from '@/types'

export const API_BASE = (import.meta.env.VITE_API_BASE as string) || ''

async function req<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> ?? {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res  = await fetch(`${API_BASE}${path}`, { ...options, headers })
    return await res.json() as ApiResponse<T>
  } catch (e) { return { ok: false, error: String(e) } }
}

function makeApi<T>(slug: string) {
  return {
    list:   (params?: Record<string, string>) => {
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

export const summaryApi      = { get: () => req<Summary>('/api/summary') }
export const timelineApi     = makeApi<TimelineItem>('timeline')
export const noteCatApi      = makeApi<NoteCategory>('note-categories')
export const notesApi        = makeApi<Note>('notes')
export const resourceApi     = makeApi<ResourceLink>('resource-links')
export const songsApi        = makeApi<Song>('songs')
export const scoresApi       = makeApi<Score>('scores')
export const modelsApi       = makeApi<ModelCard>('models')
export const honorsApi       = makeApi<HonorCard>('honors')
export const softwareApi     = makeApi<SoftwareProject>('software')

export const authApi = {
  login: (password: string) =>
    req<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) })
}

export const fileApi = {
  upload: async (token: string, file: File): Promise<string | null> => {
    const meta = await req<{ file_key: string }>('/api/upload/request', {
      method: 'POST', body: JSON.stringify({ filename: file.name })
    }, token)
    if (!meta.ok || !meta.data) return null
    const res = await fetch(`${API_BASE}/api/upload/${encodeURIComponent(meta.data.file_key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': file.type, 'Authorization': `Bearer ${token}` },
      body: file
    })
    return res.ok ? meta.data.file_key : null
  },
  url: (key: string) => `${API_BASE}/api/file/${encodeURIComponent(key)}`,
}

export function tl(obj: { title_en: string; title_zh: string }, lang: string) { return lang === 'zh' ? obj.title_zh : obj.title_en }
export function dl(obj: { desc_en?: string; desc_zh?: string }, lang: string) { return lang === 'zh' ? (obj.desc_zh ?? '') : (obj.desc_en ?? '') }
export function parseTags(tags: string): string[] { try { return JSON.parse(tags) } catch { return [] } }
export function fmtDate(iso: string | null) { if (!iso) return ''; return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) }
export function fmtDuration(secs: number) { const m = Math.floor(secs / 60), s = secs % 60; return `${m}:${String(s).padStart(2, '0')}` }