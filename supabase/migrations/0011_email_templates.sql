-- ============================================================================
-- Mista Concierge Travel — email templates + send log
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Shared trigger helpers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.lock_created_by()
returns trigger
language plpgsql
as $$
begin
  if old.created_by is not null and new.created_by is distinct from old.created_by then
    new.created_by = old.created_by;
  end if;
  return new;
end;
$$;

create or replace function public.lock_email_template_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'email_templates.slug is immutable';
  end if;
  if new.is_system is distinct from old.is_system then
    raise exception 'email_templates.is_system is immutable';
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- email_templates
-- ----------------------------------------------------------------------------
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subject text not null,
  body_html text not null default '',
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  modified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_templates_is_active_idx on public.email_templates (is_active);

create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

create trigger email_templates_lock_created_by
  before update on public.email_templates
  for each row execute function public.lock_created_by();

create trigger email_templates_lock_immutable
  before update on public.email_templates
  for each row execute function public.lock_email_template_immutable();

alter table public.email_templates enable row level security;

create policy "Admin manage email_templates" on public.email_templates
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- email_log
-- ----------------------------------------------------------------------------
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  template_slug text,
  to_email text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed', 'logged')),
  provider_id text,
  error text,
  booking_id uuid references public.booking_requests(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index email_log_created_at_idx on public.email_log (created_at desc);
create index email_log_booking_id_idx on public.email_log (booking_id);

alter table public.email_log enable row level security;

create policy "Admin manage email_log" on public.email_log
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Seed system templates
-- ----------------------------------------------------------------------------
insert into public.email_templates (slug, name, subject, body_html, is_system) values
(
  'booking_confirmation',
  'Booking confirmation (traveler)',
  'Booking request {{booking_reference}} — {{tour_title}}',
  '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#1A2E28;">Request received</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3D524C;">
  Hi {{customer_name}}, thank you for your booking request. Your concierge will confirm availability and reach out within 24 hours.
</p>
<div style="background:#F7F3EA;border-radius:12px;padding:16px 20px;margin-bottom:20px;text-align:center;">
  <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#7A8A84;">Booking reference</div>
  <div style="font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#1B7A5C;margin-top:4px;">{{booking_reference}}</div>
</div>
{{booking_details}}
<p style="margin:0 0 20px;">
  <a href="{{track_url}}" style="display:inline-block;background:#1B7A5C;color:#F7F3EA;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;">Track your booking</a>
</p>
<p style="margin:20px 0 0;font-size:13px;color:#7A8A84;line-height:1.5;">
  Save your reference <strong>{{booking_reference}}</strong> — you''ll need it with your email to check status.
</p>',
  true
),
(
  'booking_confirmation_admin',
  'Booking confirmation (admin)',
  '[New booking] {{booking_reference}} — {{tour_title}}',
  '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#1A2E28;">New booking request</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3D524C;">
  A new concierge booking request needs follow-up.
</p>
{{booking_details}}
<p style="margin:0 0 8px;font-size:14px;color:#3D524C;"><strong>Guest:</strong> {{customer_name}}</p>
<p style="margin:0 0 8px;font-size:14px;color:#3D524C;"><strong>Email:</strong> {{contact_email}}</p>
<p style="margin:0 0 20px;font-size:14px;color:#3D524C;"><strong>Phone:</strong> {{contact_phone}}</p>
{{special_requests}}
<p style="margin:0;">
  <a href="{{admin_url}}" style="display:inline-block;background:#1B7A5C;color:#F7F3EA;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;">View in admin</a>
</p>',
  true
),
(
  'booking_confirmed',
  'Booking confirmed',
  'Booking confirmed — {{booking_reference}}',
  '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#1A2E28;">Booking confirmed</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3D524C;">
  Hi {{customer_name}}, great news — your concierge has confirmed your booking. They''ll be in touch with next steps for deposit and final payment.
</p>
{{booking_details}}
<p style="margin:0;">
  <a href="{{track_url}}" style="display:inline-block;background:#1B7A5C;color:#F7F3EA;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;">View booking status</a>
</p>',
  true
),
(
  'booking_cancelled',
  'Booking cancelled',
  'Booking cancelled — {{booking_reference}}',
  '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#1A2E28;">Booking cancelled</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3D524C;">
  Hi {{customer_name}}, your booking request has been cancelled. If you have questions or would like to rebook, please contact us.
</p>
{{booking_details}}
<p style="margin:0;">
  <a href="{{track_url}}" style="display:inline-block;background:#1B7A5C;color:#F7F3EA;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;">View booking status</a>
</p>',
  true
),
(
  'welcome',
  'Welcome email',
  'Welcome to {{site_name}}',
  '<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;color:#1A2E28;">Welcome!</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3D524C;">
  Hi {{customer_name}}, welcome to {{site_name}}. We''re delighted to help you plan your next Caribbean journey.
</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#3D524C;">
  Explore our tours at <a href="{{site_url}}" style="color:#1B7A5C;">{{site_url}}</a> or reply to this email with any questions.
</p>',
  true
)
on conflict (slug) do nothing;
