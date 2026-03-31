import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Box, Download, X, Loader } from 'lucide-react'
import { useAppStore } from '@/store'
import { modelsApi, honorsApi, fileApi, tl, dl, fmtDate } from '@/lib/api'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { FileUpload } from '@/components/ui/FileUpload'
import type { ModelCard, HonorCard, ViewMode } from '@/types'

// ── Model editor ──────────────────────────────────────────────────────────────
function ModelEditor({ item, onSave, onClose }: { item?: ModelCard; onSave:(d:Record<string,unknown>)=>Promise<void>; onClose:()=>void }) {
  const { lang } = useAppStore()
  const [form, setForm] = useState({ title_en:item?.title_en??'',title_zh:item?.title_zh??'',desc_en:item?.desc_en??'',desc_zh:item?.desc_zh??'',software:item?.software??'',preview_key:item?.preview_key??'',file_key:item?.file_key??'' })
  const [saving, setSaving] = useState(false)
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); await onSave(form as unknown as Record<string,unknown>); setSaving(false); onClose() }
  return (
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-header"><h2>{lang==='zh'?'编辑模型':'Edit Model'}</h2><button className="btn-icon" onClick={onClose}><X size={16}/></button></div>
        <form onSubmit={submit} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>
          {[['title_en','Title (EN)','标题（英）'],['title_zh','Title (ZH)','标题（中）'],['desc_en','Desc (EN)','描述（英）'],['desc_zh','Desc (ZH)','描述（中）'],['software','Software','软件']].map(([k,en,zh])=>(
            <div className="field" key={k}><label>{lang==='zh'?zh:en}</label>
              {k.startsWith('desc')?<textarea value={(form as Record<string,string>)[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/>:<input value={(form as Record<string,string>)[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/>}
            </div>
          ))}
          <div className="field"><label>{lang==='zh'?'预览图':'Preview'}</label><FileUpload accept=".jpg,.png,.webp" currentKey={form.preview_key||null} onUploaded={k=>setForm(v=>({...v,preview_key:k}))}/></div>
          <div className="field"><label>{lang==='zh'?'模型文件':'Model file'}</label><FileUpload accept=".stp,.step,.stl,.obj,.blend,.zip,.3ds,.fbx,.iges,.igs,.f3d,.x_t,.x_b,.dxf,.dwg" currentKey={form.file_key||null} onUploaded={k=>setForm(v=>({...v,file_key:k}))}/></div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving?<Loader size={14} className="spin"/>:null}{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Honor editor ──────────────────────────────────────────────────────────────
function HonorEditor({ item, onSave, onClose }: { item?: HonorCard; onSave:(d:Record<string,unknown>)=>Promise<void>; onClose:()=>void }) {
  const { lang } = useAppStore()
  const [form, setForm] = useState({ title_en:item?.title_en??'',title_zh:item?.title_zh??'',org_en:item?.org_en??'',org_zh:item?.org_zh??'',year:item?.year??new Date().getFullYear(),emoji:item?.emoji??'🏆' })
  const [saving,setSaving]=useState(false)
  async function submit(e: React.FormEvent){e.preventDefault();setSaving(true);await onSave(form as unknown as Record<string,unknown>);setSaving(false);onClose()}
  return(
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-header"><h2>{lang==='zh'?'编辑荣誉':'Edit Honor'}</h2><button className="btn-icon" onClick={onClose}><X size={16}/></button></div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
          {[['title_en','Title (EN)','奖项（英）'],['title_zh','Title (ZH)','奖项（中）'],['org_en','Org (EN)','机构（英）'],['org_zh','Org (ZH)','机构（中）'],['emoji','Emoji','图标']].map(([k,en,zh])=>(
            <div className="field" key={k}><label>{lang==='zh'?zh:en}</label><input value={String((form as Record<string,unknown>)[k])} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/></div>
          ))}
          <div className="field"><label>{lang==='zh'?'年份':'Year'}</label><input type="number" value={form.year} onChange={e=>setForm(v=>({...v,year:+e.target.value}))}/></div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ModelingPage ──────────────────────────────────────────────────────────────
export function ModelingPage() {
  const { lang, isAdmin, token } = useAppStore()
  const [models, setModels]   = useState<ModelCard[]>([])
  const [view, setView]       = useState<ViewMode>('card')
  const [editing, setEditing] = useState<ModelCard|null|'new'>(null)

  async function load() { const r = await modelsApi.list(); if (r.ok && r.data) setModels(r.data) }
  useEffect(() => { load() }, [])
  async function save(data: Record<string,unknown>) { if (editing==='new') await modelsApi.create(token!,data); else if (editing) await modelsApi.update(token!,editing.id,data); await load() }
  async function del(id: string) { if (!confirm(lang==='zh'?'确认删除？':'Delete?')) return; await modelsApi.remove(token!,id); await load() }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="section-label">// 3d & design</span>
        <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem' }}>
          <h1 className="section-title">{lang==='zh'?'建模与设计':'Modeling & Design'}</h1>
          <div style={{ display:'flex',gap:'.5rem',alignItems:'center' }}>
            <ViewToggle mode={view} onChange={setView} />
            {isAdmin && <button className="btn-primary" style={{ padding:'.45rem 1rem',fontSize:'.82rem' }} onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'新增':'Add'}</button>}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'1.5rem 2rem 4rem' }}>
        {view==='card' ? (
          <div className="cards-grid">
            {models.map(m=>(
              <div key={m.id} className="card">
                {m.preview_key?<img src={fileApi.url(m.preview_key)} style={{ width:'100%',aspectRatio:'16/9',objectFit:'cover',borderRadius:'var(--radius-sm)',marginBottom:'1rem' }} alt=""/>:
                  <div style={{ width:'100%',aspectRatio:'16/9',background:'var(--bg3)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem' }}><Box size={32} style={{ color:'var(--text3)' }}/></div>}
                <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'.35rem' }}>
                  <div style={{ fontWeight:700,flex:1 }}>{tl(m,lang)}</div>
                  {isAdmin&&<div style={{ display:'flex',gap:'.3rem',flexShrink:0 }}><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditing(m)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>del(m.id)}><Trash2 size={12}/></button></div>}
                </div>
                <div style={{ fontSize:'.83rem',color:'var(--text2)',lineHeight:1.6,marginBottom:'.75rem' }}>{dl(m,lang)}</div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <span className="tag">{m.software}</span>
                  {m.file_key&&<a href={fileApi.url(m.file_key)} download className="btn-icon" style={{ width:28,height:28,borderRadius:'50%' }}><Download size={13}/></a>}
                </div>
              </div>
            ))}
            {isAdmin&&<button className="add-btn" onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'添加模型':'Add model'}</button>}
          </div>
        ) : (
          <div className="list-view">
            {models.map(m=>(
              <div key={m.id} className="list-item">
                <Box size={16} style={{ color:'var(--orange-b)',flexShrink:0 }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tl(m,lang)}</div>
                  <div style={{ fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{m.software} · {fmtDate(m.updated_at)}</div>
                </div>
                {isAdmin&&<div style={{ display:'flex',gap:'.3rem' }}><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditing(m)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>del(m.id)}><Trash2 size={12}/></button></div>}
                {m.file_key&&<a href={fileApi.url(m.file_key)} download className="btn-icon" style={{ width:26,height:26 }}><Download size={12}/></a>}
              </div>
            ))}
            {isAdmin&&<button className="add-btn" style={{ padding:'.6rem' }} onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'添加模型':'Add model'}</button>}
          </div>
        )}
      </div>
      {editing!==null&&<ModelEditor item={editing==='new'?undefined:editing} onSave={save} onClose={()=>setEditing(null)}/>}
    </div>
  )
}

