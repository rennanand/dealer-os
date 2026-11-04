-- Warranty jobs and PO numbers, the waitlist, technician pay and commission, fleet accounts,
-- transactional email (receipts, estimate links, review requests), marketing segments and
-- campaigns, and the Carfax service-history export.

-- ---- warranty & PO ----
alter table public.repair_orders add column if not exists po_number text not null default '';
alter table public.ro_lines add column if not exists warranty boolean not null default false;      -- done at no charge under warranty
alter table public.findings add column if not exists warranty boolean not null default false;

create or replace function public.findings_to_ro() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid; l jsonb; n int := 0;
begin
  if new.status in ('approved', 'done') then
    select id into rid from public.repair_orders where appointment_id = new.appointment_id;
    if rid is null then
      insert into public.repair_orders (shop_id, appointment_id, tax_rate_bp) select new.shop_id, new.appointment_id, coalesce((select tax_rate_bp from public.shops where shop_id = new.shop_id), 725) returning id into rid;
    end if;
    if exists (select 1 from public.ro_lines where finding_id = new.id) then
      if jsonb_array_length(new.lines) = 0 then
        update public.ro_lines set unit_cents = case when new.warranty then 0 else new.price_cents end, description = new.name, approved = true, warranty = new.warranty where finding_id = new.id;
      else
        update public.ro_lines set approved = true where finding_id = new.id;
      end if;
    elsif jsonb_array_length(new.lines) = 0 then
      insert into public.ro_lines (shop_id, ro_id, kind, description, qty, unit_cents, finding_id, approved, sort, warranty)
      values (new.shop_id, rid, 'labor', new.name, 1, case when new.warranty then 0 else new.price_cents end, new.id, true, 100, new.warranty);
    else
      for l in select * from jsonb_array_elements(new.lines) loop
        n := n + 1;
        insert into public.ro_lines (shop_id, ro_id, kind, description, qty, unit_cents, cost_cents, part_number, vendor, finding_id, approved, taxable, sort, part_id, status, warranty)
        values (new.shop_id, rid, coalesce(l->>'kind', 'labor'), coalesce(l->>'description', new.name), coalesce((l->>'qty')::numeric, 1), case when new.warranty then 0 else coalesce((l->>'unit_cents')::int, 0) end, coalesce((l->>'cost_cents')::int, 0),
                coalesce(l->>'part_number', ''), coalesce(l->>'vendor', ''), new.id, true, coalesce(l->>'kind', 'labor') <> 'discount',
                case when coalesce(l->>'kind', 'labor') = 'labor' then 100 when l->>'kind' = 'part' then 200 else 300 end + n,
                nullif(l->>'part_id', '')::uuid, case when l->>'kind' = 'part' and nullif(l->>'part_id', '') is null then 'need' else '' end, new.warranty);
      end loop;
    end if;
  elsif new.status = 'declined' then
    delete from public.ro_lines where finding_id = new.id;
  end if;
  return new;
end $$;

-- ---- waitlist ----
create table if not exists public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null default 'ryguys',
  customer_id  uuid references public.customers (id) on delete cascade,
  vehicle_id   uuid references public.customer_vehicles (id) on delete set null,
  service      text not null default '',
  earliest     date,
  notes        text not null default '',
  status       text not null default 'waiting' check (status in ('waiting', 'offered', 'booked', 'closed')),
  offered_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists waitlist_shop on public.waitlist (shop_id, status);
alter table public.waitlist enable row level security;
drop policy if exists "staff all" on public.waitlist;
create policy "staff all" on public.waitlist for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.waitlist to authenticated;

-- ---- technician pay ----
alter table public.technicians
  add column if not exists pay_type text not null default 'hourly' check (pay_type in ('hourly', 'flat_rate', 'commission', 'salary')),
  add column if not exists pay_rate_cents int not null default 0,          -- hourly or flat-rate $/hour
  add column if not exists commission_pct numeric(5,2) not null default 0;   -- % of labor sales (commission)

