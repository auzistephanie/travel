import { useCallback } from 'react'
import { addExpense, deleteExpense, listExpenses, type AddExpenseInput } from '../lib/expenseRepo'
import { useTripCollection } from './useTripCollection'
import type { Expense } from '../types/models'

export function useExpenses(tripId: string) {
  const loader = useCallback(() => listExpenses(tripId), [tripId])
  const { items: expenses, setItems, loading, error, refetch } = useTripCollection<Expense>(loader, '讀取開支失敗')

  const create = useCallback(
    async (input: Omit<AddExpenseInput, 'tripId'>) => {
      const expense = await addExpense({ ...input, tripId })
      setItems((prev) => [...prev, expense])
      return expense
    },
    [tripId, setItems],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteExpense(id)
      setItems((prev) => prev.filter((e) => e.id !== id))
    },
    [setItems],
  )

  return { expenses, loading, error, addExpense: create, deleteExpense: remove, refetch }
}
