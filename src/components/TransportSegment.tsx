import { useEffect, useState } from 'react'
import { fetchTransportEstimate, type TransportEstimate, type TransportMode } from '../lib/directionsApi'

const MODES: TransportMode[] = ['WALK', 'TRANSIT', 'DRIVE']
const MODE_LABELS: Record<TransportMode, string> = { WALK: '步行', TRANSIT: '電車', DRIVE: '自駕' }

interface TransportSegmentProps {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
}

export function TransportSegment({ from, to }: TransportSegmentProps) {
  const [mode, setMode] = useState<TransportMode>('WALK')
  const [estimate, setEstimate] = useState<TransportEstimate | null>(null)

  useEffect(() => {
    setEstimate(null)
    fetchTransportEstimate(from, to, mode).then(setEstimate)
  }, [from.lat, from.lng, to.lat, to.lng, mode])

  return (
    <div>
      {MODES.map((m) => (
        <button key={m} type="button" aria-pressed={m === mode} onClick={() => setMode(m)}>
          {MODE_LABELS[m]}
        </button>
      ))}
      {estimate && <span>{estimate.durationMinutes} 分鐘</span>}
    </div>
  )
}
