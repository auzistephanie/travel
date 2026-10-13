import { json, notConfigured, readKey, upstreamJson, type ServerEnv } from './http.ts'

const FLIGHT_CODE = /^[A-Za-z0-9]{2,8}$/

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export async function handleFlights(url: URL, env: ServerEnv): Promise<Response> {
  const key = readKey(env, 'AVIATIONSTACK_KEY')
  if (!key) return notConfigured()

  const code = url.searchParams.get('flight_iata')?.trim() ?? ''
  const date = url.searchParams.get('flight_date')?.trim() ?? ''
  if (!FLIGHT_CODE.test(code) || !isIsoDate(date)) return json({ error: 'bad_request' }, 400)

  const upstream = new URL('https://api.aviationstack.com/v1/flights')
  upstream.searchParams.set('access_key', key)
  upstream.searchParams.set('flight_iata', code.toUpperCase())
  upstream.searchParams.set('flight_date', date)

  try {
    return await upstreamJson(await fetch(upstream))
  } catch {
    return json({ error: 'upstream' }, 502)
  }
}
