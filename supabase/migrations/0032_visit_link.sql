-- The visit link: everything a customer does in the app, done from one private link with no account.
-- /visit/<token> shows status, inspection, estimate, photos, invoice, messages; lets the customer
-- confirm, reschedule, cancel, check in online, sign authorizations, approve, pay, message and rate.
-- The automations send that link: confirmation, reminder, ready (with the pay link), thank-you
-- (with the review link), and follow-ups on declined work.

alter table public.appointments
  add column if not exists token text unique default encode(gen_random_bytes(12), 'hex'),
  add column if not exists online_checkin_at timestamptz,
  add column if not exists concern text not null default '',
  add column if not exists ready_sent_at timestamptz,
  add column if not exists thanks_sent_at timestamptz,
  add column if not exists followup_sent_at timestamptz;
update public.appointments set token = encode(gen_random_bytes(12), 'hex') where token is null;

alter table public.shops
  add column if not exists public_url text not null default 'https://dealer-os-rosy.vercel.app',
  add column if not exists review_url text not null default '',
  add column if not exists authorization_text text not null default 'I authorize the repair work described, including the parts and labor it needs, and grant the shop permission to operate the vehicle for testing and inspection. I understand an estimate is not a final bill and that I will be contacted before any work beyond it is done.';

-- Signatures: check-in authorization, estimate approval, pickup acknowledgement.
create table if not exists public.authorizations (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  kind           text not null check (kind in ('checkin', 'estimate', 'pickup')),
  name           text not null default '',
  signature      text not null default '',        -- SVG path from the signature pad
  text           text not null default '',        -- the exact wording agreed to
  amount_cents   int not null default 0,          -- estimate: what was approved
  ip             text not null default '',
  created_at     timestamptz not null default now()
);
create index if not exists authorizations_appt on public.authorizations (appointment_id);
alter table public.authorizations enable row level security;
drop policy if exists "staff read" on public.authorizations;
create policy "staff read" on public.authorizations for select using (public.is_staff(shop_id));
grant select on public.authorizations to authenticated;

create or replace function public.visit_link(p_appointment uuid) returns text
language sql stable security definer set search_path = public as $$
  select s.public_url || '/visit/' || a.token from public.appointments a join public.shops s on s.shop_id = a.shop_id where a.id = p_appointment
$$;
grant execute on function public.visit_link(uuid) to authenticated;

