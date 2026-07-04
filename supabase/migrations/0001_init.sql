-- ============================================================================
-- Mista Concierge Travel — initial schema
-- Catalog (destinations, tours, …), marketing content, auth-backed user data.
-- Money is stored in integer cents. UUID PKs via gen_random_uuid().
-- ============================================================================

create extension if not exists citext;

-- ----------------------------------------------------------------------------
-- CATALOG
-- ----------------------------------------------------------------------------

create table public.destinations (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  tag           text not null,
  description   text not null,
  long_description text,
  hero_image_url text not null,
  is_featured   boolean not null default false,
  avg_temp      text,
  best_season   text,
  signature_tours integer not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create table public.activity_types (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  sort_order integer not null default 0
);

create table public.tours (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  destination_id  uuid not null references public.destinations (id) on delete restrict,
  location        text not null,
  price_cents     integer not null,
  rating          numeric(2, 1) not null default 4.9,
  reviews_count   integer not null default 0,
  duration_days   integer not null,
  duration_label  text not null,
  badge           text,
  badge_color     text not null default '#1B7A5C',
  card_image_url  text not null,
  overview        text,
  is_featured     boolean not null default false,
  spots_left      integer,
  booked_last_24h integer,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index tours_destination_id_idx on public.tours (destination_id);
create index tours_is_featured_idx on public.tours (is_featured);

create table public.tour_activities (
  tour_id          uuid not null references public.tours (id) on delete cascade,
  activity_type_id uuid not null references public.activity_types (id) on delete cascade,
  primary key (tour_id, activity_type_id)
);

create table public.tour_images (
  id          uuid primary key default gen_random_uuid(),
  tour_id     uuid not null references public.tours (id) on delete cascade,
  url         text not null,
  position    integer not null default 0,
  in_carousel boolean not null default true
);

create index tour_images_tour_id_idx on public.tour_images (tour_id);

create table public.tour_highlights (
  id       uuid primary key default gen_random_uuid(),
  tour_id  uuid not null references public.tours (id) on delete cascade,
  text     text not null,
  position integer not null default 0
);

create index tour_highlights_tour_id_idx on public.tour_highlights (tour_id);

create table public.tour_itinerary (
  id         uuid primary key default gen_random_uuid(),
  tour_id    uuid not null references public.tours (id) on delete cascade,
  day_number integer not null,
  title      text not null,
  body       text not null
);

create index tour_itinerary_tour_id_idx on public.tour_itinerary (tour_id);

create table public.tour_inclusions (
  id       uuid primary key default gen_random_uuid(),
  tour_id  uuid not null references public.tours (id) on delete cascade,
  kind     text not null check (kind in ('included', 'excluded')),
  text     text not null,
  position integer not null default 0
);

create index tour_inclusions_tour_id_idx on public.tour_inclusions (tour_id);

create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  tour_id      uuid not null references public.tours (id) on delete cascade,
  author_name  text not null,
  initials     text not null,
  rating       numeric(2, 1) not null default 5.0,
  body         text not null,
  review_date  text not null,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create index reviews_tour_id_idx on public.reviews (tour_id);

-- ----------------------------------------------------------------------------
-- MARKETING CONTENT
-- ----------------------------------------------------------------------------

create table public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  quote      text not null,
  initials   text not null,
  name       text not null,
  trip       text not null,
  rating     integer not null default 5,
  sort_order integer not null default 0
);

create table public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null,
  bio        text not null,
  photo_url  text not null,
  sort_order integer not null default 0
);

-- Small brand blocks kept editable without bespoke tables (hero stats, pillars,
-- About values, certifications, promo banner, footer links).
create table public.site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUTH-BACKED USER DATA
-- ----------------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  tour_id    uuid not null references public.tours (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tour_id)
);

create table public.booking_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete set null,
  tour_id       uuid not null references public.tours (id) on delete cascade,
  travel_date   date,
  travelers     integer not null default 1 check (travelers >= 1),
  insurance     boolean not null default false,
  total_cents   integer not null,
  status        text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  contact_name  text,
  contact_email text,
  contact_phone text,
  created_at    timestamptz not null default now()
);

create index booking_requests_user_id_idx on public.booking_requests (user_id);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  interest   text,
  message    text not null,
  status     text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      citext not null unique,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PROFILE AUTO-PROVISIONING
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- Public-read catalog + marketing tables. Writes are service-role only (no
-- policy granted to anon/authenticated, so only the service key bypasses RLS).
alter table public.destinations    enable row level security;
alter table public.activity_types  enable row level security;
alter table public.tours           enable row level security;
alter table public.tour_activities enable row level security;
alter table public.tour_images     enable row level security;
alter table public.tour_highlights enable row level security;
alter table public.tour_itinerary  enable row level security;
alter table public.tour_inclusions enable row level security;
alter table public.reviews         enable row level security;
alter table public.testimonials    enable row level security;
alter table public.team_members    enable row level security;
alter table public.site_content    enable row level security;

create policy "Public read" on public.destinations    for select using (true);
create policy "Public read" on public.activity_types  for select using (true);
create policy "Public read" on public.tours           for select using (true);
create policy "Public read" on public.tour_activities for select using (true);
create policy "Public read" on public.tour_images     for select using (true);
create policy "Public read" on public.tour_highlights for select using (true);
create policy "Public read" on public.tour_itinerary  for select using (true);
create policy "Public read" on public.tour_inclusions for select using (true);
create policy "Public read" on public.reviews         for select using (is_published);
create policy "Public read" on public.testimonials    for select using (true);
create policy "Public read" on public.team_members    for select using (true);
create policy "Public read" on public.site_content    for select using (true);

-- profiles: owner-scoped
alter table public.profiles enable row level security;
create policy "Read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- favorites: owner-scoped (all actions)
alter table public.favorites enable row level security;
create policy "Read own favorites"   on public.favorites for select using (auth.uid() = user_id);
create policy "Insert own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "Delete own favorites" on public.favorites for delete using (auth.uid() = user_id);

-- booking_requests: anyone may create a request; owners read their own history
alter table public.booking_requests enable row level security;
create policy "Anyone can request" on public.booking_requests
  for insert with check (user_id is null or auth.uid() = user_id);
create policy "Read own requests" on public.booking_requests
  for select using (auth.uid() = user_id);

-- contact_messages & newsletter: insert-open, no public read
alter table public.contact_messages enable row level security;
create policy "Anyone can contact" on public.contact_messages for insert with check (true);

alter table public.newsletter_subscribers enable row level security;
create policy "Anyone can subscribe" on public.newsletter_subscribers for insert with check (true);
