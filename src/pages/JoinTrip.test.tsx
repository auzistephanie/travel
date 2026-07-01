import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

const findTripByShareCode = vi.fn()
vi.mock('../lib/tripApi', () => ({ findTripByShareCode }))

const { JoinTrip } = await import('./JoinTrip')

describe('JoinTrip', () => {
  beforeEach(() => {
    navigate.mockClear()
    findTripByShareCode.mockReset()
  })

  it('navigates to the trip when the share code is valid', async () => {
    const user = userEvent.setup()
    findTripByShareCode.mockResolvedValue({ trip: { id: 't1', share_code: 'ABC234' }, members: [] })

    render(
      <MemoryRouter>
        <JoinTrip />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('分享碼'), 'abc234')
    await user.click(screen.getByRole('button', { name: '加入' }))

    expect(findTripByShareCode).toHaveBeenCalledWith('ABC234')
    expect(navigate).toHaveBeenCalledWith('/t/ABC234')
  })

  it('shows an error when the share code does not match a trip', async () => {
    const user = userEvent.setup()
    findTripByShareCode.mockResolvedValue(null)

    render(
      <MemoryRouter>
        <JoinTrip />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('分享碼'), 'NOPE99')
    await user.click(screen.getByRole('button', { name: '加入' }))

    expect(await screen.findByText('揾唔到呢個分享碼嘅行程')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})
