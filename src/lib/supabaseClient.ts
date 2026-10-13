import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createLocalDemoClient } from './localDemoClient'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] 未設定 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，改用本機示範模式。' +
      '行程只保存在這部瀏覽器。正式共編請參考 README.md 填入 .env。',
  )
}

// 有雲端設定就用真 Supabase；否則用本機示範客戶端，避免成個 app 讀寫即刻失敗。
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url, anonKey)
  : (createLocalDemoClient() as unknown as SupabaseClient)
