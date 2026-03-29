import { useScrollReveal } from '@/hooks/useScrollReveal'
import { HeroSection }    from '@/components/sections/HeroSection'
import { JourneySection } from '@/components/sections/JourneySection'
import { NotesSection }   from '@/components/sections/NotesSection'
import { MusicSection }   from '@/components/sections/MusicSection'
import { VideosSection }  from '@/components/sections/VideosSection'
import { ModelingSection }from '@/components/sections/ModelingSection'
import { HonorsSection }  from '@/components/sections/HonorsSection'
import { ContactSection } from '@/components/sections/ContactSection'

export function HomePage() {
  useScrollReveal()

  return (
    <>
      <HeroSection />
      <div className="divider" />
      <JourneySection />
      <div className="divider" />
      <NotesSection />
      <div className="divider" />
      <MusicSection />
      <div className="divider" />
      <VideosSection />
      <div className="divider" />
      <ModelingSection />
      <div className="divider" />
      <HonorsSection />
      <div className="divider" />
      <ContactSection />
    </>
  )
}
