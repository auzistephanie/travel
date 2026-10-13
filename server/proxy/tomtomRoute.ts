import { json, notConfigured, readKey, upstreamJson, type ServerEnv } from './http.ts'

function readCoord(raw: string | null, min: number, max: number): number | null {
  if (raw == null || raw === '' || !/^-?\d+(\.\d+)?$/.test(raw)) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value < min || value > max) return null
  return value
}

export async function handleTomTomRoute(url: URL, env: ServerEnv): Promise<Response> {
  const key = readKey(env, 'TOMTOM_KEY')
  if (!key) return notConfigured()

  const fromLat = readCoord(url.searchParams.get('fromLat'), -90, 90)
  const fromLng = readCoord(url.searchParams.get('fromLng'), -180, 180)
  const toLat = readCoord(url.searchParams.get('toLat'), -90, 90)
  const toLng = readCoord(url.searchParams.get('toLng'), -180, 180)
  const travelMode = url.searchParams.get('travelMode')
  if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
    return json({ error: 'bad_request' }, 400)
  }
  if (travelMode !== 'pedestrian' && travelMode !== 'car') return json({ error: 'bad_request' }, 400)

  const upstream = new URL(
    `https://api.tomtom.com/routing/1/calculateRoute/${fromLat},${fromLng}:${toLat},${toLng}/json`,
  )
  upstream.searchParams.set('key', key)
  upstream.searchParams.set('travelMode', travelMode)

  try {
    return await upstreamJson(await fetch(upstream))
  } catch {
    return json({ error: 'upstream' }, 502)
  }
}
