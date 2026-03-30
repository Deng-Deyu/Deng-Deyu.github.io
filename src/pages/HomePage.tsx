import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Music, Box, Award, ArrowRight, Clock, FileText } from 'lucide-react'
import { useAppStore } from '@/store'
import { summaryApi, timelineApi, fmtDate } from '@/lib/api'
import type { Summary, TimelineItem } from '@/types'

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  const { lang } = useAppStore()
  return (
    <section style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',padding:'0 2rem' }}>
      <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',backgroundSize:'60px 60px',maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 70%)' }} />
      <div style={{ position:'absolute',width:800,height:800,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,107,26,.12) 0%,transparent 70%)',top:'50%',left:'50%',transform:'translate(-50%,-55%)',pointerEvents:'none',animation:'pulse-glow 6s ease-in-out infinite' }} />
      <div style={{ position:'relative',zIndex:2,textAlign:'center',maxWidth:800 }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:'.5rem',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:100,padding:'.35rem 1rem',fontSize:'.78rem',fontFamily:"'Space Mono',monospace",color:'var(--orange-b)',marginBottom:'2rem',letterSpacing:'.05em',animation:'fade-up .8s ease both' }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--orange-a)',animation:'blink 1.5s ease-in-out infinite' }} />
          {lang==='zh'?'开放合作 · 学生 · 创作者':'Open to collaboration · Student · Creator'}
        </div>
        <span style={{ fontFamily:"'Space Mono',monospace",fontSize:'clamp(1rem,2.5vw,1.3rem)',color:'var(--text3)',display:'block',marginBottom:'.5rem',animation:'fade-up .8s .1s ease both',letterSpacing:'.08em' }}>
          {lang==='zh'?'你好，我是':"Hi, I'm"}
        </span>
        <h1 style={{ fontFamily:"'Syne',sans-serif",fontSize:'clamp(3.5rem,10vw,8rem)',fontWeight:800,lineHeight:.95,letterSpacing:'-.04em',animation:'fade-up .8s .2s ease both',position:'relative',display:'inline-block' }}>
          <span className="grad-text">Turtle</span><span>let</span>
          <span style={{ position:'absolute',bottom:-8,left:0,right:0,height:3,borderRadius:2,background:'linear-gradient(135deg,var(--orange-a),var(--orange-b),var(--orange-c))',transform:'scaleX(0)',transformOrigin:'left',animation:'underline-in .6s .9s cubic-bezier(.4,0,.2,1) forwards' }} />
        </h1>
        <p style={{ marginTop:'2rem',fontSize:'clamp(1rem,2vw,1.15rem)',color:'var(--text2)',maxWidth:500,marginInline:'auto',animation:'fade-up .8s .35s ease both',lineHeight:1.7 }}>
          {lang==='zh'
            ? '学生 · 工程师 · 音乐爱好者 · 建模师 · 创造者。我构建事物，学习知识，并记录每一段旅程。'
            : 'Student · engineer · music lover · modeler · maker. I build things, learn things, and document the journey.'}
        </p>
        <div style={{ display:'flex',flexWrap:'wrap',gap:'.5rem',justifyContent:'center',marginTop:'1.5rem',animation:'fade-up .8s .45s ease both' }}>
          {['Engineering','Music','3D Modeling','Mathematics','Code'].map(t => (
            <span key={t} style={{ padding:'.3rem .8rem',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:100,fontSize:'.78rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{t}</span>
          ))}
        </div>
        <div style={{ marginTop:'2.5rem',display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap',animation:'fade-up .8s .55s ease both' }}>
          <a href="#modules" className="btn-primary">{lang==='zh'?'探索内容':'Explore'} →</a>
          <a href="#contact" className="btn-ghost">{lang==='zh'?'联系我':'Get in Touch'}</a>
        </div>
      </div>
      <div style={{ position:'absolute',bottom:'2.5rem',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:'.4rem',color:'var(--text3)',fontSize:'.7rem',fontFamily:"'Space Mono',monospace",letterSpacing:'.1em',animation:'fade-up .8s 1s ease both' }}>
        <div style={{ width:1,height:40,background:'linear-gradient(to bottom,var(--orange-a),transparent)' }} />
        <span>{lang==='zh'?'滚动':'SCROLL'}</span>
      </div>
    </section>
  )
}

// ── Module cards ──────────────────────────────────────────────────────────────
const MODULES = [
  { to:'/notes',    icon:<BookOpen size={28}/>, en:'Notes & Resources', zh:'笔记与资料',
    desc_en:'Study notes, reference material, and curated resource links organized by subject.',
    desc_zh:'按学科整理的学习笔记、参考资料和推荐资源链接。', color:'#4a9eff' },
  { to:'/music',    icon:<Music size={28}/>,    en:'Music Collection',  zh:'音乐收藏',
    desc_en:'Song collection by artist, plus sheet music for download in multiple formats.',
    desc_zh:'按歌手分类的歌曲收藏，以及可下载的多格式乐谱。', color:'var(--orange-b)' },
  { to:'/modeling', icon:<Box size={28}/>,      en:'3D Modeling',       zh:'建模与设计',
    desc_en:'3D models and CAD designs built with SolidWorks, Blender, and more.',
    desc_zh:'使用 SolidWorks、Blender 等软件创建的三维模型与设计。', color:'#a78bfa' },
  { to:'/honors',   icon:<Award size={28}/>,    en:'Honors & Works',    zh:'荣誉与作品',
    desc_en:'Awards, certificates, and notable works from competitions and projects.',
    desc_zh:'竞赛获奖、证书及代表性作品。', color:'#34d399' },
]

function ModuleCards({ summary }: { summary: Summary | null }) {
  const { lang } = useAppStore()
  const navigate = useNavigate()

  const countMap: Record<string, number> = {
    '/notes':    (summary?.notes.count ?? 0),
    '/music':    (summary?.songs.count ?? 0) + (summary?.scores.count ?? 0),
    '/modeling': summary?.models.count ?? 0,
    '/honors':   summary?.honors.count ?? 0,
  }
  const updatedMap: Record<string, string | null> = {
    '/notes':  summary?.notes.updated_at ?? null,
    '/music':  summary?.songs.updated_at ?? summary?.scores.updated_at ?? null,
  }

  return (
    <section id="modules" style={{ padding:'5rem 2rem',background:'var(--bg2)' }}>
      <div className="section-inner">
        <div style={{ marginBottom:'2.5rem' }} className="reveal">
          <span className="section-label">// explore</span>
          <h2 className="section-title">{lang==='zh'?'我的内容':'My Content'}</h2>
          <p className="section-sub">{lang==='zh'?'点击任意模块查看详细内容。':'Click any module to explore the full content.'}</p>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1.25rem' }}>
          {MODULES.map(m => {
            const count = countMap[m.to] ?? 0
            const upd   = updatedMap[m.to]
            return (
              <button key={m.to} className="card reveal"
                onClick={() => navigate(m.to)}
                style={{ textAlign:'left',cursor:'pointer',border:'none' }}
              >
                <div style={{ width:52,height:52,borderRadius:'var(--radius-sm)',background:`${m.color}18`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1.25rem',color:m.color }}>
                  {m.icon}
                </div>
                <h3 style={{ fontWeight:800,fontSize:'1.1rem',marginBottom:'.5rem' }}>
                  {lang==='zh'?m.zh:m.en}
                </h3>
                <p style={{ fontSize:'.85rem',color:'var(--text2)',lineHeight:1.6,marginBottom:'1rem' }}>
                  {lang==='zh'?m.desc_zh:m.desc_en}
                </p>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div style={{ display:'flex',gap:'.5rem',alignItems:'center' }}>
                    {count > 0 && (
                      <span style={{ display:'flex',alignItems:'center',gap:'.3rem',fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>
                        <FileText size={11}/>{count} {lang==='zh'?'项':'items'}
                      </span>
                    )}
                    {upd && (
                      <span style={{ display:'flex',alignItems:'center',gap:'.3rem',fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>
                        <Clock size={11}/>{fmtDate(upd)}
                      </span>
                    )}
                  </div>
                  <ArrowRight size={16} style={{ color:'var(--text3)' }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Journey ───────────────────────────────────────────────────────────────────
function JourneySection() {
  const { lang, isAdmin, token } = useAppStore()
  const [items, setItems] = useState<TimelineItem[]>([])

  useEffect(() => {
    timelineApi.list().then(r => { if (r.ok && r.data) setItems(r.data) })
  }, [])

  return (
    <section id="journey" style={{ padding:'5rem 2rem',background:'var(--bg)' }}>
      <div className="section-inner">
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3rem',alignItems:'start' }} className="journey-grid">
          <div className="reveal">
            <span className="section-label">// about me</span>
            <h2 className="section-title" style={{ marginBottom:'1.5rem' }}>
              {lang==='zh'?'我的心路历程':'My Journey'}
            </h2>
            <div style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
              {[
                { en:"I'm <strong style='color:var(--orange-b)'>Turtlelet</strong> — a student with broad curiosity spanning engineering, math, music, and 3D design.", zh:"我是 <strong style='color:var(--orange-b)'>Turtlelet</strong>——一个对工程、数学、音乐和三维设计都充满好奇心的学生。" },
                { en:"This site is my digital garden — notes, music, models, and moments I want to remember.", zh:"这个网站是我的数字花园——笔记、音乐、模型，还有我想记住的每一段旅程。" },
                { en:"<strong style='color:var(--orange-b)'>Currently:</strong> Studying, building, and always learning.", zh:"<strong style='color:var(--orange-b)'>目前：</strong>在学习、在创作，始终在成长。" },
              ].map((p,i) => (
                <p key={i} style={{ fontSize:'1rem',color:'var(--text2)',lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html:lang==='zh'?p.zh:p.en }} />
              ))}
            </div>
          </div>
          <div className="reveal">
            {items.map((item, idx) => (
              <div key={item.id} style={{ display:'grid',gridTemplateColumns:'20px 1fr',gap:'1.25rem',paddingBottom:idx<items.length-1?'2rem':0 }}>
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center' }}>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:'var(--grad)',flexShrink:0,marginTop:5 }} />
                  {idx<items.length-1 && <div style={{ width:1,flex:1,background:'var(--border)',marginTop:6 }} />}
                </div>
                <div>
                  <div style={{ fontFamily:"'Space Mono',monospace",fontSize:'.7rem',color:'var(--orange-b)',letterSpacing:'.05em',marginBottom:'.2rem' }}>{item.year}</div>
                  <div style={{ fontWeight:700,fontSize:'.95rem',marginBottom:'.2rem' }}>{lang==='zh'?item.title_zh:item.title_en}</div>
                  <div style={{ fontSize:'.85rem',color:'var(--text2)',lineHeight:1.6 }}>{lang==='zh'?item.desc_zh:item.desc_en}</div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p style={{ color:'var(--text3)',fontSize:'.85rem',fontFamily:"'Space Mono',monospace" }}>
                {lang==='zh'?'暂无内容。':'No entries yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.journey-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ── Contact ───────────────────────────────────────────────────────────────────
function ContactSection() {
  const { lang } = useAppStore()
  const LINKS = [
    { icon:'✉️', label_en:'Email',    label_zh:'邮箱',     sub:'your@email.com',    href:'mailto:your@email.com' },
    { icon:'⌨️', label_en:'GitHub',   label_zh:'GitHub',   sub:'github.com/Deng-Deyu', href:'https://github.com/Deng-Deyu' },
    { icon:'📺', label_en:'Bilibili', label_zh:'哔哩哔哩', sub:'@小龟不吹0v0',       href:'https://space.bilibili.com/' },
    { icon:'🎬', label_en:'Douyin',   label_zh:'抖音',     sub:'ID: 27068227398',    href:'https://www.douyin.com/user/MS4wLjABAAAA27068227398' },
  ]
  return (
    <section id="contact" style={{ padding:'5rem 2rem',background:'var(--bg2)' }}>
      <div className="section-inner">
        <div className="reveal" style={{ marginBottom:'2rem' }}>
          <span className="section-label">// reach out</span>
          <h2 className="section-title">{lang==='zh'?'联系我':'Contact'}</h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3rem',alignItems:'start' }} className="contact-grid">
          <div style={{ display:'flex',flexDirection:'column',gap:'.75rem' }} className="reveal">
            {LINKS.map((l,i) => (
              <a key={i} href={l.href} target={l.href.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
                style={{ display:'flex',alignItems:'center',gap:'1rem',padding:'1rem 1.25rem',background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:'var(--radius)',backdropFilter:'blur(12px)',transition:'all var(--trans)' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border-h)';(e.currentTarget as HTMLAnchorElement).style.transform='translateX(4px)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--card-border)';(e.currentTarget as HTMLAnchorElement).style.transform='translateX(0)'}}>
                <div style={{ width:36,height:36,borderRadius:'var(--radius-sm)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0 }}>{l.icon}</div>
                <div>
                  <div style={{ fontWeight:600,fontSize:'.9rem' }}>{lang==='zh'?l.label_zh:l.label_en}</div>
                  <div style={{ fontSize:'.78rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{l.sub}</div>
                </div>
              </a>
            ))}
          </div>
          <div style={{ background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:'var(--radius)',padding:'2.5rem',backdropFilter:'blur(12px)' }} className="reveal">
            <h3 style={{ fontSize:'1.5rem',fontWeight:800,marginBottom:'.75rem' }}>{lang==='zh'?'欢迎联系我 🐢':"Let's connect 🐢"}</h3>
            <p style={{ color:'var(--text2)',fontSize:'.9rem',lineHeight:1.7,marginBottom:'1.5rem' }}>
              {lang==='zh'?'无论你想合作、交流还是打个招呼，我都很高兴收到你的消息。':'Whether you want to collaborate, share ideas, or just say hi — I\'m always happy to hear from you.'}
            </p>
            <a href="mailto:your@email.com" className="btn-primary" style={{ display:'inline-flex',alignItems:'center',gap:'.5rem' }}>
              {lang==='zh'?'发送邮件':'Send Email'} →
            </a>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.contact-grid{grid-template-columns:1fr!important;gap:2rem!important}}`}</style>
    </section>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function HomePage() {
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    summaryApi.get().then(r => { if (r.ok && r.data) setSummary(r.data) })
    // scroll reveal
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }), { threshold:0.1, rootMargin:'0px 0px -60px 0px' })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <HeroSection />
      <div className="divider" />
      <ModuleCards summary={summary} />
      <div className="divider" />
      <JourneySection />
      <div className="divider" />
      <ContactSection />
    </>
  )
}
