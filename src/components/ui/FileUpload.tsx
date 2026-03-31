import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store'
import { fileApi } from '@/lib/api'

interface Props {
  accept?: string
  onUploaded: (key: string) => void
  currentKey?: string | null
  hint?: string
}

export function FileUpload({ accept, onUploaded, currentKey, hint }: Props) {
  const { token, lang } = useAppStore()
  const [uploading, setUploading] = useState(false)
  const [filename, setFilename]   = useState('')
  const [err, setErr]             = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true); setErr(''); setFilename('')
    const key = await fileApi.upload(token, file)
    setUploading(false)
    if (key) { setFilename(file.name); onUploaded(key) }
    else setErr(lang === 'zh' ? '上传失败，请重试' : 'Upload failed, please retry')
  }

  const existingName = currentKey ? currentKey.split('/').pop()?.replace(/^\d+-/, '') : ''

  return (
    <div>
      <label style={{
        display:'flex',alignItems:'center',gap:'.6rem',
        padding:'.6rem .85rem',background:'var(--bg3)',
        border:`1px solid ${err?'var(--orange-a)':'var(--border)'}`,
        borderRadius:'var(--radius-sm)',cursor:'pointer',
        fontSize:'.85rem',color:'var(--text2)',transition:'border-color var(--trans)',
      }}
      onMouseEnter={e=>(e.currentTarget as HTMLLabelElement).style.borderColor='var(--border-h)'}
      onMouseLeave={e=>(e.currentTarget as HTMLLabelElement).style.borderColor=err?'var(--orange-a)':'var(--border)'}
      >
        {uploading
          ? <span style={{width:14,height:14,border:'2px solid var(--orange-b)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>
          : filename || existingName
            ? <CheckCircle size={14} style={{color:'#34d399',flexShrink:0}}/>
            : <Upload size={14} style={{flexShrink:0}}/>
        }
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
          {uploading ? (lang==='zh'?'上传中…':'Uploading…')
            : filename || (existingName ? `✓ ${existingName}` : (lang==='zh'?'选择文件…':'Choose file…'))}
        </span>
        <input type="file" accept={accept} style={{display:'none'}} onChange={handleChange} />
      </label>
      {hint && !err && <p style={{fontSize:'.72rem',color:'var(--text3)',marginTop:'.3rem'}}>{hint}</p>}
      {err && (
        <p style={{display:'flex',alignItems:'center',gap:'.3rem',fontSize:'.75rem',color:'var(--orange-a)',marginTop:'.3rem'}}>
          <AlertCircle size={12}/>{err}
        </p>
      )}
    </div>
  )
}