-- Everything on the visit, for the link.
create or replace function public.visit_by_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'minutes', a.minutes, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes, 'concern', a.concern,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'pickup', a.pickup, 'rating', a.rating, 'confirmed_at', a.confirmed_at, 'online_checkin_at', a.online_checkin_at,
    'tech', split_part(coalesce(t.name, ''), ' ', 1),
    'customer', split_part(coalesce(c.name, ''), ' ', 1), 'customer_name', coalesce(c.name, ''), 'in_app', c.joined_at is not null,
    'vehicle', case when v.id is null then '' else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end, 'odometer', v.odometer, 'vehicle_id', v.id,
    'shop', (select jsonb_build_object('name', name, 'phone', phone, 'address', address, 'hours', hours, 'lat', lat, 'lng', lng, 'estimate_note', estimate_note, 'authorization_text', authorization_text, 'review_url', review_url, 'public_url', public_url, 'open_days', open_days, 'booking', booking) from public.shops where shop_id = a.shop_id),
    'findings', (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'tier', g.tier, 'name', g.name, 'plain', g.plain, 'meas', g.meas, 'meas_label', g.meas_label, 'urgency', g.urgency, 'price_cents', g.price_cents, 'status', g.status, 'lines', g.lines, 'created_at', g.created_at, 'token', g.token) order by case g.tier when 'now' then 0 when 'soon' then 1 else 2 end, g.created_at), '[]'::jsonb)
                  from public.findings g where g.appointment_id = a.id and g.source <> 'booked'),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.id, 'path', ph.path, 'caption', ph.caption, 'meas', ph.meas, 'finding_id', ph.finding_id, 'created_at', ph.created_at) order by ph.created_at), '[]'::jsonb) from public.visit_photos ph where ph.appointment_id = a.id),
    'inspection', (select jsonb_build_object('sent_at', i.sent_at, 'tech', split_part(coalesce(it.name, ''), ' ', 1),
                  'items', (select coalesce(jsonb_agg(jsonb_build_object('key', x->>'key', 'label', x->>'label', 'status', x->>'status', 'meas', x->>'meas', 'meas_label', x->>'measLabel', 'note', x->>'note')), '[]'::jsonb) from jsonb_array_elements(i.items) x where coalesce(x->>'status', '') <> ''))
                from public.inspections i left join public.technicians it on it.id = i.tech_id where i.appointment_id = a.id and i.status = 'sent'),
    'invoice', (select jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'invoiced_at', r.invoiced_at, 'paid_at', r.paid_at, 'paid_method', r.paid_method, 'totals', public.ro_totals(r.id), 'paid_cents', public.ro_paid(r.id),
                  'pay_token', (select token from public.pay_links pl where pl.ro_id = r.id and pl.status = 'open' order by created_at desc limit 1), 'card', exists (select 1 from public.app_config where key = 'stripe_pk'),
                  'lines', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'kind', l.kind, 'description', l.description, 'qty', l.qty, 'unit_cents', l.unit_cents, 'cents', round(l.qty * l.unit_cents)::int) order by l.sort, l.created_at), '[]'::jsonb) from public.ro_lines l where l.ro_id = r.id and l.approved))
                from public.repair_orders r where r.appointment_id = a.id and r.status <> 'void'),
    'tire_quote', (select jsonb_build_object('id', q.id, 'size', q.size, 'options', q.options, 'recommended', q.recommended, 'status', q.status, 'accepted_tier', q.accepted_tier, 'total_cents', q.total_cents) from public.tire_quotes q where q.appointment_id = a.id order by q.created_at desc limit 1),
    'rental', (select jsonb_build_object('number', r.number, 'status', r.status, 'token', r.token) from public.rentals r where r.customer_id = a.customer_id and r.status in ('sent', 'signed', 'out') order by r.created_at desc limit 1),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'sender', m.sender, 'text', m.text, 'created_at', m.created_at) order by m.created_at), '[]'::jsonb) from (select * from public.messages m where m.customer_id = a.customer_id order by m.created_at desc limit 50) m),
    'authorizations', (select coalesce(jsonb_agg(jsonb_build_object('kind', z.kind, 'name', z.name, 'created_at', z.created_at, 'amount_cents', z.amount_cents) order by z.created_at), '[]'::jsonb) from public.authorizations z where z.appointment_id = a.id),
    'history', (select coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'token', h.token, 'starts_at', h.starts_at, 'job', h.job, 'total', (select (public.ro_totals(r.id)->>'total')::int from public.repair_orders r where r.appointment_id = h.id and r.status = 'paid')) order by h.starts_at desc), '[]'::jsonb)
                from public.appointments h where h.customer_id = a.customer_id and h.id <> a.id and h.status = 'done' and h.starts_at > now() - interval '3 years')
  )
  from public.appointments a
  left join public.customers c on c.id = a.customer_id left join public.customer_vehicles v on v.id = a.vehicle_id left join public.technicians t on t.id = a.tech_id
  where a.token = p_token
$$;
grant execute on function public.visit_by_token(text) to anon, authenticated;

