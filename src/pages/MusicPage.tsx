import { useEffect, useState, useRef } from 'react'
import { Play, Pause, Download, Plus, Pencil, Trash2, Music2, FileMusic, X, Loader, ChevronDown, ChevronRight, SkipBack, SkipForward } from 'lucide-react'
import { useAppStore } from '@/store'
import { songsApi, scoresApi, fileApi, tl, fmtDuration } from '@/lib/api'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { FileUpload } from '@/components/ui/FileUpload'
import type { Song, Score, ViewMode } from '@/types'
import { titleFromFilename } from "@/lib/api"

// ── Song editor ───────────────────────────────────────────────────────────────
function SongEditor({ item, onSave, onClose }: { item?: Song; onSave:(d:Record<string,unknown>)=>Promise<void>; onClose:()=>void }) {
  const { lang } = useAppStore()
  type SongForm = { title_en:string;title_zh:string;artist:string;album:string;duration:number;audio_key:string;cover_key:string;review:string }
  const [form, setForm] = useState<SongForm>({ title_en:item?.title_en??'',title_zh:item?.title_zh??'',artist:item?.artist??'',album:item?.album??'',duration:item?.duration??0,audio_key:item?.audio_key??'',cover_key:item?.cover_key??'',review:item?.review??'' })
  const [saving, setSaving] = useState(false)
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); await onSave({...form} as unknown as Record<string,unknown>); setSaving(false); onClose() }
  return (
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-header"><h2>{lang==='zh'?'编辑歌曲':'Edit Song'}</h2><button className="btn-icon" onClick={onClose}><X size={16}/></button></div>
        <form onSubmit={submit} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>
          {[['title_en','Title (EN)','标题（英）'],['title_zh','Title (ZH)','标题（中）'],['artist','Artist','歌手'],['album','Album','专辑']].map(([k,en,zh])=>(
            <div className="field" key={k}><label>{lang==='zh'?zh:en}</label><input value={(form as Record<string,unknown>)[k] as string} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/></div>
          ))}
          <div className="field"><label>{lang==='zh'?'我的评价（选填）':'My review (optional)'}</label>
            <textarea value={form.review} onChange={e=>setForm(v=>({...v,review:e.target.value}))} placeholder={lang==='zh'?'一句话写下你对这首歌的感受…':'A line about this song…'} style={{minHeight:60}}/>
          </div>
          <div className="field"><label>{lang==='zh'?'时长（秒）':'Duration (sec)'}</label><input type="number" value={form.duration} onChange={e=>setForm(v=>({...v,duration:+e.target.value}))}/></div>
          <div className="field"><label>{lang==='zh'?'音频文件':'Audio file'}</label>
            <FileUpload accept=".mp3,.wav,.flac,.ogg,.m4a,.aac,.opus,.ape,.wma,.aiff" currentKey={form.audio_key||null} onUploaded={(k,fname)=>setForm(v=>({
                ...v,audio_key:k,
                title_en:v.title_en||titleFromFilename(fname||''),
                title_zh:v.title_zh||titleFromFilename(fname||''),
              }))}/>
          </div>
          <div className="field"><label>{lang==='zh'?'封面图':'Cover image'}</label>
            <FileUpload accept=".jpg,.jpeg,.png,.webp" currentKey={form.cover_key||null} onUploaded={k=>setForm(v=>({...v,cover_key:k}))}/>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving?<Loader size={14} className="spin"/>:null}{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Score editor ──────────────────────────────────────────────────────────────
function ScoreEditor({ item, onSave, onClose }: { item?: Score; onSave:(d:Record<string,unknown>)=>Promise<void>; onClose:()=>void }) {
  const { lang } = useAppStore()
  const TYPES = [['staff','五线谱 Staff'],['tab','六线谱 Tab'],['jianpu','简谱 Jianpu'],['mixed','混合谱 Mixed']]
  const [form, setForm] = useState({ title_en:item?.title_en??'',title_zh:item?.title_zh??'',composer:item?.composer??'',score_type:(item?.score_type??'mixed') as 'staff'|'tab'|'jianpu'|'mixed',file_key:item?.file_key??'',file_type:(item?.file_type??'pdf') as 'pdf'|'gp',preview_key:item?.preview_key??'' })
  const [saving, setSaving] = useState(false)
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); await onSave({...form} as unknown as Record<string,unknown>); setSaving(false); onClose() }
  return (
    <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-header"><h2>{lang==='zh'?'编辑乐谱':'Edit Score'}</h2><button className="btn-icon" onClick={onClose}><X size={16}/></button></div>
        <form onSubmit={submit} style={{ display:'flex',flexDirection:'column',gap:'.85rem' }}>
          {[['title_en','Title (EN)','标题（英）'],['title_zh','Title (ZH)','标题（中）'],['composer','Composer','作曲者']].map(([k,en,zh])=>(
            <div className="field" key={k}><label>{lang==='zh'?zh:en}</label><input value={(form as Record<string,unknown>)[k] as string} onChange={e=>setForm(v=>({...v,[k]:e.target.value}))}/></div>
          ))}
          <div className="field"><label>{lang==='zh'?'谱型':'Score type'}</label>
            <select value={form.score_type} onChange={e=>setForm(v=>({...v,score_type:e.target.value}))}>
              {TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="field"><label>{lang==='zh'?'文件格式':'File format'}</label>
            <select value={form.file_type} onChange={e=>setForm(v=>({...v,file_type:e.target.value}))}>
              <option value="pdf">PDF</option><option value="gp">Guitar Pro (.gp/.gpx/.gp5)</option>
            </select>
          </div>
          <div className="field"><label>{lang==='zh'?'乐谱文件':'Score file'}</label>
            <FileUpload accept=".pdf,.gp,.gpx,.gp5,.gp4,.gp3,.ptb,.tef,.mxl,.xml,.musicxml,.mscz,.mscx" currentKey={form.file_key||null} onUploaded={k=>setForm(v=>({...v,file_key:k}))}/>
          </div>
          <div className="field"><label>{lang==='zh'?'预览图':'Preview image'}</label>
            <FileUpload accept=".jpg,.png,.webp" currentKey={form.preview_key||null} onUploaded={k=>setForm(v=>({...v,preview_key:k}))}/>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>{lang==='zh'?'取消':'Cancel'}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving?<Loader size={14} className="spin"/>:null}{lang==='zh'?'保存':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Audio player bar ──────────────────────────────────────────────────────────
function PlayerBar({ song, onClose, onPrev, onNext }: { song:Song|null; onClose:()=>void; onPrev:()=>void; onNext:()=>void }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const { lang } = useAppStore()

  useEffect(() => {
    if (!song?.audio_key || !audioRef.current) return
    audioRef.current.src = fileApi.url(song.audio_key)
    audioRef.current.play().then(()=>setPlaying(true)).catch(()=>{})
  }, [song])

  function togglePlay() {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  return (
    <>
      <audio ref={audioRef} onEnded={onNext} onTimeUpdate={e=>setProgress((e.currentTarget.currentTime/e.currentTarget.duration)||0)} />
      <div className={`player-bar ${song?'active':''}`}>
        {song?.cover_key && <img src={fileApi.url(song.cover_key)} style={{ width:40,height:40,borderRadius:'var(--radius-sm)',objectFit:'cover',flexShrink:0 }} alt="" />}
        {!song?.cover_key && <div style={{ width:40,height:40,borderRadius:'var(--radius-sm)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Music2 size={18} style={{ color:'var(--accent)' }}/></div>}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontWeight:700,fontSize:'.88rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{song?tl(song,lang):''}</div>
          <div style={{ fontSize:'.75rem',color:'var(--text3)' }}>{song?.artist}</div>
          <div style={{ height:3,background:'var(--bg4)',borderRadius:2,marginTop:.4,overflow:'hidden' }}>
            <div style={{ height:'100%',background:'var(--grad)',width:`${progress*100}%`,transition:'width .5s linear' }} />
          </div>
        </div>
        <div style={{ display:'flex',gap:'.4rem',alignItems:'center',flexShrink:0 }}>
          <button className="btn-icon" onClick={onPrev}><SkipBack size={15}/></button>
          <button onClick={togglePlay} style={{ width:36,height:36,borderRadius:'50%',background:'var(--grad)',border:'none',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>
            {playing?<Pause size={16}/>:<Play size={16}/>}
          </button>
          <button className="btn-icon" onClick={onNext}><SkipForward size={15}/></button>
          {song?.audio_key && <a href={fileApi.url(song.audio_key)} download className="btn-icon"><Download size={14}/></a>}
          <button className="btn-icon" onClick={onClose}><X size={14}/></button>
        </div>
      </div>
    </>
  )
}

// ── Songs tab ─────────────────────────────────────────────────────────────────
function SongsTab({ view }: { view: ViewMode }) {
  const { lang, isAdmin, token, guestToken } = useAppStore()
  const [songs, setSongs]         = useState<Song[]>([])
  const [openArtists, setOpenArtists] = useState<Record<string,boolean>>({})
  const [currentSong, setCurrentSong] = useState<Song|null>(null)
  const [editing, setEditing]     = useState<Song|null|'new'>(null)

  async function load() { const r = await songsApi.list(); if (r.ok && r.data) setSongs(r.data) }
  useEffect(() => { load() }, [])

  const byArtist: Record<string,Song[]> = {}
  songs.forEach(s => { const a = s.artist||'Unknown'; if (!byArtist[a]) byArtist[a]=[]; byArtist[a].push(s) })
  const artists = Object.keys(byArtist).sort()

  const allSongs = songs
  const idx = currentSong ? allSongs.findIndex(s=>s.id===currentSong.id) : -1

  async function save(data: Record<string,unknown>) {
    if (editing==='new') await songsApi.create(token!,data); else if (editing) await songsApi.update(token!,editing.id,data); await load()
  }
  async function del(id: string) { if (!confirm(lang==='zh'?'确认删除？':'Delete?')) return; await songsApi.remove(token!,id); await load() }

  return (
    <>
      {artists.map(artist => {
        const artistSongs = byArtist[artist]
        const isOpen = openArtists[artist] !== false
        return (
          <div key={artist} className="tree-item">
            <div className="tree-header" onClick={()=>setOpenArtists(v=>({...v,[artist]:!isOpen}))}>
              {isOpen?<ChevronDown size={16} style={{ color:'var(--text3)' }}/>:<ChevronRight size={16} style={{ color:'var(--text3)' }}/>}
              <span style={{ fontSize:'1rem' }}>🎤</span>
              <span style={{ fontWeight:700 }}>{artist}</span>
              <span style={{ fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{artistSongs.length}</span>
            </div>
            {isOpen && (
              <div className="tree-body">
                {view==='card' ? (
                  <div className="cards-grid-2" style={{ paddingBottom:'.5rem' }}>
                    {artistSongs.map(song=>(
                      <div key={song.id} style={{ display:'flex',alignItems:'center',gap:'1rem',background:'var(--card-bg)',border:'1px solid var(--card-border)',borderRadius:'var(--radius)',padding:'1rem',backdropFilter:'blur(12px)',cursor:'pointer',transition:'border-color var(--trans)',}} onClick={()=>setCurrentSong(song)} onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor='var(--border-h)'} onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor='var(--card-border)'}>
                        {song.cover_key?<img src={fileApi.url(song.cover_key)} style={{ width:48,height:48,borderRadius:'var(--radius-sm)',objectFit:'cover',flexShrink:0 }} alt=""/>:<div style={{ width:48,height:48,borderRadius:'var(--radius-sm)',background:'var(--bg3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Music2 size={20} style={{ color:'var(--accent)' }}/></div>}
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tl(song,lang)}</div>
                          <div style={{ fontSize:'.78rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{song.album} {song.duration?'· '+fmtDuration(song.duration):''}</div>
                        {song.review&&<div className="song-review" style={{marginTop:'.35rem'}}>{song.review}</div>}
                        </div>
                        <div style={{ display:'flex',gap:'.3rem',flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                          {isAdmin&&<><button className="btn-icon" style={{ width:28,height:28 }} onClick={()=>setEditing(song)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:28,height:28 }} onClick={()=>del(song.id)}><Trash2 size={12}/></button></>}
                          <button style={{ width:32,height:32,borderRadius:'50%',background: currentSong?.id===song.id?'var(--grad)':'var(--bg3)',border:'1px solid var(--border)',color:currentSong?.id===song.id?'#fff':'var(--text2)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setCurrentSong(song)}>
                            {currentSong?.id===song.id?<Pause size={13}/>:<Play size={13}/>}
                          </button>
                          {song.audio_key&&(isAdmin||guestToken)&&<a href={fileApi.url(song.audio_key)} download className="btn-icon" style={{ width:28,height:28 }} onClick={e=>e.stopPropagation()}><Download size={12}/></a>}
                          {song.audio_key&&!isAdmin&&!guestToken&&<span style={{fontSize:'.65rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace",whiteSpace:'nowrap'}}>{lang==='zh'?'申请后可下载':'Login to download'}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="list-view" style={{ paddingBottom:'.5rem' }}>
                    {artistSongs.map(song=>(
                      <div key={song.id} className="list-item" style={{ cursor:'pointer' }} onClick={()=>setCurrentSong(song)}>
                        <Play size={14} style={{ color:'var(--accent)',flexShrink:0 }}/>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontWeight:600,fontSize:'.9rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tl(song,lang)}</div>
                          <div style={{ fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{song.album} {song.duration?'· '+fmtDuration(song.duration):''}</div>
                        </div>
                        {isAdmin&&<div style={{ display:'flex',gap:'.3rem' }} onClick={e=>e.stopPropagation()}><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditing(song)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>del(song.id)}><Trash2 size={12}/></button></div>}
                        {song.audio_key&&(isAdmin||guestToken)&&<a href={fileApi.url(song.audio_key)} download className="btn-icon" style={{ width:26,height:26 }} onClick={e=>e.stopPropagation()}><Download size={12}/></a>}
                      </div>
                    ))}
                  </div>
                )}
                {isAdmin&&<button className="add-btn" style={{ padding:'.6rem',marginTop:'.25rem' }} onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'添加歌曲':'Add song'}</button>}
              </div>
            )}
          </div>
        )
      })}
      {isAdmin && artists.length===0 && <button className="add-btn" onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'添加第一首歌':'Add first song'}</button>}
      {editing!==null && <SongEditor item={editing==='new'?undefined:editing} onSave={save} onClose={()=>setEditing(null)}/>}
      <PlayerBar song={currentSong} onClose={()=>setCurrentSong(null)} onPrev={()=>idx>0&&setCurrentSong(allSongs[idx-1])} onNext={()=>idx<allSongs.length-1&&setCurrentSong(allSongs[idx+1])}/>
    </>
  )
}

// ── Scores tab ────────────────────────────────────────────────────────────────
const SCORE_TYPES = [
  { value:'staff',  en:'Staff Notation', zh:'五线谱' },
  { value:'tab',    en:'Tablature',      zh:'六线谱' },
  { value:'jianpu', en:'Jianpu',         zh:'简谱'   },
  { value:'mixed',  en:'Mixed',          zh:'混合谱' },
]

function ScoresTab({ view }: { view: ViewMode }) {
  const { lang, isAdmin, token, guestToken } = useAppStore()
  const [scores, setScores]   = useState<Score[]>([])
  const [typeFilter, setType] = useState('all')
  const [editing, setEditing] = useState<Score|null|'new'>(null)

  async function load() { const r = await scoresApi.list(); if (r.ok && r.data) setScores(r.data) }
  useEffect(() => { load() }, [])
  async function save(data: Record<string,unknown>) {
    if (editing==='new') await scoresApi.create(token!,data); else if (editing) await scoresApi.update(token!,editing.id,data); await load()
  }
  async function del(id: string) { if (!confirm(lang==='zh'?'确认删除？':'Delete?')) return; await scoresApi.remove(token!,id); await load() }

  const visible = typeFilter==='all' ? scores : scores.filter(s=>s.score_type===typeFilter)
  const typeLabel = (t: string) => { const found = SCORE_TYPES.find(x=>x.value===t); return lang==='zh' ? found?.zh??t : found?.en??t }

  return (
    <>
      <div style={{ display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'1.5rem' }}>
        {[{value:'all',en:'All',zh:'全部'},...SCORE_TYPES].map(t=>(
          <button key={t.value} onClick={()=>setType(t.value)} className={`sub-nav-btn ${typeFilter===t.value?'active':''}`}>
            {lang==='zh'?t.zh:t.en}
          </button>
        ))}
      </div>
      {view==='card' ? (
        <div className="cards-grid">
          {visible.map(score=>(
            <div key={score.id} className="card">
              {score.preview_key?<img src={fileApi.url(score.preview_key)} style={{ width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:'var(--radius-sm)',marginBottom:'1rem' }} alt=""/>:
                <div style={{ width:'100%',aspectRatio:'4/3',background:'var(--bg3)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem' }}><FileMusic size={32} style={{ color:'var(--text3)' }}/></div>}
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'.35rem' }}>
                <div style={{ fontWeight:700,flex:1 }}>{tl(score,lang)}</div>
                {isAdmin&&<div style={{ display:'flex',gap:'.3rem',flexShrink:0 }}><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditing(score)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>del(score.id)}><Trash2 size={12}/></button></div>}
              </div>
              {score.composer&&<div style={{ fontSize:'.82rem',color:'var(--text2)',marginBottom:'.75rem' }}>{score.composer}</div>}
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div style={{ display:'flex',gap:'.4rem' }}>
                  <span className="tag">{typeLabel(score.score_type)}</span>
                  {score.file_type&&<span className="tag tag-gray">{score.file_type.toUpperCase()}</span>}
                </div>
                {score.file_key&&(isAdmin||guestToken)&&<a href={fileApi.url(score.file_key)} download className="btn-icon" style={{ width:28,height:28,borderRadius:'50%' }}><Download size={13}/></a>}
              </div>
            </div>
          ))}
          {isAdmin&&<button className="add-btn" onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'添加乐谱':'Add score'}</button>}
        </div>
      ) : (
        <div className="list-view">
          {visible.map(score=>(
            <div key={score.id} className="list-item">
              <FileMusic size={16} style={{ color:'var(--accent)',flexShrink:0 }}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tl(score,lang)}</div>
                <div style={{ fontSize:'.75rem',color:'var(--text3)',fontFamily:"'Space Mono',monospace" }}>{score.composer?score.composer+' · ':''}{typeLabel(score.score_type)} {score.file_type?'· '+score.file_type.toUpperCase():''}</div>
              </div>
              {isAdmin&&<div style={{ display:'flex',gap:'.3rem' }}><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>setEditing(score)}><Pencil size={12}/></button><button className="btn-icon" style={{ width:26,height:26 }} onClick={()=>del(score.id)}><Trash2 size={12}/></button></div>}
              {score.file_key&&(isAdmin||guestToken)&&<a href={fileApi.url(score.file_key)} download className="btn-icon" style={{ width:26,height:26 }}><Download size={12}/></a>}
            </div>
          ))}
          {isAdmin&&<button className="add-btn" style={{ padding:'.6rem' }} onClick={()=>setEditing('new')}><Plus size={14}/>{lang==='zh'?'添加乐谱':'Add score'}</button>}
        </div>
      )}
      {editing!==null&&<ScoreEditor item={editing==='new'?undefined:editing} onSave={save} onClose={()=>setEditing(null)}/>}
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function MusicPage() {
  const { lang } = useAppStore()
  const [tab, setTab]   = useState<'songs'|'scores'>('songs')
  const [view, setView] = useState<ViewMode>('card')

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="section-label">// music collection</span>
        <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem' }}>
          <h1 className="section-title">{lang==='zh'?'音乐收藏':'Music Collection'}</h1>
          <ViewToggle mode={view} onChange={setView} />
        </div>
      </div>
      <div className="sub-nav">
        <button className={`sub-nav-btn ${tab==='songs'?'active':''}`} onClick={()=>setTab('songs')}>
          <Music2 size={13} style={{ display:'inline',marginRight:'.35rem' }}/>{lang==='zh'?'歌曲':'Songs'}
        </button>
        <button className={`sub-nav-btn ${tab==='scores'?'active':''}`} onClick={()=>setTab('scores')}>
          <FileMusic size={13} style={{ display:'inline',marginRight:'.35rem' }}/>{lang==='zh'?'乐谱':'Sheet Music'}
        </button>
      </div>
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'1.5rem 2rem 5rem' }}>
        {tab==='songs'  && <SongsTab  view={view} />}
        {tab==='scores' && <ScoresTab view={view} />}
      </div>
    </div>
  )
}
