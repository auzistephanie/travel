import { supabase } from './supabaseClient'
import type { Gift, GiftSource } from '../types/models'

export async function listGifts(tripId: string): Promise<Gift[]> {
  const { data, error } = await supabase.from('gifts').select().eq('trip_id', tripId)
  if (error) throw error
  return (data ?? []) as Gift[]
}

export interface AddGiftInput {
  tripId: string
  item: string
  store: string | null
  amount: number | null
  toMember: string
  source: GiftSource
  currency?: string | null
}

export async function addGift(input: AddGiftInput): Promise<Gift> {
  const { data, error } = await supabase
    .from('gifts')
    .insert({
      trip_id: input.tripId,
      item: input.item,
      store: input.store,
      amount: input.amount,
      to_member: input.toMember,
      source: input.source,
      currency: input.currency ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Gift
}

export interface UpdateGiftInput {
  item: string
  store: string | null
  amount: number | null
  toMember: string
  currency?: string | null
}

export async function updateGift(id: string, input: UpdateGiftInput): Promise<Gift> {
  const { data, error } = await supabase
    .from('gifts')
    .update({
      item: input.item,
      store: input.store,
      amount: input.amount,
      to_member: input.toMember,
      currency: input.currency ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Gift
}

export async function deleteGift(id: string): Promise<void> {
  const { error } = await supabase.from('gifts').delete().eq('id', id)
  if (error) throw error
}
