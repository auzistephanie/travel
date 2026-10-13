-- 鎖死公開 RLS（2026-10-13）
--
-- 現有 Supabase project 跑呢個檔一次。全新 project 只要跑 supabase/schema.sql，唔使再跑呢度。
-- 可以重跑：舊 policy 會先 drop，function 用 create or replace。
--
-- 跑 SQL 之前，先喺 Dashboard 做（唔使停機）：
--   1. Authentication → Sign In / Providers → Anonymous Sign-Ins → Enable
--      唔好開 CAPTCHA（Authentication → Bot and Abuse Protection）。
--      開咗 captcha 嘅話，朋友開分享連結會失敗，因為個 app 冇 captcha widget。
--   2. Google provider 維持啟用（只有行程擁有人用嚟跨裝置認人同徹底刪除）。
--
-- 跑完 SQL 之後立刻部署新版前端。中間會有一段短時間讀寫失敗：
--   舊前端唔識 claim 分享碼；新前端又要呢批 function 先讀到資料。
--
-- 點解唔係再做「知個 anon key 就讀晒所有行程」：
--   朋友仍然唔使註冊。瀏覽器會靜靜建立 Supabase anonymous session，
--   再用分享碼呼叫 claim_trip_by_share_code，先寫入 trip_access。
--   RLS 只放行呢個 session 已經 claim 咗嘅行程。
--   trip_members 仍然係「邊個旅伴」；trip_access 先係「邊個瀏覽器 session 有權」。
--   已用 Google 綁定嘅 owner（trip_members.auth_user_id）唔使再 claim 都讀到自己嘅行程。
--   徹底刪除仍然只限已綁 Google、而且唔係 anonymous 嘅 owner。
--
-- SQL Editor 用 postgres role，會繞過 RLS，所以喺 Dashboard 仍然睇到全部行。
-- 瀏覽器嘅 anon key 唔會。

create table if not exists public.trip_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, trip_id)
);

create index if not exists trip_access_trip_id_idx on public.trip_access(trip_id);

comment on table public.trip_access is
  '證明咗自己知分享碼嘅 auth session（anonymous 或 Google）。唔係旅伴名單。';

alter table public.trip_access enable row level security;

-- 客戶端唔准自己 insert grant，只可以經下面兩條 security definer function。
revoke all on table public.trip_access from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_anonymous_session()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'is_anonymous', '') in ('true', 't')
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'anonymous';
$$;

create or replace function public.can_access_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      exists (
        select 1
        from public.trip_access a
        where a.trip_id = p_trip_id
          and a.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.trip_members m
        where m.trip_id = p_trip_id
          and m.auth_user_id = auth.uid()
      )
    );
$$;

create or replace function public.can_access_day(p_day_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.itinerary_days d
    where d.id = p_day_id
      and public.can_access_trip(d.trip_id)
  );
$$;

