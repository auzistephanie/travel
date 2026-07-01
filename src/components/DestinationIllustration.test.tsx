import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DestinationIllustration } from './DestinationIllustration'
import { ThemeProvider } from '../theme/ThemeContext'
import { THEMES } from '../theme/tokens'

function renderWithTheme(countryCode: string | null) {
  return render(
    <ThemeProvider themeId="neon">
      <DestinationIllustration countryCode={countryCode} />
    </ThemeProvider>,
  )
}

describe('DestinationIllustration', () => {
  it('renders the matching illustration for a known country code', () => {
    const { container } = renderWithTheme('JP')
    expect(container.querySelector('title')?.textContent).toContain('日本')
  })

  it('falls back to the generic illustration for an unknown or missing country code', () => {
    const { container } = renderWithTheme(null)
    expect(container.querySelector('title')?.textContent).toContain('未知目的地')
  })

  it('applies the current theme illustration filter', () => {
    const { container } = renderWithTheme('JP')
    const wrapper = container.querySelector('svg')?.parentElement as HTMLElement
    expect(wrapper.style.filter).toBe(THEMES.neon.illustrationFilter)
  })
})
