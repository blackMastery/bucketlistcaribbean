-- ============================================================================
-- Account features: profile extensions, booking messages, referrals, user reviews
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extend profiles
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone text,
  add column if not exists travel_preferences jsonb,
  add column if not exists referral_code text unique;

-- Backfill referral codes for existing profiles
update public.profiles
set referral_code = 'REF-' || upper(substr(replace(id::text, '-', ''), 1, 6))
where referral_code is null;

-- Ensure uniqueness after backfill (extremely unlikely collision)
do $$
declare
  r record;
  suffix int;
  new_code text;
begin
  for r in
    select id from public.profiles p1
    where exists (
      select 1 from public.profiles p2
      where p2.referral_code = p1.referral_code and p2.id <> p1.id
    )
  loop
    suffix := 1;
    loop
      new_code := 'REF-' || upper(substr(replace(r.id::text, '-', ''), 1, 4)) || suffix::text;
      exit when not exists (select 1 from public.profiles where referral_code = new_code);
      suffix := suffix + 1;
    end loop;
    update public.profiles set referral_code = new_code where id = r.id;
  end loop;
end $$;

alter table public.profiles
  alter column referral_code set not null;

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    candidate := 'REF-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
    attempts := attempts + 1;
    if attempts > 20 then
      candidate := 'REF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      exit;
    end if;
  end loop;
  return candidate;
end;
$$;

-- Extend handle_new_user to assign referral_code and record referrals
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_referral_code text;
  incoming_ref text;
  referrer uuid;
begin
  new_referral_code := public.generate_referral_code();

  insert into public.profiles (id, full_name, referral_code)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new_referral_code
  );

  incoming_ref := new.raw_user_meta_data ->> 'referral_code';
  if incoming_ref is not null and incoming_ref <> '' then
    select p.id into referrer
    from public.profiles p
    where p.referral_code = incoming_ref
    limit 1;

    if referrer is not null and referrer <> new.id then
      insert into public.referrals (referrer_id, referred_user_id, referred_email, status)
      values (referrer, new.id, new.email, 'signed_up')
      on conflict (referred_user_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Extend reviews for user submissions
-- ----------------------------------------------------------------------------
alter table public.reviews
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists booking_id uuid references public.booking_requests (id) on delete set null;

create unique index if not exists reviews_user_tour_unique_idx
  on public.reviews (user_id, tour_id)
  where user_id is not null;

-- Users may insert their own reviews (moderated via is_published)
create policy "Users insert own reviews" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "Users read own reviews" on public.reviews
  for select using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Booking messages
-- ----------------------------------------------------------------------------
create table if not exists public.booking_messages (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.booking_requests (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);

create index if not exists booking_messages_booking_id_idx
  on public.booking_messages (booking_id);

alter table public.booking_messages enable row level security;

create policy "Users read own booking messages" on public.booking_messages
  for select using (
    exists (
      select 1 from public.booking_requests br
      where br.id = booking_id and br.user_id = auth.uid()
    )
  );

create policy "Users insert own booking messages" on public.booking_messages
  for insert with check (
    sender_role = 'user'
    and auth.uid() = user_id
    and exists (
      select 1 from public.booking_requests br
      where br.id = booking_id and br.user_id = auth.uid()
    )
  );

create policy "Admin read booking messages" on public.booking_messages
  for select using (public.is_admin());

create policy "Admin insert booking messages" on public.booking_messages
  for insert with check (
    sender_role = 'admin'
    and public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- Referrals
-- ----------------------------------------------------------------------------
create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_id       uuid not null references auth.users (id) on delete cascade,
  referred_user_id  uuid not null unique references auth.users (id) on delete cascade,
  referred_email    text not null,
  status            text not null default 'signed_up' check (status in ('signed_up')),
  created_at        timestamptz not null default now()
);

create index if not exists referrals_referrer_id_idx
  on public.referrals (referrer_id);

alter table public.referrals enable row level security;

create policy "Users read own referrals" on public.referrals
  for select using (auth.uid() = referrer_id);

-- ----------------------------------------------------------------------------
-- RPCs
-- ----------------------------------------------------------------------------

-- Claim all guest bookings matching the authenticated user's auth email
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
  return claimed;
end;
$$;

revoke all on function public.claim_guest_bookings() from public;
grant execute on function public.claim_guest_bookings() to authenticated;

-- Claim a single booking by reference if email matches auth user
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
  return updated > 0;
end;
$$;

revoke all on function public.claim_booking_by_reference(text) from public;
grant execute on function public.claim_booking_by_reference(text) to authenticated;

-- Fetch owned booking detail by reference (excludes admin_notes)
create or replace function public.get_own_booking_by_reference(p_reference text)
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
    br.created_at
  from public.booking_requests br
  join public.tours t on t.id = br.tour_id
  where br.user_id = auth.uid()
    and upper(trim(br.reference_code)) = upper(trim(p_reference))
  limit 1;
$$;

revoke all on function public.get_own_booking_by_reference(text) from public;
grant execute on function public.get_own_booking_by_reference(text) to authenticated;
