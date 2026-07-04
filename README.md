# Mista Concierge Travel

Luxury Caribbean travel-concierge website. **Next.js 15 (App Router) · Tailwind CSS v4 · Framer Motion · Supabase (Postgres + Auth)**.

Rebuilt pixel-for-pixel from the Claude Design prototypes in [`project/`](project/) (kept as the design source of truth — not shipped to production). All display content is database-driven; travelers can sign up to save favorite tours and track booking requests.

## Stack

| Layer    | Choice |
| -------- | ------ |
| Framework | Next.js 15, App Router, TypeScript |
| Styling  | Tailwind CSS v4 (design tokens in [`app/globals.css`](app/globals.css)) |
| Motion   | Framer Motion (reveals, drawer, accordion, lightbox, toast) |
| Fonts    | Playfair Display (headings), Montserrat (UI), Inter (body) via `next/font` |
| Backend  | Supabase Postgres, Auth, Row Level Security |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

Without Supabase env vars the app still builds and runs — data-driven sections render empty (fail-safe) so you can develop the UI before wiring the database.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com) and copy the Project URL + anon key into `.env.local`.
2. Apply the migrations in [`supabase/migrations`](supabase/migrations) — either paste them into the **SQL Editor** in order, or with the CLI:

   ```bash
   supabase link --project-ref <your-ref>
   supabase db push        # runs 0001_init.sql then 0002_seed.sql
   ```

3. (Optional) Regenerate typed bindings to replace the hand-maintained [`lib/database.types.ts`](lib/database.types.ts):

   ```bash
   supabase gen types typescript --linked > lib/database.types.ts
   ```

`0001_init.sql` creates the schema, RLS policies, and a trigger that auto-creates a `profiles` row on signup. `0002_seed.sql` loads the prototype content (6 destinations, 12 tours, full detail for the flagship St. Lucia tour, testimonials, team, and brand micro-content) so the site matches the mockups on first run.

## Admin CMS

A full content-management dashboard lives at **`/admin`** (its own chrome, separate from the marketing site).

**Enable it:**
1. Apply `supabase/migrations/0003_admin_cms.sql` (SQL Editor or `supabase db push`). It adds an `is_admin` flag + `is_admin()` function, admin RLS policies across all content + leads tables, and a public `media` Storage bucket for uploads.
2. Promote your account (run once, edit the email — snippet is at the bottom of the migration):
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Sign in at `/login` — an **Admin** link appears in the header, and `/admin` is now reachable.

**What you can do:** full CRUD on tours (incl. gallery images uploaded to Storage, highlights, itinerary, inclusions, activity tags), destinations, testimonials, and team; moderate reviews (publish/unpublish/delete); edit the `site_content` brand blocks (banner, hero stats, pillars, values, certs, footer links); manage **email templates** (edit system templates, create custom ones, preview, test send, view send log); and work the leads inbox — booking requests (status + resend emails), contact messages (read/archive/delete), and newsletter subscribers (CSV export). Edits revalidate the affected public pages so they show immediately.

**Email templates:** apply `supabase/migrations/0011_email_templates.sql` to create `email_templates` and `email_log` tables with seeded booking emails. Configure `RESEND_API_KEY` and `BOOKING_FROM_EMAIL` for live delivery; without Resend, sends are recorded as `logged` in the admin send log. Set `SUPABASE_SERVICE_ROLE_KEY` (server-only) so transactional emails can read templates and write the send log from public checkout — this key is never exposed to the browser.

**Security:** admin UI writes go through the signed-in admin's session. `requireAdmin()` / `requirePageAccess()` ([lib/admin.ts](lib/admin.ts)) gate every admin page and action, and RLS enforces it at the database. The service-role key is used only in server-only email modules ([`lib/supabase/admin.ts`](lib/supabase/admin.ts), [`lib/email/send.ts`](lib/email/send.ts)) — never in client code. Non-admins hitting `/admin` are redirected (`/` if signed in, `/login` if not).

## Data model

- **Catalog** — `destinations`, `tours`, `activity_types` (+ `tour_activities` join), `tour_images`, `tour_highlights`, `tour_itinerary`, `tour_inclusions`, `reviews`
- **Marketing** — `testimonials`, `team_members`, `site_content` (jsonb brand blocks: hero stats, pillars, values, certs, promo banner, footer links)
- **User data** — `profiles`, `favorites`, `booking_requests`, `contact_messages`, `newsletter_subscribers`
- **Email** — `email_templates`, `email_log`

RLS: catalog + marketing are public-read; `profiles`/`favorites`/`booking_requests` are owner-scoped; `contact_messages`/`newsletter_subscribers` are insert-only for anonymous visitors. Catalog writes are service-role only.

## Project layout

```
app/
  (site)/            # marketing chrome (Header + Footer) layout group
    page.tsx         # Home
    tours/           # listing (ToursClient filters) + [slug] detail
    destinations/  about/  contact/
    login/  signup/  account/
  auth/callback/     # email-confirmation code exchange
  actions.ts         # server actions: favorites, newsletter, contact, booking
components/          # Header, Footer, TourCard, ContactForm, AuthForm, tour/* islands
lib/
  supabase/{client,server,middleware}.ts
  queries.ts         # typed read helpers (fail-safe)
  database.types.ts  # hand-maintained DB types
middleware.ts        # refreshes the Supabase session + guards /account
supabase/migrations/ # 0001_init.sql, 0002_seed.sql
project/             # original design prototypes (reference only)
```

## Notes

- Bookings are **requests** — a concierge follows up within 24h (no payment integration), matching the prototype behavior.
- Auth uses Supabase email/password; if email confirmation is enabled in your project, signups land on a "check your email" state and the link routes through `/auth/callback`.
