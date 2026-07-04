-- Add publish/draft status for tours (reviews already use is_published).
alter table public.tours
  add column if not exists is_published boolean not null default true;

create index if not exists tours_is_published_idx on public.tours (is_published);

-- Public visitors only see published tours; admins still see all via 0003 policy.
drop policy if exists "Public read" on public.tours;
create policy "Public read" on public.tours
  for select using (is_published = true);