create or replace function public.can_access_storage_object(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_folder text;
begin
  v_folder := (storage.foldername(p_name))[1];
  if v_folder is null
     or v_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_access_trip(v_folder::uuid);
end;
$$;

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and not public.is_anonymous_session()
    and exists (
      select 1
      from public.trip_members m
      where m.trip_id = p_trip_id
        and m.is_owner
        and m.auth_user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- 分享碼 claim + 建立行程（插入當下仲未有 trip_access，所以要 definer）
-- 分享碼字母表同 src/lib/shareCode.ts 一致。
-- ---------------------------------------------------------------------------

create or replace function public.claim_trip_by_share_code(p_share_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trip_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  p_share_code := upper(trim(coalesce(p_share_code, '')));
  if p_share_code !~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' then
    return null;
  end if;

  select id into v_trip_id
  from public.trips
  where share_code = p_share_code;

  if v_trip_id is null then
    return null;
  end if;

  insert into public.trip_access (user_id, trip_id)
  values (v_uid, v_trip_id)
  on conflict (user_id, trip_id) do nothing;

  return v_trip_id;
end;
$$;

create or replace function public.create_trip(
  p_name text,
  p_start_date date,
  p_end_date date,
  p_owner_name text,
  p_destination_country text,
  p_share_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trip public.trips;
  v_owner public.trip_members;
  v_destination text;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  p_name := trim(coalesce(p_name, ''));
  p_owner_name := trim(coalesce(p_owner_name, ''));
  if char_length(p_name) < 1 or char_length(p_name) > 200 then
    raise exception 'invalid trip name' using errcode = '22023';
  end if;
  if char_length(p_owner_name) < 1 or char_length(p_owner_name) > 80 then
    raise exception 'invalid owner name' using errcode = '22023';
  end if;

  p_share_code := upper(trim(coalesce(p_share_code, '')));
  if p_share_code !~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' then
    raise exception 'invalid share code' using errcode = '22023';
  end if;

  v_destination := nullif(trim(coalesce(p_destination_country, '')), '');
  if v_destination is not null and char_length(v_destination) > 64 then
    raise exception 'invalid destination' using errcode = '22023';
  end if;

  insert into public.trips (name, start_date, end_date, share_code, destination_country)
  values (p_name, p_start_date, p_end_date, p_share_code, v_destination)
  returning * into v_trip;

  -- 客戶端唔准自己 insert is_owner；呢度先臨時放行。
  perform set_config('app.bypass_member_guard', 'on', true);

  insert into public.trip_members (trip_id, name, is_owner)
  values (v_trip.id, p_owner_name, true)
  returning * into v_owner;

  insert into public.trip_access (user_id, trip_id)
  values (v_uid, v_trip.id);

  return jsonb_build_object('trip', to_jsonb(v_trip), 'owner', to_jsonb(v_owner));
end;
$$;

create or replace function public.trips_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.share_code is distinct from old.share_code then
    raise exception 'share code cannot be changed' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'cannot change trip id' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.trip_members_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('app.bypass_member_guard', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_owner then
      raise exception 'cannot insert owner via client' using errcode = '42501';
    end if;
    if new.auth_user_id is not null then
      raise exception 'cannot set auth user on insert' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.trip_id is distinct from old.trip_id then
    raise exception 'cannot move member' using errcode = '42501';
  end if;
  if new.is_owner is distinct from old.is_owner then
    raise exception 'cannot change owner flag' using errcode = '42501';
  end if;
  if new.auth_user_id is distinct from old.auth_user_id then
    if public.is_anonymous_session() then
      raise exception 'anonymous users cannot link an account' using errcode = '42501';
    end if;
    if new.auth_user_id is distinct from auth.uid() then
      raise exception 'cannot link another account' using errcode = '42501';
    end if;
    if old.auth_user_id is not null and old.auth_user_id is distinct from auth.uid() then
      raise exception 'member already linked' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trips_guard on public.trips;
create trigger trips_guard
  before update on public.trips
  for each row
  execute function public.trips_guard();

drop trigger if exists trip_members_guard on public.trip_members;
create trigger trip_members_guard
  before insert or update on public.trip_members
  for each row
  execute function public.trip_members_guard();

-- ---------------------------------------------------------------------------
-- Privileges。anon（未帶 user JWT）唔准讀寫；anonymous sign-in 之後 role 係 authenticated。
-- ---------------------------------------------------------------------------

revoke all on table public.trips from public, anon, authenticated;
revoke all on table public.trip_members from public, anon, authenticated;
revoke all on table public.flights from public, anon, authenticated;
revoke all on table public.itinerary_days from public, anon, authenticated;
revoke all on table public.itinerary_stops from public, anon, authenticated;
revoke all on table public.packing_items from public, anon, authenticated;
revoke all on table public.wishlist_items from public, anon, authenticated;
revoke all on table public.expenses from public, anon, authenticated;
revoke all on table public.gifts from public, anon, authenticated;
revoke all on table public.settings from public, anon, authenticated;

grant select, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_members to authenticated;
grant select, insert, update, delete on public.flights to authenticated;
grant select, insert, update, delete on public.itinerary_days to authenticated;
grant select, insert, update, delete on public.itinerary_stops to authenticated;
grant select, insert, update, delete on public.packing_items to authenticated;
grant select, insert, update, delete on public.wishlist_items to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.gifts to authenticated;
grant select, insert, update, delete on public.settings to authenticated;

revoke all on function public.is_anonymous_session() from public, anon, authenticated;
revoke all on function public.can_access_trip(uuid) from public, anon, authenticated;
revoke all on function public.can_access_day(uuid) from public, anon, authenticated;
revoke all on function public.can_access_storage_object(text) from public, anon, authenticated;
revoke all on function public.is_trip_owner(uuid) from public, anon, authenticated;
revoke all on function public.claim_trip_by_share_code(text) from public, anon, authenticated;
revoke all on function public.create_trip(text, date, date, text, text, text) from public, anon, authenticated;
revoke all on function public.trips_guard() from public, anon, authenticated;
revoke all on function public.trip_members_guard() from public, anon, authenticated;

grant execute on function public.is_anonymous_session() to authenticated;
grant execute on function public.can_access_trip(uuid) to authenticated;
grant execute on function public.can_access_day(uuid) to authenticated;
grant execute on function public.can_access_storage_object(text) to authenticated;
grant execute on function public.is_trip_owner(uuid) to authenticated;
grant execute on function public.claim_trip_by_share_code(text) to authenticated;
grant execute on function public.create_trip(text, date, date, text, text, text) to authenticated;
grant execute on function public.trips_guard() to authenticated;
grant execute on function public.trip_members_guard() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.flights enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_stops enable row level security;
alter table public.packing_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.expenses enable row level security;
alter table public.gifts enable row level security;
alter table public.settings enable row level security;

drop policy if exists "trips open select" on public.trips;
drop policy if exists "trips open insert" on public.trips;
drop policy if exists "trips open update" on public.trips;
drop policy if exists "trips owner delete" on public.trips;
drop policy if exists "share_select" on public.trips;
drop policy if exists "share_update" on public.trips;
drop policy if exists "share_owner_delete" on public.trips;

create policy "share_select" on public.trips
  for select to authenticated
  using (public.can_access_trip(id));

create policy "share_update" on public.trips
  for update to authenticated
  using (public.can_access_trip(id))
  with check (public.can_access_trip(id));

-- 冇 insert policy：建立行程只可以經 create_trip。
create policy "share_owner_delete" on public.trips
  for delete to authenticated
  using (public.is_trip_owner(id));

drop policy if exists "public access" on public.trip_members;
drop policy if exists "share_select" on public.trip_members;
drop policy if exists "share_insert" on public.trip_members;
drop policy if exists "share_update" on public.trip_members;
drop policy if exists "share_delete" on public.trip_members;

create policy "share_select" on public.trip_members
  for select to authenticated
  using (public.can_access_trip(trip_id));

create policy "share_insert" on public.trip_members
  for insert to authenticated
  with check (
    public.can_access_trip(trip_id)
    and is_owner = false
    and auth_user_id is null
  );

create policy "share_update" on public.trip_members
  for update to authenticated
  using (public.can_access_trip(trip_id))
  with check (public.can_access_trip(trip_id));

create policy "share_delete" on public.trip_members
  for delete to authenticated
  using (public.can_access_trip(trip_id) and is_owner = false);

do $$
declare
  t text;
begin
  foreach t in array array[
    'flights',
    'itinerary_days',
    'packing_items',
    'wishlist_items',
    'expenses',
    'gifts',
    'settings'
  ]
  loop
    execute format('drop policy if exists "public access" on public.%I', t);
    execute format('drop policy if exists "share_select" on public.%I', t);
    execute format('drop policy if exists "share_insert" on public.%I', t);
    execute format('drop policy if exists "share_update" on public.%I', t);
    execute format('drop policy if exists "share_delete" on public.%I', t);

    execute format(
      'create policy "share_select" on public.%I for select to authenticated using (public.can_access_trip(trip_id))',
      t
    );
    execute format(
      'create policy "share_insert" on public.%I for insert to authenticated with check (public.can_access_trip(trip_id))',
      t
    );
    execute format(
      'create policy "share_update" on public.%I for update to authenticated using (public.can_access_trip(trip_id)) with check (public.can_access_trip(trip_id))',
      t
    );
    execute format(
      'create policy "share_delete" on public.%I for delete to authenticated using (public.can_access_trip(trip_id))',
      t
    );
  end loop;
end $$;

drop policy if exists "public access" on public.itinerary_stops;
drop policy if exists "share_select" on public.itinerary_stops;
drop policy if exists "share_insert" on public.itinerary_stops;
drop policy if exists "share_update" on public.itinerary_stops;
drop policy if exists "share_delete" on public.itinerary_stops;

create policy "share_select" on public.itinerary_stops
  for select to authenticated
  using (public.can_access_day(day_id));

create policy "share_insert" on public.itinerary_stops
  for insert to authenticated
  with check (public.can_access_day(day_id));

create policy "share_update" on public.itinerary_stops
  for update to authenticated
  using (public.can_access_day(day_id))
  with check (public.can_access_day(day_id));

create policy "share_delete" on public.itinerary_stops
  for delete to authenticated
  using (public.can_access_day(day_id));

-- 相片 bucket 維持 public read（已儲存嘅 URL 繼續開到）。
-- 上傳／覆蓋／刪除必須係該 trip 嘅成員，路徑第一段係 trip uuid。
insert into storage.buckets (id, name, public)
values ('wishlist-photos', 'wishlist-photos', true)
on conflict (id) do nothing;

drop policy if exists "public access" on storage.objects;
drop policy if exists "share_insert" on storage.objects;
drop policy if exists "share_update" on storage.objects;
drop policy if exists "share_delete" on storage.objects;

create policy "share_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wishlist-photos'
    and public.can_access_storage_object(name)
  );

create policy "share_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'wishlist-photos'
    and public.can_access_storage_object(name)
  )
  with check (
    bucket_id = 'wishlist-photos'
    and public.can_access_storage_object(name)
  );

create policy "share_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wishlist-photos'
    and public.can_access_storage_object(name)
  );
