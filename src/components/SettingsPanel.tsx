import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { THEMES } from '../theme/tokens'
import { useTheme } from '../theme/ThemeContext'
import { GenericIllustration } from '../theme/illustrations/GenericIllustration'

interface SettingsPanelProps {
  onClose: () => void
  isOwner?: boolean
  authEmail?: string | null
  onSendLoginLink?: (email: string) => Promise<void>
}

export function SettingsPanel({ onClose, isOwner = false, authEmail = null, onSendLoginLink }: SettingsPanelProps) {
  const { themeId, accent, setThemeId, setAccent } = useTheme()
  const currentTheme = THEMES[themeId]
  const [copied, setCopied] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [linkSent, setLinkSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 部分瀏覽器/情況攞唔到 clipboard 權限，靜靜哋唔做嘢，用戶可以自己揀網址列複製
    }
  }

  async function handleSendLoginLink() {
    const trimmed = loginEmail.trim()
    if (!trimmed || sending || !onSendLoginLink) return
    setSending(true)
    setSendError(null)
    try {
      await onSendLoginLink(trimmed)
      setLinkSent(true)
    } catch {
      setSendError('寄唔到登入連結，請檢查 email 或者遲啲再試')
    } finally {
      setSending(false)
    }
  }

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

        {isOwner && (
          <>
            <h3>帳戶</h3>
            {authEmail ? (
              <p className="settings-hint">已用 {authEmail} 登入，呢部裝置隨時都認得返你。</p>
            ) : linkSent ? (
              <p className="settings-hint">登入連結已寄去 {loginEmail}，請去信箱撳連結完成登入。</p>
            ) : (
              <>
                <p className="settings-hint">
                  留低 email 登入，就算換裝置或瀏覽器都認得返你，唔使再揀名。
                </p>
                <label htmlFor="owner-login-email">Email</label>
                <input
                  id="owner-login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
                <button type="button" onClick={handleSendLoginLink} disabled={sending}>
                  寄登入連結
                </button>
                {sendError && <p role="alert">{sendError}</p>}
              </>
            )}
          </>
        )}

        <h3>個人連結</h3>
        <p className="settings-hint">
          喺主畫面圖示同瀏覽器打開見到唔同人？複製呢條連結，兩邊都用返同一條，就會記得你係邊個。
        </p>
        <button type="button" className="settings-copy-link" onClick={handleCopyLink}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? '已複製' : '複製我的個人連結'}
        </button>

        <button type="button" className="settings-done" onClick={onClose}>
          關閉
        </button>
      </div>
    </div>
  )
}