create or replace function public.payroll_report(p_shop text, p_from timestamptz, p_to timestamptz) returns jsonb
language sql stable security definer set search_path = public as $$
  with closed as (select r.id, a.tech_id, public.ro_totals(r.id) as t from public.repair_orders r join public.appointments a on a.id = r.appointment_id
                  where r.shop_id = p_shop and r.status = 'paid' and r.paid_at >= p_from and r.paid_at < p_to),
  jobs as (select f.id, f.appointment_id, unnest(f.techs) as tech_id, (select coalesce(sum(round(l.qty * l.unit_cents)), 0)::int from public.ro_lines l where l.finding_id = f.id and l.kind = 'labor') as labor_cents,
                  (select coalesce(sum(l.qty), 0) from public.ro_lines l where l.finding_id = f.id and l.kind = 'labor') as hours
           from public.findings f join public.appointments a on a.id = f.appointment_id join public.repair_orders r on r.appointment_id = a.id
           where f.shop_id = p_shop and f.status in ('approved', 'done') and r.status = 'paid' and r.paid_at >= p_from and r.paid_at < p_to),
  per as (select t.id, t.name, t.pay_type, t.pay_rate_cents, t.commission_pct,
            (select coalesce(sum(extract(epoch from (coalesce(e.ended_at, now()) - e.started_at))) / 3600.0, 0) from public.time_entries e where e.tech_id = t.id and e.started_at >= p_from and e.started_at < p_to) as clock_hours,
            (select coalesce(sum((c.t->>'labor_hours')::numeric), 0) from closed c where c.tech_id = t.id) + (select coalesce(sum(j.hours), 0) from jobs j where j.tech_id = t.id and not exists (select 1 from closed c where c.tech_id = t.id and c.id = (select id from public.repair_orders where appointment_id = j.appointment_id))) as billed_hours,
            (select coalesce(sum((c.t->>'labor')::int), 0) from closed c where c.tech_id = t.id) + (select coalesce(sum(j.labor_cents), 0) from jobs j where j.tech_id = t.id and not exists (select 1 from closed c where c.tech_id = t.id and c.id = (select id from public.repair_orders where appointment_id = j.appointment_id))) as labor_cents
          from public.technicians t where t.shop_id = p_shop and t.active)
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'pay_type', pay_type, 'pay_rate_cents', pay_rate_cents, 'commission_pct', commission_pct, 'clock_hours', round(clock_hours::numeric, 2), 'billed_hours', round(billed_hours::numeric, 2), 'labor_cents', labor_cents,
    'pay_cents', case pay_type when 'hourly' then round(clock_hours * pay_rate_cents)::int when 'flat_rate' then round(billed_hours * pay_rate_cents)::int when 'commission' then round(labor_cents * commission_pct / 100.0)::int else 0 end) order by name), '[]'::jsonb)
  from per where public.is_staff(p_shop) and public.can(p_shop, 'reports')
$$;
grant execute on function public.payroll_report(text, timestamptz, timestamptz) to authenticated;

-- ---- fleet accounts ----
create table if not exists public.fleets (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  name           text not null,
  contact        text not null default '',
  phone          text not null default '',
  email          text not null default '',
  po_required    boolean not null default false,
  terms_days     int not null default 30,
  labor_rate_cents int,                                    -- null = shop rate
  parts_discount_pct numeric(5,2) not null default 0,
  notes          text not null default '',
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
alter table public.fleets enable row level security;
drop policy if exists "staff all" on public.fleets;
create policy "staff all" on public.fleets for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.fleets to authenticated;
alter table public.customers add column if not exists fleet_id uuid references public.fleets (id) on delete set null;
alter table public.customer_vehicles add column if not exists unit text not null default '';   -- fleet unit number

-- A fleet is a charge account by nature: every customer on it may leave with a balance.
create or replace function public.fleet_customer_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.fleet_id is not null and (old.fleet_id is distinct from new.fleet_id) then
    new.charge_account := true; new.terms_days := coalesce((select terms_days from public.fleets where id = new.fleet_id), 30);
  end if;
  return new;
end $$;
drop trigger if exists fleet_customer_sync on public.customers;
create trigger fleet_customer_sync before update of fleet_id on public.customers for each row execute function public.fleet_customer_sync();

create or replace function public.fleet_statement(p_fleet uuid, p_from date, p_to date) returns jsonb
language sql stable security definer set search_path = public as $$
  with f as (select * from public.fleets where id = p_fleet),
  inv as (select r.id, r.number, r.po_number, r.status, r.paid_at, r.invoiced_at, a.starts_at, a.job, v.unit, trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) as vehicle, v.plate, v.odometer, c.name as driver,
                 (public.ro_totals(r.id)->>'total')::int as total, public.ro_paid(r.id) as paid
          from public.repair_orders r join public.appointments a on a.id = r.appointment_id join public.customers c on c.id = a.customer_id left join public.customer_vehicles v on v.id = a.vehicle_id
          where c.fleet_id = p_fleet and r.status in ('invoiced', 'paid') and coalesce(r.invoiced_at, r.paid_at) >= p_from and coalesce(r.invoiced_at, r.paid_at) < p_to + 1)
  select jsonb_build_object('fleet', (select jsonb_build_object('id', id, 'name', name, 'contact', contact, 'phone', phone, 'email', email, 'terms_days', terms_days, 'po_required', po_required) from f), 'from', p_from, 'to', p_to,
    'invoices', (select coalesce(jsonb_agg(to_jsonb(inv) order by starts_at), '[]'::jsonb) from inv),
    'total', (select coalesce(sum(total), 0) from inv), 'paid', (select coalesce(sum(paid), 0) from inv), 'balance', (select coalesce(sum(total - paid), 0) from inv),
    'open_balance', (select coalesce(sum((public.ro_totals(r.id)->>'total')::int - public.ro_paid(r.id)), 0) from public.repair_orders r join public.appointments a on a.id = r.appointment_id join public.customers c on c.id = a.customer_id where c.fleet_id = p_fleet and r.status = 'invoiced'))
  where exists (select 1 from f where public.is_staff(f.shop_id))
