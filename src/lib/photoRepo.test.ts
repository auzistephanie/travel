import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabase } = vi.hoisted(() => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}))
vi.mock('./supabaseClient', () => ({ supabase }))

import { uploadWishlistPhoto } from './photoRepo'

function fakeFile() {
  return new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })
}

describe('uploadWishlistPhoto', () => {
  beforeEach(() => {
    supabase.storage.from.mockReset()
  })

  it('uploads the file under the trip id and returns its public URL', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 't1/photo.jpg' }, error: null })
    const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/t1/photo.jpg' } })
    supabase.storage.from.mockReturnValue({ upload, getPublicUrl })

    const url = await uploadWishlistPhoto('t1', fakeFile())

    expect(supabase.storage.from).toHaveBeenCalledWith('wishlist-photos')
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^t1\//), expect.any(File))
    expect(url).toBe('https://cdn/t1/photo.jpg')
  })

  it('throws when the upload fails', async () => {
    const upload = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    supabase.storage.from.mockReturnValue({ upload, getPublicUrl: vi.fn() })

    await expect(uploadWishlistPhoto('t1', fakeFile())).rejects.toEqual({ message: 'boom' })
  })
})
