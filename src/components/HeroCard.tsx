import type { TripPageProps } from '../types/props'

function inclusiveDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((end.getTime() - start.getTime()) / msPerDay) + 1
}

export function HeroCard({ trip, members }: TripPageProps) {
  const days = inclusiveDayCount(trip.start_date, trip.end_date)

  return (
    <section>
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