$$;
grant execute on function public.fleet_statement(uuid, date, date) to authenticated;

-- ---- email ----
create table if not exists public.emails (
  id          uuid primary key default gen_random_uuid(),
  shop_id     text not null default 'ryguys',
  customer_id uuid references public.customers (id) on delete set null,
  to_email    text not null,
  subject     text not null,
  html        text not null,
  kind        text not null default 'manual',     -- receipt | estimate | review | campaign | statement | manual
  ref_id      uuid,
  status      text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'manual', 'cancelled')),
  provider_id text not null default '',
  error       text not null default '',
  sent_at     timestamptz,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now()
);
create index if not exists emails_shop_time on public.emails (shop_id, created_at desc);
alter table public.emails enable row level security;
drop policy if exists "staff all" on public.emails;
create policy "staff all" on public.emails for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.emails to authenticated;

create or replace function public.send_email(p_customer uuid, p_to text, p_subject text, p_html text, p_kind text default 'manual', p_ref uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid text := 'ryguys'; mid uuid; url text; secret text; st text;
begin
  if p_customer is not null then select shop_id into sid from public.customers where id = p_customer; end if;
  if not public.is_staff(sid) then raise exception 'Not allowed.'; end if;
  if p_to !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email address does not look right.'; end if;
  select value into url from public.app_config where key = 'email_url';
  select value into secret from public.app_config where key = 'push_secret';
  st := case when url is null then 'manual' else 'queued' end;
  insert into public.emails (shop_id, customer_id, to_email, subject, html, kind, ref_id, status, created_by) values (sid, p_customer, lower(trim(p_to)), p_subject, p_html, p_kind, p_ref, st, auth.uid()) returning id into mid;
  if st = 'queued' then perform net.http_post(url := url, headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', coalesce(secret, '')), body := jsonb_build_object('id', mid)); end if;
  return mid;
end $$;
grant execute on function public.send_email(uuid, text, text, text, text, uuid) to authenticated;

-- The receipt as HTML, for email and for printing — one source.
create or replace function public.receipt_html(p_ro uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare r public.repair_orders; a public.appointments; c public.customers; v public.customer_vehicles; sh public.shops; t jsonb; l record; rows text := ''; paid int; pays text := ''; p record;
begin
  select * into r from public.repair_orders where id = p_ro;
  if r.id is null or not public.is_staff(r.shop_id) then return ''; end if;
  select * into a from public.appointments where id = r.appointment_id; select * into c from public.customers where id = a.customer_id; select * into v from public.customer_vehicles where id = a.vehicle_id; select * into sh from public.shops where shop_id = r.shop_id;
  t := public.ro_totals(p_ro); paid := public.ro_paid(p_ro);
  for l in select * from public.ro_lines where ro_id = p_ro and approved order by sort, created_at loop
    rows := rows || '<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:.06em;width:64px">' || l.kind || '</td><td style="padding:8px 0;border-bottom:1px solid #eee">' || l.description || case when l.qty <> 1 then ' <span style="color:#888">× ' || l.qty || '</span>' else '' end || case when l.warranty then ' <span style="color:#1a7f37">warranty</span>' else '' end || '</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums">' || case when l.kind = 'discount' then '-' else '' end || public.money_txt(round(l.qty * l.unit_cents)::int) || '</td></tr>';
  end loop;
  for p in select * from public.payments where ro_id = p_ro order by created_at loop
    pays := pays || '<div style="display:flex;justify-content:space-between;font-size:13px;color:#1a7f37;padding:3px 0"><span>' || case when p.amount_cents < 0 then 'Refund · ' else 'Paid · ' end || p.method || case when p.reference <> '' then ' · ' || p.reference else '' end || ' · ' || to_char(p.created_at at time zone 'America/Denver', 'Mon FMDD, YYYY') || '</span><span>' || public.money_txt(p.amount_cents) || '</span></div>';
  end loop;
  return '<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111"><div style="max-width:560px;margin:0 auto;padding:28px 20px">'
    || '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#888">' || sh.name || '</div>'
    || '<div style="font-size:24px;font-weight:600;margin-top:6px">' || case when r.status = 'paid' then 'Receipt' else 'Invoice' end || ' · RO ' || r.number || case when r.po_number <> '' then ' · PO ' || r.po_number else '' end || '</div>'
    || '<div style="font-size:13px;color:#666;margin-top:4px">' || coalesce(c.name, '') || case when v.id is not null then ' · ' || trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) || case when v.plate <> '' then ' · ' || v.plate else '' end || case when v.odometer is not null then ' · ' || v.odometer || ' mi' else '' end else '' end || ' · ' || to_char(coalesce(r.paid_at, r.invoiced_at, r.created_at) at time zone 'America/Denver', 'Mon FMDD, YYYY') || '</div>'
    || '<div style="background:#fff;border-radius:12px;padding:16px 18px;margin-top:18px"><table style="width:100%;border-collapse:collapse;font-size:14px">' || rows || '</table>'
    || '<div style="display:flex;justify-content:space-between;font-size:13px;color:#666;padding:10px 0 2px"><span>Subtotal</span><span>' || public.money_txt((t->>'subtotal')::int) || '</span></div>'
    || '<div style="display:flex;justify-content:space-between;font-size:13px;color:#666;padding:2px 0"><span>Tax</span><span>' || public.money_txt((t->>'tax')::int) || '</span></div>'
    || '<div style="display:flex;justify-content:space-between;font-size:18px;font-weight:600;padding:10px 0 0;border-top:1px solid #ddd;margin-top:8px"><span>Total</span><span>' || public.money_txt((t->>'total')::int) || '</span></div>' || pays
    || case when (t->>'total')::int - paid > 0 then '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;padding:6px 0 0"><span>Due</span><span>' || public.money_txt((t->>'total')::int - paid) || '</span></div>' else '' end || '</div>'
    || '<div style="font-size:12px;color:#888;margin-top:18px;line-height:1.5">' || coalesce(sh.address, '') || case when sh.phone <> '' then ' · ' || sh.phone else '' end || '<br>Thank you for trusting us with your vehicle.</div>'
    || '</div></body></html>';
end $$;
grant execute on function public.receipt_html(uuid) to authenticated;

-- Email the receipt (or invoice) to the customer on file.
create or replace function public.email_receipt(p_ro uuid, p_to text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare r public.repair_orders; a public.appointments; c public.customers; addr text; sh public.shops;
begin
  select * into r from public.repair_orders where id = p_ro; select * into a from public.appointments where id = r.appointment_id; select * into c from public.customers where id = a.customer_id; select * into sh from public.shops where shop_id = r.shop_id;
  addr := coalesce(nullif(trim(p_to), ''), c.email);
  if addr is null or addr = '' then raise exception 'No email on file — add one on the customer card.'; end if;
  return public.send_email(c.id, addr, sh.name || ' · ' || case when r.status = 'paid' then 'Receipt' else 'Invoice' end || ' RO ' || r.number, public.receipt_html(p_ro), 'receipt', p_ro);
end $$;
grant execute on function public.email_receipt(uuid, text) to authenticated;

-- ---- marketing ----
create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  shop_id       text not null default 'ryguys',
  name          text not null,
  channel       text not null default 'text' check (channel in ('text', 'email')),
  segment       jsonb not null default '{}'::jsonb,   -- {due:true, lapsed_months:6, declined:true, tags:[], makes:[], min_visits:0, joined_days:0, min_spent_cents:0}
  subject       text not null default '',
  body          text not null default '',
  status        text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_for timestamptz,
  sent_at       timestamptz,
  sent_count    int not null default 0,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now()
);
alter table public.campaigns enable row level security;
drop policy if exists "staff all" on public.campaigns;
create policy "staff all" on public.campaigns for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.campaigns to authenticated;

create table if not exists public.campaign_sends (
  id          uuid primary key default gen_random_uuid(),
  shop_id     text not null default 'ryguys',
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  sms_id      uuid,
  email_id    uuid,
  created_at  timestamptz not null default now(),
  unique (campaign_id, customer_id)
);
alter table public.campaign_sends enable row level security;
drop policy if exists "staff all" on public.campaign_sends;
create policy "staff all" on public.campaign_sends for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select on public.campaign_sends to authenticated;

-- Who is in a segment. Marketing respects do_not_market and text/email availability.
create or replace function public.segment_customers(p_shop text, p_segment jsonb, p_channel text default 'text') returns jsonb
language sql stable security definer set search_path = public as $$
  with base as (
    select c.*, (select max(a.starts_at) from public.appointments a where a.customer_id = c.id and a.status = 'done') as last_done,
           (select count(*) from public.appointments a where a.customer_id = c.id and a.status = 'done') as visits,
           (select coalesce(sum((public.ro_totals(r.id)->>'total')::int), 0) from public.repair_orders r join public.appointments a on a.id = r.appointment_id where a.customer_id = c.id and r.status = 'paid') as spent,
           exists (select 1 from public.findings f join public.appointments a on a.id = f.appointment_id where a.customer_id = c.id and f.status = 'declined' and f.fu_status in ('open', 'reminded')) as has_declined,
           exists (select 1 from jsonb_array_elements(public.shop_reminders()) x where (x->>'customer_id')::uuid = c.id and x->>'status' = 'due') as is_due,
           (select array_agg(distinct lower(v.make)) from public.customer_vehicles v where v.customer_id = c.id) as makes
    from public.customers c where c.shop_id = p_shop and not c.do_not_market
      and ((p_channel = 'text' and c.phone <> '' and not c.sms_opt_out) or (p_channel = 'email' and c.email <> ''))
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'phone', phone, 'email', email, 'last', last_done, 'visits', visits, 'spent', spent) order by name), '[]'::jsonb)
  from base where public.is_staff(p_shop)
    and (coalesce((p_segment->>'due')::boolean, false) = false or is_due)
    and (coalesce((p_segment->>'declined')::boolean, false) = false or has_declined)
    and (coalesce((p_segment->>'lapsed_months')::int, 0) = 0 or last_done is null or last_done < now() - ((p_segment->>'lapsed_months')::int || ' months')::interval)
    and (coalesce((p_segment->>'active_months')::int, 0) = 0 or last_done >= now() - ((p_segment->>'active_months')::int || ' months')::interval)
    and (coalesce((p_segment->>'min_visits')::int, 0) = 0 or visits >= (p_segment->>'min_visits')::int)
    and (coalesce((p_segment->>'min_spent_cents')::int, 0) = 0 or spent >= (p_segment->>'min_spent_cents')::int)
    and (coalesce((p_segment->>'joined_days')::int, 0) = 0 or created_at >= now() - ((p_segment->>'joined_days')::int || ' days')::interval)
    and (coalesce(jsonb_array_length(p_segment->'tags'), 0) = 0 or tags && (select array_agg(x) from jsonb_array_elements_text(p_segment->'tags') x))
    and (coalesce(jsonb_array_length(p_segment->'makes'), 0) = 0 or makes && (select array_agg(lower(x)) from jsonb_array_elements_text(p_segment->'makes') x))
