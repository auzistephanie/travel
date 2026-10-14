import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scanReceipt, scanReceiptDetailed } from './ocrApi'

function fakeFile() {
  return new File(['fake-image-bytes'], 'receipt.jpg', { type: 'image/jpeg' })
}

describe('scanReceipt', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when the proxy says the key is not configured', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: 'not_configured' }), { status: 503 }))
    const result = await scanReceipt(fakeFile())
    expect(result).toBeNull()
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/taggun')
    expect(init?.headers).toBeUndefined()
  })

  it('reports unconfigured on 503 and failed on other errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 503 }))
    await expect(scanReceiptDetailed(fakeFile())).resolves.toEqual({ status: 'unconfigured' })

    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 }))
    await expect(scanReceiptDetailed(fakeFile())).resolves.toEqual({ status: 'failed' })
  })

  it('returns merchant name and total amount from a successful scan', async () => {
    const body = { merchantName: { data: '銀座曲奇' }, totalAmount: { data: 1280 } }
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))

    const result = await scanReceipt(fakeFile())

    expect(result).toEqual({ merchantName: '銀座曲奇', totalAmount: 1280 })
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/taggun')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeInstanceOf(FormData)
    expect((init?.headers as Record<string, string> | undefined)?.apikey).toBeUndefined()
  })

  it('returns null when the API responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    expect(await scanReceipt(fakeFile())).toBeNull()
  })

  it('returns null when the fetch call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    expect(await scanReceipt(fakeFile())).toBeNull()
  })
})
