import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { Compass, Settings } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTrip } from '../hooks/useTrip'
import { getWhoAmI, setWhoAmI } from '../lib/whoAmI'
import { getCurrentAuthUser, linkMemberToAuthUser, onAuthUserChange, signInWithGoogle, type AuthUser } from '../lib/ownerAuth'
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
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [searchParams, setSearchParams] = useSearchParams()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  // 身份識別：優先信網址帶嘅 ?m=，冇先睇返呢部裝置呢個瀏覽器 context 嘅 localStorage。
  // 咁樣加到主畫面嘅圖示同喺瀏覽器打開個連結（iOS 兩者 storage 分開）先可以認到同一個人。
  const [whoAmI, setWhoAmIState] = useState<string | null>(
    () => searchParams.get('m') ?? getWhoAmI(shareCode),
  )
  const [themeId, setThemeId] = useState<ThemeId>(() => getStoredThemeId(shareCode))
  const [accent, setAccent] = useState<string | null>(() => getStoredAccent(shareCode))
  const [showSettings, setShowSettings] = useState(false)

  // 身份一旦確定，將佢寫返落網址列（唔留 history）。用戶之後複製呢條連結
  // 去重新加主畫面圖示或者分享畀自己，就算换過 storage context 都認得返係邊個。
  useEffect(() => {
    if (!whoAmI) return
    setWhoAmI(shareCode, whoAmI)
    if (searchParams.get('m') === whoAmI) return
    const next = new URLSearchParams(searchParams)
    next.set('m', whoAmI)
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whoAmI, shareCode])

  // 讀返而家呢個瀏覽器 context 有冇登入咗嘅 owner account（見 SettingsPanel 嘅「帳戶」）。
  useEffect(() => {
    let cancelled = false
    getCurrentAuthUser().then((user) => {
      if (!cancelled) setAuthUser(user)
    })
    const unsubscribe = onAuthUserChange((user) => setAuthUser(user))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  // 得 owner 有 account：若果呢個 auth user 已經連結咗某個 member，優先用嚟識別身份，
  // 唔理 URL/localStorage 講乜（例如全新裝置都認得返）；若果仲未連結過，
  // 就喺 owner 第一次登入嗰陣自動幫佢綁定返而家嘅身份。
  useEffect(() => {
    if (!authUser) return
    const linkedMember = members.find((m) => m.auth_user_id === authUser.id)
    if (linkedMember) {
      if (linkedMember.id !== whoAmI) setWhoAmIState(linkedMember.id)
      return
    }
    const currentMember = members.find((m) => m.id === whoAmI)
    if (currentMember?.is_owner && !currentMember.auth_user_id) {
      linkMemberToAuthUser(currentMember.id, authUser.id).then(refetch)
    }
  }, [authUser, members, whoAmI, refetch])

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
    const currentMember = members.find((m) => m.id === whoAmI)
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
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            isOwner={currentMember?.is_owner ?? false}
            authEmail={authUser?.email ?? null}
            onSignInWithGoogle={() => signInWithGoogle()}
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
