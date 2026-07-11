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

export async function addTripMember(tripId: string, name: string): Promise<TripMember> {
  const { data, error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, name, is_owner: false })
    .select()
    .single()

  if (error) throw error
  return data as TripMember
}
