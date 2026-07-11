import type { ThemeId } from '../types/models'

const VALID_THEME_IDS: ThemeId[] = ['cartography', 'neon', 'scrapbook', 'indigo']
const DEFAULT_THEME_ID: ThemeId = 'cartography'

function themeKey(shareCode: string): string {
  return `theme:${shareCode}`
}

function accentKey(shareCode: string): string {
  return `theme-accent:${shareCode}`
}

export function getStoredThemeId(shareCode: string): ThemeId {
  const stored = localStorage.getItem(themeKey(shareCode))
  return (VALID_THEME_IDS as string[]).includes(stored ?? '') ? (stored as ThemeId) : DEFAULT_THEME_ID
}

export function setStoredThemeId(shareCode: string, themeId: ThemeId): void {
  localStorage.setItem(themeKey(shareCode), themeId)
}

export function getStoredAccent(shareCode: string): string | null {
  return localStorage.getItem(accentKey(shareCode))
}

export function setStoredAccent(shareCode: string, accent: string): void {
  localStorage.setItem(accentKey(shareCode), accent)
}
