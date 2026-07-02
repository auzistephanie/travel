import { useState, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { lookupFlight } from '../lib/flightApi'
import type { AddFlightInput } from '../lib/flightRepo'
import type { TripMember } from '../types/models'

interface AddFlightModalProps {
  members: TripMember[]
  onAdd: (input: Omit<AddFlightInput, 'tripId'>) => Promise<unknown>
  onClose: () => void
}

export function AddFlightModal({ members, onAdd, onClose }: AddFlightModalProps) {
  const [code, setCode] = useState('')
  const [date, setDate] = useState('')
  const [fromAirport, setFromAirport] = useState('')
  const [toAirport, setToAirport] = useState('')
  const [fromTime, setFromTime] = useState('')
  const [toTime, setToTime] = useState('')
  const [gate, setGate] = useState('')
  const [terminal, setTerminal] = useState('')
  const [seat, setSeat] = useState('')
  const [pnr, setPnr] = useState('')
  const [baggageKg, setBaggageKg] = useState('')
  const [memberId, setMemberId] = useState('')
  const [lookupHint, setLookupHint] = useState<string | null>(null)
  const [looking, setLooking] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleLookup() {
    setLooking(true)
    setLookupHint(null)
    try {
      const result = await lookupFlight(code, date)
      if (!result) {
        setLookupHint('查不到，請手動輸入')
        return
      }
      setFromAirport(result.fromAirport)
      setToAirport(result.toAirport)
      setFromTime(result.fromTime)
      setToTime(result.toTime)
      setGate(result.gate ?? '')
      setTerminal(result.terminal ?? '')
    } finally {
      setLooking(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onAdd({
        code,
        date,
        fromAirport,
        toAirport,
        fromTime,
        toTime,
        gate: gate || null,
        terminal: terminal || null,
        seat: seat || null,
        pnr: pnr || null,
        baggageKg: baggageKg ? Number(baggageKg) : null,
        memberId: memberId || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="wl-form modal-sheet"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2>加入航班</h2>
          <button type="button" className="settings-x" aria-label="關閉" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="wl-row">
          <div className="wl-field">
            <label htmlFor="flight-code">航班號</label>
            <input id="flight-code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="wl-field">
            <label htmlFor="flight-date">日期</label>
            <input
              id="flight-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="button"
          className="wl-ai"
          onClick={handleLookup}
          disabled={looking || !code || !date}
        >
          <Search size={13} aria-hidden="true" />
          {looking ? '查詢中…' : '查詢'}
        </button>
        {lookupHint && <p className="wl-hint">{lookupHint}</p>}

        <div className="wl-row">
          <div className="wl-field">
            <label htmlFor="flight-from-airport">出發機場</label>
            <input
              id="flight-from-airport"
              value={fromAirport}
              onChange={(e) => setFromAirport(e.target.value)}
              required
            />
          </div>
          <div className="wl-field">
            <label htmlFor="flight-to-airport">到達機場</label>
            <input
              id="flight-to-airport"
              value={toAirport}
              onChange={(e) => setToAirport(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="wl-row">
          <div className="wl-field">
            <label htmlFor="flight-from-time">出發時間</label>
            <input
              id="flight-from-time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              required
            />
          </div>
          <div className="wl-field">
            <label htmlFor="flight-to-time">到達時間</label>
            <input
              id="flight-to-time"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="wl-row">
          <div className="wl-field">
            <label htmlFor="flight-gate">登機口</label>
            <input id="flight-gate" value={gate} onChange={(e) => setGate(e.target.value)} />
          </div>
          <div className="wl-field">
            <label htmlFor="flight-terminal">客運大樓</label>
            <input id="flight-terminal" value={terminal} onChange={(e) => setTerminal(e.target.value)} />
          </div>
        </div>

        <div className="wl-row">
          <div className="wl-field">
            <label htmlFor="flight-seat">座位</label>
            <input id="flight-seat" value={seat} onChange={(e) => setSeat(e.target.value)} />
          </div>
          <div className="wl-field">
            <label htmlFor="flight-pnr">確認碼</label>
            <input id="flight-pnr" value={pnr} onChange={(e) => setPnr(e.target.value)} />
          </div>
        </div>

        <div className="wl-row">
          <div className="wl-field">
            <label htmlFor="flight-baggage">寄艙行李額 (KG)</label>
            <input
              id="flight-baggage"
              type="number"
              value={baggageKg}
              onChange={(e) => setBaggageKg(e.target.value)}
            />
          </div>
          <div className="wl-field">
            <label htmlFor="flight-member">乘客</label>
            <select id="flight-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">未指定</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="wl-cancel" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="wl-submit" disabled={saving}>
            加入航班
          </button>
        </div>
      </form>
    </div>
  )
}
