-- ============================================================================
-- Traveler fields: first_name, last_name, phone; passport at checkout
-- ============================================================================

alter table public.booking_travelers
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text;

-- Backfill from full_name when present
update public.booking_travelers
set
  first_name = coalesce(
    nullif(trim(first_name), ''),
    split_part(trim(full_name), ' ', 1)
  ),
  last_name = coalesce(
    nullif(trim(last_name), ''),
    coalesce(
      nullif(trim(substring(trim(full_name) from position(' ' in trim(full_name)) + 1)), ''),
      ''
    )
  )
where full_name is not null;

update public.booking_travelers
set last_name = coalesce(last_name, '')
where last_name is null;

alter table public.booking_travelers
  alter column first_name set not null,
  alter column last_name set not null;

alter table public.booking_travelers
  drop column if exists full_name;

-- ----------------------------------------------------------------------------
-- travelers_detail_for_booking — new JSON shape
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
        'first_name', bt.first_name,
        'last_name', bt.last_name,
        'phone', bt.phone,
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
-- create_booking_with_travelers — insert new traveler fields
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
        first_name,
        last_name,
        phone,
        passport_number,
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
        traveler ->> 'first_name',
        coalesce(traveler ->> 'last_name', ''),
        traveler ->> 'phone',
        nullif(trim(traveler ->> 'passport_number'), ''),
        (traveler ->> 'date_of_birth')::date,
        traveler ->> 'gender'
      );
    end loop;
  end if;

  return query select new_booking_id, new_reference;
end;
$$;

-- ----------------------------------------------------------------------------
-- update_traveler_passport — expiry + nationality only (passport at checkout)
-- ----------------------------------------------------------------------------
drop function if exists public.update_traveler_passport(uuid, text, date, text, text, text);

create function public.update_traveler_passport(
  p_traveler_id uuid,
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
    passport_expiry = p_passport_expiry,
    nationality = trim(p_nationality),
    updated_at = now()
  where id = p_traveler_id;

  return found;
end;
$$;

revoke all on function public.update_traveler_passport(
  uuid, date, text, text, text
) from public;
grant execute on function public.update_traveler_passport(
  uuid, date, text, text, text
) to anon, authenticated;
