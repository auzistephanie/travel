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

const signInWithGoogle = vi.fn()
const getCurrentAuthUser = vi.fn()
const linkMemberToAuthUser = vi.fn()
vi.mock('../lib/ownerAuth', () => ({
  signInWithGoogle: (...a: unknown[]) => signInWithGoogle(...a),
  getCurrentAuthUser: (...a: unknown[]) => getCurrentAuthUser(...a),
  linkMemberToAuthUser: (...a: unknown[]) => linkMemberToAuthUser(...a),
}))

const addMyTrip = vi.fn()
vi.mock('../lib/myTrips', () => ({ addMyTrip: (...a: unknown[]) => addMyTrip(...a) }))

const { CreateTrip } = await import('./CreateTrip')

describe('CreateTrip', () => {
  beforeEach(() => {
    navigate.mockClear()
    createTrip.mockReset()
    setWhoAmI.mockClear()
    signInWithGoogle.mockReset()
    getCurrentAuthUser.mockReset().mockResolvedValue(null)
    linkMemberToAuthUser.mockReset().mockResolvedValue(undefined)
    addMyTrip.mockClear()
  })

  it('creates a trip, remembers who the owner is, and shows the post-creation login prompt', async () => {
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
    expect(navigate).not.toHaveBeenCalled()
    expect(await screen.findByText('行程建立成功！')).toBeInTheDocument()
  })

  it('copies a share-code-only invite link for friends, separate from the Google login', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
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

    await user.click(await screen.findByRole('button', { name: '複製邀請連結' }))

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/t/ABC234`)
    expect(await screen.findAllByText('已複製')).toHaveLength(1)
    expect(signInWithGoogle).not.toHaveBeenCalled()
  })

  it('starts Google sign-in redirecting to the new trip page', async () => {
    const user = userEvent.setup()
    createTrip.mockResolvedValue({
      trip: { id: 't1', share_code: 'ABC234' },
      owner: { id: 'm1', name: '阿明' },
    })
    signInWithGoogle.mockResolvedValue(undefined)

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

    await user.click(await screen.findByRole('button', { name: '用 Google 登入' }))

    expect(signInWithGoogle).toHaveBeenCalledWith(`${window.location.origin}/t/ABC234?m=m1`)
  })

  it('shows an error if Google sign-in fails, without blocking the skip option', async () => {
    const user = userEvent.setup()
    createTrip.mockResolvedValue({
      trip: { id: 't1', share_code: 'ABC234' },
      owner: { id: 'm1', name: '阿明' },
    })
    signInWithGoogle.mockRejectedValue(new Error('provider not enabled'))

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

    await user.click(await screen.findByRole('button', { name: '用 Google 登入' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('登入失敗')

    await user.click(screen.getByRole('button', { name: '遲啲先，直接入去行程' }))
    expect(navigate).toHaveBeenCalledWith('/t/ABC234')
  })

  it('lets the user skip the login prompt and go straight into the trip', async () => {
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

    await user.click(await screen.findByRole('button', { name: '遲啲先，直接入去行程' }))
    expect(navigate).toHaveBeenCalledWith('/t/ABC234')
    expect(signInWithGoogle).not.toHaveBeenCalled()
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

  it('prefills the name from the logged-in Google profile, auto-links the owner, and skips the login button', async () => {
    const user = userEvent.setup()
    getCurrentAuthUser.mockResolvedValue({ id: 'u1', email: 'stephanie@example.com', name: 'Stephanie Au' })
    createTrip.mockResolvedValue({
      trip: { id: 't1', share_code: 'ABC234' },
      owner: { id: 'm1', name: 'Stephanie Au' },
    })

    render(
      <MemoryRouter>
        <CreateTrip />
      </MemoryRouter>,
    )

    // 個名應該由 Google profile 預填
    const nameInput = await screen.findByLabelText<HTMLInputElement>('你的名字')
    expect(nameInput.value).toBe('Stephanie Au')

    await user.type(screen.getByLabelText('行程名'), '東京五日')
    await user.type(screen.getByLabelText('開始日期'), '2026-08-01')
    await user.type(screen.getByLabelText('結束日期'), '2026-08-05')
    await user.click(screen.getByRole('button', { name: '建立行程' }))

    // 建立後即刻綁定個 owner member
    await screen.findByText('行程建立成功！')
    expect(linkMemberToAuthUser).toHaveBeenCalledWith('m1', 'u1')

    // 已登入就唔應該再出「用 Google 登入」掣，改出已登入狀態
    expect(screen.queryByRole('button', { name: '用 Google 登入' })).not.toBeInTheDocument()
    expect(screen.getByText(/已用 stephanie@example.com 登入/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '入去行程' }))
    expect(navigate).toHaveBeenCalledWith('/t/ABC234')
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
