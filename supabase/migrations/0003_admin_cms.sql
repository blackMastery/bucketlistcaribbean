-- ============================================================================
-- Mista Concierge Travel — admin CMS
-- Adds an is_admin role, an is_admin() helper, admin RLS policies across all
-- content + leads tables, and a public "media" Storage bucket for uploads.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Admin role + helper
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- SECURITY DEFINER so policies can call it without recursing into profiles RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- Admin full-access policies on catalog + marketing tables
-- (public read policies from 0001 remain; these add admin writes/reads)
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'destinations','activity_types','tours','tour_activities','tour_images',
    'tour_highlights','tour_itinerary','tour_inclusions','reviews',
    'testimonials','team_members','site_content'
  ]
  loop
    execute format(
      'create policy "Admin manage" on public.%I for all
         using (public.is_admin()) with check (public.is_admin());', t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Admin access to user-generated / leads tables
-- ----------------------------------------------------------------------------

-- booking_requests: admins read all + update status
create policy "Admin read bookings"   on public.booking_requests for select using (public.is_admin());
create policy "Admin update bookings" on public.booking_requests for update using (public.is_admin()) with check (public.is_admin());
create policy "Admin delete bookings" on public.booking_requests for delete using (public.is_admin());

-- contact_messages: admins read / update status / delete
create policy "Admin read messages"   on public.contact_messages for select using (public.is_admin());
create policy "Admin update messages" on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());
create policy "Admin delete messages" on public.contact_messages for delete using (public.is_admin());

-- newsletter_subscribers: admins read / delete
create policy "Admin read subscribers"   on public.newsletter_subscribers for select using (public.is_admin());
create policy "Admin delete subscribers" on public.newsletter_subscribers for delete using (public.is_admin());

-- profiles: admins read all + promote/demote (in addition to owner self-access)
create policy "Admin read profiles"   on public.profiles for select using (public.is_admin());
create policy "Admin update profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Storage: public "media" bucket for admin-uploaded images
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public read media" on storage.objects
  for select using (bucket_id = 'media');
create policy "Admin upload media" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());
create policy "Admin update media" on storage.objects
  for update using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
create policy "Admin delete media" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

-- ----------------------------------------------------------------------------
-- Promote your account to admin — run once, edit the email:
--
-- update public.profiles set is_admin = true
-- where id = (select id from auth.users where email = 'you@example.com');
-- ----------------------------------------------------------------------------
