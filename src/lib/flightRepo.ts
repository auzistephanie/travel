import { supabase } from './supabaseClient'
import type { Flight } from '../types/models'

export interface AddFlightInput {
  tripId: string
  code: string
  fromAirport: string
  toAirport: string
  fromTime: string
  toTime: string
  date: string
  gate: string | null
  terminal: string | null
  seat: string | null
  pnr: string | null
  baggageKg: number | null
  memberId: string | null
}

export async function listFlights(tripId: string): Promise<Flight[]> {
  const { data, error } = await supabase
    .from('flights')
    .select()
    .eq('trip_id', tripId)
    .order('from_time', { ascending: true })

  if (error) throw error
  return (data ?? []) as Flight[]
}

export async function addFlight(input: AddFlightInput): Promise<Flight> {
  const { data, error } = await supabase
    .from('flights')
    .insert({
      trip_id: input.tripId,
      code: input.code,
      from_airport: input.fromAirport,
      to_airport: input.toAirport,
      from_time: input.fromTime,
      to_time: input.toTime,
      date: input.date,
      gate: input.gate,
      terminal: input.terminal,
      seat: input.seat,
      pnr: input.pnr,
      baggage_kg: input.baggageKg,
      member_id: input.memberId,
    })
    .select()
    .single()

  if (error) throw error
  return data as Flight
}
