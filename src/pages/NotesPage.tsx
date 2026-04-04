import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, ExternalLink, X, Loader, File, Upload } from 'lucide-react'
import { useAppStore } from '@/store'
import { notesApi, noteCatApi, noteFilesApi, resourceApi, fileApi, buildCategoryTree, tl, dl, parseTags, fmtDate, titleFromFilename, fileTypeFromName } from '@/lib/api'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { Tooltip }    from '@/components/ui/Tooltip'
import { AnimBg }     from '@/components/ui/AnimBg'
import type { Note, NoteCategory, NoteFile, ResourceLink, ViewMode } from '@/types'

function fileIcon(ft: NoteFile['file_type']): string {
  const m: Record<NoteFile['file_type'],string>={pdf:'📄',markdown:'📝',txt:'📃',docx:'📘',pptx:'📊',xlsx:'📗',image:'🖼',other:'📎'}
  return m[ft]??'📎'
}

function CatEditor({item,allCats,onSave,onClose}:{item?:NoteCategory;allCats:NoteCategory[];onSave:(d:Record<string,unknown>)=>Promise<void>;onClose:()=>void}) {
  const {lang}=useAppStore()
  const [form,setForm]=useState({parent_id:item?.parent_id??'',name_en:item?.name_en??'',name_zh:item?.name_zh??'',icon:item?.icon??'📄',sort_order:item?.sort_order??0})
  const [saving,setSaving]=useState(false)
  const roots=allCats.filter(c=>!c.parent_id)
  async function submit(e:React.FormEvent){e.preventDefault();setSaving(true);await onSave({...form,parent_id:form.parent_id||null,sort_order:Number(form.sort_order)});setSaving(false);onClose()}
  return(
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-header"><h2>{lang==='zh'?'编辑分类':'Edit Category'}</h2><button className="btn-icon" onClick={onClose}><X size={15}/></button></div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'.8rem'}}>
          <div className="field"><label>{lang==='zh'?'父分类（空=根分类）':'Parent (empty=root)'}</label>
            <select value={form.parent_id} onChange={e=>setForm(v=>({...v,parent_id:e.target.value}))}>
              <option value="">{lang==='zh'?'（根分类）':'(Root)'}</option>
              {roots.map(c=><option key={c.id} value={c.id}>{c.icon} {lang==='zh'?c.name_zh:c.name_en}</option>)}
            </select>
          </div>
          {(['name_en','name_zh','icon','sort_order'] as const).map(k=>(
            <div className="field" key={k}><label>{k}</label>
              <input type={k==='sort_order'?'number':'text'} value={String(form[k])} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/>
            </div>
          ))}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving&&<Loader size={13} className="spin"/>}{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NoteEditor({item,existingFiles,cats,defaultCatId,onSave,onClose}:{item?:Note;existingFiles:NoteFile[];cats:NoteCategory[];defaultCatId:string;onSave:(d:Record<string,unknown>,files:{key:string;name:string}[])=>Promise<void>;onClose:()=>void}) {
  const {lang,token}=useAppStore()
  const [form,setForm]=useState({title_en:item?.title_en??'',title_zh:item?.title_zh??'',desc_en:item?.desc_en??'',desc_zh:item?.desc_zh??'',category_id:item?.category_id??defaultCatId,tags:parseTags(item?.tags??'[]').join(', ')})
  const [pending,setPending]=useState<{key:string;name:string}[]>([])
  const [uploading,setUploading]=useState(false)
  const [saving,setSaving]=useState(false)
  const [err,setErr]=useState('')

  function flatCats(nodes:NoteCategory[],d=0):NoteCategory[]{return nodes.flatMap(n=>[{...n,name_zh:'　'.repeat(d)+n.icon+' '+n.name_zh,name_en:'  '.repeat(d)+n.icon+' '+n.name_en},...flatCats(n.children??[],d+1)])}
  const flat=flatCats(buildCategoryTree(cats))

  async function handleFiles(e:React.ChangeEvent<HTMLInputElement>){
    const files=Array.from(e.target.files??[])
    if(!files.length||!token) return
    setUploading(true);setErr('')
    const res:{key:string;name:string}[]=[]
    for(const file of files){
      const key=await fileApi.upload(token,file)
      if(key){res.push({key,name:file.name});if(!form.title_en&&!form.title_zh){const a=titleFromFilename(file.name);setForm(v=>({...v,title_en:a,title_zh:a}))}}
      else setErr(lang==='zh'?`上传失败: ${file.name}`:`Failed: ${file.name}`)
    }
    setPending(p=>[...p,...res]);setUploading(false)
  }
  async function submit(e:React.FormEvent){
    e.preventDefault();setSaving(true)
    await onSave({...form,tags:JSON.stringify(form.tags.split(',').map(t=>t.trim()).filter(Boolean))},pending)
    setSaving(false);onClose()
  }
  return(
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-header"><h2>{lang==='zh'?'编辑笔记':'Edit Note'}</h2><button className="btn-icon" onClick={onClose}><X size={15}/></button></div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'.8rem'}}>
          {(['title_en','title_zh','desc_en','desc_zh','tags'] as const).map(k=>(
            <div className="field" key={k}><label>{k}</label>
              {k.startsWith('desc')?<textarea value={form[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/>:<input value={form[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/>}
            </div>
          ))}
          <div className="field"><label>{lang==='zh'?'分类':'Category'}</label>
            <select value={form.category_id} onChange={e=>setForm(v=>({...v,category_id:e.target.value}))}>
              {flat.map(c=><option key={c.id} value={c.id}>{lang==='zh'?c.name_zh:c.name_en}</option>)}
            </select>
          </div>
          {existingFiles.length>0&&(
            <div><p style={{fontSize:'.77rem',fontWeight:700,color:'var(--text2)',marginBottom:'.4rem'}}>{lang==='zh'?'已有文件':'Existing files'}</p>
              {existingFiles.map(f=>(
                <div key={f.id} style={{display:'flex',alignItems:'center',gap:'.5rem',fontSize:'.8rem',color:'var(--text2)',background:'var(--bg3)',borderRadius:'var(--r-sm)',padding:'.35rem .7rem',marginBottom:'.25rem'}}>
                  <span>{fileIcon(f.file_type)}</span><span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.filename}</span>
                </div>
              ))}
            </div>
          )}
          {pending.length>0&&(
            <div><p style={{fontSize:'.77rem',fontWeight:700,color:'var(--text2)',marginBottom:'.4rem'}}>{lang==='zh'?`待添加 ${pending.length} 个`:`${pending.length} to add`}</p>
              {pending.map((f,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'.5rem',fontSize:'.8rem',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',borderRadius:'var(--r-sm)',padding:'.35rem .7rem',marginBottom:'.25rem'}}>
                  <span>✓</span><span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                  <button type="button" onClick={()=>setPending(p=>p.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer'}}>✕</button>
                </div>
              ))}
            </div>
          )}
          <label style={{display:'flex',alignItems:'center',gap:'.55rem',padding:'.6rem .85rem',background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',cursor:'pointer',fontSize:'.85rem',color:'var(--text2)'}}>
            {uploading?<Loader size={14} className="spin"/>:<Upload size={14}/>}
            {uploading?(lang==='zh'?'上传中…':'Uploading…'):(lang==='zh'?'添加文件（可多选）':'Add files')}
            <input type="file" multiple style={{display:'none'}} accept=".pdf,.md,.txt,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.webp,.zip" onChange={handleFiles}/>
          </label>
          {err&&<p style={{fontSize:'.75rem',color:'var(--accent)'}}>{err}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving||uploading}>{saving&&<Loader size={13} className="spin"/>}{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NoteCardItem({note,files,lang,isAdmin,onEdit,onDelete,onClick}:{note:Note;files:NoteFile[];lang:string;isAdmin:boolean;onEdit:()=>void;onDelete:()=>void;onClick:()=>void}) {
  const desc=dl(note,lang), tags=parseTags(note.tags)
  return(
    <div className="card" style={{cursor:'pointer',padding:0,overflow:'hidden'}} onClick={onClick}>
      {desc&&(
        <Tooltip content={desc}>
          <div style={{background:'var(--grad-soft)',padding:'.6rem 1rem .45rem',borderBottom:'1px solid var(--border)',fontSize:'.73rem',color:'var(--text3)',fontStyle:'italic',fontFamily:"'ZCOOL XiaoWei','Noto Serif SC',serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'default'}} onClick={e=>e.stopPropagation()}>
            {desc}
          </div>
        </Tooltip>
      )}
      <div style={{padding:'1rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.55rem'}}>
          <div style={{fontWeight:900,fontSize:'.92rem',flex:1,paddingRight:'.5rem',fontFamily:"'ZCOOL XiaoWei','Noto Serif SC',serif"}}>{tl(note,lang)}</div>
          <div style={{display:'flex',gap:'.25rem',flexShrink:0}} onClick={e=>e.stopPropagation()}>
            {isAdmin&&<><button className="btn-icon" style={{width:24,height:24}} onClick={onEdit}><Pencil size={11}/></button><button className="btn-icon" style={{width:24,height:24}} onClick={onDelete}><Trash2 size={11}/></button></>}
          </div>
        </div>
        {files.length>0&&(
          <div style={{display:'flex',gap:'.3rem',flexWrap:'wrap',marginBottom:'.55rem'}}>
            {files.slice(0,4).map(f=><span key={f.id} className="tag" title={f.filename}>{fileIcon(f.file_type)} {f.file_type.toUpperCase()}</span>)}
            {files.length>4&&<span className="tag tag-gray">+{files.length-4}</span>}
          </div>
        )}
        <div style={{display:'flex',gap:'.35rem',flexWrap:'wrap',alignItems:'center'}}>
          {tags.slice(0,2).map(t=><span key={t} className="tag tag-gray">{t}</span>)}
          <span style={{marginLeft:'auto',fontSize:'.68rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace"}}>{fmtDate(note.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

function NoteListItem({note,files,lang,isAdmin,onEdit,onDelete,onClick}:{note:Note;files:NoteFile[];lang:string;isAdmin:boolean;onEdit:()=>void;onDelete:()=>void;onClick:()=>void}) {
  return(
    <div className="list-item" style={{cursor:'pointer'}} onClick={onClick}>
      <File size={15} style={{color:'var(--accent)',flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'ZCOOL XiaoWei','Noto Serif SC',serif"}}>{tl(note,lang)}</div>
        <div style={{fontSize:'.72rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace"}}>
          {files.length>0?`${files.length} ${lang==='zh'?'个文件':'file(s)'} · `:''}{fmtDate(note.updated_at)}
        </div>
      </div>
      {isAdmin&&<div style={{display:'flex',gap:'.28rem'}} onClick={e=>e.stopPropagation()}><button className="btn-icon" style={{width:24,height:24}} onClick={onEdit}><Pencil size={11}/></button><button className="btn-icon" style={{width:24,height:24}} onClick={onDelete}><Trash2 size={11}/></button></div>}
      <ChevronRight size={14} style={{color:'var(--text3)',flexShrink:0}}/>
    </div>
  )
}

function CategoryTree({node,notes,noteFiles,allCats,view,lang,isAdmin,onEditNote,onDeleteNote,onEditCat,onDeleteCat,onAddNote,navigate,depth}:{node:NoteCategory;notes:Note[];noteFiles:Map<string,NoteFile[]>;allCats:NoteCategory[];view:ViewMode;lang:string;isAdmin:boolean;onEditNote:(n:Note)=>void;onDeleteNote:(id:string)=>void;onEditCat:(c:NoteCategory)=>void;onDeleteCat:(id:string)=>void;onAddNote:(catId:string)=>void;navigate:(p:string)=>void;depth:number}) {
  const [open,setOpen]=useState(true)
  const catNotes=notes.filter(n=>n.category_id===node.id)
  const hasContent=catNotes.length>0||(node.children?.length??0)>0||isAdmin
  if(!hasContent) return null
  return(
    <div className="tree-item" style={{marginLeft:depth*14}}>
      <div className="tree-header" onClick={()=>setOpen(v=>!v)}>
        {open?<ChevronDown size={14} style={{color:'var(--text3)',flexShrink:0}}/>:<ChevronRight size={14} style={{color:'var(--text3)',flexShrink:0}}/>}
        <span style={{fontSize:'1rem'}}>{node.icon}</span>
        <span style={{fontWeight:700,fontSize:'.9rem',fontFamily:"'ZCOOL XiaoWei','Noto Serif SC',serif"}}>{lang==='zh'?node.name_zh:node.name_en}</span>
        <span style={{fontSize:'.72rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace"}}>{catNotes.length}</span>
        {isAdmin&&<div style={{marginLeft:'auto',display:'flex',gap:'.28rem'}} onClick={e=>e.stopPropagation()}>
          <button className="btn-icon" style={{width:24,height:24}} onClick={()=>onEditCat(node)}><Pencil size={11}/></button>
          <button className="btn-icon" style={{width:24,height:24}} onClick={()=>onDeleteCat(node.id)}><Trash2 size={11}/></button>
        </div>}
      </div>
      {open&&<div className="tree-body">
        {(node.children??[]).map(child=><CategoryTree key={child.id} node={child} notes={notes} noteFiles={noteFiles} allCats={allCats} view={view} lang={lang} isAdmin={isAdmin} onEditNote={onEditNote} onDeleteNote={onDeleteNote} onEditCat={onEditCat} onDeleteCat={onDeleteCat} onAddNote={onAddNote} navigate={navigate} depth={depth+1}/>)}
        {view==='card'?(
          <div className="cards-grid" style={{paddingBottom:'.5rem',marginTop:(node.children?.length??0)>0?'.75rem':0}}>
            {catNotes.map(note=><NoteCardItem key={note.id} note={note} files={noteFiles.get(note.id)??[]} lang={lang} isAdmin={isAdmin} onEdit={()=>onEditNote(note)} onDelete={()=>onDeleteNote(note.id)} onClick={()=>navigate(`/view/${note.id}`)}/>)}
            {isAdmin&&<button className="add-btn" onClick={()=>onAddNote(node.id)}><Plus size={13}/>{lang==='zh'?'添加笔记':'Add note'}</button>}
          </div>
        ):(
          <div className="list-view" style={{paddingBottom:'.5rem'}}>
            {catNotes.map(note=><NoteListItem key={note.id} note={note} files={noteFiles.get(note.id)??[]} lang={lang} isAdmin={isAdmin} onEdit={()=>onEditNote(note)} onDelete={()=>onDeleteNote(note.id)} onClick={()=>navigate(`/view/${note.id}`)}/>)}
            {isAdmin&&<button className="add-btn" style={{padding:'.6rem'}} onClick={()=>onAddNote(node.id)}><Plus size={13}/>{lang==='zh'?'添加笔记':'Add note'}</button>}
          </div>
        )}
      </div>}
    </div>
  )
}

function LinkEditorSimple({item,onSave,onClose}:{item?:ResourceLink;onSave:(d:Record<string,unknown>)=>Promise<void>;onClose:()=>void}) {
  const {lang}=useAppStore()
  const [form,setForm]=useState({title_en:item?.title_en??'',title_zh:item?.title_zh??'',url:item?.url??'',desc_en:item?.desc_en??'',desc_zh:item?.desc_zh??'',icon:item?.icon??'🔗'})
  const [saving,setSaving]=useState(false)
  async function submit(e:React.FormEvent){e.preventDefault();setSaving(true);await onSave(form as unknown as Record<string,unknown>);setSaving(false);onClose()}
  return(
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-header"><h2>{lang==='zh'?'编辑链接':'Edit Link'}</h2><button className="btn-icon" onClick={onClose}><X size={15}/></button></div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'.8rem'}}>
          {(['title_en','title_zh','url','desc_en','desc_zh','icon'] as const).map(k=>(
            <div className="field" key={k}><label>{k}</label><input value={form[k]} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/></div>
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

export function NotesPage() {
  const {lang,isAdmin,token}=useAppStore()
  const navigate=useNavigate()
  const [notes,setNotes]=useState<Note[]>([])
  const [cats,setCats]=useState<NoteCategory[]>([])
  const [noteFiles,setNoteFiles]=useState<Map<string,NoteFile[]>>(new Map())
  const [links,setLinks]=useState<ResourceLink[]>([])
  const [view,setView]=useState<ViewMode>('card')
  const [editNote,setEditNote]=useState<Note|null|'new'>(null)
  const [newNoteCat,setNewNoteCat]=useState('other')
  const [editCat,setEditCat]=useState<NoteCategory|null|'new'>(null)
  const [editLink,setEditLink]=useState<ResourceLink|null|'new'>(null)

  const load=useCallback(async()=>{
    const [nr,cr,lr]=await Promise.all([notesApi.list(),noteCatApi.list(),resourceApi.list()])
    const noteList=(nr.ok&&nr.data)?nr.data:[]
    if(nr.ok&&nr.data) setNotes(nr.data)
    if(cr.ok&&cr.data) setCats(cr.data)
    if(lr.ok&&lr.data) setLinks(lr.data)
    if(noteList.length>0){
      const af=await noteFilesApi.list()
      const m=new Map<string,NoteFile[]>()
      if(af.ok&&af.data) af.data.forEach((f:NoteFile)=>{const a=m.get(f.note_id)??[];a.push(f);m.set(f.note_id,a)})
      setNoteFiles(m)
    }
  },[])
  useEffect(()=>{load()},[load])

  const tree=buildCategoryTree(cats)

  async function saveNote(data:Record<string,unknown>,newFiles:{key:string;name:string}[]){
    let noteId:string
    if(editNote==='new'||editNote===null){
      const r=await notesApi.create(token!,{...data,category_id:newNoteCat})
      if(!r.ok||!r.data) return
      noteId=r.data.id
    } else {
      await notesApi.update(token!,editNote.id,data)
      noteId=editNote.id
    }
    for(let i=0;i<newFiles.length;i++){
      const {key,name}=newFiles[i]
      await noteFilesApi.create(token!,{note_id:noteId,file_key:key,file_type:fileTypeFromName(name),filename:name,sort_order:i})
    }
    await load()
  }
  async function saveCat(data:Record<string,unknown>){
    if(editCat==='new') await noteCatApi.create(token!,data)
    else if(editCat) await noteCatApi.update(token!,editCat.id,data)
    await load()
  }
  async function saveLink(data:Record<string,unknown>){
    if(editLink==='new') await resourceApi.create(token!,data)
    else if(editLink) await resourceApi.update(token!,editLink.id,data)
    await load()
  }
  async function delNote(id:string){if(!confirm(lang==='zh'?'确认删除？':'Delete?'))return;await notesApi.remove(token!,id);await load()}
  async function delCat(id:string){if(!confirm(lang==='zh'?'确认删除分类？':'Delete category?'))return;await noteCatApi.remove(token!,id);await load()}
  async function delLink(id:string){if(!confirm(lang==='zh'?'确认删除？':'Delete?'))return;await resourceApi.remove(token!,id);await load()}

  const existingFiles=editNote&&editNote!=='new'?(noteFiles.get((editNote as Note).id)??[]):[]

  return(
    <div className="page-wrap" style={{position:'relative'}}>
      <AnimBg theme="notes"/>
      <div className="anim-bg-content">
        <div className="page-header">
          <span className="section-label">knowledge base</span>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <h1 className="section-title">{lang==='zh'?'笔记与资料':'Notes & Resources'}</h1>
            <div style={{display:'flex',gap:'.45rem',alignItems:'center'}}>
              <ViewToggle mode={view} onChange={setView}/>
              {isAdmin&&<>
                <button className="btn-primary" style={{padding:'.42rem .95rem',fontSize:'.8rem'}} onClick={()=>{setNewNoteCat('other');setEditNote('new')}}><Plus size={13}/>{lang==='zh'?'新笔记':'New Note'}</button>
                <button className="btn-ghost" style={{padding:'.42rem .95rem',fontSize:'.8rem'}} onClick={()=>setEditCat('new')}><Plus size={13}/>{lang==='zh'?'新分类':'New Category'}</button>
              </>}
            </div>
          </div>
        </div>
        <div style={{maxWidth:1160,margin:'0 auto',padding:'0 2rem 2rem'}}>
          {tree.map(node=><CategoryTree key={node.id} node={node} notes={notes} noteFiles={noteFiles} allCats={cats} view={view} lang={lang} isAdmin={isAdmin} onEditNote={n=>setEditNote(n)} onDeleteNote={delNote} onEditCat={c=>setEditCat(c)} onDeleteCat={delCat} onAddNote={catId=>{setNewNoteCat(catId);setEditNote('new')}} navigate={navigate} depth={0}/>)}
        </div>
        <div style={{maxWidth:1160,margin:'0 auto',padding:'2rem 2rem 4rem',borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
            <div><span className="section-label">resources</span><h2 style={{fontSize:'1.35rem',fontWeight:900}}>{lang==='zh'?'推荐资源':'Recommended Resources'}</h2></div>
            {isAdmin&&<button className="btn-ghost" style={{padding:'.38rem .85rem',fontSize:'.8rem'}} onClick={()=>setEditLink('new')}><Plus size={13}/>{lang==='zh'?'添加链接':'Add Link'}</button>}
          </div>
          <div className="cards-grid-2">
            {links.map(link=>(
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="card" style={{display:'block'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.7rem',flex:1}}>
                    <span style={{fontSize:'1.3rem'}}>{link.icon}</span>
                    <div><div style={{fontWeight:700,fontFamily:"'ZCOOL XiaoWei','Noto Serif SC',serif"}}>{tl(link,lang)}</div><div style={{fontSize:'.82rem',color:'var(--text2)',marginTop:'.18rem'}}>{dl(link,lang)}</div></div>
                  </div>
                  <div style={{display:'flex',gap:'.28rem',flexShrink:0}} onClick={e=>e.preventDefault()}>
                    {isAdmin&&<><button className="btn-icon" style={{width:24,height:24}} onClick={()=>setEditLink(link)}><Pencil size={11}/></button><button className="btn-icon" style={{width:24,height:24}} onClick={()=>delLink(link.id)}><Trash2 size={11}/></button></>}
                    <ExternalLink size={13} style={{color:'var(--text3)',marginTop:6}}/>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
      {editNote!==null&&<NoteEditor item={editNote==='new'?undefined:editNote} existingFiles={existingFiles} cats={cats} defaultCatId={newNoteCat} onSave={saveNote} onClose={()=>setEditNote(null)}/>}
      {editCat!==null&&<CatEditor item={editCat==='new'?undefined:editCat} allCats={cats} onSave={saveCat} onClose={()=>setEditCat(null)}/>}
      {editLink!==null&&<LinkEditorSimple item={editLink==='new'?undefined:editLink} onSave={saveLink} onClose={()=>setEditLink(null)}/>}
    </div>
  )
}
