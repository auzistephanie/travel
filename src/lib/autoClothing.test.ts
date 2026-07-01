import { describe, expect, it } from 'vitest'
import { autoClothingQuantities } from './autoClothing'

describe('autoClothingQuantities', () => {
  it('gives one top, one set of underwear, and one pair of socks per day', () => {
    const items = autoClothingQuantities(5)
    expect(items).toContainEqual({ name: '上衣', qty: 5 })
    expect(items).toContainEqual({ name: '內衣', qty: 5 })
    expect(items).toContainEqual({ name: '襪', qty: 5 })
  })

  it('halves pants (worn every other day) and rounds up', () => {
    expect(autoClothingQuantities(5)).toContainEqual({ name: '褲', qty: 3 })
    expect(autoClothingQuantities(4)).toContainEqual({ name: '褲', qty: 2 })
  })

  it('always packs at least 1 day worth of clothing for a same-day trip', () => {
    expect(autoClothingQuantities(1)).toContainEqual({ name: '褲', qty: 1 })
  })
})
