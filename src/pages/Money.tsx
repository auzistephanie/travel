import { useState } from 'react'
import {
  Bed,
  Coins,
  Gift,
  Heart,
  Receipt,
  ShoppingBag,
  Train,
  Utensils,
} from 'lucide-react'
import { SubTabs } from '../components/SubTabs'
import { AddExpenseForm } from '../components/AddExpenseForm'
import { SettlementCard } from '../components/SettlementCard'
import { AddGiftForm } from '../components/AddGiftForm'
import { useExpenses } from '../hooks/useExpenses'
import { useGifts } from '../hooks/useGifts'
import { groupGiftsByRecipient } from '../lib/giftGrouping'
import type { Expense } from '../types/models'
import type { TripPageProps } from '../types/props'

const TABS = [
  { id: 'split', label: '夾錢' },
  { id: 'gift', label: '手信' },
]

function categoryIcon(category: string | null) {
  switch (category) {
    case '餐飲':
      return <Utensils size={17} aria-hidden="true" />
    case '住宿':
      return <Bed size={17} aria-hidden="true" />
    case '交通':
      return <Train size={17} aria-hidden="true" />
    case '購物':
      return <ShoppingBag size={17} aria-hidden="true" />
    default:
      return <Receipt size={17} aria-hidden="true" />
  }
}

function currencyTotals(expenses: Expense[]): [string, number][] {
  const totals = new Map<string, number>()
  for (const e of expenses) totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount)
  return [...totals.entries()]
}

function SplitView({ trip, members }: TripPageProps) {
  const { expenses, loading, error, addExpense } = useExpenses(trip.id)
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <p>載入中…</p>
  if (error) return <p role="alert">{error}</p>

  const nameById = new Map(members.map((m) => [m.id, m.name]))
  const totals = currencyTotals(expenses)

  return (
    <div>
      <div className="money-summary">
        <Coins className="ms-bg" size={72} aria-hidden="true" />
        <div className="ms-label">今程開支 · {expenses.length} 筆</div>
        <div className="ms-figs">
          {totals.length === 0 ? (
            <span className="ms-empty">尚未記帳</span>
          ) : (
            totals.map(([cur, amt]) => (
              <span key={cur} className="ms-fig">
                {cur} {amt.toLocaleString()}
              </span>
            ))
          )}
        </div>
      </div>

      <ul className="expense-list">
        {expenses.map((expense) => (
          <li key={expense.id} className="expense-row">
            <span className="er-ic">{categoryIcon(expense.category)}</span>
            <span className="er-main">
              <b>
                {expense.title}
                {expense.is_trip_base && <span className="base-flag">基本費</span>}
              </b>
              <small>
                {nameById.get(expense.payer_id ?? '') ?? '未指定'} 付款 · {expense.category}
              </small>
            </span>
            <span className="er-amt">
              {expense.amount.toLocaleString()} {expense.currency}
            </span>
          </li>
        ))}
      </ul>

      <button type="button" className="money-add" onClick={() => setShowAdd(true)}>
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

function GiftView({ trip, members }: TripPageProps) {
  const { gifts, loading, error, addGift } = useGifts(trip.id)
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <p>載入中…</p>
  if (error) return <p role="alert">{error}</p>

  const groups = groupGiftsByRecipient(gifts)
  const total = groups.reduce((sum, g) => sum + g.subtotal, 0)

  return (
    <div>
      <div className="gift-summary">
        <Gift className="gs-bg" size={72} aria-hidden="true" />
        <div className="gs-label">手信總使費</div>
        <div className="gs-amt">${total.toLocaleString()}</div>
        <div className="gs-sub">
          {gifts.length} 件 · 送 {groups.length} 人
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.recipient} className="gift-group" aria-label={`手信：${group.recipient}`}>
          <div className="gg-head">
            <span className="gg-av" aria-hidden="true">
              {group.recipient.slice(0, 1)}
            </span>
            <h3>
              {group.recipient}（小計 {group.subtotal}）
            </h3>
          </div>
          <ul className="gift-items">
            {group.gifts.map((gift) => (
              <li key={gift.id} className="gift-item">
                <span className="gi-ic">
                  <Gift size={16} aria-hidden="true" />
                </span>
                <span className="gi-main">
                  <b>{gift.item}</b>
                  <small>
                    {gift.source !== 'manual' && (
                      <span className="wish-link">
                        <Heart size={10} aria-hidden="true" />
                        來自心願
                      </span>
                    )}
                    {gift.store ?? ''}
                  </small>
                </span>
                {gift.amount != null && <span className="gi-amt">${gift.amount.toLocaleString()}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button type="button" className="money-add" onClick={() => setShowAdd(true)}>
        ＋加手信
      </button>
      {showAdd && (
        <AddGiftForm
          members={members}
          onAdd={(input) => {
            addGift(input)
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

export function Money({ trip, members }: TripPageProps) {
  const [subTab, setSubTab] = useState('split')

  return (
    <div>
      <SubTabs tabs={TABS} active={subTab} onChange={setSubTab} />
      {subTab === 'split' && <SplitView trip={trip} members={members} />}
      {subTab === 'gift' && <GiftView trip={trip} members={members} />}
    </div>
  )
}
