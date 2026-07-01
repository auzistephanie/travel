-- 旅行規劃 App — 資料庫結構（TRAVEL_APP_BUILD_SPEC.md 第 9 節）
-- 喺 Supabase SQL Editor 貼晒呢個檔案執行一次即可。

create extension if not exists pgcrypto;

-- ============ trips ============
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  share_code text not null unique,
  created_at timestamptz not null default now()
);

-- ============ trip_members ============
create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  color text,
  is_owner boolean not null default false
);

-- ============ flights ============
create table flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  code text not null,
  from_airport text not null,
  to_airport text not null,
  from_time timestamptz not null,
  to_time timestamptz not null,
  date date not null,
  gate text,
  terminal text,
  seat text,
  pnr text,
  baggage_kg numeric,
  member_id uuid references trip_members(id) on delete set null
);

-- ============ itinerary_days ============
create table itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  date date not null,
  order_index integer not null default 0
);

-- ============ itinerary_stops ============
create table itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references itinerary_days(id) on delete cascade,
  time time,
  title text not null,
  place_name text,
  lat double precision,
  lng double precision,
  order_index integer not null default 0,
  transport_mode_to_next text,
  icon text
);

-- ============ packing_items ============
create table packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  category text not null,
  name text not null,
  checked boolean not null default false,
  auto_qty boolean not null default false
);

-- ============ wishlist_items ============
create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  photo_url text,
  buy_at text,
  price_lo numeric,
  price_hi numeric,
  tip text,
  linked_day_id uuid references itinerary_days(id) on delete set null,
  to_member text,
  bought boolean not null default false,
  actual_store text,
  actual_amt numeric,
  synced_to_gift boolean not null default false
);

-- ============ expenses ============
create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null,
  amount numeric not null,
  currency text not null,
  payer_id uuid references trip_members(id) on delete set null,
  split_member_ids uuid[] not null default '{}',
  day_id uuid references itinerary_days(id) on delete set null,
  category text not null,
  is_trip_base boolean not null default false
);

-- ============ gifts ============
create table gifts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  item text not null,
  store text,
  amount numeric,
  to_member text not null,
  source text not null default 'manual' check (source in ('manual', 'wishlist', 'ocr'))
);

-- ============ settings ============
create table settings (
  trip_id uuid primary key references trips(id) on delete cascade,
  exchange_rates jsonb not null default '{}',
  theme text not null default 'cartography',
  custom_accent_color text
);

-- ============ RLS ============
-- 呢個 app 冇帳號登入，用「分享碼」做存取控制（知碼即可讀寫）。
-- Supabase 要求開咗 RLS 先俾 anon key 存取，所以每張表都開放式放行，
-- 實際嘅存取邊界喺前端只俾用戶操作自己揀嘅 trip_id / share_code。
-- 呢個係 MVP 階段嘅已知限制，唔係嚴謹嘅多租戶隔離。
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table flights enable row level security;
alter table itinerary_days enable row level security;
alter table itinerary_stops enable row level security;
alter table packing_items enable row level security;
alter table wishlist_items enable row level security;
alter table expenses enable row level security;
alter table gifts enable row level security;
alter table settings enable row level security;

create policy "public access" on trips for all using (true) with check (true);
create policy "public access" on trip_members for all using (true) with check (true);
create policy "public access" on flights for all using (true) with check (true);
create policy "public access" on itinerary_days for all using (true) with check (true);
create policy "public access" on itinerary_stops for all using (true) with check (true);
create policy "public access" on packing_items for all using (true) with check (true);
create policy "public access" on wishlist_items for all using (true) with check (true);
create policy "public access" on expenses for all using (true) with check (true);
create policy "public access" on gifts for all using (true) with check (true);
create policy "public access" on settings for all using (true) with check (true);
