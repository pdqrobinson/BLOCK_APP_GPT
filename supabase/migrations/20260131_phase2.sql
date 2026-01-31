-- Phase 2 migration: profiles (ZIP), block claims, expiration rules, RLS updates

create extension if not exists pgcrypto;
create extension if not exists postgis;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users,
  zip_code text,
  zip_lat double precision,
  zip_lng double precision,
  updated_at timestamptz not null default now()
);

create table if not exists public.block_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  center geography(Point, 4326) not null,
  radius_miles numeric not null check (radius_miles >= 1 and radius_miles <= 3),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claim_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  action text not null check (action in ('create','update','deactivate')),
  created_at timestamptz not null default now()
);


create table if not exists public.user_presence (
  user_id uuid primary key references auth.users,
  geometry geography(Point, 4326) not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users,
  post_type text not null,
  item_kind text,
  geometry geography(Point, 4326) not null,
  content text not null,
  expires_at timestamptz not null,
  duration_minutes int not null,
  idempotency_key uuid not null,
  report_count int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  check (post_type in ('status','ask','activity','item')),
  check (item_kind in ('food','physical') or item_kind is null),
  check (post_type <> 'item' or item_kind is not null)
);

create index if not exists posts_geometry_gix on public.posts using gist (geometry);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists block_claims_center_gix on public.block_claims using gist (center);

create or replace function public.max_view_distance_m()
returns double precision
language sql
stable
as $$
  select 2000::double precision;
$$;

create or replace function public.latest_presence_geom()
returns geography
language sql
stable
as $$
  select geometry
  from public.user_presence
  where user_id = auth.uid();
$$;

create or replace function public.active_block_claim()
returns table(center geography, radius_miles numeric)
language sql
stable
as $$
  select center, radius_miles
  from public.block_claims
  where user_id = auth.uid() and active = true
  order by updated_at desc
  limit 1;
$$;

create or replace function public.has_active_block_claim()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.block_claims
    where user_id = auth.uid() and active = true
  );
$$;

create or replace function public.within_claim_radius(post_geom geography)
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1
      from public.block_claims c
      where c.user_id = auth.uid()
        and c.active = true
        and st_dwithin(c.center, post_geom, c.radius_miles * 1609.34)
    );
$$;

create or replace function public.within_presence_radius(post_geom geography)
returns boolean
language sql
stable
as $$
  select
    public.latest_presence_geom() is not null
    and st_dwithin(
      public.latest_presence_geom(),
      post_geom,
      1609.34
    );
$$;

create or replace function public.validate_claim_limits()
returns trigger
language plpgsql
as $$
declare
  active_count int;
  yearly_changes int;
begin
  select count(*) into active_count
  from public.block_claims
  where user_id = new.user_id and active = true;

  if (tg_op = 'INSERT' and active_count >= 3) then
    raise exception 'Maximum of 3 active block claims reached.';
  end if;

  select count(*) into yearly_changes
  from public.claim_changes
  where user_id = new.user_id
    and created_at >= (now() - interval '365 days');

  if (yearly_changes >= 3) then
    raise exception 'Yearly block claim change limit reached.';
  end if;

  return new;
end;
$$;

create or replace function public.log_claim_change()
returns trigger
language plpgsql
as $$
begin
  insert into public.claim_changes(user_id, action)
  values (new.user_id, lower(tg_op));
  return new;
end;
$$;

create trigger block_claims_validate
before insert or update on public.block_claims
for each row execute procedure public.validate_claim_limits();

create trigger block_claims_log
after insert or update on public.block_claims
for each row execute procedure public.log_claim_change();

create or replace function public.posts_in_bounds(
  sw_lng double precision,
  sw_lat double precision,
  ne_lng double precision,
  ne_lat double precision
) returns setof public.posts
language sql
stable
as $$
  select *
  from public.posts
  where st_intersects(
    geometry,
    st_makeenvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)::geography
  )
  order by created_at desc;
$$;

alter table public.posts enable row level security;
alter table public.block_claims enable row level security;
alter table public.claim_changes enable row level security;
alter table public.profiles enable row level security;
alter table public.user_presence enable row level security;

create policy profiles_select on public.profiles
for select
using (user_id = auth.uid());

create policy profiles_upsert on public.profiles
for insert
with check (user_id = auth.uid());

create policy profiles_update on public.profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy block_claims_select on public.block_claims
for select
using (user_id = auth.uid());

create policy block_claims_insert on public.block_claims
for insert
with check (user_id = auth.uid());

create policy block_claims_update on public.block_claims
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());


create policy user_presence_upsert on public.user_presence
for insert
with check (user_id = auth.uid());

create policy user_presence_update on public.user_presence
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy posts_select_visible on public.posts
for select
using (
  expires_at > now()
  and hidden = false
);

create policy posts_insert_rules on public.posts
for insert
with check (
  auth.uid() = user_id
  and idempotency_key is not null
  and expires_at > now()
  and (
    (public.has_active_block_claim() and public.within_claim_radius(geometry))
    or
    (not public.has_active_block_claim()
      and post_type in ('status','ask')
      and public.within_presence_radius(geometry)
      and duration_minutes = 60)
  )
  and (
    (post_type = 'status' and ((public.has_active_block_claim() and duration_minutes = 1440) or (not public.has_active_block_claim() and duration_minutes = 60)))
    or
    (post_type = 'ask' and duration_minutes between 60 and 10080)
    or
    (post_type = 'activity' and duration_minutes between 60 and 10080)
    or
    (post_type = 'item' and item_kind = 'food' and duration_minutes = 1440)
    or
    (post_type = 'item' and item_kind = 'physical' and duration_minutes between 1440 and 43200)
  )
);
