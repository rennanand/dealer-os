-- Scheduler: blocked time, capacity, online booking availability, confirmations and reminders.
-- Texting: every text in and out is a row; the `sms` edge function (Twilio) sends what is queued
-- when it is configured, and until then the desk opens the phone's Messages app with the text ready.

alter table public.appointments
  add column if not exists confirmed_at timestamptz,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists source text not null default 'desk';   -- desk | app | online | walk_in

alter table public.shops
  add column if not exists booking jsonb not null default '{"slot_minutes":30,"lead_hours":2,"days_ahead":30,"max_per_slot":2,"bays":5,"online":true,"services":[{"name":"Oil change","minutes":45},{"name":"Tires","minutes":60},{"name":"Brakes","minutes":120},{"name":"Alignment","minutes":60},{"name":"Check engine light","minutes":60},{"name":"Inspection","minutes":45},{"name":"Something else","minutes":60}]}'::jsonb,
  add column if not exists reminders jsonb not null default '{"confirm_on_book":true,"remind_hours":24,"ready_text":true,"thank_you":true,"followup_days":3}'::jsonb;

create table if not exists public.blocked_time (
  id         uuid primary key default gen_random_uuid(),
  shop_id    text not null default 'ryguys',
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  bay        int,                                   -- null = whole shop
  tech_id    uuid references public.technicians (id) on delete cascade,
  reason     text not null default 'Blocked',
  created_at timestamptz not null default now()
);
create index if not exists blocked_time_shop on public.blocked_time (shop_id, starts_at);
alter table public.blocked_time enable row level security;
drop policy if exists "staff all" on public.blocked_time;
create policy "staff all" on public.blocked_time for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.blocked_time to authenticated;

-- Online availability for the customer app and the public booking page: open slots per day.
create or replace function public.booking_slots(p_shop text, p_day date, p_minutes int default 60, p_tz text default 'America/Denver') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare sh public.shops; b jsonb; slot int; bays int; maxper int; lead int; t0 time; t1 time; cur timestamp; d0 timestamptz; d1 timestamptz; out jsonb := '[]'::jsonb; busy int; blocked boolean;
begin
  select * into sh from public.shops where shop_id = p_shop;
  if sh.shop_id is null then return out; end if;
  b := sh.booking; slot := coalesce((b->>'slot_minutes')::int, 30); bays := coalesce((b->>'bays')::int, 5); maxper := coalesce((b->>'max_per_slot')::int, 2); lead := coalesce((b->>'lead_hours')::int, 2);
  if not (extract(dow from p_day)::int = any(coalesce(sh.open_days, '{1,2,3,4,5}'))) then return out; end if;   -- open_days: 0 = Sunday
  t0 := coalesce(nullif(sh.open_from, '')::time, '08:00'); t1 := coalesce(nullif(sh.open_to, '')::time, '17:30');
  cur := p_day + t0;
  while cur + (p_minutes || ' minutes')::interval <= p_day + t1 loop
    d0 := cur at time zone p_tz; d1 := d0 + (p_minutes || ' minutes')::interval;
    if d0 >= now() + (lead || ' hours')::interval then
      select count(*) into busy from public.appointments a where a.shop_id = p_shop and a.status in ('booked', 'arrived', 'in_progress') and a.starts_at < d1 and a.starts_at + (a.minutes || ' minutes')::interval > d0;
      select exists (select 1 from public.blocked_time x where x.shop_id = p_shop and x.bay is null and x.tech_id is null and x.starts_at < d1 and x.ends_at > d0) into blocked;
      if not blocked and busy < least(maxper, bays) then out := out || jsonb_build_object('starts_at', d0, 'label', to_char(cur, 'HH12:MI AM')); end if;
    end if;
    cur := cur + (slot || ' minutes')::interval;
  end loop;
  return out;
end $$;
grant execute on function public.booking_slots(text, date, int, text) to anon, authenticated;

-- ---- texting ----
alter table public.customers
  add column if not exists sms_opt_out boolean not null default false,
  add column if not exists do_not_market boolean not null default false,
  add column if not exists tags text[] not null default '{}';

