-- ============================================================================
-- Mista Concierge Travel — per-occupancy pricing + payment terms
-- Adds structured pricing (occupancy tiers + children) and configurable payment
-- terms to tours, a booking breakdown column, and a global default payment block.
-- Amounts are stored in integer cents (GYD × 100), matching price_cents.
-- No new RLS: tours / site_content / booking_requests already carry table-level
-- admin + public-read policies that cover new columns.
-- ============================================================================

-- Per-tour structured pricing (occupancy tiers + children) and optional payment
-- override. pricing is null => tour uses the flat price_cents; payment_terms is
-- null => tour inherits the global default in site_content.
alter table public.tours
  add column if not exists pricing       jsonb,
  add column if not exists payment_terms jsonb;

-- Capture the occupancy/children/deposit breakdown alongside total_cents.
alter table public.booking_requests
  add column if not exists pricing_breakdown jsonb;

-- Seed a global default payment-terms block (admin-editable placeholders).
insert into public.site_content (key, value) values
  ('payment_terms', '{"deposit_cents":10000000,"deposit_per":"person","deadline":null,"final_note":"From the day after the deadline, final payment in full.","methods":["Cash","MMG","Bank Deposit"]}'::jsonb)
on conflict (key) do nothing;
