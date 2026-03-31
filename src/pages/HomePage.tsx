import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Music, Box, Award, Code2, ArrowRight, Clock, FileText, Plus, Pencil, Trash2, X, Loader } from 'lucide-react'
import { useAppStore } from '@/store'
import { summaryApi, timelineApi, fmtDate } from '@/lib/api'
import type { Summary, TimelineItem } from '@/types'

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  const { lang } = useAppStore()
  const tags = ['Engineering','Music','3D Modeling','Mathematics','Code']
  return (
    <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',padding:'0 2rem'}}>
      {/* refined grid - finer lines, more subtle */}
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',backgroundSize:'80px 80px',maskImage:'radial-gradient(ellipse 70% 70% at 50% 50%,black 0%,transparent 75%)',WebkitMaskImage:'radial-gradient(ellipse 70% 70% at 50% 50%,black 0%,transparent 75%)',opacity:.6}}/>
      {/* ambient glow — two layers for depth */}
      <div style={{position:'absolute',width:900,height:900,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,107,26,.09) 0%,transparent 65%)',top:'50%',left:'50%',transform:'translate(-50%,-58%)',pointerEvents:'none',animation:'pulse-glow 8s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,154,60,.07) 0%,transparent 65%)',top:'40%',left:'55%',transform:'translate(-50%,-50%)',pointerEvents:'none',animation:'pulse-glow 5s ease-in-out infinite .5s'}}/>

      <div style={{position:'relative',zIndex:2,textAlign:'center',maxWidth:820}}>
        {/* badge */}
        <div style={{display:'inline-flex',alignItems:'center',gap:'.5rem',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:100,padding:'.32rem .95rem',fontSize:'.73rem',fontFamily:"'Space Mono',monospace",color:'var(--orange-b)',marginBottom:'2.2rem',letterSpacing:'.06em',animation:'fade-up .9s ease both'}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'var(--orange-a)',animation:'blink 2s ease-in-out infinite'}}/>
          {lang==='zh'?'开放合作 · 学生 · 创造者':'Open to collaboration · Student · Creator'}
        </div>
        {/* hi label */}
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:'clamp(.9rem,2vw,1.1rem)',color:'var(--text3)',display:'block',marginBottom:'.4rem',animation:'fade-up .9s .08s ease both',letterSpacing:'.1em'}}>
          {lang==='zh'?'你好，我是':"Hi, I'm"}
        </span>
        {/* main name — Fraunces for editorial weight */}
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:'clamp(4rem,11vw,9rem)',fontWeight:800,lineHeight:.9,letterSpacing:'-.05em',animation:'fade-up .9s .18s ease both',position:'relative',display:'inline-block'}}>
          <span className="grad-text">Turtle</span><span style={{color:'var(--text)'}}>let</span>
          <span style={{position:'absolute',bottom:-6,left:0,right:0,height:2,borderRadius:1,background:'linear-gradient(90deg,var(--orange-a),var(--orange-b),var(--orange-c))',transform:'scaleX(0)',transformOrigin:'left',animation:'underline-in .7s 1s cubic-bezier(.4,0,.2,1) forwards'}}/>
        </h1>
        {/* description */}
        <p style={{marginTop:'2rem',fontSize:'clamp(.95rem,1.8vw,1.1rem)',color:'var(--text2)',maxWidth:480,marginInline:'auto',animation:'fade-up .9s .3s ease both',lineHeight:1.75,letterSpacing:'.01em'}}>
          {lang==='zh'
            ?'工程学生 · 音乐爱好者 · 建模师。\n构建事物，学习知识，记录每段旅程。'
            :'Engineering student · music lover · 3D modeler.\nBuilding things, learning endlessly.'}
        </p>
        {/* tags */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'.45rem',justifyContent:'center',marginTop:'1.5rem',animation:'fade-up .9s .42s ease both'}}>
          {tags.map(t=>(
            <span key={t} style={{padding:'.28rem .8rem',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:100,fontSize:'.73rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace",letterSpacing:'.03em'}}>{t}</span>
          ))}
        </div>
        {/* CTAs */}
        <div style={{marginTop:'2.4rem',display:'flex',gap:'.85rem',justifyContent:'center',flexWrap:'wrap',animation:'fade-up .9s .52s ease both'}}>
          <a href="#modules" className="btn-primary" style={{padding:'.7rem 1.5rem',fontSize:'.88rem'}}>
            {lang==='zh'?'探索内容':'Explore'} <ArrowRight size={14} style={{display:'inline',verticalAlign:'middle'}}/>
          </a>
          <a href="#contact" className="btn-ghost" style={{padding:'.7rem 1.5rem',fontSize:'.88rem'}}>
            {lang==='zh'?'联系我':'Contact'}
          </a>
        </div>
      </div>
      {/* scroll hint */}
      <div style={{position:'absolute',bottom:'2.2rem',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:'.35rem',color:'var(--text3)',fontSize:'.65rem',fontFamily:"'Space Mono',monospace",letterSpacing:'.12em',animation:'fade-up .9s 1.1s ease both'}}>
        <div style={{width:1,height:36,background:'linear-gradient(to bottom,var(--orange-a),transparent)',animation:'float 2s ease-in-out infinite'}}/>
        <span>{lang==='zh'?'滚动':'SCROLL'}</span>
      </div>
    </section>
  )
}

