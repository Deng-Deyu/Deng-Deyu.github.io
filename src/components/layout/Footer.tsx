import { useAppStore } from '@/store'

export function Footer() {
  const { lang } = useAppStore()
  return (
    <footer style={{ padding: '2rem', borderTop: '1px solid var(--border)' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <span className="grad-text" style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '.9rem' }}>
          Turtlelet
        </span>
        <span style={{ fontSize: '.78rem', color: 'var(--text3)', fontFamily: "'Space Mono',monospace" }}>
          © {new Date().getFullYear()} · {lang === 'zh' ? '用 ♥ 构建' : 'Built with ♥'}
        </span>
      </div>
    </footer>
  )
}
