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
    colorBg: '#f3ecd8',
    colorBgAlt: '#fff8ea',
    colorText: '#2f3d33',
    colorHeading: '#2f4a3e',
    colorBorder: '#c9b98f',
    accentSwatches: ['#c1683a', '#3f6b4f', '#c99a3c', '#6b4226'],
    defaultAccent: '#c1683a',
    fontHeading: "'Noto Serif TC', 'Playfair Display', Georgia, serif",
    fontBody: "'Noto Sans TC', system-ui, -apple-system, sans-serif",
    illustrationFilter: 'saturate(0.96) contrast(1.02)',
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
