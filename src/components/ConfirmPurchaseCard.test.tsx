import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmPurchaseCard } from './ConfirmPurchaseCard'
import type { WishlistItem } from '../types/models'

const item: WishlistItem = {
  id: 'w1',
  trip_id: 't1',
  name: '曲奇',
  photo_url: null,
  buy_at: '銀座曲奇（計劃）',
  price_lo: 1000,
  price_hi: 1500,
  tip: null,
  linked_day_id: null,
  to_member: '阿珍',
  bought: false,
  actual_store: null,
  actual_amt: null,
  synced_to_gift: false,
}

describe('ConfirmPurchaseCard', () => {
  it('prefills the planned store and the higher end of the planned price range', () => {
    render(<ConfirmPurchaseCard item={item} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('實際商戶')).toHaveValue('銀座曲奇（計劃）')
    expect(screen.getByLabelText('實際價錢')).toHaveValue(1500)
  })

  it('lets the user edit the prefilled values before confirming', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(<ConfirmPurchaseCard item={item} onConfirm={onConfirm} onCancel={vi.fn()} />)
    const storeInput = screen.getByLabelText('實際商戶')
    await user.clear(storeInput)
    await user.type(storeInput, '心齋橋分店')
    const amountInput = screen.getByLabelText('實際價錢')
    await user.clear(amountInput)
    await user.type(amountInput, '1280')
    await user.click(screen.getByRole('button', { name: '確認買咗' }))

    expect(onConfirm).toHaveBeenCalledWith('心齋橋分店', 1280)
  })

  it('calls onCancel when cancelled', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmPurchaseCard item={item} onConfirm={vi.fn()} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
