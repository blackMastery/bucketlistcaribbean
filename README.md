# Bucketlist Vacation · Caribbean

Public frontend for the Bucketlist Vacation brand. **Next.js 15 · Tailwind CSS v4 · Supabase**. Shares one database and catalog with [mista-concierge-travel-design](../mista-concierge-travel-design); only `site_content` (brand messaging) is scoped per site. **Admin lives on the Mista app** at `/admin`.

## Getting started

```bash
npm install
cp .env.example .env.local   # same Supabase URL/keys as Mista + SITE_ID=bucketlist
npm run dev                  # http://localhost:3001 (use a different port from Mista)
```

## Environment

| Variable | Purpose |
| -------- | ------- |
| `SITE_ID` | Must be `bucketlist` — selects this site's `site_content` rows |
| `NEXT_PUBLIC_SUPABASE_*` | Same Supabase project as Mista (shared tours, bookings, etc.) |
| `REVALIDATION_SECRET` | Must match Mista — allows cache busting after admin edits |
| `MISTA_ADMIN_URL` | Base URL of the Mista app (admin booking links in emails) |

Apply migration `0016_multi_site.sql` on the shared Supabase project before deploying.

## Data model

- **Shared with Mista** — tours, destinations, testimonials, team, bookings, messages, subscribers, FAQs, email templates
- **Per-site (`site_content`)** — hero copy, footer, contact info, page headings (filtered by `SITE_ID`)

## Project layout

```
app/
  (site)/            # marketing site (no /admin)
  api/revalidate/    # cache bust endpoint (called by Mista admin)
lib/site.ts          # site registry + SITE_ID resolution
```

Content is managed in the **Mista admin** at `/admin/content` — use the site switcher to edit Bucketlist messaging.

## Notes

- Bookings are **requests** — a concierge follows up within 24h (no payment integration).
- Auth uses Supabase email/password shared across both frontends.