// ── Module Cards ──────────────────────────────────────────────────────────────
const MODULES = [
  {to:'/notes',    Icon:BookOpen, en:'Notes & Resources', zh:'笔记与资料',    desc_en:'Study notes, reference material, and curated resource links.', desc_zh:'按学科整理的学习笔记与推荐资源。',   color:'#60a5fa'},
  {to:'/music',    Icon:Music,    en:'Music Collection',  zh:'音乐收藏',      desc_en:'Song collection by artist, plus sheet music in multiple formats.', desc_zh:'按歌手分类的音乐，以及多格式乐谱下载。', color:'var(--orange-b)'},
  {to:'/projects', Icon:Code2,    en:'Projects',          zh:'软件项目',      desc_en:'My apps, tools, and plugins — plus software recommendations.', desc_zh:'我的应用、工具与插件，以及软件推荐。', color:'#a78bfa'},
  {to:'/modeling', Icon:Box,      en:'3D Modeling',       zh:'建模与设计',    desc_en:'3D models and CAD designs built with SolidWorks and Blender.', desc_zh:'SolidWorks 与 Blender 等软件创建的三维模型。', color:'#34d399'},
  {to:'/honors',   Icon:Award,    en:'Honors & Works',    zh:'荣誉与作品',    desc_en:'Awards, certificates, and notable achievements.', desc_zh:'竞赛获奖、证书与代表性作品。',              color:'#fbbf24'},
]

