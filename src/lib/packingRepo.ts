import { supabase } from './supabaseClient'
import { autoClothingQuantities } from './autoClothing'
import type { PackingItem } from '../types/models'

export async function listPackingItems(tripId: string): Promise<PackingItem[]> {
  const { data, error } = await supabase.from('packing_items').select().eq('trip_id', tripId)
  if (error) throw error
  return (data ?? []) as PackingItem[]
}

interface SeedItem {
  category: string
  name: string
  autoQty: boolean
}

const DEFAULT_ITEMS: SeedItem[] = [
  { category: '證件', name: '護照', autoQty: false },
  { category: '證件', name: '八達通/當地交通卡', autoQty: false },
  { category: '電子', name: '充電器', autoQty: false },
  { category: '電子', name: '尿袋（外置電池）', autoQty: false },
  { category: '電子', name: '轉插頭', autoQty: false },
  { category: '藥物', name: '常用藥物', autoQty: false },
]

function buildSeedItems(dayCount: number): SeedItem[] {
  const clothing = autoClothingQuantities(dayCount).map((c) => ({
    category: '衣物',
    name: `${c.name} x${c.qty}`,
    autoQty: true,
  }))
  return [...DEFAULT_ITEMS, ...clothing]
}

async function insertPackingItem(tripId: string, item: SeedItem): Promise<PackingItem> {
  const { data, error } = await supabase
    .from('packing_items')
    .insert({ trip_id: tripId, category: item.category, name: item.name, checked: false, auto_qty: item.autoQty })
    .select()
    .single()

  if (error) throw error
  return data as PackingItem
}

export async function ensurePackingItems(tripId: string, dayCount: number): Promise<PackingItem[]> {
  const existing = await listPackingItems(tripId)
  if (existing.length > 0) return existing

  const seeds = buildSeedItems(dayCount)
  return Promise.all(seeds.map((item) => insertPackingItem(tripId, item)))
}

export async function togglePackingItem(id: string, checked: boolean): Promise<PackingItem> {
  const { data, error } = await supabase.from('packing_items').update({ checked }).eq('id', id).select().single()
  if (error) throw error
  return data as PackingItem
}
