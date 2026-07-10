import { supabase } from './supabaseClient'
import { generateShareCode } from './shareCode'
import { UNIQUE_VIOLATION } from './postgrestErrors'
import type { Trip, TripMember } from '../types/models'

const MAX_SHARE_CODE_ATTEMPTS = 5

export interface CreateTripInput {
  name: string
  startDate: string
  endDate: string
  ownerName: string
  destinationCountry?: string | null
}

export interface CreateTripResult {
  trip: Trip
  owner: TripMember
}

export async function createTrip(input: CreateTripInput): Promise<CreateTripResult> {
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_SHARE_CODE_ATTEMPTS; attempt++) {
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        name: input.name,
        start_date: input.startDate,
        end_date: input.endDate,
        share_code: generateShareCode(),
        destination_country: input.destinationCountry ?? null,
      })
      .select()
      .single()

    if (error) {
      lastError = error
      if (error.code !== UNIQUE_VIOLATION) throw error
      continue
    }

    const { data: owner, error: memberError } = await supabase
      .from('trip_members')
      .insert({ trip_id: trip.id, name: input.ownerName, is_owner: true })
      .select()
      .single()

    if (memberError) throw memberError

    return { trip: trip as Trip, owner: owner as TripMember }
  }

  throw lastError
}

export interface FindTripResult {
  trip: Trip
  members: TripMember[]
}

export async function findTripByShareCode(shareCode: string): Promise<FindTripResult | null> {
  const { data: trip, error } = await supabase
    .from('trips')
    .select()
    .eq('share_code', shareCode)
    .maybeSingle()

  if (error) throw error
  if (!trip) return null

  const { data: members, error: membersError } = await supabase
    .from('trip_members')
    .select()
    .eq('trip_id', (trip as Trip).id)

  if (membersError) throw membersError

  return { trip: trip as Trip, members: (members ?? []) as TripMember[] }
}

export interface AuthUserTrip {
  shareCode: string
  name: string
  role: 'owner' | 'member'
  startDate: string | null
  endDate: string | null
}

// 登入後攞返呢個 auth user 連結咗嘅所有行程（跨裝置同步用）。
// 靠 trip_members.auth_user_id 認人，join 返 trips 攞名／日期／分享碼。
export async function getTripsForAuthUser(authUserId: string): Promise<AuthUserTrip[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('is_owner, trips(share_code, name, start_date, end_date)')
    .eq('auth_user_id', authUserId)

  if (error) throw error

  type TripJoin = { share_code: string; name: string; start_date: string | null; end_date: string | null }
  // Supabase 將 join 出嚟嘅 trips 型別成 array（其實一對一），統一先正規化成單一物件。
  const rows = (data ?? []) as unknown as Array<{ is_owner: boolean; trips: TripJoin | TripJoin[] | null }>

  return rows
    .map((row) => ({ is_owner: row.is_owner, trip: Array.isArray(row.trips) ? row.trips[0] : row.trips }))
    .filter((row): row is { is_owner: boolean; trip: TripJoin } => !!row.trip)
    .map((row) => ({
      shareCode: row.trip.share_code,
      name: row.trip.name,
      role: row.is_owner ? 'owner' : 'member',
      startDate: row.trip.start_date,
      endDate: row.trip.end_date,
    }))
}

export interface UpdateTripInput {
  name?: string
  startDate?: string
  endDate?: string
  destinationCountry?: string | null
}

// 更新行程基本資料（改名／日期／目的地）。owner 喺設定度用。
export async function updateTrip(tripId: string, patch: UpdateTripInput): Promise<Trip> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.startDate !== undefined) row.start_date = patch.startDate
  if (patch.endDate !== undefined) row.end_date = patch.endDate
  if (patch.destinationCountry !== undefined) row.destination_country = patch.destinationCountry

  const { data, error } = await supabase.from('trips').update(row).eq('id', tripId).select().single()
  if (error) throw error
  return data as Trip
}

// 徹底刪除行程：schema 所有子表 trip_id 都係 on delete cascade，
// 所以刪 trips 一行就連 members/flights/itinerary/packing/wishlist/expenses/gifts/settings 全部清走。不可還原。
export async function deleteTripByShareCode(shareCode: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('share_code', shareCode)
  if (error) throw error
}

export async function addTripMember(tripId: string, name: string): Promise<TripMember> {
  const { data, error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, name, is_owner: false })
    .select()
    .single()

  if (error) throw error
  return data as TripMember
}
