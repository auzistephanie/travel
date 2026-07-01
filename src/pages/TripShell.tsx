import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { getWhoAmI, setWhoAmI } from '../lib/whoAmI'
import { WhoAmIPicker } from '../components/WhoAmIPicker'
import { BottomNav, type TabId } from '../components/BottomNav'
import { SettingsPanel } from '../components/SettingsPanel'
import { TornEdgeDivider } from '../components/TornEdgeDivider'
import { ThemeProvider } from '../theme/ThemeContext'
import { getStoredAccent, getStoredThemeId, setStoredAccent, setStoredThemeId } from '../theme/themeStorage'
import { Overview } from './Overview'
import { Itinerary } from './Itinerary'
import { MapPage } from './MapPage'
import { Prep } from './Prep'
import { Money } from './Money'
import type { ThemeId } from '../types/models'
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
  const [themeId, setThemeId] = useState<ThemeId>(() => getStoredThemeId(shareCode))
  const [accent, setAccent] = useState<string | null>(() => getStoredAccent(shareCode))
  const [showSettings, setShowSettings] = useState(false)

  let content: React.JSX.Element

  if (loading) {
    content = <p>載入緊…</p>
  } else if (error || !trip) {
    content = <p role="alert">{error ?? '揾唔到呢個分享碼嘅行程'}</p>
  } else if (!whoAmI) {
    content = (
      <WhoAmIPicker
        members={members}
        onSelect={(memberId) => {
          setWhoAmI(shareCode, memberId)
          setWhoAmIState(memberId)
        }}
        onAddNew={joinAsNewMember}
      />
    )
  } else {
    const ActivePage = PAGES[activeTab]
    content = (
      <>
        <header>
          <span>{trip.name}</span>
          <button type="button" aria-label="設定" onClick={() => setShowSettings(true)}>
            ⚙️
          </button>
        </header>
        <TornEdgeDivider />
        <main>
          <ActivePage trip={trip} members={members} />
        </main>
        <BottomNav active={activeTab} onChange={setActiveTab} />
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </>
    )
  }

  return (
    <ThemeProvider
      themeId={themeId}
      accent={accent ?? undefined}
      onThemeChange={(id) => {
        setStoredThemeId(shareCode, id)
        setThemeId(id)
      }}
      onAccentChange={(color) => {
        setStoredAccent(shareCode, color)
        setAccent(color)
      }}
    >
      {content}
    </ThemeProvider>
  )
}
