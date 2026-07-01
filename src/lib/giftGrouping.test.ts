import { describe, expect, it } from 'vitest'
import { groupGiftsByRecipient } from './giftGrouping'
import type { Gift } from '../types/models'

function gift(overrides: Partial<Gift>): Gift {
  return {
    id: 'g1',
    trip_id: 't1',
    item: '曲奇',
    store: null,
    amount: 100,
    to_member: '自己',
    source: 'manual',
    ...overrides,
  }
}

describe('groupGiftsByRecipient', () => {
  it('groups gifts by recipient, including "自己"', () => {
    const gifts = [
      gift({ id: 'g1', to_member: '自己', amount: 100 }),
      gift({ id: 'g2', to_member: '阿珍', amount: 50 }),
      gift({ id: 'g3', to_member: '自己', amount: 30 }),
    ]
    const groups = groupGiftsByRecipient(gifts)
    const self = groups.find((g) => g.recipient === '自己')
    expect(self?.gifts).toHaveLength(2)
  })

  it('computes a subtotal per recipient, treating null amounts as 0', () => {
    const gifts = [gift({ to_member: '阿珍', amount: 50 }), gift({ id: 'g2', to_member: '阿珍', amount: null })]
    const groups = groupGiftsByRecipient(gifts)
    expect(groups.find((g) => g.recipient === '阿珍')?.subtotal).toBe(50)
  })
})
