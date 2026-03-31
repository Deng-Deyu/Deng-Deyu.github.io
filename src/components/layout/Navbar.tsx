import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, ShieldCheck, LogOut, BookOpen, Music, Box, Award, Home, Code } from 'lucide-react'
import { useAppStore } from '@/store'
import { LoginModal } from '@/components/admin/LoginModal'

const NAV = [
  { to: '/notes',    en: 'Notes',    zh: '笔记',  icon: <BookOpen size={14}/> },
  { to: '/software', en: 'Software', zh: '软件',  icon: <Code size={14}/> },
  { to: '/music',    en: 'Music',    zh: '音乐',  icon: <Music size={14}/> },
  { to: '/modeling', en: 'Modeling', zh: '建模',  icon: <Box size={14}/> },
  { to: '/honors',   en: 'Honors',   zh: '荣誉',  icon: <Award size={14}/> },
]

export function Navbar() {
  const { lang, toggleLang, theme, toggleTheme, isAdmin, logout } = useAppStore()
  const [loginOpen, setLoginOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'var(--nav-bg)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 1.5rem',height:64,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link to="/" style={{ fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:'1.2rem' }}>
            <span className="text-glow-3d">Turtlelet</span>
          </Link>
          <div style={{ display:'flex',alignItems:'center',gap:'.2rem' }} className="desk-nav">
            {NAV.map(n => (
              <Link key={n.to} to={n.to} style={{
                display:'flex',alignItems:'center',gap:'.4rem', padding:'.4rem .8rem',borderRadius:'var(--radius-sm)',
                fontSize:'.84rem',fontWeight:600, color: location.pathname.startsWith(n.to) ? 'var(--orange-b)' : 'var(--text2)',
                background: location.pathname.startsWith(n.to) ? 'rgba(59, 130, 246, 0.1)' : 'transparent', transition:'all var(--trans)'
              }}>
                {n.icon}{lang==='zh'?n.zh:n.en}
              </Link>
            ))}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:'.4rem' }}>
            <button className="btn-icon" onClick={toggleLang} style={{ fontFamily:"'Space Mono',monospace",fontSize:'.7rem',fontWeight:700,width:'auto',padding:'0 .7rem' }}>{lang==='en'?'EN':'中'}</button>
            <button className="btn-icon" onClick={toggleTheme}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}</button>
            {isAdmin ? <button className="btn-icon" onClick={logout}><LogOut size={15}/></button> : <button className="btn-icon" onClick={()=>setLoginOpen(true)}><ShieldCheck size={15}/></button>}
          </div>
        </div>
      </nav>
      {/* 保持手机端菜单逻辑 */}
      {loginOpen && <LoginModal onClose={()=>setLoginOpen(false)}/>}
    </>
  )
}