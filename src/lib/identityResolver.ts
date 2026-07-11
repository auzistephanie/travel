// 身份識別嘅全套優先次序，一個純函數講晒（以前散落喺 TripShell 嘅 initial state、
// 兩個 effect 同一個 handler 度，每次加入口就爆一個新 edge case——見 CLAUDE.md 8d/8f/8l/8p）。
//
// 優先次序：
//   1. auth   — Google 登入 match 到已綁定嘅 member（除非用戶撳咗「切換身份」manualOverride）
//   2. url    — 網址 ?m=<memberId>（個人連結，for iOS 主畫面圖示/Safari 兩個 storage context）
//   3. storage— 呢部裝置 localStorage 記低嘅上次身份
//   4. none   — 冇得認，出「哪位是你？」揀名畫面
//
// url/storage 嘅 member id 一律要驗證真係存在於 members 先信——
// 以前係盲信嘅，member 被刪之後條舊連結會入到一個「幽靈身份」。
import type { TripMember } from '../types/models'

export type IdentitySource = 'auth' | 'url' | 'storage' | 'none'

export interface IdentityInput {
  members: TripMember[]
  /** 而家登入咗嘅 Supabase auth user id（冇登入就 null）。 */
  authUserId: string | null
  /** 網址 ?m= 嘅值。 */
  urlMemberId: string | null
  /** localStorage 記低嘅上次身份。 */
  storedMemberId: string | null
  /** 用戶撳咗「切換身份」：呢個 session 內唔准 auth 自動搶返身份。 */
  manualOverride: boolean
}

export interface ResolvedIdentity {
  memberId: string | null
  source: IdentitySource
}

export function resolveIdentity(input: IdentityInput): ResolvedIdentity {
  const { members, authUserId, urlMemberId, storedMemberId, manualOverride } = input

  if (authUserId && !manualOverride) {
    const linked = members.find((m) => m.auth_user_id === authUserId)
    if (linked) return { memberId: linked.id, source: 'auth' }
  }

  if (urlMemberId && members.some((m) => m.id === urlMemberId)) {
    return { memberId: urlMemberId, source: 'url' }
  }

  if (storedMemberId && members.some((m) => m.id === storedMemberId)) {
    return { memberId: storedMemberId, source: 'storage' }
  }

  return { memberId: null, source: 'none' }
}
