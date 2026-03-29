import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useAppStore } from '@/store'
import { timelineApi } from '@/lib/api'
import type { TimelineItem } from '@/types'

function TimelineEditor({
  item,
  onSave,
  onClose,
}: {
  item: Partial<TimelineItem>
  onSave: (data: Omit<TimelineItem, 'id'>) => Promise<void>
  onClose: () => void
}) {
  const { lang } = useAppStore()
  const [form, setForm] = useState({
    year:      item.year      ?? '',
    title_en:  item.title_en  ?? '',
    title_zh:  item.title_zh  ?? '',
    desc_en:   item.desc_en   ?? '',
    desc_zh:   item.desc_zh   ?? '',
    sort_order: item.sort_order ?? 0,
  })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ ...form, sort_order: Number(form.sort_order) })
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{lang === 'zh' ? '编辑时间轴' : 'Edit Timeline'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          {([
            ['year',      lang === 'zh' ? '年份' : 'Year'],
            ['title_en',  lang === 'zh' ? '标题（英文）' : 'Title (EN)'],
            ['title_zh',  lang === 'zh' ? '标题（中文）' : 'Title (ZH)'],
            ['desc_en',   lang === 'zh' ? '描述（英文）' : 'Desc (EN)'],
            ['desc_zh',   lang === 'zh' ? '描述（中文）' : 'Desc (ZH)'],
            ['sort_order',lang === 'zh' ? '排序（数字小的在前）' : 'Sort order'],
          ] as [keyof typeof form, string][]).map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              {key === 'desc_en' || key === 'desc_zh' ? (
                <textarea value={form[key]} onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))} />
              ) : (
                <input
                  type={key === 'sort_order' ? 'number' : 'text'}
                  value={form[key]}
                  onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {lang === 'zh' ? '保存' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function JourneySection() {
  const { lang, isAdmin, token } = useAppStore()
  const [items, setItems]     = useState<TimelineItem[]>([])
  const [editing, setEditing] = useState<TimelineItem | null | 'new'>(null)

  async function load() {
    const res = await timelineApi.list()
    if (res.ok && res.data) setItems(res.data as TimelineItem[])
  }
  useEffect(() => { load() }, [])

  async function handleSave(data: Omit<TimelineItem, 'id'>) {
    if (editing === 'new') await timelineApi.create(token!, data)
    else if (editing)      await timelineApi.update(token!, editing.id, data)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'zh' ? '确认删除？' : 'Delete?')) return
    await timelineApi.delete(token!, id)
    await load()
  }

  return (
    <section id="journey" className="section-pad" style={{ background: 'var(--bg2)' }}>
      <div className="section-inner">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}
          className="journey-grid">

          {/* Left: bio text */}
          <div className="reveal">
            <span className="section-label">// about me</span>
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>
              {lang === 'zh' ? '我的心路历程' : 'My Journey'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {[
                {
                  en: "I'm <strong style='color:var(--orange-b)'>Turtlelet</strong> — a student with broad curiosity. My time moves between lines of code, sheets of music, mathematical equations, and 3D models.",
                  zh: "我是 <strong style='color:var(--orange-b)'>Turtlelet</strong>——一个好奇心旺盛的学生。我的时间在代码、乐谱、数学方程和三维模型之间流转。",
                },
                {
                  en: "This site is my digital garden — a place to store notes, share creations, and reflect on learning. Everything here is a work in progress.",
                  zh: "这个网站是我的数字花园——存放笔记、分享创作、记录学习的地方。这里的一切都在持续演进。",
                },
                {
                  en: "<strong style='color:var(--orange-b)'>Currently:</strong> Studying and building. Always curious about the intersection of math, engineering, and art.",
                  zh: "<strong style='color:var(--orange-b)'>目前：</strong>学习与创作并行，对数学、工程与艺术的交汇点始终充满好奇。",
                },
              ].map((p, i) => (
                <p key={i} style={{ fontSize: '1rem', color: 'var(--text2)', lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: lang === 'zh' ? p.zh : p.en }} />
              ))}
            </div>
          </div>

          {/* Right: timeline */}
          <div className="reveal">
            {isAdmin && (
              <button
                onClick={() => setEditing('new')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                  marginBottom: '1.5rem', color: 'var(--orange-b)',
                  fontSize: '.82rem', fontFamily: "'Space Mono',monospace",
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                {lang === 'zh' ? '添加节点' : 'Add entry'}
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map((item, idx) => {
                const title = lang === 'zh' ? item.title_zh : item.title_en
                const desc  = lang === 'zh' ? item.desc_zh  : item.desc_en
                return (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: '1.25rem', paddingBottom: idx < items.length - 1 ? '2rem' : 0 }}>
                    {/* Dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--grad)', flexShrink: 0, marginTop: 5 }} />
                      {idx < items.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 6 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '.7rem', color: 'var(--orange-b)', letterSpacing: '.05em', marginBottom: '.2rem' }}>{item.year}</div>
                          <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>{title}</div>
                          <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>{desc}</div>
                        </div>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0, marginLeft: '.5rem' }}>
                            <button className="btn-icon" style={{ width: 26, height: 26 }}
                              onClick={() => setEditing(item)}><Pencil size={12} /></button>
                            <button className="btn-icon" style={{ width: 26, height: 26 }}
                              onClick={() => handleDelete(item.id)}><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {items.length === 0 && (
                <p style={{ color: 'var(--text3)', fontSize: '.85rem', fontFamily: "'Space Mono',monospace" }}>
                  {lang === 'zh' ? '暂无内容，管理员可添加。' : 'No entries yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing !== null && (
        <TimelineEditor
          item={editing !== 'new' ? editing : {}}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .journey-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
