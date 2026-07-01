interface ExchangeRateResponse {
  rates?: Record<string, number>
}

export async function fetchExchangeRateToHKD(currency: string): Promise<number | null> {
  if (currency === 'HKD') return 1

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${currency}`)
    if (!response.ok) return null

    const body = (await response.json()) as ExchangeRateResponse
    return body.rates?.HKD ?? null
  } catch {
    return null
  }
}
