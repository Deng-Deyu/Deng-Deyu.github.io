import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react'
import { useAppStore } from '@/store'
import { guestApi } from '@/lib/api'
import type { GuestRequest } from '@/types'

export function GuestsPage() {
  const { lang, isAdmin, token } = useAppStore()
  const [tab, setTab]       = useState<'pending'|'approved'|'rejected'>('pending')
  const [list, setList]     = useState<GuestRequest[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    if(!token) return
    setLoading(true)
    const r = await guestApi.list(token, tab)
    if(r.ok&&r.data) setList(r.data)
    setLoading(false)
  }
  useEffect(()=>{load()},[tab, token])

  async function approve(id: string) {
    if(!token) return
    await guestApi.approve(token, id)
    await load()
  }
  async function reject(id: string) {
    if(!confirm(lang==='zh'?'确认拒绝？':'Reject this request?')) return
    if(!token) return
    await guestApi.reject(token, id)
    await load()
  }

  if(!isAdmin) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh'}}>
      <p style={{color:'var(--text3)',fontFamily:"'Klee One',cursive"}}>{lang==='zh'?'仅管理员可访问':'Admin only'}</p>
    </div>
  )

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="section-label">{lang==='zh'?'访客管理':'Guest Requests'}</span>
        <h1 className="section-title">{lang==='zh'?'下载权限申请':'Download Requests'}</h1>
      </div>
      <div className="sub-nav">
        {(['pending','approved','rejected'] as const).map(s=>(
          <button key={s} className={`sub-nav-btn ${tab===s?'active':''}`} onClick={()=>setTab(s)}>
            {s==='pending'?`⏳ ${lang==='zh'?'待审批':'Pending'}`
              :s==='approved'?`✅ ${lang==='zh'?'已批准':'Approved'}`
              :`❌ ${lang==='zh'?'已拒绝':'Rejected'}`}
          </button>
        ))}
      </div>
      <div style={{maxWidth:1160,margin:'0 auto',padding:'1.5rem 2rem 4rem'}}>
        {loading && <div style={{textAlign:'center',padding:'3rem',color:'var(--text3)'}}>Loading…</div>}
        {!loading && list.length===0 && (
          <div style={{textAlign:'center',padding:'4rem',color:'var(--text3)',fontFamily:"'Klee One',cursive"}}>
            {lang==='zh'?'暂无申请':'No requests'}
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {list.map(r=>(
            <div key={r.id} style={{background:'var(--card-bg)',border:'1.5px solid var(--card-border)',borderRadius:'var(--r-lg)',padding:'1.4rem',backdropFilter:'blur(12px)'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'.5rem',flexWrap:'wrap'}}>
                    <span style={{fontWeight:900,fontSize:'1rem'}}>{r.nickname}</span>
                    <a href={`mailto:${r.email}`} style={{display:'flex',alignItems:'center',gap:'.3rem',color:'var(--orange-b)',fontSize:'.8rem'}}>
                      <Mail size={13}/>{r.email}
                    </a>
                    {r.contact && <span style={{fontSize:'.78rem',color:'var(--text3)'}}>联系：{r.contact}</span>}
                  </div>
                  {r.reason && (
                    <p style={{fontSize:'.85rem',color:'var(--text2)',lineHeight:1.65,background:'var(--bg3)',padding:'.65rem .85rem',borderRadius:'var(--r-sm)',marginBottom:'.5rem'}}>
                      {r.reason}
                    </p>
                  )}
                  <div style={{fontSize:'.72rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace"}}>
                    {new Date(r.created_at).toLocaleString('zh-CN')} · ID: {r.id.slice(0,8)}…
                  </div>
                </div>
                {tab==='pending' && (
                  <div style={{display:'flex',gap:'.5rem',flexShrink:0}}>
                    <button className="btn-primary" style={{padding:'.5rem 1.1rem',fontSize:'.82rem'}} onClick={()=>approve(r.id)}>
                      <CheckCircle size={14}/>{lang==='zh'?'批准':'Approve'}
                    </button>
                    <button className="btn-ghost" style={{padding:'.5rem 1.1rem',fontSize:'.82rem',color:'var(--orange-a)',borderColor:'rgba(255,123,53,.3)'}} onClick={()=>reject(r.id)}>
                      <XCircle size={14}/>{lang==='zh'?'拒绝':'Reject'}
                    </button>
                  </div>
                )}
                {tab!=='pending' && (
                  <div style={{display:'flex',alignItems:'center',gap:'.4rem',padding:'.4rem .85rem',borderRadius:'var(--r-xl)',background:tab==='approved'?'rgba(52,211,153,.1)':'rgba(255,123,53,.1)',color:tab==='approved'?'#22c55e':'var(--orange-a)',fontSize:'.8rem',fontWeight:800}}>
                    {tab==='approved'?<CheckCircle size={14}/>:<XCircle size={14}/>}
                    {lang==='zh'?(tab==='approved'?'已批准':'已拒绝'):(tab==='approved'?'Approved':'Rejected')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
