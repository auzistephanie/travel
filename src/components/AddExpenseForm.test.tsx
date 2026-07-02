import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddExpenseForm } from './AddExpenseForm'
import type { TripMember } from '../types/models'

const members: TripMember[] = [
  { id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true },
  { id: 'm2', trip_id: 't1', name: '阿珍', color: null, is_owner: false },
]

describe('AddExpenseForm', () => {
  it('submits an expense with title, amount, currency, payer, split members, and category', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddExpenseForm members={members} onAdd={onAdd} />)

    await user.type(screen.getByLabelText('項目'), '午餐')
    await user.type(screen.getByLabelText('金額'), '500')
    await user.selectOptions(screen.getByLabelText('貨幣'), 'JPY')
    await user.selectOptions(screen.getByLabelText('付款人'), 'm1')
    await user.click(screen.getByLabelText('阿明'))
    await user.click(screen.getByLabelText('阿珍'))
    await user.selectOptions(screen.getByLabelText('分類'), '餐飲')
    await user.click(screen.getByRole('button', { name: '加入開支' }))

    expect(onAdd).toHaveBeenCalledWith({
      title: '午餐',
      amount: 500,
      currency: 'JPY',
      payerId: 'm1',
      splitMemberIds: ['m1', 'm2'],
      dayId: null,
      category: '餐飲',
      isTripBase: false,
    })
  })

  it('marks the expense as trip-base when the checkbox is checked', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<AddExpenseForm members={members} onAdd={onAdd} />)

    await user.type(screen.getByLabelText('項目'), '機票')
    await user.type(screen.getByLabelText('金額'), '3000')
    await user.click(screen.getByLabelText('阿明'))
    await user.click(screen.getByLabelText('旅行基本費（不計入逐日）'))
    await user.click(screen.getByRole('button', { name: '加入開支' }))

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ isTripBase: true }))
  })
})
