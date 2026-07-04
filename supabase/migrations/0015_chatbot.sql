-- ============================================================================
-- Customer-service chatbot: FAQ knowledge base, conversation log, tour search
-- RPC, and FAQ usage counter RPC.
--
-- The chatbot API runs under the anon key only (no service-role dependency):
-- FAQs are public-read, conversation logging is insert-open (like
-- contact_messages), and the two RPCs are security definer granted to anon.
-- ============================================================================

-- Trigram matching for fuzzy tour search (idempotent; supported on Supabase).
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.faq_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.faq_categories(id) on delete set null,
  -- unique so re-running the seed below is a no-op
  question    text not null unique,
  answer      text not null,
  keywords    text[] not null default '{}',
  usage_count integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();

create table if not exists public.chatbot_conversations (
  id               uuid primary key default gen_random_uuid(),
  session_id       text not null,
  user_message     text not null,
  bot_response     text not null,
  matched_faq_id   uuid references public.faqs(id) on delete set null,
  confidence_score numeric,
  was_helpful      boolean,
  created_at       timestamptz not null default now()
);

create index if not exists chatbot_conversations_created_idx
  on public.chatbot_conversations (created_at desc);
create index if not exists chatbot_conversations_session_idx
  on public.chatbot_conversations (session_id);

-- ----------------------------------------------------------------------------
-- Row level security
-- ----------------------------------------------------------------------------

alter table public.faq_categories        enable row level security;
alter table public.faqs                  enable row level security;
alter table public.chatbot_conversations enable row level security;

create policy "Public read" on public.faq_categories for select using (true);
create policy "Public read" on public.faqs           for select using (is_active);

create policy "Admin manage" on public.faq_categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage" on public.faqs
  for all using (public.is_admin()) with check (public.is_admin());

-- Visitors (anon) may log conversations but never read them back;
-- admins can review the log.
create policy "Anyone can log chat" on public.chatbot_conversations
  for insert with check (true);
create policy "Admin read chat logs" on public.chatbot_conversations
  for select using (public.is_admin());
create policy "Admin delete chat logs" on public.chatbot_conversations
  for delete using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Fuzzy tour search for chatbot context. Short fields (title, location,
-- destination name) are matched as needles inside the visitor's message;
-- the message is matched as a needle inside the overview. No trigram index —
-- the catalogue is dozens of rows, a seq scan is fine.
-- ----------------------------------------------------------------------------

