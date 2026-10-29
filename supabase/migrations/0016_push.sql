-- Push notifications: device tokens per user, and database triggers that ask the `push` edge function
-- to notify the customer when their visit moves, an estimate lands, or the shop replies.
create extension if not exists pg_net;

create table if not exists public.device_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  platform   text not null default 'ios',
  updated_at timestamptz not null default now()
);
alter table public.device_tokens enable row level security;
create policy "own tokens" on public.device_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.device_tokens to authenticated;

create table if not exists public.app_config (key text primary key, value text not null);
alter table public.app_config enable row level security;   -- no policies: only definer functions read it

-- Who to notify for an appointment: the account that booked it, or any account whose profile phone matches the customer.
create or replace function public.users_for_customer(p_customer uuid, p_user uuid) returns setof uuid
language sql stable security definer set search_path = public as $$
  select p_user where p_user is not null
  union
  select p.user_id from public.customer_profiles p join public.customers c on c.id = p_customer and c.phone = p.phone and p.phone <> ''
$$;

create or replace function public.push_to_users(p_users uuid[], p_title text, p_body text, p_data jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare toks text[]; url text; secret text;
begin
  select array_agg(token) into toks from public.device_tokens where user_id = any (p_users);
  if toks is null or array_length(toks, 1) = 0 then return; end if;
  select value into url from public.app_config where key = 'push_url';
  select value into secret from public.app_config where key = 'push_secret';
  if url is null then return; end if;
  perform net.http_post(url := url, headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', coalesce(secret, '')),
    body := jsonb_build_object('tokens', to_jsonb(toks), 'title', p_title, 'body', p_body, 'data', p_data));
end $$;

create or replace function public.appointments_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare users uuid[]; veh text; title text; body text;
begin
  if new.status is not distinct from old.status then return new; end if;
  select array_agg(u) into users from public.users_for_customer(new.customer_id, new.customer_user) u;
  if users is null then return new; end if;
  select coalesce(nullif(v.model, ''), 'Your car') into veh from public.customer_vehicles v where v.id = new.vehicle_id;
  veh := coalesce(veh, 'Your car');
  if new.status = 'arrived' then title := veh || ' is checked in.'; body := 'We will let you know when work begins.';
  elsif new.status = 'in_progress' then title := 'Work has started on ' || veh || '.'; body := 'Follow along in the app.';
  elsif new.status = 'done' then title := veh || ' is ready.'; body := coalesce('Bay 0' || new.bay || ' · ', '') || 'Pay at the counter when you arrive.';
  else return new; end if;
  perform public.push_to_users(users, title, body, jsonb_build_object('view', 'service', 'appointment', new.id));
  return new;
end $$;
drop trigger if exists appointments_push on public.appointments;
create trigger appointments_push after update on public.appointments for each row execute function public.appointments_push();

create or replace function public.findings_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare a public.appointments; users uuid[];
begin
  select * into a from public.appointments where id = new.appointment_id;
  select array_agg(u) into users from public.users_for_customer(a.customer_id, a.customer_user) u;
  if users is null then return new; end if;
  perform public.push_to_users(users, 'Estimate ready.', new.name || case when new.price_cents > 0 then ' · $' || to_char(new.price_cents / 100.0, 'FM999,990.00') else '' end || '. Your approval is needed before any extra work starts.', jsonb_build_object('view', 'findings', 'appointment', a.id));
  return new;
end $$;
drop trigger if exists findings_push on public.findings;
create trigger findings_push after insert on public.findings for each row execute function public.findings_push();

create or replace function public.messages_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare users uuid[]; shop_name text;
begin
  if new.sender <> 'advisor' then return new; end if;
  select array_agg(u) into users from public.users_for_customer(new.customer_id, null) u;
  if users is null then return new; end if;
  select split_part(name, ' ', 1) into shop_name from public.shops where shop_id = new.shop_id;
  perform public.push_to_users(users, coalesce(shop_name, 'Your shop'), left(new.text, 180), jsonb_build_object('view', 'messages'));
  return new;
end $$;
drop trigger if exists messages_push on public.messages;
create trigger messages_push after insert on public.messages for each row execute function public.messages_push();
