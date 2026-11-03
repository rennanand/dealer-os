-- Job board: every approved job on a visit can be assigned to one or more technicians and clocked
-- on its own, so efficiency and gross profit per hour are per job, not per visit. Inspection
-- templates: the shop edits its checklists; items can carry the canned job to quote when flagged.

alter table public.findings
  add column if not exists techs uuid[] not null default '{}',
  add column if not exists started_at timestamptz;

alter table public.time_entries
  add column if not exists finding_id uuid references public.findings (id) on delete set null;
create index if not exists time_entries_job on public.time_entries (finding_id);

-- Clock on to a job (or the visit as a whole when p_job is null).
create or replace function public.clock_on(p_appointment uuid, p_tech uuid, p_job uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid text; eid uuid;
begin
  select shop_id into sid from public.appointments where id = p_appointment;
  if sid is null or not public.is_staff(sid) then raise exception 'Not allowed.'; end if;
  update public.time_entries set ended_at = now() where tech_id = p_tech and ended_at is null;
  insert into public.time_entries (shop_id, appointment_id, tech_id, finding_id) values (sid, p_appointment, p_tech, p_job) returning id into eid;
  update public.appointments set tech_id = coalesce(tech_id, p_tech), status = case when status in ('booked', 'arrived') then 'in_progress' else status end, started_at = coalesce(started_at, now()) where id = p_appointment;
  if p_job is not null then update public.findings set techs = case when p_tech = any(techs) then techs else techs || p_tech end, started_at = coalesce(started_at, now()) where id = p_job; end if;
  return eid;
end $$;
grant execute on function public.clock_on(uuid, uuid, uuid) to authenticated;

-- The booked service becomes a job on the RO the moment the RO starts, approved already.
create or replace function public.ensure_ro(p_appointment uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare rid uuid; sid text; rate int; a public.appointments;
begin
  select id into rid from public.repair_orders where appointment_id = p_appointment;
  if rid is not null then return rid; end if;
  select * into a from public.appointments where id = p_appointment;
  sid := a.shop_id;
  if sid is null or not public.is_staff(sid) then raise exception 'Not allowed.'; end if;
  select tax_rate_bp into rate from public.shops where shop_id = sid;
  insert into public.repair_orders (shop_id, appointment_id, tax_rate_bp) values (sid, p_appointment, coalesce(rate, 725)) returning id into rid;
  return rid;
end $$;

-- Job-level numbers for the board and the reports.
create or replace function public.job_hours(p_job uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select round(coalesce(sum(extract(epoch from (coalesce(ended_at, now()) - started_at))) / 3600.0, 0)::numeric, 2) from public.time_entries where finding_id = p_job
$$;
grant execute on function public.job_hours(uuid) to authenticated;

-- ---- inspection templates ----
create table if not exists public.inspection_templates (
  id         uuid primary key default gen_random_uuid(),
  shop_id    text not null default 'ryguys',
  name       text not null,
  items      jsonb not null default '[]'::jsonb,   -- [{key,label,measLabel,hint,now_job,monitor_job}]
  is_default boolean not null default false,
  internal   boolean not null default false,      -- never shown to the customer
  sort       int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.inspection_templates enable row level security;
drop policy if exists "staff all" on public.inspection_templates;
create policy "staff all" on public.inspection_templates for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.inspection_templates to authenticated;

alter table public.inspections add column if not exists template_id uuid references public.inspection_templates (id) on delete set null;

insert into public.inspection_templates (shop_id, name, is_default, sort, items)
select 'ryguys', 'Multi-point inspection', true, 10, '[
  {"key":"tires","label":"Tires","measLabel":"Tread 32nds","hint":"Inspect tread depth, wear pattern, sidewalls, pressure"},
  {"key":"brakes","label":"Brakes","measLabel":"Pad mm","hint":"Pads, rotors, lines, fluid"},
  {"key":"battery","label":"Battery","measLabel":"Volts / CCA","hint":"Terminals, hold-down, load test"},
  {"key":"fluids","label":"Fluids","measLabel":"Level","hint":"Oil, coolant, brake, power steering, washer"},
  {"key":"filters","label":"Filters","measLabel":"Condition","hint":"Engine air, cabin air"},
  {"key":"belts","label":"Belts & hoses","measLabel":"Condition","hint":"Cracks, glazing, leaks"},
  {"key":"lights","label":"Lights & wipers","measLabel":"Condition","hint":"All exterior lights, wiper blades"},
  {"key":"suspension","label":"Steering & suspension","measLabel":"Condition","hint":"Shocks, struts, tie rods, bushings"},
  {"key":"exhaust","label":"Exhaust & underbody","measLabel":"Condition","hint":"Leaks, hangers, rust"}
]'::jsonb where not exists (select 1 from public.inspection_templates where shop_id = 'ryguys');
insert into public.inspection_templates (shop_id, name, is_default, sort, items)
select 'ryguys', 'Tire & brake check', false, 20, '[
  {"key":"lf","label":"Left front tire","measLabel":"32nds","hint":"Tread, wear, DOT age"},
  {"key":"rf","label":"Right front tire","measLabel":"32nds","hint":"Tread, wear, DOT age"},
  {"key":"lr","label":"Left rear tire","measLabel":"32nds","hint":"Tread, wear, DOT age"},
  {"key":"rr","label":"Right rear tire","measLabel":"32nds","hint":"Tread, wear, DOT age"},
  {"key":"fpads","label":"Front brake pads","measLabel":"mm","hint":"Inner and outer pad"},
  {"key":"rpads","label":"Rear brake pads","measLabel":"mm","hint":"Inner and outer pad"},
  {"key":"rotors","label":"Rotors","measLabel":"Condition","hint":"Scoring, lip, thickness"},
  {"key":"bfluid","label":"Brake fluid","measLabel":"Condition","hint":"Level, color, moisture"}
]'::jsonb where not exists (select 1 from public.inspection_templates where shop_id = 'ryguys' and name = 'Tire & brake check');

-- Writer and technician reports, by person, in a window.
create or replace function public.staff_report(p_shop text, p_from timestamptz, p_to timestamptz) returns jsonb
language sql stable security definer set search_path = public as $$
  with closed as (select r.id, r.paid_at, a.tech_id, a.id as appt, public.ro_totals(r.id) as t from public.repair_orders r join public.appointments a on a.id = r.appointment_id
                  where r.shop_id = p_shop and r.status = 'paid' and r.paid_at >= p_from and r.paid_at < p_to),
  techs as (select t.id, t.name, t.role,
            (select count(*) from closed c where c.tech_id = t.id) as visits,
            (select coalesce(sum((c.t->>'total')::int), 0) from closed c where c.tech_id = t.id) as sales,
            (select coalesce(sum((c.t->>'labor')::int), 0) from closed c where c.tech_id = t.id) as labor,
            (select coalesce(sum((c.t->>'parts')::int - (c.t->>'parts_cost')::int), 0) from closed c where c.tech_id = t.id) as parts_gp,
            (select coalesce(sum((c.t->>'labor_hours')::numeric), 0) from closed c where c.tech_id = t.id) as billed_hours,
            (select coalesce(sum(extract(epoch from (coalesce(e.ended_at, now()) - e.started_at))) / 3600.0, 0) from public.time_entries e where e.tech_id = t.id and e.started_at >= p_from and e.started_at < p_to) as clock_hours,
            (select count(*) from public.findings f join public.appointments a on a.id = f.appointment_id where a.tech_id = t.id and f.created_at >= p_from and f.created_at < p_to and f.source <> 'booked') as findings,
            (select count(*) from public.findings f join public.appointments a on a.id = f.appointment_id where a.tech_id = t.id and f.created_at >= p_from and f.created_at < p_to and f.source <> 'booked' and f.status in ('approved', 'done')) as approved
            from public.technicians t where t.shop_id = p_shop and t.active)
  select jsonb_build_object(
    'techs', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'role', role, 'visits', visits, 'sales', sales, 'labor', labor, 'parts_gp', parts_gp, 'billed_hours', billed_hours, 'clock_hours', round(clock_hours::numeric, 2), 'findings', findings, 'approved', approved) order by sales desc), '[]'::jsonb) from techs),
    'writers', (select coalesce(jsonb_agg(jsonb_build_object('user_id', w.created_by, 'name', coalesce(m.name, 'Desk'), 'invoices', w.n, 'sales', w.sales, 'aro', w.sales / greatest(w.n, 1)) order by w.sales desc), '[]'::jsonb)
                from (select a.created_by, count(*) as n, sum((c.t->>'total')::int) as sales from closed c join public.appointments a on a.id = c.appt group by a.created_by) w
                left join public.shop_members m on m.user_id = w.created_by and m.shop_id = p_shop)
  ) where public.is_staff(p_shop)
