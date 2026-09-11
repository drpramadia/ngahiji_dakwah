# Ngahiji

Ngahiji is a Next.js App Router foundation for the Ngahiji Dakwah Organizer event, media, community, and registration experience.

The visual source of truth remains `ngahiji.html`. The React app keeps the same public sections and interaction model while moving catalog data behind a service/repository boundary.

## Local Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

Copy `.env.example` to `.env.local` for local work. Do not commit `.env.local`.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

`NEXT_PUBLIC_DEMO_MODE=true` is required for local demo data. Production mode must set `NEXT_PUBLIC_DEMO_MODE=false` and provide Supabase URL + anon key. Production catalog errors are surfaced; the app does not silently fallback to demo data.

Never expose a Supabase service-role key in frontend code.

## Current Features

Working now:

- Next.js App Router + TypeScript app shell.
- Public Ngahiji homepage sections from the prototype: hero, events, live, media, community, moments, organizer CTA, closing, footer, and mobile dock.
- Public `Masuk`, `Join Ngahiji`, and mobile `Profile` entry points are active through Supabase Auth and `/profile`.
- Event cards loaded through the catalog service boundary.
- Event detail modal.
- Multi-participant ticket simulation flow with payment gateway simulation and ticket/QR preview.
- Story/category filtering.
- Demo catalog repository and Supabase catalog adapter.

Still demo / not production:

- Orders and payment.
- Official ticket issuance.
- QR validation and check-in.
- Email and WhatsApp delivery.
- Media CMS, live streaming, organizer CMS, analytics, sponsor workflows.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Supabase Staging Migration

Migrations:

- `supabase/migrations/20260911000100_foundation.sql`
- `supabase/migrations/20260911000200_content_foundation.sql`
- `supabase/migrations/20260911000300_rbac_roles.sql`
- `supabase/migrations/20260911000400_super_admin_role.sql`

Initial content seed:

- `supabase/seed/initial_content.sql`

Do not run it against production. Before staging:

1. Create a new Supabase staging project.
2. Review `docs/sql-audit.md`.
3. Confirm organizer provisioning strategy.
4. Confirm event media storage strategy.
5. Run migrations only from a local Supabase CLI or approved CI path against staging.
6. Seed only non-secret initial content.
7. Verify RLS with anon and authenticated test users before adding auth/order/payment work.

Current CLI workflow uses the project-local CLI:

```bash
npx supabase migration list
npx supabase db push --linked --dry-run
npx supabase db push --linked --skip-vault
npx supabase db query --linked --file supabase/seed/initial_content.sql
```

Never use `supabase db reset` against the linked remote project.

## Admin / CMS Foundation

Routes:

- `/admin/login` - Supabase Auth magic-link login.
- `/auth/callback` - exchanges Supabase auth code for a session cookie.
- `/admin` - server-side protected dashboard.
- `/admin/events`, `/admin/tickets`, `/admin/orders`, `/admin/attendees`, `/admin/check-in`, `/admin/media`, `/admin/live`, `/admin/community`, `/admin/sponsors`, `/admin/analytics`, `/admin/settings` - protected CMS module entry points.

Access requires Supabase Auth plus a matching row in `public.organizer_members`. See `docs/admin-bootstrap.md` for the server-side bootstrap SQL template.

Current admin metrics read real database counts for events, ticket types, media items, and communities. Orders, revenue, check-ins, and conversion rate are explicitly marked as not configured until their production schemas exist.

## Event CMS

`/admin/events` is now a real protected Event CMS surface backed by Supabase `events` and `ticket_types`.

Current capabilities:

- list events from Supabase
- create event
- edit event
- update the primary ticket type
- publish
- unpublish to `DRAFT`
- archive

Publishing remains protected by Supabase RLS and `private.guard_event()`. `SUPER_ADMIN` now works as an elevated organizer role through `private.has_role()`.

Not active yet:

- gallery uploads
- speakers
- schedules
- FAQs
- sponsors
- promo codes
- transaction-safe ticket inventory
- orders/payment/ticket issuance

## Media CMS

`/admin/media` is now a real protected Media CMS surface backed by Supabase `media_items`.

Current capabilities:

