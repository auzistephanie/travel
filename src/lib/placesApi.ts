import { warnApiFailure } from './apiWarn'

export interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
}

// ⚠️ 2026-07-29：地點搜尋主來源由 TomTom 換成 Nominatim（OSM）。唔好因為舊文字改返轉頭。
// 實測（同一條 key、已經用埋最好嘅 poiSearch endpoint）TomTom 亞洲中文 POI 幾乎冇覆蓋：
//   「淺草寺」→ 滋賀縣一間超市 ‧「東京鐵塔」→ EV 充電站 ‧「Sensoji」→ 0 結果
// 同一批 query Nominatim 全中，而且 accept-language=zh-Hant 直接出繁體名 + 中文地址。
// 兩者一樣免 key、免信用卡（＝當初揀 TomTom 嗰個理由完全保住）。
// TomTom 留低做 fallback，但 key 只放 server，瀏覽器打 /api/tomtom-search。
// Routing 同樣經 /api/tomtom-route，步行／駕車模式冇變。
const SEARCH_LIMIT = 8

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search'
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'

interface NominatimResult {
  name?: string
  display_name?: string
  lat?: string
  lon?: string
}

interface TomTomSearchResponse {
  results?: {
    poi?: { name?: string }
    address?: { freeformAddress?: string }
    position?: { lat?: number; lon?: number }
  }[]
}

// Nominatim 使用條款：最多每秒 1 次、唔好做逐個字母 autocomplete。
// 本 app 只喺用戶撳「搜尋」先叫一次，再加呢個串行閘 + 記憶體 cache，安全喺 policy 之內。
const NOMINATIM_MIN_GAP_MS = 1100
const IS_TEST = import.meta.env.MODE === 'test' // 測試唔使等真 1.1 秒
let nominatimChain: Promise<unknown> = Promise.resolve()
let nominatimLastCallAt = 0

function queueNominatim<T>(run: () => Promise<T>): Promise<T> {
  const next = nominatimChain.then(async () => {
    if (!IS_TEST) {
      const wait = NOMINATIM_MIN_GAP_MS - (Date.now() - nominatimLastCallAt)
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
    }
    nominatimLastCallAt = Date.now()
    return run()
  })
  nominatimChain = next.then(
    () => undefined,
    () => undefined,
  )
  return next
}

const searchCache = new Map<string, PlaceResult[]>()

