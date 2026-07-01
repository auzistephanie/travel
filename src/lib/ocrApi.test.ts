import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scanReceipt } from './ocrApi'

function fakeFile() {
  return new File(['fake-image-bytes'], 'receipt.jpg', { type: 'image/jpeg' })
}

describe('scanReceipt', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns null without calling the API when no key is configured', async () => {
    vi.stubEnv('VITE_TAGGUN_API_KEY', '')
    const result = await scanReceipt(fakeFile())
    expect(result).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns merchant name and total amount from a successful scan', async () => {
    vi.stubEnv('VITE_TAGGUN_API_KEY', 'test-key')
    const body = { merchantName: { data: '銀座曲奇' }, totalAmount: { data: 1280 } }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await scanReceipt(fakeFile())

    expect(result).toEqual({ merchantName: '銀座曲奇', totalAmount: 1280 })
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://api.taggun.io/api/receipt/v1/simple/file')
    expect((init?.headers as Record<string, string>).apikey).toBe('test-key')
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.stubEnv('VITE_TAGGUN_API_KEY', 'test-key')
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await scanReceipt(fakeFile())).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.stubEnv('VITE_TAGGUN_API_KEY', 'test-key')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await scanReceipt(fakeFile())).toBeNull()
  })
})
