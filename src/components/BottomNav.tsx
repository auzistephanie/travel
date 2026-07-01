import { Compass, CalendarDays, Map, Luggage, Wallet, type LucideIcon } from 'lucide-react'

export type TabId = 'overview' | 'itinerary' | 'map' | 'prep' | 'money'

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: 'overview', label: '總覽', Icon: Compass },
  { id: 'itinerary', label: '行程', Icon: CalendarDays },
  { id: 'map', label: '地圖', Icon: Map },
  { id: 'prep', label: '準備', Icon: Luggage },
  { id: 'money', label: '錢', Icon: Wallet },
]

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav role="tablist" aria-label="主導覽">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={id === active}
          aria-current={id === active ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <span className="nav-ico" aria-hidden="true">
            <Icon size={20} />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
