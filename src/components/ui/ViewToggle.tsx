import { LayoutGrid, List } from 'lucide-react'
import type { ViewMode } from '@/types'

interface Props { mode: ViewMode; onChange: (m: ViewMode) => void }

export function ViewToggle({ mode, onChange }: Props) {
  return (
    <div className="view-toggle">
      <button className={`view-toggle-btn ${mode==='card'?'active':''}`} onClick={()=>onChange('card')}><LayoutGrid size={14}/></button>
      <button className={`view-toggle-btn ${mode==='list'?'active':''}`} onClick={()=>onChange('list')}><List size={14}/></button>
    </div>
  )
}
