export type TabId = 'overview' | 'itinerary' | 'map' | 'prep' | 'money'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: '總覽', icon: '🏠' },
  { id: 'itinerary', label: '行程', icon: '🗓️' },
  { id: 'map', label: '地圖', icon: '🗺️' },
  { id: 'prep', label: '準備', icon: '🧳' },
  { id: 'money', label: '錢', icon: '💰' },
]

interface BottomNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav role="tablist" aria-label="主導覽">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          aria-current={tab.id === active ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          <span aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
