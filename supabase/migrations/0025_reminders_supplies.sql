-- Service reminders computed from what the shop actually did (and from imported history), per
-- interval. Nothing is read from the car: the date comes from the last visit, the mileage from the
-- customer's own odometer entry. Also: shop supplies as a computed fee in RO totals.

create table if not exists public.service_intervals (
  id       uuid primary key default gen_random_uuid(),
  shop_id  text not null default 'ryguys',
  key      text not null,
  label    text not null,
  miles    int,
  months   int,
  pattern  text not null,            -- case-insensitive regex matched against job names and finding names
  sort     int not null default 0,
  active   boolean not null default true,
  unique (shop_id, key)
);
alter table public.service_intervals enable row level security;
create policy "members read" on public.service_intervals for select using (public.is_member(shop_id));
create policy "staff write" on public.service_intervals for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.service_intervals to authenticated;

insert into public.service_intervals (shop_id, key, label, miles, months, pattern, sort) values
  ('ryguys', 'oil', 'Oil & filter', 5000, 6, 'oil|lube|maintenance', 10),
  ('ryguys', 'rotation', 'Tire rotation', 6000, 6, 'rotat|tire', 20),
  ('ryguys', 'brakes', 'Brake inspection', 12000, 12, 'brake|pad|rotor', 30),
  ('ryguys', 'filters', 'Engine & cabin filters', 15000, 12, 'filter', 40),
  ('ryguys', 'alignment', 'Alignment check', 12000, 12, 'align', 50),
  ('ryguys', 'battery', 'Battery test', null, 12, 'battery', 60),
  ('ryguys', 'coolant', 'Coolant service', 30000, 24, 'coolant|radiator', 70),
  ('ryguys', 'transmission', 'Transmission service', 60000, 48, 'transmission', 80)
on conflict (shop_id, key) do nothing;

-- Reminders for one vehicle: when each interval was last done, when it is next due, and how urgent.
create or replace function public.vehicle_reminders(p_vehicle uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with v as (select * from public.customer_vehicles where id = p_vehicle),
  events as (
    -- finished visits: the booked job and any approved/done findings
    select a.done_at::date as d, lower(coalesce(a.job, '')) as txt from public.appointments a, v where a.vehicle_id = v.id and a.status = 'done' and a.done_at is not null
    union all
    select a.done_at::date, lower(f.name) from public.appointments a join public.findings f on f.appointment_id = a.id, v where a.vehicle_id = v.id and a.status = 'done' and f.status in ('approved', 'done')
    union all
    -- imported history from the old system
    select v.last_visit_at, lower(coalesce(v.last_service, '')) from v where v.last_visit_at is not null
  ),
  per as (
    select i.key, i.label, i.miles, i.months, i.sort,
      (select max(e.d) from events e where e.txt ~* i.pattern) as last_at
    from public.service_intervals i, v where i.shop_id = v.shop_id and i.active
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', key, 'label', label, 'miles', miles, 'months', months, 'last_at', last_at,
    'due_at', case when last_at is not null and months is not null then (last_at + (months || ' months')::interval)::date end,
    'status', case
      when last_at is null then 'unknown'
      when months is not null and (last_at + (months || ' months')::interval)::date <= current_date then 'due'
      when months is not null and (last_at + (months || ' months')::interval)::date <= current_date + 30 then 'soon'
      else 'ok' end
  ) order by sort), '[]'::jsonb) from per
$$;
grant execute on function public.vehicle_reminders(uuid) to authenticated;

create or replace function public.my_reminders() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(v.id, public.vehicle_reminders(v.id)), '{}'::jsonb)
  from public.customer_vehicles v where v.customer_id = public.my_customer_id()
$$;
grant execute on function public.my_reminders() to authenticated;

-- Staff: everyone due or due soon, for outreach.
create or replace function public.shop_reminders() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x->>'due_at'), '[]'::jsonb) from (
    select jsonb_build_object('vehicle_id', v.id, 'customer_id', v.customer_id, 'customer', c.name, 'phone', c.phone, 'joined', c.joined_at is not null,
      'vehicle', trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model), 'label', r->>'label', 'key', r->>'key', 'due_at', r->>'due_at', 'last_at', r->>'last_at', 'status', r->>'status') as x
    from public.customer_vehicles v join public.customers c on c.id = v.customer_id, jsonb_array_elements(public.vehicle_reminders(v.id)) r
    where public.is_staff(v.shop_id) and (r->>'status') in ('due', 'soon')
      and not exists (select 1 from public.appointments a where a.vehicle_id = v.id and a.status in ('booked', 'arrived', 'in_progress'))
  ) s
$$;
grant execute on function public.shop_reminders() to authenticated;

-- Shop supplies: a percentage of labor, computed into the totals rather than typed as a line.
create or replace function public.ro_totals(p_ro uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with l as (
    select kind, approved, taxable, qty, round(qty * unit_cents)::int as cents, round(qty * cost_cents)::int as cost from public.ro_lines where ro_id = p_ro
  ), r as (select r.tax_rate_bp, coalesce(s.shop_supplies_bp, 0) as sup_bp from public.repair_orders r join public.shops s on s.shop_id = r.shop_id where r.id = p_ro),
  sums as (
    select
      coalesce(sum(cents) filter (where approved and kind = 'labor'), 0) as labor,
      coalesce(sum(cents) filter (where approved and kind = 'part'), 0) as parts,
      coalesce(sum(cost)  filter (where approved and kind = 'part'), 0) as parts_cost,
      coalesce(sum(cents) filter (where approved and kind = 'fee'), 0) as fees,
      coalesce(sum(cents) filter (where approved and kind = 'discount'), 0) as discount,
      coalesce(sum(case when kind = 'discount' then -cents else cents end) filter (where approved), 0) as subtotal0,
      coalesce(sum(case when kind = 'discount' then -cents else cents end) filter (where approved and taxable), 0) as taxable0,
      coalesce(sum(cents) filter (where not approved), 0) as pending,
      coalesce(sum(qty) filter (where approved and kind = 'labor'), 0) as labor_hours
    from l
  ),
  t as (select *, round(labor * (select sup_bp from r) / 10000.0)::int as supplies from sums)
  select jsonb_build_object(
    'labor', labor, 'parts', parts, 'parts_cost', parts_cost, 'parts_margin', parts - parts_cost, 'fees', fees + supplies, 'supplies', supplies, 'discount', discount,
    'subtotal', subtotal0 + supplies, 'tax', round((taxable0 + supplies) * (select tax_rate_bp from r) / 10000.0)::int,
    'total', subtotal0 + supplies + round((taxable0 + supplies) * (select tax_rate_bp from r) / 10000.0)::int,
    'pending', pending, 'labor_hours', labor_hours
  ) from t
$$;
