-- Messages between the shop and a customer, shown in the app and in the shop's Inbox.

create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  customer_id    uuid not null references public.customers (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  sender         text not null check (sender in ('customer', 'advisor')),
  text           text not null,
  sent_by        uuid references auth.users (id),
  read_by_shop   boolean not null default false,
  read_by_cust   boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists messages_cust on public.messages (customer_id, created_at);
alter table public.messages enable row level security;
create policy "staff all" on public.messages for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.messages to authenticated;
alter publication supabase_realtime add table public.messages;

create or replace function public.my_messages() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'sender', m.sender, 'text', m.text, 'created_at', m.created_at, 'read', m.read_by_cust) order by m.created_at), '[]'::jsonb)
  from public.messages m where m.customer_id = public.my_customer_id() and m.created_at > now() - interval '180 days'
$$;
grant execute on function public.my_messages() to authenticated;

create or replace function public.send_my_message(p_text text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof public.customer_profiles; cid uuid; aid uuid; mid uuid;
begin
  select * into prof from public.customer_profiles where user_id = auth.uid();
  if prof.user_id is null or prof.phone = '' then raise exception 'Add your mobile number first.'; end if;
  cid := public.my_customer_id();
  if cid is null then
    insert into public.customers (shop_id, name, phone) values (prof.shop_id, coalesce(nullif(prof.name, ''), 'Customer'), prof.phone) returning id into cid;
  end if;
  select id into aid from public.appointments where customer_id = cid and status in ('booked', 'arrived', 'in_progress') order by starts_at limit 1;
  insert into public.messages (shop_id, customer_id, appointment_id, sender, text, sent_by, read_by_cust)
  values (prof.shop_id, cid, aid, 'customer', left(trim(p_text), 2000), auth.uid(), true) returning id into mid;
  return jsonb_build_object('id', mid);
end $$;
grant execute on function public.send_my_message(text) to authenticated;

create or replace function public.mark_my_messages_read() returns void
language sql security definer set search_path = public as $$
  update public.messages set read_by_cust = true where customer_id = public.my_customer_id() and sender = 'advisor' and read_by_cust = false
$$;
grant execute on function public.mark_my_messages_read() to authenticated;
