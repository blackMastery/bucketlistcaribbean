-- ============================================================================
-- Mista Concierge Travel — normalize tour pricing into tour_pricing table
-- Replaces tours.pricing jsonb with relational rows. Occupancy rows store a
-- flat price for that tier; child rows store per-child price_cents.
-- ============================================================================

create table public.tour_pricing (
  id          uuid primary key default gen_random_uuid(),
  tour_id     uuid not null references public.tours (id) on delete cascade,
  kind        text not null check (kind in ('occupancy', 'child')),
  occupants   integer,
  child_key   text,
  label       text not null,
  price_cents integer not null,
  position    integer not null default 0,
  constraint tour_pricing_occupancy_fields check (
    (kind = 'occupancy' and occupants is not null and child_key is null)
    or (kind = 'child' and child_key is not null and occupants is null)
  )
);

create index tour_pricing_tour_id_idx on public.tour_pricing (tour_id);

create unique index tour_pricing_occupancy_uniq
  on public.tour_pricing (tour_id, occupants)
  where kind = 'occupancy';

create unique index tour_pricing_child_uniq
  on public.tour_pricing (tour_id, child_key)
  where kind = 'child';

-- Backfill from tours.pricing jsonb
insert into public.tour_pricing (tour_id, kind, occupants, child_key, label, price_cents, position)
select
  t.id,
  'occupancy',
  (elem->>'occupants')::integer,
  null,
  elem->>'label',
  (coalesce(elem->>'price_cents', '0'))::integer,
  ord - 1
from public.tours t
cross join lateral jsonb_array_elements(t.pricing->'occupancy') with ordinality as arr(elem, ord)
where t.pricing is not null
  and jsonb_typeof(t.pricing->'occupancy') = 'array';

insert into public.tour_pricing (tour_id, kind, occupants, child_key, label, price_cents, position)
select
  t.id,
  'child',
  null,
  elem->>'key',
  elem->>'label',
  (coalesce(elem->>'price_cents', '0'))::integer,
  ord - 1
from public.tours t
cross join lateral jsonb_array_elements(t.pricing->'children') with ordinality as arr(elem, ord)
where t.pricing is not null
  and jsonb_typeof(t.pricing->'children') = 'array';

alter table public.tours drop column if exists pricing;

-- RLS
alter table public.tour_pricing enable row level security;

create policy "Public read" on public.tour_pricing
  for select using (true);

create policy "Admin manage" on public.tour_pricing
  for all using (public.is_admin()) with check (public.is_admin());
