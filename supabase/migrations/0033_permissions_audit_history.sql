-- Roles & permissions (enforced where money moves), an activity log of every change that matters,
-- repair-order history import from the old system, and merging duplicate customers.

-- ---- permissions ----
-- Per role, what an advisor or technician may do beyond the basics. Owners may do everything.
alter table public.shops add column if not exists permissions jsonb not null default '{
  "advisor": {"discount": true, "void": false, "refund": false, "parts_cost": true, "reports": true, "settings": false, "payments": true, "delete_customer": false, "edit_paid": false},
  "tech":    {"discount": false, "void": false, "refund": false, "parts_cost": false, "reports": false, "settings": false, "payments": false, "delete_customer": false, "edit_paid": false}
}'::jsonb;

create or replace function public.my_role(p_shop text) returns text
language sql stable security definer set search_path = public as $$
  select role::text from public.shop_members where user_id = auth.uid() and shop_id = p_shop limit 1
$$;
grant execute on function public.my_role(text) to authenticated;

create or replace function public.can(p_shop text, p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.my_role(p_shop)
    when 'owner' then true
    when 'advisor' then coalesce((select (permissions->'advisor'->>p_key)::boolean from public.shops where shop_id = p_shop), false)
    when 'tech' then coalesce((select (permissions->'tech'->>p_key)::boolean from public.shops where shop_id = p_shop), false)
    else false end
$$;
grant execute on function public.can(text, text) to authenticated;

-- Owners edit the matrix; everyone on staff reads it (shops is already readable by staff).
create or replace function public.set_permissions(p_shop text, p_permissions jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role(p_shop) <> 'owner' then raise exception 'Only the owner can change permissions.'; end if;
  update public.shops set permissions = p_permissions where shop_id = p_shop;
end $$;
grant execute on function public.set_permissions(text, jsonb) to authenticated;

-- Enforce at the point money moves. Owners always pass.
create or replace function public.require(p_shop text, p_key text, p_what text) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can(p_shop, p_key) then raise exception '% needs the owner''s permission.', p_what; end if;
end $$;

create or replace function public.refund_payment(p_payment uuid, p_amount_cents int, p_as_credit boolean default false, p_note text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p public.payments; r public.repair_orders;
begin
  select * into p from public.payments where id = p_payment;
  if p.id is null or not public.is_staff(p.shop_id) then raise exception 'Not allowed.'; end if;
  perform public.require(p.shop_id, 'refund', 'Refunding');
  if p_amount_cents <= 0 or p_amount_cents > p.amount_cents + coalesce((select sum(amount_cents) from public.payments where refund_of = p_payment), 0) then raise exception 'Refund is more than what was paid.'; end if;
  select * into r from public.repair_orders where id = p.ro_id;
  insert into public.payments (shop_id, ro_id, customer_id, method, amount_cents, reference, note, refund_of, created_by)
  values (p.shop_id, p.ro_id, p.customer_id, case when p_as_credit then 'store_credit' else p.method end, -p_amount_cents, p.reference, coalesce(p_note, ''), p_payment, auth.uid());
  if p_as_credit then
    insert into public.customer_credits (shop_id, customer_id, amount_cents, kind, note, ro_id, created_by) values (p.shop_id, p.customer_id, p_amount_cents, 'refund', 'Refund from RO ' || r.number, p.ro_id, auth.uid());
  end if;
  update public.repair_orders set paid_cents = public.ro_paid(p.ro_id) where id = p.ro_id;
end $$;

create or replace function public.ro_set_status(p_ro uuid, p_status text, p_method text default '', p_paid_cents int default null) returns void
language plpgsql security definer set search_path = public as $$
declare r public.repair_orders; t jsonb;
begin
  select * into r from public.repair_orders where id = p_ro;
  if r.id is null or not public.is_staff(r.shop_id) then raise exception 'Not allowed.'; end if;
  t := public.ro_totals(p_ro);
  if p_status = 'invoiced' then update public.repair_orders set status = 'invoiced', invoiced_at = now() where id = p_ro;
  elsif p_status = 'paid' then perform public.require(r.shop_id, 'payments', 'Recording a payment'); update public.repair_orders set status = 'paid', paid_at = now(), paid_method = coalesce(p_method, ''), paid_cents = coalesce(p_paid_cents, (t->>'total')::int), invoiced_at = coalesce(invoiced_at, now()) where id = p_ro;
  elsif p_status = 'void' then perform public.require(r.shop_id, 'void', 'Voiding an invoice'); update public.repair_orders set status = 'void' where id = p_ro;
  elsif p_status = 'open' then if r.status = 'paid' then perform public.require(r.shop_id, 'edit_paid', 'Reopening a paid invoice'); end if; update public.repair_orders set status = 'open', invoiced_at = null, paid_at = null, paid_cents = 0 where id = p_ro;
  else raise exception 'Unknown status.';
  end if;
end $$;

-- Discounts and payments by permission.
create or replace function public.ro_lines_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare st text;
begin
  if tg_op in ('INSERT', 'UPDATE') and new.kind = 'discount' then perform public.require(new.shop_id, 'discount', 'A discount'); end if;
  select status into st from public.repair_orders where id = coalesce(new.ro_id, old.ro_id);
  if st = 'paid' and auth.uid() is not null then perform public.require(coalesce(new.shop_id, old.shop_id), 'edit_paid', 'Changing a paid invoice'); end if;
  return coalesce(new, old);
end $$;
drop trigger if exists ro_lines_guard on public.ro_lines;
create trigger ro_lines_guard before insert or update or delete on public.ro_lines for each row execute function public.ro_lines_guard();

create or replace function public.payments_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.amount_cents > 0 then perform public.require(new.shop_id, 'payments', 'Taking a payment'); end if;
  return new;
end $$;
drop trigger if exists payments_guard on public.payments;
create trigger payments_guard before insert on public.payments for each row execute function public.payments_guard();

-- ---- activity log ----
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  shop_id    text not null default 'ryguys',
  user_id    uuid,
  who        text not null default '',
  action     text not null,                 -- e.g. ro.paid, appointment.cancelled, line.added
  entity     text not null,                 -- table
  entity_id  uuid,
  ref        text not null default '',      -- RO 1042, Sarah Mitchell …
  summary    text not null default '',
  before     jsonb,
  after      jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_shop_time on public.audit_log (shop_id, created_at desc);
create index if not exists audit_entity on public.audit_log (entity, entity_id);
alter table public.audit_log enable row level security;
drop policy if exists "staff read" on public.audit_log;
create policy "staff read" on public.audit_log for select using (public.is_staff(shop_id) and public.my_role(shop_id) in ('owner', 'advisor'));
grant select on public.audit_log to authenticated;

create or replace function public.audit_who() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select name from public.shop_members where user_id = auth.uid() limit 1), case when auth.uid() is null then 'System' else 'Staff' end)
$$;

create or replace function public.audit(p_shop text, p_action text, p_entity text, p_id uuid, p_ref text, p_summary text, p_before jsonb default null, p_after jsonb default null) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_log (shop_id, user_id, who, action, entity, entity_id, ref, summary, before, after)
  values (p_shop, auth.uid(), public.audit_who(), p_action, p_entity, p_id, coalesce(p_ref, ''), coalesce(p_summary, ''), p_before, p_after)
$$;

create or replace function public.money_txt(c int) returns text language sql immutable as $$ select '$' || to_char(coalesce(c, 0) / 100.0, 'FM999,990.00') $$;

create or replace function public.audit_ro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.audit(new.shop_id, 'ro.' || new.status, 'repair_orders', new.id, 'RO ' || new.number,
      case new.status when 'paid' then 'Paid ' || public.money_txt(new.paid_cents) || ' · ' || new.paid_method when 'void' then 'Voided' when 'invoiced' then 'Invoice sent' when 'open' then 'Reopened' else new.status end,
      jsonb_build_object('status', old.status), jsonb_build_object('status', new.status, 'paid_cents', new.paid_cents));
  elsif tg_op = 'INSERT' then perform public.audit(new.shop_id, 'ro.opened', 'repair_orders', new.id, 'RO ' || new.number, 'RO started');
  end if;
  return new;
end $$;
drop trigger if exists audit_ro on public.repair_orders;
create trigger audit_ro after insert or update of status on public.repair_orders for each row execute function public.audit_ro();

create or replace function public.audit_lines() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; r record;
begin
  r := coalesce(new, old);
  select number into n from public.repair_orders where id = r.ro_id;
  if tg_op = 'INSERT' then perform public.audit(new.shop_id, 'line.added', 'ro_lines', new.id, 'RO ' || n, new.kind || ' · ' || new.description || ' · ' || public.money_txt(round(new.qty * new.unit_cents)::int), null, to_jsonb(new));
  elsif tg_op = 'DELETE' then perform public.audit(old.shop_id, 'line.removed', 'ro_lines', old.id, 'RO ' || n, old.kind || ' · ' || old.description || ' · ' || public.money_txt(round(old.qty * old.unit_cents)::int), to_jsonb(old), null);
  elsif new.unit_cents <> old.unit_cents or new.qty <> old.qty then perform public.audit(new.shop_id, 'line.priced', 'ro_lines', new.id, 'RO ' || n, new.description || ' · ' || public.money_txt(round(old.qty * old.unit_cents)::int) || ' → ' || public.money_txt(round(new.qty * new.unit_cents)::int), to_jsonb(old), to_jsonb(new));
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists audit_lines on public.ro_lines;
create trigger audit_lines after insert or update of unit_cents, qty or delete on public.ro_lines for each row execute function public.audit_lines();

create or replace function public.audit_payments() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select number into n from public.repair_orders where id = new.ro_id;
  perform public.audit(new.shop_id, case when new.amount_cents < 0 then 'payment.refund' else 'payment.taken' end, 'payments', new.id, 'RO ' || coalesce(n::text, '?'),
    (case when new.amount_cents < 0 then 'Refund ' else '' end) || public.money_txt(abs(new.amount_cents)) || ' · ' || new.method || case when new.reference <> '' then ' · ' || new.reference else '' end || case when new.note <> '' then ' · ' || new.note else '' end, null, to_jsonb(new));
  return new;
end $$;
drop trigger if exists audit_payments on public.payments;
create trigger audit_payments after insert on public.payments for each row execute function public.audit_payments();

create or replace function public.audit_appointments() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select coalesce(c.name, 'Walk-in') into who from public.customers c where c.id = new.customer_id;
  if tg_op = 'INSERT' then perform public.audit(new.shop_id, 'visit.booked', 'appointments', new.id, who, coalesce(new.job, 'Service') || ' · ' || to_char(new.starts_at at time zone 'America/Denver', 'Mon FMDD FMHH12:MI AM') || ' · ' || new.source);
  elsif new.status is distinct from old.status then perform public.audit(new.shop_id, 'visit.' || new.status, 'appointments', new.id, who, coalesce(new.job, 'Service') || ' · ' || replace(new.status, '_', ' '), jsonb_build_object('status', old.status), jsonb_build_object('status', new.status));
  elsif new.starts_at is distinct from old.starts_at then perform public.audit(new.shop_id, 'visit.moved', 'appointments', new.id, who, to_char(old.starts_at at time zone 'America/Denver', 'Mon FMDD FMHH12:MI AM') || ' → ' || to_char(new.starts_at at time zone 'America/Denver', 'Mon FMDD FMHH12:MI AM'));
  end if;
  return new;
end $$;
drop trigger if exists audit_appointments on public.appointments;
create trigger audit_appointments after insert or update of status, starts_at on public.appointments for each row execute function public.audit_appointments();

create or replace function public.audit_findings() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select coalesce(c.name, 'Walk-in') into who from public.appointments a left join public.customers c on c.id = a.customer_id where a.id = new.appointment_id;
  if tg_op = 'INSERT' and new.source <> 'booked' then perform public.audit(new.shop_id, 'job.sent', 'findings', new.id, who, new.name || ' · ' || public.money_txt(new.price_cents) || case when new.status = 'approved' then ' · added as approved' else '' end);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then perform public.audit(new.shop_id, 'job.' || new.status, 'findings', new.id, who, new.name || ' · ' || public.money_txt(new.price_cents), jsonb_build_object('status', old.status), jsonb_build_object('status', new.status));
  end if;
  return new;
end $$;
drop trigger if exists audit_findings on public.findings;
create trigger audit_findings after insert or update of status on public.findings for each row execute function public.audit_findings();

create or replace function public.audit_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if new.reason in ('adjust', 'count', 'returned') then
    select coalesce(nullif(brand, '') || ' ', '') || name into nm from public.parts where id = new.part_id;
    perform public.audit(new.shop_id, 'stock.' || new.reason, 'parts', new.part_id, nm, (case when new.qty > 0 then '+' else '' end) || new.qty::text || case when new.note <> '' then ' · ' || new.note else '' end);
  end if;
  return new;
end $$;
drop trigger if exists audit_stock on public.stock_moves;
create trigger audit_stock after insert on public.stock_moves for each row execute function public.audit_stock();

create or replace function public.audit_shop() returns trigger
language plpgsql security definer set search_path = public as $$
declare changed text[] := '{}'; k text;
begin
  for k in select key from jsonb_each(to_jsonb(new)) loop
    if to_jsonb(new)->k is distinct from to_jsonb(old)->k then changed := changed || k; end if;
  end loop;
  if array_length(changed, 1) > 0 then perform public.audit(new.shop_id, 'settings.changed', 'shops', null, new.name, array_to_string(changed, ', '), null, null); end if;
  return new;
end $$;
drop trigger if exists audit_shop on public.shops;
create trigger audit_shop after update on public.shops for each row execute function public.audit_shop();

create or replace function public.audit_customers() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then perform public.audit(old.shop_id, 'customer.deleted', 'customers', old.id, old.name, 'Customer removed', to_jsonb(old), null); return old; end if;
  if tg_op = 'UPDATE' and (new.charge_account is distinct from old.charge_account or new.credit_limit_cents is distinct from old.credit_limit_cents) then
    perform public.audit(new.shop_id, 'customer.account', 'customers', new.id, new.name, case when new.charge_account then 'Charge account on · limit ' || public.money_txt(new.credit_limit_cents) else 'Charge account off' end);
  end if;
  return new;
end $$;
drop trigger if exists audit_customers on public.customers;
create trigger audit_customers after update of charge_account, credit_limit_cents or delete on public.customers for each row execute function public.audit_customers();

create or replace function public.audit_credits() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select name into who from public.customers where id = new.customer_id;
  perform public.audit(new.shop_id, 'credit.' || new.kind, 'customer_credits', new.id, who, (case when new.amount_cents > 0 then '+' else '' end) || public.money_txt(new.amount_cents) || case when new.note <> '' then ' · ' || new.note else '' end);
  return new;
end $$;
drop trigger if exists audit_credits on public.customer_credits;
create trigger audit_credits after insert on public.customer_credits for each row execute function public.audit_credits();

-- Deleting a customer is a permission too.
create or replace function public.customers_delete_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then perform public.require(old.shop_id, 'delete_customer', 'Deleting a customer'); end if;
  return old;
end $$;
drop trigger if exists customers_delete_guard on public.customers;
create trigger customers_delete_guard before delete on public.customers for each row execute function public.customers_delete_guard();

-- ---- history import ----
-- Repair orders from the old system: a done visit per RO with a paid invoice carrying the total,
-- declined work as declined jobs (so follow-ups and reminders start right).
create or replace function public.import_history(p_rows jsonb, p_source text default 'tekmetric') returns jsonb
language plpgsql security definer set search_path = public as $$
declare sid text := 'ryguys'; row jsonb; cid uuid; vid uuid; aid uuid; rid uuid; n_visits int := 0; n_skipped int := 0; n_declined int := 0; ph text; nm text; when_at timestamptz; total int; ext text; parts text[]; d jsonb; mileage int; yr int;
begin
  if not public.is_staff(sid) then raise exception 'Not allowed.'; end if;
  for row in select * from jsonb_array_elements(p_rows) loop
    ext := coalesce(row->>'external_id', '');
    when_at := nullif(row->>'date', '')::timestamptz;
    if when_at is null then n_skipped := n_skipped + 1; continue; end if;
    if ext <> '' and exists (select 1 from public.appointments where shop_id = sid and notes like '%[' || p_source || ' ' || ext || ']%') then n_skipped := n_skipped + 1; continue; end if;
    ph := right(regexp_replace(coalesce(row->>'phone', ''), '\D', '', 'g'), 10); nm := trim(coalesce(row->>'name', ''));
    cid := null;
    if length(ph) = 10 then select id into cid from public.customers where shop_id = sid and phone = ph order by created_at limit 1; end if;
    if cid is null and nm <> '' then select id into cid from public.customers where shop_id = sid and lower(name) = lower(nm) order by created_at limit 1; end if;
    if cid is null then
      if nm = '' then n_skipped := n_skipped + 1; continue; end if;
      insert into public.customers (shop_id, name, phone, source) values (sid, nm, case when length(ph) = 10 then ph else '' end, p_source) returning id into cid;
    end if;
    -- vehicle: VIN, then plate, then year/make/model
    vid := null;
    if coalesce(row->>'vin', '') <> '' then select id into vid from public.customer_vehicles where customer_id = cid and upper(vin) = upper(row->>'vin') limit 1; end if;
    if vid is null and coalesce(row->>'plate', '') <> '' then select id into vid from public.customer_vehicles where customer_id = cid and upper(plate) = upper(row->>'plate') limit 1; end if;
    yr := nullif(regexp_replace(coalesce(row->>'year', ''), '\D', '', 'g'), '')::int;
    if vid is null and coalesce(row->>'make', '') <> '' then select id into vid from public.customer_vehicles where customer_id = cid and lower(make) = lower(row->>'make') and lower(model) = lower(coalesce(row->>'model', '')) and (yr is null or year = yr) limit 1; end if;
    if vid is null and (coalesce(row->>'make', '') <> '' or coalesce(row->>'vin', '') <> '') then
      insert into public.customer_vehicles (shop_id, customer_id, year, make, model, plate, vin) values (sid, cid, yr, coalesce(row->>'make', ''), coalesce(row->>'model', ''), upper(coalesce(row->>'plate', '')), upper(coalesce(row->>'vin', ''))) returning id into vid;
    end if;
    mileage := nullif(regexp_replace(coalesce(row->>'odometer', ''), '\D', '', 'g'), '')::int;
    total := round(coalesce(nullif(regexp_replace(coalesce(row->>'total', ''), '[^0-9.\-]', '', 'g'), ''), '0')::numeric * 100)::int;
    insert into public.appointments (shop_id, customer_id, vehicle_id, starts_at, job, visit, status, done_at, pickup, pickup_at, tech_id, notes, source, created_at)
    values (sid, cid, vid, when_at, left(coalesce(nullif(row->>'job', ''), 'Service'), 200), 'dropoff', 'done', when_at + interval '3 hours', 'picked_up', when_at + interval '4 hours', null,
            trim(coalesce(row->>'notes', '') || case when ext <> '' then ' [' || p_source || ' ' || ext || ']' else '' end), p_source, when_at) returning id into aid;
    if total > 0 then
      insert into public.repair_orders (shop_id, appointment_id, status, tax_rate_bp, created_at) values (sid, aid, 'open', 0, when_at) returning id into rid;
      insert into public.ro_lines (shop_id, ro_id, kind, description, qty, unit_cents, taxable, sort, created_at) values (sid, rid, 'labor', coalesce(nullif(row->>'job', ''), 'Imported invoice') || ' (from ' || p_source || ', tax included)', 1, total, false, 100, when_at);
      insert into public.payments (shop_id, ro_id, customer_id, method, amount_cents, note, created_at) values (sid, rid, cid, 'other', total, 'Imported from ' || p_source, when_at);
      update public.repair_orders set status = 'paid', invoiced_at = when_at, paid_at = when_at, paid_method = 'imported', paid_cents = total where id = rid;
    end if;
    for d in select * from jsonb_array_elements(coalesce(row->'declined', '[]'::jsonb)) loop
      if coalesce(d->>'name', '') <> '' then
        insert into public.findings (shop_id, appointment_id, tier, name, plain, price_cents, status, decided_at, created_at, source, fu_status)
        values (sid, aid, 'soon', left(d->>'name', 200), '', round(coalesce(nullif(regexp_replace(coalesce(d->>'price', ''), '[^0-9.]', '', 'g'), ''), '0')::numeric * 100)::int, 'declined', when_at, when_at, 'writer', 'open');
        n_declined := n_declined + 1;
      end if;
    end loop;
    update public.customers set last_visit_at = greatest(coalesce(last_visit_at, when_at::date), when_at::date) where id = cid;
    if vid is not null then update public.customer_vehicles set last_visit_at = greatest(coalesce(last_visit_at, when_at::date), when_at::date), last_service = case when coalesce(last_visit_at, '1900-01-01') <= when_at::date then coalesce(nullif(row->>'job', ''), last_service) else last_service end, odometer = case when mileage is not null and (odometer is null or coalesce(last_visit_at, '1900-01-01') <= when_at::date) then greatest(coalesce(odometer, 0), mileage) else odometer end where id = vid; end if;
    n_visits := n_visits + 1;
  end loop;
  return jsonb_build_object('visits', n_visits, 'declined', n_declined, 'skipped', n_skipped);
end $$;
grant execute on function public.import_history(jsonb, text) to authenticated;

-- ---- duplicates ----
create or replace function public.duplicate_customers(p_shop text) returns jsonb
language sql stable security definer set search_path = public as $$
  with d as (
    select c.phone as key, 'phone' as kind, jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'phone', c.phone, 'vehicles', (select count(*) from public.customer_vehicles v where v.customer_id = c.id), 'visits', (select count(*) from public.appointments a where a.customer_id = c.id), 'created_at', c.created_at) order by c.created_at) as rows
    from public.customers c where c.shop_id = p_shop and c.phone <> '' group by c.phone having count(*) > 1
    union all
    select lower(c.name) as key, 'name' as kind, jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'phone', c.phone, 'vehicles', (select count(*) from public.customer_vehicles v where v.customer_id = c.id), 'visits', (select count(*) from public.appointments a where a.customer_id = c.id), 'created_at', c.created_at) order by c.created_at) as rows
    from public.customers c where c.shop_id = p_shop and c.name <> '' group by lower(c.name) having count(*) > 1 and count(distinct c.phone) > 1
  )
  select coalesce(jsonb_agg(jsonb_build_object('key', key, 'kind', kind, 'rows', rows)), '[]'::jsonb) from d where public.is_staff(p_shop)
