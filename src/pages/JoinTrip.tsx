import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { findTripByShareCode } from '../lib/tripApi'
import '../styles/journalCard.css'

export function JoinTrip() {
  const navigate = useNavigate()
  const [shareCode, setShareCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const code = shareCode.trim().toUpperCase()
    setSubmitting(true)
    setError(null)
    try {
      const result = await findTripByShareCode(code)
      if (!result) {
        setError('找不到這個分享碼的行程')
        setSubmitting(false)
        return
      }
      navigate(`/t/${code}`)
    } catch {
      setError('讀取失敗，請再試一次')
      setSubmitting(false)
    }
  }

  return (
    <div className="journal-page">
      <form className="journal-card" onSubmit={handleSubmit}>
        <h1>用分享碼加入</h1>
        <label htmlFor="share-code">分享碼</label>
        <input id="share-code" value={shareCode} onChange={(e) => setShareCode(e.target.value)} required />
        <button type="submit" disabled={submitting}>
          加入
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </div>
  )
}
