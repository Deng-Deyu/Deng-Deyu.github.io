export type Lang = 'en' | 'zh'
export type ViewMode = 'card' | 'list'

export interface NoteCategory { id:string;name_en:string;name_zh:string;icon:string;sort_order:number }
export interface Note {
  id:string;title_en:string;title_zh:string;desc_en:string;desc_zh:string
  category_id:string;tags:string;file_key:string|null
  file_type:'pdf'|'markdown'|'txt'|'docx'|'pptx'|'xlsx'|null
  created_at:string;updated_at:string
}
export interface ResourceLink { id:string;title_en:string;title_zh:string;url:string;desc_en:string;desc_zh:string;icon:string;sort_order:number }
export interface Song {
  id:string;title_en:string;title_zh:string;artist:string;album:string
  audio_key:string|null;cover_key:string|null;duration:number;review:string
  created_at:string;updated_at:string
}
export interface Score {
  id:string;title_en:string;title_zh:string;composer:string
  score_type:'staff'|'tab'|'jianpu'|'mixed'
  file_key:string|null;file_type:'pdf'|'gp'|null;preview_key:string|null
  created_at:string;updated_at:string
}
export interface ModelCard { id:string;title_en:string;title_zh:string;desc_en:string;desc_zh:string;software:string;preview_key:string|null;file_key:string|null;created_at:string;updated_at:string }
export interface HonorCard { id:string;title_en:string;title_zh:string;org_en:string;org_zh:string;year:number;emoji:string;created_at:string;updated_at:string }
export interface TimelineItem { id:string;year:string;title_en:string;title_zh:string;desc_en:string;desc_zh:string;sort_order:number }
export interface Project { id:string;title_en:string;title_zh:string;desc_en:string;desc_zh:string;is_open_source:number;tech_stack:string;version:string;url:string;preview_key:string|null;tab:'mine'|'recommend';created_at:string;updated_at:string }
export interface GuestRequest { id:string;nickname:string;email:string;contact:string;reason:string;status:'pending'|'approved'|'rejected';created_at:string;reviewed_at:string|null }
export interface Summary {
  notes:{count:number;updated_at:string|null}
  songs:{count:number;updated_at:string|null}
  scores:{count:number;updated_at:string|null}
  models:{count:number};honors:{count:number};projects:{count:number}
}
export interface ApiResponse<T=unknown> { ok:boolean;data?:T;error?:string }
