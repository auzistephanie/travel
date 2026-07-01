import { supabase } from './supabaseClient'
import type { Expense, ExpenseCategory } from '../types/models'

export async function listExpenses(tripId: string): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select().eq('trip_id', tripId)
  if (error) throw error
  return (data ?? []) as Expense[]
}

export interface AddExpenseInput {
  tripId: string
  title: string
  amount: number
  currency: string
  payerId: string | null
  splitMemberIds: string[]
  dayId: string | null
  category: ExpenseCategory
  isTripBase: boolean
}

export async function addExpense(input: AddExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      trip_id: input.tripId,
      title: input.title,
      amount: input.amount,
      currency: input.currency,
      payer_id: input.payerId,
      split_member_ids: input.splitMemberIds,
      day_id: input.dayId,
      category: input.category,
      is_trip_base: input.isTripBase,
    })
    .select()
    .single()

  if (error) throw error
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