$$;
grant execute on function public.staff_report(text, timestamptz, timestamptz) to authenticated;

-- Customers see job lines, what is paid, the pay link, and whether the visit is confirmed.
create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'vehicle_id', a.vehicle_id,
    'pickup', a.pickup, 'rating', a.rating, 'tech', split_part(t.name, ' ', 1), 'confirmed_at', a.confirmed_at,
    'vehicle', case when v.id is null then null else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end,
    'findings', (select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'tier', f.tier, 'name', f.name, 'plain', f.plain, 'tech', f.tech, 'meas', f.meas, 'meas_label', f.meas_label, 'urgency', f.urgency, 'wait_text', f.wait_text, 'price_cents', f.price_cents, 'status', f.status, 'created_at', f.created_at, 'source', f.source, 'lines', f.lines) order by f.created_at), '[]'::jsonb) from public.findings f where f.appointment_id = a.id and f.source <> 'booked'),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.id, 'path', ph.path, 'caption', ph.caption, 'meas', ph.meas, 'finding_id', ph.finding_id, 'created_at', ph.created_at) order by ph.created_at), '[]'::jsonb) from public.visit_photos ph where ph.appointment_id = a.id),
    'tire_quote', (select jsonb_build_object('id', q.id, 'size', q.size, 'tread', q.tread, 'options', q.options, 'recommended', q.recommended, 'hazard_offered', q.hazard_offered, 'fee_cents', q.fee_cents, 'status', q.status, 'accepted_tier', q.accepted_tier, 'accepted_hazard', q.accepted_hazard, 'total_cents', q.total_cents, 'created_at', q.created_at) from public.tire_quotes q where q.appointment_id = a.id order by q.created_at desc limit 1),
    'invoice', (select jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'invoiced_at', r.invoiced_at, 'paid_at', r.paid_at, 'paid_method', r.paid_method, 'totals', public.ro_totals(r.id), 'paid_cents', public.ro_paid(r.id),
                  'pay_token', (select token from public.pay_links pl where pl.ro_id = r.id and pl.status = 'open' order by created_at desc limit 1),
                  'lines', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'kind', l.kind, 'description', l.description, 'qty', l.qty, 'unit_cents', l.unit_cents, 'cents', round(l.qty * l.unit_cents)::int) order by l.sort, l.created_at), '[]'::jsonb) from public.ro_lines l where l.ro_id = r.id and l.approved))
                from public.repair_orders r where r.appointment_id = a.id and r.status <> 'void'),
    'inspection', (select jsonb_build_object('sent_at', i.sent_at, 'tech', split_part(coalesce(it.name, ''), ' ', 1),
                  'items', (select coalesce(jsonb_agg(jsonb_build_object('key', x->>'key', 'label', x->>'label', 'status', x->>'status', 'meas', x->>'meas', 'meas_label', x->>'measLabel', 'note', x->>'note')), '[]'::jsonb) from jsonb_array_elements(i.items) x where coalesce(x->>'status', '') <> ''))
                from public.inspections i left join public.technicians it on it.id = i.tech_id where i.appointment_id = a.id and i.status = 'sent')
  ) order by a.starts_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.appointments a on a.shop_id = p.shop_id and (a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
  left join public.customer_vehicles v on v.id = a.vehicle_id
  left join public.technicians t on t.id = a.tech_id
  where p.user_id = auth.uid() and a.starts_at > now() - interval '180 days'
$$;

-- Customers confirm from the app too.
create or replace function public.confirm_my_appointment(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.appointments set confirmed_at = now() where id = p_id and status = 'booked' and (customer_user = auth.uid() or customer_id = public.my_customer_id())
$$;
grant execute on function public.confirm_my_appointment(uuid) to authenticated;

-- Online booking honors the slot list and marks where the visit came from.
create or replace function public.booking_services(p_shop text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(booking->'services', '[]'::jsonb) from public.shops where shop_id = p_shop
$$;
grant execute on function public.booking_services(text) to anon, authenticated;

alter publication supabase_realtime add table public.inspection_templates;

-- Which integrations are configured (never the secrets themselves).
create or replace function public.integrations(p_shop text default 'ryguys') returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'sms', exists (select 1 from public.app_config where key = 'sms_url'),
    'stripe', exists (select 1 from public.app_config where key = 'stripe_pk'),
    'partstech', exists (select 1 from public.app_config where key = 'partstech_key'),
    'push', exists (select 1 from public.app_config where key = 'push_url'),
    'sms_number', coalesce((select value from public.app_config where key = 'sms_number'), '')
  ) where public.is_staff(p_shop)
$$;
grant execute on function public.integrations(text) to authenticated;

-- Online booking without an account (the public /book page): the phone number ties the visit to the
-- customer record, created on the spot if new. Slot capacity is checked the same way the app does.
create or replace function public.book_online(p_shop text, p_name text, p_phone text, p_starts_at timestamptz, p_job text, p_vehicle text default '', p_notes text default '', p_minutes int default 60) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ph text; cid uuid; vid uuid; aid uuid; parts text[]; b jsonb; busy int; sh public.shops;
begin
  ph := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  if length(ph) <> 10 then raise exception 'Enter a 10-digit mobile number.'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Enter your name.'; end if;
  select * into sh from public.shops where shop_id = p_shop;
  if sh.shop_id is null then raise exception 'Unknown shop.'; end if;
  b := sh.booking;
  if not coalesce((b->>'online')::boolean, true) then raise exception 'Online booking is off. Please call the shop.'; end if;
  if p_starts_at < now() + (coalesce((b->>'lead_hours')::int, 2) || ' hours')::interval then raise exception 'That time is too soon. Pick a later slot.'; end if;
  select count(*) into busy from public.appointments a where a.shop_id = p_shop and a.status in ('booked', 'arrived', 'in_progress') and a.starts_at < p_starts_at + (p_minutes || ' minutes')::interval and a.starts_at + (a.minutes || ' minutes')::interval > p_starts_at;
  if busy >= least(coalesce((b->>'max_per_slot')::int, 2), coalesce((b->>'bays')::int, 5)) then raise exception 'That slot just filled up. Pick another.'; end if;
  if exists (select 1 from public.blocked_time x where x.shop_id = p_shop and x.bay is null and x.tech_id is null and x.starts_at < p_starts_at + (p_minutes || ' minutes')::interval and x.ends_at > p_starts_at) then raise exception 'The shop is closed at that time.'; end if;
  select id into cid from public.customers where shop_id = p_shop and phone = ph order by created_at limit 1;
  if cid is null then insert into public.customers (shop_id, name, phone, source) values (p_shop, left(trim(p_name), 120), ph, 'online') returning id into cid; end if;
  if coalesce(p_vehicle, '') <> '' then
    select id into vid from public.customer_vehicles where customer_id = cid and (lower(make || ' ' || model) = lower(trim(p_vehicle)) or lower(year || ' ' || make || ' ' || model) = lower(trim(p_vehicle))) limit 1;
    if vid is null then
      parts := regexp_split_to_array(trim(p_vehicle), '\s+');
      if parts[1] ~ '^\d{4}$' then insert into public.customer_vehicles (shop_id, customer_id, year, make, model) values (p_shop, cid, parts[1]::int, coalesce(parts[2], ''), array_to_string(parts[3:], ' ')) returning id into vid;
      else insert into public.customer_vehicles (shop_id, customer_id, make, model) values (p_shop, cid, coalesce(parts[1], ''), array_to_string(parts[2:], ' ')) returning id into vid; end if;
    end if;
  end if;
  insert into public.appointments (shop_id, customer_id, vehicle_id, starts_at, minutes, job, visit, notes, source)
  values (p_shop, cid, vid, p_starts_at, greatest(30, p_minutes), left(coalesce(p_job, ''), 200), 'dropoff', left(coalesce(p_notes, ''), 1000), 'online') returning id into aid;
  return jsonb_build_object('id', aid, 'starts_at', p_starts_at, 'job', p_job, 'shop', sh.name, 'address', sh.address, 'phone', sh.phone);
end $$;
grant execute on function public.book_online(text, text, text, timestamptz, text, text, text, int) to anon, authenticated;

create or replace function public.booking_info(p_shop text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', name, 'address', address, 'phone', phone, 'hours', hours, 'open_days', open_days, 'open_from', open_from, 'open_to', open_to, 'online', coalesce((booking->>'online')::boolean, true), 'days_ahead', coalesce((booking->>'days_ahead')::int, 30), 'services', coalesce(booking->'services', '[]'::jsonb))
  from public.shops where shop_id = p_shop
$$;
grant execute on function public.booking_info(text) to anon, authenticated;
