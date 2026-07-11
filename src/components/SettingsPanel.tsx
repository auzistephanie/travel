import { X } from 'lucide-react'
import { THEMES } from '../theme/tokens'
import { useTheme } from '../theme/ThemeContext'
import { GenericIllustration } from '../theme/illustrations/GenericIllustration'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { themeId, accent, setThemeId, setAccent } = useTheme()
  const currentTheme = THEMES[themeId]

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-sheet"
        role="dialog"
        aria-label="設定"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-head">
          <h2>設定</h2>
          <button type="button" className="settings-x" aria-label="關閉設定" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

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
                borderColor: theme.id === themeId ? theme.defaultAccent : theme.colorBorder,
                padding: 4,
              }}
            >
              <div className="destination-illustration" aria-hidden="true" style={{ filter: theme.illustrationFilter, width: 72 }}>
                <GenericIllustration />
              </div>
              <span style={{ color: theme.colorHeading, fontFamily: theme.fontHeading }}>{theme.name}</span>
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

        <button type="button" className="settings-done" onClick={onClose}>
          關閉
        </button>
      </div>
    </div>
  )
}
