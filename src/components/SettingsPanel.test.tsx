import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsPanel } from './SettingsPanel'
import { ThemeProvider } from '../theme/ThemeContext'
import type { ThemeId } from '../types/models'

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [themeId, setThemeId] = useState<ThemeId>('cartography')
  const [accent, setAccent] = useState<string | undefined>(undefined)

  return (
    <ThemeProvider themeId={themeId} accent={accent} onThemeChange={setThemeId} onAccentChange={setAccent}>
      <SettingsPanel onClose={onClose} />
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

    expect(screen.getByLabelText('強調色 #2f4a3e')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '東京霓虹夜' }))

    expect(screen.getByRole('button', { name: '東京霓虹夜' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('強調色 #ff3ec9')).toBeInTheDocument()
    expect(screen.queryByLabelText('強調色 #2f4a3e')).not.toBeInTheDocument()
  })

  it('marks the current accent swatch as selected and switches on click', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByLabelText('強調色 #2f4a3e')).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByLabelText('強調色 #b5651d'))

    expect(screen.getByLabelText('強調色 #b5651d')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('強調色 #2f4a3e')).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: '關閉' }))
    expect(onClose).toHaveBeenCalled()
  })
})
