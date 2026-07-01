import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BottomNav, type TabId } from '../components/BottomNav'
import { Overview } from './Overview'
import { Itinerary } from './Itinerary'
import { MapPage } from './MapPage'
import { Prep } from './Prep'
import { Money } from './Money'

const PAGES: Record<TabId, () => React.JSX.Element> = {
  overview: Overview,
  itinerary: Itinerary,
  map: MapPage,
  prep: Prep,
  money: Money,
}

export function TripShell() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const ActivePage = PAGES[activeTab]

  return (
    <div>
      <header>
        <span>分享碼：{shareCode}</span>
        <button type="button" aria-label="設定">
          ⚙️
        </button>
      </header>
      <main>
        <ActivePage />
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
