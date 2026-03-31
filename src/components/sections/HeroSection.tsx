import { useAppStore } from '@/store'

const TAGS = ['Software', 'Music', '3D Modeling', 'Mathematics', 'Engineering']

export function HeroSection() {
  const { lang } = useAppStore()

  return (
    <section id="hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '0 2rem' }}>
      
      {/* 核心发光特效 */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'pulse-glow 6s infinite', pointerEvents: 'none' }} />

      <div className="card" style={{ maxWidth: 800, textAlign: 'center', zIndex: 10, padding: '3rem 2rem', background: 'rgba(17, 24, 39, 0.4)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.4rem 1.2rem', borderRadius: 100, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: '.8rem', color: 'var(--orange-b)', marginBottom: '2rem', fontFamily: "'Space Mono', monospace" }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange-b)', animation: 'spin 2s infinite linear' }} />
          {lang === 'zh' ? '开放合作 · 创造者' : 'Open to collaboration · Creator'}
        </div>

        <span style={{ display: 'block', fontFamily: "'Space Mono', monospace", fontSize: '1.2rem', color: 'var(--text3)', marginBottom: '.5rem', letterSpacing: '.1em' }}>
          {lang === 'zh' ? '你好，我是' : "Hi, I'm"}
        </span>

        <h1 className="text-glow-3d" style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.05em' }}>
          Turtlelet
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--text2)', maxWidth: 600, margin: '0 auto 2rem', lineHeight: 1.8 }}>
          {lang === 'zh'
            ? '开发者 · 音乐人 · 建模师。我构建事物，学习知识，并记录每一段旅程。'
            : 'Developer · musician · modeler. I build things, learn things, and document the journey.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '.5rem', marginBottom: '2.5rem' }}>
          {TAGS.map(tag => (
            <span key={tag} className="tag tag-gray" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>{tag}</span>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <a href="#notes" className="btn-primary" style={{ padding: '1rem 2.5rem' }}>{lang === 'zh' ? '开始探索' : 'Explore Now'}</a>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </section>
  )
}