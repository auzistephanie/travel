import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddGiftForm } from './AddGiftForm'
import type { TripMember } from '../types/models'

const members: TripMember[] = [{ id: 'm1', trip_id: 't1', name: '阿珍', color: null, is_owner: false }]

describe('AddGiftForm', () => {
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

    expect(onAdd).toHaveBeenCalledWith({ item: '曲奇', store: '銀座曲奇', amount: 100, toMember: '阿珍' })
  })

  it('defaults the recipient to 自己', () => {
    render(<AddGiftForm members={members} onAdd={vi.fn()} />)
    expect(screen.getByLabelText('買俾邊個')).toHaveValue('自己')
  })
})
