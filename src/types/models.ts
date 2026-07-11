// 對應 supabase/schema.sql 嘅資料表結構

export interface Trip {
  id: string
  name: string
  start_date: string
  end_date: string
  share_code: string
  destination_country: string | null
  created_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  name: string
  color: string | null
  is_owner: boolean
  // optional：舊 fixture/test 唔需要跟住補呢個新欄位
  auth_user_id?: string | null
}

export interface Flight {
  id: string
  trip_id: string
  code: string
  from_airport: string
  to_airport: string
  from_time: string
  to_time: string
  date: string
  gate: string | null
  terminal: string | null
  seat: string | null
  pnr: string | null
  baggage_kg: number | null
  member_id: string | null
}

export interface ItineraryDay {
  id: string
  trip_id: string
  date: string
  order_index: number
}

export interface ItineraryStop {
  id: string
  day_id: string
  time: string | null
  title: string
  place_name: string | null
  lat: number | null
  lng: number | null
  order_index: number
  transport_mode_to_next: string | null
  icon: string | null
}

export interface PackingItem {
  id: string
  trip_id: string
  category: string
  name: string
  checked: boolean
  auto_qty: boolean
}

export interface WishlistItem {
  id: string
  trip_id: string
  name: string
  photo_url: string | null
  buy_at: string | null
  price_lo: number | null
  price_hi: number | null
  tip: string | null
  linked_day_id: string | null
  to_member: string | null
  bought: boolean
  actual_store: string | null
  actual_amt: number | null
  synced_to_gift: boolean
}

export type ExpenseCategory = '交通' | '住宿' | '餐飲' | '門票' | '購物' | '其他'

export interface Expense {
  id: string
  trip_id: string
  title: string
  amount: number
  currency: string
  payer_id: string | null
  split_member_ids: string[]
  day_id: string | null
  category: ExpenseCategory
  is_trip_base: boolean
}

export type GiftSource = 'manual' | 'wishlist' | 'ocr'

export interface Gift {
  id: string
  trip_id: string
  item: string
  store: string | null
  amount: number | null
  to_member: string
  source: GiftSource
}

export type ThemeId = 'cartography' | 'neon' | 'scrapbook' | 'indigo'

export interface Settings {
  trip_id: string
  exchange_rates: Record<string, number>
  theme: ThemeId
  custom_accent_color: string | null
}
