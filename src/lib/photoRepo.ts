import { supabase } from './supabaseClient'

const BUCKET = 'wishlist-photos'

export async function uploadWishlistPhoto(tripId: string, file: File): Promise<string> {
  const path = `${tripId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
