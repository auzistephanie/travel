import { THEMES } from '../theme/tokens'
import { useTheme } from '../theme/ThemeContext'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { themeId, accent, setThemeId, setAccent } = useTheme()
  const currentTheme = THEMES[themeId]

  return (
    <div role="dialog" aria-label="設定">
      <h2>設定</h2>

      <h3>主題</h3>
      <ul aria-label="主題選擇">
        {Object.values(THEMES).map((theme) => (
          <li key={theme.id}>
            <button
              type="button"
              aria-pressed={theme.id === themeId}
              onClick={() => setThemeId(theme.id)}
              style={{
                background: theme.colorBg,
                color: theme.colorHeading,
                fontFamily: theme.fontHeading,
                borderColor: theme.id === themeId ? theme.defaultAccent : theme.colorBorder,
              }}
            >
              {theme.name}
            </button>
          </li>
        ))}
      </ul>

      <h3>強調色</h3>
      <ul aria-label="強調色選擇">
        {currentTheme.accentSwatches.map((swatch) => (
          <li key={swatch}>
            <button
              type="button"
              aria-label={`強調色 ${swatch}`}
              aria-pressed={swatch === accent}
              onClick={() => setAccent(swatch)}
              style={{ background: swatch, width: 32, height: 32, borderRadius: '50%' }}
            />
          </li>
        ))}
      </ul>

      <button type="button" onClick={onClose}>
        關閉
      </button>
    </div>
  )
}
