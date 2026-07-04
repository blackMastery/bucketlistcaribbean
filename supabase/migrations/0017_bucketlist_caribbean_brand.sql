-- Rename bucketlist brand to "Bucketlist Caribbean" — Guyanese Caribbean travel company
update public.sites
set name = 'Bucketlist Caribbean'
where slug = 'bucketlist';

update public.site_content
set value = value
  || jsonb_build_object(
    'tagline', 'Guyana''s trusted Caribbean travel company — curated tours, all-inclusive getaways, and island journeys across the region.',
    'copyright', '© 2026 Bucketlist Caribbean. All rights reserved.'
  )
where site_id = 'a0000000-0000-4000-8000-000000000002'
  and key = 'footer';

update public.site_content
set value = jsonb_set(value, '{headline}', '"Why Choose Bucketlist Caribbean"'::jsonb)
where site_id = 'a0000000-0000-4000-8000-000000000002'
  and key = 'home_why_choose';

update public.site_content
set value = value
  || jsonb_build_object(
    'headline', 'Your Caribbean escape starts here',
    'description', 'A Guyanese travel company specializing in Caribbean tours and vacations — curated getaways, all-inclusive packages, and island journeys across the region.'
  )
where site_id = 'a0000000-0000-4000-8000-000000000002'
  and key = 'home_hero';

insert into public.site_content (site_id, key, value) values
(
  'a0000000-0000-4000-8000-000000000002',
  'seo',
  '{
    "name": "Bucketlist Caribbean",
    "short_name": "Bucketlist",
    "description": "Bucketlist Caribbean is a Guyanese travel company specializing in Caribbean tours and vacations — helping travelers across Guyana and the region plan unforgettable island getaways.",
    "default_title": "Bucketlist Caribbean — Guyanese Caribbean Travel Company",
    "title_template": "%s · Bucketlist Caribbean",
    "locale": "en_US",
    "keywords": ["Guyanese travel agency", "Caribbean travel company", "travel agency Guyana", "Caribbean tours", "Guyana Caribbean vacation", "all inclusive Caribbean", "Punta Cana tours", "island getaways"]
  }'::jsonb
)
on conflict (site_id, key) do update set value = excluded.value;
