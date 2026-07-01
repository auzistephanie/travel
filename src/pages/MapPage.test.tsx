import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

const searchPlaces = vi.fn()
vi.mock('../lib/placesApi', () => ({ searchPlaces: (...a: unknown[]) => searchPlaces(...a) }))

const useItinerary = vi.fn()
vi.mock('../hooks/useItinerary', () => ({ useItinerary: () => useItinerary() }))

const { MapPage } = await import('./MapPage')

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-02',
  share_code: 'ABC234',
  created_at: '2026-01-01T00:00:00Z',
}
const members: TripMember[] = []
const days = [
  { id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 },
  { id: 'd2', trip_id: 't1', date: '2026-08-02', order_index: 1 },
]

describe('MapPage', () => {
  beforeEach(() => {
    searchPlaces.mockReset()
    useItinerary.mockReset()
    useItinerary.mockReturnValue({ days, addStop: vi.fn() })
  })

  it('shows search results', async () => {
    const user = userEvent.setup()
    searchPlaces.mockResolvedValue([{ name: '淺草寺', address: '東京都台東区', lat: 35.71, lng: 139.79 }])

    render(<MapPage trip={trip} members={members} />)
    await user.type(screen.getByLabelText('搜尋地點'), '淺草寺')
    await user.click(screen.getByRole('button', { name: '搜尋' }))

    expect(searchPlaces).toHaveBeenCalledWith('淺草寺')
    expect(await screen.findByText('淺草寺')).toBeInTheDocument()
    expect(screen.getByText('東京都台東区')).toBeInTheDocument()
  })

  it('shows a hint when no place is found', async () => {
    const user = userEvent.setup()
    searchPlaces.mockResolvedValue([])

    render(<MapPage trip={trip} members={members} />)
    await user.type(screen.getByLabelText('搜尋地點'), 'ㄈㄈㄈ')
    await user.click(screen.getByRole('button', { name: '搜尋' }))

    expect(await screen.findByText('搵唔到相關地點')).toBeInTheDocument()
  })

  it('adds the selected place to the chosen day', async () => {
    const user = userEvent.setup()
    const addStop = vi.fn()
    useItinerary.mockReturnValue({ days, addStop })
    searchPlaces.mockResolvedValue([{ name: '淺草寺', address: '東京都台東区', lat: 35.71, lng: 139.79 }])

    render(<MapPage trip={trip} members={members} />)
    await user.type(screen.getByLabelText('搜尋地點'), '淺草寺')
    await user.click(screen.getByRole('button', { name: '搜尋' }))
    await screen.findByText('淺草寺')

    await user.click(screen.getByRole('button', { name: '加入邊一日' }))
    await user.selectOptions(screen.getByLabelText('加入邊一日'), 'd2')
    await user.click(screen.getByRole('button', { name: '確認加入' }))

    expect(addStop).toHaveBeenCalledWith('d2', {
      title: '淺草寺',
      placeName: '東京都台東区',
      lat: 35.71,
      lng: 139.79,
      time: null,
    })
  })
})
