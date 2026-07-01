import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FacilityChips } from './FacilityChips'

const findNearbyRestroom = vi.fn()
const findNearbyConvenienceStore = vi.fn()
vi.mock('../lib/facilitiesApi', () => ({
  findNearbyRestroom: (...a: unknown[]) => findNearbyRestroom(...a),
  findNearbyConvenienceStore: (...a: unknown[]) => findNearbyConvenienceStore(...a),
}))

describe('FacilityChips', () => {
  beforeEach(() => {
    findNearbyRestroom.mockReset()
    findNearbyConvenienceStore.mockReset()
  })

  it('shows a restroom chip linking to Google Maps when found', async () => {
    findNearbyRestroom.mockResolvedValue({ name: '公共洗手間', lat: 35.712, lng: 139.795 })
    findNearbyConvenienceStore.mockResolvedValue(null)

    render(<FacilityChips lat={35.71} lng={139.79} />)

    const link = await screen.findByRole('link', { name: /🚻/ })
    expect(link).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=35.712,139.795')
  })

  it('shows a convenience store chip when found', async () => {
    findNearbyRestroom.mockResolvedValue(null)
    findNearbyConvenienceStore.mockResolvedValue({ name: '7-Eleven', lat: 35.713, lng: 139.796 })

    render(<FacilityChips lat={35.71} lng={139.79} />)

    const link = await screen.findByRole('link', { name: /🏪/ })
    expect(link).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=35.713,139.796')
  })

  it('shows neither chip when nothing is found nearby', async () => {
    findNearbyRestroom.mockResolvedValue(null)
    findNearbyConvenienceStore.mockResolvedValue(null)

    render(<FacilityChips lat={35.71} lng={139.79} />)

    await Promise.resolve()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
