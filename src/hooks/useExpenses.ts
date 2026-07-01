import { useCallback, useEffect, useState } from 'react'
import { addExpense, deleteExpense, listExpenses, type AddExpenseInput } from '../lib/expenseRepo'
import type { Expense } from '../types/models'

export function useExpenses(tripId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setExpenses(await listExpenses(tripId))
    } catch {
      setError('讀取開支失敗')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (input: Omit<AddExpenseInput, 'tripId'>) => {
      const expense = await addExpense({ ...input, tripId })
      setExpenses((prev) => [...prev, expense])
      return expense
    },
    [tripId],
  )

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { expenses, loading, error, addExpense: create, deleteExpense: remove, refetch: load }
}
