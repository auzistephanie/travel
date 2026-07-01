import { usePackingChecklist } from '../hooks/usePackingChecklist'
import type { PackingItem } from '../types/models'

interface PackingChecklistProps {
  tripId: string
  dayCount: number
}

export function PackingChecklist({ tripId, dayCount }: PackingChecklistProps) {
  const { items, loading, error, toggle } = usePackingChecklist(tripId, dayCount)

  if (loading) return <p>載入緊…</p>
  if (error) return <p role="alert">{error}</p>
  if (items.length === 0) return null

  const allDone = items.every((item) => item.checked)

  const byCategory = new Map<string, PackingItem[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  return (
    <section aria-label="行李清單">
      <h2>行李清單</h2>
      {allDone && <p aria-label="執晒印章">✅ 執晒</p>}
      {[...byCategory.entries()].map(([category, categoryItems]) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {categoryItems.map((item) => (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => toggle(item.id, e.target.checked)}
                  />
                  {item.name}
                  {item.auto_qty && <span> 自動</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
