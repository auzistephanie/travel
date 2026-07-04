import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPanel } from './SettingsPanel'
import { ThemeProvider } from '../theme/ThemeContext'
import { THEMES } from '../theme/tokens'
import type { ThemeId } from '../types/models'

function Harness({
  onClose = vi.fn(),
  isOwner,
  authEmail,
  onSendLoginLink,
}: {
  onClose?: () => void
  isOwner?: boolean
  authEmail?: string | null
  onSendLoginLink?: (email: string) => Promise<void>
}) {
  const [themeId, setThemeId] = useState<ThemeId>('cartography')
  const [accent, setAccent] = useState<string | undefined>(undefined)

  return (
    <ThemeProvider themeId={themeId} accent={accent} onThemeChange={setThemeId} onAccentChange={setAccent}>
      <SettingsPanel onClose={onClose} isOwner={isOwner} authEmail={authEmail} onSendLoginLink={onSendLoginLink} />
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

  it('hides the account section for non-owner members', () => {
    render(<Harness isOwner={false} />)
    expect(screen.queryByText('帳戶')).not.toBeInTheDocument()
  })

  it('lets the owner send themselves a login link by email', async () => {
    const user = userEvent.setup()
    const onSendLoginLink = vi.fn().mockResolvedValue(undefined)
    render(<Harness isOwner onSendLoginLink={onSendLoginLink} />)

    expect(screen.getByText('帳戶')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'stephanie@example.com')
    await user.click(screen.getByRole('button', { name: '寄登入連結' }))

    expect(onSendLoginLink).toHaveBeenCalledWith('stephanie@example.com')
    expect(await screen.findByText(/登入連結已寄去 stephanie@example.com/)).toBeInTheDocument()
  })

  it('shows the logged-in email instead of the login form once the owner is authenticated', () => {
    render(<Harness isOwner authEmail="stephanie@example.com" />)
    expect(screen.getByText(/已用 stephanie@example.com 登入/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })
})
