# Supabase Schema Inspection Plan

Status: blocked until local Supabase access is configured.

Do not paste secrets into chat. Configure credentials locally in `.env.local` or login/link the Supabase CLI directly in your terminal.

## Current Local State

- Supabase CLI was not found in PATH during audit.
- `.env.local` was not present during audit.
- Only the draft migration exists locally: `supabase/migrations/20260911000100_foundation.sql`.
- No remote schema was inspected in this phase.

## Required Safe Setup

Option A: Supabase CLI

```bash
npm install --save-dev supabase
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Option B: Database connection URL for local terminal only

```bash
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

Keep this value in `.env.local` or your shell session. Do not commit it.

## Read-Only Inspection Commands

After credentials are configured locally, inspect without modifying data:

```bash
npx supabase db dump --schema public --data-only=false --file supabase/schema.snapshot.sql
```

If using psql locally:

```bash
psql "$SUPABASE_DB_URL" -c "select schemaname, tablename from pg_tables where schemaname in ('public','private') order by schemaname, tablename;"
psql "$SUPABASE_DB_URL" -c "select schemaname, tablename, policyname, permissive, roles, cmd from pg_policies where schemaname = 'public' order by tablename, policyname;"
psql "$SUPABASE_DB_URL" -c "select table_schema, table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema in ('public','private') order by table_schema, table_name, ordinal_position;"
```

## Inspection Checklist

- Existing tables and columns.
- Existing RLS policies.
- Existing grants for `anon`, `authenticated`, and service/admin paths.
- Existing triggers and functions.
- Existing storage buckets and policies.
- Existing auth provider configuration, if exposed by project config.
- Whether current draft migration duplicates or conflicts with existing schema.

## Stop Conditions

Stop before any migration if inspection finds:

- Tables with production data that would be dropped or overwritten.
- Conflicting enum/status values.
- Existing RLS policies that conflict with new policies.
- Existing payment/order/ticket/check-in tables with unknown semantics.
- Any destructive migration step.
