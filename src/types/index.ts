// ─── 内容类型 ─────────────────────────────────────────────────────────────────

export type ContentType = 'note' | 'music' | 'video' | 'model' | 'honor'

export type NoteCategory =
  | 'mathematics'
  | 'engineering'
  | 'cs'
  | 'physics'
  | 'chemistry'
  | 'other'

export interface NoteCard {
  id: string
  type: 'note'
  title_en: string
  title_zh: string
  desc_en: string
  desc_zh: string
  category: NoteCategory
  tags: string[]
  /** R2 file key，可能是 .pdf 或 .md */
  file_key: string | null
  file_type: 'pdf' | 'markdown' | null
  created_at: string
  updated_at: string
}

export interface MusicCard {
  id: string
  type: 'music'
  title_en: string
  title_zh: string
  instrument: string
  pages: number
  sheet_key: string | null   // R2 key for PDF sheet
  audio_key: string | null   // R2 key for audio file
  created_at: string
  updated_at: string
}

export interface ModelCard {
  id: string
  type: 'model'
  title_en: string
  title_zh: string
  desc_en: string
  desc_zh: string
  software: string           // SolidWorks / Blender / AutoCAD …
  preview_key: string | null // R2 key for preview image
  file_key: string | null
  created_at: string
  updated_at: string
}

export interface HonorCard {
  id: string
  type: 'honor'
  title_en: string
  title_zh: string
  org_en: string
  org_zh: string
  year: number
  emoji: string
  created_at: string
  updated_at: string
}

export interface TimelineItem {
  id: string
  year: string
  title_en: string
  title_zh: string
  desc_en: string
  desc_zh: string
  sort_order: number
}

export type AnyCard = NoteCard | MusicCard | ModelCard | HonorCard

// ─── API 响应 ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

export interface UploadUrlResponse {
  upload_url: string
  file_key: string
}

export interface PresignedReadResponse {
  url: string
  expires_in: number
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  token: string | null
  isAdmin: boolean
}

// ─── i18n ─────────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'zh'
