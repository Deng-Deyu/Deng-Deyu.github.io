import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ArrowUpRight } from 'lucide-react'
import { useAppStore } from '@/store'
import { notesApi } from '@/lib/api'
import { CardEditor } from '@/components/admin/CardEditor'
import type { NoteCard, NoteCategory } from '@/types'

const CATEGORIES: { value: 'all' | NoteCategory; en: string; zh: string }[] = [
  { value: 'all',         en: 'All',         zh: '全部'   },
  { value: 'mathematics', en: 'Mathematics', zh: '数学'   },
  { value: 'engineering', en: 'Engineering', zh: '工程'   },
  { value: 'cs',          en: 'CS / Code',   zh: '计算机' },
  { value: 'physics',     en: 'Physics',     zh: '物理'   },
  { value: 'chemistry',   en: 'Chemistry',   zh: '化学'   },
  { value: 'other',       en: 'Other',       zh: '其他'   },
]

const ICONS: Record<NoteCategory | 'other', string> = {
  mathematics: '📐', engineering: '⚙️', cs: '💻',
  physics: '⚛️', chemistry: '🧪', other: '📄',
}

export function NotesSection() {
  const { lang, isAdmin, token } = useAppStore()
  const navigate = useNavigate()
  const [notes, setNotes]     = useState<NoteCard[]>([])
  const [cat, setCat]         = useState<'all' | NoteCategory>('all')
  const [editing, setEditing] = useState<NoteCard | null | 'new'>(null)

  async function load() {
    const res = await notesApi.list()
    if (res.ok && res.data) setNotes(res.data)
  }
  useEffect(() => { load() }, [])

  const visible = cat === 'all' ? notes : notes.filter(n => n.category === cat)

  async function handleSave(data: Record<string, unknown>) {
    if (editing === 'new') {
      await notesApi.create(token!, data as never)
    } else if (editing) {
      await notesApi.update(token!, editing.id, data as never)
    }
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'zh' ? '确认删除？' : 'Delete this card?')) return
    await notesApi.delete(token!, id)
    await load()
  }

  return (
    <section id="notes" className="section-pad" style={{ background: 'var(--bg)' }}>
      <div className="section-inner">
        <div className="section-header reveal" style={{ marginBottom: '2rem' }}>
          <span className="section-label">// knowledge base</span>
          <h2 className="section-title">
            {lang === 'zh' ? '笔记与资料' : 'Notes & Resources'}
          </h2>
          <p className="section-sub">
            {lang === 'zh'
              ? '按学科整理的学习笔记、参考资料和教程。'
              : 'Study notes, learning resources, and reference material organized by subject.'}
          </p>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }} className="reveal">
          {CATEGORIES.map(c => (
            <button key={c.value}
              onClick={() => setCat(c.value)}
              style={{
                padding: '.38rem .9rem', borderRadius: 100,
                border: `1px solid ${cat === c.value ? 'var(--orange-a)' : 'var(--border)'}`,
                background: cat === c.value ? 'rgba(255,107,26,.1)' : 'transparent',
                color: cat === c.value ? 'var(--orange-b)' : 'var(--text2)',
                fontSize: '.82rem', fontWeight: 600, transition: 'all var(--trans)',
              }}
            >
              {lang === 'zh' ? c.zh : c.en}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="cards-grid reveal">
          {visible.map(note => {
            const title = lang === 'zh' ? note.title_zh : note.title_en
            const desc  = lang === 'zh' ? note.desc_zh  : note.desc_en
            const icon  = ICONS[note.category] ?? '📄'
            const tags  = typeof note.tags === 'string' ? JSON.parse(note.tags) as string[] : (note.tags ?? [])

            return (
              <div key={note.id} className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/view/${note.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg3)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.4rem', marginBottom: '1rem',
                  }}>{icon}</div>
                  <div style={{ display: 'flex', gap: '.3rem' }} onClick={e => e.stopPropagation()}>
                    {isAdmin && <>
                      <button className="btn-icon" style={{ width: 28, height: 28 }}
                        onClick={() => setEditing(note)}><Pencil size={13} /></button>
                      <button className="btn-icon" style={{ width: 28, height: 28 }}
                        onClick={() => handleDelete(note.id)}><Trash2 size={13} /></button>
                    </>}
                    <ArrowUpRight size={15} style={{ color: 'var(--text3)', margin: '6px 0 0 2px' }} />
                  </div>
                </div>
                <div style={{ fontWeight: 700, marginBottom: '.35rem' }}>{title}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '.75rem' }}>{desc}</div>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'var(--bg4)', borderRadius: 4, padding: '.18rem .55rem',
                    fontSize: '.72rem', color: 'var(--orange-c)', fontFamily: "'Space Mono',monospace",
                  }}>
                    {note.category}
                  </span>
                  {tags.slice(0, 2).map((tg: string) => (
                    <span key={tg} style={{
                      background: 'var(--bg4)', borderRadius: 4, padding: '.18rem .55rem',
                      fontSize: '.72rem', color: 'var(--text3)', fontFamily: "'Space Mono',monospace",
                    }}>{tg}</span>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Admin: Add new */}
          {isAdmin && (
            <button
              onClick={() => setEditing('new')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                padding: '1.5rem', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)',
                color: 'var(--text3)', fontSize: '.82rem', fontFamily: "'Space Mono',monospace",
                background: 'none', transition: 'all var(--trans)', cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange-a)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--orange-b)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'
              }}
            >
              <Plus size={16} />
              {lang === 'zh' ? '添加笔记' : 'Add note'}
            </button>
          )}
        </div>
      </div>

      {editing !== null && (
        <CardEditor
          contentType="note"
          initial={editing !== 'new' ? (editing as unknown as Record<string, unknown>) : {}}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
