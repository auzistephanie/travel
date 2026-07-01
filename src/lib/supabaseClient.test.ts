import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('supabaseClient', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports not configured when env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const { isSupabaseConfigured } = await import('./supabaseClient')
    expect(isSupabaseConfigured).toBe(false)
  })

  it('reports configured when env vars are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    const { isSupabaseConfigured } = await import('./supabaseClient')
    expect(isSupabaseConfigured).toBe(true)
  })
})
