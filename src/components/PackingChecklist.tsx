import { usePackingChecklist } from '../hooks/usePackingChecklist'
import { StampBadge } from './StampBadge'
import type { PackingItem } from '../types/models'

interface PackingChecklistProps {
  tripId: string
  dayCount: number
}

export function PackingChecklist({ tripId, dayCount }: PackingChecklistProps) {
  const { items, loading, error, toggle } = usePackingChecklist(tripId, dayCount)

  if (loading) return <p>載入中…</p>
  if (error) return <p role="alert">{error}</p>
  if (items.length === 0) return null

  const doneCount = items.filter((item) => item.checked).length
  const allDone = doneCount === items.length
  const pct = Math.round((doneCount / items.length) * 100)

  const byCategory = new Map<string, PackingItem[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  return (
    <section aria-label="行李清單">
      <div className="pk-head">
        <div className="pk-ring" style={{ ['--pct' as string]: `${pct}%` }} aria-hidden="true">
          <span>{pct}%</span>
        </div>
        <div className="pk-head-txt">
          <h2>行李清單</h2>
          <p className="pk-sub">
            {items.length} 件 · 已執 {doneCount} 件
          </p>
        </div>
        {allDone && <StampBadge label="收拾完成" />}
      </div>
      {[...byCategory.entries()].map(([category, categoryItems]) => (
        <div key={category} className="pk-cat">
          <h3>{category}</h3>
          <ul className="pk-list">
            {categoryItems.map((item) => (
              <li key={item.id} className={item.checked ? 'pk-item done' : 'pk-item'}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => toggle(item.id, e.target.checked)}
                  />
                  {item.name}
                  {item.auto_qty && <span className="pk-auto"> 自動</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
