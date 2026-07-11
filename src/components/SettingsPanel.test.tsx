import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPanel } from './SettingsPanel'
import { ThemeProvider } from '../theme/ThemeContext'
import { THEMES } from '../theme/tokens'
import type { ThemeId, Trip } from '../types/models'
import { updateTrip } from '../lib/tripApi'

vi.mock('../lib/tripApi', () => ({
  updateTrip: vi.fn().mockResolvedValue({}),
  deleteTripByShareCode: vi.fn().mockResolvedValue(undefined),
}))

const sampleTrip = {
  id: 'trip-1',
  name: 'Taiwan',
  share_code: 'WH82BK',
  destination_country: 'KR',
  start_date: '2026-07-06',
  end_date: '2026-07-09',
} as unknown as Trip

function Harness({
  onClose = vi.fn(),
  isOwner,
  authEmail,
  onSignInWithGoogle,
  shareCode,
  trip,
  onTripChanged,
}: {
  onClose?: () => void
  isOwner?: boolean
  authEmail?: string | null
  onSignInWithGoogle?: () => Promise<void>
  shareCode?: string
  trip?: Trip | null
  onTripChanged?: () => void
}) {
  const [themeId, setThemeId] = useState<ThemeId>('cartography')
  const [accent, setAccent] = useState<string | undefined>(undefined)

  return (
    <ThemeProvider themeId={themeId} accent={accent} onThemeChange={setThemeId} onAccentChange={setAccent}>
      <SettingsPanel
        onClose={onClose}
        isOwner={isOwner}
        authEmail={authEmail}
        onSignInWithGoogle={onSignInWithGoogle}
        shareCode={shareCode}
        trip={trip}
        onTripChanged={onTripChanged}
      />
    </ThemeProvider>
  )
}

describe('SettingsPanel', () => {
  it('shows all 4 built-in themes as selectable thumbnails', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: '復古探險地圖' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '東京霓虹夜' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '明信片剪貼簿' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '和風藍染' })).toBeInTheDocument()
  })

  it('marks the current theme as selected', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: '復古探險地圖' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '東京霓虹夜' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches theme and updates the accent swatches shown', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByLabelText('強調色 #c1683a')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '東京霓虹夜' }))

    expect(screen.getByRole('button', { name: '東京霓虹夜' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('強調色 #ff3ec9')).toBeInTheDocument()
    expect(screen.queryByLabelText('強調色 #c1683a')).not.toBeInTheDocument()
  })

  it('marks the current accent swatch as selected and switches on click', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByLabelText('強調色 #c1683a')).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByLabelText('強調色 #3f6b4f'))

    expect(screen.getByLabelText('強調色 #3f6b4f')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('強調色 #c1683a')).toHaveAttribute('aria-pressed', 'false')
  })

  it('previews each theme thumbnail with that theme\'s own illustration filter, not the active one', () => {
    render(<Harness />)
    const neonButton = screen.getByRole('button', { name: '東京霓虹夜' })
    const preview = neonButton.querySelector('svg')?.parentElement as HTMLElement
    expect(preview.style.filter).toBe(THEMES.neon.illustrationFilter)
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: '關閉' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('copies the current URL as the personal link when the copy button is clicked', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: '複製我的個人連結' }))

    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(screen.getByRole('button', { name: '已複製' })).toBeInTheDocument()
  })

  it('hides the invite-friends section when no share code is given', () => {
    render(<Harness />)
    expect(screen.queryByText('邀請朋友')).not.toBeInTheDocument()
  })

  it('copies a share-code-only invite link (no personal member id) for friends to join', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<Harness shareCode="ABC234" />)

    expect(screen.getByText('邀請朋友')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '複製邀請連結' }))

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/t/ABC234`)
    expect(screen.getByRole('button', { name: '已複製' })).toBeInTheDocument()
  })

  it('hides the account section for non-owner members', () => {
    render(<Harness isOwner={false} />)
    expect(screen.queryByText('帳戶')).not.toBeInTheDocument()
  })

  it('lets the owner sign in with Google', async () => {
    const user = userEvent.setup()
    const onSignInWithGoogle = vi.fn().mockResolvedValue(undefined)
    render(<Harness isOwner onSignInWithGoogle={onSignInWithGoogle} />)

    expect(screen.getByText('帳戶')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '用 Google 登入' }))

    expect(onSignInWithGoogle).toHaveBeenCalled()
  })

  it('shows an error if Google sign-in fails', async () => {
    const user = userEvent.setup()
    const onSignInWithGoogle = vi.fn().mockRejectedValue(new Error('provider not enabled'))
    render(<Harness isOwner onSignInWithGoogle={onSignInWithGoogle} />)

    await user.click(screen.getByRole('button', { name: '用 Google 登入' }))

    expect(await screen.findByText('登入失敗，請稍後再試')).toBeInTheDocument()
  })

  it('shows the logged-in email instead of the login form once the owner is authenticated', () => {
    render(<Harness isOwner authEmail="stephanie@example.com" />)
    expect(screen.getByText(/已用 stephanie@example.com 登入/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })

  it('hides the delete button and shows a login hint when the owner is not signed in', () => {
    render(<Harness isOwner trip={sampleTrip} />)
    expect(screen.queryByRole('button', { name: '刪除此行程' })).not.toBeInTheDocument()
    expect(screen.getByText(/徹底刪除行程需要先在上面「帳戶」以 Google 登入/)).toBeInTheDocument()
  })

  it('shows the delete button once the owner is signed in', () => {
    render(<Harness isOwner authEmail="stephanie@example.com" trip={sampleTrip} />)
    expect(screen.getByRole('button', { name: '刪除此行程' })).toBeInTheDocument()
  })

  it('shows the destination selector prefilled from the trip for an owner', () => {
    render(<Harness isOwner trip={sampleTrip} />)
    const select = screen.getByLabelText('目的地國家') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    expect(select.value).toBe('KR')
  })

  it('hides the destination selector for non-owner members', () => {
    render(<Harness isOwner={false} trip={sampleTrip} />)
    expect(screen.queryByLabelText('目的地國家')).not.toBeInTheDocument()
  })

  it('saves a changed destination and refetches the trip', async () => {
    const user = userEvent.setup()
    const onTripChanged = vi.fn()
    vi.mocked(updateTrip).mockResolvedValue(sampleTrip)
    render(<Harness isOwner trip={sampleTrip} onTripChanged={onTripChanged} />)

    await user.selectOptions(screen.getByLabelText('目的地國家'), 'TW')
    await user.click(screen.getByRole('button', { name: /儲存目的地|已儲存/ }))

    expect(updateTrip).toHaveBeenCalledWith('trip-1', { destinationCountry: 'TW' })
    expect(onTripChanged).toHaveBeenCalled()
  })
})
