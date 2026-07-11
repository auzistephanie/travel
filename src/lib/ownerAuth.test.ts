import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabase } = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    auth: {
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))
vi.mock('./supabaseClient', () => ({ supabase }))

import { getCurrentAuthUser, linkMemberToAuthUser, onAuthUserChange, signInWithGoogle } from './ownerAuth'
import { makeQuery } from '../test/supabaseQueryMock'

describe('signInWithGoogle', () => {
  beforeEach(() => {
    supabase.auth.signInWithOAuth.mockReset()
  })

  it('starts a Google OAuth sign-in, redirecting back to the current URL by default', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null })
    await signInWithGoogle()
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
  })

  it('throws when Supabase returns an error', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: new Error('provider not enabled') })
    await expect(signInWithGoogle()).rejects.toThrow('provider not enabled')
  })

  it('redirects to an explicit URL when given one (e.g. the trip page right after creation)', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null })
    await signInWithGoogle('https://travel-ochre-rho.vercel.app/t/ABC234?m=m1')
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://travel-ochre-rho.vercel.app/t/ABC234?m=m1' },
    })
  })
})

describe('getCurrentAuthUser', () => {
  beforeEach(() => {
    supabase.auth.getSession.mockReset()
  })

  it('returns null when there is no session', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    expect(await getCurrentAuthUser()).toBeNull()
  })

  it('returns the user id, email and display name when a session exists', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u1', email: 'stephanie@example.com', user_metadata: { full_name: 'Stephanie Au' } },
        },
      },
    })
    expect(await getCurrentAuthUser()).toEqual({ id: 'u1', email: 'stephanie@example.com', name: 'Stephanie Au' })
  })

  it('returns name null when the session has no display name metadata', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'stephanie@example.com' } } },
    })
    expect(await getCurrentAuthUser()).toEqual({ id: 'u1', email: 'stephanie@example.com', name: null })
  })
})

describe('onAuthUserChange', () => {
  it('calls the callback with the user on sign-in and unsubscribes cleanly', () => {
    const unsubscribe = vi.fn()
    let capturedHandler: ((event: string, session: unknown) => void) | undefined
    supabase.auth.onAuthStateChange.mockImplementation((handler) => {
      capturedHandler = handler
      return { data: { subscription: { unsubscribe } } }
    })

    const callback = vi.fn()
    const stop = onAuthUserChange(callback)

    capturedHandler?.('SIGNED_IN', {
      user: { id: 'u1', email: 'stephanie@example.com', user_metadata: { name: 'Stephanie Au' } },
    })
    expect(callback).toHaveBeenCalledWith({ id: 'u1', email: 'stephanie@example.com', name: 'Stephanie Au' })

    capturedHandler?.('SIGNED_OUT', null)
    expect(callback).toHaveBeenCalledWith(null)

    stop()
    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('linkMemberToAuthUser', () => {
  it('updates the member row with the auth user id', async () => {
    let memberQuery: ReturnType<typeof makeQuery> | undefined
    supabase.from.mockReset()
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trip_members') {
        memberQuery = makeQuery({ data: null, error: null })
        return memberQuery
      }
      throw new Error(`unexpected table ${table}`)
    })

    await linkMemberToAuthUser('m1', 'u1')

    expect(memberQuery?.update).toHaveBeenCalledWith({ auth_user_id: 'u1' })
    expect(memberQuery?.eq).toHaveBeenCalledWith('id', 'm1')
  })
})
