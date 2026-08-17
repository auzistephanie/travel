import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddGiftForm } from './AddGiftForm'
import type { Gift, TripMember } from '../types/models'

const scanReceipt = vi.fn()
vi.mock('../lib/ocrApi', () => ({ scanReceipt: (...a: unknown[]) => scanReceipt(...a) }))

const members: TripMember[] = [{ id: 'm1', trip_id: 't1', name: '阿珍', color: null, is_owner: false }]

function fakeFile() {
  return new File(['bytes'], 'receipt.jpg', { type: 'image/jpeg' })
}

describe('AddGiftForm', () => {
  beforeEach(() => {
    scanReceipt.mockReset()
  })

  it('submits a gift with item, store, amount, currency, and recipient', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddGiftForm members={members} onAdd={onAdd} />)

    await user.type(screen.getByLabelText('品項'), '曲奇')
    await user.type(screen.getByLabelText('商戶'), '銀座曲奇')
    await user.type(screen.getByLabelText('金額'), '100')
    const toMemberInput = screen.getByLabelText('買給誰')
    await user.clear(toMemberInput)
    await user.type(toMemberInput, '阿珍')
    await user.click(screen.getByRole('button', { name: '加入手信' }))

    expect(onAdd).toHaveBeenCalledWith({
      item: '曲奇',
      store: '銀座曲奇',
      amount: 100,
      toMember: '阿珍',
      source: 'manual',
      currency: 'HKD',
    })
  })

  it('defaults the recipient to 自己 and currency to HKD', () => {
    render(<AddGiftForm members={members} onAdd={vi.fn()} />)
    expect(screen.getByLabelText('買給誰')).toHaveValue('自己')
    expect(screen.getByLabelText('貨幣')).toHaveValue('HKD')
  })

  it('submits the selected currency', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddGiftForm members={members} onAdd={onAdd} />)
    await user.type(screen.getByLabelText('品項'), '曲奇')
    await user.selectOptions(screen.getByLabelText('貨幣'), 'JPY')
    await user.click(screen.getByRole('button', { name: '加入手信' }))

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ currency: 'JPY' }))
  })

  it('prefills store and amount from a successful scan without auto-submitting', async () => {
    const user = userEvent.setup()
    scanReceipt.mockResolvedValue({ merchantName: '銀座曲奇', totalAmount: 1280 })
    const onAdd = vi.fn()

    render(<AddGiftForm members={members} onAdd={onAdd} />)
    await user.upload(screen.getByLabelText('拍單據 OCR'), fakeFile())

    expect(await screen.findByDisplayValue('銀座曲奇')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1280')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('marks the submitted gift as OCR-sourced after a successful scan', async () => {
    const user = userEvent.setup()
    scanReceipt.mockResolvedValue({ merchantName: '銀座曲奇', totalAmount: 1280 })
    const onAdd = vi.fn()

    render(<AddGiftForm members={members} onAdd={onAdd} />)
    await user.upload(screen.getByLabelText('拍單據 OCR'), fakeFile())
    await screen.findByDisplayValue('銀座曲奇')
    await user.type(screen.getByLabelText('品項'), '曲奇')
    await user.click(screen.getByRole('button', { name: '加入手信' }))

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ source: 'ocr' }))
  })

  it('shows a hint instead of an error when the scan finds nothing', async () => {
    const user = userEvent.setup()
    scanReceipt.mockResolvedValue(null)

    render(<AddGiftForm members={members} onAdd={vi.fn()} />)
    await user.upload(screen.getByLabelText('拍單據 OCR'), fakeFile())

    expect(await screen.findByText('讀取不到，請手動輸入')).toBeInTheDocument()
  })
})

const existingGift: Gift = {
  id: 'g1',
  trip_id: 't1',
  item: '曲奇',
  store: '銀座曲奇',
  amount: 1280,
  to_member: '阿珍',
  source: 'manual',
  currency: 'JPY',
}

describe('AddGiftForm editing an existing gift', () => {
  it('prefills fields from the gift being edited', () => {
    render(<AddGiftForm members={members} editingGift={existingGift} onAdd={vi.fn()} />)

    expect(screen.getByLabelText('品項')).toHaveValue('曲奇')
    expect(screen.getByLabelText('商戶')).toHaveValue('銀座曲奇')
    expect(screen.getByLabelText('金額')).toHaveValue(1280)
    expect(screen.getByLabelText('貨幣')).toHaveValue('JPY')
    expect(screen.getByLabelText('買給誰')).toHaveValue('阿珍')
    expect(screen.getByRole('heading', { name: '編輯手信' })).toBeInTheDocument()
  })

  it('calls onUpdate with the edited fields, not onAdd', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onUpdate = vi.fn()

    render(
      <AddGiftForm members={members} editingGift={existingGift} onAdd={onAdd} onUpdate={onUpdate} />,
    )
    const amountInput = screen.getByLabelText('金額')
    await user.clear(amountInput)
    await user.type(amountInput, '1500')
    await user.click(screen.getByRole('button', { name: '儲存' }))

    expect(onUpdate).toHaveBeenCalledWith('g1', {
      item: '曲奇',
      store: '銀座曲奇',
      amount: 1500,
      toMember: '阿珍',
      currency: 'JPY',
    })
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <AddGiftForm members={members} editingGift={existingGift} onAdd={vi.fn()} onCancel={onCancel} />,
    )
    await user.click(screen.getByRole('button', { name: '取消' }))

    expect(onCancel).toHaveBeenCalled()
  })
})
