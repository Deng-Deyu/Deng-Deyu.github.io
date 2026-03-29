import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Play, Download } from 'lucide-react'
import { useAppStore } from '@/store'
import { musicApi, fileApi } from '@/lib/api'
import { CardEditor } from '@/components/admin/CardEditor'
import type { MusicCard } from '@/types'

export function MusicSection() {
  const { lang, isAdmin, token } = useAppStore()
  const [pieces, setPieces]   = useState<MusicCard[]>([])
  const [editing, setEditing] = useState<MusicCard | null | 'new'>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const [audio]               = useState(() => typeof Audio !== 'undefined' ? new Audio() : null)

  async function load() {
    const res = await musicApi.list()
    if (res.ok && res.data) setPieces(res.data)
  }
  useEffect(() => { load() }, [])

  function handlePlay(piece: MusicCard) {
    if (!audio || !piece.audio_key) return
    if (playing === piece.id) {
      audio.pause(); setPlaying(null); return
    }
    audio.src = fileApi.url(piece.audio_key)
    audio.play()
    setPlaying(piece.id)
    audio.onended = () => setPlaying(null)
  }

  async function handleSave(data: Record<string, unknown>) {
    if (editing === 'new') await musicApi.create(token!, data as never)
    else if (editing)      await musicApi.update(token!, editing.id, data as never)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'zh' ? '确认删除？' : 'Delete?')) return
    await musicApi.delete(token!, id)
    await load()
  }

  return (
    <section id="music" className="section-pad" style={{ background: 'var(--bg2)' }}>
      <div className="section-inner">
        <div className="section-header reveal" style={{ marginBottom: '2rem' }}>
          <span className="section-label">// compositions</span>
          <h2 className="section-title">
            {lang === 'zh' ? '乐谱与音频' : 'Sheet Music & Audio'}
          </h2>
          <p className="section-sub">
            {lang === 'zh'
              ? '原创作品与编曲。可下载乐谱或在线试听。'
              : 'Original compositions and arrangements. Download sheet music or listen.'}
          </p>
        </div>

        <div className="cards-grid-2 reveal">
          {pieces.map(piece => {
            const title = lang === 'zh' ? piece.title_zh : piece.title_en
            const isPlaying = playing === piece.id
            return (
              <div key={piece.id} style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius)', padding: '1.25rem',
                backdropFilter: 'blur(12px)', transition: 'border-color var(--trans), box-shadow var(--trans)',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-h)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px var(--glow)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--card-border)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', flexShrink: 0,
                }}>
                  {isPlaying ? '🎵' : '🎼'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: '.2rem' }}>{title}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: "'Space Mono',monospace" }}>
                    {piece.instrument} {piece.pages > 0 ? `· ${piece.pages}p` : ''} · PDF
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  {isAdmin && <>
                    <button className="btn-icon" style={{ width: 30, height: 30 }}
                      onClick={() => setEditing(piece)}><Pencil size={13} /></button>
                    <button className="btn-icon" style={{ width: 30, height: 30 }}
                      onClick={() => handleDelete(piece.id)}><Trash2 size={13} /></button>
                  </>}
                  {piece.audio_key && (
                    <button className="btn-icon" style={{
                      borderRadius: '50%',
                      background: isPlaying ? 'rgba(255,107,26,.15)' : undefined,
                      borderColor: isPlaying ? 'var(--orange-a)' : undefined,
                    }} onClick={() => handlePlay(piece)}>
                      <Play size={14} fill={isPlaying ? 'var(--orange-b)' : 'none'} color="var(--orange-b)" />
                    </button>
                  )}
                  {piece.sheet_key && (
                    <a href={fileApi.url(piece.sheet_key)} download className="btn-icon" style={{ borderRadius: '50%' }}>
                      <Download size={14} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}

          {isAdmin && (
            <button onClick={() => setEditing('new')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              padding: '1.25rem', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)',
              color: 'var(--text3)', fontSize: '.82rem', fontFamily: "'Space Mono',monospace",
              background: 'none', cursor: 'pointer', transition: 'all var(--trans)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange-a)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--orange-b)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)' }}
            >
              <Plus size={16} />
              {lang === 'zh' ? '添加作品' : 'Add piece'}
            </button>
          )}
        </div>
      </div>

      {editing !== null && (
        <CardEditor
          contentType="music"
          initial={editing !== 'new' ? (editing as unknown as Record<string, unknown>) : {}}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