create table if not exists public.sms_messages (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  customer_id    uuid references public.customers (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  phone          text not null,
  direction      text not null default 'out' check (direction in ('out', 'in')),
  body           text not null,
  status         text not null default 'queued' check (status in ('queued', 'scheduled', 'sent', 'delivered', 'failed', 'received', 'manual', 'cancelled')),
  kind           text not null default 'manual',     -- manual | confirmation | reminder | estimate | ready | thank_you | followup | campaign | pay
  scheduled_for  timestamptz,
  sent_at        timestamptz,
  provider_sid   text not null default '',
  error          text not null default '',
  created_by     uuid references auth.users (id),
  created_at     timestamptz not null default now()
);
create index if not exists sms_shop_time on public.sms_messages (shop_id, created_at);
create index if not exists sms_queue on public.sms_messages (status) where status in ('queued', 'scheduled');
alter table public.sms_messages enable row level security;
drop policy if exists "staff all" on public.sms_messages;
create policy "staff all" on public.sms_messages for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.sms_messages to authenticated;

create table if not exists public.sms_templates (
  id      uuid primary key default gen_random_uuid(),
  shop_id text not null default 'ryguys',
  key     text not null,
  name    text not null,
  body    text not null,
  sort    int not null default 100,
  unique (shop_id, key)
);
alter table public.sms_templates enable row level security;
drop policy if exists "staff all" on public.sms_templates;
create policy "staff all" on public.sms_templates for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.sms_templates to authenticated;

insert into public.sms_templates (shop_id, key, name, body, sort) values
  ('ryguys', 'confirmation', 'Booking confirmation', 'Hi {first}, this is {shop}. You are booked for {service} on {when}. Reply C to confirm or call {phone} to change it.', 10),
  ('ryguys', 'reminder', 'Day-before reminder', 'Hi {first}, a reminder from {shop}: {vehicle} is booked for {service} tomorrow at {time}. Reply C to confirm.', 20),
  ('ryguys', 'estimate', 'Estimate ready', 'Hi {first}, your estimate from {shop} is ready. Review and approve here: {link}', 30),
  ('ryguys', 'ready', 'Vehicle ready', 'Hi {first}, your {vehicle} is ready at {shop}. Your total is {total}. Pay here or at the counter: {link}', 40),
  ('ryguys', 'thank_you', 'Thank you', 'Thanks for visiting {shop}, {first}. If anything is not right, reply here and we will take care of it.', 50),
  ('ryguys', 'followup', 'Declined work follow-up', 'Hi {first}, {shop} here. {item} was recommended at your last visit. Book whenever it suits you: {link}', 60),
  ('ryguys', 'due', 'Service due', 'Hi {first}, this is {shop}. Your {vehicle} is due for {item}. Book here: {link}', 70),
  ('ryguys', 'pay', 'Text to pay', 'Hi {first}, your invoice from {shop} is {total}. Pay here: {link}', 80)
on conflict (shop_id, key) do nothing;

-- Queue a text. The edge function picks it up through pg_net when `sms_url` is configured; otherwise
-- it stays queued and the desk sends it from the phone (status manual).
create or replace function public.send_sms(p_customer uuid, p_body text, p_kind text default 'manual', p_appointment uuid default null, p_scheduled_for timestamptz default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare c public.customers; mid uuid; url text; secret text; st text;
begin
  select * into c from public.customers where id = p_customer;
  if c.id is null or not public.is_staff(c.shop_id) then raise exception 'Not allowed.'; end if;
  if c.phone = '' then raise exception 'No mobile number on file.'; end if;
  if c.sms_opt_out then raise exception 'This customer opted out of texts.'; end if;
  select value into url from public.app_config where key = 'sms_url';
  select value into secret from public.app_config where key = 'push_secret';
  st := case when p_scheduled_for is not null and p_scheduled_for > now() then 'scheduled' when url is null then 'manual' else 'queued' end;
  insert into public.sms_messages (shop_id, customer_id, appointment_id, phone, direction, body, status, kind, scheduled_for, created_by)
  values (c.shop_id, c.id, p_appointment, c.phone, 'out', p_body, st, p_kind, p_scheduled_for, auth.uid()) returning id into mid;
  if st = 'queued' then
    perform net.http_post(url := url, headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', coalesce(secret, '')), body := jsonb_build_object('id', mid));
  end if;
  return mid;
end $$;
grant execute on function public.send_sms(uuid, text, text, uuid, timestamptz) to authenticated;

-- Scheduled texts go out when their time comes (pg_cron where available; the edge function also sweeps).
create or replace function public.sms_send_due() returns int
language plpgsql security definer set search_path = public as $$
declare url text; secret text; m record; n int := 0;
begin
  select value into url from public.app_config where key = 'sms_url';
  select value into secret from public.app_config where key = 'push_secret';
  for m in select id from public.sms_messages where status = 'scheduled' and scheduled_for <= now() loop
    if url is null then update public.sms_messages set status = 'manual' where id = m.id;
    else update public.sms_messages set status = 'queued' where id = m.id; perform net.http_post(url := url, headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', coalesce(secret, '')), body := jsonb_build_object('id', m.id)); end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Fill a template for one appointment.
create or replace function public.sms_fill(p_key text, p_appointment uuid, p_link text default '') returns text
language plpgsql stable security definer set search_path = public as $$
declare a public.appointments; c public.customers; v public.customer_vehicles; sh public.shops; body text; tot int;
begin
  select * into a from public.appointments where id = p_appointment;
  select * into c from public.customers where id = a.customer_id;
  select * into v from public.customer_vehicles where id = a.vehicle_id;
  select * into sh from public.shops where shop_id = a.shop_id;
  select t.body into body from public.sms_templates t where t.shop_id = a.shop_id and t.key = p_key;
  if body is null then return ''; end if;
  select (public.ro_totals(r.id)->>'total')::int into tot from public.repair_orders r where r.appointment_id = a.id;
  body := replace(body, '{first}', split_part(coalesce(c.name, ''), ' ', 1));
  body := replace(body, '{shop}', coalesce(sh.name, 'the shop'));
  body := replace(body, '{phone}', coalesce(sh.phone, ''));
  body := replace(body, '{service}', coalesce(nullif(a.job, ''), 'service'));
  body := replace(body, '{vehicle}', case when v.id is null then 'your vehicle' else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end);
  body := replace(body, '{when}', to_char(a.starts_at at time zone 'America/Denver', 'Dy Mon FMDD at FMHH12:MI AM'));
  body := replace(body, '{time}', to_char(a.starts_at at time zone 'America/Denver', 'FMHH12:MI AM'));
  body := replace(body, '{total}', '$' || to_char(coalesce(tot, 0) / 100.0, 'FM999,990.00'));
  body := replace(body, '{link}', coalesce(p_link, ''));
  return body;
end $$;
grant execute on function public.sms_fill(text, uuid, text) to authenticated;

-- Automatic confirmation on booking and the day-before reminder.
create or replace function public.appointments_sms() returns trigger
language plpgsql security definer set search_path = public as $$
declare sh public.shops; body text; c public.customers;
begin
  select * into sh from public.shops where shop_id = new.shop_id;
  select * into c from public.customers where id = new.customer_id;
  if c.id is null or c.phone = '' or c.sms_opt_out then return new; end if;
  if tg_op = 'INSERT' and new.status = 'booked' and coalesce((sh.reminders->>'confirm_on_book')::boolean, true) and new.starts_at > now() + interval '1 hour' then
    body := public.sms_fill('confirmation', new.id, '');
    if body <> '' then
      begin perform public.send_sms(new.customer_id, body, 'confirmation', new.id); update public.appointments set confirmation_sent_at = now() where id = new.id; exception when others then null; end;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists appointments_sms on public.appointments;
create trigger appointments_sms after insert on public.appointments for each row execute function public.appointments_sms();

create or replace function public.queue_reminders(p_shop text default 'ryguys') returns int
language plpgsql security definer set search_path = public as $$
declare sh public.shops; a record; body text; n int := 0; hrs int;
begin
  select * into sh from public.shops where shop_id = p_shop;
  hrs := coalesce((sh.reminders->>'remind_hours')::int, 24);
  for a in select x.* from public.appointments x join public.customers c on c.id = x.customer_id
           where x.shop_id = p_shop and x.status = 'booked' and x.reminder_sent_at is null and c.phone <> '' and not c.sms_opt_out
             and x.starts_at between now() + ((hrs - 12) || ' hours')::interval and now() + ((hrs + 12) || ' hours')::interval loop
    body := public.sms_fill('reminder', a.id, '');
    if body <> '' then
      begin perform public.send_sms(a.customer_id, body, 'reminder', a.id); update public.appointments set reminder_sent_at = now() where id = a.id; n := n + 1; exception when others then null; end;
    end if;
  end loop;
  return n;
end $$;
grant execute on function public.queue_reminders(text) to authenticated;

-- A reply of C / YES confirms; STOP opts out. Inbound texts also land in the in-app inbox thread.
create or replace function public.sms_inbound(p_from text, p_body text, p_sid text default '') returns void
language plpgsql security definer set search_path = public as $$
declare c public.customers; ph text; a public.appointments; up text;
begin
  ph := right(regexp_replace(p_from, '\D', '', 'g'), 10);
  select * into c from public.customers where phone = ph order by created_at limit 1;
  insert into public.sms_messages (shop_id, customer_id, phone, direction, body, status, kind, provider_sid, sent_at) values (coalesce(c.shop_id, 'ryguys'), c.id, ph, 'in', p_body, 'received', 'manual', p_sid, now());
  if c.id is null then return; end if;
  up := upper(trim(p_body));
  if up in ('STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT') then update public.customers set sms_opt_out = true where id = c.id; return; end if;
  if up in ('START', 'YES', 'UNSTOP') then update public.customers set sms_opt_out = false where id = c.id; end if;
  if up in ('C', 'CONFIRM', 'CONFIRMED', 'YES', 'Y') then
    select * into a from public.appointments where customer_id = c.id and status = 'booked' and starts_at > now() order by starts_at limit 1;
    if a.id is not null then update public.appointments set confirmed_at = now() where id = a.id; end if;
  end if;
  insert into public.messages (shop_id, customer_id, appointment_id, sender, text, read_by_shop) values (c.shop_id, c.id, (select id from public.appointments where customer_id = c.id and status in ('booked', 'arrived', 'in_progress') order by starts_at limit 1), 'customer', p_body, false);
end $$;

-- Daily jobs, where pg_cron is on (Supabase: Database → Extensions → pg_cron).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('revyn-reminders', '0 15 * * *', $c$select public.queue_reminders('ryguys')$c$);   -- 9 AM Mountain
    perform cron.schedule('revyn-sms-due', '*/5 * * * *', $c$select public.sms_send_due()$c$);
  end if;
exception when others then null;
end $$;

alter publication supabase_realtime add table public.sms_messages, public.blocked_time;
