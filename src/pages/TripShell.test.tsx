import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip, TripMember } from '../types/models'

const useTrip = vi.fn()
vi.mock('../hooks/useTrip', () => ({ useTrip: () => useTrip() }))

const getWhoAmI = vi.fn()
const setWhoAmI = vi.fn()
vi.mock('../lib/whoAmI', () => ({ getWhoAmI: (...a: unknown[]) => getWhoAmI(...a), setWhoAmI: (...a: unknown[]) => setWhoAmI(...a) }))

const getCurrentAuthUser = vi.fn()
const onAuthUserChange = vi.fn()
const linkMemberToAuthUser = vi.fn()
const signInWithGoogle = vi.fn()
vi.mock('../lib/ownerAuth', () => ({
  getCurrentAuthUser: (...a: unknown[]) => getCurrentAuthUser(...a),
  onAuthUserChange: (...a: unknown[]) => onAuthUserChange(...a),
  linkMemberToAuthUser: (...a: unknown[]) => linkMemberToAuthUser(...a),
  signInWithGoogle: (...a: unknown[]) => signInWithGoogle(...a),
}))

const { TripShell } = await import('./TripShell')

const trip: Trip = {
  id: 't1',
  name: '東京五日',
  start_date: '2026-08-01',
  end_date: '2026-08-05',
  share_code: 'ABC234',
  destination_country: null,
  created_at: '2026-01-01T00:00:00Z',
}

const members: TripMember[] = [{ id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true }]

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

function renderShell(initialEntry = '/t/ABC234') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
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
    getCurrentAuthUser.mockReset().mockResolvedValue(null)
    onAuthUserChange.mockReset().mockReturnValue(vi.fn())
    linkMemberToAuthUser.mockReset().mockResolvedValue(undefined)
    signInWithGoogle.mockReset()
    // 分頁 chunk 用真.dynamic import()（見 lazyImportWithReload），jsdom 冇真正 navigation，
    // 淨係 stub 走 reload 避免測試噪音；唔係測緊 reload 本身嘅邏輯（嗰個喺 lazyWithReload.test.ts）。
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: vi.fn() },
      writable: true,
      configurable: true,
    })
  })

  it('shows a loading indicator while the trip is being fetched', () => {
    useTrip.mockReturnValue({ trip: null, members: [], loading: true, error: null, joinAsNewMember: vi.fn() })
    renderShell()
    expect(screen.getByText('載入中…')).toBeInTheDocument()
  })

  it('shows an error message when the trip cannot be loaded', () => {
    useTrip.mockReturnValue({
      trip: null,
      members: [],
      loading: false,
      error: '找不到這個分享碼的行程',
      joinAsNewMember: vi.fn(),
    })
    renderShell()
    expect(screen.getByRole('alert')).toHaveTextContent('找不到這個分享碼的行程')
  })

  it('shows the who-am-i picker when no member is remembered for this device', () => {
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue(null)
    renderShell()
    expect(screen.getByText('哪位是你？')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '阿明' })).toBeInTheDocument()
  })

  it('shows the trip shell with bottom nav once a member is remembered', () => {
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue('m1')
    renderShell()
    expect(screen.getAllByText('東京五日').length).toBeGreaterThan(0)
    expect(screen.getByRole('tablist', { name: '主導覽' })).toBeInTheDocument()
  })

  it('switches pages when a bottom nav tab is clicked', async () => {
    const user = userEvent.setup()
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue('m1')
    renderShell()
    await user.click(screen.getByRole('tab', { name: '行程' }))
    expect(screen.getByRole('main')).toHaveTextContent('載入中…')
  })

  it('persists the chosen member when selected from the who-am-i picker', async () => {
    const user = userEvent.setup()
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue(null)
    renderShell()
    await user.click(screen.getByRole('button', { name: '阿明' }))
    expect(setWhoAmI).toHaveBeenCalledWith('ABC234', 'm1')
    expect(screen.getAllByText('東京五日').length).toBeGreaterThan(0)
  })

  it('recognises the member from the URL even when this browser context has no localStorage record', () => {
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue(null)
    renderShell('/t/ABC234?m=m1')
    expect(screen.getAllByText('東京五日').length).toBeGreaterThan(0)
    expect(screen.queryByText('哪位是你？')).not.toBeInTheDocument()
  })

  it('writes the resolved member id back into the URL so the link can be reused across contexts', async () => {
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue('m1')
    renderShell('/t/ABC234')
    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('?m=m1'))
  })

  it('auto-recognises identity from a linked owner auth session, skipping the picker entirely', async () => {
    const linkedMembers: TripMember[] = [
      { id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true, auth_user_id: 'u1' },
    ]
    useTrip.mockReturnValue({ trip, members: linkedMembers, loading: false, error: null, joinAsNewMember: vi.fn(), refetch: vi.fn() })
    getWhoAmI.mockReturnValue(null)
    getCurrentAuthUser.mockResolvedValue({ id: 'u1', email: 'stephanie@example.com' })
    renderShell()
    await waitFor(() => expect(screen.getAllByText('東京五日').length).toBeGreaterThan(0))
    expect(screen.queryByText('哪位是你？')).not.toBeInTheDocument()
  })

  it('links the owner member to their auth account the first time they log in', async () => {
    const refetch = vi.fn()
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn(), refetch })
    getWhoAmI.mockReturnValue('m1')
    let authChangeCallback: ((user: { id: string; email: string | null } | null) => void) | undefined
    onAuthUserChange.mockImplementation((cb) => {
      authChangeCallback = cb
      return vi.fn()
    })
    renderShell()
    await waitFor(() => expect(screen.getAllByText('東京五日').length).toBeGreaterThan(0))

    act(() => {
      authChangeCallback?.({ id: 'u1', email: 'stephanie@example.com' })
    })

    await waitFor(() => expect(linkMemberToAuthUser).toHaveBeenCalledWith('m1', 'u1'))
    expect(refetch).toHaveBeenCalled()
  })

  it('opens the settings panel when the gear icon is clicked', async () => {
    const user = userEvent.setup()
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue('m1')
    renderShell()

    expect(screen.queryByRole('dialog', { name: '設定' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '設定' }))

    expect(screen.getByRole('dialog', { name: '設定' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '復古探險地圖' })).toBeInTheDocument()
  })

  it('passes the trip share code into settings so members can copy a friend-invite link', async () => {
    const user = userEvent.setup()
    useTrip.mockReturnValue({ trip, members, loading: false, error: null, joinAsNewMember: vi.fn() })
    getWhoAmI.mockReturnValue('m1')
    renderShell()

    await user.click(screen.getByRole('button', { name: '設定' }))

    expect(screen.getByText('邀請朋友')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '複製邀請連結' })).toBeInTheDocument()
  })
})
