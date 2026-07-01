import { useEffect, useState } from 'react'
import { useFlights } from '../hooks/useFlights'
import { useDestinationWeather } from '../hooks/useDestinationWeather'
import { getAirport, getFirstFlightAirport } from '../lib/airports'
import { getDestination } from '../lib/destinations'
import { fetchExchangeRateToHKD } from '../lib/fxApi'
import { anyHalfDayRainAtLeast, tripTemperatureRange } from '../lib/weatherApi'
import { temperatureTips } from '../lib/packingTips'
import type { TripPageProps } from '../types/props'

export function PackingSmartCard({ trip, members }: TripPageProps) {
  const { flights } = useFlights(trip.id)
  const weatherByDate = useDestinationWeather(trip)
  const [hkdRate, setHkdRate] = useState<number | null>(null)

  const airportCode = getFirstFlightAirport(flights)
  const airport = airportCode ? getAirport(airportCode) : undefined
  const destination = airport ? getDestination(airport.country) : undefined

  useEffect(() => {
    if (!destination) return
    fetchExchangeRateToHKD(destination.cashAdvice.currency).then(setHkdRate)
  }, [destination])

  if (!destination) return null

  const days = Object.values(weatherByDate)
  const range = tripTemperatureRange(days)
  const rainy = anyHalfDayRainAtLeast(days)
  const tips = range ? temperatureTips(range.min, range.max, rainy, destination.mosquitoRisk) : []

  const memberById = new Map(members.map((m) => [m.id, m.name]))
  const baggageRows = flights.filter((f) => f.member_id && f.baggage_kg != null)

  const suggestedHkd =
    hkdRate != null ? Math.round(destination.cashAdvice.suggestedLocalAmount * hkdRate) : null

  return (
    <section aria-label="行李智能提醒">
      <h2>行李智能提醒 — {destination.countryName}</h2>
      <p>
        🔌 {destination.plugType} · {destination.voltage}
      </p>
      <p>🛂 {destination.visaNote}</p>
      <p>
        💵 {destination.cashAdvice.legalNote}，建議帶{' '}
        {destination.cashAdvice.suggestedLocalAmount.toLocaleString()} {destination.cashAdvice.currency}
        {suggestedHkd != null && ` (約 HK$${suggestedHkd.toLocaleString()})`}
      </p>
      {tips.length > 0 && (
        <ul>
          {tips.map((tip) => (
            <li key={tip.text}>
              {tip.icon} {tip.text}
            </li>
          ))}
        </ul>
      )}
      {baggageRows.length > 0 && (
        <>
          <h3>🧳 寄艙行李額</h3>
          <ul>
            {baggageRows.map((f) => (
              <li key={f.id}>
                {memberById.get(f.member_id as string) ?? '未指定'}：{f.baggage_kg}kg（{f.code}）
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