-- Actions from the link. Each checks the token, nothing else: the link is the credential.
create or replace function public.visit_action(p_token text, p_action text, p_arg jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.appointments; sh public.shops; txt text; ts timestamptz; busy int; mins int; amt int; sig text; nm text;
begin
  select * into a from public.appointments where token = p_token;
  if a.id is null then raise exception 'This link is not valid.'; end if;
  select * into sh from public.shops where shop_id = a.shop_id;
  if p_action = 'confirm' then
    update public.appointments set confirmed_at = coalesce(confirmed_at, now()) where id = a.id;
  elsif p_action = 'cancel' then
    if a.status not in ('booked', 'arrived') then raise exception 'This visit can no longer be cancelled online. Call the shop.'; end if;
    update public.appointments set status = 'cancelled' where id = a.id;
  elsif p_action = 'reschedule' then
    if a.status <> 'booked' then raise exception 'This visit has already started.'; end if;
    ts := (p_arg->>'starts_at')::timestamptz; mins := coalesce(a.minutes, 60);
    if ts is null or ts < now() + (coalesce((sh.booking->>'lead_hours')::int, 2) || ' hours')::interval then raise exception 'Pick a later time.'; end if;
    select count(*) into busy from public.appointments x where x.shop_id = a.shop_id and x.id <> a.id and x.status in ('booked', 'arrived', 'in_progress') and x.starts_at < ts + (mins || ' minutes')::interval and x.starts_at + (x.minutes || ' minutes')::interval > ts;
    if busy >= least(coalesce((sh.booking->>'max_per_slot')::int, 2), coalesce((sh.booking->>'bays')::int, 5)) then raise exception 'That slot just filled up. Pick another.'; end if;
    update public.appointments set starts_at = ts, confirmed_at = now(), reminder_sent_at = null, bay = null where id = a.id;
  elsif p_action = 'checkin' then
    nm := left(coalesce(p_arg->>'name', ''), 120); sig := coalesce(p_arg->>'signature', '');
    update public.appointments set online_checkin_at = now(), concern = left(coalesce(p_arg->>'concern', concern), 1000), pickup = case when pickup = '' then 'here' else pickup end where id = a.id;
    if (p_arg->>'odometer') is not null and a.vehicle_id is not null then update public.customer_vehicles set odometer = (p_arg->>'odometer')::int where id = a.vehicle_id and (p_arg->>'odometer')::int > 0; end if;
    if sig <> '' then insert into public.authorizations (shop_id, appointment_id, kind, name, signature, text, ip) values (a.shop_id, a.id, 'checkin', nm, sig, sh.authorization_text, coalesce(p_arg->>'ip', '')); end if;
  elsif p_action = 'decide' then
    update public.findings set status = 'approved', decided_at = now() where appointment_id = a.id and status = 'pending' and id in (select (x->>0)::uuid from jsonb_array_elements(coalesce(p_arg->'approve', '[]'::jsonb)) x);
    update public.findings set status = 'declined', decided_at = now() where appointment_id = a.id and status = 'pending' and id in (select (x->>0)::uuid from jsonb_array_elements(coalesce(p_arg->'decline', '[]'::jsonb)) x);
    sig := coalesce(p_arg->>'signature', ''); nm := left(coalesce(p_arg->>'name', ''), 120);
    select coalesce(sum(price_cents), 0) into amt from public.findings where appointment_id = a.id and id in (select (x->>0)::uuid from jsonb_array_elements(coalesce(p_arg->'approve', '[]'::jsonb)) x);
    if sig <> '' then insert into public.authorizations (shop_id, appointment_id, kind, name, signature, text, amount_cents, ip) values (a.shop_id, a.id, 'estimate', nm, sig, 'Approved the selected work on the estimate.', amt, coalesce(p_arg->>'ip', '')); end if;
  elsif p_action = 'message' then
    txt := left(trim(coalesce(p_arg->>'text', '')), 2000);
    if txt = '' or a.customer_id is null then raise exception 'Nothing to send.'; end if;
    insert into public.messages (shop_id, customer_id, appointment_id, sender, text, read_by_cust) values (a.shop_id, a.customer_id, a.id, 'customer', txt, true);
  elsif p_action = 'pickup' then
    txt := p_arg->>'state';
    if txt not in ('on_way', 'here', 'picked_up') then raise exception 'Unknown state.'; end if;
    update public.appointments set pickup = txt, pickup_at = now() where id = a.id;
  elsif p_action = 'rate' then
    update public.appointments set rating = greatest(1, least(5, coalesce((p_arg->>'stars')::int, 5))), rating_tags = coalesce((select array_agg(x->>0) from jsonb_array_elements(coalesce(p_arg->'tags', '[]'::jsonb)) x), '{}'), rating_note = left(coalesce(p_arg->>'note', ''), 1000) where id = a.id;
  elsif p_action = 'odometer' then
    if a.vehicle_id is not null then update public.customer_vehicles set odometer = (p_arg->>'odometer')::int where id = a.vehicle_id and (p_arg->>'odometer')::int > 0; end if;
  else raise exception 'Unknown action.';
  end if;
  return public.visit_by_token(p_token);
end $$;
grant execute on function public.visit_action(text, text, jsonb) to anon, authenticated;

-- A pay link for a visit, made on demand (the ready text and the link page both use it).
create or replace function public.ensure_pay_link(p_ro uuid) returns text
language plpgsql security definer set search_path = public as $$
declare tok text;
begin
  select token into tok from public.pay_links where ro_id = p_ro and status = 'open' order by created_at desc limit 1;
  if tok is null then insert into public.pay_links (shop_id, ro_id) select shop_id, id from public.repair_orders where id = p_ro returning token into tok; end if;
  return tok;
end $$;
grant execute on function public.ensure_pay_link(uuid) to authenticated;

-- Templates fill {link} with the visit link when none is given.
create or replace function public.sms_fill(p_key text, p_appointment uuid, p_link text default '') returns text
language plpgsql stable security definer set search_path = public as $$
declare a public.appointments; c public.customers; v public.customer_vehicles; sh public.shops; body text; tot int; link text;
begin
  select * into a from public.appointments where id = p_appointment;
  select * into c from public.customers where id = a.customer_id;
  select * into v from public.customer_vehicles where id = a.vehicle_id;
  select * into sh from public.shops where shop_id = a.shop_id;
  select t.body into body from public.sms_templates t where t.shop_id = a.shop_id and t.key = p_key;
  if body is null then return ''; end if;
  select (public.ro_totals(r.id)->>'total')::int - public.ro_paid(r.id) into tot from public.repair_orders r where r.appointment_id = a.id;
  link := coalesce(nullif(p_link, ''), sh.public_url || '/visit/' || a.token);
  body := replace(body, '{first}', split_part(coalesce(c.name, ''), ' ', 1));
  body := replace(body, '{shop}', coalesce(sh.name, 'the shop'));
  body := replace(body, '{phone}', coalesce(sh.phone, ''));
  body := replace(body, '{service}', coalesce(nullif(a.job, ''), 'service'));
  body := replace(body, '{vehicle}', case when v.id is null then 'your vehicle' else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end);
  body := replace(body, '{when}', to_char(a.starts_at at time zone 'America/Denver', 'Dy Mon FMDD at FMHH12:MI AM'));
  body := replace(body, '{time}', to_char(a.starts_at at time zone 'America/Denver', 'FMHH12:MI AM'));
  body := replace(body, '{total}', '$' || to_char(coalesce(tot, 0) / 100.0, 'FM999,990.00'));
  body := replace(body, '{review}', coalesce(sh.review_url, ''));
  body := replace(body, '{link}', link);
  return body;
end $$;

update public.sms_templates set body = 'Thanks for visiting {shop}, {first}. If anything is not right, reply here and we will take care of it. A quick review helps a small shop a lot: {review}' where key = 'thank_you' and body not like '%{review}%';

-- Automations on the visit: ready (with the pay link), thank-you (after pickup or payment), follow-up on declined work.
create or replace function public.appointments_auto() returns trigger
language plpgsql security definer set search_path = public as $$
declare sh public.shops; c public.customers; body text; rid uuid; tok text; link text; days int; fu_first text;
begin
  select * into sh from public.shops where shop_id = new.shop_id;
  select * into c from public.customers where id = new.customer_id;
  if c.id is null or c.phone = '' or c.sms_opt_out then return new; end if;
  -- ready for pickup
  if new.status = 'done' and old.status is distinct from 'done' and new.ready_sent_at is null and coalesce((sh.reminders->>'ready_text')::boolean, true) then
    select id into rid from public.repair_orders where appointment_id = new.id and status <> 'void';
    link := sh.public_url || '/visit/' || new.token;
    body := public.sms_fill('ready', new.id, link);
    if body <> '' then begin perform public.send_sms(new.customer_id, body, 'ready', new.id); update public.appointments set ready_sent_at = now() where id = new.id; exception when others then null; end; end if;
  end if;
  -- thank you, once, after pickup
  if new.pickup = 'picked_up' and old.pickup is distinct from 'picked_up' and new.thanks_sent_at is null and coalesce((sh.reminders->>'thank_you')::boolean, true) then
    body := public.sms_fill('thank_you', new.id, '');
    if body <> '' then begin perform public.send_sms(new.customer_id, body, 'thank_you', new.id, now() + interval '2 hours'); update public.appointments set thanks_sent_at = now() where id = new.id; exception when others then null; end; end if;
    -- follow-up on declined work, N days later
    days := coalesce((sh.reminders->>'followup_days')::int, 3);
    select name into fu_first from public.findings where appointment_id = new.id and status = 'declined' order by case tier when 'now' then 0 when 'soon' then 1 else 2 end, created_at limit 1;
    if fu_first is not null and new.followup_sent_at is null and days > 0 and not c.do_not_market then
      body := replace(public.sms_fill('followup', new.id, ''), '{item}', fu_first);
      if body <> '' then begin perform public.send_sms(new.customer_id, body, 'followup', new.id, now() + (days || ' days')::interval); update public.appointments set followup_sent_at = now() where id = new.id; exception when others then null; end; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists appointments_auto on public.appointments;
create trigger appointments_auto after update of status, pickup on public.appointments for each row execute function public.appointments_auto();

-- Paying closes the loop too: a paid invoice with no pickup recorded still earns the thank-you.
create or replace function public.ro_paid_auto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    update public.appointments set pickup = case when pickup in ('', 'on_way', 'here') then 'picked_up' else pickup end, pickup_at = coalesce(pickup_at, now()) where id = new.appointment_id and status = 'done';
  end if;
  return new;
end $$;
drop trigger if exists ro_paid_auto on public.repair_orders;
create trigger ro_paid_auto after update of status on public.repair_orders for each row execute function public.ro_paid_auto();

-- The ready text needs a pay link: make one when the visit is done and an RO exists.
create or replace function public.ready_pay_link() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    select id into rid from public.repair_orders where appointment_id = new.id and status <> 'void';
    if rid is not null and not exists (select 1 from public.pay_links where ro_id = rid and status = 'open') then insert into public.pay_links (shop_id, ro_id) values (new.shop_id, rid); end if;
  end if;
  return new;
end $$;
drop trigger if exists ready_pay_link on public.appointments;
create trigger ready_pay_link before update of status on public.appointments for each row execute function public.ready_pay_link();

-- Service-due outreach from the Follow-ups page, one tap per customer or all at once.
alter table public.customer_vehicles add column if not exists due_notified_at timestamptz;
create or replace function public.text_due_reminders(p_shop text, p_vehicle uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare r record; sh public.shops; body text; n int := 0; c public.customers;
begin
  if not public.is_staff(p_shop) then raise exception 'Not allowed.'; end if;
  select * into sh from public.shops where shop_id = p_shop;
  for r in select x.* from jsonb_to_recordset(public.shop_reminders()) as x(customer_id uuid, vehicle_id uuid, customer text, vehicle text, label text, status text, phone text)
           where x.status = 'due' and (p_vehicle is null or x.vehicle_id = p_vehicle) loop
    select * into c from public.customers where id = r.customer_id;
    if c.id is null or c.phone = '' or c.sms_opt_out or c.do_not_market then continue; end if;
    if p_vehicle is null and exists (select 1 from public.customer_vehicles cv where cv.id = r.vehicle_id and cv.due_notified_at > now() - interval '45 days') then continue; end if;
    select t.body into body from public.sms_templates t where t.shop_id = p_shop and t.key = 'due';
    if body is null then continue; end if;
    body := replace(replace(replace(replace(replace(body, '{first}', split_part(c.name, ' ', 1)), '{shop}', sh.name), '{vehicle}', coalesce(r.vehicle, 'your vehicle')), '{item}', lower(coalesce(r.label, 'service'))), '{link}', sh.public_url || '/book');
    begin perform public.send_sms(c.id, body, 'due', null); update public.customer_vehicles set due_notified_at = now() where id = r.vehicle_id; n := n + 1; exception when others then null; end;
  end loop;
  return n;
end $$;
grant execute on function public.text_due_reminders(text, uuid) to authenticated;

-- Customers in the app: the visit token rides along so the app can hand off to the same pages.
create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes, 'token', a.token, 'online_checkin_at', a.online_checkin_at,
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

-- Reschedule from the app, same rules as the link.
create or replace function public.reschedule_my_appointment(p_id uuid, p_starts_at timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare tok text;
begin
  select token into tok from public.appointments where id = p_id and status = 'booked' and (customer_user = auth.uid() or customer_id = public.my_customer_id());
  if tok is null then raise exception 'This visit cannot be moved online.'; end if;
  perform public.visit_action(tok, 'reschedule', jsonb_build_object('starts_at', p_starts_at));
end $$;
grant execute on function public.reschedule_my_appointment(uuid, timestamptz) to authenticated;

create or replace function public.checkin_my_appointment(p_id uuid, p_odometer int default null, p_concern text default '', p_name text default '', p_signature text default '') returns void
language plpgsql security definer set search_path = public as $$
declare tok text;
begin
  select token into tok from public.appointments where id = p_id and (customer_user = auth.uid() or customer_id = public.my_customer_id());
  if tok is null then raise exception 'Not your visit.'; end if;
  perform public.visit_action(tok, 'checkin', jsonb_build_object('odometer', p_odometer, 'concern', p_concern, 'name', p_name, 'signature', p_signature));
end $$;
grant execute on function public.checkin_my_appointment(uuid, int, text, text, text) to authenticated;

-- 0031 added clock_on(uuid, uuid, uuid default null); the two-argument original makes the call ambiguous.
drop function if exists public.clock_on(uuid, uuid);

alter publication supabase_realtime add table public.authorizations;
