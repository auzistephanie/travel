import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { getWhoAmI, setWhoAmI } from '../lib/whoAmI'
import { WhoAmIPicker } from '../components/WhoAmIPicker'
import { BottomNav, type TabId } from '../components/BottomNav'
import { Overview } from './Overview'
import { Itinerary } from './Itinerary'
import { MapPage } from './MapPage'
import { Prep } from './Prep'
import { Money } from './Money'
import type { TripPageProps } from '../types/props'

const PAGES: Record<TabId, (props: TripPageProps) => React.JSX.Element> = {
  overview: Overview,
  itinerary: Itinerary,
  map: MapPage,
  prep: Prep,
  money: Money,
}

export function TripShell() {
  const { shareCode = '' } = useParams<{ shareCode: string }>()
  const { trip, members, loading, error, joinAsNewMember } = useTrip(shareCode)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [whoAmI, setWhoAmIState] = useState<string | null>(() => getWhoAmI(shareCode))

  if (loading) return <p>載入緊…</p>
  if (error || !trip) return <p role="alert">{error ?? '揾唔到呢個分享碼嘅行程'}</p>

  if (!whoAmI) {
    return (
      <WhoAmIPicker
        members={members}
        onSelect={(memberId) => {
          setWhoAmI(shareCode, memberId)
          setWhoAmIState(memberId)
        }}
        onAddNew={joinAsNewMember}
      />
    )
  }

  const ActivePage = PAGES[activeTab]

  return (
    <div>
      <header>
        <span>{trip.name}</span>
        <button type="button" aria-label="設定">
          ⚙️
        </button>
      </header>
      <main>
        <ActivePage trip={trip} members={members} />
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
