import { describe, expect, it } from 'vitest'
import { computeBalancesHKD, simplifySettlement } from './settlement'
import type { Expense } from '../types/models'

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    trip_id: 't1',
    title: '午餐',
    amount: 100,
    currency: 'HKD',
    payer_id: 'm1',
    split_member_ids: ['m1', 'm2'],
    day_id: null,
    category: '餐飲',
    is_trip_base: false,
    ...overrides,
  }
}

describe('computeBalancesHKD', () => {
  it('credits the payer and debits each split member equally', () => {
    const balances = computeBalancesHKD([expense({ amount: 100, payer_id: 'm1', split_member_ids: ['m1', 'm2'] })], {})
    expect(balances.m1).toBeCloseTo(50)
    expect(balances.m2).toBeCloseTo(-50)
  })

  it('converts foreign currency to HKD using the given rate', () => {
    const balances = computeBalancesHKD(
      [expense({ amount: 1000, currency: 'JPY', payer_id: 'm1', split_member_ids: ['m1', 'm2'] })],
      { JPY: 0.05 },
    )
    // 1000 JPY * 0.05 = 50 HKD total, split 2 ways = 25 each
    expect(balances.m1).toBeCloseTo(25)
    expect(balances.m2).toBeCloseTo(-25)
  })

  it('skips an expense whose currency has no known rate', () => {
    const balances = computeBalancesHKD(
      [expense({ amount: 1000, currency: 'THB', payer_id: 'm1', split_member_ids: ['m1', 'm2'] })],
      {},
    )
    expect(balances).toEqual({})
  })

  it('accumulates across multiple expenses', () => {
    const balances = computeBalancesHKD(
      [
        expense({ id: 'e1', amount: 100, payer_id: 'm1', split_member_ids: ['m1', 'm2'] }),
        expense({ id: 'e2', amount: 60, payer_id: 'm2', split_member_ids: ['m1', 'm2'] }),
      ],
      {},
    )
    // e1: m1 +100 -50, e2: m2 +60 -30 => m1: +50-30=20, m2: -50+60-30=-20
    expect(balances.m1).toBeCloseTo(20)
    expect(balances.m2).toBeCloseTo(-20)
  })
})

describe('simplifySettlement', () => {
  it('produces a single transaction for a simple two-person debt', () => {
    const transactions = simplifySettlement({ m1: 50, m2: -50 })
    expect(transactions).toEqual([{ fromMemberId: 'm2', toMemberId: 'm1', amountHKD: 50 }])
  })

  it('produces no transactions when everyone is settled', () => {
    expect(simplifySettlement({ m1: 0, m2: 0 })).toEqual([])
  })

  it('simplifies a 3-person triangle into 2 transactions instead of 3', () => {
    // m3 is owed 20 total; m1 and m2 each owe 10
    const transactions = simplifySettlement({ m1: -10, m2: -10, m3: 20 })
    expect(transactions).toHaveLength(2)
    const total = transactions.reduce((sum, t) => sum + t.amountHKD, 0)
    expect(total).toBeCloseTo(20)
    expect(transactions.every((t) => t.toMemberId === 'm3')).toBe(true)
  })
})
