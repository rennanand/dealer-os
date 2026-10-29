-- Real customers, their vehicles, and the appointment book. Staff of the shop read and write; nothing is public.

create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  shop_id    text not null default 'ryguys',
  name       text not null,
  phone      text not null default '',
  email      text not null default '',
  city       text not null default '',
  notes      text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists customers_shop_phone on public.customers (shop_id, phone);

create table if not exists public.customer_vehicles (
  id          uuid primary key default gen_random_uuid(),
  shop_id     text not null default 'ryguys',
  customer_id uuid not null references public.customers (id) on delete cascade,
  year        int,
  make        text not null default '',
  model       text not null default '',
  plate       text not null default '',
  vin         text not null default '',
  odometer    int,
  created_at  timestamptz not null default now()
);

create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  shop_id     text not null default 'ryguys',
  customer_id uuid references public.customers (id) on delete set null,
  vehicle_id  uuid references public.customer_vehicles (id) on delete set null,
  starts_at   timestamptz not null,
  minutes     int not null default 60,
  job         text not null default '',
  visit       text not null default 'dropoff' check (visit in ('dropoff', 'wait', 'loaner')),
  status      text not null default 'booked' check (status in ('booked', 'arrived', 'in_progress', 'done', 'cancelled', 'no_show')),
  bay         int,
  notes       text not null default '',
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now()
);
create index if not exists appointments_shop_day on public.appointments (shop_id, starts_at);

alter table public.customers enable row level security;
alter table public.customer_vehicles enable row level security;
alter table public.appointments enable row level security;
create policy "staff all" on public.customers for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
create policy "staff all" on public.customer_vehicles for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
create policy "staff all" on public.appointments for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.customers, public.customer_vehicles, public.appointments to authenticated;

alter publication supabase_realtime add table public.customers, public.customer_vehicles, public.appointments;

-- A loaner rental may point at the customer record so visits and loaners show on one page.
alter table public.rentals add column if not exists customer_id uuid references public.customers (id) on delete set null;

-- Customers book from the app. The booking creates (or finds, by mobile number) their customer
-- record so the shop sees one person across visits and loaners.
alter table public.appointments add column if not exists customer_user uuid references auth.users (id) on delete set null;

create or replace function public.book_appointment(p_starts_at timestamptz, p_job text, p_visit text, p_vehicle text default '', p_plate text default '', p_notes text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare prof public.customer_profiles; cid uuid; vid uuid; aid uuid; parts text[];
begin
  select * into prof from public.customer_profiles where user_id = auth.uid();
  if prof.user_id is null or prof.phone = '' then raise exception 'Add your mobile number first.'; end if;
  if p_starts_at < now() then raise exception 'Pick a time in the future.'; end if;
  select id into cid from public.customers where shop_id = prof.shop_id and phone = prof.phone limit 1;
  if cid is null then
    insert into public.customers (shop_id, name, phone) values (prof.shop_id, coalesce(nullif(prof.name, ''), 'Customer'), prof.phone) returning id into cid;
  end if;
  if coalesce(p_vehicle, '') <> '' then
    select id into vid from public.customer_vehicles where customer_id = cid and (lower(make || ' ' || model) = lower(p_vehicle) or lower(year || ' ' || make || ' ' || model) = lower(p_vehicle) or (p_plate <> '' and upper(plate) = upper(p_plate))) limit 1;
    if vid is null then
      parts := regexp_split_to_array(trim(p_vehicle), '\s+');
      if parts[1] ~ '^\d{4}$' then
        insert into public.customer_vehicles (shop_id, customer_id, year, make, model, plate) values (prof.shop_id, cid, parts[1]::int, coalesce(parts[2], ''), array_to_string(parts[3:], ' '), upper(coalesce(p_plate, ''))) returning id into vid;
      else
        insert into public.customer_vehicles (shop_id, customer_id, make, model, plate) values (prof.shop_id, cid, coalesce(parts[1], ''), array_to_string(parts[2:], ' '), upper(coalesce(p_plate, ''))) returning id into vid;
      end if;
    end if;
  end if;
  insert into public.appointments (shop_id, customer_id, vehicle_id, starts_at, job, visit, notes, customer_user, created_by)
  values (prof.shop_id, cid, vid, p_starts_at, left(coalesce(p_job, ''), 200), case when p_visit in ('dropoff','wait','loaner') then p_visit else 'dropoff' end, left(coalesce(p_notes, ''), 1000), auth.uid(), auth.uid())
  returning id into aid;
  return jsonb_build_object('id', aid);
end $$;
grant execute on function public.book_appointment(timestamptz, text, text, text, text, text) to authenticated;

create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay,
    'vehicle', case when v.id is null then null else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end
  ) order by a.starts_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.appointments a on a.shop_id = p.shop_id and (a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
  left join public.customer_vehicles v on v.id = a.vehicle_id
  where p.user_id = auth.uid() and a.starts_at > now() - interval '90 days'
$$;
grant execute on function public.my_appointments() to authenticated;

create or replace function public.cancel_my_appointment(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.appointments set status = 'cancelled' where id = p_id and customer_user = auth.uid() and status in ('booked')
$$;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;
