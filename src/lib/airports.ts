import type { Flight } from './../types/models'

export interface AirportInfo {
  lat: number
  lng: number
  country: string
}

// 目前支援嘅目的地（spec 第 7 節）：日本／泰國／韓國／台灣／越南，可擴充
export const AIRPORTS: Record<string, AirportInfo> = {
  NRT: { lat: 35.7647, lng: 140.3864, country: 'JP' },
  HND: { lat: 35.5494, lng: 139.7798, country: 'JP' },
  KIX: { lat: 34.4347, lng: 135.2441, country: 'JP' },
  FUK: { lat: 33.5859, lng: 130.4506, country: 'JP' },
  BKK: { lat: 13.69, lng: 100.7501, country: 'TH' },
  DMK: { lat: 13.9126, lng: 100.6068, country: 'TH' },
  ICN: { lat: 37.4602, lng: 126.4407, country: 'KR' },
  GMP: { lat: 37.5583, lng: 126.7906, country: 'KR' },
  PUS: { lat: 35.1795, lng: 128.9382, country: 'KR' },
  TPE: { lat: 25.0777, lng: 121.2328, country: 'TW' },
  TSA: { lat: 25.0697, lng: 121.5522, country: 'TW' },
  KHH: { lat: 22.5771, lng: 120.3499, country: 'TW' },
  SGN: { lat: 10.8188, lng: 106.652, country: 'VN' },
  HAN: { lat: 21.2212, lng: 105.8072, country: 'VN' },
  DAD: { lat: 16.0439, lng: 108.1994, country: 'VN' },
  HKG: { lat: 22.308, lng: 113.9185, country: 'HK' },
  SIN: { lat: 1.3644, lng: 103.9915, country: 'SG' },
  KUL: { lat: 2.7456, lng: 101.7099, country: 'MY' },
  PEN: { lat: 5.2971, lng: 100.277, country: 'MY' },
}

export function getAirport(code: string): AirportInfo | undefined {
  return AIRPORTS[code]
}

// 用戶喺開新行程果陣直接揀國家（未加航班之前），攞返代表性機場座標
// 俾天氣/執李/心願清單店舖搜尋等功能用。
export function getAirportForCountry(countryCode: string): AirportInfo | undefined {
  return Object.values(AIRPORTS).find((airport) => airport.country === countryCode)
}

export function getFirstFlightAirport(flights: Flight[]): string | undefined {
  if (flights.length === 0) return undefined
  const earliest = [...flights].sort((a, b) => a.from_time.localeCompare(b.from_time))[0]
  return earliest.to_airport
}
