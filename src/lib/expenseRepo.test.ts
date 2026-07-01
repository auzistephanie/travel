import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuery } from '../test/supabaseQueryMock'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import { addExpense, deleteExpense, listExpenses } from './expenseRepo'

describe('listExpenses', () => {
  beforeEach(() => supabase.from.mockReset())

  it('returns expenses for a trip', async () => {
    const expenses = [{ id: 'e1', trip_id: 't1', title: '午餐', amount: 500, currency: 'JPY' }]
    supabase.from.mockImplementation(() => makeQuery({ data: expenses, error: null }))
    expect(await listExpenses('t1')).toEqual(expenses)
  })
})

describe('addExpense', () => {
  beforeEach(() => supabase.from.mockReset())

  it('inserts an expense with multi-currency, split members, category, and trip-base flag', async () => {
    const created = {
      id: 'e1',
      trip_id: 't1',
      title: '機票',
      amount: 3000,
      currency: 'HKD',
      payer_id: 'm1',
      split_member_ids: ['m1', 'm2'],
      day_id: null,
      category: '交通',
      is_trip_base: true,
    }
    supabase.from.mockImplementation(() => makeQuery({ data: created, error: null }))

    const result = await addExpense({
      tripId: 't1',
      title: '機票',
      amount: 3000,
      currency: 'HKD',
      payerId: 'm1',
      splitMemberIds: ['m1', 'm2'],
      dayId: null,
      category: '交通',
      isTripBase: true,
    })

    expect(result).toEqual(created)
  })
})

describe('deleteExpense', () => {
  it('deletes an expense by id', async () => {
    supabase.from.mockReset()
    supabase.from.mockImplementation(() => makeQuery({ data: null, error: null }))
    await expect(deleteExpense('e1')).resolves.toBeUndefined()
  })
})
