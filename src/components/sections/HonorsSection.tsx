import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { honorsApi } from '@/lib/api'
import { CardEditor } from '@/components/admin/CardEditor'
import type { HonorCard } from '@/types'

export function HonorsSection() {
  const { lang, isAdmin, token } = useAppStore()
  const [honors, setHonors]   = useState<HonorCard[]>([])
  const [editing, setEditing] = useState<HonorCard | null | 'new'>(null)

  async function load() {
    const res = await honorsApi.list()
    if (res.ok && res.data) setHonors(res.data)
  }
  useEffect(() => { load() }, [])

  async function handleSave(data: Record<string, unknown>) {
    if (editing === 'new') await honorsApi.create(token!, data as never)
    else if (editing)      await honorsApi.update(token!, editing.id, data as never)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'zh' ? '确认删除？' : 'Delete?')) return
    await honorsApi.delete(token!, id)
    await load()
  }

  return (
    <section id="honors" className="section-pad" style={{ background: 'var(--bg)' }}>
      <div className="section-inner">
        <div className="section-header reveal" style={{ marginBottom: '2rem' }}>
          <span className="section-label">// achievements</span>
          <h2 className="section-title">
            {lang === 'zh' ? '荣誉与作品' : 'Honors & Works'}
          </h2>
          <p className="section-sub">
            {lang === 'zh'
              ? '获奖记录、证书与代表性作品。'
              : 'Awards, certificates, and notable works.'}
          </p>
        </div>

        <div className="honors-grid reveal">
          {honors.map(honor => {
            const title = lang === 'zh' ? honor.title_zh : honor.title_en
            const org   = lang === 'zh' ? honor.org_zh   : honor.org_en
            return (
              <div key={honor.id} style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius)', padding: '1.5rem',
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
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
                  width: 48, height: 48, borderRadius: 'var(--radius-sm)',
                  background: 'var(--grad)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', flexShrink: 0,
                }}>{honor.emoji}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '.7rem', color: 'var(--orange-b)', letterSpacing: '.05em', marginBottom: '.2rem' }}>
                    {honor.year}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>{title}</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text3)' }}>{org}</div>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0 }}>
                    <button className="btn-icon" style={{ width: 28, height: 28 }}
                      onClick={() => setEditing(honor)}><Pencil size={13} /></button>
                    <button className="btn-icon" style={{ width: 28, height: 28 }}
                      onClick={() => handleDelete(honor.id)}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            )
          })}

          {isAdmin && (
            <button onClick={() => setEditing('new')} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              padding: '1.5rem', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)',
              color: 'var(--text3)', fontSize: '.82rem', fontFamily: "'Space Mono',monospace",
              background: 'none', cursor: 'pointer', transition: 'all var(--trans)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange-a)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--orange-b)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)' }}
            >
              <Plus size={16} />
              {lang === 'zh' ? '添加荣誉' : 'Add honor'}
            </button>
          )}
        </div>
      </div>

      {editing !== null && (
        <CardEditor
          contentType="honor"
          initial={editing !== 'new' ? (editing as unknown as Record<string, unknown>) : {}}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
