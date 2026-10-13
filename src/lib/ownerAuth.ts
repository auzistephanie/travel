// Owner-only 登入：得 trip 擁有人可以連結返自己嘅 Supabase Auth account（Google OAuth），
// 令佢喺唔同瀏覽器 context（例如 iOS 主畫面圖示 vs Safari）都自動認得返自己，
// 唔使淨係靠 localStorage/URL token。一般朋友唔受影響，繼續用「揀名」機制。
// 2026-07-04：由 email magic link 改用 Google 登入——magic link 撞正 Gmail 自動幫封信
// 「預先掃描」連結做安全檢查，掃描嗰吓已經用咗個一次性 token，搞到用戶自己撳嗰吓話連結失效
// （Supabase auth log 見到多次 "One-time token not found"）。Google OAuth 冇呢個問題。
import { supabase } from './supabaseClient'

export interface AuthUser {
  id: string
  email: string | null
  /** Google profile 個顯示名（user_metadata.full_name / name），冇就 null。用嚟預填「你的名字」。 */
  name: string | null
}

/** 由 Supabase auth user 抽返顯示名（Google OAuth 會放喺 user_metadata）。 */
function readDisplayName(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null
  const full = meta.full_name ?? meta.name
  return typeof full === 'string' && full.trim() ? full : null
}

/**
 * 用 Google account 登入，會跳去 Google 嘅授權畫面，完成後跳返嚟 redirectTo
 * （預設係而家個網址，通常已經帶埋 ?m= 身份）並自動登入。
 * 喺「開新行程」流程用嘅時候要明確傳個 trip 頁網址，因為嗰陣仲喺 /new 度，唔想撳完跳返去建立行程嗰頁。
 */
export async function signInWithGoogle(redirectTo: string = window.location.href): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) throw error
}

interface SessionUser {
  id: string
  email?: string | null
  is_anonymous?: boolean
  app_metadata?: { provider?: string }
  user_metadata?: Record<string, unknown>
}

/** Anonymous session 只係分享碼嘅通行證，唔當 Google 帳戶。否則會綁錯 owner、放寬刪除。 */
function isAnonymousAuthUser(user: SessionUser): boolean {
  if (user.is_anonymous === true) return true
  return user.app_metadata?.provider === 'anonymous'
}

function toAuthUser(user: SessionUser | null | undefined): AuthUser | null {
  if (!user || isAnonymousAuthUser(user)) return null
  return { id: user.id, email: user.email ?? null, name: readDisplayName(user.user_metadata) }
}

/** 讀返而家呢個瀏覽器 context 已經有嘅 Google session（anonymous session 當未登入）。 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession()
  return toAuthUser(data.session?.user)
}

/** 監聽 auth 狀態變化（例如撳咗 magic link 之後先至有 session）。返個 unsubscribe function。 */
export function onAuthUserChange(callback: (user: AuthUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(toAuthUser(session?.user))
  })
  return () => data.subscription.unsubscribe()
}

/** 將呢個 auth user 綁定去某個 trip_member（通常係 owner 第一次登入嗰陣做）。 */
export async function linkMemberToAuthUser(memberId: string, authUserId: string): Promise<void> {
  const { error } = await supabase.from('trip_members').update({ auth_user_id: authUserId }).eq('id', memberId)
  if (error) throw error
}
