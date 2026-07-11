import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Compass, KeyRound, MapPin, Trash2, Users } from 'lucide-react'
import { getMyTrips, mergeMyTrips, removeMyTrip, type MyTripEntry } from '../lib/myTrips'
import { getCurrentAuthUser, onAuthUserChange, signInWithGoogle, type AuthUser } from '../lib/ownerAuth'
import { deleteTripByShareCode, getTripsForAuthUser, TRIP_DELETE_DENIED } from '../lib/tripApi'
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
  const [confirmDelete, setConfirmDelete] = useState<MyTripEntry | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  function openConfirm(entry: MyTripEntry, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleteError(null)
    setConfirmDelete(entry)
  }

  function handleRemoveFromList(shareCode: string) {
    removeMyTrip(shareCode)
    setTrips(getMyTrips())
    setConfirmDelete(null)
  }

  async function handleDeleteForever(entry: MyTripEntry) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteTripByShareCode(entry.shareCode)
      removeMyTrip(entry.shareCode)
      setTrips(getMyTrips())
      setConfirmDelete(null)
    } catch (err) {
      setDeleteError(
        err instanceof Error && err.message === TRIP_DELETE_DENIED
          ? '刪除失敗：請確認已以建立行程的 Google 帳戶登入'
          : '刪除失敗，請再試一次',
      )
    } finally {
      setDeleting(false)
    }
  }

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
                    <span className="journal-trip-head-right">
                      <span className="journal-trip-badge">{t.role === 'owner' ? '我建立' : '已加入'}</span>
                      <button
                        type="button"
                        className="journal-trip-delete"
                        aria-label={`管理 ${t.name}`}
                        onClick={(e) => openConfirm(t, e)}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </span>
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

      {confirmDelete && (
        <div className="journal-confirm-overlay" onClick={() => !deleting && setConfirmDelete(null)}>
          <div
            className="journal-confirm-card"
            role="dialog"
            aria-label="刪除行程"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="journal-confirm-title">刪除「{confirmDelete.name}」？</p>
            <p className="journal-confirm-desc">
              「從清單移除」淨係喺呢部裝置隱藏，資料仲喺。
              {confirmDelete.role === 'owner' && (
                <>
                  <br />
                  「徹底刪除」連夾錢、行李、行程全部清走，不可還原。
                </>
              )}
            </p>
            <div className="journal-confirm-actions">
              <button
                type="button"
                className="journal-confirm-remove"
                disabled={deleting}
                onClick={() => handleRemoveFromList(confirmDelete.shareCode)}
              >
                從清單移除
              </button>
              {confirmDelete.role === 'owner' &&
                (authUser ? (
                  <button
                    type="button"
                    className="journal-confirm-delete"
                    disabled={deleting}
                    onClick={() => handleDeleteForever(confirmDelete)}
                  >
                    {deleting ? '刪除中…' : '徹底刪除行程'}
                  </button>
                ) : (
                  <p className="journal-confirm-desc">
                    要徹底刪除行程，請先以 Google 登入（頁面下方有登入按鈕），以防其他人誤刪。
                  </p>
                ))}
              <button
                type="button"
                className="journal-confirm-cancel"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
              >
                取消
              </button>
            </div>
            {deleteError && <p role="alert" className="journal-confirm-error">{deleteError}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
