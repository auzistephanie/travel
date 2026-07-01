import { useState } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import { useItinerary } from '../hooks/useItinerary'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { dailyExpenses, groupExpensesByCategory, totalHKD, tripBaseExpenses } from '../lib/expenseGrouping'
import type { TripPageProps } from '../types/props'

type ViewMode = 'daily' | 'category'

export function SpendingSummaryCard({ trip }: TripPageProps) {
  const { expenses } = useExpenses(trip.id)
  const { days } = useItinerary(trip.id, trip.start_date, trip.end_date)
  const currencies = [...new Set(expenses.map((e) => e.currency))]
  const rates = useExchangeRates(currencies)
  const [view, setView] = useState<ViewMode>('daily')

  const tripBase = tripBaseExpenses(expenses)
  const tripBaseTotal = totalHKD(tripBase, rates)
  const categoryTotals = groupExpensesByCategory(expenses, rates)
  const grandTotal = categoryTotals.reduce((sum, c) => sum + c.totalHKD, 0)

  return (
    <section aria-label="開支洗去邊">
      <h2>開支洗去邊</h2>
      {tripBase.length > 0 && (
        <div aria-label="旅行基本費">
          <strong>旅行基本費</strong>：HK${tripBaseTotal.toFixed(0)}
        </div>
      )}
      <div>
        <button type="button" aria-pressed={view === 'daily'} onClick={() => setView('daily')}>
          📅 逐日洗費
        </button>
        <button type="button" aria-pressed={view === 'category'} onClick={() => setView('category')}>
          📊 分類總覽
        </button>
      </div>
      {view === 'daily' && (
        <ul>
          {days.map((day) => {
            const total = totalHKD(dailyExpenses(expenses, day.id), rates)
            return (
              <li key={day.id}>
                {day.date}：HK${total.toFixed(0)}
              </li>
            )
          })}
        </ul>
      )}
      {view === 'category' && (
        <ul>
          {categoryTotals.map((c) => {
            const percentage = grandTotal > 0 ? Math.round((c.totalHKD / grandTotal) * 100) : 0
            return (
              <li key={c.category}>
                {c.category}：HK${c.totalHKD.toFixed(0)}（{percentage}%）
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
