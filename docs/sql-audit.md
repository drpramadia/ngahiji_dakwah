# SQL Audit - Phase 1 Foundation

Migration reviewed: `supabase/migrations/20260911000100_foundation.sql`.
Additional content migration: `supabase/migrations/20260911000200_content_foundation.sql`.
RBAC role migration: `supabase/migrations/20260911000300_rbac_roles.sql`.
SUPER_ADMIN helper migration: `supabase/migrations/20260911000400_super_admin_role.sql`.
Content CMS policy migration: `supabase/migrations/20260911000500_content_super_admin_policies.sql`.
Storage asset foundation migration: `supabase/migrations/20260911000600_storage_asset_foundation.sql`.
Ticketing foundation migration: `supabase/migrations/20260911000700_ticketing_foundation.sql`.
Media asset metadata migration: `supabase/migrations/20260911000800_media_asset_metadata.sql`.
Initial production content seed: `supabase/seed/initial_content.sql`.
Image asset seed: `supabase/seed/image_assets.sql`.

The foundation, content, RBAC role, SUPER_ADMIN helper, content CMS policy, storage asset foundation, ticketing foundation, and media asset metadata migrations were applied to the linked Supabase project on 2026-09-11 after dry-runs. No reset, table drop, or destructive migration was run.

The initial production content seed was applied idempotently with `insert ... on conflict do update`. No deletes were run.

The image asset seed was applied idempotently. It registers local public assets in `media_assets` and updates `events.image_url` / `media_items.image_url` to local `/assets/ngahiji/...` paths. No deletes were run and no Storage object uploads were performed.

## Catalog 404 Finding

The public application showed `Catalog request failed (404)` because production mode was correctly calling Supabase REST while the linked remote project had no applied foundation migration yet.

Evidence:

- `npx supabase migration list` showed `20260911000100_foundation.sql` as local-only before push.
- Postgres table inspection showed foundation tables after push.
- REST checks with anon key now return rows for `events`, `ticket_types`, `media_items`, and `communities`.

Resolution:

- Applied `20260911000100_foundation.sql`.
- Added and applied `20260911000200_content_foundation.sql` for `media_items` and `communities`.
- Applied `supabase/seed/initial_content.sql` to migrate current demo content as initial production content.

## What Looks Covered

- RLS is enabled on `profiles`, `organizers`, `organizer_members`, `events`, `ticket_types`, and `audit_logs`.
- RLS is enabled on `media_items` and `communities`.
- Public event reads are limited to `status = 'PUBLISHED'`.
- Public ticket type reads require active ticket types attached to published events.
- Public media/community reads are limited to `status = 'PUBLISHED'`.
- `organizer_id` is immutable through `private.guard_event()`.
- Non-admin organizer members are blocked from approving, publishing, or archiving events through `private.guard_event()`.
- `audit_logs` has no browser-facing grants or policies.
- Explicit grants avoid relying on Supabase defaults.
- `organizer_members.role` accepts production CMS roles: `SUPER_ADMIN`, `ADMIN`, `EVENT_MANAGER`, `EDITOR`, `CHECKIN_OPERATOR`, `SPONSOR_MANAGER`, and `ORGANIZER`.
- `private.has_role()` now treats `SUPER_ADMIN` as an elevated organizer role for existing RLS policies and event publish guards.
- `media_staff_write` and `community_staff_write` now allow `SUPER_ADMIN`, `ADMIN`, and `EDITOR`.
- Supabase Storage buckets exist for public, event, media, sponsor, and speaker assets.
- `media_assets` stores production asset metadata and is public-readable only when `status = 'PUBLISHED'`.
- `media_assets` supports `LOCAL_PUBLIC`, `SUPABASE_STORAGE`, and `EXTERNAL` source metadata for CMS-ready image replacement.
- Ticketing foundation tables exist for registrations, attendees, orders, order items, payment transactions, tickets, check-ins, and consents.
- `tickets` cannot become `ACTIVE` unless payment is `PAID` and verification is `VERIFIED`.
- `check_ins` uses a database trigger with row locking to prevent duplicate valid check-ins.

## Weaknesses / Follow-Up Before Staging

- The first foundation migration is not fully idempotent; most tables, policies, triggers, and indexes do not use guarded `if not exists`/drop patterns. Use only on a new staging database or convert it before repeated local resets.
- Membership provisioning has no RPC or seed path in this migration. Admin/server provisioning must be designed before real organizer onboarding.
- `events.image_url` is convenient for the prototype but should move to Supabase Storage metadata or a validated media table before production content management.
- `ticket_types.quota` is configured capacity only. There is no reservation, order, payment, or inventory decrement logic in this phase.
- `profiles` does not yet update `updated_at` automatically. Add a profile trigger before profile editing is shipped.
- Audit logging records catalog writes, but there is no authorized server read path for admins yet.
- Status transition rules are minimal. A formal workflow table or transition function will be needed before editorial review is operated by multiple roles.
- Payment provider credentials, webhook verification, raw QR token issuance, email/WhatsApp delivery, sponsors, live content, advanced media assets/storage, and analytics are not active yet.
