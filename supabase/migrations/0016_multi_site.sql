-- ============================================================================
-- Multi-site support — site_content scoped per site; all other data shared.
-- ============================================================================

create table public.sites (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  domain     text not null,
  created_at timestamptz not null default now()
);

-- Stable IDs so app env SITE_ID=mista|bucketlist maps predictably.
insert into public.sites (id, slug, name, domain) values
  ('a0000000-0000-4000-8000-000000000001', 'mista', 'Mista Concierge Travel', 'https://www.mistaconciergetravel.com'),
  ('a0000000-0000-4000-8000-000000000002', 'bucketlist', 'Bucketlist Vacation', 'https://www.bucketlistcaribbean.com');

-- Scope existing site_content rows to mista.
alter table public.site_content
  add column site_id uuid references public.sites (id);

update public.site_content
set site_id = 'a0000000-0000-4000-8000-000000000001'
where site_id is null;

alter table public.site_content
  alter column site_id set not null;

alter table public.site_content drop constraint site_content_pkey;
alter table public.site_content add primary key (site_id, key);

-- Seed bucketlist messaging (copy mista values; admin can customize later).
insert into public.site_content (site_id, key, value)
select
  'a0000000-0000-4000-8000-000000000002',
  key,
  case
    when key = 'footer' then jsonb_set(
      value,
      '{copyright}',
      '"© 2026 Bucketlist Vacation. All rights reserved."'::jsonb
    )
    when key = 'home_why_choose' then jsonb_set(
      jsonb_set(value, '{eyebrow}', '"The Bucketlist Difference"'::jsonb),
      '{headline}',
      '"Why Choose Bucketlist Vacation"'::jsonb
    )
    else value
  end
from public.site_content
where site_id = 'a0000000-0000-4000-8000-000000000001'
on conflict (site_id, key) do nothing;
