import type { Expense, ExpenseCategory } from '../types/models'

function toHKD(expense: Expense, ratesToHKD: Record<string, number>): number | null {
  const rate = expense.currency === 'HKD' ? 1 : ratesToHKD[expense.currency]
  if (rate == null) return null
  return expense.amount * rate
}

export function tripBaseExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => e.is_trip_base)
}

export function dailyExpenses(expenses: Expense[], dayId: string): Expense[] {
  return expenses.filter((e) => !e.is_trip_base && e.day_id === dayId)
}

export interface CategoryTotal {
  category: ExpenseCategory
  totalHKD: number
}

// 分類總覽計入所有開支（包括旅行基本費），逐日檢視就唔計（spec §6.1）
export function groupExpensesByCategory(expenses: Expense[], ratesToHKD: Record<string, number>): CategoryTotal[] {
  const totals = new Map<ExpenseCategory, number>()

  for (const expense of expenses) {
    const hkd = toHKD(expense, ratesToHKD)
    if (hkd == null) continue
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + hkd)
  }

  return [...totals.entries()].map(([category, totalHKD]) => ({ category, totalHKD }))
}

export function totalHKD(expenses: Expense[], ratesToHKD: Record<string, number>): number {
  return expenses.reduce((sum, expense) => sum + (toHKD(expense, ratesToHKD) ?? 0), 0)
}
