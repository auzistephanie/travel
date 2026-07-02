import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RouteOptimizationCard } from './RouteOptimizationCard'
import type { ItineraryStop } from '../types/models'

function stop(id: string, lat: number | null, lng: number | null): ItineraryStop {
  return {
    id,
    day_id: 'd1',
    time: null,
    title: id,
    place_name: null,
    lat,
    lng,
    order_index: 0,
    transport_mode_to_next: null,
    icon: null,
  }
}

describe('RouteOptimizationCard', () => {
  it('renders nothing when fewer than 3 stops have coordinates', () => {
    const { container } = render(
      <RouteOptimizationCard stops={[stop('a', 0, 0), stop('b', 1, 1)]} onApply={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when not every stop has coordinates', () => {
    const { container } = render(
      <RouteOptimizationCard stops={[stop('a', 0, 0), stop('b', null, null), stop('c', 1, 1)]} onApply={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the current order is already close to optimal', () => {
    const { container } = render(
      <RouteOptimizationCard
        stops={[stop('a', 0, 0), stop('b', 0.01, 0), stop('c', 0.02, 0)]}
        onApply={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('suggests a shorter order, keeping the first stop fixed, and applies it on click', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    // a is fixed start; c (lat 0.1) is much closer to a than b (lat 5) is.
    const stops = [stop('a', 0, 0), stop('b', 5, 0), stop('c', 0.1, 0)]

    render(<RouteOptimizationCard stops={stops} onApply={onApply} />)

    expect(await screen.findByText(/可以更順路，省/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '一鍵套用' }))

    expect(onApply).toHaveBeenCalledWith([stops[0], stops[2], stops[1]])
  })
})
