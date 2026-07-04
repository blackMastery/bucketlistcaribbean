-- ============================================================================
-- Booking enhancements: reference codes, special requests, guest lookup RPC,
-- admin notes (Phase 2).
-- ============================================================================

alter table public.booking_requests
  add column if not exists reference_code text,
  add column if not exists special_requests text,
  add column if not exists admin_notes text;

-- Backfill reference codes for existing rows
update public.booking_requests
set reference_code = 'MC-' || upper(substr(replace(id::text, '-', ''), 1, 6))
where reference_code is null;

-- Ensure uniqueness for backfilled codes (extremely unlikely collision)
do $$
declare
  r record;
  suffix int;
  new_code text;
begin
  for r in
    select id from public.booking_requests br1
    where exists (
      select 1 from public.booking_requests br2
      where br2.reference_code = br1.reference_code and br2.id <> br1.id
    )
  loop
    suffix := 1;
    loop
      new_code := 'MC-' || upper(substr(replace(r.id::text, '-', ''), 1, 4)) || suffix::text;
      exit when not exists (
        select 1 from public.booking_requests where reference_code = new_code
      );
      suffix := suffix + 1;
    end loop;
    update public.booking_requests set reference_code = new_code where id = r.id;
  end loop;
end $$;

alter table public.booking_requests
  alter column reference_code set not null;

create unique index if not exists booking_requests_reference_code_idx
  on public.booking_requests (reference_code);

-- Auto-assign reference_code on insert when not provided
create or replace function public.set_booking_reference_code()
returns trigger
language plpgsql
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.reference_code is not null and new.reference_code <> '' then
    return new;
  end if;

  loop
    candidate := 'MC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (
      select 1 from public.booking_requests where reference_code = candidate
    );
    attempts := attempts + 1;
    if attempts > 20 then
      candidate := 'MC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      exit;
    end if;
  end loop;

  new.reference_code := candidate;
  return new;
end;
$$;

drop trigger if exists booking_requests_set_reference on public.booking_requests;
create trigger booking_requests_set_reference
  before insert on public.booking_requests
  for each row
  execute function public.set_booking_reference_code();

-- Guest lookup: reference + email must match (case-insensitive email)
create or replace function public.get_booking_status(
  p_reference text,
  p_email text
)
returns table (
  reference_code text,
  tour_title text,
  tour_slug text,
  travel_date date,
  travelers integer,
  total_cents integer,
  status text,
  pricing_breakdown jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    br.reference_code,
    t.title as tour_title,
    t.slug as tour_slug,
    br.travel_date,
    br.travelers,
    br.total_cents,
    br.status,
    br.pricing_breakdown,
    br.created_at
  from public.booking_requests br
  join public.tours t on t.id = br.tour_id
  where upper(trim(br.reference_code)) = upper(trim(p_reference))
    and lower(trim(br.contact_email)) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.get_booking_status(text, text) from public;
grant execute on function public.get_booking_status(text, text) to anon, authenticated;