function ModuleCards({ summary }: { summary: Summary | null }) {
  const { lang } = useAppStore()
  const navigate = useNavigate()

  const countMap: Record<string,number> = {
    '/notes':    summary?.notes.count??0,
    '/music':    (summary?.songs.count??0)+(summary?.scores.count??0),
    '/projects': summary?.projects.count??0,
    '/modeling': summary?.models.count??0,
    '/honors':   summary?.honors.count??0,
  }
  const updMap: Record<string,string|null> = {
    '/notes':  summary?.notes.updated_at??null,
    '/music':  summary?.songs.updated_at??null,
  }

  return (
    <section id="modules" style={{padding:'5rem 2rem',background:'var(--bg2)'}}>
      <div className="section-inner">
        <div style={{marginBottom:'2.5rem'}} className="reveal">
          <span className="section-label">// explore</span>
          <h2 className="section-title">{lang==='zh'?'我的内容':'My Content'}</h2>
          <p className="section-sub">{lang==='zh'?'点击任意模块查看详细内容。':'Click any module to explore.'}</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1.1rem'}}>
          {MODULES.map(m=>{
            const count=countMap[m.to]??0
            const upd=updMap[m.to]
            return (
              <button key={m.to} className="card reveal" onClick={()=>navigate(m.to)}
                style={{textAlign:'left',cursor:'pointer',border:'none'}}>
                <div style={{width:46,height:46,borderRadius:'var(--radius-sm)',background:`color-mix(in srgb,${m.color} 15%,transparent)`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1.1rem',color:m.color,transition:'transform var(--trans)'}}>
                  <m.Icon size={22}/>
                </div>
                <h3 style={{fontWeight:800,fontSize:'1rem',marginBottom:'.4rem',letterSpacing:'-.01em'}}>
                  {lang==='zh'?m.zh:m.en}
                </h3>
                <p style={{fontSize:'.83rem',color:'var(--text2)',lineHeight:1.65,marginBottom:'.9rem'}}>
                  {lang==='zh'?m.desc_zh:m.desc_en}
                </p>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',gap:'.5rem',alignItems:'center',flexWrap:'wrap'}}>
                    {count>0&&<span style={{display:'flex',alignItems:'center',gap:'.25rem',fontSize:'.7rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace"}}><FileText size={10}/>{count} {lang==='zh'?'项':'items'}</span>}
                    {upd&&<span style={{display:'flex',alignItems:'center',gap:'.25rem',fontSize:'.7rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace"}}><Clock size={10}/>{fmtDate(upd)}</span>}
                  </div>
                  <ArrowRight size={14} style={{color:'var(--text3)',flexShrink:0}}/>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Timeline editor modal ──────────────────────────────────────────────────────
function TlEditor({item,onSave,onClose}:{item?:Partial<TimelineItem>;onSave:(d:Omit<TimelineItem,'id'>)=>Promise<void>;onClose:()=>void}) {
  const {lang}=useAppStore()
  const [f,setF]=useState({year:item?.year??'',title_en:item?.title_en??'',title_zh:item?.title_zh??'',desc_en:item?.desc_en??'',desc_zh:item?.desc_zh??'',sort_order:item?.sort_order??0})
  const [saving,setSaving]=useState(false)
  async function submit(e:React.FormEvent){e.preventDefault();setSaving(true);await onSave({...f,sort_order:Number(f.sort_order)});setSaving(false);onClose()}
  return(
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal" style={{maxWidth:460}}>
        <div className="modal-header"><h2>{lang==='zh'?'编辑时间轴':'Edit Timeline'}</h2><button className="btn-icon" onClick={onClose}><X size={16}/></button></div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'.85rem'}}>
          {([['year',lang==='zh'?'年份':'Year'],['title_en','Title (EN)'],['title_zh',lang==='zh'?'标题（中）':'Title (ZH)'],['desc_en','Desc (EN)'],['desc_zh',lang==='zh'?'描述（中）':'Desc (ZH)'],['sort_order',lang==='zh'?'排序':'Sort order']] as [keyof typeof f,string][]).map(([k,l])=>(
            <div className="field" key={k}><label>{l}</label>
              {k==='desc_en'||k==='desc_zh'
                ?<textarea value={String(f[k])} onChange={e=>setF(v=>({...v,[k]:e.target.value}))}/>
                :<input type={k==='sort_order'?'number':'text'} value={String(f[k])} onChange={e=>setF(v=>({...v,[k]:e.target.value}))}/>}
            </div>
          ))}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving?<Loader size={14} className="spin"/>:null}{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Journey Section ────────────────────────────────────────────────────────────
function JourneySection() {
  const {lang,isAdmin,token}=useAppStore()
  const [items,setItems]=useState<TimelineItem[]>([])
  const [editing,setEditing]=useState<TimelineItem|null|'new'>(null)

  async function load(){const r=await timelineApi.list();if(r.ok&&r.data)setItems(r.data)}
  useEffect(()=>{load()},[])

  async function save(data:Omit<TimelineItem,'id'>){
    if(editing==='new') await timelineApi.create(token!,data as unknown as Record<string,unknown>)
    else if(editing) await timelineApi.update(token!,editing.id,data as unknown as Record<string,unknown>)
    await load()
  }
  async function del(id:string){if(!confirm(lang==='zh'?'确认删除？':'Delete?'))return;await timelineApi.remove(token!,id);await load()}

  return(
    <section id="journey" style={{padding:'5rem 2rem',background:'var(--bg)'}}>
      <div className="section-inner">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3.5rem',alignItems:'start'}} className="journey-grid">
          <div className="reveal">
            <span className="section-label">// about me</span>
            <h2 className="section-title" style={{marginBottom:'1.5rem'}}>{lang==='zh'?'我的心路历程':'My Journey'}</h2>
            {[{en:"I'm <strong style='color:var(--orange-b)'>Turtlelet</strong> — a student curious about engineering, math, music, and design.",zh:"我是 <strong style='color:var(--orange-b)'>Turtlelet</strong>——对工程、数学、音乐和设计充满好奇心的学生。"},
              {en:"This site is my digital garden — notes, music, models, and moments worth remembering.",zh:"这里是我的数字花园——笔记、音乐、模型，还有值得记录的每个瞬间。"},
              {en:"<strong style='color:var(--orange-b)'>Currently:</strong> Studying, building, always learning.",zh:"<strong style='color:var(--orange-b)'>目前：</strong>在学习、在创作，持续成长。"}
            ].map((p,i)=>(
              <p key={i} style={{fontSize:'.97rem',color:'var(--text2)',lineHeight:1.85,marginBottom:'1rem'}} dangerouslySetInnerHTML={{__html:lang==='zh'?p.zh:p.en}}/>
            ))}
          </div>
          <div className="reveal">
            {isAdmin&&(
              <button onClick={()=>setEditing('new')} style={{display:'flex',alignItems:'center',gap:'.4rem',marginBottom:'1.5rem',color:'var(--orange-b)',fontSize:'.8rem',fontFamily:"'Space Mono',monospace",background:'none',border:'none',cursor:'pointer'}}>
                <Plus size={13}/>{lang==='zh'?'添加节点':'Add entry'}
              </button>
            )}
            {items.map((item,idx)=>(
              <div key={item.id} style={{display:'grid',gridTemplateColumns:'20px 1fr',gap:'1.25rem',paddingBottom:idx<items.length-1?'2rem':0}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{width:9,height:9,borderRadius:'50%',background:'var(--grad)',flexShrink:0,marginTop:6}}/>
                  {idx<items.length-1&&<div style={{width:1,flex:1,background:'var(--border)',marginTop:5}}/>}
                </div>
                <div>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'.5rem'}}>
                    <div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:'.68rem',color:'var(--orange-b)',letterSpacing:'.06em',marginBottom:'.2rem'}}>{item.year}</div>
                      <div style={{fontWeight:700,fontSize:'.92rem',marginBottom:'.2rem'}}>{lang==='zh'?item.title_zh:item.title_en}</div>
                      <div style={{fontSize:'.83rem',color:'var(--text2)',lineHeight:1.65}}>{lang==='zh'?item.desc_zh:item.desc_en}</div>
                    </div>
                    {isAdmin&&(
                      <div style={{display:'flex',gap:'.3rem',flexShrink:0,marginTop:'.1rem'}}>
                        <button className="btn-icon" style={{width:25,height:25}} onClick={()=>setEditing(item)}><Pencil size={11}/></button>
                        <button className="btn-icon" style={{width:25,height:25}} onClick={()=>del(item.id)}><Trash2 size={11}/></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {items.length===0&&<p style={{color:'var(--text3)',fontSize:'.82rem',fontFamily:"'Space Mono',monospace"}}>{lang==='zh'?'暂无内容。':'No entries yet.'}</p>}
          </div>
        </div>
      </div>
      {editing!==null&&<TlEditor item={editing==='new'?{}:editing} onSave={save} onClose={()=>setEditing(null)}/>}
      <style>{`@media(max-width:768px){.journey-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  )
}

// ── Contact Section ────────────────────────────────────────────────────────────
function ContactSection() {
  const {lang}=useAppStore()
  const LINKS=[
    {icon:'✉️',en:'Email',zh:'邮箱',sub:'3288979284@qq.com',href:'mailto:3288979284@qq.com'},
    {icon:'💬',en:'WeChat',zh:'微信',sub:'ddy19858131702',href:'#',note:lang==='zh'?'复制微信号':'Copy WeChat ID'},
    {icon:'⌨️',en:'GitHub',zh:'GitHub',sub:'github.com/Deng-Deyu',href:'https://github.com/Deng-Deyu'},
    {icon:'📺',en:'Bilibili',zh:'哔哩哔哩',sub:'@小龟不吹0v0',href:'https://space.bilibili.com/'},
    {icon:'🎬',en:'Douyin',zh:'抖音',sub:'ID: 27068227398',href:'https://www.douyin.com/user/MS4wLjABAAAA27068227398'},
  ]
  return(
    <section id="contact" style={{padding:'5rem 2rem',background:'var(--bg2)'}}>
      <div className="section-inner">
        <div className="reveal" style={{marginBottom:'2rem'}}>
          <span className="section-label">// reach out</span>
          <h2 className="section-title">{lang==='zh'?'联系我':'Contact'}</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3rem',alignItems:'start'}} className="contact-grid">
          <div style={{display:'flex',flexDirection:'column',gap:'.6rem'}} className="reveal">
            {LINKS.map((l,i)=>(
              <a key={i} href={l.href} target={l.href.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
                onClick={l.href==='#'?e=>{e.preventDefault();navigator.clipboard?.writeText('ddy19858131702')}:undefined}
                style={{display:'flex',alignItems:'center',gap:'1rem',padding:'.9rem 1.15rem',background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:'var(--radius)',backdropFilter:'blur(12px)',transition:'all var(--trans)'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border-h)';(e.currentTarget as HTMLAnchorElement).style.transform='translateX(4px)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--card-border)';(e.currentTarget as HTMLAnchorElement).style.transform='translateX(0)'}}>
                <div style={{width:34,height:34,borderRadius:'var(--radius-sm)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.95rem',flexShrink:0}}>{l.icon}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:'.88rem'}}>{lang==='zh'?l.zh:l.en}</div>
                  <div style={{fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace"}}>{l.sub}</div>
                </div>
              </a>
            ))}
          </div>
          <div style={{background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:'var(--radius)',padding:'2.2rem',backdropFilter:'blur(12px)'}} className="reveal">
            <h3 style={{fontSize:'1.4rem',fontWeight:800,marginBottom:'.65rem',letterSpacing:'-.02em'}}>{lang==='zh'?'欢迎联系 🐢':"Let's connect 🐢"}</h3>
            <p style={{color:'var(--text2)',fontSize:'.88rem',lineHeight:1.75,marginBottom:'1.4rem'}}>
              {lang==='zh'?'无论你想合作、交流还是打个招呼，我都很高兴收到你的消息。':'Whether you want to collaborate, share ideas, or just say hi — always happy to hear from you.'}
            </p>
            <a href="mailto:3288979284@qq.com" className="btn-primary" style={{display:'inline-flex',alignItems:'center',gap:'.5rem',fontSize:'.88rem',padding:'.65rem 1.4rem'}}>
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
  const [summary,setSummary]=useState<Summary|null>(null)
  useEffect(()=>{
    summaryApi.get().then(r=>{if(r.ok&&r.data)setSummary(r.data)})
    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -60px 0px'})
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el))
    return()=>obs.disconnect()
  },[])
  return(
    <>
      <HeroSection/>
      <div className="divider"/>
      <ModuleCards summary={summary}/>
      <div className="divider"/>
      <JourneySection/>
      <div className="divider"/>
      <ContactSection/>
    </>
  )
}