create or replace function public.search_tours(q text, max_rows integer default 5)
returns table (
  title text,
  slug text,
  location text,
  price_cents integer,
  duration_label text,
  overview_snippet text,
  score real
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.title,
    t.slug,
    t.location,
    t.price_cents,
    t.duration_label,
    left(coalesce(t.overview, ''), 280) as overview_snippet,
    greatest(
      word_similarity(t.title, q),
      word_similarity(coalesce(t.location, ''), q),
      word_similarity(coalesce(d.name, ''), q),
      word_similarity(q, left(coalesce(t.overview, ''), 600))
    ) as score
  from public.tours t
  left join public.destinations d on d.id = t.destination_id
  where t.is_published
  order by score desc, t.is_featured desc, t.sort_order
  limit greatest(1, least(max_rows, 10));
$$;

revoke all on function public.search_tours(text, integer) from public;
grant execute on function public.search_tours(text, integer) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- FAQ usage counter. Definer so the anon-key chatbot can bump it despite faqs
-- being read-only under RLS. An anon-callable counter is an accepted abuse
-- surface: the worst case is a skewed popularity number.
-- ----------------------------------------------------------------------------

create or replace function public.increment_faq_usage(p_faq_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.faqs
  set usage_count = usage_count + 1
  where id = p_faq_id and is_active;
$$;

revoke all on function public.increment_faq_usage(uuid) from public;
grant execute on function public.increment_faq_usage(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Seeds (idempotent via unique name/question)
-- ----------------------------------------------------------------------------

insert into public.faq_categories (name, sort_order) values
  ('Booking', 1),
  ('Payments', 2),
  ('Travel Prep', 3),
  ('General', 4)
on conflict (name) do nothing;

insert into public.faqs (category_id, question, answer, keywords) values
  (
    (select id from public.faq_categories where name = 'Booking'),
    'How do I book a tour?',
    'Browse our tours at /tours, pick your travel date and number of travelers, and submit a booking request. Our concierge team confirms availability within 24 hours and sends you a booking reference (MC-XXXXXX) you can use to track everything at /bookings/track.',
    '{book,booking,reserve,reservation,request,start}'
  ),
  (
    (select id from public.faq_categories where name = 'Payments'),
    'What payment methods do you accept, and do I need to pay a deposit?',
    'A deposit secures your booking and the balance is due before travel — the exact split is shown on each tour''s payment terms before you confirm. We accept bank transfer and major cards, and all prices are quoted in Guyanese dollars (GYD).',
    '{pay,payment,deposit,card,transfer,bank,gyd,price,cost,installment}'
  ),
  (
    (select id from public.faq_categories where name = 'Booking'),
    'Can I cancel or reschedule my booking?',
    'Yes — contact our concierge team as soon as possible with your booking reference and we''ll walk you through the options. Flexibility depends on each tour''s payment terms, and deposits may be non-refundable close to the departure date.',
    '{cancel,cancellation,refund,reschedule,change,postpone}'
  ),
  (
    (select id from public.faq_categories where name = 'Booking'),
    'What is included in the tour price?',
    'Every tour page lists its inclusions — typically your dedicated guide, ground transport, and the meals and experiences shown in the itinerary. International flights are not included unless a tour explicitly says otherwise.',
    '{included,include,inclusions,meals,transport,flights,guide,cover}'
  ),
  (
    (select id from public.faq_categories where name = 'Booking'),
    'Do you offer private or group tours?',
    'Both. Our tours are priced by occupancy, so you can travel as a couple, family, or group — and our concierge team can craft fully private, custom itineraries. Reach out via the contact page and tell us how you like to travel.',
    '{private,group,size,people,family,custom,couples,solo}'
  ),
  (
    (select id from public.faq_categories where name = 'Travel Prep'),
    'Do I need a passport or visa to travel?',
    'You''ll need a valid passport for international travel — we recommend at least six months of validity beyond your return date. Visa requirements depend on your nationality and destination; our concierge team will flag anything you need after you book, when we collect each traveler''s passport details.',
    '{passport,visa,documents,identification,requirements,expiry}'
  ),
  (
    (select id from public.faq_categories where name = 'General'),
    'What are your office hours and where are you located?',
    'Our current hours of operation and office address are on the contact page at /contact — and you can reach the concierge team on WhatsApp any time.',
    '{hours,open,office,location,address,visit,find}'
  ),
  (
    (select id from public.faq_categories where name = 'General'),
    'How can I contact your team?',
    'The fastest way is WhatsApp — the chat link is at the top of this window and on our contact page at /contact, alongside our phone number and email. We respond within 24 hours.',
    '{contact,whatsapp,phone,email,reach,talk,speak,human,agent}'
  ),
  (
    (select id from public.faq_categories where name = 'Travel Prep'),
    'What should I pack for a Caribbean tour?',
    'Light breathable clothing, swimwear, reef-safe sunscreen, insect repellent, and comfortable walking shoes cover most journeys. Anything tour-specific — hiking gear, formal dinner wear — is called out on that tour''s itinerary page.',
    '{pack,packing,bring,wear,clothes,shoes,sunscreen,luggage}'
  ),
  (
    (select id from public.faq_categories where name = 'Travel Prep'),
    'When is the best time to visit the Caribbean?',
    'December through April is the dry-season peak: sunny days and calm seas. Shoulder months (May–June, November) are quieter with better availability. Each destination page lists its own best season, since the islands vary.',
    '{weather,season,rain,best,time,visit,when,hurricane,month}'
  )
on conflict (question) do nothing;
