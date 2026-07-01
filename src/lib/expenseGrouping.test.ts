import { describe, expect, it } from 'vitest'
import { dailyExpenses, groupExpensesByCategory, tripBaseExpenses } from './expenseGrouping'
import type { Expense } from '../types/models'

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    trip_id: 't1',
    title: '午餐',
    amount: 100,
    currency: 'HKD',
    payer_id: 'm1',
    split_member_ids: ['m1'],
    day_id: 'd1',
    category: '餐飲',
    is_trip_base: false,
    ...overrides,
  }
}

describe('tripBaseExpenses', () => {
  it('returns only expenses flagged as trip-base', () => {
    const expenses = [expense({ id: 'e1', is_trip_base: true }), expense({ id: 'e2', is_trip_base: false })]
    expect(tripBaseExpenses(expenses)).toEqual([expenses[0]])
  })
})

describe('dailyExpenses', () => {
  it('returns non-trip-base expenses for the given day', () => {
    const expenses = [
      expense({ id: 'e1', day_id: 'd1', is_trip_base: false }),
      expense({ id: 'e2', day_id: 'd2', is_trip_base: false }),
      expense({ id: 'e3', day_id: 'd1', is_trip_base: true }),
    ]
    expect(dailyExpenses(expenses, 'd1')).toEqual([expenses[0]])
  })
})

describe('groupExpensesByCategory', () => {
  it('sums HKD-converted amounts per category, including trip-base expenses', () => {
    const expenses = [
      expense({ id: 'e1', category: '餐飲', amount: 100, currency: 'HKD', is_trip_base: false }),
      expense({ id: 'e2', category: '交通', amount: 1000, currency: 'JPY', is_trip_base: true }),
      expense({ id: 'e3', category: '餐飲', amount: 50, currency: 'HKD', is_trip_base: false }),
    ]
    const totals = groupExpensesByCategory(expenses, { JPY: 0.05 })
    expect(totals).toContainEqual({ category: '餐飲', totalHKD: 150 })
    expect(totals).toContainEqual({ category: '交通', totalHKD: 50 })
  })

  it('skips expenses whose currency has no known rate', () => {
    const expenses = [expense({ category: '購物', amount: 100, currency: 'THB' })]
    expect(groupExpensesByCategory(expenses, {})).toEqual([])
  })
})
