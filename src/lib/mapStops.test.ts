import { describe, expect, it, vi } from 'vitest'
import { resolveMapPins } from './mapStops'
import type { ItineraryStop } from '../types/models'

function stop(partial: Partial<ItineraryStop> & Pick<ItineraryStop, 'id' | 'title'>): ItineraryStop {
  return {
    day_id: 'd1',
    time: null,
    place_name: null,
    lat: null,
    lng: null,
    order_index: 0,
    transport_mode_to_next: null,
    icon: null,
    ...partial,
  }
}

describe('resolveMapPins', () => {
  it('uses stored coordinates and does not geocode those stops', async () => {
    const geocode = vi.fn()
    const result = await resolveMapPins(
      [stop({ id: 's1', title: '台北101', lat: 25.033, lng: 121.565 })],
      'TW',
      geocode,
    )

    expect(geocode).not.toHaveBeenCalled()
    expect(result).toEqual({
      pins: [{ id: 's1', title: '台北101', lat: 25.033, lng: 121.565, number: 1 }],
      unplaced: [],
    })
  })

  it('geocodes a stop that has no coordinates, and names the ones that still cannot be placed', async () => {
    const geocode = vi.fn(async (query: string) => {
      if (query === '上引水產') return { lat: 25.066, lng: 121.56 }
      return null
    })

    const result = await resolveMapPins(
      [
        stop({ id: 's1', title: '台北101', place_name: '台北101' }),
        stop({ id: 's2', title: '上引水產' }),
      ],
      'TW',
      geocode,
    )

    expect(result.pins).toEqual([{ id: 's2', title: '上引水產', lat: 25.066, lng: 121.56, number: 2 }])
    expect(result.unplaced).toEqual(['台北101'])
  })
})
