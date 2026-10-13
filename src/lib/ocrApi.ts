import { warnApiFailure } from './apiWarn'

export interface ReceiptOcrResult {
  merchantName: string | null
  totalAmount: number | null
}

interface TaggunSimpleResponse {
  merchantName?: { data?: string }
  totalAmount?: { data?: number }
}

export type ReceiptScanStatus =
  | { status: 'ok'; value: ReceiptOcrResult }
  | { status: 'empty' }
  | { status: 'unconfigured' }
  | { status: 'failed' }

export async function scanReceiptDetailed(file: File): Promise<ReceiptScanStatus> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/taggun', {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    })
    // 503 = server 未設定 TAGGUN_API_KEY。
    if (response.status === 503) return { status: 'unconfigured' }
    if (!response.ok) {
      warnApiFailure('ocrApi', `HTTP ${response.status}`)
      return { status: 'failed' }
    }

    const body = (await response.json()) as TaggunSimpleResponse
    const value = {
      merchantName: body.merchantName?.data ?? null,
      totalAmount: body.totalAmount?.data ?? null,
    }
    if (!value.merchantName && value.totalAmount == null) return { status: 'empty' }
    return { status: 'ok', value }
  } catch (error) {
    warnApiFailure('ocrApi', error)
    return { status: 'failed' }
  }
}

export async function scanReceipt(file: File): Promise<ReceiptOcrResult | null> {
  const result = await scanReceiptDetailed(file)
  return result.status === 'ok' ? result.value : null
}
