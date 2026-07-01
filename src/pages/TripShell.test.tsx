import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

const useTrip = vi.fn()
vi.mock('../hooks/useTrip', () => ({ useTrip: () => useTrip() }))

const getWhoAmI = vi.fn()
const setWhoAmI = vi.fn()
vi.mock('../lib/whoAmI', () => ({ getWhoAmI: (...a: unknown[]) => getWhoAmI(...a), setWhoAmI: (...a: unknown[]) => setWhoAmI(...a) }))

const { TripShell } = await import('./TripShell')

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  share_code: 'ABC234',
  created_at: '2026-01-01T00:00:00Z',
}

const members: TripMember[] = [{ id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true }]

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/t/ABC234']}>
      <Routes>
        <Route path="/t/:shareCode" element={<TripShell />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TripShell', () => {
  beforeEach(() => {
    useTrip.mockReset()
    getWhoAmI.mockReset()
    setWhoAmI.mockReset()
  })

  it('shows a loading indicator while the trip is being fetched', () => {
    useTrip.mockReturnValue({ trip: null, members: [], loading: true, error: null, joinAsNewMember: vi.fn() })
    renderShell()
    expect(screen.getByText('載入緊…')).toBeInTheDocument()
  })

  it('shows an error message when the trip cannot be loaded', () => {
    useTrip.mockReturnValue({
      trip: null,
      members: [],
      loading: false,
      error: '揾唔到呢個分享碼嘅行程',
      joinAsNewMember: vi.fn(),
    })
    renderShell()
    expect(screen.getByRole('alert')).toHaveTextContent('揾唔到呢個分享碼嘅行程')
  })

  it('shows the who-am-i picker when no member is remembered for this device', () => {
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue(null)
    renderShell()
    expect(screen.getByText('邊位係你？')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '阿明' })).toBeInTheDocument()
  })

  it('shows the trip shell with bottom nav once a member is remembered', () => {
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue('m1')
    renderShell()
    expect(screen.getByText('東京五日')).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: '主導覽' })).toBeInTheDocument()
  })

  it('switches pages when a bottom nav tab is clicked', async () => {
    const user = userEvent.setup()
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue('m1')
    renderShell()
    await user.click(screen.getByRole('tab', { name: '行程' }))
    expect(screen.getByRole('main')).toHaveTextContent('行程')
  })

  it('persists the chosen member when selected from the who-am-i picker', async () => {
    const user = userEvent.setup()
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue(null)
    renderShell()
    await user.click(screen.getByRole('button', { name: '阿明' }))
    expect(setWhoAmI).toHaveBeenCalledWith('ABC234', 'm1')
    expect(screen.getByText('東京五日')).toBeInTheDocument()
  })
})
