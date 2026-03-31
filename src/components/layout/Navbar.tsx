import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, ShieldCheck, LogOut, BookOpen, Music, Box, Award, Home, Code2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { LoginModal } from '@/components/admin/LoginModal'

const NAV = [
  { to:'/notes',    en:'Notes',    zh:'笔记',  Icon:BookOpen },
  { to:'/music',    en:'Music',    zh:'音乐',  Icon:Music    },
  { to:'/projects', en:'Projects', zh:'项目',  Icon:Code2    },
  { to:'/modeling', en:'Modeling', zh:'建模',  Icon:Box      },
  { to:'/honors',   en:'Honors',   zh:'荣誉',  Icon:Award    },
]

export function Navbar() {
  const { lang, toggleLang, theme, toggleTheme, isAdmin, logout } = useAppStore()
  const [loginOpen, setLoginOpen] = useState(false)
  const loc = useLocation()

  return (
    <>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'var(--nav-bg)',backdropFilter:'blur(24px) saturate(180%)',WebkitBackdropFilter:'blur(24px) saturate(180%)',borderBottom:'1px solid var(--border)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 1.5rem',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link to="/" style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:'1.05rem',letterSpacing:'-.01em'}}>
            <span className="grad-text">Turtlelet</span>
          </Link>
          <div className="desk-nav" style={{display:'flex',alignItems:'center',gap:'.15rem'}}>
            {NAV.map(n=>{
              const active=loc.pathname.startsWith(n.to)
              return (
                <Link key={n.to} to={n.to} style={{display:'flex',alignItems:'center',gap:'.38rem',padding:'.38rem .8rem',borderRadius:'var(--radius-sm)',fontSize:'.83rem',fontWeight:600,color:active?'var(--orange-b)':'var(--text2)',background:active?'rgba(255,107,26,.08)':'transparent',transition:'all var(--trans)'}}>
                  <n.Icon size={13}/>{lang==='zh'?n.zh:n.en}
                </Link>
              )
            })}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
            <button className="btn-icon" onClick={toggleLang} style={{fontFamily:"'Space Mono',monospace",fontSize:'.68rem',fontWeight:700,width:'auto',padding:'0 .65rem',letterSpacing:'.04em'}}>
              {lang==='en'?'EN':'中'}
            </button>
            <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
              {theme==='dark'?<Sun size={14}/>:<Moon size={14}/>}
            </button>
            {isAdmin
              ?<button className="btn-icon" onClick={logout} title="Logout"><LogOut size={14}/></button>
              :<button className="btn-icon" onClick={()=>setLoginOpen(true)} title="Admin"><ShieldCheck size={14}/></button>
            }
          </div>
        </div>
      </nav>
      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {[{to:'/',en:'Home',zh:'首页',Icon:Home},...NAV].map(n=>{
          const active=n.to==='/'?loc.pathname===='/':loc.pathname.startsWith(n.to)
          return (
            <Link key={n.to} to={n.to} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.18rem',padding:'.35rem .4rem',color:active?'var(--orange-b)':'var(--text3)',fontSize:'.58rem',fontWeight:600,minWidth:44,textAlign:'center'}}>
              <n.Icon size={19}/>{lang==='zh'?n.zh:n.en}
            </Link>
          )
        })}
        {isAdmin
          ?<button onClick={logout} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.18rem',background:'none',border:'none',color:'var(--orange-b)',fontSize:'.58rem',padding:'.35rem .4rem',cursor:'pointer'}}><LogOut size={19}/>{lang==='zh'?'退出':'Out'}</button>
          :<button onClick={()=>setLoginOpen(true)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.18rem',background:'none',border:'none',color:'var(--text3)',fontSize:'.58rem',padding:'.35rem .4rem',cursor:'pointer'}}><ShieldCheck size={19}/>{lang==='zh'?'登录':'Login'}</button>
        }
      </nav>
      <style>{`@media(max-width:768px){.desk-nav{display:none!important}}`}</style>
      {loginOpen&&<LoginModal onClose={()=>setLoginOpen(false)}/>}
    </>
  )
}
