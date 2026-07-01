import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddGiftForm } from './AddGiftForm'
import type { TripMember } from '../types/models'

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

  it('submits a gift with item, store, amount, and recipient', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddGiftForm members={members} onAdd={onAdd} />)

    await user.type(screen.getByLabelText('品項'), '曲奇')
    await user.type(screen.getByLabelText('商戶'), '銀座曲奇')
    await user.type(screen.getByLabelText('金額'), '100')
    const toMemberInput = screen.getByLabelText('買俾邊個')
    await user.clear(toMemberInput)
    await user.type(toMemberInput, '阿珍')
    await user.click(screen.getByRole('button', { name: '加入手信' }))

    expect(onAdd).toHaveBeenCalledWith({
      item: '曲奇',
      store: '銀座曲奇',
      amount: 100,
      toMember: '阿珍',
      source: 'manual',
    })
  })

  it('defaults the recipient to 自己', () => {
    render(<AddGiftForm members={members} onAdd={vi.fn()} />)
    expect(screen.getByLabelText('買俾邊個')).toHaveValue('自己')
  })

  it('prefills store and amount from a successful scan without auto-submitting', async () => {
    const user = userEvent.setup()
    scanReceipt.mockResolvedValue({ merchantName: '銀座曲奇', totalAmount: 1280 })
    const onAdd = vi.fn()

    render(<AddGiftForm members={members} onAdd={onAdd} />)
    await user.upload(screen.getByLabelText('影單 OCR'), fakeFile())

    expect(await screen.findByDisplayValue('銀座曲奇')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1280')).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('marks the submitted gift as OCR-sourced after a successful scan', async () => {
    const user = userEvent.setup()
    scanReceipt.mockResolvedValue({ merchantName: '銀座曲奇', totalAmount: 1280 })
    const onAdd = vi.fn()

    render(<AddGiftForm members={members} onAdd={onAdd} />)
    await user.upload(screen.getByLabelText('影單 OCR'), fakeFile())
    await screen.findByDisplayValue('銀座曲奇')
    await user.type(screen.getByLabelText('品項'), '曲奇')
    await user.click(screen.getByRole('button', { name: '加入手信' }))

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ source: 'ocr' }))
  })

  it('shows a hint instead of an error when the scan finds nothing', async () => {
    const user = userEvent.setup()
    scanReceipt.mockResolvedValue(null)

    render(<AddGiftForm members={members} onAdd={vi.fn()} />)
    await user.upload(screen.getByLabelText('影單 OCR'), fakeFile())

    expect(await screen.findByText('讀唔到，請手動輸入')).toBeInTheDocument()
  })
})
