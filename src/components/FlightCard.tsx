import type { Flight } from '../types/models'

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-HK', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface FlightCardProps {
  flight: Flight
}

export function FlightCard({ flight }: FlightCardProps) {
  return (
    <article>
      <header>
        <strong>{flight.code}</strong>
        <span>
          {flight.from_airport} → {flight.to_airport}
        </span>
      </header>
      <p>
        {formatTime(flight.from_time)} – {formatTime(flight.to_time)}
      </p>
      <ul>
        {flight.terminal && <li>客運大樓 {flight.terminal}</li>}
        {flight.gate && <li>登機口 {flight.gate}</li>}
        {flight.seat && <li>座位 {flight.seat}</li>}
        {flight.pnr && <li>確認碼 {flight.pnr}</li>}
        {flight.baggage_kg != null && <li>寄艙 {flight.baggage_kg}kg</li>}
      </ul>
    </article>
  )
}
