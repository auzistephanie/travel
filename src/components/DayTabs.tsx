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
      {days.map((day) => (
        <button
          key={day.id}
          type="button"
          role="tab"
          aria-selected={day.id === activeDayId}
          onClick={() => onChange(day.id)}
        >
          {formatDayLabel(day.date)}
        </button>
      ))}
    </nav>
  )
}
