-- ============================================================================
-- Per-traveler booking manifest: identity at checkout, passport details later
-- ============================================================================

-- ----------------------------------------------------------------------------
-- booking_travelers table
-- ----------------------------------------------------------------------------
create table if not exists public.booking_travelers (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references public.booking_requests(id) on delete cascade,
  position          int not null check (position >= 1),
  is_primary        boolean not null default false,
  user_id           uuid references auth.users(id) on delete set null,
  traveler_type     text not null check (traveler_type in ('adult', 'child')),
  child_tier_key    text,
  child_tier_label  text,
  full_name         text not null,
  date_of_birth     date not null,
  gender            text not null check (gender in ('male', 'female', 'unspecified')),
  passport_number   text,
  passport_expiry   date,
  nationality       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (booking_id, position)
);

create index if not exists booking_travelers_booking_id_idx
  on public.booking_travelers (booking_id);

alter table public.booking_travelers enable row level security;

drop policy if exists "Booking owners read travelers" on public.booking_travelers;
create policy "Booking owners read travelers" on public.booking_travelers
  for select using (
    exists (
      select 1 from public.booking_requests br
      where br.id = booking_id and br.user_id = auth.uid()
    )
  );

drop policy if exists "Admin read travelers" on public.booking_travelers;
create policy "Admin read travelers" on public.booking_travelers
  for select using (public.is_admin());

-- Writes go through security definer RPCs only.

-- ----------------------------------------------------------------------------
-- Helper: aggregate travelers as JSON for RPC responses
-- ----------------------------------------------------------------------------
create or replace function public.travelers_detail_for_booking(p_booking_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', bt.id,
        'position', bt.position,
        'is_primary', bt.is_primary,
        'traveler_type', bt.traveler_type,
        'child_tier_label', bt.child_tier_label,
        'full_name', bt.full_name,
        'date_of_birth', bt.date_of_birth,
        'gender', bt.gender,
        'passport_number', bt.passport_number,
        'passport_expiry', bt.passport_expiry,
        'nationality', bt.nationality,
        'passport_complete', (
          bt.passport_number is not null
          and bt.passport_expiry is not null
          and bt.nationality is not null
        )
      )
      order by bt.position
    ),
    '[]'::jsonb
  )
  from public.booking_travelers bt
  where bt.booking_id = p_booking_id;
$$;

