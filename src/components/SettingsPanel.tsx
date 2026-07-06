import { useState } from 'react'
import { Check, Copy, LogIn, Trash2, X } from 'lucide-react'
import { THEMES } from '../theme/tokens'
import { useTheme } from '../theme/ThemeContext'
import { GenericIllustration } from '../theme/illustrations/GenericIllustration'
import { deleteTripByShareCode, updateTrip } from '../lib/tripApi'
import { DESTINATIONS } from '../lib/destinations'
import type { Trip } from '../types/models'

// 同 CreateTrip 一致：HK 淨係本地參考用，唔擺入揀項。
const DESTINATION_OPTIONS = ['JP', 'TH', 'KR', 'TW', 'VN', 'SG', 'MY'] as const

interface SettingsPanelProps {
  onClose: () => void
  isOwner?: boolean
  authEmail?: string | null
  onSignInWithGoogle?: () => Promise<void>
  shareCode?: string
  trip?: Trip | null
  onTripChanged?: () => void
  onTripDeleted?: () => void
}

export function SettingsPanel({
  onClose,
  isOwner = false,
  authEmail = null,
  onSignInWithGoogle,
  shareCode,
  trip = null,
  onTripChanged,
  onTripDeleted,
}: SettingsPanelProps) {
  const { themeId, accent, setThemeId, setAccent } = useTheme()
  const currentTheme = THEMES[themeId]
  const [copied, setCopied] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deletingTrip, setDeletingTrip] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [destValue, setDestValue] = useState(trip?.destination_country ?? '')
  const [savingDest, setSavingDest] = useState(false)
  const [destSaved, setDestSaved] = useState(false)
  const [destError, setDestError] = useState<string | null>(null)

  async function handleSaveDestination() {
    if (!trip || savingDest) return
    setSavingDest(true)
    setDestError(null)
    try {
      await updateTrip(trip.id, { destinationCountry: destValue || null })
      setDestSaved(true)
      setTimeout(() => setDestSaved(false), 2000)
      onTripChanged?.()
    } catch {
      setDestError('儲存失敗，請再試一次')
    } finally {
      setSavingDest(false)
    }
  }

  async function handleDeleteTrip() {
    if (!trip || deletingTrip) return
    setDeletingTrip(true)
    setDeleteError(null)
    try {
      await deleteTripByShareCode(trip.share_code)
      onTripDeleted?.()
    } catch {
      setDeleteError('刪除失敗，請再試一次')
      setDeletingTrip(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 部分瀏覽器/情況攞唔到 clipboard 權限，靜靜哋唔做嘢，用戶可以自己揀網址列複製
    }
  }

  async function handleCopyInviteLink() {
    if (!shareCode) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/t/${shareCode}`)
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    } catch {
      // 同上，攞唔到 clipboard 權限就靜靜哋唔做嘢
    }
  }

  async function handleGoogleSignIn() {
    if (signingIn || !onSignInWithGoogle) return
    setSigningIn(true)
    setSignInError(null)
    try {
      await onSignInWithGoogle()
    } catch {
      setSignInError('登入失敗，請遲啲再試')
      setSigningIn(false)
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
            ) : (
              <>
                <p className="settings-hint">用 Google 登入，就算換裝置或瀏覽器都認得返你，唔使再揀名。</p>
                <button type="button" onClick={handleGoogleSignIn} disabled={signingIn}>
                  <LogIn size={16} aria-hidden="true" />
                  用 Google 登入
                </button>
                {signInError && <p role="alert">{signInError}</p>}
              </>
            )}
          </>
        )}

        {isOwner && trip && (
          <>
            <h3>目的地</h3>
            <p className="settings-hint">
              改咗目的地，地圖搜尋會篩返當地結果，行李／簽證／交通卡建議亦會跟住更新。
            </p>
            <select
              aria-label="目的地國家"
              className="settings-dest-select"
              value={destValue}
              onChange={(e) => setDestValue(e.target.value)}
            >
              <option value="">未定（加入航班後自動判斷）</option>
              {DESTINATION_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {DESTINATIONS[code].countryName}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="settings-copy-link"
              onClick={handleSaveDestination}
              disabled={savingDest}
            >
              {destSaved && <Check size={16} aria-hidden="true" />}
              {savingDest ? '儲存中…' : destSaved ? '已儲存' : '儲存目的地'}
            </button>
            {destError && <p role="alert">{destError}</p>}
          </>
        )}

        {isOwner && trip && (
          <>
            <h3>刪除行程</h3>
            {confirmingDelete ? (
              <>
                <p className="settings-hint">
                  徹底刪除「{trip.name}」？連夾錢、行李、行程、手信全部一次過清走，不可還原。
                </p>
                <button
                  type="button"
                  className="settings-danger-btn"
                  onClick={handleDeleteTrip}
                  disabled={deletingTrip}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {deletingTrip ? '刪除中…' : '確認徹底刪除'}
                </button>
                <button
                  type="button"
                  className="settings-copy-link"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deletingTrip}
                >
                  取消
                </button>
              </>
            ) : (
              <button
                type="button"
                className="settings-danger-btn"
                onClick={() => {
                  setDeleteError(null)
                  setConfirmingDelete(true)
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
                刪除呢個行程
              </button>
            )}
            {deleteError && <p role="alert">{deleteError}</p>}
          </>
        )}

        {shareCode && (
          <>
            <h3>邀請朋友</h3>
            <p className="settings-hint">
              把呢條連結傳畀朋友，佢哋撳開揀返自己個名就可以一齊編輯，唔使登入、唔使開帳戶。
            </p>
            <button type="button" className="settings-copy-link" onClick={handleCopyInviteLink}>
              {inviteCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {inviteCopied ? '已複製' : '複製邀請連結'}
            </button>
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
