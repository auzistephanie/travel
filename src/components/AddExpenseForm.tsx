import { useState, type FormEvent } from 'react'
import type { AddExpenseInput } from '../lib/expenseRepo'
import type { ExpenseCategory, TripMember } from '../types/models'

const CATEGORIES: ExpenseCategory[] = ['交通', '住宿', '餐飲', '門票', '購物', '其他']
const CURRENCIES = ['HKD', 'JPY', 'THB', 'KRW', 'TWD', 'VND']

interface AddExpenseFormProps {
  members: TripMember[]
  onAdd: (input: Omit<AddExpenseInput, 'tripId'>) => void
}

export function AddExpenseForm({ members, onAdd }: AddExpenseFormProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('HKD')
  const [payerId, setPayerId] = useState(members[0]?.id ?? '')
  const [splitMemberIds, setSplitMemberIds] = useState<string[]>([])
  const [category, setCategory] = useState<ExpenseCategory>('其他')
  const [isTripBase, setIsTripBase] = useState(false)

  function toggleSplitMember(memberId: string) {
    setSplitMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || splitMemberIds.length === 0) return
    onAdd({
      title,
      amount: Number(amount),
      currency,
      payerId: payerId || null,
      splitMemberIds,
      dayId: null,
      category,
      isTripBase,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="expense-title">項目</label>
      <input id="expense-title" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label htmlFor="expense-amount">金額</label>
      <input
        id="expense-amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <label htmlFor="expense-currency">貨幣</label>
      <select id="expense-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label htmlFor="expense-payer">俾錢人</label>
      <select id="expense-payer" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <fieldset>
        <legend>邊幾位分攤</legend>
        {members.map((m) => (
          <label key={m.id} htmlFor={`split-${m.id}`}>
            <input
              id={`split-${m.id}`}
              type="checkbox"
              checked={splitMemberIds.includes(m.id)}
              onChange={() => toggleSplitMember(m.id)}
            />
            {m.name}
          </label>
        ))}
      </fieldset>

      <label htmlFor="expense-category">分類</label>
      <select id="expense-category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label htmlFor="expense-trip-base">旅行基本費（唔計入逐日）</label>
      <input
        id="expense-trip-base"
        type="checkbox"
        checked={isTripBase}
        onChange={(e) => setIsTripBase(e.target.checked)}
      />

      <button type="submit">加入開支</button>
    </form>
  )
}
