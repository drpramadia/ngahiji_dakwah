# SQL Audit - Phase 1 Foundation

Migration reviewed: `supabase/migrations/20260911000100_foundation.sql`.

This file was not executed against any remote database.

## What Looks Covered

- RLS is enabled on `profiles`, `organizers`, `organizer_members`, `events`, `ticket_types`, and `audit_logs`.
- Public event reads are limited to `status = 'PUBLISHED'`.
- Public ticket type reads require active ticket types attached to published events.
- `organizer_id` is immutable through `private.guard_event()`.
- Non-admin organizer members are blocked from approving, publishing, or archiving events through `private.guard_event()`.
- `audit_logs` has no browser-facing grants or policies.
- Explicit grants avoid relying on Supabase defaults.

## Weaknesses / Follow-Up Before Staging

- The migration is not fully idempotent; most tables, policies, triggers, and indexes do not use guarded `if not exists`/drop patterns. Use only on a new staging database or convert it before repeated local resets.
- Membership provisioning has no RPC or seed path in this migration. Admin/server provisioning must be designed before real organizer onboarding.
- `events.image_url` is convenient for the prototype but should move to Supabase Storage metadata or a validated media table before production content management.
- `ticket_types.quota` is configured capacity only. There is no reservation, order, payment, or inventory decrement logic in this phase.
- `profiles` does not yet update `updated_at` automatically. Add a profile trigger before profile editing is shipped.
- Audit logging records catalog writes, but there is no authorized server read path for admins yet.
- Status transition rules are minimal. A formal workflow table or transition function will be needed before editorial review is operated by multiple roles.
- No policies or schema exist yet for auth sessions, orders, attendees, payments, official tickets, QR verification, check-in, email, WhatsApp, sponsors, live, media CMS, or analytics.
