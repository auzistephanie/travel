import { useState } from 'react'
import { SubTabs } from '../components/SubTabs'
import { AddExpenseForm } from '../components/AddExpenseForm'
import { SettlementCard } from '../components/SettlementCard'
import { useExpenses } from '../hooks/useExpenses'
import type { TripPageProps } from '../types/props'

const TABS = [
  { id: 'split', label: '夾錢' },
  { id: 'gift', label: '手信' },
]

function SplitView({ trip, members }: TripPageProps) {
  const { expenses, loading, error, addExpense } = useExpenses(trip.id)
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <p>載入緊…</p>
  if (error) return <p role="alert">{error}</p>

  const nameById = new Map(members.map((m) => [m.id, m.name]))

  return (
    <div>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {expense.title}：{expense.amount} {expense.currency}（
            {nameById.get(expense.payer_id ?? '') ?? '未指定'} 俾錢，分類：{expense.category}
            {expense.is_trip_base && '，旅行基本費'}）
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setShowAdd(true)}>
        ＋加開支
      </button>
      {showAdd && (
        <AddExpenseForm
          members={members}
          onAdd={(input) => {
            addExpense(input)
            setShowAdd(false)
          }}
        />
      )}
      <SettlementCard expenses={expenses} members={members} />
    </div>
  )
}

export function Money({ trip, members }: TripPageProps) {
  const [subTab, setSubTab] = useState('split')

  return (
    <div>
      <SubTabs tabs={TABS} active={subTab} onChange={setSubTab} />
      {subTab === 'split' && <SplitView trip={trip} members={members} />}
      {subTab === 'gift' && <p>手信 — 即將推出</p>}
    </div>
  )
}
