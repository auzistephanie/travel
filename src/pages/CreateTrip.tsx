import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import { createTrip } from '../lib/tripApi'
import { setWhoAmI } from '../lib/whoAmI'
import { signInWithGoogle } from '../lib/ownerAuth'
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
  const [signingIn, setSigningIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)

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

  async function handleCopyInviteLink() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/t/${created.trip.share_code}`)
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    } catch {
      // 攞唔到 clipboard 權限就靜靜哋唔做嘢，用戶可以自己揀網址列複製
    }
  }

  async function handleGoogleSignIn() {
    if (!created || signingIn) return
    setSigningIn(true)
    setLoginError(null)
    try {
      await signInWithGoogle(`${window.location.origin}/t/${created.trip.share_code}?m=${created.owner.id}`)
    } catch {
      setLoginError('登入失敗，請遲啲入行程嘅「設定」度再試')
      setSigningIn(false)
    }
  }

  if (created) {
    return (
      <div className="journal-page">
        <div className="journal-card">
          <h1>行程建立成功！</h1>

          <h2>邀請朋友</h2>
          <p>把呢條連結傳畀朋友，佢哋撳開揀返自己個名就可以一齊編輯，唔使登入、唔使開帳戶。</p>
          <button type="button" onClick={handleCopyInviteLink}>
            {inviteCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {inviteCopied ? '已複製' : '複製邀請連結'}
          </button>

          <h2>你自己嘅登入</h2>
          <p>用 Google 登入，就算之後換裝置或瀏覽器都認得返你，唔使再揀名。呢步可以跳過，遲啲入 設定 都做得到。</p>
          <button type="button" onClick={handleGoogleSignIn} disabled={signingIn}>
            用 Google 登入
          </button>
          {loginError && <p role="alert">{loginError}</p>}
          <button type="button" onClick={goToTrip}>
            遲啲先，直接入去行程
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
