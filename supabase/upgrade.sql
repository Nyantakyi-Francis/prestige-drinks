-- Run this once in Supabase SQL editor to enable Admin user management features.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

alter table public.profiles
  add column if not exists last_login_at timestamptz;

-- Stock: allow editing as packs + pieces (keeps stock_units as source of truth).
alter table public.products
  add column if not exists stock_packs int not null default 0 check (stock_packs >= 0);

alter table public.products
  add column if not exists stock_pieces int not null default 0;

alter table public.products
  drop constraint if exists products_stock_pieces_check;

alter table public.products
  add constraint products_stock_pieces_check check (stock_pieces >= 0 and stock_pieces < pack_size);

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


-- Backfill packs/pieces for existing rows.
update public.products
set
  stock_packs = (stock_units / pack_size),
  stock_pieces = (stock_units % pack_size);