$$;
grant execute on function public.duplicate_customers(text) to authenticated;

create or replace function public.merge_customers(p_keep uuid, p_drop uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.customers; d public.customers; v record;
begin
  select * into k from public.customers where id = p_keep; select * into d from public.customers where id = p_drop;
  if k.id is null or d.id is null or k.shop_id <> d.shop_id or not public.is_staff(k.shop_id) then raise exception 'Not allowed.'; end if;
  -- vehicles: move, except an exact duplicate (same VIN or plate or year/make/model) which is folded in
  for v in select * from public.customer_vehicles where customer_id = p_drop loop
    if exists (select 1 from public.customer_vehicles x where x.customer_id = p_keep and ((v.vin <> '' and upper(x.vin) = upper(v.vin)) or (v.plate <> '' and upper(x.plate) = upper(v.plate)) or (lower(x.make) = lower(v.make) and lower(x.model) = lower(v.model) and x.year is not distinct from v.year))) then
      update public.appointments set vehicle_id = (select x.id from public.customer_vehicles x where x.customer_id = p_keep and ((v.vin <> '' and upper(x.vin) = upper(v.vin)) or (v.plate <> '' and upper(x.plate) = upper(v.plate)) or (lower(x.make) = lower(v.make) and lower(x.model) = lower(v.model) and x.year is not distinct from v.year)) limit 1) where vehicle_id = v.id;
      delete from public.customer_vehicles where id = v.id;
    else update public.customer_vehicles set customer_id = p_keep where id = v.id; end if;
  end loop;
  update public.appointments set customer_id = p_keep where customer_id = p_drop;
  update public.messages set customer_id = p_keep where customer_id = p_drop;
  update public.sms_messages set customer_id = p_keep where customer_id = p_drop;
  update public.payments set customer_id = p_keep where customer_id = p_drop;
  update public.customer_credits set customer_id = p_keep where customer_id = p_drop;
  update public.rentals set customer_id = p_keep where customer_id = p_drop;
  update public.customers set phone = case when phone = '' then d.phone else phone end, email = case when email = '' then d.email else email end, city = case when city = '' then d.city else city end,
    notes = trim(both from notes || case when d.notes <> '' then E'\n' || d.notes else '' end), tags = (select coalesce(array_agg(distinct t), '{}') from unnest(tags || d.tags) t),
    last_visit_at = greatest(coalesce(last_visit_at, '1900-01-01'), coalesce(d.last_visit_at, '1900-01-01')), joined_at = coalesce(joined_at, d.joined_at), external_id = case when external_id = '' then d.external_id else external_id end
    where id = p_keep;
  perform public.audit(k.shop_id, 'customer.merged', 'customers', p_keep, k.name, 'Merged in ' || d.name || case when d.phone <> '' then ' · ' || d.phone else '' end, to_jsonb(d), null);
  delete from public.customers where id = p_drop;
end $$;
grant execute on function public.merge_customers(uuid, uuid) to authenticated;

-- Looking someone up before creating them (booking, check-in): by phone, plate or VIN.
create or replace function public.find_customer(p_shop text, p_phone text default '', p_plate text default '', p_vin text default '') returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(distinct jsonb_build_object('id', c.id, 'name', c.name, 'phone', c.phone, 'vehicle', (select trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) from public.customer_vehicles v where v.customer_id = c.id order by v.created_at desc limit 1))), '[]'::jsonb)
  from public.customers c
  where c.shop_id = p_shop and public.is_staff(p_shop) and (
    (length(regexp_replace(p_phone, '\D', '', 'g')) >= 7 and c.phone like '%' || right(regexp_replace(p_phone, '\D', '', 'g'), 7))
    or (p_plate <> '' and exists (select 1 from public.customer_vehicles v where v.customer_id = c.id and upper(v.plate) = upper(trim(p_plate))))
    or (length(p_vin) >= 11 and exists (select 1 from public.customer_vehicles v where v.customer_id = c.id and upper(v.vin) = upper(trim(p_vin)))))
$$;
grant execute on function public.find_customer(text, text, text, text) to authenticated;
