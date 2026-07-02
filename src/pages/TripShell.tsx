import { lazy, Suspense, useState, type ComponentType } from 'react'
import { Compass, Settings } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { getWhoAmI, setWhoAmI } from '../lib/whoAmI'
import { WhoAmIPicker } from '../components/WhoAmIPicker'
import { BottomNav, type TabId } from '../components/BottomNav'
import { SettingsPanel } from '../components/SettingsPanel'
import { TornEdgeDivider } from '../components/TornEdgeDivider'
import { ThemeProvider } from '../theme/ThemeContext'
import { getStoredAccent, getStoredThemeId, setStoredAccent, setStoredThemeId } from '../theme/themeStorage'
import type { ThemeId } from '../types/models'
import type { TripPageProps } from '../types/props'

// 逐個分頁獨立 code-split，首次載入淨係攞緊嗰個分頁嘅 JS（效能基本處理，spec §10 Phase 5）
const Overview = lazy(() => import('./Overview').then((m) => ({ default: m.Overview })))
const Itinerary = lazy(() => import('./Itinerary').then((m) => ({ default: m.Itinerary })))
const MapPage = lazy(() => import('./MapPage').then((m) => ({ default: m.MapPage })))
const Prep = lazy(() => import('./Prep').then((m) => ({ default: m.Prep })))
const Money = lazy(() => import('./Money').then((m) => ({ default: m.Money })))

const PAGES: Record<TabId, ComponentType<TripPageProps>> = {
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
    content = <p>載入中…</p>
  } else if (error || !trip) {
    content = <p role="alert">{error ?? '找不到這個分享碼的行程'}</p>
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
        <header className="trip-header">
          <span className="trip-brand compass-decoration" aria-hidden="true">
            <Compass size={18} />
          </span>
          <span className="trip-title">{trip.name}</span>
          <button
            type="button"
            className="trip-settings"
            aria-label="設定"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={17} aria-hidden="true" />
          </button>
        </header>
        <TornEdgeDivider />
        <main>
          <Suspense fallback={<p>載入中…</p>}>
            <ActivePage trip={trip} members={members} />
          </Suspense>
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
