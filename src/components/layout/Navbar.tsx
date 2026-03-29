import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, Menu, X, ShieldCheck, LogOut } from 'lucide-react'
import { useAppStore } from '@/store'
import { LoginModal } from '@/components/admin/LoginModal'

const NAV_ITEMS = [
  { href: '#journey', en: 'Journey',  zh: '心路历程' },
  { href: '#notes',   en: 'Notes',    zh: '笔记'     },
  { href: '#music',   en: 'Music',    zh: '音乐'     },
  { href: '#videos',  en: 'Videos',   zh: '视频'     },
  { href: '#modeling',en: 'Modeling', zh: '建模'     },
  { href: '#honors',  en: 'Honors',   zh: '荣誉'     },
  { href: '#contact', en: 'Contact',  zh: '联系'     },
]

export function Navbar() {
  const { lang, toggleLang, theme, toggleTheme, isAdmin, logout } = useAppStore()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const location = useLocation()
  const isHome   = location.pathname === '/'

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 2rem',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link to="/" style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '1.1rem' }}>
            <span className="grad-text">Turtlelet</span>
          </Link>

          {/* Desktop nav links (only show on home) */}
          {isHome && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }} className="desktop-nav">
              {NAV_ITEMS.map(item => (
                <a key={item.href} href={item.href} style={{
                  padding: '.4rem .85rem', borderRadius: 'var(--radius-sm)',
                  fontSize: '.85rem', fontWeight: 600, color: 'var(--text2)',
                  transition: 'color var(--trans)',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--orange-b)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--text2)' }}
                >
                  {lang === 'zh' ? item.zh : item.en}
                </a>
              ))}
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <button
              className="btn-icon"
              onClick={toggleLang}
              style={{ fontFamily: "'Space Mono',monospace", fontSize: '.7rem', fontWeight: 700, width: 'auto', padding: '0 .75rem', letterSpacing: '.05em' }}
            >
              {lang === 'en' ? 'EN' : '中'}
            </button>
            <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {isAdmin ? (
              <button className="btn-icon" onClick={logout} title="Logout">
                <LogOut size={15} />
              </button>
            ) : (
              <button className="btn-icon" onClick={() => setLoginOpen(true)} title="Admin login">
                <ShieldCheck size={15} />
              </button>
            )}

            {/* Mobile hamburger */}
            <button className="btn-icon" onClick={() => setMenuOpen(v => !v)} style={{ display: 'none' }} id="hamburger">
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            background: 'var(--nav-bg)', borderBottom: '1px solid var(--border)',
            padding: '1rem 2rem', display: 'flex', flexDirection: 'column', gap: '.25rem',
          }}>
            {NAV_ITEMS.map(item => (
              <a key={item.href} href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{ padding: '.5rem 0', color: 'var(--text2)', fontSize: '.9rem', fontWeight: 600 }}
              >
                {lang === 'zh' ? item.zh : item.en}
              </a>
            ))}
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          #hamburger { display: flex !important; }
        }
      `}</style>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  )
}
