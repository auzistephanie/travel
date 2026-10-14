import { json, notConfigured, readKey, upstreamJson, type ServerEnv } from './http.ts'

function readLimit(raw: string | null, fallback: number, max: number): number | null {
  if (raw == null || raw === '') return fallback
  if (!/^\d+$/.test(raw)) return null
  const value = Number(raw)
  if (value < 1 || value > max) return null
  return value
}

function readCoord(raw: string | null, min: number, max: number): number | null {
  if (raw == null || raw === '' || !/^-?\d+(\.\d+)?$/.test(raw)) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value < min || value > max) return null
  return value
}

export async function handleTomTomSearch(url: URL, env: ServerEnv): Promise<Response> {
  const key = readKey(env, 'TOMTOM_KEY')
  if (!key) return notConfigured()

  const type = url.searchParams.get('type')
  const query = url.searchParams.get('query')?.trim() ?? ''
  if ((type !== 'poi' && type !== 'search') || query.length < 1 || query.length > 120 || /[/?#\\]/.test(query)) {
    return json({ error: 'bad_request' }, 400)
  }

  const limit = readLimit(url.searchParams.get('limit'), type === 'poi' ? 8 : 3, 10)
  if (limit == null) return json({ error: 'bad_request' }, 400)

  const countrySet = url.searchParams.get('countrySet')?.trim() ?? ''
  if (countrySet && !/^[A-Za-z]{2}$/.test(countrySet)) return json({ error: 'bad_request' }, 400)

  const endpoint = type === 'poi' ? 'poiSearch' : 'search'
  const upstream = new URL(
    `https://api.tomtom.com/search/2/${endpoint}/${encodeURIComponent(query)}.json`,
  )
  upstream.searchParams.set('key', key)
  upstream.searchParams.set('limit', String(limit))
  if (countrySet) upstream.searchParams.set('countrySet', countrySet.toUpperCase())

  if (type === 'search') {
    const lat = readCoord(url.searchParams.get('lat'), -90, 90)
    const lon = readCoord(url.searchParams.get('lon'), -180, 180)
    const radius = readLimit(url.searchParams.get('radius'), 10000, 50000)
    if (lat == null || lon == null || radius == null) return json({ error: 'bad_request' }, 400)
    upstream.searchParams.set('lat', String(lat))
    upstream.searchParams.set('lon', String(lon))
    upstream.searchParams.set('radius', String(radius))
  }

  try {
    return await upstreamJson(await fetch(upstream))
  } catch {
    return json({ error: 'upstream' }, 502)
  }
}
