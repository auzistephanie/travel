import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

const useItinerary = vi.fn()
vi.mock('../hooks/useItinerary', () => ({ useItinerary: () => useItinerary() }))

const useDestinationWeather = vi.fn()
vi.mock('../hooks/useDestinationWeather', () => ({ useDestinationWeather: () => useDestinationWeather() }))

const searchIndoorPlaces = vi.fn()
vi.mock('../lib/placesApi', () => ({ searchIndoorPlaces: (...a: unknown[]) => searchIndoorPlaces(...a) }))

const findNearbyRestroom = vi.fn()
const findNearbyConvenienceStore = vi.fn()
vi.mock('../lib/facilitiesApi', () => ({
  findNearbyRestroom: (...a: unknown[]) => findNearbyRestroom(...a),
  findNearbyConvenienceStore: (...a: unknown[]) => findNearbyConvenienceStore(...a),
}))

const fetchTransportEstimate = vi.fn()
vi.mock('../lib/directionsApi', () => ({
  fetchTransportEstimate: (...a: unknown[]) => fetchTransportEstimate(...a),
}))

const { Itinerary } = await import('./Itinerary')

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-02',
  share_code: 'ABC234',
  destination_country: null,
  created_at: '2026-01-01T00:00:00Z',
}
const members: TripMember[] = []

const days = [
  { id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 },
  { id: 'd2', trip_id: 't1', date: '2026-08-02', order_index: 1 },
]

