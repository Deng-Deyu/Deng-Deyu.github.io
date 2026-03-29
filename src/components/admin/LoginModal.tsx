import { useState } from 'react'
import { X, Lock, Loader } from 'lucide-react'
import { useAppStore } from '@/store'
import { authApi } from '@/lib/api'

interface Props { onClose: () => void }

export function LoginModal({ onClose }: Props) {
  const [pw, setPw]       = useState('')
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAppStore(s => s.login)
  const lang  = useAppStore(s => s.lang)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr('')
    const res = await authApi.login(pw)
    setLoading(false)
    if (res.ok && res.data) {
      login(res.data.token)
      onClose()
    } else {
      setErr(lang === 'zh' ? '密码错误' : 'Invalid password')
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <Lock size={18} color="var(--orange-b)" />
            <h2>{lang === 'zh' ? '管理员登录' : 'Admin Login'}</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field">
            <label>{lang === 'zh' ? '密码' : 'Password'}</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {err && <p style={{ color: 'var(--orange-a)', fontSize: '.85rem' }}>{err}</p>}
          <div className="modal-footer" style={{ marginTop: 0 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader size={16} className="spin" /> : null}
              {lang === 'zh' ? '登录' : 'Login'}
            </button>
          </div>
        </form>
      </div>
      <style>{`.spin { animation: spin .8s linear infinite } @keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
