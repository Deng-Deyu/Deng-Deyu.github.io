import { useState, useEffect } from 'react'
import { Code, Github, Download, Image as ImageIcon, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { softwareApi, fileApi, tl, dl, parseTags } from '@/lib/api'
import { CardEditor } from '@/components/admin/CardEditor'
import type { SoftwareProject } from '@/types'

export function SoftwarePage() {
  const { lang, isAdmin, token } = useAppStore()
  const [projects, setProjects] = useState<SoftwareProject[]>([])
  const [editing, setEditing] = useState<SoftwareProject | 'new' | null>(null)

  const load = async () => { const res = await softwareApi.list(); if (res.ok && res.data) setProjects(res.data) }
  useEffect(() => { load() }, [])
  
  const save = async (data: Record<string, unknown>) => { 
    if (editing === 'new') await softwareApi.create(token!, data)
    else if (editing) await softwareApi.update(token!, editing.id, data)
    await load() 
  }
  const del = async (id: string) => { if (!confirm(lang === 'zh' ? '确认删除？' : 'Delete?')) return; await softwareApi.remove(token!, id); await load() }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="section-label">// engineering & code</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="section-title text-glow-3d">{lang === 'zh' ? '软件项目' : 'Software Projects'}</h1>
          {isAdmin && <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={14} />{lang === 'zh' ? '新增' : 'Add'}</button>}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 2rem 5rem' }}>
        <div className="cards-grid-2">
          {projects.map(p => (
            <div key={p.id} className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 180, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid var(--border)' }}>
                {p.preview_key ? <img src={fileApi.url(p.preview_key)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={48} color="var(--text3)" />}
              </div>
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{tl(p, lang)}</h3>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => setEditing(p)}><Pencil size={12} /></button>
                      <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => del(p.id)}><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
                
                <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>{dl(p, lang)}</p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                  <span className="tag" style={{ background: p.is_open_source ? 'rgba(52, 211, 153, 0.1)' : 'rgba(167, 139, 250, 0.1)', color: p.is_open_source ? '#34d399' : '#a78bfa' }}>
                    {p.is_open_source ? 'Open Source' : 'Closed Source'}
                  </span>
                  {parseTags(p.tags).map(t => <span key={t} className="tag tag-gray">{t}</span>)}
                </div>

                {p.is_open_source ? (
                  <a href={p.github_url || '#'} target="_blank" rel="noreferrer" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}><Github size={16} /> GitHub</a>
                ) : (
                  <a href={p.download_url || '#'} target="_blank" rel="noreferrer" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Download size={16} /> Download</a>
                )}
              </div>
            </div>
          ))}
          {isAdmin && <button className="add-btn" onClick={() => setEditing('new')}><Plus size={16} /> {lang === 'zh' ? '添加软件项目' : 'Add Project'}</button>}
        </div>
      </div>

      {editing && <CardEditor contentType="software" initial={editing === 'new' ? {} : (editing as any)} onSave={save as any} onClose={() => setEditing(null)} />}
    </div>
  )
}