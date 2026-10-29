-- The customer app on real records: stage timestamps on appointments, the customer's own vehicles.

alter table public.appointments
  add column if not exists arrived_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists done_at    timestamptz;

create or replace function public.appointments_stamp() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'arrived'     and new.arrived_at is null then new.arrived_at = now(); end if;
    if new.status = 'in_progress' and new.started_at is null then new.started_at = now(); end if;
    if new.status = 'done'        and new.done_at    is null then new.done_at    = now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists appointments_stamp on public.appointments;
create trigger appointments_stamp before update on public.appointments for each row execute function public.appointments_stamp();
update public.appointments set arrived_at = coalesce(arrived_at, created_at) where status in ('arrived', 'in_progress', 'done') and arrived_at is null;

-- Customers see and add their own vehicles (matched to the shop's customer record by mobile number).
create or replace function public.my_customer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select c.id from public.customer_profiles p join public.customers c on c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''
  where p.user_id = auth.uid() limit 1
$$;

create or replace function public.my_vehicles() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'year', v.year, 'make', v.make, 'model', v.model, 'plate', v.plate, 'odometer', v.odometer,
    'visits', (select count(*) from public.appointments a where a.vehicle_id = v.id and a.status = 'done')) order by v.created_at), '[]'::jsonb)
  from public.customer_vehicles v where v.customer_id = public.my_customer_id()
$$;
grant execute on function public.my_vehicles() to authenticated;

create or replace function public.add_my_vehicle(p_year int, p_make text, p_model text, p_plate text default '', p_odometer int default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof public.customer_profiles; cid uuid; vid uuid;
begin
  select * into prof from public.customer_profiles where user_id = auth.uid();
  if prof.user_id is null or prof.phone = '' then raise exception 'Add your mobile number first.'; end if;
  cid := public.my_customer_id();
  if cid is null then
    insert into public.customers (shop_id, name, phone) values (prof.shop_id, coalesce(nullif(prof.name, ''), 'Customer'), prof.phone) returning id into cid;
  end if;
  insert into public.customer_vehicles (shop_id, customer_id, year, make, model, plate, odometer)
  values (prof.shop_id, cid, p_year, left(coalesce(p_make, ''), 40), left(coalesce(p_model, ''), 60), upper(left(coalesce(p_plate, ''), 12)), p_odometer)
  returning id into vid;
  return jsonb_build_object('id', vid);
end $$;
grant execute on function public.add_my_vehicle(int, text, text, text, int) to authenticated;

create or replace function public.update_my_odometer(p_vehicle uuid, p_odometer int) returns void
language sql security definer set search_path = public as $$
  update public.customer_vehicles set odometer = p_odometer where id = p_vehicle and customer_id = public.my_customer_id()
$$;
grant execute on function public.update_my_odometer(uuid, int) to authenticated;

create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'vehicle_id', a.vehicle_id,
    'vehicle', case when v.id is null then null else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end
  ) order by a.starts_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.appointments a on a.shop_id = p.shop_id and (a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
  left join public.customer_vehicles v on v.id = a.vehicle_id
  where p.user_id = auth.uid() and a.starts_at > now() - interval '180 days'
$$;

-- Booking from the app may name an existing vehicle by id.
create or replace function public.book_appointment(p_starts_at timestamptz, p_job text, p_visit text, p_vehicle text default '', p_plate text default '', p_notes text default '', p_vehicle_id uuid default null)
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
  if p_vehicle_id is not null then
    select id into vid from public.customer_vehicles where id = p_vehicle_id and customer_id = cid;
  elsif coalesce(p_vehicle, '') <> '' then
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
grant execute on function public.book_appointment(timestamptz, text, text, text, text, text, uuid) to authenticated;
