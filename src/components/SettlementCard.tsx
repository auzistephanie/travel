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

  if (transactions.length === 0) return <p>結算：大家清晒數</p>

  return (
    <section aria-label="結算">
      <h3>結算</h3>
      <ul>
        {transactions.map((t) => (
          <li key={`${t.fromMemberId}-${t.toMemberId}`}>
            {nameById.get(t.fromMemberId) ?? '未知'} 找 HK${t.amountHKD.toFixed(2)} 俾{' '}
            {nameById.get(t.toMemberId) ?? '未知'}
          </li>
        ))}
      </ul>
    </section>
  )
}
