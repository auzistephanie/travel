import { supabase } from './supabaseClient'
import type { WishlistItem } from '../types/models'

export async function listWishlistItems(tripId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase.from('wishlist_items').select().eq('trip_id', tripId)
  if (error) throw error
  return (data ?? []) as WishlistItem[]
}

export interface AddWishlistItemInput {
  tripId: string
  name: string
  photoUrl: string | null
  toMember: string | null
  linkedDayId: string | null
  buyAt: string | null
  priceLo: number | null
  priceHi: number | null
  tip: string | null
}

export async function addWishlistItem(input: AddWishlistItemInput): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      trip_id: input.tripId,
      name: input.name,
      photo_url: input.photoUrl,
      to_member: input.toMember,
      linked_day_id: input.linkedDayId,
      buy_at: input.buyAt,
      price_lo: input.priceLo,
      price_hi: input.priceHi,
      tip: input.tip,
      bought: false,
      synced_to_gift: false,
    })
    .select()
    .single()

  if (error) throw error
  return data as WishlistItem
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const { error } = await supabase.from('wishlist_items').delete().eq('id', id)
  if (error) throw error
}
