import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react'
import { getTheme, themeToCssVariables, type ThemeTokens } from './tokens'
import type { ThemeId } from '../types/models'

interface ThemeContextValue {
  themeId: ThemeId
  accent: string
  tokens: ThemeTokens
  setThemeId: (themeId: ThemeId) => void
  setAccent: (accent: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  themeId: ThemeId
  accent?: string
  onThemeChange?: (themeId: ThemeId) => void
  onAccentChange?: (accent: string) => void
  children: ReactNode
}

export function ThemeProvider({ themeId, accent, onThemeChange, onAccentChange, children }: ThemeProviderProps) {
  const tokens = getTheme(themeId)
  const resolvedAccent = accent ?? tokens.defaultAccent

  const cssVars = useMemo(
    () => themeToCssVariables(tokens, resolvedAccent) as CSSProperties,
    [tokens, resolvedAccent],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      accent: resolvedAccent,
      tokens,
      setThemeId: (id: ThemeId) => onThemeChange?.(id),
      setAccent: (color: string) => onAccentChange?.(color),
    }),
    [themeId, resolvedAccent, tokens, onThemeChange, onAccentChange],
  )

  return (
    <ThemeContext.Provider value={value}>
      <div className="theme-root" style={cssVars} data-theme={themeId}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
