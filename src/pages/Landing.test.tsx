import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '../lib/ownerAuth'

const getCurrentAuthUser = vi.fn<() => Promise<AuthUser | null>>()
vi.mock('../lib/ownerAuth', () => ({
  getCurrentAuthUser: () => getCurrentAuthUser(),
  onAuthUserChange: () => () => {},
  signInWithGoogle: vi.fn(),
}))

vi.mock('../lib/tripApi', () => ({
  TRIP_DELETE_DENIED: 'TRIP_DELETE_DENIED',
  deleteTripByShareCode: vi.fn().mockResolvedValue(undefined),
  getTripsForAuthUser: vi.fn().mockResolvedValue([]),
}))

const { Landing } = await import('./Landing')

function seedMyTrips() {
  localStorage.setItem(
    'myTrips',
    JSON.stringify([
      { shareCode: 'ABC234', name: '東京五日', role: 'owner', startDate: '2026-08-01', endDate: '2026-08-05', lastOpened: 1 },
    ]),
  )
}

describe('Landing 刪除行程確認框（RLS 收窄後嘅登入 gate）', () => {
  beforeEach(() => {
    localStorage.clear()
    seedMyTrips()
  })

  it('未登入嘅 owner：唔出「徹底刪除」掣，改出登入提示（「從清單移除」照有）', async () => {
    getCurrentAuthUser.mockResolvedValue(null)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: '管理 東京五日' }))

    expect(screen.getByRole('button', { name: '從清單移除' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /徹底刪除行程/ })).not.toBeInTheDocument()
    expect(screen.getByText(/要徹底刪除行程，請先以 Google 登入/)).toBeInTheDocument()
  })

  it('登入咗嘅 owner：照出「徹底刪除行程」掣', async () => {
    getCurrentAuthUser.mockResolvedValue({ id: 'auth-1', email: 's@example.com', name: 'Stephanie' })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )

    // 等 auth effect resolve 完（登入狀態文案出現）先撳
    await screen.findByText(/已用 s@example.com 登入/)
    await user.click(screen.getByRole('button', { name: '管理 東京五日' }))

    expect(screen.getByRole('button', { name: /徹底刪除行程/ })).toBeInTheDocument()
  })
})
