import { useEffect, useState } from 'react'
import { Banknote, FileCheck, Luggage, Plug, Sparkles, Thermometer } from 'lucide-react'
import { useFlights } from '../hooks/useFlights'
import { useDestinationCountry } from '../hooks/useDestinationCountry'
import { useDestinationWeather } from '../hooks/useDestinationWeather'
import { getDestination } from '../lib/destinations'
import { fetchExchangeRateToHKD } from '../lib/fxApi'
import { anyHalfDayRainAtLeast, tripTemperatureRange } from '../lib/weatherApi'
import { temperatureTips } from '../lib/packingTips'
import type { TripPageProps } from '../types/props'

export function PackingSmartCard({ trip, members }: TripPageProps) {
  const { flights } = useFlights(trip.id)
  const countryCode = useDestinationCountry(trip)
  const weatherByDate = useDestinationWeather(trip)
  const [hkdRate, setHkdRate] = useState<number | null>(null)

  const destination = countryCode ? getDestination(countryCode) : undefined

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
      <div className="smart-grid">
        <div className="smart-card">
          <span className="sc2-ic">
            <Plug size={17} aria-hidden="true" />
          </span>
          <div className="sc2-k">轉插頭</div>
          <div className="sc2-v">
            {destination.plugType} · {destination.voltage}
          </div>
        </div>
        <div className="smart-card">
          <span className="sc2-ic">
            <FileCheck size={17} aria-hidden="true" />
          </span>
          <div className="sc2-k">簽證</div>
          <div className="sc2-v">{destination.visaNote}</div>
        </div>
        <div className="smart-card">
          <span className="sc2-ic">
            <Banknote size={17} aria-hidden="true" />
          </span>
          <div className="sc2-k">建議現金</div>
          <div className="sc2-v">
            {destination.cashAdvice.suggestedLocalAmount.toLocaleString()}{' '}
            {destination.cashAdvice.currency}
            {suggestedHkd != null && ` (約 HK$${suggestedHkd.toLocaleString()})`}
          </div>
        </div>
        {range && (
          <div className="smart-card">
            <span className="sc2-ic">
              <Thermometer size={17} aria-hidden="true" />
            </span>
            <div className="sc2-k">氣溫</div>
            <div className="sc2-v">
              {range.min}–{range.max}°C
            </div>
          </div>
        )}
      </div>
      {tips.length > 0 && (
        <ul className="tip-list">
          {tips.map((tip) => (
            <li key={tip.text}>
              <Sparkles size={13} aria-hidden="true" />
              {tip.text}
            </li>
          ))}
        </ul>
      )}
      {baggageRows.length > 0 && (
        <>
          <h3 className="sec-title">
            <Luggage size={17} aria-hidden="true" />
            寄艙行李額
          </h3>
          <ul className="baggage-list">
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
