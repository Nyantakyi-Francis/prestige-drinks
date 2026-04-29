# Prestige Drinks — Store Manager

Responsive store management web app (desktop + mobile) for inventory, sales, pricing, and reporting with **Admin** and **Salesperson** roles.

## Prerequisites

- Node.js (uses the included `package-lock.json`)
- A Supabase project (Postgres + Auth)

## Supabase setup

1. Supabase Dashboard → SQL editor → run `supabase/schema.sql`
2. (Recommended) Run `supabase/upgrade.sql` to enable:
   - `profiles.is_active` (disable/enable accounts)
   - `profiles.last_login_at` (login tracking)

## Environment variables

Create `.env.local` from `.env.local.example`.

Notes:
- `NEXT_PUBLIC_SUPABASE_URL` must be like `https://xxxxx.supabase.co` (do **not** include `/rest/v1/`).
- Keep `SUPABASE_SERVICE_ROLE_KEY` private.

## First run

```bash
npm run dev
```

1. Open `http://localhost:3000/signup` and create your first account (created as `salesperson`)
2. Promote yourself to admin in Supabase (Table Editor: schema `public` → `profiles`, or via SQL):

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_UUID';
```

3. Sign out/in again, then open `http://localhost:3000/admin`

## Admin pages

- Users: `http://localhost:3000/admin/users`
- Products: `http://localhost:3000/admin/products`
- Reports (filters + export): `http://localhost:3000/admin/reports`

## Sales pages

- Dashboard: `http://localhost:3000/sales`
- Available goods: `http://localhost:3000/sales/products`
- Goods in: `http://localhost:3000/sales/goods-in`
- Record sale: `http://localhost:3000/sales/sales/new`
- Daily sales: `http://localhost:3000/sales/sales/today`
- Weekly returns: `http://localhost:3000/sales/reports`
- Submit day: `http://localhost:3000/sales/submit`

