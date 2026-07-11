import { supabase } from './supabaseClient'
import { UNIQUE_VIOLATION } from './postgrestErrors'
import type { ItineraryDay, ItineraryStop } from '../types/models'

export async function listDays(tripId: string): Promise<ItineraryDay[]> {
  const { data, error } = await supabase
    .from('itinerary_days')
    .select()
    .eq('trip_id', tripId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return (data ?? []) as ItineraryDay[]
}

async function createDay(tripId: string, date: string, orderIndex: number): Promise<ItineraryDay> {
  const { data, error } = await supabase
    .from('itinerary_days')
    .insert({ trip_id: tripId, date, order_index: orderIndex })
    .select()
    .single()

  if (error) {
    // 撞咗 (trip_id, date) unique constraint：可能有另一個 ensureDays() call
    // 幾乎同一時間插緊同一日（例如 React StrictMode 喺 dev 環境雙重執行 effect，
    // 或者兩個分頁一齊 mount useItinerary）。讀返出嚟用就得，唔使當錯處理。
    if (error.code === UNIQUE_VIOLATION) {
      const { data: existing, error: readError } = await supabase
        .from('itinerary_days')
        .select()
        .eq('trip_id', tripId)
        .eq('date', date)
        .single()
      if (readError) throw readError
      return existing as ItineraryDay
    }
    throw error
  }
  return data as ItineraryDay
}

function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const cur = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

export async function ensureDays(tripId: string, startDate: string, endDate: string): Promise<ItineraryDay[]> {
  const existing = await listDays(tripId)
  const existingDates = new Set(existing.map((d) => d.date))
  const missing = dateRange(startDate, endDate).filter((date) => !existingDates.has(date))

  const created = await Promise.all(missing.map((date, i) => createDay(tripId, date, existing.length + i)))

  return [...existing, ...created].sort((a, b) => a.date.localeCompare(b.date))
}

export async function listStops(dayId: string): Promise<ItineraryStop[]> {
  const { data, error } = await supabase
    .from('itinerary_stops')
    .select()
    .eq('day_id', dayId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return (data ?? []) as ItineraryStop[]
}

export interface AddStopInput {
  dayId: string
  time: string | null
  title: string
  placeName: string | null
  lat: number | null
  lng: number | null
  orderIndex: number
}

export async function addStop(input: AddStopInput): Promise<ItineraryStop> {
  const { data, error } = await supabase
    .from('itinerary_stops')
    .insert({
      day_id: input.dayId,
      time: input.time,
      title: input.title,
      place_name: input.placeName,
      lat: input.lat,
      lng: input.lng,
      order_index: input.orderIndex,
    })
    .select()
    .single()

  if (error) throw error
  return data as ItineraryStop
}

export async function deleteStop(stopId: string): Promise<void> {
  const { error } = await supabase.from('itinerary_stops').delete().eq('id', stopId)
  if (error) throw error
}

export async function reorderStops(stopIdsInOrder: string[]): Promise<void> {
  const results = await Promise.all(
    stopIdsInOrder.map((id, index) =>
      supabase.from('itinerary_stops').update({ order_index: index }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}
