import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, ExternalLink, X, Loader } from 'lucide-react'
import { useAppStore } from '@/store'
import { notesApi, noteCatApi, resourceApi, tl, dl, parseTags, fmtDate, titleFromFilename } from '@/lib/api'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { FileUpload } from '@/components/ui/FileUpload'
import type { Note, NoteCategory, ResourceLink, ViewMode } from '@/types'

// ── Category editor modal ─────────────────────────────────────────────────────
function CatEditor({ item, onSave, onClose }: { item?: NoteCategory; onSave: (d: Record<string,unknown>) => Promise<void>; onClose: () => void }) {
  const { lang } = useAppStore()
  const [form, setForm] = useState({ name_en: item?.name_en??'', name_zh: item?.name_zh??'', icon: item?.icon??'📄', sort_order: item?.sort_order??0 })
  const [saving, setSaving] = useState(false)
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); await onSave(form as unknown as Record<string,unknown>); setSaving(false); onClose() }
  const F = (k: keyof typeof form, l: string) => (
    <div className="field"><label>{l}</label><input value={String(form[k])} onChange={e => setForm(v => ({...v,[k]:e.target.value}))} /></div>
  )
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth:400 }}>
        <div className="modal-header"><h2>{lang==='zh'?'编辑分类':'Edit Category'}</h2><button className="btn-icon" onClick={onClose}><X size={16}/></button></div>
        <form onSubmit={submit} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>
          {F('name_en', lang==='zh'?'名称（英文）':'Name (EN)')}
          {F('name_zh', lang==='zh'?'名称（中文）':'Name (ZH)')}
          {F('icon',    lang==='zh'?'图标 Emoji':'Icon Emoji')}
          {F('sort_order', lang==='zh'?'排序（数字小在前）':'Sort order')}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving?<Loader size={14} className="spin"/>:null}{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Note editor modal ─────────────────────────────────────────────────────────
function NoteEditor({ item, cats, onSave, onClose }: { item?: Note; cats: NoteCategory[]; onSave: (d: Record<string,unknown>) => Promise<void>; onClose: () => void }) {
  const { lang } = useAppStore()
  const [form, setForm] = useState({
    title_en: item?.title_en??'', title_zh: item?.title_zh??'', desc_en: item?.desc_en??'', desc_zh: item?.desc_zh??'',
    category_id: item?.category_id??cats[0]?.id??'other', tags: parseTags(item?.tags??'[]').join(', '),
    file_key: item?.file_key??'', file_type: (item?.file_type??'pdf') as 'pdf'|'markdown'|'txt',
  })
  const [saving, setSaving] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await onSave({ ...form, tags: JSON.stringify(form.tags.split(',').map(t=>t.trim()).filter(Boolean)) })
    setSaving(false); onClose()
  }
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header"><h2>{lang==='zh'?'编辑笔记':'Edit Note'}</h2><button className="btn-icon" onClick={onClose}><X size={16}/></button></div>
        <form onSubmit={submit} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>
          {[['title_en','Title (EN)','标题（英）'],['title_zh','Title (ZH)','标题（中）'],['desc_en','Desc (EN)','描述（英）'],['desc_zh','Desc (ZH)','描述（中）'],['tags','Tags (comma)','标签（逗号分隔）']].map(([k,en,zh])=>(
            <div className="field" key={k}><label>{lang==='zh'?zh:en}</label>
              {k.startsWith('desc')?<textarea value={(form as Record<string,string>)[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/>:<input value={(form as Record<string,string>)[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/>}
            </div>
          ))}
          <div className="field"><label>{lang==='zh'?'分类':'Category'}</label>
            <select value={form.category_id} onChange={e=>setForm(v=>({...v,category_id:e.target.value}))}>
              {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {lang==='zh'?c.name_zh:c.name_en}</option>)}
            </select>
          </div>
          <div className="field"><label>{lang==='zh'?'文件格式':'File type'}</label>
            <select value={form.file_type} onChange={e=>setForm(v=>({...v,file_type:e.target.value}))}>
              <option value="pdf">PDF</option><option value="markdown">Markdown (.md)</option><option value="txt">Text (.txt)</option>
            </select>
          </div>
          <div className="field"><label>{lang==='zh'?'上传文件':'Upload file'}</label>
            <FileUpload accept=".pdf,.md,.txt,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.zip" currentKey={form.file_key||null}
              onUploaded={(k,fname)=>{
                setForm(v=>{
                  const auto=titleFromFilename(fname||'')
                  return{...v,file_key:k,
                    title_en:v.title_en||auto,
                    title_zh:v.title_zh||auto,
                    file_type:(fname?.endsWith('.md')?'markdown':fname?.endsWith('.txt')?'txt':'pdf') as typeof v.file_type
                  }
                })
              }}
              hint={lang==='zh'?'上传后自动填充标题':'Title auto-filled from filename'}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving?<Loader size={14} className="spin"/>:null}{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Resource link editor ──────────────────────────────────────────────────────
function LinkEditor({ item, onSave, onClose }: { item?: ResourceLink; onSave: (d: Record<string,unknown>) => Promise<void>; onClose: () => void }) {
  const { lang } = useAppStore()
  const [form, setForm] = useState({ title_en:item?.title_en??'',title_zh:item?.title_zh??'',url:item?.url??'',desc_en:item?.desc_en??'',desc_zh:item?.desc_zh??'',icon:item?.icon??'🔗' })
  const [saving,setSaving]=useState(false)
  async function submit(e: React.FormEvent){e.preventDefault();setSaving(true);await onSave(form as unknown as Record<string,unknown>);setSaving(false);onClose()}
  return(
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-header"><h2>{lang==='zh'?'编辑链接':'Edit Link'}</h2><button className="btn-icon" onClick={onClose}><X size={16}/></button></div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
          {[['title_en','Title (EN)','标题（英）'],['title_zh','Title (ZH)','标题（中）'],['url','URL','链接'],['desc_en','Desc (EN)','描述（英）'],['desc_zh','Desc (ZH)','描述（中）'],['icon','Icon','图标']].map(([k,en,zh])=>(
            <div className="field" key={k}><label>{lang==='zh'?zh:en}</label>
              <input value={(form as Record<string,string>)[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/>
            </div>
          ))}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function NotesPage() {
  const { lang, isAdmin, token } = useAppStore()
  const navigate = useNavigate()
  const [notes, setNotes]       = useState<Note[]>([])
  const [cats, setCats]         = useState<NoteCategory[]>([])
  const [links, setLinks]       = useState<ResourceLink[]>([])
  const [open, setOpen]         = useState<Record<string,boolean>>({})
  const [view, setView]         = useState<ViewMode>('card')
  const [editNote, setEditNote] = useState<Note | null | 'new'>(null)
  const [editCat, setEditCat]   = useState<NoteCategory | null | 'new'>(null)
  const [editLink, setEditLink] = useState<ResourceLink | null | 'new'>(null)

  async function load() {
    const [nr, cr, lr] = await Promise.all([notesApi.list(), noteCatApi.list(), resourceApi.list()])
    if (nr.ok && nr.data) setNotes(nr.data)
    if (cr.ok && cr.data) setCats(cr.data)
    if (lr.ok && lr.data) setLinks(lr.data)
  }
  useEffect(() => { load() }, [])

  async function saveNote(data: Record<string,unknown>) {
    if (editNote === 'new') await notesApi.create(token!, data)
    else if (editNote) await notesApi.update(token!, editNote.id, data)
    await load()
  }
  async function saveCat(data: Record<string,unknown>) {
    if (editCat === 'new') await noteCatApi.create(token!, data)
    else if (editCat) await noteCatApi.update(token!, editCat.id, data)
    await load()
  }
  async function saveLink(data: Record<string,unknown>) {
    if (editLink === 'new') await resourceApi.create(token!, data)
    else if (editLink) await resourceApi.update(token!, editLink.id, data)
    await load()
  }
  async function delNote(id: string) { if (!confirm(lang==='zh'?'确认删除？':'Delete?')) return; await notesApi.remove(token!,id); await load() }
  async function delCat(id: string)  { if (!confirm(lang==='zh'?'确认删除分类？':'Delete category?')) return; await noteCatApi.remove(token!,id); await load() }
  async function delLink(id: string) { if (!confirm(lang==='zh'?'确认删除？':'Delete?')) return; await resourceApi.remove(token!,id); await load() }

  const toggle = (id: string) => setOpen(v => ({...v, [id]: !v[id]}))

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-header">
        <span className="section-label">// knowledge base</span>
        <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem' }}>
          <h1 className="section-title">{lang==='zh'?'笔记与资料':'Notes & Resources'}</h1>
          <div style={{ display:'flex',gap:'.5rem',alignItems:'center' }}>
            <ViewToggle mode={view} onChange={setView} />
            {isAdmin && <button className="btn-primary" style={{ padding:'.45rem 1rem',fontSize:'.82rem' }} onClick={() => setEditNote('new')}><Plus size={14}/>{lang==='zh'?'新增':'Add'}</button>}
            {isAdmin && <button className="btn-ghost"  style={{ padding:'.45rem 1rem',fontSize:'.82rem' }} onClick={() => setEditCat('new')}><Plus size={14}/>{lang==='zh'?'新分类':'New Category'}</button>}
          </div>
        </div>
      </div>

      {/* Notes tree by category */}
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 2rem 2rem' }}>
        {cats.map(cat => {
          const catNotes = notes.filter(n => n.category_id === cat.id)
          if (!isAdmin && catNotes.length === 0) return null
          const isOpen = open[cat.id] !== false // default open
          return (
            <div key={cat.id} className="tree-item">
              <div className="tree-header" onClick={() => toggle(cat.id)}>
                {isOpen ? <ChevronDown size={16} style={{ color:'var(--text3)',flexShrink:0 }}/> : <ChevronRight size={16} style={{ color:'var(--text3)',flexShrink:0 }}/>}
                <span style={{ fontSize:'1.1rem' }}>{cat.icon}</span>
                <span style={{ fontWeight:700 }}>{lang==='zh'?cat.name_zh:cat.name_en}</span>
                <span style={{ fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{catNotes.length}</span>
                {isAdmin && (
                  <div style={{ marginLeft:'auto',display:'flex',gap:'.3rem' }} onClick={e=>e.stopPropagation()}>
                    <button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditCat(cat)}><Pencil size={12}/></button>
                    <button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>delCat(cat.id)}><Trash2 size={12}/></button>
                  </div>
                )}
              </div>
              {isOpen && (
                <div className="tree-body">
                  {view === 'card' ? (
                    <div className="cards-grid" style={{ paddingBottom:'.5rem' }}>
                      {catNotes.map(note => (
                        <NoteCardItem key={note.id} note={note} lang={lang} isAdmin={isAdmin}
                          onEdit={()=>setEditNote(note)} onDelete={()=>delNote(note.id)}
                          onClick={()=>navigate(`/view/${note.id}`)} />
                      ))}
                      {isAdmin && <button className="add-btn" onClick={()=>setEditNote('new')}><Plus size={14}/>{lang==='zh'?'添加笔记':'Add note'}</button>}
                    </div>
                  ) : (
                    <div className="list-view" style={{ paddingBottom:'.5rem' }}>
                      {catNotes.map(note => (
                        <NoteListItem key={note.id} note={note} lang={lang} isAdmin={isAdmin}
                          onEdit={()=>setEditNote(note)} onDelete={()=>delNote(note.id)}
                          onClick={()=>navigate(`/view/${note.id}`)} />
                      ))}
                      {isAdmin && <button className="add-btn" style={{ padding:'.65rem' }} onClick={()=>setEditNote('new')}><Plus size={14}/>{lang==='zh'?'添加笔记':'Add note'}</button>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resource links */}
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'2rem 2rem 4rem',borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem' }}>
          <div>
            <span className="section-label">// resources</span>
            <h2 style={{ fontSize:'1.4rem',fontWeight:800 }}>{lang==='zh'?'推荐资源':'Recommended Resources'}</h2>
          </div>
          {isAdmin && <button className="btn-ghost" style={{ padding:'.4rem .85rem',fontSize:'.82rem' }} onClick={()=>setEditLink('new')}><Plus size={14}/>{lang==='zh'?'添加链接':'Add Link'}</button>}
        </div>
        <div className="cards-grid-2">
          {links.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="card" style={{ display:'block' }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'.75rem',flex:1 }}>
                  <span style={{ fontSize:'1.4rem' }}>{link.icon}</span>
                  <div>
                    <div style={{ fontWeight:700 }}>{tl(link,lang)}</div>
                    <div style={{ fontSize:'.82rem',color:'var(--text2)',marginTop:'.2rem' }}>{dl(link,lang)}</div>
                  </div>
                </div>
                <div style={{ display:'flex',gap:'.3rem',flexShrink:0 }} onClick={e=>e.preventDefault()}>
                  {isAdmin && <><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditLink(link)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>delLink(link.id)}><Trash2 size={12}/></button></>}
                  <ExternalLink size={14} style={{ color:'var(--text3)',marginTop:6 }} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {editNote !== null && <NoteEditor item={editNote==='new'?undefined:editNote} cats={cats} onSave={saveNote} onClose={()=>setEditNote(null)} />}
      {editCat  !== null && <CatEditor  item={editCat==='new'?undefined:editCat}   onSave={saveCat}  onClose={()=>setEditCat(null)}  />}
      {editLink !== null && <LinkEditor item={editLink==='new'?undefined:editLink} onSave={saveLink} onClose={()=>setEditLink(null)} />}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function NoteCardItem({ note, lang, isAdmin, onEdit, onDelete, onClick }: { note:Note;lang:string;isAdmin:boolean;onEdit:()=>void;onDelete:()=>void;onClick:()=>void }) {
  const tags = parseTags(note.tags)
  const desc = dl(note, lang)
  return (
    <div className="card" style={{ cursor:'pointer',padding:0,overflow:'hidden' }} onClick={onClick}>
      {/* Desc overlay header */}
      {desc ? (
        <div style={{position:'relative',background:'linear-gradient(135deg,var(--glow-rgb,rgba(45,179,106,.12),var(--glow-rgb,rgba(45,179,106,.06))',padding:'1rem 1rem .7rem',minHeight:64,display:'flex',flexDirection:'column',justifyContent:'flex-end',borderBottom:'1.5px solid var(--border)'}}>
          <div style={{fontSize:'.78rem',color:'var(--text2)',lineHeight:1.55,fontStyle:'italic',fontFamily:"'Nunito',sans-serif",overflow:'hidden',display:'-webkit-box',...({'WebkitLineClamp':2,'WebkitBoxOrient':'vertical'} as React.CSSProperties)}}>{desc}</div>
        </div>
      ) : null}
      <div style={{padding:'1rem'}}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.6rem' }}>
          <div style={{ fontWeight:900,fontSize:'.93rem',flex:1,paddingRight:'.5rem',fontFamily:"'Nunito',sans-serif" }}>{tl(note,lang)}</div>
          <div style={{ display:'flex',gap:'.25rem',flexShrink:0 }} onClick={e=>e.stopPropagation()}>
            {isAdmin && <><button className="btn-icon" style={{ width:24,height:24,borderRadius:'var(--r-sm)' }} onClick={onEdit}><Pencil size={11}/></button><button className="btn-icon" style={{ width:24,height:24,borderRadius:'var(--r-sm)' }} onClick={onDelete}><Trash2 size={11}/></button></>}
          </div>
        </div>
        <div style={{ display:'flex',gap:'.4rem',flexWrap:'wrap',alignItems:'center' }}>
          {note.file_type && <span className="tag">{note.file_type.toUpperCase()}</span>}
          {tags.slice(0,3).map(t=><span key={t} className="tag tag-gray">{t}</span>)}
          <span style={{ marginLeft:'auto',fontSize:'.7rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{fmtDate(note.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

function NoteListItem({ note, lang, isAdmin, onEdit, onDelete, onClick }: { note:Note;lang:string;isAdmin:boolean;onEdit:()=>void;onDelete:()=>void;onClick:()=>void }) {
  return (
    <div className="list-item" style={{ cursor:'pointer' }} onClick={onClick}>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontWeight:600,fontSize:'.9rem',marginBottom:'.15rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tl(note,lang)}</div>
        <div style={{ fontSize:'.78rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{note.file_type?.toUpperCase()} · {fmtDate(note.updated_at)}</div>
      </div>
      {isAdmin && (
        <div style={{ display:'flex',gap:'.3rem',flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          <button className="btn-icon" style={{ width:26,height:26 }} onClick={onEdit}><Pencil size={12}/></button>
          <button className="btn-icon" style={{ width:26,height:26 }} onClick={onDelete}><Trash2 size={12}/></button>
        </div>
      )}
      <ChevronRight size={16} style={{ color:'var(--text3)',flexShrink:0 }} />
    </div>
  )
}
