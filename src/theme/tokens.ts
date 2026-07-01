import type { ThemeId } from '../types/models'

export interface ThemeTokens {
  id: ThemeId
  name: string
  colorBg: string
  colorBgAlt: string
  colorText: string
  colorHeading: string
  colorBorder: string
  accentSwatches: string[]
  defaultAccent: string
  fontHeading: string
  fontBody: string
  illustrationFilter: string
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  cartography: {
    id: 'cartography',
    name: '復古探險地圖',
    colorBg: '#f4e9d8',
    colorBgAlt: '#ede0c8',
    colorText: '#3b2f1e',
    colorHeading: '#2f4a3e',
    colorBorder: '#c9b892',
    accentSwatches: ['#2f4a3e', '#b5651d', '#6b4226', '#8a7b4e'],
    defaultAccent: '#2f4a3e',
    fontHeading: "'Playfair Display', Georgia, serif",
    fontBody: "'Special Elite', 'Courier New', monospace",
    illustrationFilter: 'sepia(0.5) contrast(1.1) saturate(0.9)',
  },
  neon: {
    id: 'neon',
    name: '東京霓虹夜',
    colorBg: '#16111f',
    colorBgAlt: '#1f1830',
    colorText: '#e8d9ff',
    colorHeading: '#ff3ec9',
    colorBorder: '#3d2f57',
    accentSwatches: ['#ff3ec9', '#2ee6d6', '#a64dff', '#f5ff4d'],
    defaultAccent: '#ff3ec9',
    fontHeading: "'Share Tech Mono', 'Consolas', monospace",
    fontBody: "'Share Tech Mono', 'Consolas', monospace",
    illustrationFilter: 'contrast(1.3) hue-rotate(280deg) saturate(1.6) brightness(0.9)',
  },
  scrapbook: {
    id: 'scrapbook',
    name: '明信片剪貼簿',
    colorBg: '#fbf6ec',
    colorBgAlt: '#ffffff',
    colorText: '#4a4038',
    colorHeading: '#c2434a',
    colorBorder: '#e2d5bd',
    accentSwatches: ['#c2434a', '#6fae8c', '#e8a33d', '#6fa8c2'],
    defaultAccent: '#c2434a',
    fontHeading: "'Caveat', cursive",
    fontBody: "'Merriweather', Georgia, serif",
    illustrationFilter: 'saturate(0.75) brightness(1.08) contrast(0.95)',
  },
  indigo: {
    id: 'indigo',
    name: '和風藍染',
    colorBg: '#16324f',
    colorBgAlt: '#1f4166',
    colorText: '#e8f1f5',
    colorHeading: '#d4af37',
    colorBorder: '#2c4f70',
    accentSwatches: ['#c0392b', '#d4af37', '#e8f1f5', '#4a5c8c'],
    defaultAccent: '#d4af37',
    fontHeading: "'Noto Serif JP', serif",
    fontBody: "'Noto Serif JP', serif",
    illustrationFilter: 'hue-rotate(200deg) saturate(1.3) brightness(0.85)',
  },
}

export function getTheme(id: ThemeId): ThemeTokens {
  return THEMES[id]
}

export function themeToCssVariables(tokens: ThemeTokens, accentOverride?: string): Record<string, string> {
  return {
    '--color-bg': tokens.colorBg,
    '--color-bg-alt': tokens.colorBgAlt,
    '--color-text': tokens.colorText,
    '--color-heading': tokens.colorHeading,
    '--color-border': tokens.colorBorder,
    '--color-accent': accentOverride ?? tokens.defaultAccent,
    '--font-heading': tokens.fontHeading,
    '--font-body': tokens.fontBody,
  }
}
