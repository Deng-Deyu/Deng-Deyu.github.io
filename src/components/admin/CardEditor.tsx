import { useState } from 'react'
import { X, Upload, Loader } from 'lucide-react'
import { useAppStore } from '@/store'
import { fileApi } from '@/lib/api'
import type { ContentType } from '@/types'

// ─── Field definitions per type ───────────────────────────────────────────────

interface FieldDef {
  key: string
  label_en: string
  label_zh: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'file'
  options?: { value: string; label: string }[]
  accept?: string
}

const FIELD_MAP: Record<ContentType, FieldDef[]> = {
  note: [
    { key: 'title_en',  label_en: 'Title (EN)',    label_zh: '标题（英文）', type: 'text' },
    { key: 'title_zh',  label_en: 'Title (ZH)',    label_zh: '标题（中文）', type: 'text' },
    { key: 'desc_en',   label_en: 'Desc (EN)',     label_zh: '描述（英文）', type: 'textarea' },
    { key: 'desc_zh',   label_en: 'Desc (ZH)',     label_zh: '描述（中文）', type: 'textarea' },
    { key: 'category',  label_en: 'Category',      label_zh: '分类',         type: 'select', options: [
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'cs',          label: 'CS / Code'   },
        { value: 'physics',     label: 'Physics'     },
        { value: 'chemistry',   label: 'Chemistry'   },
        { value: 'other',       label: 'Other'       },
    ]},
    { key: 'tags',      label_en: 'Tags (comma)', label_zh: '标签（逗号分隔）', type: 'text' },
    { key: 'file',      label_en: 'File (PDF or .md)', label_zh: '文件（PDF 或 .md）', type: 'file', accept: '.pdf,.md' },
  ],
  music: [
    { key: 'title_en',  label_en: 'Title (EN)',    label_zh: '标题（英文）', type: 'text' },
    { key: 'title_zh',  label_en: 'Title (ZH)',    label_zh: '标题（中文）', type: 'text' },
    { key: 'instrument',label_en: 'Instrument',    label_zh: '乐器',         type: 'text' },
    { key: 'pages',     label_en: 'Pages',         label_zh: '页数',         type: 'number' },
    { key: 'sheet',     label_en: 'Sheet (PDF)',   label_zh: '乐谱（PDF）',  type: 'file', accept: '.pdf' },
    { key: 'audio',     label_en: 'Audio file',    label_zh: '音频文件',     type: 'file', accept: '.mp3,.wav,.ogg,.flac,.m4a' },
  ],
  video: [],   // Videos section uses external links only
  model: [
    { key: 'title_en',  label_en: 'Title (EN)',    label_zh: '标题（英文）', type: 'text' },
    { key: 'title_zh',  label_en: 'Title (ZH)',    label_zh: '标题（中文）', type: 'text' },
    { key: 'desc_en',   label_en: 'Desc (EN)',     label_zh: '描述（英文）', type: 'textarea' },
    { key: 'desc_zh',   label_en: 'Desc (ZH)',     label_zh: '描述（中文）', type: 'textarea' },
    { key: 'software',  label_en: 'Software',      label_zh: '软件',         type: 'text' },
    { key: 'preview',   label_en: 'Preview image', label_zh: '预览图',       type: 'file', accept: '.jpg,.png,.webp' },
    { key: 'file',      label_en: 'Model file',    label_zh: '模型文件',     type: 'file', accept: '.stp,.stl,.obj,.blend,.zip' },
  ],
  honor: [
    { key: 'title_en',  label_en: 'Title (EN)',    label_zh: '奖项名称（英文）', type: 'text' },
    { key: 'title_zh',  label_en: 'Title (ZH)',    label_zh: '奖项名称（中文）', type: 'text' },
    { key: 'org_en',    label_en: 'Org (EN)',       label_zh: '机构（英文）',     type: 'text' },
    { key: 'org_zh',    label_en: 'Org (ZH)',       label_zh: '机构（中文）',     type: 'text' },
    { key: 'year',      label_en: 'Year',           label_zh: '年份',             type: 'number' },
    { key: 'emoji',     label_en: 'Emoji',          label_zh: 'Emoji 图标',       type: 'text' },
  ],
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  contentType: ContentType
  initial?: Record<string, unknown>
  onSave: (data: Record<string, unknown>, files: Record<string, File>) => Promise<void>
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CardEditor({ contentType, initial = {}, onSave, onClose }: Props) {
  const { lang, token } = useAppStore()
  const fields = FIELD_MAP[contentType]

  const [form, setForm]     = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    fields.filter(f => f.type !== 'file').forEach(f => {
      defaults[f.key] = (initial[f.key] as string) ?? ''
    })
    return defaults
  })
  const [files, setFiles]   = useState<Record<string, File>>({})
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  const lbl = (f: FieldDef) => lang === 'zh' ? f.label_zh : f.label_en

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      // Upload files first
      const uploadedKeys: Record<string, string> = {}
      for (const [fieldKey, file] of Object.entries(files)) {
        const key = await fileApi.upload(token!, file)
        if (!key) throw new Error(`Failed to upload ${fieldKey}`)
        uploadedKeys[fieldKey] = key
      }

      // Build final payload
      const payload: Record<string, unknown> = { ...form }

      // Map file upload keys into the right schema fields
      if (contentType === 'note') {
        if (uploadedKeys['file']) {
          payload['file_key']  = uploadedKeys['file']
          payload['file_type'] = files['file'].name.endsWith('.md') ? 'markdown' : 'pdf'
        }
        // tags: convert comma string to JSON array
        payload['tags'] = JSON.stringify(
          (form['tags'] || '').split(',').map(t => t.trim()).filter(Boolean)
        )
      }
      if (contentType === 'music') {
        if (uploadedKeys['sheet']) payload['sheet_key'] = uploadedKeys['sheet']
        if (uploadedKeys['audio']) payload['audio_key'] = uploadedKeys['audio']
      }
      if (contentType === 'model') {
        if (uploadedKeys['preview']) payload['preview_key'] = uploadedKeys['preview']
        if (uploadedKeys['file'])    payload['file_key']    = uploadedKeys['file']
      }

      await onSave(payload, files)
      onClose()
    } catch (e) {
      setErr(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{lang === 'zh' ? '编辑卡片' : 'Edit Card'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          {fields.map(f => (
            <div className="field" key={f.key}>
              <label>{lbl(f)}</label>

              {f.type === 'text' && (
                <input value={form[f.key] ?? ''} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
              )}
              {f.type === 'number' && (
                <input type="number" value={form[f.key] ?? ''} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
              )}
              {f.type === 'textarea' && (
                <textarea value={form[f.key] ?? ''} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
              )}
              {f.type === 'select' && (
                <select value={form[f.key] ?? ''} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              {f.type === 'file' && (
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '.6rem',
                  padding: '.6rem .85rem', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.85rem', color: 'var(--text2)',
                }}>
                  <Upload size={15} />
                  {files[f.key] ? files[f.key].name : (lang === 'zh' ? '选择文件…' : 'Choose file…')}
                  <input type="file" accept={f.accept} style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) setFiles(v => ({ ...v, [f.key]: file }))
                    }} />
                </label>
              )}
            </div>
          ))}

          {err && <p style={{ color: 'var(--orange-a)', fontSize: '.85rem' }}>{err}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader size={15} style={{ animation: 'spin .8s linear infinite' }} /> : null}
              {lang === 'zh' ? '保存' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