// ── HonorsPage ────────────────────────────────────────────────────────────────
export function HonorsPage() {
  const { lang, isAdmin, token } = useAppStore()
  const [honors, setHonors]   = useState<HonorCard[]>([])
  const [view, setView]       = useState<ViewMode>('card')
  const [editing, setEditing] = useState<HonorCard|null|'new'>(null)

  async function load() { const r = await honorsApi.list(); if (r.ok && r.data) setHonors(r.data) }
  useEffect(() => { load() }, [])
  async function save(data: Record<string,unknown>) { if (editing==='new') await honorsApi.create(token!,data); else if (editing) await honorsApi.update(token!,editing.id,data); await load() }
  async function del(id: string) { if (!confirm(lang==='zh'?'确认删除？':'Delete?')) return; await honorsApi.remove(token!,id); await load() }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="section-label">// achievements</span>
        <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem' }}>
          <h1 className="section-title">{lang==='zh'?'荣誉与作品':'Honors & Works'}</h1>
          <div style={{ display:'flex',gap:'.5rem',alignItems:'center' }}>
            <ViewToggle mode={view} onChange={setView} />
            {isAdmin&&<button className="btn-primary" style={{ padding:'.45rem 1rem',fontSize:'.82rem' }} onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'新增':'Add'}</button>}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'1.5rem 2rem 4rem' }}>
        {view==='card' ? (
          <div className="honors-grid">
            {honors.map(h=>(
              <div key={h.id} style={{ background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:'var(--radius)',padding:'1.5rem',display:'flex',alignItems:'flex-start',gap:'1rem',backdropFilter:'blur(12px)',transition:'border-color var(--trans),box-shadow var(--trans)' }} onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='var(--border-h)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px var(--glow)'}} onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='var(--card-border)';(e.currentTarget as HTMLDivElement).style.boxShadow='none'}}>
                <div style={{ width:48,height:48,borderRadius:'var(--radius-sm)',background:'var(--grad)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0 }}>{h.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace",fontSize:'.7rem',color:'var(--orange-b)',marginBottom:'.2rem' }}>{h.year}</div>
                  <div style={{ fontWeight:700,marginBottom:'.2rem' }}>{tl(h,lang)}</div>
                  <div style={{ fontSize:'.82rem',color:'var(--text3)' }}>{lang==='zh'?h.org_zh:h.org_en}</div>
                </div>
                {isAdmin&&<div style={{ display:'flex',gap:'.3rem',flexShrink:0 }}><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditing(h)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>del(h.id)}><Trash2 size={12}/></button></div>}
              </div>
            ))}
            {isAdmin&&<button className="add-btn" onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'添加荣誉':'Add honor'}</button>}
          </div>
        ) : (
          <div className="list-view">
            {honors.map(h=>(
              <div key={h.id} className="list-item">
                <span style={{ fontSize:'1.2rem',flexShrink:0 }}>{h.emoji}</span>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tl(h,lang)}</div>
                  <div style={{ fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{lang==='zh'?h.org_zh:h.org_en} · {h.year}</div>
                </div>
                {isAdmin&&<div style={{ display:'flex',gap:'.3rem' }}><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditing(h)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>del(h.id)}><Trash2 size={12}/></button></div>}
              </div>
            ))}
            {isAdmin&&<button className="add-btn" style={{ padding:'.6rem' }} onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'添加荣誉':'Add honor'}</button>}
          </div>
        )}
      </div>
      {editing!==null&&<HonorEditor item={editing==='new'?undefined:editing} onSave={save} onClose={()=>setEditing(null)}/>}
    </div>
  )
}
