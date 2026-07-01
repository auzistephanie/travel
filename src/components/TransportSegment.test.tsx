import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransportSegment } from './TransportSegment'

const fetchTransportEstimate = vi.fn()
vi.mock('../lib/directionsApi', () => ({
  fetchTransportEstimate: (...a: unknown[]) => fetchTransportEstimate(...a),
}))

const from = { lat: 35.71, lng: 139.79 }
const to = { lat: 35.72, lng: 139.8 }

describe('TransportSegment', () => {
  beforeEach(() => {
    fetchTransportEstimate.mockReset()
  })

  it('fetches the walking estimate by default and shows the duration', async () => {
    fetchTransportEstimate.mockResolvedValue({ mode: 'WALK', durationMinutes: 12 })

    render(<TransportSegment from={from} to={to} />)

    expect(fetchTransportEstimate).toHaveBeenCalledWith(from, to, 'WALK')
    expect(await screen.findByText('12 分鐘')).toBeInTheDocument()
  })

  it('refetches when a different transport mode is selected', async () => {
    fetchTransportEstimate.mockResolvedValueOnce({ mode: 'WALK', durationMinutes: 12 })
    fetchTransportEstimate.mockResolvedValueOnce({ mode: 'TRANSIT', durationMinutes: 5 })
    const user = userEvent.setup()

    render(<TransportSegment from={from} to={to} />)
    await screen.findByText('12 分鐘')

    await user.click(screen.getByRole('button', { name: '電車' }))

    expect(fetchTransportEstimate).toHaveBeenCalledWith(from, to, 'TRANSIT')
    expect(await screen.findByText('5 分鐘')).toBeInTheDocument()
  })

  it('shows nothing when no estimate is available', async () => {
    fetchTransportEstimate.mockResolvedValue(null)
    render(<TransportSegment from={from} to={to} />)
    await Promise.resolve()
    expect(screen.queryByText(/分鐘/)).not.toBeInTheDocument()
  })
})
