import { useAppStore } from '@/store'

const TAGS = ['Software', 'Music', '3D Modeling', 'Mathematics', 'Engineering']

export function HeroSection() {
  const { lang } = useAppStore()

  return (
    <section id="hero" className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden px-8">
      {/* 呼吸光晕 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-60 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(100, 150, 255, 0.15) 0%, transparent 70%)', animation: 'pulse-glow 6s infinite' }} />

      <div className="relative z-10 text-center max-w-3xl glass-card-3d p-12 rounded-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary font-mono text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {lang === 'zh' ? '开放合作 · 创造者' : 'Open to collaboration · Creator'}
        </div>

        <span className="block font-mono text-xl text-gray-400 mb-2 tracking-wider">
          {lang === 'zh' ? '你好，我是' : "Hi, I'm"}
        </span>

        <h1 className="text-glow-3d font-sans text-6xl md:text-8xl font-black leading-none mb-6 tracking-tighter">
          Turtlelet
        </h1>

        <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-xl mx-auto mb-8">
          {lang === 'zh'
            ? '开发者 · 音乐爱好者 · 建模师。我构建事物，学习知识，并记录每一段旅程。'
            : 'Developer · musician · modeler. I build things, learn things, and document the journey.'}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {TAGS.map(tag => (
            <span key={tag} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-gray-300 backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <a href="#notes" className="px-8 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(100,150,255,0.4)]">
            {lang === 'zh' ? '开始探索' : 'Explore Now'}
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%,100% { opacity:.4; transform:translate(-50%,-50%) scale(1); }
          50%      { opacity:.8;  transform:translate(-50%,-50%) scale(1.1); }
        }
      `}</style>
    </section>
  )
}