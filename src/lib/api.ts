import type { Note, NoteCategory, Song, Score, ModelCard, HonorCard,
  TimelineItem, ResourceLink, Project, Summary, ApiResponse } from '@/types'

export const API_BASE = (import.meta.env.VITE_API_BASE as string) || ''

async function req<T>(path: string, init: RequestInit={}, token?: string|null): Promise<ApiResponse<T>> {
  const headers: Record<string,string> = {
    'Content-Type':'application/json',
    ...(init.headers as Record<string,string>??{}),
  }
  if(token) headers['Authorization']=`Bearer ${token}`
  try {
    const res=await fetch(`${API_BASE}${path}`,{...init,headers})
    return await res.json() as ApiResponse<T>
  } catch(e) { return {ok:false,error:String(e)} }
}

function makeApi<T>(slug: string) {
  return {
    list: (params?: Record<string,string>) => {
      const qs=params?'?'+new URLSearchParams(params).toString():''
      return req<T[]>(`/api/${slug}${qs}`)
    },
    get:    (id: string) => req<T>(`/api/${slug}/${id}`),
    create: (token: string, body: Record<string,unknown>) =>
      req<{id:string}>(`/api/${slug}`,{method:'POST',body:JSON.stringify(body)},token),
    update: (token: string, id: string, body: Record<string,unknown>) =>
      req<void>(`/api/${slug}/${id}`,{method:'PUT',body:JSON.stringify(body)},token),
    remove: (token: string, id: string) =>
      req<void>(`/api/${slug}/${id}`,{method:'DELETE'},token),
  }
}

export const summaryApi  = {get:()=>req<Summary>('/api/summary')}
export const timelineApi = makeApi<TimelineItem>('timeline')
export const noteCatApi  = makeApi<NoteCategory>('note-categories')
export const notesApi    = makeApi<Note>('notes')
export const resourceApi = makeApi<ResourceLink>('resource-links')
export const songsApi    = makeApi<Song>('songs')
export const scoresApi   = makeApi<Score>('scores')
export const modelsApi   = makeApi<ModelCard>('models')
export const honorsApi   = makeApi<HonorCard>('honors')
export const projectsApi = makeApi<Project>('projects')
export const authApi     = {
  login:(password:string)=>req<{token:string}>('/api/auth/login',{method:'POST',body:JSON.stringify({password})})
}

export const fileApi = {
  /** Upload a file to R2 via Worker proxy. Returns file_key or null on failure. */
  upload: async (token: string, file: File): Promise<string|null> => {
    // Step 1: get a safe key from the server
    const meta=await req<{file_key:string}>('/api/upload/request',{
      method:'POST', body:JSON.stringify({filename:file.name})
    },token)
    if(!meta.ok||!meta.data) return null
    const key=meta.data.file_key
    // Step 2: PUT the raw file body, pass key via header (avoids URL encoding issues)
    try {
      const res=await fetch(`${API_BASE}/api/upload`,{
        method:'PUT',
        headers:{
          'Authorization':`Bearer ${token}`,
          'Content-Type': file.type||'application/octet-stream',
          'X-File-Key': key,
        },
        body: file,
      })
      if(!res.ok) return null
      return key
    } catch { return null }
  },
  url: (key: string) => `${API_BASE}/api/file/${encodeURIComponent(key)}`,
}

// i18n helpers
export const tl=(o:{title_en:string;title_zh:string},l:string)=>l==='zh'?o.title_zh:o.title_en
export const dl=(o:{desc_en?:string;desc_zh?:string},l:string)=>l==='zh'?(o.desc_zh??''):(o.desc_en??'')
export const parseTags=(t:string):string[]=>{try{return JSON.parse(t)}catch{return[]}}
export const fmtDate=(iso:string|null)=>iso?new Date(iso).toLocaleDateString('zh-CN',{year:'numeric',month:'short',day:'numeric'}):''
export const fmtDuration=(s:number)=>{const m=Math.floor(s/60);return`${m}:${String(s%60).padStart(2,'0')}`}
