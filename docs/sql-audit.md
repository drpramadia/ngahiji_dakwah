# SQL Audit - Phase 1 Foundation

Migration reviewed: `supabase/migrations/20260911000100_foundation.sql`.
Additional content migration: `supabase/migrations/20260911000200_content_foundation.sql`.
RBAC role migration: `supabase/migrations/20260911000300_rbac_roles.sql`.
Initial production content seed: `supabase/seed/initial_content.sql`.

The foundation, content, and RBAC role migrations were applied to the linked Supabase project on 2026-09-11 after dry-runs. No reset, table drop, or destructive migration was run.

The initial production content seed was applied idempotently with `insert ... on conflict do update`. No deletes were run.

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

## Weaknesses / Follow-Up Before Staging

- The first foundation migration is not fully idempotent; most tables, policies, triggers, and indexes do not use guarded `if not exists`/drop patterns. Use only on a new staging database or convert it before repeated local resets.
- Membership provisioning has no RPC or seed path in this migration. Admin/server provisioning must be designed before real organizer onboarding.
- `events.image_url` is convenient for the prototype but should move to Supabase Storage metadata or a validated media table before production content management.
- `ticket_types.quota` is configured capacity only. There is no reservation, order, payment, or inventory decrement logic in this phase.
- `profiles` does not yet update `updated_at` automatically. Add a profile trigger before profile editing is shipped.
- Audit logging records catalog writes, but there is no authorized server read path for admins yet.
- Status transition rules are minimal. A formal workflow table or transition function will be needed before editorial review is operated by multiple roles.
- No policies or schema exist yet for auth sessions, orders, attendees, payments, official tickets, QR verification, check-in, email, WhatsApp, sponsors, live, media CMS, or analytics.
