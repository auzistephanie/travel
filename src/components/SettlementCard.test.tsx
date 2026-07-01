import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettlementCard } from './SettlementCard'
import type { Expense, TripMember } from '../types/models'

const useExchangeRates = vi.fn()
vi.mock('../hooks/useExchangeRates', () => ({ useExchangeRates: (...a: unknown[]) => useExchangeRates(...a) }))

const members: TripMember[] = [
  { id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true },
  { id: 'm2', trip_id: 't1', name: '阿珍', color: null, is_owner: false },
]

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

describe('SettlementCard', () => {
  beforeEach(() => {
    useExchangeRates.mockReset()
    useExchangeRates.mockReturnValue({})
  })

  it('shows everyone is settled when there are no expenses', () => {
    render(<SettlementCard expenses={[]} members={members} />)
    expect(screen.getByText('結算：大家清晒數')).toBeInTheDocument()
  })

  it('shows who owes whom by name with the HKD amount', () => {
    render(<SettlementCard expenses={[expense({ amount: 100 })]} members={members} />)
    expect(screen.getByText(/阿珍 找 HK\$50\.00 俾 阿明/)).toBeInTheDocument()
  })
})
