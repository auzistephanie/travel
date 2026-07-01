import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrip } from '../lib/tripApi'
import { setWhoAmI } from '../lib/whoAmI'

export function CreateTrip() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { trip, owner } = await createTrip({ name, startDate, endDate, ownerName })
      setWhoAmI(trip.share_code, owner.id)
      navigate(`/t/${trip.share_code}`)
    } catch {
      setError('建立失敗，請再試一次')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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

      <label htmlFor="owner-name">你嘅名</label>
      <input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />

      <button type="submit" disabled={submitting}>
        建立行程
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}
