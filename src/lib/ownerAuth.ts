// Owner-only 登入：得 trip 擁有人可以連結返自己嘅 Supabase Auth account（email magic link），
// 令佢喺唔同瀏覽器 context（例如 iOS 主畫面圖示 vs Safari）都自動認得返自己，
// 唔使淨係靠 localStorage/URL token。一般朋友唔受影響，繼續用「揀名」機制。
import { supabase } from './supabaseClient'

export interface AuthUser {
  id: string
  email: string | null
}

/**
 * 寄 magic link 去個 email，撳咗個連結會跳去 redirectTo（預設係而家個網址，通常已經帶埋 ?m= 身份）並自動登入。
 * 喺「開新行程」流程用嘅時候要明確傳個 trip 頁網址，因為嗰陣仲喺 /new 度，唔想個連結撳咗跳返去建立行程嗰頁。
 */
export async function sendOwnerLoginLink(email: string, redirectTo: string = window.location.href): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  if (error) throw error
}

/** 讀返而家呢個瀏覽器 context 已經有嘅 auth session（如果有）。 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null
  return { id: user.id, email: user.email ?? null }
}

/** 監聽 auth 狀態變化（例如撳咗 magic link 之後先至有 session）。返個 unsubscribe function。 */
export function onAuthUserChange(callback: (user: AuthUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user
    callback(user ? { id: user.id, email: user.email ?? null } : null)
  })
  return () => data.subscription.unsubscribe()
}

/** 將呢個 auth user 綁定去某個 trip_member（通常係 owner 第一次登入嗰陣做）。 */
export async function linkMemberToAuthUser(memberId: string, authUserId: string): Promise<void> {
  const { error } = await supabase.from('trip_members').update({ auth_user_id: authUserId }).eq('id', memberId)
  if (error) throw error
}
