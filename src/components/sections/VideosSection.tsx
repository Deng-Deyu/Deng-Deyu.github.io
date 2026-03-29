import { ExternalLink } from 'lucide-react'
import { useAppStore } from '@/store'

const PLATFORMS = [
  {
    name: '抖音 / Douyin',
    handle: '@Turtlelet',
    id: '27068227398',
    url: 'https://www.douyin.com/user/27068227398',
    icon: '🎬',
    desc_en: 'Short videos & daily content',
    desc_zh: '短视频与日常内容',
    color: '#ff2d55',
  },
  {
    name: '哔哩哔哩 / Bilibili',
    handle: '@小龟不吹0v0',
    id: '',
    url: 'https://space.bilibili.com/',
    icon: '📺',
    desc_en: 'Long-form videos & tutorials',
    desc_zh: '长视频与教程',
    color: '#00a1d6',
  },
]

export function VideosSection() {
  const { lang } = useAppStore()

  return (
    <section id="videos" className="section-pad" style={{ background: 'var(--bg)' }}>
      <div className="section-inner">
        <div className="section-header reveal" style={{ marginBottom: '2rem' }}>
          <span className="section-label">// video content</span>
          <h2 className="section-title">
            {lang === 'zh' ? '视频' : 'Videos'}
          </h2>
          <p className="section-sub">
            {lang === 'zh'
              ? '在以下平台找到我的视频内容。'
              : 'Find my video content on these platforms.'}
          </p>
        </div>

        <div className="cards-grid-2 reveal">
          {PLATFORMS.map(p => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ display: 'block' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg3)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
                }}>{p.icon}</div>
                <ExternalLink size={15} style={{ color: 'var(--text3)', marginTop: 4 }} />
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.3rem' }}>{p.name}</div>

              <div style={{
                fontFamily: "'Space Mono',monospace", fontSize: '.82rem',
                color: 'var(--orange-b)', marginBottom: '.5rem',
              }}>{p.handle}</div>

              {p.id && (
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '.72rem', color: 'var(--text3)', marginBottom: '.6rem' }}>
                  ID: {p.id}
                </div>
              )}

              <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
                {lang === 'zh' ? p.desc_zh : p.desc_en}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
