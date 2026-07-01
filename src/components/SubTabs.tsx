interface SubTab {
  id: string
  label: string
}

interface SubTabsProps {
  tabs: SubTab[]
  active: string
  onChange: (id: string) => void
}

export function SubTabs({ tabs, active, onChange }: SubTabsProps) {
  return (
    <nav role="tablist" aria-label="子分頁">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
