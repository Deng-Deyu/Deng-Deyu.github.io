import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '@/store'
import { notesApi, fileApi, tl } from '@/lib/api'
import type { Note } from '@/types'

export function FileViewer() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lang } = useAppStore()
  const [note, setNote]       = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      const res = await notesApi.get(id)
      if (!res.ok || !res.data) { setError(lang==='zh'?'笔记不存在':'Note not found'); setLoading(false); return }
      setNote(res.data)
      if (res.data.file_key && (res.data.file_type === 'markdown' || res.data.file_type === 'txt')) {
        const r = await fetch(fileApi.url(res.data.file_key))
        if (r.ok) setContent(await r.text())
        else setError(lang==='zh'?'文件加载失败':'Failed to load file')
      }
      setLoading(false)
    }
    load()
  }, [id, lang])

  const title = note ? tl(note, lang) : ''

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}>
      <Loader size={28} className="spin" style={{ color:'var(--orange-b)' }} />
    </div>
  )
  if (error) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:'1rem' }}>
      <p style={{ color:'var(--text2)' }}>{error}</p>
      <button className="btn-ghost" onClick={()=>navigate(-1)}><ArrowLeft size={16}/>{lang==='zh'?'返回':'Back'}</button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',paddingTop:80 }}>
      {/* Sticky topbar */}
      <div style={{ position:'sticky',top:64,zIndex:50,background:'var(--nav-bg)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',padding:'.75rem 2rem',display:'flex',alignItems:'center',gap:'1rem' }}>
        <button className="btn-icon" onClick={()=>navigate(-1)}><ArrowLeft size={16}/></button>
        <h1 style={{ fontSize:'1rem',fontWeight:700,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{title}</h1>
        {note?.file_key && (
          <a href={fileApi.url(note.file_key)} download className="btn-ghost" style={{ fontSize:'.82rem',padding:'.4rem .9rem',flexShrink:0 }}>
            <Download size={14}/>{lang==='zh'?'下载':'Download'}
          </a>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth:900,margin:'0 auto',padding:'2rem' }}>
        {/* PDF */}
        {note?.file_type === 'pdf' && note.file_key && (
          <iframe src={`${fileApi.url(note.file_key)}#toolbar=1&view=FitH`}
            style={{ width:'100%',height:'85vh',border:'none',borderRadius:'var(--radius)' }} title={title} />
        )}
        {/* Markdown */}
        {note?.file_type === 'markdown' && (
          <article className="md-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        )}
        {/* Plain text */}
        {note?.file_type === 'txt' && (
          <pre style={{ fontFamily:"'Space Mono',monospace",fontSize:'.88rem',color:'var(--text2)',lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-word',background:'var(--bg2)',borderRadius:'var(--radius)',padding:'1.5rem' }}>
            {content}
          </pre>
        )}
        {!note?.file_key && (
          <div style={{ textAlign:'center',padding:'4rem 0',color:'var(--text3)' }}>
            {lang==='zh'?'暂无文件附件。':'No file attached yet.'}
          </div>
        )}
        {note?.file_key && !['pdf','markdown','txt'].includes(note?.file_type??'') && (
          <div style={{ textAlign:'center',padding:'4rem 0' }}>
            <div style={{ fontSize:'3rem',marginBottom:'1rem' }}>📎</div>
            <p style={{ color:'var(--text2)',marginBottom:'1.5rem' }}>
              {lang==='zh'?'此格式无法在线预览，请下载后打开。':'This format cannot be previewed inline. Please download to open.'}
            </p>
            {note.file_key && (
              <a href={fileApi.url(note.file_key)} download className="btn-primary"
                style={{ display:'inline-flex',alignItems:'center',gap:'.5rem' }}>
                ↓ {lang==='zh'?'下载文件':'Download File'}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
