import { useAppStore } from '@/store'

const TAGS = ['Engineering', 'Music', '3D Modeling', 'Mathematics', 'Code']

export function HeroSection() {
  const { lang } = useAppStore()

  return (
    <section id="hero" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '0 2rem',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 70%)',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute', width: 800, height: 800, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(255,107,26,.12) 0%,transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-55%)',
        pointerEvents: 'none', animation: 'pulse-glow 6s ease-in-out infinite',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 800 }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '.5rem',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 100, padding: '.35rem 1rem',
          fontSize: '.78rem', fontFamily: "'Space Mono',monospace",
          color: 'var(--orange-b)', marginBottom: '2rem',
          letterSpacing: '.05em', animation: 'fade-up .8s ease both',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--orange-a)', animation: 'blink 1.5s ease-in-out infinite',
          }} />
          {lang === 'zh' ? '开放合作 · 学生 · 创作者' : 'Open to collaboration · Student · Creator'}
        </div>

        {/* Hi, I'm */}
        <span style={{
          fontFamily: "'Space Mono',monospace",
          fontSize: 'clamp(1rem,2.5vw,1.3rem)',
          color: 'var(--text3)', display: 'block', marginBottom: '.5rem',
          animation: 'fade-up .8s .1s ease both', letterSpacing: '.08em',
        }}>
          {lang === 'zh' ? '你好，我是' : "Hi, I'm"}
        </span>

        {/* Name */}
        <h1 style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: 'clamp(3.5rem,10vw,8rem)',
          fontWeight: 800, lineHeight: .95, letterSpacing: '-.04em',
          animation: 'fade-up .8s .2s ease both',
          position: 'relative', display: 'inline-block',
        }}>
          <span className="grad-text">Turtle</span>
          <span>let</span>
          {/* Animated underline */}
          <span style={{
            position: 'absolute', bottom: -8, left: 0, right: 0,
            height: 3, borderRadius: 2,
            background: 'linear-gradient(135deg,var(--orange-a),var(--orange-b),var(--orange-c))',
            transform: 'scaleX(0)', transformOrigin: 'left',
            animation: 'underline-in .6s .9s cubic-bezier(.4,0,.2,1) forwards',
          }} />
        </h1>

        {/* Description */}
        <p style={{
          marginTop: '2rem', fontSize: 'clamp(1rem,2vw,1.15rem)',
          color: 'var(--text2)', maxWidth: 500, marginInline: 'auto',
          animation: 'fade-up .8s .35s ease both', lineHeight: 1.7,
        }}>
          {lang === 'zh'
            ? '学生 · 开发者 · 音乐人 · 建模师 · 创造者。我构建事物，学习知识，并记录每一段旅程。'
            : 'Student · developer · musician · modeler · maker. I build things, learn things, and document the journey along the way.'}
        </p>

        {/* Tags */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '.5rem',
          justifyContent: 'center', marginTop: '1.5rem',
          animation: 'fade-up .8s .45s ease both',
        }}>
          {TAGS.map(tag => (
            <span key={tag} style={{
              padding: '.3rem .8rem',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 100, fontSize: '.78rem', color: 'var(--text3)',
              fontFamily: "'Space Mono',monospace", letterSpacing: '.03em',
            }}>{tag}</span>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{
          marginTop: '2.5rem', display: 'flex', gap: '1rem',
          justifyContent: 'center', flexWrap: 'wrap',
          animation: 'fade-up .8s .55s ease both',
        }}>
          <a href="#notes" className="btn-primary">
            {lang === 'zh' ? '浏览笔记' : 'Explore Notes'}
            <span>→</span>
          </a>
          <a href="#contact" className="btn-ghost">
            {lang === 'zh' ? '联系我' : 'Get in Touch'}
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem',
        color: 'var(--text3)', fontSize: '.7rem', fontFamily: "'Space Mono',monospace",
        letterSpacing: '.1em', animation: 'fade-up .8s 1s ease both',
      }}>
        <div style={{
          width: 1, height: 40,
          background: 'linear-gradient(to bottom,var(--orange-a),transparent)',
          animation: 'scroll-line 1.5s ease-in-out infinite',
        }} />
        <span>{lang === 'zh' ? '滚动' : 'SCROLL'}</span>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%,100% { opacity:.6; transform:translate(-50%,-55%) scale(1); }
          50%      { opacity:1;  transform:translate(-50%,-55%) scale(1.1); }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes underline-in { to { transform:scaleX(1); } }
        @keyframes blink {
          0%,100% { opacity:1; }
          50%     { opacity:.3; }
        }
        @keyframes scroll-line {
          0%   { transform:scaleY(1); opacity:1; }
          100% { transform:scaleY(.3); opacity:0; }
        }
      `}</style>
    </section>
  )
}
