import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar }       from '@/components/layout/Navbar'
import { Footer }       from '@/components/layout/Footer'
import { HomePage }     from '@/pages/HomePage'
import { NotesPage }    from '@/pages/NotesPage'
import { MusicPage }    from '@/pages/MusicPage'
import { ModelingPage, HonorsPage } from '@/pages/ModelingHonorsPages'
import { SoftwarePage } from '@/pages/SoftwarePage'
import { FileViewer }   from '@/pages/FileViewer'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/notes"     element={<NotesPage />} />
          <Route path="/music"     element={<MusicPage />} />
          <Route path="/modeling"  element={<ModelingPage />} />
          <Route path="/honors"    element={<HonorsPage />} />
          <Route path="/software"  element={<SoftwarePage />} />
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
      <div style={{ fontSize:'4rem' }}>🐢</div>
      <h1 style={{ fontSize:'1.5rem',fontWeight:800 }}>404 — Page not found</h1>
      <a href="/" style={{ color:'var(--orange-b)',fontFamily:"'Space Mono',monospace",fontSize:'.85rem' }}>← Back home</a>
    </div>
  )
}