describe('Itinerary', () => {
  beforeEach(() => {
    useItinerary.mockReset()
    useDestinationWeather.mockReset()
    useDestinationWeather.mockReturnValue({})
    searchIndoorPlaces.mockReset()
    searchIndoorPlaces.mockResolvedValue([])
    findNearbyRestroom.mockReset()
    findNearbyRestroom.mockResolvedValue(null)
    findNearbyConvenienceStore.mockReset()
    findNearbyConvenienceStore.mockResolvedValue(null)
    fetchTransportEstimate.mockReset()
    fetchTransportEstimate.mockResolvedValue(null)
  })

  it('shows facility chips for stops that have coordinates', async () => {
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [{ id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: 35.71, lng: 139.79, order_index: 0, transport_mode_to_next: null, icon: null }],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })
    findNearbyRestroom.mockResolvedValue({ name: '公共洗手間', lat: 35.712, lng: 139.795 })

    render(<Itinerary trip={trip} members={members} />)

    expect(await screen.findByRole('link', { name: /公共洗手間/ })).toBeInTheDocument()
    expect(findNearbyRestroom).toHaveBeenCalledWith(35.71, 139.79)
  })

  it('shows a transport estimate between two adjacent located stops', async () => {
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [
          { id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: 35.71, lng: 139.79, order_index: 0, transport_mode_to_next: null, icon: null },
          { id: 's2', day_id: 'd1', time: null, title: '晴空塔', place_name: null, lat: 35.71, lng: 139.81, order_index: 1, transport_mode_to_next: null, icon: null },
        ],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })
    fetchTransportEstimate.mockResolvedValue({ mode: 'WALK', durationMinutes: 15 })

    render(<Itinerary trip={trip} members={members} />)

    expect(await screen.findByText('15 分鐘')).toBeInTheDocument()
    expect(fetchTransportEstimate).toHaveBeenCalledWith(
      { lat: 35.71, lng: 139.79 },
      { lat: 35.71, lng: 139.81 },
      'WALK',
    )
  })

  it('does not show a transport estimate when a stop has no coordinates', () => {
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [
          { id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: null, lng: null, order_index: 0, transport_mode_to_next: null, icon: null },
          { id: 's2', day_id: 'd1', time: null, title: '晴空塔', place_name: null, lat: 35.71, lng: 139.81, order_index: 1, transport_mode_to_next: null, icon: null },
        ],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })

    render(<Itinerary trip={trip} members={members} />)
    expect(fetchTransportEstimate).not.toHaveBeenCalled()
  })

  it('does not show facility chips for stops without coordinates', () => {
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [{ id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: null, lng: null, order_index: 0, transport_mode_to_next: null, icon: null }],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })

    render(<Itinerary trip={trip} members={members} />)
    expect(findNearbyRestroom).not.toHaveBeenCalled()
  })

  it('shows the stops for the first day by default', () => {
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [{ id: 's1', day_id: 'd1', time: '10:00', title: '淺草寺', place_name: '淺草寺', lat: null, lng: null, order_index: 0, transport_mode_to_next: null, icon: null }],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })

    render(<Itinerary trip={trip} members={members} />)
    expect(screen.getByText('淺草寺')).toBeInTheDocument()
  })

  it('shows the weather for the currently active day', () => {
    useItinerary.mockReturnValue({
      days,
      stopsByDay: { d1: [], d2: [] },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })
    useDestinationWeather.mockReturnValue({
      '2026-08-01': {
        date: '2026-08-01',
        am: { tempC: 26, rainProbability: 20 },
        pm: { tempC: 31, rainProbability: 70 },
      },
    })

    render(<Itinerary trip={trip} members={members} />)
    expect(screen.getByText('31°C')).toBeInTheDocument()
  })

  it('shows indoor suggestions when rain probability is high and a stop has coordinates', async () => {
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [{ id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: 35.71, lng: 139.79, order_index: 0, transport_mode_to_next: null, icon: null }],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })
    useDestinationWeather.mockReturnValue({
      '2026-08-01': { date: '2026-08-01', am: { tempC: 26, rainProbability: 80 }, pm: { tempC: 31, rainProbability: 20 } },
    })
    searchIndoorPlaces.mockResolvedValue([{ name: '上野博物館', address: '東京都', lat: 35.71, lng: 139.79 }])

    render(<Itinerary trip={trip} members={members} />)
    expect(await screen.findByText('上野博物館')).toBeInTheDocument()
    expect(searchIndoorPlaces).toHaveBeenCalledWith(35.71, 139.79)
  })

  it('does not show indoor suggestions when rain probability is low', () => {
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [{ id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: 35.71, lng: 139.79, order_index: 0, transport_mode_to_next: null, icon: null }],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })
    useDestinationWeather.mockReturnValue({
      '2026-08-01': { date: '2026-08-01', am: { tempC: 26, rainProbability: 10 }, pm: { tempC: 31, rainProbability: 20 } },
    })

    render(<Itinerary trip={trip} members={members} />)
    expect(searchIndoorPlaces).not.toHaveBeenCalled()
  })

  it('switches stop list when a different day tab is clicked', async () => {
    const user = userEvent.setup()
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [{ id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: null, lng: null, order_index: 0, transport_mode_to_next: null, icon: null }],
        d2: [{ id: 's2', day_id: 'd2', time: null, title: '築地市場', place_name: null, lat: null, lng: null, order_index: 0, transport_mode_to_next: null, icon: null }],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })

    render(<Itinerary trip={trip} members={members} />)
    expect(screen.getByText('淺草寺')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '08/02' }))
    expect(screen.getByText('築地市場')).toBeInTheDocument()
    expect(screen.queryByText('淺草寺')).not.toBeInTheDocument()
  })

  it('adds a new stop to the current day via the form', async () => {
    const user = userEvent.setup()
    const addStop = vi.fn()
    useItinerary.mockReturnValue({
      days,
      stopsByDay: { d1: [], d2: [] },
      loading: false,
      error: null,
      addStop,
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })

    render(<Itinerary trip={trip} members={members} />)
    await user.type(screen.getByLabelText('景點名稱'), '晴空塔')
    await user.click(screen.getByRole('button', { name: '＋加入景點' }))

    expect(addStop).toHaveBeenCalledWith('d1', { title: '晴空塔', time: null, placeName: null, lat: null, lng: null })
  })

  it('deletes a stop when its delete button is clicked', async () => {
    const user = userEvent.setup()
    const deleteStop = vi.fn()
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [{ id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: null, lng: null, order_index: 0, transport_mode_to_next: null, icon: null }],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop,
      reorderStops: vi.fn(),
      applyOrder: vi.fn(),
    })

    render(<Itinerary trip={trip} members={members} />)
    await user.click(screen.getByRole('button', { name: '刪除 淺草寺' }))
    expect(deleteStop).toHaveBeenCalledWith('d1', 's1')
  })

  it('reorders stops when one is dragged and dropped on another', () => {
    const reorderStops = vi.fn()
    useItinerary.mockReturnValue({
      days,
      stopsByDay: {
        d1: [
          { id: 's1', day_id: 'd1', time: null, title: '淺草寺', place_name: null, lat: null, lng: null, order_index: 0, transport_mode_to_next: null, icon: null },
          { id: 's2', day_id: 'd1', time: null, title: '晴空塔', place_name: null, lat: null, lng: null, order_index: 1, transport_mode_to_next: null, icon: null },
        ],
        d2: [],
      },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops,
      applyOrder: vi.fn(),
    })

    render(<Itinerary trip={trip} members={members} />)
    const items = screen.getAllByRole('listitem')

    fireEvent.dragStart(items[0])
    fireEvent.dragOver(items[1])
    fireEvent.drop(items[1])

    expect(reorderStops).toHaveBeenCalledWith('d1', 0, 1)
  })

  it('applies the suggested route order when offered', async () => {
    const user = userEvent.setup()
    const applyOrder = vi.fn()
    const stopA = { id: 's1', day_id: 'd1', time: null, title: 'A', place_name: null, lat: 0, lng: 0, order_index: 0, transport_mode_to_next: null, icon: null }
    const stopB = { id: 's2', day_id: 'd1', time: null, title: 'B', place_name: null, lat: 5, lng: 0, order_index: 1, transport_mode_to_next: null, icon: null }
    const stopC = { id: 's3', day_id: 'd1', time: null, title: 'C', place_name: null, lat: 0.1, lng: 0, order_index: 2, transport_mode_to_next: null, icon: null }
    useItinerary.mockReturnValue({
      days,
      stopsByDay: { d1: [stopA, stopB, stopC], d2: [] },
      loading: false,
      error: null,
      addStop: vi.fn(),
      deleteStop: vi.fn(),
      reorderStops: vi.fn(),
      applyOrder,
    })

    render(<Itinerary trip={trip} members={members} />)
    await user.click(await screen.findByRole('button', { name: '一鍵套用' }))

    expect(applyOrder).toHaveBeenCalledWith('d1', [stopA, stopC, stopB])
  })
})
