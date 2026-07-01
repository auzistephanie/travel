import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IndoorSuggestionCard } from './IndoorSuggestionCard'

const searchIndoorPlaces = vi.fn()
vi.mock('../lib/placesApi', () => ({ searchIndoorPlaces: (...a: unknown[]) => searchIndoorPlaces(...a) }))

describe('IndoorSuggestionCard', () => {
  beforeEach(() => {
    searchIndoorPlaces.mockReset()
  })

  it('shows nearby indoor places once loaded', async () => {
    searchIndoorPlaces.mockResolvedValue([
      { name: '上野動物園旁博物館', address: '東京都台東区', lat: 35.71, lng: 139.77 },
    ])

    render(<IndoorSuggestionCard lat={35.71} lng={139.77} />)

    expect(await screen.findByText('上野動物園旁博物館')).toBeInTheDocument()
    expect(searchIndoorPlaces).toHaveBeenCalledWith(35.71, 139.77)
  })

  it('renders nothing when there are no nearby indoor places', () => {
    searchIndoorPlaces.mockResolvedValue([])
    const { container } = render(<IndoorSuggestionCard lat={35.71} lng={139.77} />)
    expect(container).toBeEmptyDOMElement()
  })
})
