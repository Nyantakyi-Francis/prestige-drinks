-- Prestige Drinks Store Manager (v1.1)
-- Apply this in your Supabase SQL editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null check (role in ('admin', 'salesperson')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pack_size int not null check (pack_size > 0),
  cost_price_per_pack numeric(12,2) not null check (cost_price_per_pack >= 0),
  wholesale_price_per_pack numeric(12,2) not null check (wholesale_price_per_pack >= 0),
  half_pack_price numeric(12,2),
  retail_price_per_unit numeric(12,2) not null check (retail_price_per_unit >= 0),
  store_price_per_unit numeric(12,2) not null check (store_price_per_unit >= 0),
  -- Stock is stored in units (source of truth), but can also be edited via packs + loose pieces.
  stock_units int not null default 0 check (stock_units >= 0),
  stock_packs int not null default 0 check (stock_packs >= 0),
  stock_pieces int not null default 0 check (stock_pieces >= 0 and stock_pieces < pack_size),
  low_stock_threshold int not null default 50 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.products_sync_stock() returns trigger as $$
declare
  packs_changed boolean;
  units_changed boolean;
  pack_size_changed boolean;
  computed_units int;
begin
  if tg_op = 'INSERT' then
    packs_changed := true;
    units_changed := true;
    pack_size_changed := true;
  else
    packs_changed := (new.stock_packs is distinct from old.stock_packs)
      or (new.stock_pieces is distinct from old.stock_pieces);
    units_changed := (new.stock_units is distinct from old.stock_units);
    pack_size_changed := (new.pack_size is distinct from old.pack_size);
  end if;

  computed_units := (new.stock_packs * new.pack_size) + new.stock_pieces;

  if tg_op = 'INSERT' then
    -- On INSERT we can't reliably tell which columns were "intended" (defaults apply),
    -- so prefer whichever representation is non-zero, otherwise keep zeros.
    if new.stock_units = 0 and computed_units = 0 then
      return new;
    end if;

    if new.stock_units != 0 and computed_units = 0 then
      new.stock_packs := (new.stock_units / new.pack_size);
      new.stock_pieces := (new.stock_units % new.pack_size);
      return new;
    end if;

    if new.stock_units = 0 and computed_units != 0 then
      new.stock_units := computed_units;
      return new;
    end if;

    if new.stock_units != computed_units then
      raise exception 'Stock mismatch: stock_units (%) != stock_packs*pack_size+stock_pieces (%)', new.stock_units, computed_units;
    end if;
    return new;
  end if;

  if packs_changed and units_changed then
    if new.stock_units != computed_units then
      raise exception 'Stock mismatch: stock_units (%) != stock_packs*pack_size+stock_pieces (%)', new.stock_units, computed_units;
    end if;
  elsif packs_changed then
    new.stock_units := computed_units;
  elsif units_changed or pack_size_changed then
    new.stock_packs := (new.stock_units / new.pack_size);
    new.stock_pieces := (new.stock_units % new.pack_size);
  else
    new.stock_packs := (new.stock_units / new.pack_size);
    new.stock_pieces := (new.stock_units % new.pack_size);
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_sync_stock on public.products;
create trigger trg_products_sync_stock
before insert or update on public.products
for each row execute function public.products_sync_stock();

create type public.sale_type as enum ('wholesale', 'retail', 'store');
create type public.sale_unit_type as enum ('unit', 'pack', 'half_pack');

create table if not exists public.stock_entries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  user_id uuid not null references auth.users (id),
  units_added int not null check (units_added > 0),
  notes text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  user_id uuid not null references auth.users (id),
  sale_type public.sale_type not null,
  sale_unit_type public.sale_unit_type not null,
  quantity_units int not null check (quantity_units > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_revenue numeric(12,2) not null check (total_revenue >= 0),
  unit_cost numeric(12,6) not null check (unit_cost >= 0),
  profit numeric(12,2) not null,
  pack_size_at_sale int not null,
  sold_at timestamptz not null default now(),
  locked boolean not null default false
);

create table if not exists public.daily_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  business_date date not null,
  submitted_at timestamptz not null default now(),
  unique (user_id, business_date)
);

create type public.note_scope as enum ('daily', 'product', 'system');
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id),
  scope public.note_scope not null,
  product_id uuid references public.products (id),
  note_date date,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Minimal RLS: users can read their profile; products readable to all authed; writes via server (service role).
alter table public.profiles enable row level security;
alter table public.products enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "products_select_authed" on public.products;
create policy "products_select_authed" on public.products
  for select to authenticated
  using (true);
