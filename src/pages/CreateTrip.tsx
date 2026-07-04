import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrip } from '../lib/tripApi'
import { setWhoAmI } from '../lib/whoAmI'
import { sendOwnerLoginLink } from '../lib/ownerAuth'
import { DESTINATIONS } from '../lib/destinations'
import type { Trip, TripMember } from '../types/models'
import '../styles/journalCard.css'

// HK 淨係做本地行程參考用，唔擺入揀項。SG/MY 未有自訂插畫（用返 Generic），
// 之後想加插畫可以加落 src/theme/illustrations 同 DestinationIllustration.tsx 嘅 ILLUSTRATIONS map。
const DESTINATION_OPTIONS = ['JP', 'TH', 'KR', 'TW', 'VN', 'SG', 'MY'] as const

export function CreateTrip() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [destinationCountry, setDestinationCountry] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ trip: Trip; owner: TripMember } | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [linkSent, setLinkSent] = useState(false)
  const [sendingLink, setSendingLink] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { trip, owner } = await createTrip({
        name,
        startDate,
        endDate,
        ownerName,
        destinationCountry: destinationCountry || null,
      })
      setWhoAmI(trip.share_code, owner.id)
      setCreated({ trip, owner })
    } catch {
      setError('建立失敗，請再試一次')
      setSubmitting(false)
    }
  }

  function goToTrip() {
    if (!created) return
    navigate(`/t/${created.trip.share_code}`)
  }

  async function handleSendLoginLink() {
    if (!created) return
    const trimmed = loginEmail.trim()
    if (!trimmed || sendingLink) return
    setSendingLink(true)
    setLoginError(null)
    try {
      await sendOwnerLoginLink(
        trimmed,
        `${window.location.origin}/t/${created.trip.share_code}?m=${created.owner.id}`,
      )
      setLinkSent(true)
    } catch {
      setLoginError('寄唔到登入連結，請檢查 email，或者遲啲入行程嘅「設定」度再試')
    } finally {
      setSendingLink(false)
    }
  }

  if (created) {
    return (
      <div className="journal-page">
        <div className="journal-card">
          <h1>行程建立成功！</h1>
          <p>
            留低你個 email，就算之後換裝置或瀏覽器都認得返你，唔使再揀名。呢步可以跳過，遲啲入
            設定 都做得到。
          </p>
          {linkSent ? (
            <p>登入連結已寄去 {loginEmail}，請去信箱撳連結完成登入。</p>
          ) : (
            <>
              <label htmlFor="owner-login-email">Email</label>
              <input
                id="owner-login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <button type="button" onClick={handleSendLoginLink} disabled={sendingLink}>
                寄登入連結
              </button>
              {loginError && <p role="alert">{loginError}</p>}
            </>
          )}
          <button type="button" onClick={goToTrip}>
            {linkSent ? '入去行程' : '遲啲先，直接入去行程'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="journal-page">
      <form className="journal-card" onSubmit={handleSubmit}>
        <h1>開新行程</h1>
        <label htmlFor="trip-name">行程名</label>
        <input id="trip-name" value={name} onChange={(e) => setName(e.target.value)} required />

        <label htmlFor="trip-start">開始日期</label>
        <input
          id="trip-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />

        <label htmlFor="trip-end">結束日期</label>
        <input id="trip-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />

        <label htmlFor="owner-name">你的名字</label>
        <input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />

        <label htmlFor="destination-country">目的地國家</label>
        <select
          id="destination-country"
          value={destinationCountry}
          onChange={(e) => setDestinationCountry(e.target.value)}
        >
          <option value="">未定（加入航班後自動判斷）</option>
          {DESTINATION_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {DESTINATIONS[code].countryName}
            </option>
          ))}
        </select>

        <button type="submit" disabled={submitting}>
          建立行程
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </div>
  )
}
