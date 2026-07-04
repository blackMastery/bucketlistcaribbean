-- ============================================================================
-- Mista Concierge Travel — admin access management + page-level permissions
-- Introduces admin_users (role + active flag) and admin_user_pages (per-section
-- grants) as the single source of truth for admin access, repoints is_admin()
-- to read it, seeds the existing owner, and adds a service-role-only make_admin
-- RPC for promoting/creating admins.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists public.admin_users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null,
  role       text not null default 'admin' check (role in ('admin', 'super_admin')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_user_pages (
  admin_user_id uuid not null references public.admin_users (id) on delete cascade,
  page_key      text not null,
  primary key (admin_user_id, page_key)
);

create index if not exists admin_user_pages_admin_user_id_idx
  on public.admin_user_pages (admin_user_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- Authenticated users may read ONLY their own admin row + their own grants.
-- All management writes go through the service-role key (bypasses RLS).
-- ----------------------------------------------------------------------------
alter table public.admin_users      enable row level security;
alter table public.admin_user_pages enable row level security;

create policy "Read own admin row" on public.admin_users
  for select using (id = auth.uid());

create policy "Read own admin grants" on public.admin_user_pages
  for select using (admin_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Repoint is_admin() at admin_users (every content/leads policy from 0003 calls
-- this helper, so they all start honouring the new source of truth). The old
-- profiles.is_admin column + its policies are left in place but are now unused.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.id = auth.uid()
      and a.is_active
  );
$$;

-- ----------------------------------------------------------------------------
-- Seed: migrate current admins (profiles.is_admin = true) to super_admin so the
-- existing owner is never locked out.
-- ----------------------------------------------------------------------------
insert into public.admin_users (id, email, full_name, role, is_active)
select
  p.id,
  coalesce(u.email, ''),
  coalesce(nullif(trim(p.full_name), ''), u.email, 'Admin'),
  'super_admin',
  true
from public.profiles p
join auth.users u on u.id = p.id
where p.is_admin
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- make_admin: promote (or create the admin row for) an existing auth user by
-- email. SECURITY DEFINER + service-role-only so it can read auth.users.
-- ----------------------------------------------------------------------------
create or replace function public.make_admin(
  p_email     text,
  p_full_name text default null,
  p_role      text default 'admin'
)
returns public.admin_users
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  auth.users;
  v_admin public.admin_users;
begin
  if p_role not in ('admin', 'super_admin') then
    raise exception 'Invalid role: %', p_role;
  end if;

  select * into v_user
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_user.id is null then
    raise exception 'No auth user found for email %', p_email;
  end if;

  insert into public.admin_users as a (id, email, full_name, role, is_active)
  values (
    v_user.id,
    v_user.email,
    coalesce(nullif(trim(p_full_name), ''), v_user.email, 'Admin'),
    p_role,
    true
  )
  on conflict (id) do update
    set full_name  = coalesce(nullif(trim(p_full_name), ''), a.full_name),
        role       = excluded.role,
        is_active  = true,
        updated_at = now()
  returning a.* into v_admin;

  return v_admin;
end;
$$;

revoke all on function public.make_admin(text, text, text) from public, anon, authenticated;
grant execute on function public.make_admin(text, text, text) to service_role;

-- ----------------------------------------------------------------------------
-- revoke_admin: soft-deactivate an admin by email (service-role-only).
-- ----------------------------------------------------------------------------
create or replace function public.revoke_admin(p_email text)
returns public.admin_users
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin public.admin_users;
begin
  update public.admin_users a
    set is_active = false,
        updated_at = now()
  from auth.users u
  where u.id = a.id
    and lower(u.email) = lower(trim(p_email))
  returning a.* into v_admin;

  return v_admin;
end;
$$;

revoke all on function public.revoke_admin(text) from public, anon, authenticated;
grant execute on function public.revoke_admin(text) to service_role;

-- ----------------------------------------------------------------------------
-- Bootstrap (run once if no admin exists yet — edit the email):
--
-- select public.make_admin('you@example.com', 'Your Name', 'super_admin');
-- ----------------------------------------------------------------------------
