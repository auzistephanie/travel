import type { Expense } from '../types/models'

export function computeBalancesHKD(expenses: Expense[], ratesToHKD: Record<string, number>): Record<string, number> {
  const balances: Record<string, number> = {}

  for (const expense of expenses) {
    const rate = expense.currency === 'HKD' ? 1 : ratesToHKD[expense.currency]
    if (rate == null) continue // 冇匯率就跳過呢筆（未能折算做 HKD）

    const splitCount = expense.split_member_ids.length
    if (splitCount === 0) continue

    const amountHKD = expense.amount * rate

    if (expense.payer_id) {
      balances[expense.payer_id] = (balances[expense.payer_id] ?? 0) + amountHKD
    }

    const share = amountHKD / splitCount
    for (const memberId of expense.split_member_ids) {
      balances[memberId] = (balances[memberId] ?? 0) - share
    }
  }

  return balances
}

export interface SettlementTransaction {
  fromMemberId: string
  toMemberId: string
  amountHKD: number
}

const SETTLEMENT_EPSILON = 0.01

// Greedy debt simplification: repeatedly match the biggest creditor with the
// biggest debtor until everyone is settled. Minimizes the number of transactions.
export function simplifySettlement(balances: Record<string, number>): SettlementTransaction[] {
  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > SETTLEMENT_EPSILON)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < -SETTLEMENT_EPSILON)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount)

  const transactions: SettlementTransaction[] = []
  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const amount = Math.min(creditor.amount, debtor.amount)

    transactions.push({
      fromMemberId: debtor.id,
      toMemberId: creditor.id,
      amountHKD: Math.round(amount * 100) / 100,
    })

    creditor.amount -= amount
    debtor.amount -= amount
    if (creditor.amount <= SETTLEMENT_EPSILON) i++
    if (debtor.amount <= SETTLEMENT_EPSILON) j++
  }

  return transactions
}
