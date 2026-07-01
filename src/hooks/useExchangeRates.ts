import { useEffect, useState } from 'react'
import { fetchExchangeRateToHKD } from '../lib/fxApi'

export function useExchangeRates(currencies: string[]): Record<string, number> {
  const [rates, setRates] = useState<Record<string, number>>({})
  const key = [...new Set(currencies)].sort().join(',')

  useEffect(() => {
    let cancelled = false
    const distinct = key ? key.split(',') : []

    Promise.all(distinct.map((currency) => fetchExchangeRateToHKD(currency).then((rate) => [currency, rate] as const))).then(
      (results) => {
        if (cancelled) return
        const map: Record<string, number> = {}
        for (const [currency, rate] of results) {
          if (rate != null) map[currency] = rate
        }
        setRates(map)
      },
    )

    return () => {
      cancelled = true
    }
  }, [key])

  return rates
}
