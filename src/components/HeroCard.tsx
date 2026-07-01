import { CalendarDays, PlaneTakeoff, Users } from 'lucide-react'
import { inclusiveDayCount } from '../lib/tripDays'
import { useDestinationCountry } from '../hooks/useDestinationCountry'
import { DestinationIllustration } from './DestinationIllustration'
import type { TripPageProps } from '../types/props'

function daysUntilDeparture(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00`)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((start.getTime() - today.getTime()) / 86_400_000)
}

export function HeroCard({ trip, members }: TripPageProps) {
  const days = inclusiveDayCount(trip.start_date, trip.end_date)
  const nights = Math.max(days - 1, 0)
  const countryCode = useDestinationCountry(trip)
  const until = daysUntilDeparture(trip.start_date)
  const upcoming = until > 0
  const countNum = upcoming ? until : 0
  const countMsg = upcoming ? '開始準備行李' : until === 0 ? '今日出發' : '旅程進行中'

  return (
    <section className="hero-card">
      <div className="hero-media">
        <DestinationIllustration countryCode={countryCode} className="hero-illo" />
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-caption">
          <h1>{trip.name}</h1>
        </div>
      </div>

      <div className="hero-body">
        <p className="hero-dates">
          {trip.start_date} – {trip.end_date}
        </p>

        <ul className="member-avatars">
          {members.map((member) => (
            <li key={member.id} title={member.name}>
              {member.name.slice(0, 1)}
            </li>
          ))}
        </ul>

        <div className="countdown">
          <PlaneTakeoff className="cd-plane" size={72} aria-hidden="true" />
          <div>
            <span className="cd-label">{until >= 0 ? '距離出發還有' : '旅程'}</span>
            <span className="cd-num">{countNum}</span>
            <span className="cd-sub">日 · {countMsg}</span>
          </div>
          <div className="cd-dates">
            {trip.start_date.slice(5)} 出發
            <br />
            {trip.end_date.slice(5)} 返程
            <br />
            <span style={{ opacity: 0.7 }}>
              {days} 日 {nights} 夜
            </span>
          </div>
        </div>

        <ul className="stat-chips">
          <li>
            <span className="sc-ico">
              <CalendarDays size={17} aria-hidden="true" />
            </span>
            <b>{days} 日</b>
            <span className="sc-lbl">日數</span>
          </li>
          <li>
            <span className="sc-ico">
              <Users size={17} aria-hidden="true" />
            </span>
            <b>{members.length} 人</b>
            <span className="sc-lbl">同行</span>
          </li>
          <li>
            <span className="sc-ico">
              <PlaneTakeoff size={17} aria-hidden="true" />
            </span>
            <b>{countNum}</b>
            <span className="sc-lbl">日後出發</span>
          </li>
        </ul>
      </div>
    </section>
  )
}
