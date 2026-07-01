import { inclusiveDayCount } from '../lib/tripDays'
import { useDestinationCountry } from '../hooks/useDestinationCountry'
import { DestinationIllustration } from './DestinationIllustration'
import type { TripPageProps } from '../types/props'

export function HeroCard({ trip, members }: TripPageProps) {
  const days = inclusiveDayCount(trip.start_date, trip.end_date)
  const countryCode = useDestinationCountry(trip.id)

  return (
    <section>
      <DestinationIllustration countryCode={countryCode} width={320} className="hero-illustration" />
      <h1>{trip.name}</h1>
      <p>
        {trip.start_date} – {trip.end_date}
      </p>
      <ul>
        {members.map((member) => (
          <li key={member.id} title={member.name}>
            {member.name.slice(0, 1)}
          </li>
        ))}
      </ul>
      <dl>
        <div>
          <dt>日數</dt>
          <dd>{days} 日</dd>
        </div>
        <div>
          <dt>人數</dt>
          <dd>{members.length} 人</dd>
        </div>
      </dl>
    </section>
  )
}
