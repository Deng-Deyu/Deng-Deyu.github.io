import { useEffect, useRef } from 'react'

type Theme = 'music' | 'notes' | 'modeling' | 'projects' | 'honors'

const MUSIC_SYMBOLS  = ['♩','♪','♫','♬','𝅘𝅥𝅮','🎵','🎶']
const NOTES_SYMBOLS  = ['✏','📖','📝','✒','📄','📚']
const PROJ_SYMBOLS   = ['</>','{}','[]','//','fn','=>','const']
const HONORS_SYMBOLS = ['✦','★','✧','⭐','✨','💫','🌟']

interface Props { theme: Theme; className?: string }

export function AnimBg({ theme, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''

    if (theme === 'modeling') {
      // Wireframe geometric shapes
      const shapes = ['square','triangle','circle','hex']
      for (let i = 0; i < 12; i++) {
        const div = document.createElement('div')
        div.className = 'geo-symbol'
        const size = 20 + Math.random() * 40
        const shape = shapes[Math.floor(Math.random() * shapes.length)]
        div.style.cssText = [
          `left:${Math.random()*100}%`,
          `top:${Math.random()*100}%`,
          `width:${size}px`,
          `height:${size}px`,
          `border-radius:${shape==='circle'?'50%':shape==='hex'?'4px':'0'}`,
          `animation-duration:${15+Math.random()*20}s`,
          `animation-delay:${Math.random()*12}s`,
          shape==='triangle'?'clip-path:polygon(50% 0%,0% 100%,100% 100%)':'',
        ].join(';')
        el.appendChild(div)
      }
      return
    }

    if (theme === 'honors') {
      // Stars at fixed random positions, twinkling independently
      for (let i = 0; i < 22; i++) {
        const span = document.createElement('span')
        span.className = 'star-symbol float-symbol'
        span.textContent = HONORS_SYMBOLS[Math.floor(Math.random() * HONORS_SYMBOLS.length)]
        span.style.cssText = [
          `left:${Math.random()*100}%`,
          `top:${Math.random()*90}%`,
          `position:absolute`,
          `animation-duration:${2+Math.random()*4}s`,
          `animation-delay:${Math.random()*4}s`,
          `font-size:${0.7+Math.random()*0.8}rem`,
        ].join(';')
        el.appendChild(span)
      }
      return
    }

    const symbols =
      theme === 'music'    ? MUSIC_SYMBOLS :
      theme === 'notes'    ? NOTES_SYMBOLS :
      PROJ_SYMBOLS

    const count = theme === 'projects' ? 14 : 12

    for (let i = 0; i < count; i++) {
      const span = document.createElement('span')
      span.textContent = symbols[Math.floor(Math.random() * symbols.length)]
      span.className = [
        'float-symbol',
        theme === 'music'    ? 'note-symbol'  : '',
        theme === 'notes'    ? 'book-symbol'  : '',
        theme === 'projects' ? 'code-symbol'  : '',
      ].filter(Boolean).join(' ')
      span.style.cssText = [
        `left:${Math.random()*100}%`,
        `bottom:-5%`,
        `animation-duration:${14+Math.random()*18}s`,
        `animation-delay:${Math.random()*14}s`,
        `font-size:${0.85+Math.random()*0.9}rem`,
        `opacity:0`,
      ].join(';')
      el.appendChild(span)
    }
  }, [theme])

  return (
    <div
      ref={ref}
      className={`anim-bg ${className}`}
      aria-hidden="true"
    />
  )
}
