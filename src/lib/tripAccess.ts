import { supabase } from './supabaseClient'

// getSession() 會等 client 初始化完，包括網址上面嘅 Google OAuth code 換 session。
// 所以唔會喺登入跳返嚟嗰一下，誤當「未登入」再 signInAnonymously 蓋過 Google session。
let inflight: Promise<void> | null = null

async function establishSession(): Promise<void> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (data.session?.user) return

  const signedIn = await supabase.auth.signInAnonymously()
  if (signedIn.error) throw signedIn.error
}

/** 有 Google session 就用佢；否則靜靜建立 anonymous session。失敗會再試，唔會記住失敗。 */
export function ensureTripSession(): Promise<void> {
  if (!inflight) {
    inflight = establishSession().finally(() => {
      inflight = null
    })
  }
  return inflight
}