$$;
grant execute on function public.segment_customers(text, jsonb, text) to authenticated;

-- Send (or schedule) a campaign: one text or email per customer, filled per person, never twice.
create or replace function public.send_campaign(p_campaign uuid, p_when timestamptz default null) returns int
language plpgsql security definer set search_path = public as $$
declare cp public.campaigns; sh public.shops; x jsonb; body text; subj text; n int := 0; mid uuid; link text; first text;
begin
  select * into cp from public.campaigns where id = p_campaign;
  if cp.id is null or not public.is_staff(cp.shop_id) then raise exception 'Not allowed.'; end if;
  if cp.status in ('sent', 'sending') then raise exception 'This campaign already went out.'; end if;
  select * into sh from public.shops where shop_id = cp.shop_id;
  if p_when is not null and p_when > now() then update public.campaigns set status = 'scheduled', scheduled_for = p_when where id = p_campaign; return 0; end if;
  update public.campaigns set status = 'sending' where id = p_campaign;
  for x in select * from jsonb_array_elements(public.segment_customers(cp.shop_id, cp.segment, cp.channel)) loop
    if exists (select 1 from public.campaign_sends where campaign_id = p_campaign and customer_id = (x->>'id')::uuid) then continue; end if;
    first := split_part(x->>'name', ' ', 1); link := sh.public_url || '/book';
    body := replace(replace(replace(replace(replace(cp.body, '{first}', first), '{shop}', sh.name), '{link}', link), '{phone}', coalesce(sh.phone, '')), '{review}', coalesce(sh.review_url, ''));
    begin
      if cp.channel = 'text' then
        mid := public.send_sms((x->>'id')::uuid, body, 'campaign', null);
        insert into public.campaign_sends (shop_id, campaign_id, customer_id, sms_id) values (cp.shop_id, p_campaign, (x->>'id')::uuid, mid);
      else
        subj := replace(replace(cp.subject, '{first}', first), '{shop}', sh.name);
        mid := public.send_email((x->>'id')::uuid, x->>'email', subj, '<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;line-height:1.55;white-space:pre-line">' || body || '</div>', 'campaign', p_campaign);
        insert into public.campaign_sends (shop_id, campaign_id, customer_id, email_id) values (cp.shop_id, p_campaign, (x->>'id')::uuid, mid);
      end if;
      n := n + 1;
    exception when others then null;
    end;
  end loop;
  update public.campaigns set status = 'sent', sent_at = now(), sent_count = sent_count + n where id = p_campaign;
  return n;
