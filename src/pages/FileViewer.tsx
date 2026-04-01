import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader, Save, Edit3, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '@/store'
import { notesApi, fileApi, tl } from '@/lib/api'
import type { Note } from '@/types'

export function FileViewer() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lang, isAdmin, token } = useAppStore()
  const [note, setNote]       = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [editBuf, setEditBuf] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function load() {
      if(!id) return
      setLoading(true)
      const res = await notesApi.get(id)
      if(!res.ok||!res.data){setError(lang==='zh'?'笔记不存在':'Not found');setLoading(false);return}
      setNote(res.data)
      if(res.data.file_key && (res.data.file_type==='markdown'||res.data.file_type==='txt')) {
        const r = await fetch(fileApi.url(res.data.file_key))
        if(r.ok){const t=await r.text();setContent(t);setEditBuf(t)}
        else setError(lang==='zh'?'文件加载失败':'Load failed')
      }
      setLoading(false)
    }
    load()
  },[id, lang])

  async function handleSave() {
    if(!note?.file_key||!token) return
    setSaving(true)
    const ok = await fileApi.updateText(token, note.file_key, editBuf)
    if(ok){setContent(editBuf);setEditing(false)}
    setSaving(false)
  }

  const title = note ? tl(note, lang) : ''
  const desc  = note ? (lang==='zh'?note.desc_zh:note.desc_en) : ''
  const canEdit = isAdmin && (note?.file_type==='txt'||note?.file_type==='markdown')
  const isText  = note?.file_type==='markdown'||note?.file_type==='txt'

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><Loader size={28} className="spin" style={{color:'var(--orange-b)'}}/></div>
  if(error) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:'1rem'}}>
      <p style={{color:'var(--text2)'}}>{error}</p>
      <button className="btn-ghost" onClick={()=>navigate(-1)}><ArrowLeft size={16}/>{lang==='zh'?'返回':'Back'}</button>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',paddingTop:80}}>
      {/* Sticky topbar */}
      <div style={{position:'sticky',top:64,zIndex:50,background:'var(--nav-bg)',backdropFilter:'blur(20px)',borderBottom:'1.5px solid var(--border)',padding:'.75rem 2rem',display:'flex',alignItems:'center',gap:'1rem'}}>
        <button className="btn-icon" onClick={()=>navigate(-1)}><ArrowLeft size={16}/></button>
        <div style={{flex:1,minWidth:0}}>
          <h1 style={{fontSize:'1rem',fontWeight:900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</h1>
          {note?.created_at && (
            <div style={{fontSize:'.72rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace",marginTop:'.1rem'}}>
              {lang==='zh'?'创建于':'Created'} {new Date(note.created_at).toLocaleDateString('zh-CN')}
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:'.5rem',flexShrink:0}}>
          {canEdit && !editing && (
            <button className="btn-ghost" style={{padding:'.4rem .9rem',fontSize:'.8rem'}} onClick={()=>setEditing(true)}>
              <Edit3 size={14}/>{lang==='zh'?'编辑':'Edit'}
            </button>
          )}
          {canEdit && editing && (
            <>
              <button className="btn-ghost" style={{padding:'.4rem .9rem',fontSize:'.8rem'}} onClick={()=>setEditing(false)}>
                <Eye size={14}/>{lang==='zh'?'预览':'Preview'}
              </button>
              <button className="btn-primary" style={{padding:'.4rem .9rem',fontSize:'.8rem'}} onClick={handleSave} disabled={saving}>
                {saving?<Loader size={12} className="spin"/>:<Save size={14}/>}
                {lang==='zh'?'保存':'Save'}
              </button>
            </>
          )}
          {note?.file_key && (
            <a href={fileApi.url(note.file_key)} download className="btn-ghost" style={{fontSize:'.8rem',padding:'.4rem .9rem',flexShrink:0}}>
              <Download size={14}/>{lang==='zh'?'下载':'Download'}
            </a>
          )}
        </div>
      </div>

      {/* Description banner */}
      {desc && (
        <div style={{background:'linear-gradient(135deg,rgba(255,123,53,.08),rgba(255,159,87,.04))',borderBottom:'1.5px solid var(--border)',padding:'1rem 2rem'}}>
          <div style={{maxWidth:900,margin:'0 auto',fontSize:'.9rem',color:'var(--text2)',lineHeight:1.7,fontStyle:'italic',fontFamily:"'Klee One',cursive"}}>
            {desc}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{maxWidth:900,margin:'0 auto',padding:'2rem'}}>
        {/* PDF */}
        {note?.file_type==='pdf'&&note.file_key&&(
          <iframe src={`${fileApi.url(note.file_key)}#toolbar=1&view=FitH`}
            style={{width:'100%',height:'85vh',border:'none',borderRadius:'var(--r-lg)'}} title={title}/>
        )}
        {/* Text edit mode */}
        {isText && editing && (
          <textarea value={editBuf} onChange={e=>setEditBuf(e.target.value)}
            style={{width:'100%',minHeight:'70vh',background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:'var(--r-md)',padding:'1.25rem',color:'var(--text)',fontFamily:"'Space Mono',monospace",fontSize:'.88rem',lineHeight:1.75,resize:'vertical',outline:'none'}}/>
        )}
        {/* Markdown preview */}
        {note?.file_type==='markdown'&&!editing&&(
          <article className="md-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></article>
        )}
        {/* Plain text */}
        {note?.file_type==='txt'&&!editing&&(
          <pre style={{fontFamily:"'Space Mono',monospace",fontSize:'.88rem',color:'var(--text2)',lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-word',background:'var(--bg2)',borderRadius:'var(--r-lg)',padding:'1.5rem',border:'1.5px solid var(--border)'}}>{content}</pre>
        )}
        {/* Binary / unsupported */}
        {note?.file_key&&!['pdf','markdown','txt'].includes(note?.file_type??'')&&(
          <div style={{textAlign:'center',padding:'4rem 0'}}>
            <div style={{fontSize:'3.5rem',marginBottom:'1rem',animation:'float 3s ease-in-out infinite'}}>📎</div>
            <p style={{color:'var(--text2)',marginBottom:'1.5rem',fontFamily:"'Klee One',cursive"}}>
              {lang==='zh'?'此格式无法在线预览，请下载后打开。':'Cannot preview inline. Please download to open.'}
            </p>
            {note.file_key&&(
              <a href={fileApi.url(note.file_key)} download className="btn-primary" style={{display:'inline-flex',alignItems:'center',gap:'.5rem'}}>
                ↓ {lang==='zh'?'下载文件':'Download File'}
              </a>
            )}
          </div>
        )}
        {!note?.file_key&&(
          <div style={{textAlign:'center',padding:'4rem 0',color:'var(--text3)',fontFamily:"'Klee One',cursive"}}>
            {lang==='zh'?'暂无文件附件。':'No file attached yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
