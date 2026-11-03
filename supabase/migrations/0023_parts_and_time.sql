-- Parts carry cost as well as price, so every RO shows margin. Technicians clock on and off a visit,
-- so billed hours can be compared with actual.

alter table public.ro_lines
  add column if not exists cost_cents int not null default 0,     -- what the shop paid, per unit (parts)
  add column if not exists part_number text not null default '',
  add column if not exists vendor text not null default '';

create or replace function public.ro_totals(p_ro uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with l as (
    select kind, approved, taxable, qty, round(qty * unit_cents)::int as cents, round(qty * cost_cents)::int as cost from public.ro_lines where ro_id = p_ro
  ), r as (select tax_rate_bp from public.repair_orders where id = p_ro),
  sums as (
    select
      coalesce(sum(cents) filter (where approved and kind = 'labor'), 0) as labor,
      coalesce(sum(cents) filter (where approved and kind = 'part'), 0) as parts,
      coalesce(sum(cost)  filter (where approved and kind = 'part'), 0) as parts_cost,
      coalesce(sum(cents) filter (where approved and kind = 'fee'), 0) as fees,
      coalesce(sum(cents) filter (where approved and kind = 'discount'), 0) as discount,
      coalesce(sum(case when kind = 'discount' then -cents else cents end) filter (where approved), 0) as subtotal,
      coalesce(sum(case when kind = 'discount' then -cents else cents end) filter (where approved and taxable), 0) as taxable,
      coalesce(sum(cents) filter (where not approved), 0) as pending,
      coalesce(sum(qty) filter (where approved and kind = 'labor'), 0) as labor_hours
    from l
  )
  select jsonb_build_object(
    'labor', labor, 'parts', parts, 'parts_cost', parts_cost, 'parts_margin', parts - parts_cost, 'fees', fees, 'discount', discount,
    'subtotal', subtotal, 'tax', round(taxable * (select tax_rate_bp from r) / 10000.0)::int,
    'total', subtotal + round(taxable * (select tax_rate_bp from r) / 10000.0)::int,
    'pending', pending, 'labor_hours', labor_hours
  ) from sums
$$;

create table if not exists public.time_entries (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  tech_id        uuid not null references public.technicians (id) on delete cascade,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  note           text not null default ''
);
create index if not exists time_entries_appt on public.time_entries (appointment_id);
create index if not exists time_entries_open on public.time_entries (tech_id) where ended_at is null;
alter table public.time_entries enable row level security;
create policy "staff all" on public.time_entries for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.time_entries to authenticated;

-- A tech is on one job at a time: clocking on closes any open entry first.
create or replace function public.clock_on(p_appointment uuid, p_tech uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid text; eid uuid;
begin
  select shop_id into sid from public.appointments where id = p_appointment;
  if sid is null or not public.is_staff(sid) then raise exception 'Not allowed.'; end if;
  update public.time_entries set ended_at = now() where tech_id = p_tech and ended_at is null;
  insert into public.time_entries (shop_id, appointment_id, tech_id) values (sid, p_appointment, p_tech) returning id into eid;
  update public.appointments set tech_id = coalesce(tech_id, p_tech), status = case when status in ('booked', 'arrived') then 'in_progress' else status end where id = p_appointment;
  return eid;
end $$;
grant execute on function public.clock_on(uuid, uuid) to authenticated;

create or replace function public.clock_off(p_tech uuid) returns void
language sql security definer set search_path = public as $$
  update public.time_entries set ended_at = now() where tech_id = p_tech and ended_at is null and public.is_staff(shop_id)
$$;
grant execute on function public.clock_off(uuid) to authenticated;

-- Hours on a visit so far (open entries count up to now).
create or replace function public.visit_hours(p_appointment uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select round(coalesce(sum(extract(epoch from (coalesce(ended_at, now()) - started_at))) / 3600.0, 0)::numeric, 2) from public.time_entries where appointment_id = p_appointment
$$;
grant execute on function public.visit_hours(uuid) to authenticated;
