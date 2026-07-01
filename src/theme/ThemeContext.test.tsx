import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeContext'

function Probe() {
  const { themeId, accent, tokens, setThemeId, setAccent } = useTheme()
  return (
    <div>
      <span>{themeId}</span>
      <span>{accent}</span>
      <span>{tokens.name}</span>
      <button type="button" onClick={() => setThemeId('neon')}>
        switch to neon
      </button>
      <button type="button" onClick={() => setAccent('#2ee6d6')}>
        switch accent
      </button>
    </div>
  )
}

describe('ThemeProvider / useTheme', () => {
  it('provides the resolved theme id, default accent, and tokens', () => {
    render(
      <ThemeProvider themeId="neon">
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByText('neon')).toBeInTheDocument()
    expect(screen.getByText('#ff3ec9')).toBeInTheDocument()
    expect(screen.getByText('東京霓虹夜')).toBeInTheDocument()
  })

  it('uses the given accent override instead of the theme default', () => {
    render(
      <ThemeProvider themeId="cartography" accent="#b5651d">
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByText('#b5651d')).toBeInTheDocument()
  })

  it('sets CSS custom properties on the wrapping element', () => {
    const { container } = render(
      <ThemeProvider themeId="cartography">
        <Probe />
      </ThemeProvider>,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.getPropertyValue('--color-bg')).toBe('#f4e9d8')
    expect(wrapper.dataset.theme).toBe('cartography')
  })

  it('throws when useTheme is called outside a provider', () => {
    function Bare() {
      useTheme()
      return null
    }
    expect(() => render(<Bare />)).toThrow()
  })

  it('calls onThemeChange when setThemeId is invoked', async () => {
    const user = userEvent.setup()
    const onThemeChange = vi.fn()
    render(
      <ThemeProvider themeId="cartography" onThemeChange={onThemeChange}>
        <Probe />
      </ThemeProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'switch to neon' }))
    expect(onThemeChange).toHaveBeenCalledWith('neon')
  })

  it('calls onAccentChange when setAccent is invoked', async () => {
    const user = userEvent.setup()
    const onAccentChange = vi.fn()
    render(
      <ThemeProvider themeId="cartography" onAccentChange={onAccentChange}>
        <Probe />
      </ThemeProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'switch accent' }))
    expect(onAccentChange).toHaveBeenCalledWith('#2ee6d6')
  })
})
