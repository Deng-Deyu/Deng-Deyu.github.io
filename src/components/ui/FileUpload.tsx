import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useAppStore } from '@/store'
import { fileApi } from '@/lib/api'

interface Props {
  label: string
  accept?: string
  onUploaded: (key: string) => void
  currentKey?: string | null
}

export function FileUpload({ label, accept, onUploaded, currentKey }: Props) {
  const { token, lang } = useAppStore()
  const [uploading, setUploading] = useState(false)
  const [filename, setFilename]   = useState('')
  const [err, setErr]             = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true); setErr('')
    const key = await fileApi.upload(token, file)
    setUploading(false)
    if (key) { setFilename(file.name); onUploaded(key) }
    else setErr(lang === 'zh' ? '上传失败' : 'Upload failed')
  }

  return (
    <label style={{
      display:'flex',alignItems:'center',gap:'.6rem',
      padding:'.6rem .85rem',background:'var(--bg3)',
      border:`1px solid ${err?'var(--orange-a)':'var(--border)'}`,
      borderRadius:'var(--radius-sm)',cursor:'pointer',fontSize:'.85rem',color:'var(--text2)',
    }}>
      <Upload size={15} style={{ color: uploading ? 'var(--orange-b)' : undefined }} />
      {uploading
        ? (lang==='zh' ? '上传中…' : 'Uploading…')
        : filename || (currentKey ? '✓ ' + currentKey.split('/').pop()?.slice(14) : (lang==='zh'?'选择文件…':'Choose file…'))
      }
      <input type="file" accept={accept} style={{ display:'none' }} onChange={handleChange} />
      {err && <span style={{ color:'var(--orange-a)',fontSize:'.75rem' }}>{err}</span>}
    </label>
  )
}