function toPlaceResult(row: NominatimResult): PlaceResult | null {
  const lat = Number(row.lat)
  const lng = Number(row.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const display = row.display_name ?? ''
  const name = row.name?.trim() || display.split(',')[0]?.trim() || ''
  if (!name) return null
  return { name, address: display, lat, lng }
}

function searchNominatimWith(params: URLSearchParams): Promise<PlaceResult[]> {
  return queueNominatim(async () => {
    try {
      const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`)
      if (!response.ok) {
        warnApiFailure('placesApi/nominatim', `HTTP ${response.status}`)
        return []
      }
      const body = (await response.json()) as NominatimResult[]
      if (!Array.isArray(body)) return []
      return body.map(toPlaceResult).filter((p): p is PlaceResult => p !== null)
    } catch (error) {
      warnApiFailure('placesApi/nominatim', error)
      return []
    }
  })
}

async function searchNominatim(query: string, countryCode?: string | null): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: String(SEARCH_LIMIT),
    'accept-language': 'zh-Hant', // ← 令 OSM 出返繁體名同中文地址
  })
  if (countryCode) params.set('countrycodes', countryCode.toLowerCase())
  return searchNominatimWith(params)
}

async function searchTomTom(query: string, countryCode?: string | null): Promise<PlaceResult[]> {
  const params = new URLSearchParams({ type: 'poi', query, limit: String(SEARCH_LIMIT) })
  if (countryCode) params.set('countrySet', countryCode)

  try {
    const response = await fetch(`/api/tomtom-search?${params}`, { cache: 'no-store' })
    if (response.status === 503) return []
    if (!response.ok) {
      warnApiFailure('placesApi/tomtom', `HTTP ${response.status}`)
      return []
    }
    const body = (await response.json()) as TomTomSearchResponse
    return (body.results ?? [])
      .map((result) => ({
        name: result.poi?.name ?? '',
        address: result.address?.freeformAddress ?? '',
        lat: result.position?.lat ?? 0,
        lng: result.position?.lon ?? 0,
      }))
      .filter((p) => p.name !== '')
  } catch (error) {
    warnApiFailure('placesApi/tomtom', error)
    return []
  }
}

// 退讓次序：Nominatim(限國) → Nominatim(唔限國) → TomTom(限國)。
// 「唔限國」嗰步保住舊行為：目的地國家存錯（例：Taiwan 行程誤存做 KR）唔會鎖死搜尋。
export async function searchPlaces(query: string, countryCode?: string | null): Promise<PlaceResult[]> {
  const cacheKey = `${query}|${countryCode ?? ''}`
  const cached = searchCache.get(cacheKey)
  if (cached) return cached

  let results = await searchNominatim(query, countryCode)
  if (results.length === 0 && countryCode) results = await searchNominatim(query)
  if (results.length === 0) results = await searchTomTom(query, countryCode)

  if (results.length > 0) searchCache.set(cacheKey, results)
  return results
}

// 雨天室內推介：由 TomTom 改用 Overpass（OSM），同洗手間/便利店一致、免 key。
// 原本傳中文 query「商場 博物館 水族館」畀 TomTom，同上面講嘅原因一樣搵唔到嘢；
// OSM 用 tag 分類（tourism / shop）唔靠文字比對，準確得多。
const INDOOR_RADIUS_METERS = 5000
const INDOOR_CATEGORY_CAP = 3
const NEARBY_RADIUS_METERS = 10000

interface OverpassNode {
  lat?: number
  lon?: number
  center?: { lat?: number; lon?: number }
  tags?: Record<string, string>
}

function indoorLabel(tags: Record<string, string>): string {
  if (tags.shop === 'mall') return '商場'
  if (tags.tourism === 'museum') return '博物館'
  if (tags.tourism === 'aquarium') return '水族館'
  if (tags.tourism === 'gallery') return '美術館'
  return '室內好去處'
}

function overpassPoint(node: OverpassNode): { lat: number; lng: number } | null {
  if (node.lat != null && node.lon != null) return { lat: node.lat, lng: node.lon }
  // 商場多數係 way／relation，唔係 node；out center 先有座標。
  if (node.center?.lat != null && node.center.lon != null) {
    return { lat: node.center.lat, lng: node.center.lon }
  }
  return null
}

export async function searchIndoorPlaces(lat: number, lng: number): Promise<PlaceResult[]> {
  const around = `around:${INDOOR_RADIUS_METERS},${lat},${lng}`
  // 一次拎多啲，再按類別各留幾個。舊版 `out 6` 成批一齊切，博物館排前面就會擠走全部商場。
  const query =
    `[out:json][timeout:25];(` +
    `node["tourism"~"^(museum|aquarium|gallery)$"]["name"](${around});` +
    `way["tourism"~"^(museum|aquarium|gallery)$"]["name"](${around});` +
    `node["shop"="mall"]["name"](${around});` +
    `way["shop"="mall"]["name"](${around});` +
    `);out center 40;`

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
    })
    if (!response.ok) {
      warnApiFailure('placesApi/overpass', `HTTP ${response.status}`)
      return []
    }

    const body = (await response.json()) as { elements?: OverpassNode[] }
    let tourismCount = 0
    let mallCount = 0
    const picked: PlaceResult[] = []
    for (const node of body.elements ?? []) {
      const tags = node.tags ?? {}
      const name = tags['name:zh-Hant'] || tags['name:zh'] || tags.name || ''
      const point = overpassPoint(node)
      if (!name || !point) continue
      const isMall = tags.shop === 'mall'
      if (isMall) {
        if (mallCount >= INDOOR_CATEGORY_CAP) continue
        mallCount += 1
      } else {
        if (tourismCount >= INDOOR_CATEGORY_CAP) continue
        tourismCount += 1
      }
      picked.push({ name, address: indoorLabel(tags), lat: point.lat, lng: point.lng })
    }
    return picked
  } catch (error) {
    warnApiFailure('placesApi/overpass', error)
    return []
  }
}

function viewboxAround(lat: number, lng: number, radiusMeters: number): string {
  const dLat = radiusMeters / 111_320
  const dLng = dLat / Math.max(Math.cos((lat * Math.PI) / 180), 0.2)
  return `${lng - dLng},${lat + dLat},${lng + dLng},${lat - dLat}`
}

async function searchTomTomNearby(query: string, lat: number, lng: number): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    type: 'search',
    query,
    lat: String(lat),
    lon: String(lng),
    radius: String(NEARBY_RADIUS_METERS),
    limit: '3',
  })
  try {
    const response = await fetch(`/api/tomtom-search?${params}`, { cache: 'no-store' })
    if (response.status === 503 || !response.ok) {
      if (response.status !== 503) warnApiFailure('placesApi/tomtom-nearby', `HTTP ${response.status}`)
      return []
    }
    const body = (await response.json()) as TomTomSearchResponse
    return (body.results ?? [])
      .map((result) => ({
        name: result.poi?.name ?? '',
        address: result.address?.freeformAddress ?? '',
        lat: result.position?.lat ?? lat,
        lng: result.position?.lon ?? lng,
      }))
      .filter((place) => place.name !== '')
      .slice(0, 3)
  } catch (error) {
    warnApiFailure('placesApi/tomtom-nearby', error)
    return []
  }
}

// 手信「邊度買」：Nominatim 限住目的地附近，TomTom 只做 fallback。
// TomTom 亞洲中文 POI 幾乎冇覆蓋，唔可以再做主來源。
export async function searchPlacesNearby(query: string, lat: number, lng: number): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '3',
    bounded: '1',
    viewbox: viewboxAround(lat, lng, NEARBY_RADIUS_METERS),
    'accept-language': 'zh-Hant',
  })
  const nearby = await searchNominatimWith(params)
  if (nearby.length > 0) return nearby.slice(0, 3)
  return searchTomTomNearby(query, lat, lng)
}
