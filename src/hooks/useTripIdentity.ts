// TripShell 嘅身份識別中樞：包住 resolveIdentity（優先次序）+ 全部副作用
// （auth session 訂閱、身份寫返 URL/localStorage、owner 首次登入自動綁定、切換身份）。
// TripShell 淨返「攞 identity、揀 render 邊個畫面」。
//
// manualOverride（「切換身份」後唔畀 auth 搶返身份）由 2026-07-11 起寫入 sessionStorage：
// 同一個 tab session 內 reload 都記得住你揀咗第二個身份（修 CLAUDE.md 8l 自認嘅限制）；
// 閂咗 tab 重開就回復 auth 自動識別。
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolveIdentity, type IdentitySource } from '../lib/identityResolver'
import { clearWhoAmI, getWhoAmI, setWhoAmI } from '../lib/whoAmI'
import { sessionGet, sessionSet } from '../lib/safeStorage'
import { getCurrentAuthUser, linkMemberToAuthUser, onAuthUserChange, type AuthUser } from '../lib/ownerAuth'
import type { TripMember } from '../types/models'

const OVERRIDE_PREFIX = 'whoami-override:'

export interface TripIdentity {
  /** 認到嘅 member id；null = 要出「哪位是你？」 */
  memberId: string | null
  /** 身份係由邊度嚟（manual = 呢個 session 揀名畫面揀嘅）。 */
  source: IdentitySource | 'manual'
  authUser: AuthUser | null
  /** 揀名畫面揀咗人（或者啱啱加咗新名字）。 */
  select: (memberId: string) => void
  /** 「切換身份」：清記錄、擋 auth 自動識別、翻返揀名畫面。 */
  switchIdentity: () => void
}

export function useTripIdentity(shareCode: string, members: TripMember[], refetch?: () => void): TripIdentity {
  const [searchParams, setSearchParams] = useSearchParams()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [manualOverride, setManualOverride] = useState(() => sessionGet(OVERRIDE_PREFIX + shareCode) === '1')
  // 呢個 session 內用戶明確揀咗嘅身份（最高優先，連 auth 都唔會搶——係佢親手揀嘅）
  const [explicitId, setExplicitId] = useState<string | null>(null)
  // localStorage 記錄開頁嗰刻 snapshot 一次；「切換身份」清咗之後唔會再讀返
  const [storedMemberId, setStoredMemberId] = useState<string | null>(() => getWhoAmI(shareCode))

  const urlMemberId = searchParams.get('m')

  // 讀返而家呢個瀏覽器 context 有冇登入咗嘅 owner account，並訂閱之後嘅變化。
  useEffect(() => {
    let cancelled = false
    getCurrentAuthUser().then((user) => {
      if (!cancelled) setAuthUser(user)
    })
    const unsubscribe = onAuthUserChange((user) => setAuthUser(user))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const resolved = useMemo(() => {
    if (explicitId) return { memberId: explicitId, source: 'manual' as const }
    return resolveIdentity({
      members,
      authUserId: authUser?.id ?? null,
      urlMemberId,
      storedMemberId,
      manualOverride,
    })
  }, [explicitId, members, authUser, urlMemberId, storedMemberId, manualOverride])

  // 身份一旦確定：寫返落 localStorage + 網址列（唔留 history）。
  // 用戶之後複製呢條連結去重新 pin 主畫面圖示，換過 storage context 都認得返。
  useEffect(() => {
    if (!resolved.memberId) return
    setWhoAmI(shareCode, resolved.memberId)
    if (urlMemberId === resolved.memberId) return
    const next = new URLSearchParams(searchParams)
    next.set('m', resolved.memberId)
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved.memberId, shareCode])

  // Owner 第一次登入：幫佢將而家嘅身份綁定落 auth account（之後全新裝置都認得返）。
  useEffect(() => {
    if (!authUser || manualOverride || !resolved.memberId) return
    const alreadyLinked = members.some((m) => m.auth_user_id === authUser.id)
    if (alreadyLinked) return
    const currentMember = members.find((m) => m.id === resolved.memberId)
    if (currentMember?.is_owner && !currentMember.auth_user_id) {
      linkMemberToAuthUser(currentMember.id, authUser.id).then(() => refetch?.())
    }
  }, [authUser, manualOverride, resolved.memberId, members, refetch])

  function select(memberId: string) {
    setWhoAmI(shareCode, memberId)
    setExplicitId(memberId)
  }

  function switchIdentity() {
    clearWhoAmI(shareCode)
    sessionSet(OVERRIDE_PREFIX + shareCode, '1')
    setManualOverride(true)
    setExplicitId(null)
    setStoredMemberId(null)
    const next = new URLSearchParams(searchParams)
    next.delete('m')
    setSearchParams(next, { replace: true })
  }

  return { memberId: resolved.memberId, source: resolved.source, authUser, select, switchIdentity }
}