-- ----------------------------------------------------------------------------
-- Atomic booking + travelers insert (auth and guest)
-- ----------------------------------------------------------------------------
create or replace function public.create_booking_with_travelers(
  p_tour_id uuid,
  p_user_id uuid,
  p_travel_date date,
  p_travelers_count integer,
  p_insurance boolean,
  p_total_cents integer,
  p_pricing_breakdown jsonb,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_special_requests text,
  p_travelers jsonb
)
returns table (id uuid, reference_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_booking_id uuid;
  new_reference text;
  traveler jsonb;
  pos int;
begin
  insert into public.booking_requests (
    tour_id,
    user_id,
    travel_date,
    travelers,
    insurance,
    total_cents,
    pricing_breakdown,
    contact_name,
    contact_email,
    contact_phone,
    special_requests
  )
  values (
    p_tour_id,
    p_user_id,
    p_travel_date,
    p_travelers_count,
    p_insurance,
    p_total_cents,
    p_pricing_breakdown,
    p_contact_name,
    p_contact_email,
    p_contact_phone,
    p_special_requests
  )
  returning booking_requests.id, booking_requests.reference_code
  into new_booking_id, new_reference;

  if p_travelers is not null and jsonb_array_length(p_travelers) > 0 then
    for traveler in select * from jsonb_array_elements(p_travelers)
    loop
      pos := (traveler ->> 'position')::int;
      insert into public.booking_travelers (
        booking_id,
        position,
        is_primary,
        user_id,
        traveler_type,
        child_tier_key,
        child_tier_label,
        full_name,
        date_of_birth,
        gender
      )
      values (
        new_booking_id,
        pos,
        coalesce((traveler ->> 'is_primary')::boolean, pos = 1),
        case when pos = 1 then p_user_id else null end,
        traveler ->> 'traveler_type',
        nullif(traveler ->> 'child_tier_key', ''),
        nullif(traveler ->> 'child_tier_label', ''),
        traveler ->> 'full_name',
        (traveler ->> 'date_of_birth')::date,
        traveler ->> 'gender'
      );
    end loop;
  end if;

  return query select new_booking_id, new_reference;
end;
$$;

revoke all on function public.create_booking_with_travelers(
  uuid, uuid, date, integer, boolean, integer, jsonb,
  text, text, text, text, jsonb
) from public;
grant execute on function public.create_booking_with_travelers(
  uuid, uuid, date, integer, boolean, integer, jsonb,
  text, text, text, text, jsonb
) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Update passport details for one traveler
-- ----------------------------------------------------------------------------
create or replace function public.update_traveler_passport(
  p_traveler_id uuid,
  p_passport_number text,
  p_passport_expiry date,
  p_nationality text,
  p_reference text default null,
  p_email text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  allowed boolean := false;
begin
  if uid is not null then
    select exists (
      select 1
      from public.booking_travelers bt
      join public.booking_requests br on br.id = bt.booking_id
      where bt.id = p_traveler_id
        and br.user_id = uid
        and br.status <> 'cancelled'
    ) into allowed;
  elsif p_reference is not null and p_email is not null then
    select exists (
      select 1
      from public.booking_travelers bt
      join public.booking_requests br on br.id = bt.booking_id
      where bt.id = p_traveler_id
        and upper(trim(br.reference_code)) = upper(trim(p_reference))
        and lower(trim(br.contact_email)) = lower(trim(p_email))
        and br.status <> 'cancelled'
    ) into allowed;
  end if;

  if not allowed then
    return false;
  end if;

  update public.booking_travelers
  set
    passport_number = trim(p_passport_number),
    passport_expiry = p_passport_expiry,
    nationality = trim(p_nationality),
    updated_at = now()
  where id = p_traveler_id;

  return found;
end;
$$;

revoke all on function public.update_traveler_passport(
  uuid, text, date, text, text, text
) from public;
grant execute on function public.update_traveler_passport(
  uuid, text, date, text, text, text
) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Extend claim_guest_bookings: link primary traveler to account
-- ----------------------------------------------------------------------------
create or replace function public.claim_guest_bookings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  claimed int;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into user_email from auth.users where id = uid;
  if user_email is null then
    return 0;
  end if;

  update public.booking_requests
  set user_id = uid
  where user_id is null
    and lower(trim(contact_email)) = lower(trim(user_email));

  get diagnostics claimed = row_count;

  update public.booking_travelers bt
  set user_id = uid
  from public.booking_requests br
  where bt.booking_id = br.id
    and br.user_id = uid
    and bt.is_primary = true
    and bt.user_id is null;

  return claimed;
end;
$$;

-- ----------------------------------------------------------------------------
-- Extend claim_booking_by_reference: link primary traveler to account
-- ----------------------------------------------------------------------------
create or replace function public.claim_booking_by_reference(p_reference text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  updated int;
begin
  if uid is null then
    return false;
  end if;

  select email into user_email from auth.users where id = uid;
  if user_email is null then
    return false;
  end if;

  update public.booking_requests
  set user_id = uid
  where user_id is null
    and upper(trim(reference_code)) = upper(trim(p_reference))
    and lower(trim(contact_email)) = lower(trim(user_email));

  get diagnostics updated = row_count;

  if updated > 0 then
    update public.booking_travelers bt
    set user_id = uid
    from public.booking_requests br
    where bt.booking_id = br.id
      and br.user_id = uid
      and bt.is_primary = true
      and bt.user_id is null;
  end if;

  return updated > 0;
end;
$$;

-- ----------------------------------------------------------------------------
-- Extend get_booking_status with travelers_detail
-- (DROP required — return type adds id + travelers_detail columns)
-- ----------------------------------------------------------------------------
drop function if exists public.get_booking_status(text, text);

create function public.get_booking_status(
  p_reference text,
  p_email text
)
returns table (
  id uuid,
  reference_code text,
  tour_title text,
  tour_slug text,
  travel_date date,
  travelers integer,
  total_cents integer,
  status text,
  pricing_breakdown jsonb,
  travelers_detail jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    br.id,
    br.reference_code,
    t.title as tour_title,
    t.slug as tour_slug,
    br.travel_date,
    br.travelers,
    br.total_cents,
    br.status,
    br.pricing_breakdown,
    public.travelers_detail_for_booking(br.id) as travelers_detail,
    br.created_at
  from public.booking_requests br
  join public.tours t on t.id = br.tour_id
  where upper(trim(br.reference_code)) = upper(trim(p_reference))
    and lower(trim(br.contact_email)) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.get_booking_status(text, text) from public;
grant execute on function public.get_booking_status(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Extend get_own_booking_by_reference with travelers_detail
-- (DROP required — return type adds travelers_detail column)
-- ----------------------------------------------------------------------------
drop function if exists public.get_own_booking_by_reference(text);

create function public.get_own_booking_by_reference(p_reference text)
returns table (
  id uuid,
  reference_code text,
  tour_id uuid,
  tour_title text,
  tour_slug text,
  travel_date date,
  travelers integer,
  insurance boolean,
  total_cents integer,
  status text,
  pricing_breakdown jsonb,
  special_requests text,
  contact_name text,
  contact_email text,
  contact_phone text,
  travelers_detail jsonb,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    br.id,
    br.reference_code,
    br.tour_id,
    t.title as tour_title,
    t.slug as tour_slug,
    br.travel_date,
    br.travelers,
    br.insurance,
    br.total_cents,
    br.status,
    br.pricing_breakdown,
    br.special_requests,
    br.contact_name,
    br.contact_email,
    br.contact_phone,
    public.travelers_detail_for_booking(br.id) as travelers_detail,
    br.created_at
  from public.booking_requests br
  join public.tours t on t.id = br.tour_id
  where br.user_id = auth.uid()
    and upper(trim(br.reference_code)) = upper(trim(p_reference))
  limit 1;
$$;

revoke all on function public.get_own_booking_by_reference(text) from public;
grant execute on function public.get_own_booking_by_reference(text) to authenticated;
