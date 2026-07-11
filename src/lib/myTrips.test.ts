import { beforeEach, describe, expect, it } from 'vitest'
import { addMyTrip, getMyTrips, mergeMyTrips, removeMyTrip, touchMyTrip } from './myTrips'

describe('myTrips', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty list when nothing stored', () => {
    expect(getMyTrips()).toEqual([])
  })

  it('adds a trip and reads it back', () => {
    addMyTrip({ shareCode: 'ABC234', name: '東京', role: 'owner' })
    const list = getMyTrips()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ shareCode: 'ABC234', name: '東京', role: 'owner' })
  })

  it('upserts by shareCode without duplicating', () => {
    addMyTrip({ shareCode: 'ABC234', name: '東京', role: 'member' })
    addMyTrip({ shareCode: 'ABC234', name: '東京五日', role: 'owner' })
    const list = getMyTrips()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('東京五日')
    expect(list[0].role).toBe('owner')
  })

  it('sorts by most recently opened first', () => {
    addMyTrip({ shareCode: 'AAA111', name: '台北', role: 'member', lastOpened: 100 })
    addMyTrip({ shareCode: 'BBB222', name: '首爾', role: 'member', lastOpened: 200 })
    expect(getMyTrips().map((e) => e.shareCode)).toEqual(['BBB222', 'AAA111'])
  })

  it('touch updates lastOpened only for existing entries', () => {
    addMyTrip({ shareCode: 'AAA111', name: '台北', role: 'member', lastOpened: 1 })
    touchMyTrip('AAA111')
    touchMyTrip('NOPE999')
    const list = getMyTrips()
    expect(list).toHaveLength(1)
    expect(list[0].lastOpened).toBeGreaterThan(1)
  })

  it('removes a trip', () => {
    addMyTrip({ shareCode: 'AAA111', name: '台北', role: 'member' })
    addMyTrip({ shareCode: 'BBB222', name: '首爾', role: 'member' })
    removeMyTrip('AAA111')
    expect(getMyTrips().map((e) => e.shareCode)).toEqual(['BBB222'])
  })

  it('merge adds cloud trips without clobbering local lastOpened', () => {
    addMyTrip({ shareCode: 'AAA111', name: '台北', role: 'member', lastOpened: 500 })
    mergeMyTrips([
      { shareCode: 'AAA111', name: '台北', role: 'owner' },
      { shareCode: 'CCC333', name: '大阪', role: 'owner' },
    ])
    const list = getMyTrips()
    const taipei = list.find((e) => e.shareCode === 'AAA111')
    const osaka = list.find((e) => e.shareCode === 'CCC333')
    expect(taipei?.lastOpened).toBe(500)
    expect(taipei?.role).toBe('owner')
    expect(osaka?.lastOpened).toBe(0)
  })

  it('tolerates corrupt storage', () => {
    localStorage.setItem('myTrips', '{not json')
    expect(getMyTrips()).toEqual([])
  })
})
