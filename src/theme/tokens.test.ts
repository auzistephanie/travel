import { describe, expect, it } from 'vitest'
import { getTheme, THEMES, themeToCssVariables } from './tokens'

describe('THEMES', () => {
  it('defines all 4 built-in themes with 4 accent swatches each', () => {
    const ids = Object.keys(THEMES)
    expect(ids.sort()).toEqual(['cartography', 'indigo', 'neon', 'scrapbook'])
    for (const theme of Object.values(THEMES)) {
      expect(theme.accentSwatches).toHaveLength(4)
      expect(theme.accentSwatches).toContain(theme.defaultAccent)
      expect(theme.illustrationFilter).toBeTruthy()
    }
  })
})

describe('getTheme', () => {
  it('returns the requested theme tokens', () => {
    expect(getTheme('neon').name).toBe('東京霓虹夜')
  })
})

describe('themeToCssVariables', () => {
  it('maps theme tokens to CSS custom properties', () => {
    const vars = themeToCssVariables(THEMES.cartography)
    expect(vars['--color-bg']).toBe(THEMES.cartography.colorBg)
    expect(vars['--color-accent']).toBe(THEMES.cartography.defaultAccent)
  })

  it('overrides the accent color when one is given', () => {
    const vars = themeToCssVariables(THEMES.cartography, '#b5651d')
    expect(vars['--color-accent']).toBe('#b5651d')
  })
})
