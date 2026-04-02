import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, ShieldCheck, LogOut, BookOpen, Music, Box, Award, Home, Code2, Users } from 'lucide-react'
import { useAppStore } from '@/store'
import { LoginModal } from '@/components/admin/LoginModal'
import { GuestModal } from '@/components/admin/GuestModal'

const NAV = [
  {to:'/notes',    en:'Notes',    zh:'笔记',  Icon:BookOpen},
  {to:'/music',    en:'Music',    zh:'音乐',  Icon:Music   },
  {to:'/projects', en:'Projects', zh:'项目',  Icon:Code2   },
  {to:'/modeling', en:'Modeling', zh:'建模',  Icon:Box     },
  {to:'/honors',   en:'Honors',   zh:'荣誉',  Icon:Award   },
]

export function Navbar() {
  const {lang,toggleLang,theme,toggleTheme,isAdmin,logout,guestToken,guestNick} = useAppStore()
  const [loginOpen, setLoginOpen]   = useState(false)
  const [guestOpen, setGuestOpen]   = useState(false)
  const loc = useLocation()

  return (
    <>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'var(--nav-bg)',backdropFilter:'blur(24px) saturate(160%)',WebkitBackdropFilter:'blur(24px)',borderBottom:'1.5px solid var(--border)'}}>
        <div style={{maxWidth:1160,margin:'0 auto',padding:'0 1.5rem',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {/* Logo */}
          <Link to="/" style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:'1.08rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span className="grad-text">Turtlelet</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:'.65rem',color:'var(--text3)',fontWeight:400,opacity:.7}}>
              {lang==='zh'?'· 小龟':''}
            </span>
          </Link>

          {/* Desktop links */}
          <div className="desk-nav" style={{display:'flex',alignItems:'center',gap:'.15rem'}}>
            {NAV.map(n=>{
              const active=loc.pathname.startsWith(n.to)
              return (
                <Link key={n.to} to={n.to} style={{display:'flex',alignItems:'center',gap:'.38rem',padding:'.38rem .85rem',borderRadius:'var(--r-xl)',fontSize:'.83rem',fontWeight:800,color:active?'var(--accent)':'var(--text2)',background:active?'var(--glow-rgb,rgba(45,179,106,.1)':'transparent',transition:'all var(--trans)'}}>
                  <n.Icon size={13}/>{lang==='zh'?n.zh:n.en}
                </Link>
              )
            })}
          </div>

          {/* Controls */}
          <div style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
            {/* Guest chip */}
            {guestToken && !isAdmin && (
              <span className="guest-chip" onClick={()=>setGuestOpen(true)} title={lang==='zh'?'访客身份':'Guest access'}>
                <Users size={12}/>{guestNick||'访客'}
              </span>
            )}
            {!guestToken && !isAdmin && (
              <button className="btn-ghost" style={{padding:'.3rem .8rem',fontSize:'.75rem',fontWeight:800,borderRadius:'var(--r-xl)'}} onClick={()=>setGuestOpen(true)}>
                {lang==='zh'?'申请下载':'Request Access'}
              </button>
            )}

            <button className="btn-icon" onClick={toggleLang} style={{fontFamily:"'Nunito',sans-serif",fontSize:'.7rem',fontWeight:900,width:'auto',padding:'0 .65rem',letterSpacing:'.03em',borderRadius:'var(--r-xl)'}}>
              {lang==='en'?'EN':'中'}
            </button>
            <button className="btn-icon" onClick={toggleTheme} style={{borderRadius:'var(--r-sm)'}} title="主题">
              {theme==='dark'?<Sun size={14}/>:<Moon size={14}/>}
            </button>
            {isAdmin
              ?<button className="btn-icon" onClick={logout} title="退出" style={{borderRadius:'var(--r-sm)'}}><LogOut size={14}/></button>
              :<button className="btn-icon" onClick={()=>setLoginOpen(true)} title="管理员" style={{borderRadius:'var(--r-sm)'}}><ShieldCheck size={14}/></button>
            }
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {[{to:'/',en:'Home',zh:'首页',Icon:Home},...NAV].map(n=>{
          const isRoot=n.to==='/'
          const active=isRoot?(loc.pathname==='/'):(loc.pathname.startsWith(n.to))
          return (
            <Link key={n.to} to={n.to} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.18rem',padding:'.35rem .4rem',color:active?'var(--accent)':'var(--text3)',fontSize:'.58rem',fontWeight:800,minWidth:44,textAlign:'center'}}>
              <n.Icon size={19}/>{lang==='zh'?n.zh:n.en}
            </Link>
          )
        })}
        {isAdmin
          ?<button onClick={logout} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.18rem',background:'none',border:'none',color:'var(--accent)',fontSize:'.58rem',padding:'.35rem .4rem',cursor:'pointer',fontWeight:800}}><LogOut size={19}/>{lang==='zh'?'退出':'Out'}</button>
          :<button onClick={()=>setLoginOpen(true)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.18rem',background:'none',border:'none',color:'var(--text3)',fontSize:'.58rem',padding:'.35rem .4rem',cursor:'pointer',fontWeight:800}}><ShieldCheck size={19}/>{lang==='zh'?'登录':'Login'}</button>
        }
      </nav>

      <style>{`@media(max-width:768px){.desk-nav{display:none!important}}`}</style>
      {loginOpen && <LoginModal onClose={()=>setLoginOpen(false)}/>}
      {guestOpen && <GuestModal onClose={()=>setGuestOpen(false)}/>}
    </>
  )
}
