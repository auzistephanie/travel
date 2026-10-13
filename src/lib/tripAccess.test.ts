import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabase } = vi.hoisted(() => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInAnonymously: vi.fn(),
    },
  },
}))
vi.mock('./supabaseClient', () => ({ supabase }))

import { ensureTripSession } from './tripAccess'

describe('ensureTripSession', () => {
  beforeEach(() => {
    supabase.auth.getSession.mockReset()
    supabase.auth.signInAnonymously.mockReset()
  })

  it('keeps an existing session and does not sign in anonymously', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'google-1' } } },
      error: null,
    })

    await ensureTripSession()

    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it('signs in anonymously when there is no session', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    supabase.auth.signInAnonymously.mockResolvedValue({ error: null })

    await ensureTripSession()

    expect(supabase.auth.signInAnonymously).toHaveBeenCalledTimes(1)
  })

  it('shares one anonymous sign-in across overlapping callers', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    let resolveSignIn: (value: { error: null }) => void = () => {}
    supabase.auth.signInAnonymously.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve
      }),
    )

    const first = ensureTripSession()
    const second = ensureTripSession()
    resolveSignIn({ error: null })
    await Promise.all([first, second])

    expect(supabase.auth.signInAnonymously).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed anonymous sign-in', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    supabase.auth.signInAnonymously
      .mockResolvedValueOnce({ error: new Error('network') })
      .mockResolvedValueOnce({ error: null })

    await expect(ensureTripSession()).rejects.toThrow('network')
    await ensureTripSession()

    expect(supabase.auth.signInAnonymously).toHaveBeenCalledTimes(2)
  })
})
