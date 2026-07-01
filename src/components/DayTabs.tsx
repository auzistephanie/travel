import type { ItineraryDay } from '../types/models'

function formatDayLabel(date: string): string {
  const [, month, day] = date.split('-')
  return `${month}/${day}`
}

interface DayTabsProps {
  days: ItineraryDay[]
  activeDayId: string
  onChange: (dayId: string) => void
}

export function DayTabs({ days, activeDayId, onChange }: DayTabsProps) {
  return (
    <nav role="tablist" aria-label="日程">
      {days.map((day, index) => (
        <button
          key={day.id}
          type="button"
          role="tab"
          aria-selected={day.id === activeDayId}
          onClick={() => onChange(day.id)}
        >
          <span className="dt-n" aria-hidden="true">
            {index + 1}
          </span>
          <span className="dt-d">{formatDayLabel(day.date)}</span>
        </button>
      ))}
    </nav>
  )
}
