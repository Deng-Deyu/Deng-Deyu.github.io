import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '@/store'
import { fileApi, notesApi } from '@/lib/api'
import type { NoteCard } from '@/types'

export function FileViewer() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const { lang }    = useAppStore()
  const [note, setNote]       = useState<NoteCard | null>(null)
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)

      // Fetch single note directly (efficient)
      const res = await notesApi.get(id)
      if (!res.ok || !res.data) { setError('Note not found'); setLoading(false); return }

      const found = res.data as NoteCard
      setNote(found)

      if (!found.file_key) { setLoading(false); return }

      if (found.file_type === 'markdown') {
        // Fetch markdown text
        const url = fileApi.url(found.file_key)
        const r   = await fetch(url)
        if (r.ok) setContent(await r.text())
        else setError('Failed to load file')
      }
      // PDF is rendered inline via <iframe>
      setLoading(false)
    }
    load()
  }, [id])

  const title = note ? (lang === 'zh' ? note.title_zh : note.title_en) : ''

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Loader size={28} style={{ animation: 'spin .8s linear infinite', color: 'var(--orange-b)' }} />
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <p style={{ color: 'var(--text2)' }}>{error}</p>
      <button className="btn-ghost" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> {lang === 'zh' ? '返回' : 'Back'}
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 50,
        background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '.75rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, flex: 1 }}>{title}</h1>
        {note?.file_key && (
          <a
            href={fileApi.url(note.file_key)}
            download
            className="btn-ghost"
            style={{ fontSize: '.82rem', padding: '.4rem .9rem' }}
          >
            <Download size={14} />
            {lang === 'zh' ? '下载' : 'Download'}
          </a>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '2rem' }}>
        {note?.file_type === 'pdf' && note.file_key && (
          <iframe
            src={fileApi.url(note.file_key) + '#toolbar=1&view=FitH'}
            style={{ width: '100%', height: '85vh', border: 'none', borderRadius: 'var(--radius)' }}
            title={title}
          />
        )}

        {note?.file_type === 'markdown' && (
          <article className="md-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </article>
        )}

        {!note?.file_key && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text3)' }}>
            {lang === 'zh' ? '暂无文件，管理员可上传。' : 'No file attached yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