end $$;
grant execute on function public.send_campaign(uuid, timestamptz) to authenticated;

-- Scheduled campaigns go out with the same sweep that sends scheduled texts.
create or replace function public.sms_send_due() returns int
language plpgsql security definer set search_path = public as $$
declare url text; secret text; m record; n int := 0; cp record;
begin
  select value into url from public.app_config where key = 'sms_url';
  select value into secret from public.app_config where key = 'push_secret';
  for m in select id from public.sms_messages where status = 'scheduled' and scheduled_for <= now() loop
    if url is null then update public.sms_messages set status = 'manual' where id = m.id;
    else update public.sms_messages set status = 'queued' where id = m.id; perform net.http_post(url := url, headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', coalesce(secret, '')), body := jsonb_build_object('id', m.id)); end if;
    n := n + 1;
  end loop;
  for cp in select id from public.campaigns where status = 'scheduled' and scheduled_for <= now() loop
    begin n := n + public.send_campaign(cp.id); exception when others then null; end;
  end loop;
  return n;
end $$;

-- Campaign results: sent, delivered, replies and visits booked in the 30 days after.
create or replace function public.campaign_results(p_campaign uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'sent', (select count(*) from public.campaign_sends s where s.campaign_id = p_campaign),
    'delivered', (select count(*) from public.campaign_sends s join public.sms_messages m on m.id = s.sms_id where s.campaign_id = p_campaign and m.status in ('sent', 'delivered')) + (select count(*) from public.campaign_sends s join public.emails e on e.id = s.email_id where s.campaign_id = p_campaign and e.status = 'sent'),
    'failed', (select count(*) from public.campaign_sends s join public.sms_messages m on m.id = s.sms_id where s.campaign_id = p_campaign and m.status = 'failed') + (select count(*) from public.campaign_sends s join public.emails e on e.id = s.email_id where s.campaign_id = p_campaign and e.status = 'failed'),
    'replied', (select count(distinct s.customer_id) from public.campaign_sends s join public.sms_messages m on m.customer_id = s.customer_id and m.direction = 'in' and m.created_at > s.created_at where s.campaign_id = p_campaign),
    'booked', (select count(distinct s.customer_id) from public.campaign_sends s join public.appointments a on a.customer_id = s.customer_id and a.created_at > s.created_at and a.created_at < s.created_at + interval '30 days' where s.campaign_id = p_campaign),
    'revenue', (select coalesce(sum((public.ro_totals(r.id)->>'total')::int), 0) from public.campaign_sends s join public.appointments a on a.customer_id = s.customer_id and a.created_at > s.created_at and a.created_at < s.created_at + interval '30 days' join public.repair_orders r on r.appointment_id = a.id and r.status = 'paid' where s.campaign_id = p_campaign)
  ) from public.campaigns c where c.id = p_campaign and public.is_staff(c.shop_id)
$$;
grant execute on function public.campaign_results(uuid) to authenticated;

-- Review request by email after a paid visit, when the customer has an address and the shop has a link.
create or replace function public.review_email_auto() returns trigger
language plpgsql security definer set search_path = public as $$
declare a public.appointments; c public.customers; sh public.shops;
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    select * into a from public.appointments where id = new.appointment_id; select * into c from public.customers where id = a.customer_id; select * into sh from public.shops where shop_id = new.shop_id;
    if c.email <> '' and not c.do_not_market and sh.review_url <> '' and coalesce((sh.reminders->>'thank_you')::boolean, true) and not exists (select 1 from public.emails e where e.customer_id = c.id and e.kind = 'review' and e.created_at > now() - interval '60 days') then
      begin perform public.send_email(c.id, c.email, 'Thanks for visiting ' || sh.name, '<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;line-height:1.55">Hi ' || split_part(c.name, ' ', 1) || ',<br><br>Thanks for trusting us with your ' || coalesce(a.job, 'vehicle') || '. If anything is not right, just reply to this email and we will take care of it.<br><br>If it went well, a quick review helps a small shop more than you would think:<br><a href="' || sh.review_url || '" style="display:inline-block;margin-top:10px;padding:12px 18px;background:#111;color:#fff;border-radius:10px;text-decoration:none">Leave a review</a><br><br>' || sh.name || case when sh.phone <> '' then ' · ' || sh.phone else '' end || '</div>', 'review', new.id); exception when others then null; end;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists review_email_auto on public.repair_orders;
create trigger review_email_auto after update of status on public.repair_orders for each row execute function public.review_email_auto();

-- ---- Carfax service history export ----
-- Carfax Service Network accepts a flat file of VIN, date, odometer and services; this is that file.
create or replace function public.carfax_export(p_shop text, p_from date, p_to date) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('vin', v.vin, 'plate', v.plate, 'date', to_char(coalesce(r.paid_at, a.done_at, a.starts_at) at time zone 'America/Denver', 'YYYY-MM-DD'), 'odometer', v.odometer, 'ro', r.number,
    'services', (select string_agg(l.description, '; ' order by l.sort) from public.ro_lines l where l.ro_id = r.id and l.approved and l.kind = 'labor'), 'year', v.year, 'make', v.make, 'model', v.model) order by coalesce(r.paid_at, a.done_at)), '[]'::jsonb)
  from public.repair_orders r join public.appointments a on a.id = r.appointment_id join public.customer_vehicles v on v.id = a.vehicle_id
  where r.shop_id = p_shop and public.is_staff(p_shop) and r.status = 'paid' and v.vin <> '' and coalesce(r.paid_at, a.done_at) >= p_from and coalesce(r.paid_at, a.done_at) < p_to + 1
$$;
grant execute on function public.carfax_export(text, date, date) to authenticated;

alter publication supabase_realtime add table public.waitlist, public.fleets, public.campaigns, public.emails;

create or replace function public.integrations(p_shop text default 'ryguys') returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'sms', exists (select 1 from public.app_config where key = 'sms_url'),
    'stripe', exists (select 1 from public.app_config where key = 'stripe_pk'),
    'partstech', exists (select 1 from public.app_config where key = 'partstech_key'),
    'push', exists (select 1 from public.app_config where key = 'push_url'),
    'email', exists (select 1 from public.app_config where key = 'email_url'),
    'sms_number', coalesce((select value from public.app_config where key = 'sms_number'), '')
  ) where public.is_staff(p_shop)
$$;
