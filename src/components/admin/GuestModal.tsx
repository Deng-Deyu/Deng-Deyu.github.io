import { useState } from 'react'
import { X, Loader, CheckCircle, Users } from 'lucide-react'
import { useAppStore } from '@/store'
import { guestApi } from '@/lib/api'

interface Props { onClose: () => void }

export function GuestModal({ onClose }: Props) {
  const { lang, guestToken, guestNick, setGuest, clearGuest } = useAppStore()
  const [tab, setTab]     = useState<'apply'|'check'>(guestToken?'check':'apply')
  const [form, setForm]   = useState({ nickname:'', email:'', contact:'', reason:'' })
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState(false)
  const [appliedId, setAppliedId] = useState(guestToken||'')
  const [status, setStatus] = useState<string|null>(null)
  const [err, setErr]     = useState('')

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if(!form.nickname||!form.email){setErr(lang==='zh'?'昵称和邮箱必填':'Nickname and email required');return}
    setSaving(true); setErr('')
    const r = await guestApi.apply(form)
    setSaving(false)
    if(r.ok&&r.data){setAppliedId(r.data.id);setDone(true)}
    else setErr(lang==='zh'?'提交失败，请重试':'Submit failed')
  }

  async function handleCheck() {
    if(!appliedId){setErr(lang==='zh'?'请输入申请 ID':'Enter request ID');return}
    setSaving(true)
    const r = await guestApi.check(appliedId)
    setSaving(false)
    if(r.ok&&r.data){
      setStatus(r.data.status)
      if(r.data.status==='approved') setGuest(appliedId, r.data.nickname||form.nickname)
      if(r.data.status==='rejected') clearGuest()
    } else setErr(lang==='zh'?'未找到申请记录':'Request not found')
  }

  const statusLabel = (s:string|null) => {
    if(s==='approved') return {text:lang==='zh'?'✅ 已批准！你现在可以下载文件了':'✅ Approved! You can now download files.',color:'#22c55e'}
    if(s==='rejected') return {text:lang==='zh'?'❌ 申请被拒绝':'❌ Request rejected.',color:'var(--orange-a)'}
    if(s==='pending')  return {text:lang==='zh'?'⏳ 等待审批中，请稍后再查询':'⏳ Pending review, check back later.',color:'var(--orange-b)'}
    return null
  }

  return (
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal" style={{maxWidth:440}}>
        <div className="modal-header">
          <div style={{display:'flex',alignItems:'center',gap:'.6rem'}}>
            <Users size={18} style={{color:'var(--orange-b)'}}/>
            <h2>{lang==='zh'?'访客下载权限':'Download Access'}</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16}/></button>
        </div>

        {/* Tab */}
        <div style={{display:'flex',gap:'.5rem',marginBottom:'1.5rem'}}>
          <button className={`sub-nav-btn ${tab==='apply'?'active':''}`} onClick={()=>setTab('apply')}>
            {lang==='zh'?'申请权限':'Apply'}
          </button>
          <button className={`sub-nav-btn ${tab==='check'?'active':''}`} onClick={()=>setTab('check')}>
            {lang==='zh'?'查询状态':'Check Status'}
          </button>
        </div>

        {tab==='apply' && !done && (
          <form onSubmit={handleApply} style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
            <p style={{fontSize:'.83rem',color:'var(--text2)',lineHeight:1.6,background:'rgba(255,123,53,.06)',padding:'.75rem 1rem',borderRadius:'var(--r-md)',border:'1.5px solid var(--border)'}}>
              {lang==='zh'
                ?'申请通过后可下载音乐、乐谱和建模文件。站长会通过邮件通知你审批结果。'
                :'After approval, you can download music, scores and model files. You will be notified via email.'}
            </p>
            <div className="field">
              <label>{lang==='zh'?'昵称 *':'Nickname *'}</label>
              <input value={form.nickname} onChange={e=>setForm(v=>({...v,nickname:e.target.value}))} placeholder={lang==='zh'?'你的名字或网名':'Your name'}/>
            </div>
            <div className="field">
              <label>{lang==='zh'?'邮箱 *':'Email *'}</label>
              <input type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} placeholder="your@email.com"/>
            </div>
            <div className="field">
              <label>{lang==='zh'?'联系方式（QQ / 微信）':'Contact (QQ / WeChat)'}</label>
              <input value={form.contact} onChange={e=>setForm(v=>({...v,contact:e.target.value}))} placeholder={lang==='zh'?'选填':'Optional'}/>
            </div>
            <div className="field">
              <label>{lang==='zh'?'申请理由':'Reason'}</label>
              <textarea value={form.reason} onChange={e=>setForm(v=>({...v,reason:e.target.value}))} placeholder={lang==='zh'?'简单说说你想下载的原因…':'Why do you want to download?'}/>
            </div>
            {err && <p style={{color:'var(--orange-a)',fontSize:'.82rem'}}>{err}</p>}
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving?<Loader size={14} className="spin"/>:null}
                {lang==='zh'?'提交申请':'Submit'}
              </button>
            </div>
          </form>
        )}

        {tab==='apply' && done && (
          <div style={{textAlign:'center',padding:'1.5rem 0'}}>
            <CheckCircle size={48} style={{color:'#22c55e',margin:'0 auto 1rem'}}/>
            <h3 style={{fontSize:'1.1rem',fontWeight:800,marginBottom:'.5rem'}}>{lang==='zh'?'申请已提交！':'Application submitted!'}</h3>
            <p style={{color:'var(--text2)',fontSize:'.88rem',lineHeight:1.7,marginBottom:'1.25rem'}}>
              {lang==='zh'
                ?'站长审批后会发邮件通知你。你的申请 ID 是：'
                :'You will be notified by email after review. Your request ID:'}
            </p>
            <code style={{background:'var(--bg3)',padding:'.4rem .8rem',borderRadius:'var(--r-sm)',fontSize:'.78rem',wordBreak:'break-all',display:'block',margin:'0 auto .75rem',color:'var(--orange-b)'}}>{appliedId}</code>
            <p style={{fontSize:'.78rem',color:'var(--text3)'}}>{lang==='zh'?'请保存此 ID 用于查询审批状态。':'Save this ID to check approval status.'}</p>
            <button className="btn-ghost" style={{marginTop:'1rem'}} onClick={()=>{setTab('check')}}>
              {lang==='zh'?'去查询状态 →':'Check status →'}
            </button>
          </div>
        )}

        {tab==='check' && (
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {guestToken && status === null && (
              <div style={{background:'rgba(52,211,153,.08)',border:'1.5px solid rgba(52,211,153,.2)',borderRadius:'var(--r-md)',padding:'.85rem 1rem',fontSize:'.85rem',color:'#22c55e'}}>
                {lang==='zh'?`当前已登录为访客：${guestNick}`:`Logged in as guest: ${guestNick}`}
              </div>
            )}
            <div className="field">
              <label>{lang==='zh'?'申请 ID':'Request ID'}</label>
              <input value={appliedId} onChange={e=>setAppliedId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
            </div>
            {err && <p style={{color:'var(--orange-a)',fontSize:'.82rem'}}>{err}</p>}
            {status && statusLabel(status) && (
              <div style={{background:'var(--bg3)',borderRadius:'var(--r-md)',padding:'.85rem 1rem',fontSize:'.88rem',color:statusLabel(status)!.color,fontWeight:700}}>
                {statusLabel(status)!.text}
              </div>
            )}
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'关闭':'Close'}</button>
              <button className="btn-primary" onClick={handleCheck} disabled={saving}>
                {saving?<Loader size={14} className="spin"/>:null}
                {lang==='zh'?'查询':'Check'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
