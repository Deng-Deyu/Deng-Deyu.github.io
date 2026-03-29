import { Mail, Github, MessageCircle, Send } from 'lucide-react'
import { useAppStore } from '@/store'

// ── 修改这里填入你的真实联系方式 ──────────────────────────────
const CONTACT_LINKS = [
  {
    icon: <Mail size={17} />,
    label_en: 'Email',
    label_zh: '邮箱',
    sub: 'your@email.com',
    href: 'mailto:your@email.com',
  },
  {
    icon: <Github size={17} />,
    label_en: 'GitHub',
    label_zh: 'GitHub',
    sub: 'github.com/Deng-Deyu',
    href: 'https://github.com/Deng-Deyu',
  },
  {
    icon: <span style={{ fontSize: '1rem' }}>📺</span>,
    label_en: 'Bilibili',
    label_zh: '哔哩哔哩',
    sub: '@小龟不吹0v0',
    href: 'https://space.bilibili.com/',
  },
  {
    icon: <span style={{ fontSize: '1rem' }}>🎬</span>,
    label_en: 'Douyin',
    label_zh: '抖音',
    sub: '@Turtlelet · 27068227398',
    href: 'https://www.douyin.com/user/27068227398',
  },
  {
    icon: <MessageCircle size={17} />,
    label_en: 'WeChat',
    label_zh: '微信',
    sub: 'Add your handle here',
    href: '#',
  },
]

export function ContactSection() {
  const { lang } = useAppStore()

  return (
    <section id="contact" className="section-pad" style={{ background: 'var(--bg2)' }}>
      <div className="section-inner">
        <div className="section-header reveal" style={{ marginBottom: '2rem' }}>
          <span className="section-label">// reach out</span>
          <h2 className="section-title">
            {lang === 'zh' ? '联系我' : 'Contact'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}
          className="contact-grid">

          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }} className="reveal">
            {CONTACT_LINKS.map((link, i) => (
              <a key={i} href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  borderRadius: 'var(--radius)', backdropFilter: 'blur(12px)',
                  transition: 'all var(--trans)',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-h)'
                  ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateX(4px)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--card-border)'
                  ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateX(0)'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg3)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: 'var(--text2)',
                }}>{link.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem' }}>
                    {lang === 'zh' ? link.label_zh : link.label_en}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: "'Space Mono',monospace" }}>
                    {link.sub}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* CTA card */}
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)', padding: '2.5rem',
            backdropFilter: 'blur(12px)',
          }} className="reveal">
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.75rem' }}>
              {lang === 'zh' ? '欢迎联系我 🐢' : "Let's connect 🐢"}
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: '.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {lang === 'zh'
                ? '无论你想合作项目、交流想法，还是只是打个招呼——我都很高兴收到你的消息。通常会在几天内回复。'
                : 'Whether you want to collaborate on a project, discuss ideas, or just say hi — I\'m always happy to hear from you. Expect a reply within a few days.'}
            </p>
            <a href="mailto:your@email.com" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}>
              <Send size={15} />
              {lang === 'zh' ? '发送邮件' : 'Send me an email'}
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </section>
  )
}
