# Admin Bootstrap

Supabase Auth login is active through `/admin/login`, but access to `/admin` requires a row in `public.organizer_members`.

Do not paste service-role keys into chat. Run bootstrap SQL only from a trusted local terminal, Supabase SQL editor, or approved server-side admin tooling.

## Steps

1. Create or invite the admin user through Supabase Auth.
2. Copy the user's UUID from Supabase Auth users.
3. Ensure the organizer row exists. The initial seed creates:

```text
11111111-1111-4111-8111-111111111111 / Ngahiji Dakwah Organizer
```

4. Insert or update the membership:

```sql
insert into public.organizer_members (organizer_id, user_id, role)
values (
  '11111111-1111-4111-8111-111111111111',
  'AUTH_USER_UUID_HERE',
  'SUPER_ADMIN'
)
on conflict (organizer_id, user_id) do update set role = excluded.role;
```

## Current Supported Roles

- `SUPER_ADMIN`
- `ADMIN`
- `EVENT_MANAGER`
- `EDITOR`
- `CHECKIN_OPERATOR`
- `SPONSOR_MANAGER`
- `ORGANIZER`

## Security Notes

- `/admin` checks Supabase Auth server-side.
- `/admin` checks `organizer_members` server-side.
- Users without a role are redirected to `/admin/unauthorized`.
- Public UI is not changed by admin setup.
