import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader, Save, Edit3, Eye, File } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '@/store'
import { notesApi, noteFilesApi, fileApi, tl, dl, fmtDate } from '@/lib/api'
import type { Note, NoteFile } from '@/types'

const INLINE_TYPES: NoteFile['file_type'][] = ['pdf', 'markdown', 'txt']

function fileIcon(ft: NoteFile['file_type']): string {
  const m: Record<NoteFile['file_type'],string>={pdf:'📄',markdown:'📝',txt:'📃',docx:'📘',pptx:'📊',xlsx:'📗',image:'🖼',other:'📎'}
  return m[ft]??'📎'
}

export function FileViewer() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lang, isAdmin, token } = useAppStore()

  const [note, setNote]         = useState<Note | null>(null)
  const [files, setFiles]       = useState<NoteFile[]>([])
  const [activeFile, setActive] = useState<NoteFile | null>(null)
  const [content, setContent]   = useState('')
  const [editing, setEditing]   = useState(false)
  const [editBuf, setEditBuf]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      const res = await notesApi.get(id)
      if (!res.ok || !res.data) { setError(lang==='zh'?'笔记不存在':'Not found'); setLoading(false); return }
      setNote(res.data)
      const fr = await noteFilesApi.list({ note_id: id })
      const noteFiles = (fr.ok && fr.data) ? fr.data as NoteFile[] : []
      setFiles(noteFiles)
      if (noteFiles.length > 0) setActive(noteFiles[0])
      setLoading(false)
    }
    load()
  }, [id, lang])

  useEffect(() => {
    async function loadContent() {
      if (!activeFile || !INLINE_TYPES.includes(activeFile.file_type)) {
        setContent(''); return
      }
      const r = await fetch(fileApi.url(activeFile.file_key))
      if (r.ok) { const t = await r.text(); setContent(t); setEditBuf(t) }
    }
    loadContent()
  }, [activeFile])

  async function handleSave() {
    if (!activeFile || !token) return
    setSaving(true)
    await fileApi.updateText(token, activeFile.file_key, editBuf)
    setContent(editBuf); setEditing(false)
    setSaving(false)
  }

  const title = note ? tl(note, lang) : ''
  const desc  = note ? dl(note, lang) : ''
  const canEdit = isAdmin && activeFile && (activeFile.file_type === 'txt' || activeFile.file_type === 'markdown')

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <Loader size={26} className="spin" style={{color:'var(--accent)'}}/>
    </div>
  )
  if (error) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:'1rem'}}>
      <p style={{color:'var(--text2)'}}>{error}</p>
      <button className="btn-ghost" onClick={()=>navigate(-1)}><ArrowLeft size={15}/>{lang==='zh'?'返回':'Back'}</button>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',paddingTop:80}}>
      {/* Top bar */}
      <div style={{position:'sticky',top:64,zIndex:50,background:'var(--nav-bg)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',padding:'.7rem 2rem',display:'flex',alignItems:'center',gap:'.9rem'}}>
        <button className="btn-icon" onClick={()=>navigate(-1)}><ArrowLeft size={15}/></button>
        <div style={{flex:1,minWidth:0}}>
          <h1 style={{fontSize:.97+'rem',fontWeight:900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'ZCOOL XiaoWei','Noto Serif SC',serif"}}>{title}</h1>
          {note?.created_at&&<div style={{fontSize:'.68rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace",marginTop:'.1rem'}}>{lang==='zh'?'创建于':'Created'} {fmtDate(note.created_at)}</div>}
        </div>
        <div style={{display:'flex',gap:'.45rem',flexShrink:0}}>
          {canEdit && !editing && <button className="btn-ghost" style={{padding:'.38rem .85rem',fontSize:'.78rem'}} onClick={()=>setEditing(true)}><Edit3 size={13}/>{lang==='zh'?'编辑':'Edit'}</button>}
          {canEdit && editing && <>
            <button className="btn-ghost" style={{padding:'.38rem .85rem',fontSize:'.78rem'}} onClick={()=>setEditing(false)}><Eye size={13}/>{lang==='zh'?'预览':'Preview'}</button>
            <button className="btn-primary" style={{padding:'.38rem .85rem',fontSize:'.78rem'}} onClick={handleSave} disabled={saving}>
              {saving?<Loader size={12} className="spin"/>:<Save size={13}/>}{lang==='zh'?'保存':'Save'}
            </button>
          </>}
          {activeFile && (
            <a href={fileApi.url(activeFile.file_key)} download={activeFile.filename} className="btn-ghost" style={{padding:'.38rem .85rem',fontSize:'.78rem'}}>
              <Download size={13}/>{lang==='zh'?'下载':'Download'}
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {desc && (
        <div style={{background:'var(--grad-soft)',borderBottom:'1px solid var(--border)',padding:'.85rem 2rem'}}>
          <div style={{maxWidth:900,margin:'0 auto',fontSize:'.88rem',color:'var(--text2)',lineHeight:1.7,fontStyle:'italic',fontFamily:"'ZCOOL XiaoWei','Noto Serif SC',serif"}}>{desc}</div>
        </div>
      )}

      <div style={{maxWidth:900,margin:'0 auto',padding:'1.5rem 2rem 4rem',display:'flex',flexDirection:'column',gap:'1.25rem'}}>
        {/* File list tabs (if multiple files) */}
        {files.length > 1 && (
          <div style={{display:'flex',gap:'.45rem',flexWrap:'wrap'}}>
            {files.map(f => (
              <button key={f.id}
                onClick={()=>{setActive(f);setEditing(false)}}
                style={{
                  display:'flex',alignItems:'center',gap:'.38rem',
                  padding:'.38rem .85rem',borderRadius:'var(--r-xl)',
                  border:`1px solid ${activeFile?.id===f.id?'var(--accent)':'var(--border)'}`,
                  background:activeFile?.id===f.id?'var(--grad-soft)':'var(--bg3)',
                  color:activeFile?.id===f.id?'var(--accent)':'var(--text2)',
                  fontSize:'.8rem',fontWeight:700,cursor:'pointer',
                  transition:'all var(--trans)',fontFamily:"'Nunito',sans-serif",
                }}>
                <span>{fileIcon(f.file_type)}</span>
                <span style={{maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.filename||f.file_type.toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}

        {/* File list (if only one, show a small header) */}
        {files.length === 1 && activeFile && (
          <div style={{display:'flex',alignItems:'center',gap:'.5rem',fontSize:'.82rem',color:'var(--text2)'}}>
            <span>{fileIcon(activeFile.file_type)}</span>
            <span style={{fontFamily:"'Space Mono',monospace"}}>{activeFile.filename}</span>
          </div>
        )}

        {/* No files */}
        {files.length === 0 && (
          <div style={{textAlign:'center',padding:'4rem 0',color:'var(--text3)',fontFamily:"'ZCOOL XiaoWei',serif"}}>
            {lang==='zh'?'暂无附件。':'No files attached yet.'}
          </div>
        )}

        {/* File viewer */}
        {activeFile && INLINE_TYPES.includes(activeFile.file_type) && (
          <>
            {activeFile.file_type === 'pdf' && (
              <iframe src={`${fileApi.url(activeFile.file_key)}#toolbar=1&view=FitH`}
                style={{width:'100%',height:'82vh',border:'none',borderRadius:'var(--r-lg)'}} title={title}/>
            )}
            {activeFile.file_type === 'markdown' && !editing && (
              <article className="md-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></article>
            )}
            {activeFile.file_type === 'txt' && !editing && (
              <pre style={{fontFamily:"'Space Mono',monospace",fontSize:'.87rem',color:'var(--text2)',lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-word',background:'var(--bg2)',borderRadius:'var(--r-lg)',padding:'1.4rem',border:'1px solid var(--border)'}}>{content}</pre>
            )}
            {editing && (
              <textarea value={editBuf} onChange={e=>setEditBuf(e.target.value)}
                style={{width:'100%',minHeight:'68vh',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'1.2rem',color:'var(--text)',fontFamily:"'Space Mono',monospace",fontSize:'.87rem',lineHeight:1.75,resize:'vertical',outline:'none'}}/>
            )}
          </>
        )}

        {/* Binary file */}
        {activeFile && !INLINE_TYPES.includes(activeFile.file_type) && (
          <div style={{textAlign:'center',padding:'4rem 0'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>{fileIcon(activeFile.file_type)}</div>
            <p style={{color:'var(--text2)',marginBottom:'1.5rem',fontFamily:"'ZCOOL XiaoWei',serif"}}>
              {lang==='zh'?'此格式无法在线预览，请下载后打开。':'Cannot preview inline. Download to open.'}
            </p>
            <a href={fileApi.url(activeFile.file_key)} download={activeFile.filename} className="btn-primary" style={{display:'inline-flex',alignItems:'center',gap:'.5rem'}}>
              <Download size={14}/>{lang==='zh'?'下载文件':'Download File'}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
