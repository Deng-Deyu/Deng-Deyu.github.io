import { useState, useEffect } from 'react'
import { Code, Github, Download, Image as ImageIcon } from 'lucide-react'
import { useAppStore } from '@/store'
import { softwareApi, tl, dl, parseTags, fileApi } from '@/lib/api'
import { CardEditor } from '@/components/admin/CardEditor'
import type { SoftwareProject } from '@/types'

export function SoftwarePage() {
  const { lang, isAdmin, token } = useAppStore()
  const [projects, setProjects] = useState<SoftwareProject[]>([])
  const [editing, setEditing] = useState<SoftwareProject | 'new' | null>(null)

  const load = async () => {
    const res = await softwareApi.list()
    if (res.ok && res.data) setProjects(res.data)
  }
  useEffect(() => { load() }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <Code className="text-primary w-10 h-10" />
            {lang === 'zh' ? '软件项目' : 'Software Projects'}
          </h1>
          <p className="text-gray-400">{lang === 'zh' ? '开源代码与闭源工具。' : 'Open-source code and closed-source tools.'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setEditing('new')} className="px-4 py-2 bg-primary text-black rounded-lg font-bold">
            + New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => (
          <div key={p.id} className="glass-card-3d rounded-2xl overflow-hidden flex flex-col">
            {/* 封面图 */}
            <div className="h-48 bg-black/40 relative flex items-center justify-center border-b border-white/10">
              {p.preview_key ? (
                <img src={fileApi.url(p.preview_key)} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-600" />
              )}
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{tl(p, lang)}</h3>
                <span className={`text-xs px-2 py-1 rounded font-mono ${p.is_open_source ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {p.is_open_source ? 'Open Source' : 'Closed Source'}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-3">{dl(p, lang)}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {parseTags(p.tags).map(t => (
                  <span key={t} className="text-xs px-2 py-1 bg-white/5 rounded text-gray-300">{t}</span>
                ))}
              </div>

              <div className="flex gap-3">
                {p.is_open_source ? (
                  <a href={p.github_url || '#'} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                    <Github size={16} /> GitHub
                  </a>
                ) : (
                  <a href={p.download_url || '#'} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                    <Download size={16} /> Download
                  </a>
                )}
                
                {isAdmin && (
                  <button onClick={() => setEditing(p)} className="px-3 rounded-lg bg-red-500/20 text-red-400">Edit</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <CardEditor
          type="software"
          initial={editing === 'new' ? {} : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  )
}