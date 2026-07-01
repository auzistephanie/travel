import { beforeEach, describe, expect, it } from 'vitest'
import { getStoredAccent, getStoredThemeId, setStoredAccent, setStoredThemeId } from './themeStorage'

describe('themeStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to cartography when nothing is stored', () => {
    expect(getStoredThemeId('ABC234')).toBe('cartography')
  })

  it('remembers a stored theme id per share code', () => {
    setStoredThemeId('ABC234', 'neon')
    expect(getStoredThemeId('ABC234')).toBe('neon')
    expect(getStoredThemeId('XYZ987')).toBe('cartography')
  })

  it('falls back to the default when the stored value is not a valid theme id', () => {
    localStorage.setItem('theme:ABC234', 'not-a-real-theme')
    expect(getStoredThemeId('ABC234')).toBe('cartography')
  })

  it('returns null accent when nothing is stored, and remembers one when set', () => {
    expect(getStoredAccent('ABC234')).toBeNull()
    setStoredAccent('ABC234', '#b5651d')
    expect(getStoredAccent('ABC234')).toBe('#b5651d')
  })
})
