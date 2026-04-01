import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar }       from '@/components/layout/Navbar'
import { Footer }       from '@/components/layout/Footer'
import { HomePage }     from '@/pages/HomePage'
import { NotesPage }    from '@/pages/NotesPage'
import { MusicPage }    from '@/pages/MusicPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ModelingPage, HonorsPage } from '@/pages/ModelingHonorsPages'
import { FileViewer }   from '@/pages/FileViewer'
import { GuestsPage }   from '@/pages/GuestsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/notes"     element={<NotesPage />} />
          <Route path="/music"     element={<MusicPage />} />
          <Route path="/projects"  element={<ProjectsPage />} />
          <Route path="/modeling"  element={<ModelingPage />} />
          <Route path="/honors"    element={<HonorsPage />} />
          <Route path="/guests"    element={<GuestsPage />} />
          <Route path="/view/:id"  element={<FileViewer />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'80vh',gap:'1rem' }}>
      <div style={{ fontSize:'4rem',animation:'float 3s ease-in-out infinite' }}>🐢</div>
      <h1 style={{ fontSize:'1.4rem',fontWeight:900,fontFamily:"'Nunito',sans-serif" }}>404 — 找不到页面</h1>
      <a href="/" style={{ color:'var(--orange-b)',fontFamily:"'Space Mono',monospace",fontSize:'.82rem' }}>← 回到首页</a>
    </div>
  )
}
