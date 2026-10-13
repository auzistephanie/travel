import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalDemo } from './localDemoClient'
import { addExpense, listExpenses } from './expenseRepo'
import { addStop, ensureDays, listStops } from './itineraryRepo'
import { createTrip, deleteTripByShareCode, findTripByShareCode, TRIP_DELETE_DENIED } from './tripApi'

describe('local demo client', () => {
  beforeEach(() => {
    resetLocalDemo()
  })

  it('creates a trip, opens it by share code, and stores a stop plus an expense', async () => {
    const { trip, owner } = await createTrip({
      name: '大阪三日',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      ownerName: '小美',
      destinationCountry: 'JP',
    })

    const found = await findTripByShareCode(trip.share_code)
    expect(found?.trip.name).toBe('大阪三日')
    expect(found?.members.map((member) => member.name)).toEqual(['小美'])

    const days = await ensureDays(trip.id, trip.start_date, trip.end_date)
    expect(days).toHaveLength(2)
    const stop = await addStop({
      dayId: days[0].id,
      time: '10:00',
      title: '大阪城',
      placeName: '大阪市',
      lat: 34.687,
      lng: 135.526,
      orderIndex: 0,
    })
    expect((await listStops(days[0].id)).map((item) => item.id)).toEqual([stop.id])

    await addExpense({
      tripId: trip.id,
      title: '午餐',
      amount: 1200,
      currency: 'JPY',
      payerId: owner.id,
      splitMemberIds: [owner.id],
      dayId: days[0].id,
      category: '餐飲',
      isTripBase: false,
    })
    const expenses = await listExpenses(trip.id)
    expect(expenses).toHaveLength(1)
    expect(expenses[0].amount).toBe(1200)
  })

  it('returns null for an unknown share code', async () => {
    await expect(findTripByShareCode('NOPE99')).resolves.toBeNull()
  })

  it('refuses to delete a trip without a signed-in owner', async () => {
    const { trip } = await createTrip({
      name: '測試',
      startDate: '2026-11-01',
      endDate: '2026-11-01',
      ownerName: '小美',
    })
    await expect(deleteTripByShareCode(trip.share_code)).rejects.toThrow(TRIP_DELETE_DENIED)
    await expect(findTripByShareCode(trip.share_code)).resolves.not.toBeNull()
  })
})
