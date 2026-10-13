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
  const key = import.meta.env.VITE_TAGGUN_API_KEY
  if (!key) return { status: 'unconfigured' }

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('https://api.taggun.io/api/receipt/v1/simple/file', {
      method: 'POST',
      headers: { apikey: key },
      body: formData,
    })
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
