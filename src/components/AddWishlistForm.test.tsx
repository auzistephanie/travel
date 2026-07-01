import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddWishlistForm } from './AddWishlistForm'
import type { ItineraryDay, TripMember } from '../types/models'

const uploadWishlistPhoto = vi.fn()
vi.mock('../lib/photoRepo', () => ({ uploadWishlistPhoto: (...a: unknown[]) => uploadWishlistPhoto(...a) }))

const members: TripMember[] = [{ id: 'm1', trip_id: 't1', name: '阿珍', color: null, is_owner: false }]
const days: ItineraryDay[] = [{ id: 'd1', trip_id: 't1', date: '2026-08-01', order_index: 0 }]

function fakeFile() {
  return new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })
}

describe('AddWishlistForm', () => {
  beforeEach(() => {
    uploadWishlistPhoto.mockReset()
  })

  it('submits with the item name and defaults when nothing else is filled in', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddWishlistForm tripId="t1" members={members} days={days} onAdd={onAdd} />)
    await user.type(screen.getByLabelText('想買嘅嘢'), '曲奇')
    await user.click(screen.getByRole('button', { name: '加入心願' }))

    expect(onAdd).toHaveBeenCalledWith({
      name: '曲奇',
      photoUrl: null,
      toMember: '自己',
      linkedDayId: null,
      buyAt: null,
      priceLo: null,
      priceHi: null,
      tip: null,
    })
  })

  it('uploads a photo and includes its URL on submit', async () => {
    const user = userEvent.setup()
    uploadWishlistPhoto.mockResolvedValue('https://cdn/t1/photo.jpg')
    const onAdd = vi.fn()

    render(<AddWishlistForm tripId="t1" members={members} days={days} onAdd={onAdd} />)
    await user.type(screen.getByLabelText('想買嘅嘢'), '曲奇')
    await user.upload(screen.getByLabelText('相片'), fakeFile())
    await screen.findByAltText('心願相片')
    await user.click(screen.getByRole('button', { name: '加入心願' }))

    expect(uploadWishlistPhoto).toHaveBeenCalledWith('t1', expect.any(File))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ photoUrl: 'https://cdn/t1/photo.jpg' }))
  })

  it('links a chosen day when selected', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddWishlistForm tripId="t1" members={members} days={days} onAdd={onAdd} />)
    await user.type(screen.getByLabelText('想買嘅嘢'), '曲奇')
    await user.selectOptions(screen.getByLabelText('連去邊一日行程'), 'd1')
    await user.click(screen.getByRole('button', { name: '加入心願' }))

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ linkedDayId: 'd1' }))
  })
})
