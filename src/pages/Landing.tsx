import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Compass, KeyRound, MapPin, Users } from 'lucide-react'
import { getMyTrips, mergeMyTrips, type MyTripEntry } from '../lib/myTrips'
import { getCurrentAuthUser, onAuthUserChange, signInWithGoogle, type AuthUser } from '../lib/ownerAuth'
import { getTripsForAuthUser } from '../lib/tripApi'
import '../styles/journalCard.css'
import './Landing.css'

function formatRange(start?: string | null, end?: string | null): string | null {
  if (!start || !end) return null
  const md = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}月${Number(d)}日`
  }
  return `${md(start)} – ${md(end)}`
}

export function Landing() {
  const [trips, setTrips] = useState<MyTripEntry[]>(() => getMyTrips())
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)

  // 登入咗嘅話由雲端攞返所有連結咗嘅行程，併入本地清單（跨裝置同步）。
  useEffect(() => {
    let cancelled = false
    const syncCloud = async (user: AuthUser | null) => {
      if (!user) return
      try {
        const cloud = await getTripsForAuthUser(user.id)
        if (cancelled) return
        mergeMyTrips(cloud)
        setTrips(getMyTrips())
      } catch {
        // 攞唔到雲端行程唔阻礙本地清單顯示
      }
    }
    getCurrentAuthUser().then((user) => {
      if (cancelled) return
      setAuthUser(user)
      void syncCloud(user)
    })
    const unsubscribe = onAuthUserChange((user) => {
      setAuthUser(user)
      void syncCloud(user)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const hasTrips = trips.length > 0

  const loginFooter = authUser ? (
    <p className="journal-login-status">已用 {authUser.email ?? 'Google'} 登入 · 行程會跨裝置同步</p>
  ) : (
    <div className="journal-login">
      <p className="journal-login-hint">已有帳戶？跨裝置攞返你嘅行程</p>
      <button type="button" className="journal-login-btn" onClick={() => signInWithGoogle()}>
        <span className="journal-google-g" aria-hidden="true">
          G
        </span>
        用 Google 登入
      </button>
    </div>
  )

  if (!hasTrips) {
    return (
      <div className="journal-page">
        <div className="journal-card journal-cover-content">
          <span className="journal-compass" aria-hidden="true">
            <Compass size={30} />
          </span>
          <h1 className="journal-title">旅行規劃 App</h1>
          <p className="journal-subtitle">Travel Journal</p>
          <p className="journal-tagline">
            與朋友一起規劃下一段旅程，
            <br />
            一鍵即可加入，無須註冊帳戶。
          </p>
          <div className="journal-actions">
            <Link to="/new" className="journal-cta-primary">
              <BookOpen size={17} aria-hidden="true" />
              開新行程
            </Link>
            <div className="journal-divider">或</div>
            <Link to="/join" className="journal-cta-secondary">
              <KeyRound size={15} aria-hidden="true" />
              用分享碼加入
            </Link>
          </div>
          {loginFooter}
        </div>
      </div>
    )
  }

  return (
    <div className="journal-page">
      <div className="journal-card journal-cover-content">
        <span className="journal-compass" aria-hidden="true">
          <Compass size={30} />
        </span>
        <h1 className="journal-title">我的行程</h1>
        <p className="journal-subtitle">Travel Journal</p>

        <ul className="journal-trip-list">
          {trips.map((t) => {
            const range = formatRange(t.startDate, t.endDate)
            return (
              <li key={t.shareCode}>
                <Link
                  to={`/t/${t.shareCode}`}
                  className={`journal-trip-card ${t.role === 'owner' ? 'is-owner' : 'is-member'}`}
                >
                  <span className="journal-trip-head">
                    <span className="journal-trip-name">{t.name}</span>
                    <span className="journal-trip-badge">{t.role === 'owner' ? '我建立' : '已加入'}</span>
                  </span>
                  <span className="journal-trip-meta">
                    {range && (
                      <span>
                        <MapPin size={12} aria-hidden="true" /> {range}
                      </span>
                    )}
                    <span>
                      <Users size={12} aria-hidden="true" /> 開啟行程
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="journal-actions">
          <Link to="/new" className="journal-cta-primary">
            <BookOpen size={17} aria-hidden="true" />
            開新行程
          </Link>
          <div className="journal-divider">或</div>
          <Link to="/join" className="journal-cta-secondary">
            <KeyRound size={15} aria-hidden="true" />
            用分享碼加入
          </Link>
        </div>
        {loginFooter}
      </div>
    </div>
  )
}
