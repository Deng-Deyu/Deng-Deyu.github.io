import type {
  NoteCard, MusicCard, ModelCard, HonorCard,
  TimelineItem, ApiResponse, Lang
} from '@/types'

// ─── 配置 ──────────────────────────────────────────────────────────────────────
// 在 .env.local 中设置: VITE_API_BASE=https://turtlelet-api.your-subdomain.workers.dev
export const API_BASE = import.meta.env.VITE_API_BASE as string || ''

// ─── 通用请求 ──────────────────────────────────────────────────────────────────

async function req<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {})
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res  = await fetch(`${API_BASE}${path}`, { ...options, headers })
    const data = await res.json() as ApiResponse<T>
    return data
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (password: string) =>
    req<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    })
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export const timelineApi = {
  list: () => req<TimelineItem[]>('/api/timeline'),

  create: (token: string, item: Omit<TimelineItem, 'id'>) =>
    req<{ id: string }>('/api/timeline', {
      method: 'POST',
      body: JSON.stringify(item)
    }, token),

  update: (token: string, id: string, item: Partial<TimelineItem>) =>
    req<void>(`/api/timeline/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    }, token),

  delete: (token: string, id: string) =>
    req<void>(`/api/timeline/${id}`, { method: 'DELETE' }, token),
}

// ─── Cards ────────────────────────────────────────────────────────────────────

type TableMap = {
  notes:  NoteCard
  music:  MusicCard
  models: ModelCard
  honors: HonorCard
}

function cardsApi<K extends keyof TableMap>(table: K) {
  type T = TableMap[K]
  return {
    list: () => req<T[]>(`/api/cards/${table}`),

    get: (id: string) => req<T>(`/api/cards/${table}/${id}`),

    create: (token: string, card: Omit<T, 'id' | 'type' | 'created_at' | 'updated_at'>) =>
      req<{ id: string }>(`/api/cards/${table}`, {
        method: 'POST',
        body: JSON.stringify(card)
      }, token),

    update: (token: string, id: string, card: Partial<Omit<T, 'id' | 'type'>>) =>
      req<void>(`/api/cards/${table}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(card)
      }, token),

    delete: (token: string, id: string) =>
      req<void>(`/api/cards/${table}/${id}`, { method: 'DELETE' }, token),
  }
}

export const notesApi  = cardsApi('notes')
export const musicApi  = cardsApi('music')
export const modelsApi = cardsApi('models')
export const honorsApi = cardsApi('honors')

// ─── File upload / read ───────────────────────────────────────────────────────

export const fileApi = {
  /** 上传文件到 R2，返回 file_key */
  upload: async (token: string, file: File): Promise<string | null> => {
    // 1. 请求上传 key
    const meta = await req<{ file_key: string; content_type: string }>(
      '/api/upload/request',
      { method: 'POST', body: JSON.stringify({ filename: file.name, content_type: file.type }) },
      token
    )
    if (!meta.ok || !meta.data) return null

    // 2. 直接 PUT 文件内容到 Worker 代理
    const encodedKey = encodeURIComponent(meta.data.file_key)
    const res = await fetch(`${API_BASE}/api/upload/${encodedKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Authorization': `Bearer ${token}`,
      },
      body: file
    })
    if (!res.ok) return null
    return meta.data.file_key
  },

  /** 获取文件流 URL（通过 Worker 代理） */
  url: (key: string) => `${API_BASE}/api/file/${encodeURIComponent(key)}`,
}

// ─── i18n helpers ─────────────────────────────────────────────────────────────

export function t(obj: { title_en: string; title_zh: string }, lang: Lang) {
  return lang === 'zh' ? obj.title_zh : obj.title_en
}

export function td(obj: { desc_en?: string; desc_zh?: string }, lang: Lang) {
  return lang === 'zh' ? (obj.desc_zh ?? '') : (obj.desc_en ?? '')
}
