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
- Event cards loaded through the catalog service boundary.
- Event detail modal.
- Multi-participant demo registration flow.
- Story/category filtering.
- Explicit DEMO labels for simulated registration, live, tickets, email, WhatsApp, and profile flows.
- Demo catalog repository and Supabase catalog adapter.

Still demo / not production:

- Authentication and account creation.
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

Migration draft: `supabase/migrations/20260911000100_foundation.sql`.

Do not run it against production. Before staging:

1. Create a new Supabase staging project.
2. Review `docs/sql-audit.md`.
3. Confirm organizer provisioning strategy.
4. Confirm event media storage strategy.
5. Run the migration only from a local Supabase CLI or approved CI path against staging.
6. Seed only non-secret test data.
7. Verify RLS with anon and authenticated test users before adding auth/order/payment work.

## Original Files

The original source files are intentionally kept in place:

- `ngahiji.html`
- `snippet.txt`
- `ngahiji_001_foundation.sql`
- `ngahihji-catalog.ts`

This workspace was not a Git repository during setup, so files were copied into final paths instead of moved with `git mv`.
