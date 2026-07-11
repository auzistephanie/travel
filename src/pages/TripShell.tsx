import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { Compass, Repeat, Settings } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { useTripIdentity } from '../hooks/useTripIdentity'
import { clearWhoAmI } from '../lib/whoAmI'
import { addMyTrip, removeMyTrip } from '../lib/myTrips'
import { signInWithGoogle } from '../lib/ownerAuth'
import { lazyImportWithReload } from '../lib/lazyWithReload'
import { WhoAmIPicker } from '../components/WhoAmIPicker'
import { BottomNav, type TabId } from '../components/BottomNav'
import { SettingsPanel } from '../components/SettingsPanel'
import { TornEdgeDivider } from '../components/TornEdgeDivider'
import { ThemeProvider } from '../theme/ThemeContext'
import { getStoredAccent, getStoredThemeId, setStoredAccent, setStoredThemeId } from '../theme/themeStorage'
import type { ThemeId } from '../types/models'
import type { TripPageProps } from '../types/props'

// 逐個分頁獨立 code-split，首次載入淨係攞緊嗰個分頁嘅 JS（效能基本處理，spec §10 Phase 5）
// lazyImportWithReload：redeploy 後撞舊 chunk 就自動 reload 一次攞新版，唔會齋齋全黑（見 lib/lazyWithReload.ts）
const Overview = lazy(lazyImportWithReload(() => import('./Overview').then((m) => ({ default: m.Overview }))))
const Itinerary = lazy(lazyImportWithReload(() => import('./Itinerary').then((m) => ({ default: m.Itinerary }))))
const Prep = lazy(lazyImportWithReload(() => import('./Prep').then((m) => ({ default: m.Prep }))))
const Money = lazy(lazyImportWithReload(() => import('./Money').then((m) => ({ default: m.Money }))))

const PAGES: Record<TabId, ComponentType<TripPageProps>> = {
  overview: Overview,
  itinerary: Itinerary,
  prep: Prep,
  money: Money,
}

export function TripShell() {
  const { shareCode = '' } = useParams<{ shareCode: string }>()
  const { trip, members, loading, error, joinAsNewMember, refetch } = useTrip(shareCode)
  // 身份識別全套（優先次序 + 副作用）喺 useTripIdentity／lib/identityResolver，唔再散落呢度。
  const identity = useTripIdentity(shareCode, members, refetch)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [themeId, setThemeId] = useState<ThemeId>(() => getStoredThemeId(shareCode))
  const [accent, setAccent] = useState<string | null>(() => getStoredAccent(shareCode))
  const [showSettings, setShowSettings] = useState(false)

  // 身份確定後，將呢個行程記入「我的行程」本地清單（首頁列得返），
  // 令經朋友連結入嚟嘅行程都會出現，唔使死記條 URL。
  useEffect(() => {
    if (!trip || !identity.memberId) return
    const currentMember = members.find((m) => m.id === identity.memberId)
    if (!currentMember) return
    addMyTrip({
      shareCode: trip.share_code,
      name: trip.name,
      role: currentMember.is_owner ? 'owner' : 'member',
      startDate: trip.start_date,
      endDate: trip.end_date,
    })
  }, [trip, identity.memberId, members])

  let content: React.JSX.Element

  if (loading) {
    content = <p>載入中…</p>
  } else if (error || !trip) {
    content = <p role="alert">{error ?? '找不到這個分享碼的行程'}</p>
  } else if (!identity.memberId) {
    content = <WhoAmIPicker members={members} onSelect={identity.select} onAddNew={joinAsNewMember} />
  } else {
    const ActivePage = PAGES[activeTab]
    const currentMember = members.find((m) => m.id === identity.memberId)
    content = (
      <>
        <header className="trip-header">
          <span className="trip-brand compass-decoration" aria-hidden="true">
            <Compass size={18} />
          </span>
          <span className="trip-title">{trip.name}</span>
          <button
            type="button"
            className="trip-switch-identity"
            aria-label="切換身份"
            onClick={identity.switchIdentity}
          >
            <Repeat size={16} aria-hidden="true" />
          </button>
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
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            isOwner={currentMember?.is_owner ?? false}
            authEmail={identity.authUser?.email ?? null}
            onSignInWithGoogle={() => signInWithGoogle()}
            shareCode={trip.share_code}
            trip={trip}
            onTripChanged={refetch}
            onTripDeleted={() => {
              removeMyTrip(trip.share_code)
              clearWhoAmI(trip.share_code)
              window.location.assign('/')
            }}
          />
        )}
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
