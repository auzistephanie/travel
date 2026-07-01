import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WhoAmIPicker } from './WhoAmIPicker'
import type { TripMember } from '../types/models'

const members: TripMember[] = [
  { id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true },
  { id: 'm2', trip_id: 't1', name: '阿珍', color: null, is_owner: false },
]

describe('WhoAmIPicker', () => {
  it('lists existing members as choices', () => {
    render(<WhoAmIPicker members={members} onSelect={() => {}} onAddNew={vi.fn()} />)
    expect(screen.getByRole('button', { name: '阿明' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '阿珍' })).toBeInTheDocument()
  })

  it('calls onSelect with the member id when an existing name is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<WhoAmIPicker members={members} onSelect={onSelect} onAddNew={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: '阿明' }))
    expect(onSelect).toHaveBeenCalledWith('m1')
  })

  it('calls onAddNew then onSelect when a new name is submitted', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const newMember: TripMember = { id: 'm3', trip_id: 't1', name: '阿聰', color: null, is_owner: false }
    const onAddNew = vi.fn().mockResolvedValue(newMember)
    render(<WhoAmIPicker members={members} onSelect={onSelect} onAddNew={onAddNew} />)

    await user.type(screen.getByLabelText('自訂新名字'), '阿聰')
    await user.click(screen.getByRole('button', { name: '加入' }))

    expect(onAddNew).toHaveBeenCalledWith('阿聰')
    expect(onSelect).toHaveBeenCalledWith('m3')
  })
})
