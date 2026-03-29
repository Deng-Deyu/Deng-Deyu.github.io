import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Download, Box } from 'lucide-react'
import { useAppStore } from '@/store'
import { modelsApi, fileApi } from '@/lib/api'
import { CardEditor } from '@/components/admin/CardEditor'
import type { ModelCard } from '@/types'

export function ModelingSection() {
  const { lang, isAdmin, token } = useAppStore()
  const [models, setModels]   = useState<ModelCard[]>([])
  const [editing, setEditing] = useState<ModelCard | null | 'new'>(null)

  async function load() {
    const res = await modelsApi.list()
    if (res.ok && res.data) setModels(res.data)
  }
  useEffect(() => { load() }, [])

  async function handleSave(data: Record<string, unknown>) {
    if (editing === 'new') await modelsApi.create(token!, data as never)
    else if (editing)      await modelsApi.update(token!, editing.id, data as never)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'zh' ? '确认删除？' : 'Delete?')) return
    await modelsApi.delete(token!, id)
    await load()
  }

  return (
    <section id="modeling" className="section-pad" style={{ background: 'var(--bg2)' }}>
      <div className="section-inner">
        <div className="section-header reveal" style={{ marginBottom: '2rem' }}>
          <span className="section-label">// 3d & design</span>
          <h2 className="section-title">
            {lang === 'zh' ? '建模与设计' : 'Modeling & Design'}
          </h2>
          <p className="section-sub">
            {lang === 'zh'
              ? '三维模型、CAD 文件及设计项目。'
              : '3D models, CAD files, and design projects.'}
          </p>
        </div>

        <div className="cards-grid reveal">
          {models.map(model => {
            const title = lang === 'zh' ? model.title_zh : model.title_en
            const desc  = lang === 'zh' ? model.desc_zh  : model.desc_en
            return (
              <div key={model.id} className="card">
                {/* Preview image or fallback icon */}
                {model.preview_key ? (
                  <img
                    src={fileApi.url(model.preview_key)}
                    alt={title}
                    style={{
                      width: '100%', aspectRatio: '16/9', objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)', marginBottom: '1rem',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%', aspectRatio: '16/9',
                    background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem',
                  }}>
                    <Box size={32} style={{ color: 'var(--text3)' }} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, marginBottom: '.35rem', flex: 1 }}>{title}</div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0 }}>
                      <button className="btn-icon" style={{ width: 28, height: 28 }}
                        onClick={() => setEditing(model)}><Pencil size={13} /></button>
                      <button className="btn-icon" style={{ width: 28, height: 28 }}
                        onClick={() => handleDelete(model.id)}><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '.75rem' }}>{desc}</div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    background: 'var(--bg4)', borderRadius: 4, padding: '.18rem .55rem',
                    fontSize: '.72rem', color: 'var(--orange-c)', fontFamily: "'Space Mono',monospace",
                  }}>{model.software}</span>
                  {model.file_key && (
                    <a href={fileApi.url(model.file_key)} download
                      className="btn-icon" style={{ width: 28, height: 28, borderRadius: '50%' }}
                      onClick={e => e.stopPropagation()}>
                      <Download size={13} />
                    </a>
                  )}
                </div>
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
              {lang === 'zh' ? '添加模型' : 'Add model'}
            </button>
          )}
        </div>
      </div>

      {editing !== null && (
        <CardEditor
          contentType="model"
          initial={editing !== 'new' ? (editing as unknown as Record<string, unknown>) : {}}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
