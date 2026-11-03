-- Repair orders: the billing backbone. One RO per visit. Lines are labor, parts and fees; approved
-- findings become lines automatically; the invoice is the approved lines plus tax; payment is recorded
-- at the counter (card processing comes later).

alter table public.shops
  add column if not exists tax_rate_bp int not null default 725,         -- basis points: 725 = 7.25 %
  add column if not exists labor_rate_cents int not null default 12500,  -- per hour
  add column if not exists shop_supplies_bp int not null default 0;      -- % of labor added as a fee, 0 = off

create table if not exists public.repair_orders (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  number         int generated always as identity,
  status         text not null default 'open' check (status in ('open', 'invoiced', 'paid', 'void')),
  tax_rate_bp    int not null default 725,
  notes          text not null default '',
  invoiced_at    timestamptz,
  paid_at        timestamptz,
  paid_method    text not null default '',   -- cash | card | check | other
  paid_cents     int not null default 0,
  created_at     timestamptz not null default now()
);
alter table public.repair_orders enable row level security;
create policy "staff all" on public.repair_orders for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.repair_orders to authenticated;

create table if not exists public.ro_lines (
  id          uuid primary key default gen_random_uuid(),
  shop_id     text not null default 'ryguys',
  ro_id       uuid not null references public.repair_orders (id) on delete cascade,
  kind        text not null default 'labor' check (kind in ('labor', 'part', 'fee', 'discount')),
  description text not null,
  qty         numeric(8,2) not null default 1,
  unit_cents  int not null default 0,
  taxable     boolean not null default true,
  finding_id  uuid references public.findings (id) on delete set null,
  approved    boolean not null default true,   -- false while it waits on the customer
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists ro_lines_ro on public.ro_lines (ro_id);
alter table public.ro_lines enable row level security;
create policy "staff all" on public.ro_lines for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.ro_lines to authenticated;

-- Make sure every visit has an RO once it is checked in.
create or replace function public.ensure_ro(p_appointment uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare rid uuid; sid text; rate int;
begin
  select id into rid from public.repair_orders where appointment_id = p_appointment;
  if rid is not null then return rid; end if;
  select shop_id into sid from public.appointments where id = p_appointment;
  if sid is null or not public.is_staff(sid) then raise exception 'Not allowed.'; end if;
  select tax_rate_bp into rate from public.shops where shop_id = sid;
  insert into public.repair_orders (shop_id, appointment_id, tax_rate_bp) values (sid, p_appointment, coalesce(rate, 725)) returning id into rid;
  return rid;
end $$;
grant execute on function public.ensure_ro(uuid) to authenticated;

-- An approved finding becomes a line; a declined one is removed; price edits follow.
create or replace function public.findings_to_ro() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if new.status = 'approved' then
    select id into rid from public.repair_orders where appointment_id = new.appointment_id;
    if rid is null then
      insert into public.repair_orders (shop_id, appointment_id, tax_rate_bp) select new.shop_id, new.appointment_id, coalesce((select tax_rate_bp from public.shops where shop_id = new.shop_id), 725) returning id into rid;
    end if;
    if not exists (select 1 from public.ro_lines where finding_id = new.id) then
      insert into public.ro_lines (shop_id, ro_id, kind, description, qty, unit_cents, finding_id, approved, sort)
      values (new.shop_id, rid, 'labor', new.name, 1, new.price_cents, new.id, true, 100);
    else
      update public.ro_lines set unit_cents = new.price_cents, description = new.name, approved = true where finding_id = new.id;
    end if;
  elsif new.status = 'declined' then
    delete from public.ro_lines where finding_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists findings_to_ro on public.findings;
create trigger findings_to_ro after insert or update of status, price_cents, name on public.findings for each row execute function public.findings_to_ro();

-- Totals, computed in one place.
create or replace function public.ro_totals(p_ro uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with l as (
    select kind, approved, taxable, round(qty * unit_cents)::int as cents from public.ro_lines where ro_id = p_ro
  ), r as (select tax_rate_bp from public.repair_orders where id = p_ro)
  select jsonb_build_object(
    'labor',    coalesce((select sum(cents) from l where approved and kind = 'labor'), 0),
    'parts',    coalesce((select sum(cents) from l where approved and kind = 'part'), 0),
    'fees',     coalesce((select sum(cents) from l where approved and kind = 'fee'), 0),
    'discount', coalesce((select sum(cents) from l where approved and kind = 'discount'), 0),
    'subtotal', coalesce((select sum(case when kind = 'discount' then -cents else cents end) from l where approved), 0),
    'tax',      round(coalesce((select sum(case when kind = 'discount' then -cents else cents end) from l where approved and taxable), 0) * (select tax_rate_bp from r) / 10000.0)::int,
    'total',    coalesce((select sum(case when kind = 'discount' then -cents else cents end) from l where approved), 0)
                + round(coalesce((select sum(case when kind = 'discount' then -cents else cents end) from l where approved and taxable), 0) * (select tax_rate_bp from r) / 10000.0)::int,
    'pending',  coalesce((select sum(cents) from l where not approved), 0)
  )
$$;
grant execute on function public.ro_totals(uuid) to authenticated;

-- Invoice and payment, staff only.
create or replace function public.ro_set_status(p_ro uuid, p_status text, p_method text default '', p_paid_cents int default null) returns void
language plpgsql security definer set search_path = public as $$
declare r public.repair_orders; t jsonb;
begin
  select * into r from public.repair_orders where id = p_ro;
  if r.id is null or not public.is_staff(r.shop_id) then raise exception 'Not allowed.'; end if;
  t := public.ro_totals(p_ro);
  if p_status = 'invoiced' then update public.repair_orders set status = 'invoiced', invoiced_at = now() where id = p_ro;
  elsif p_status = 'paid' then update public.repair_orders set status = 'paid', paid_at = now(), paid_method = coalesce(p_method, ''), paid_cents = coalesce(p_paid_cents, (t->>'total')::int), invoiced_at = coalesce(invoiced_at, now()) where id = p_ro;
  elsif p_status = 'void' then update public.repair_orders set status = 'void' where id = p_ro;
  elsif p_status = 'open' then update public.repair_orders set status = 'open', invoiced_at = null, paid_at = null, paid_cents = 0 where id = p_ro;
  else raise exception 'Unknown status.';
  end if;
end $$;
grant execute on function public.ro_set_status(uuid, text, text, int) to authenticated;

-- Customers see their invoice: lines and totals ride along with the visit.
create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'vehicle_id', a.vehicle_id,
    'pickup', a.pickup, 'rating', a.rating, 'tech', split_part(t.name, ' ', 1),
    'vehicle', case when v.id is null then null else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end,
    'findings', (select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'tier', f.tier, 'name', f.name, 'plain', f.plain, 'tech', f.tech, 'meas', f.meas, 'meas_label', f.meas_label, 'urgency', f.urgency, 'wait_text', f.wait_text, 'price_cents', f.price_cents, 'status', f.status, 'created_at', f.created_at) order by f.created_at), '[]'::jsonb) from public.findings f where f.appointment_id = a.id),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.id, 'path', ph.path, 'caption', ph.caption, 'meas', ph.meas, 'finding_id', ph.finding_id, 'created_at', ph.created_at) order by ph.created_at), '[]'::jsonb) from public.visit_photos ph where ph.appointment_id = a.id),
    'tire_quote', (select jsonb_build_object('id', q.id, 'size', q.size, 'tread', q.tread, 'options', q.options, 'recommended', q.recommended, 'hazard_offered', q.hazard_offered, 'fee_cents', q.fee_cents, 'status', q.status, 'accepted_tier', q.accepted_tier, 'accepted_hazard', q.accepted_hazard, 'total_cents', q.total_cents, 'created_at', q.created_at) from public.tire_quotes q where q.appointment_id = a.id order by q.created_at desc limit 1),
    'invoice', (select jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'invoiced_at', r.invoiced_at, 'paid_at', r.paid_at, 'paid_method', r.paid_method, 'totals', public.ro_totals(r.id),
                  'lines', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'kind', l.kind, 'description', l.description, 'qty', l.qty, 'unit_cents', l.unit_cents, 'cents', round(l.qty * l.unit_cents)::int) order by l.sort, l.created_at), '[]'::jsonb) from public.ro_lines l where l.ro_id = r.id and l.approved))
                from public.repair_orders r where r.appointment_id = a.id and r.status <> 'void')
  ) order by a.starts_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.appointments a on a.shop_id = p.shop_id and (a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
  left join public.customer_vehicles v on v.id = a.vehicle_id
  left join public.technicians t on t.id = a.tech_id
  where p.user_id = auth.uid() and a.starts_at > now() - interval '180 days'
$$;

-- Shop settings exposed to the desktop already via `shops`; make the new columns visible publicly only where harmless.
create or replace function public.shops_public() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('shop_id', shop_id, 'name', name, 'address', address, 'city', city, 'phone', phone, 'hours', hours,
    'lat', lat, 'lng', lng, 'open_days', open_days, 'open_from', open_from, 'open_to', open_to, 'labor_rate_cents', labor_rate_cents) order by name), '[]'::jsonb)
  from public.shops
$$;

-- Invoice is worth a push.
create or replace function public.ro_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare a public.appointments; users uuid[]; t jsonb;
begin
  if new.status = 'invoiced' and (old.status is distinct from 'invoiced') then
    select * into a from public.appointments where id = new.appointment_id;
    select array_agg(u) into users from public.users_for_customer(a.customer_id, a.customer_user) u;
    if users is null then return new; end if;
    t := public.ro_totals(new.id);
    perform public.push_to_users(users, 'Your invoice is ready.', 'Total $' || to_char((t->>'total')::int / 100.0, 'FM999,990.00') || '. Pay at the counter when you pick up.', jsonb_build_object('view', 'service', 'appointment', a.id));
  end if;
  return new;
end $$;
drop trigger if exists ro_push on public.repair_orders;
create trigger ro_push after update of status on public.repair_orders for each row execute function public.ro_push();
