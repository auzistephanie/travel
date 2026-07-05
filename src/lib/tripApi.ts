import { supabase } from './supabaseClient'
import { generateShareCode } from './shareCode'
import type { Trip, TripMember } from '../types/models'

const MAX_SHARE_CODE_ATTEMPTS = 5
const UNIQUE_VIOLATION = '23505'

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

export async function addTripMember(tripId: string, name: string): Promise<TripMember> {
  const { data, error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, name, is_owner: false })
    .select()
    .single()

  if (error) throw error
  return data as TripMember
}