- list media items from Supabase
- create media item
- edit media item
- publish
- unpublish to `DRAFT`
- archive
- manage title, slug, category, format, excerpt, body, image URL, reading time, publish date, and SEO fields

Publishing remains protected by Supabase RLS. `SUPER_ADMIN`, `ADMIN`, and `EDITOR` can manage media/community content through the content CMS policies.

Not active yet:

- Supabase Storage uploads
- media asset metadata table
- dynamic `/media/[slug]` public route
- author management
- rich text editor

## Community CMS

`/admin/community` is now a real protected Community CMS surface backed by Supabase `communities`.

Current capabilities:

- list communities from Supabase
- create community
- edit community
- publish
- unpublish to `DRAFT`
- archive
- manage name, slug, visual mark, color, description, and sort order

Published communities are read by the existing public Community section through the content service. The public section design remains unchanged.

Not active yet:

- community posts
- community membership
- community moderation
- member-only content

## Dynamic Public Routes

Supabase-backed public detail routes are available without creating per-event or per-media TSX files:

- `/events/[slug]` renders published event records through the catalog service.
- `/media/[slug]` renders published media records through the content service.

Admin preview links for Event CMS and Media CMS now point to these slug routes.

## Storage / Asset Foundation

Supabase Storage buckets are prepared by `supabase/migrations/20260911000600_storage_asset_foundation.sql`:

- `public-assets`
- `event-assets`
- `media-assets`
- `sponsor-assets`
- `speaker-assets`

Asset metadata is tracked in `public.media_assets`. URL resolution is centralized in `src/lib/assets.ts` through `getAssetUrl()` and `resolveMedia()`.

No local files have been deleted or uploaded to Storage yet. Existing images remain preserved until a dedicated asset migration step moves them safely.

## Image Content Replacement

Generic lifestyle/concert/dinner imagery has been replaced with individually addressable Islamic/dakwah/community themed local assets under `public/assets/ngahiji/`.

Asset groups:

- `hero/`
- `events/`
- `live/`
- `media/`
- `community/`

Image metadata lives in `src/data/assets/ngahiji-assets.ts`, and CMS metadata is seeded through `supabase/seed/image_assets.sql` into `public.media_assets`. Event and media records now point to local asset paths in their `image_url` fields.

The UI consumes image references through the existing asset resolver (`resolveMedia()` / `getAssetUrl()`), so future Supabase Storage or CMS-selected replacements do not require changing component layout.

See `docs/image-asset-inventory.md` for the image inventory and mapping.

## Ticketing Foundation

`supabase/migrations/20260911000700_ticketing_foundation.sql` creates the production foundation for:

- `registrations`
- `attendees`
- `orders`
- `order_items`
- `payment_transactions`
- `tickets`
- `check_ins`
- `consents`

Admin read-only routes now exist for:

- `/admin/orders`
- `/admin/attendees`
- `/admin/tickets`
- `/admin/check-in`

These pages read real Supabase tables and show empty states when no records exist. They do not create fake orders, fake payments, fake tickets, fake QR tokens, or fake check-ins.

Ticket activation is guarded in the database and mirrored in `src/lib/ticketing/state.ts`: tickets can only become `ACTIVE` after payment is `PAID` and attendee verification is `VERIFIED`.

Not active yet:

- public registration writes
- payment provider checkout
- webhook verification
- official ticket issuance UI
- raw QR token generation/delivery
- scanner endpoint
- wallet/download actions

## Integration / Payment Status

`/admin/settings` reports environment and provider readiness without displaying secret values.

Payment gateway is intentionally not active yet. The payment provider foundation in `src/lib/payments/providers.ts` checks Midtrans/Xendit configuration and blocks payment intent creation instead of simulating success.

Current status:

- no fake payment success
- no frontend-trusted payment confirmation
- no webhook endpoint until provider secrets and signature verification are implemented
- no production checkout activation without Midtrans/Xendit configuration

Public ticket/payment UI remains explicitly marked as simulation until provider configuration, server-side payment verification, official ticket issuance, and QR validation are implemented.

## Original Files

The original source files are intentionally kept in place:

- `ngahiji.html`
- `snippet.txt`
- `ngahiji_001_foundation.sql`
- `ngahihji-catalog.ts`

This workspace was not a Git repository during setup, so files were copied into final paths instead of moved with `git mv`.
