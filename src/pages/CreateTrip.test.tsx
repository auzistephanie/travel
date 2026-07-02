import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

const createTrip = vi.fn()
vi.mock('../lib/tripApi', () => ({ createTrip }))

const setWhoAmI = vi.fn()
vi.mock('../lib/whoAmI', () => ({ setWhoAmI }))

const { CreateTrip } = await import('./CreateTrip')

describe('CreateTrip', () => {
  beforeEach(() => {
    navigate.mockClear()
    createTrip.mockReset()
    setWhoAmI.mockClear()
  })

  it('creates a trip and navigates to it, remembering who the owner is', async () => {
    const user = userEvent.setup()
    createTrip.mockResolvedValue({
      trip: { id: 't1', share_code: 'ABC234' },
      owner: { id: 'm1', name: '阿明' },
    })

    render(
      <MemoryRouter>
        <CreateTrip />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('行程名'), '東京五日')
    await user.type(screen.getByLabelText('開始日期'), '2026-08-01')
    await user.type(screen.getByLabelText('結束日期'), '2026-08-05')
    await user.type(screen.getByLabelText('你的名字'), '阿明')
    await user.click(screen.getByRole('button', { name: '建立行程' }))

    expect(createTrip).toHaveBeenCalledWith({
      name: '東京五日',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      ownerName: '阿明',
      destinationCountry: null,
    })
    expect(setWhoAmI).toHaveBeenCalledWith('ABC234', 'm1')
    expect(navigate).toHaveBeenCalledWith('/t/ABC234')
  })

  it('passes the chosen destination country through to createTrip', async () => {
    const user = userEvent.setup()
    createTrip.mockResolvedValue({
      trip: { id: 't1', share_code: 'ABC234' },
      owner: { id: 'm1', name: '阿明' },
    })

    render(
      <MemoryRouter>
        <CreateTrip />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('行程名'), '曼谷四日')
    await user.type(screen.getByLabelText('開始日期'), '2026-08-01')
    await user.type(screen.getByLabelText('結束日期'), '2026-08-04')
    await user.type(screen.getByLabelText('你的名字'), '阿明')
    await user.selectOptions(screen.getByLabelText('目的地國家'), 'TH')
    await user.click(screen.getByRole('button', { name: '建立行程' }))

    expect(createTrip).toHaveBeenCalledWith(expect.objectContaining({ destinationCountry: 'TH' }))
  })

  it('shows an error message when creation fails', async () => {
    const user = userEvent.setup()
    createTrip.mockRejectedValue(new Error('network down'))

    render(
      <MemoryRouter>
        <CreateTrip />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('行程名'), '東京五日')
    await user.type(screen.getByLabelText('開始日期'), '2026-08-01')
    await user.type(screen.getByLabelText('結束日期'), '2026-08-05')
    await user.type(screen.getByLabelText('你的名字'), '阿明')
    await user.click(screen.getByRole('button', { name: '建立行程' }))

    expect(await screen.findByText('建立失敗，請再試一次')).toBeInTheDocument()
  })
})
