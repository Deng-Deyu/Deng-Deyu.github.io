import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, ShieldCheck, LogOut, BookOpen, Music, Box, Award, Home } from 'lucide-react'
import { useAppStore } from '@/store'
import { LoginModal } from '@/components/admin/LoginModal'

const NAV = [
  { to: '/notes',    en: 'Notes',    zh: '笔记',  icon: <BookOpen size={14}/> },
  { to: '/music',    en: 'Music',    zh: '音乐',  icon: <Music size={14}/> },
  { to: '/modeling', en: 'Modeling', zh: '建模',  icon: <Box size={14}/> },
  { to: '/honors',   en: 'Honors',   zh: '荣誉',  icon: <Award size={14}/> },
]

export function Navbar() {
  const { lang, toggleLang, theme, toggleTheme, isAdmin, logout } = useAppStore()
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const location = useLocation()

  return (
    <>
      <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'var(--nav-bg)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 1.5rem',height:64,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link to="/" style={{ fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:'1.05rem' }}>
            <span className="grad-text">Turtlelet</span>
          </Link>

          {/* Desktop links */}
          <div style={{ display:'flex',alignItems:'center',gap:'.2rem' }} className="desk-nav">
            {NAV.map(n => (
              <Link key={n.to} to={n.to} style={{
                display:'flex',alignItems:'center',gap:'.4rem',
                padding:'.4rem .8rem',borderRadius:'var(--radius-sm)',
                fontSize:'.84rem',fontWeight:600,
                color: location.pathname.startsWith(n.to) ? 'var(--orange-b)' : 'var(--text2)',
                background: location.pathname.startsWith(n.to) ? 'rgba(255,107,26,.1)' : 'transparent',
                transition:'all var(--trans)',
              }}>
                {n.icon}{lang==='zh'?n.zh:n.en}
              </Link>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display:'flex',alignItems:'center',gap:'.4rem' }}>
            <button className="btn-icon" onClick={toggleLang}
              style={{ fontFamily:"'Space Mono',monospace",fontSize:'.7rem',fontWeight:700,width:'auto',padding:'0 .7rem' }}>
              {lang==='en'?'EN':'中'}
            </button>
            <button className="btn-icon" onClick={toggleTheme}>
              {theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}
            </button>
            {isAdmin
              ? <button className="btn-icon" onClick={logout} title="Logout"><LogOut size={15}/></button>
              : <button className="btn-icon" onClick={()=>setLoginOpen(true)} title="Admin"><ShieldCheck size={15}/></button>
            }
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <MobileNavItem to="/" icon={<Home size={20}/>} label={lang==='zh'?'首页':'Home'} active={location.pathname==='/'} />
        {NAV.map(n => (
          <MobileNavItem key={n.to} to={n.to} icon={n.icon} label={lang==='zh'?n.zh:n.en} active={location.pathname.startsWith(n.to)} />
        ))}
        {isAdmin
          ? <button onClick={logout} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'.2rem',background:'none',border:'none',color:'var(--orange-b)',fontSize:'.62rem',padding:'.4rem .5rem' }}>
              <LogOut size={20}/> {lang==='zh'?'退出':'Out'}
            </button>
          : <button onClick={()=>setLoginOpen(true)} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'.2rem',background:'none',border:'none',color:'var(--text3)',fontSize:'.62rem',padding:'.4rem .5rem' }}>
              <ShieldCheck size={20}/> {lang==='zh'?'登录':'Login'}
            </button>
        }
      </nav>

      <style>{`.desk-nav{} @media(max-width:768px){.desk-nav{display:none!important}}`}</style>
      {loginOpen && <LoginModal onClose={()=>setLoginOpen(false)}/>}
    </>
  )
}

function MobileNavItem({ to, icon, label, active }: { to:string; icon:React.ReactNode; label:string; active:boolean }) {
  return (
    <Link to={to} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'.2rem',padding:'.4rem .5rem',color:active?'var(--orange-b)':'var(--text3)',fontSize:'.62rem',fontWeight:600,minWidth:52,textAlign:'center' }}>
      {icon}{label}
    </Link>
  )
}
