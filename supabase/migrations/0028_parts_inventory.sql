-- Parts on the shelf, purchase orders to vendors, receiving, returns, and tire DOT tracking.
-- Stock moves are the ledger; qty_on_hand is kept current by trigger so screens read one number.

create table if not exists public.parts (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null default 'ryguys',
  part_number  text not null default '',
  name         text not null,
  brand        text not null default '',
  vendor       text not null default '',
  category     text not null default 'General',
  bin          text not null default '',
  qty_on_hand  numeric(10,2) not null default 0,
  qty_min      numeric(10,2) not null default 0,     -- reorder point, 0 = none
  cost_cents   int not null default 0,
  price_cents  int not null default 0,                -- 0 = use the parts matrix on the cost
  taxable      boolean not null default true,
  is_tire      boolean not null default false,
  tire_size    text not null default '',
  dots         text[] not null default '{}',          -- DOT codes of tires on hand, one per tire
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists parts_shop on public.parts (shop_id, active);
create index if not exists parts_number on public.parts (shop_id, part_number);
alter table public.parts enable row level security;
drop policy if exists "staff all" on public.parts;
create policy "staff all" on public.parts for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.parts to authenticated;

create table if not exists public.purchase_orders (
  id          uuid primary key default gen_random_uuid(),
  shop_id     text not null default 'ryguys',
  number      int generated always as identity,
  vendor      text not null default '',
  status      text not null default 'draft' check (status in ('draft', 'ordered', 'received', 'cancelled')),
  ro_id       uuid references public.repair_orders (id) on delete set null,   -- special order for one visit
  notes       text not null default '',
  reference   text not null default '',     -- vendor order / invoice number
  ordered_at  timestamptz,
  received_at timestamptz,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now()
);
alter table public.purchase_orders enable row level security;
drop policy if exists "staff all" on public.purchase_orders;
create policy "staff all" on public.purchase_orders for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.purchase_orders to authenticated;

create table if not exists public.po_lines (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null default 'ryguys',
  po_id        uuid not null references public.purchase_orders (id) on delete cascade,
  part_id      uuid references public.parts (id) on delete set null,
  part_number  text not null default '',
  description  text not null,
  qty          numeric(10,2) not null default 1,
  received_qty numeric(10,2) not null default 0,
  cost_cents   int not null default 0,
  ro_line_id   uuid references public.ro_lines (id) on delete set null,   -- the invoice line waiting on it
  created_at   timestamptz not null default now()
);
create index if not exists po_lines_po on public.po_lines (po_id);
alter table public.po_lines enable row level security;
drop policy if exists "staff all" on public.po_lines;
create policy "staff all" on public.po_lines for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.po_lines to authenticated;

create table if not exists public.stock_moves (
  id         uuid primary key default gen_random_uuid(),
  shop_id    text not null default 'ryguys',
  part_id    uuid not null references public.parts (id) on delete cascade,
  qty        numeric(10,2) not null,            -- signed
  reason     text not null check (reason in ('received', 'sold', 'returned', 'adjust', 'count', 'unsold')),
  ref_id     uuid,                              -- po, ro line or return
  note       text not null default '',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists stock_moves_part on public.stock_moves (part_id, created_at);
alter table public.stock_moves enable row level security;
drop policy if exists "staff all" on public.stock_moves;
create policy "staff all" on public.stock_moves for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.stock_moves to authenticated;

create table if not exists public.part_returns (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null default 'ryguys',
  part_id      uuid references public.parts (id) on delete set null,
  po_id        uuid references public.purchase_orders (id) on delete set null,
  vendor       text not null default '',
  description  text not null,
  qty          numeric(10,2) not null default 1,
  reason       text not null default '',
  credit_cents int not null default 0,
  status       text not null default 'pending' check (status in ('pending', 'credited', 'denied')),
  created_at   timestamptz not null default now(),
  credited_at  timestamptz
);
alter table public.part_returns enable row level security;
drop policy if exists "staff all" on public.part_returns;
create policy "staff all" on public.part_returns for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.part_returns to authenticated;

-- qty_on_hand follows the ledger.
create or replace function public.stock_moves_apply() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.parts set qty_on_hand = qty_on_hand + new.qty, updated_at = now() where id = new.part_id;
  return new;
end $$;
drop trigger if exists stock_moves_apply on public.stock_moves;
create trigger stock_moves_apply after insert on public.stock_moves for each row execute function public.stock_moves_apply();

-- Receiving a PO puts the parts on the shelf and marks waiting invoice lines received.
create or replace function public.receive_po(p_po uuid, p_reference text default '') returns void
language plpgsql security definer set search_path = public as $$
declare po public.purchase_orders; l public.po_lines; pid uuid;
begin
  select * into po from public.purchase_orders where id = p_po;
  if po.id is null or not public.is_staff(po.shop_id) then raise exception 'Not allowed.'; end if;
  for l in select * from public.po_lines where po_id = p_po loop
    pid := l.part_id;
    if pid is null and l.part_number <> '' then
      select id into pid from public.parts where shop_id = po.shop_id and part_number = l.part_number and (vendor = po.vendor or vendor = '') limit 1;
      if pid is null then
        insert into public.parts (shop_id, part_number, name, vendor, cost_cents) values (po.shop_id, l.part_number, l.description, po.vendor, l.cost_cents) returning id into pid;
      end if;
      update public.po_lines set part_id = pid where id = l.id;
    end if;
    if pid is not null then
      insert into public.stock_moves (shop_id, part_id, qty, reason, ref_id, created_by) values (po.shop_id, pid, l.qty - l.received_qty, 'received', p_po, auth.uid());
      update public.parts set cost_cents = l.cost_cents, updated_at = now() where id = pid and l.cost_cents > 0;
    end if;
    update public.po_lines set received_qty = l.qty where id = l.id;
    if l.ro_line_id is not null then update public.ro_lines set status = 'received', part_id = coalesce(part_id, pid), cost_cents = case when l.cost_cents > 0 then l.cost_cents else cost_cents end where id = l.ro_line_id; end if;
  end loop;
  update public.purchase_orders set status = 'received', received_at = now(), reference = coalesce(nullif(p_reference, ''), reference) where id = p_po;
end $$;
grant execute on function public.receive_po(uuid, text) to authenticated;

-- A part sold on a paid invoice leaves the shelf; a voided or reopened RO puts it back.
create or replace function public.ro_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare l public.ro_lines;
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    for l in select * from public.ro_lines where ro_id = new.id and kind = 'part' and part_id is not null and approved loop
      if not exists (select 1 from public.stock_moves where ref_id = l.id and reason = 'sold') then
        insert into public.stock_moves (shop_id, part_id, qty, reason, ref_id) values (new.shop_id, l.part_id, -l.qty, 'sold', l.id);
      end if;
    end loop;
  elsif old.status = 'paid' and new.status in ('open', 'void') then
    for l in select * from public.ro_lines where ro_id = new.id and kind = 'part' and part_id is not null loop
      if exists (select 1 from public.stock_moves where ref_id = l.id and reason = 'sold') and not exists (select 1 from public.stock_moves where ref_id = l.id and reason = 'unsold') then
        insert into public.stock_moves (shop_id, part_id, qty, reason, ref_id) values (new.shop_id, l.part_id, l.qty, 'unsold', l.id);
      end if;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists ro_stock on public.repair_orders;
create trigger ro_stock after update of status on public.repair_orders for each row execute function public.ro_stock();

-- Parts usage for the reports: what left the shelf, by part, in a window.
create or replace function public.parts_usage(p_shop text, p_from timestamptz, p_to timestamptz) returns jsonb
language sql stable security definer set search_path = public as $$
  with u as (select p.id, p.part_number, p.name, p.vendor, p.cost_cents, -sum(m.qty) as qty
             from public.stock_moves m join public.parts p on p.id = m.part_id
             where m.shop_id = p_shop and public.is_staff(p_shop) and m.reason = 'sold' and m.created_at >= p_from and m.created_at < p_to
             group by p.id)
  select coalesce(jsonb_agg(jsonb_build_object('part_id', id, 'part_number', part_number, 'name', name, 'vendor', vendor, 'qty', qty, 'cost_cents', (qty * cost_cents)::int) order by qty desc), '[]'::jsonb) from u
$$;
grant execute on function public.parts_usage(text, timestamptz, timestamptz) to authenticated;

alter publication supabase_realtime add table public.parts, public.purchase_orders, public.po_lines;
