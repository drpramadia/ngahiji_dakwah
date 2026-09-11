# NGAHIJI Content Inventory

Date: 2026-09-11
Scope: current repository only. No remote Supabase data was read in this phase.

## Classification Legend

- UI: presentation, layout, interaction, styling.
- Content: copy, editorial text, CTA text, labels, schedules, FAQ-like content.
- Data: structured records used by services or views.
- Asset: image/logo/media file or remote media reference.
- Configuration: build, environment, lint, test, framework config.
- Business logic: code that controls app behavior or service boundaries.
- Mock/demo logic: development-only runtime simulation or fixtures.

## Repository Files

| Path | Classification | Notes | Production Mapping |
| --- | --- | --- | --- |
| `ngahiji.html` | UI, Content, Data, Asset references, Mock/demo logic | Original design source of truth. Contains locked public UI, homepage sections, event details, registration simulation, demo login/payment/tickets/check-in, remote Unsplash images, and logo treatment. | Preserve as visual reference. Extract remaining content into database seeds/CMS records before removing demo runtime. |
| `snippet.txt` | Content, Configuration, Product requirements | Master architecture/product prompt. | Keep as project reference or convert selected constraints into docs/issues. |
| `ngahiji_001_foundation.sql` | Configuration, Business logic | Original draft SQL. | Keep for historical trace. Canonical migration is under `supabase/migrations`. |
| `ngahihji-catalog.ts` | Business logic | Original draft catalog adapter. | Keep for historical trace. Canonical adapter is `src/lib/ngahiji-catalog.ts`. |
| `public/NGAHIJI_LOGO.png` | Asset | Official local logo used by app header/footer. | Keep in `/public` for now; can later mirror to Supabase Storage `public-assets` with stable URL abstraction. |
| `src/app/globals.css` | UI | Main design tokens and visual implementation. | Design system locked. CMS must not mutate these tokens. |
| `src/components/NgahijiApp.tsx` | UI, Content, Business logic, Mock/demo logic | Main client component. Contains some hardcoded copy/images and demo registration/profile/live unavailable states. | Split content into services/CMS-backed records incrementally without redesigning component appearance. |
| `src/data/demo/catalog.ts` | Data, Content, Asset references, Mock/demo logic | Demo events, ticket types, stories, communities. | Seed into Supabase as initial production content. Keep isolated for local development/testing only. |
| `src/lib/ngahiji-catalog.ts` | Business logic | Catalog repository interface, Supabase REST repository, demo repository, parsing/validation. | Expand with media/homepage/community repositories after schema inspection. |
| `src/lib/catalog-runtime.ts` | Business logic, Mock/demo selector | Chooses demo repository only when `NEXT_PUBLIC_DEMO_MODE=true`; production throws on missing Supabase env. | Keep as explicit composition root; production should only use Supabase-backed repositories. |
| `supabase/migrations/20260911000100_foundation.sql` | Configuration, Database business rules | Draft foundation migration for profiles, organizers, organizer_members, events, ticket_types, audit_logs, RLS. | Must compare against real Supabase schema before applying/expanding. |
| `docs/sql-audit.md` | Content, Security documentation | Known SQL strengths and gaps. | Keep updated with schema inspection findings. |
| `.env.example` | Configuration | Placeholder env only. No secrets. | Expand with provider placeholders as integrations are added. |
| `README.md` | Content, Configuration documentation | Local setup and current limitations. | Keep current through migration phases. |

## Existing Structured Content

### Events

Source: `src/data/demo/catalog.ts`, inherited from `ngahiji.html`.

| Title | Slug | Date | Location | Category | Ticket Content |
| --- | --- | --- | --- | --- | --- |
| Ngahiji Youth Day 2026 | `ngahiji-youth-day-2026` | 28 September 2026 | Bandung, Jawa Barat | Youth & culture | Regular Rp75.000, VIP Rp150.000 |
| Ngahiji Family Gathering | `ngahiji-family-gathering` | 12 Oktober 2026 | Jakarta | Family & connection | Free Registration Rp0 |
| Ngahiji Entrepreneur Forum | `ngahiji-entrepreneur-forum` | 5 November 2026 | Bandung, Jawa Barat | Ideas & impact | Regular Rp100.000 |

Production entities needed: `events`, `ticket_types`, later `event_schedules`, `event_faqs`, `event_media`, `event_speakers`, `event_sponsors`.

### Media / Stories

Source: `src/data/demo/catalog.ts` and `ngahiji.html`.

- Kenapa Anak Muda Butuh Ruang untuk Bertumbuh Bersama? - Kajian / Article.
- Ngahiji: Lebih dari Sekadar Event, Tapi Gerakan Bersama - Community / Video.
- Menemukan Ketenangan dalam Kesibukan - Lifestyle / Podcast.
- Mulai dari Hal Kecil, Berdampak Bersama - Youth / Short story.

Production entities needed: `media_items` or separate `articles`, `videos`, `podcasts`; `media_categories`; `media_assets`.

### Communities

Source: `src/data/demo/catalog.ts` and `ngahiji.html`.

- Youth
- Family
- Entrepreneur
- Creative
- Volunteer
- Education

Production entities needed: `communities`, `community_members`, later `community_posts`.

### Homepage / UI Copy Still Hardcoded

Source: `src/components/NgahijiApp.tsx`.

- Hero eyebrow, H1, intro, proof copy.
- Ticker copy.
- Event section heading/copy.
- Live section heading/copy/schedule labels.
- Media section heading/copy/filter labels.
- Community section heading/copy.
- Moments section copy and captions.
- Organizer CTA.
- Closing CTA.
- Footer brand/footer links/newsletter copy.

Production entities needed: `homepage_sections`, `pages`, or a typed settings/content table. Do not allow CMS to alter global design tokens.

## Asset Inventory

### Local Assets

| Asset | Use | Recommendation |
| --- | --- | --- |
| `public/NGAHIJI_LOGO.png` | Header/footer logo. | Keep in `/public` initially. Add `resolveMedia()` before Storage migration. |

### Remote Asset References

- Unsplash event and hero images in `src/data/demo/catalog.ts` and `src/components/NgahijiApp.tsx`.
- These are content/media references, not design tokens.

Recommendation: create `media_assets` records and a storage migration plan. Do not hardcode Supabase Storage URLs in components.

## Demo Runtime Inventory

Current demo/runtime elements to replace with production architecture:

- Demo catalog repository, allowed only by explicit `NEXT_PUBLIC_DEMO_MODE=true`.
- Demo stories and communities used directly in `src/app/page.tsx`.
- Registration modal stores buyer/attendee names in component memory only.
- Confirmation modal displays non-valid demo tickets.
- Join/profile modal is non-functional demo state.
- Live modal is a demo preview.
- Newsletter submit only shows a toast.

Do not delete content values when removing demo runtime. Migrate values into Supabase seed/CMS first.

## Initial Production Migration Targets

1. Preserve locked UI in `src/components/NgahijiApp.tsx` and `src/app/globals.css`.
2. Add repositories for homepage, media, communities, and assets.
3. Extend or create database schema only after remote schema inspection.
4. Seed current demo events, tickets, stories, communities, and homepage copy into staging.
5. Switch production runtime to Supabase data only.
6. Keep demo fixtures isolated for local test/dev mode.
