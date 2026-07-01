export interface ReceiptOcrResult {
  merchantName: string | null
  totalAmount: number | null
}

interface TaggunSimpleResponse {
  merchantName?: { data?: string }
  totalAmount?: { data?: number }
}

export async function scanReceipt(file: File): Promise<ReceiptOcrResult | null> {
  const key = import.meta.env.VITE_TAGGUN_API_KEY
  if (!key) return null

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('https://api.taggun.io/api/receipt/v1/simple/file', {
      method: 'POST',
      headers: { apikey: key },
      body: formData,
    })
    if (!response.ok) return null

    const body = (await response.json()) as TaggunSimpleResponse

    return {
      merchantName: body.merchantName?.data ?? null,
      totalAmount: body.totalAmount?.data ?? null,
    }
  } catch {
    return null
  }
}
