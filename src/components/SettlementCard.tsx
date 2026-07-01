import { useExchangeRates } from '../hooks/useExchangeRates'
import { computeBalancesHKD, simplifySettlement } from '../lib/settlement'
import type { Expense, TripMember } from '../types/models'

interface SettlementCardProps {
  expenses: Expense[]
  members: TripMember[]
}

export function SettlementCard({ expenses, members }: SettlementCardProps) {
  const currencies = [...new Set(expenses.map((e) => e.currency))]
  const rates = useExchangeRates(currencies)
  const balances = computeBalancesHKD(expenses, rates)
  const transactions = simplifySettlement(balances)

  const nameById = new Map(members.map((m) => [m.id, m.name]))

  if (transactions.length === 0) return <p className="settle-clear">結算：大家清晒數</p>

  return (
    <section className="settle-card" aria-label="結算">
      <h3>結算</h3>
      <ul className="settle-list">
        {transactions.map((t) => (
          <li key={`${t.fromMemberId}-${t.toMemberId}`} className="settle-row">
            <span className="settle-line">
              {nameById.get(t.fromMemberId) ?? '未知'} 找 HK${t.amountHKD.toFixed(2)} 俾{' '}
              {nameById.get(t.toMemberId) ?? '未知'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
