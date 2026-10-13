import { warnApiFailure } from './apiWarn'

export interface ReceiptOcrResult {
  merchantName: string | null
  totalAmount: number | null
}

interface TaggunSimpleResponse {
  merchantName?: { data?: string }
  totalAmount?: { data?: number }
}

export async function scanReceipt(file: File): Promise<ReceiptOcrResult | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/taggun', {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    })
    if (response.status === 503) return null
    if (!response.ok) {
      warnApiFailure('ocrApi', `HTTP ${response.status}`)
      return null
    }

    const body = (await response.json()) as TaggunSimpleResponse

    return {
      merchantName: body.merchantName?.data ?? null,
      totalAmount: body.totalAmount?.data ?? null,
    }
  } catch (error) {
    warnApiFailure('ocrApi', error)
    return null
  }
}
