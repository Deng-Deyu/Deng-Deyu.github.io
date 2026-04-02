import { useState, useEffect } from 'react'
import { Code, Github, Download, Image as ImageIcon, Plus, Pencil, Trash2, Link as LinkIcon } from 'lucide-react'
import { useAppStore } from '@/store'
// 1. 修改了这里的导入，使用 projectsApi 和新的辅助函数
import { projectsApi, fileApi, tl, dl, parseTags } from '@/lib/api'
import { CardEditor } from '@/components/admin/CardEditor'
// 2. 导入全新的 Project 类型
import type { Project } from '@/types'

export function SoftwarePage() {
  const { lang, isAdmin, token } = useAppStore()
  // 3. 状态类型修改为 Project
  const [projects, setProjects] = useState<Project[]>([])
  const [editing, setEditing] = useState<Project | 'new' | null>(null)

  const load = async () => { 
    const res = await projectsApi.list(); 
    if (res.ok && res.data) setProjects(res.data) 
  }
  
  useEffect(() => { load() }, [])
  
  const save = async (data: Record<string, unknown>) => { 
    if (editing === 'new') await projectsApi.create(token!, data)
    else if (editing) await projectsApi.update(token!, editing.id, data)
    await load() 
  }
  
  const del = async (id: string) => { 
    if (!confirm(lang === 'zh' ? '确认删除？' : 'Delete?')) return; 
    await projectsApi.remove(token!, id); 
    await load() 
  }

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
                  {/* 4. 将原本的 p.tags 改成了 p.tech_stack，适配新类型 */}
                  {parseTags(p.tech_stack).map(t => <span key={t} className="tag tag-gray">{t}</span>)}
                </div>

                {/* 5. 适配了新的 url 字段 */}
                <a href={p.url || '#'} target="_blank" rel="noreferrer" 
                   className={p.is_open_source ? "btn-ghost" : "btn-primary"} 
                   style={{ width: '100%', justifyContent: 'center' }}>
                  {p.is_open_source ? <><Github size={16} /> GitHub</> : <><LinkIcon size={16} /> {lang === 'zh' ? '访问链接' : 'Visit'}</>}
                </a>
              </div>
            </div>
          ))}
          {isAdmin && <button className="add-btn" onClick={() => setEditing('new')}><Plus size={16} /> {lang === 'zh' ? '添加软件项目' : 'Add Project'}</button>}
        </div>
      </div>

      {/* 6. contentType 修改为 'projects' 以匹配 CardEditor 内部的新逻辑 */}
      {editing && <CardEditor contentType="projects" initial={editing === 'new' ? {} : (editing as any)} onSave={save as any} onClose={() => setEditing(null)} />}
    </div>
  )
}