-- VIN-decoded details on a vehicle (from NHTSA vPIC, decoded on the device). Customers add a car by
-- scanning or typing the VIN; the shop sees the same facts on the desktop.
alter table public.customer_vehicles
  add column if not exists trim   text not null default '',
  add column if not exists engine text not null default '',   -- "3.5L V6 · 365 hp"
  add column if not exists body   text not null default '',   -- "Pickup"
  add column if not exists drive  text not null default '',   -- "4WD"
  add column if not exists fuel   text not null default '';

drop function if exists public.add_my_vehicle(int, text, text, text, int);
create or replace function public.add_my_vehicle(p_year int, p_make text, p_model text, p_plate text default '', p_odometer int default null,
  p_vin text default '', p_color text default '', p_trim text default '', p_engine text default '', p_body text default '', p_drive text default '', p_fuel text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof public.customer_profiles; cid uuid; vid uuid;
begin
  select * into prof from public.customer_profiles where user_id = auth.uid();
  if prof.user_id is null or prof.phone = '' then raise exception 'Add your mobile number first.'; end if;
  cid := public.my_customer_id();
  if cid is null then
    insert into public.customers (shop_id, name, phone) values (prof.shop_id, coalesce(nullif(prof.name, ''), 'Customer'), prof.phone) returning id into cid;
  end if;
  -- Same VIN already on file (imported from the old system, say): update it instead of adding a twin.
  if coalesce(p_vin, '') <> '' then select id into vid from public.customer_vehicles where customer_id = cid and upper(vin) = upper(p_vin) limit 1; end if;
  if vid is not null then
    update public.customer_vehicles set year = coalesce(p_year, year), make = case when coalesce(p_make, '') <> '' then left(p_make, 40) else make end, model = case when coalesce(p_model, '') <> '' then left(p_model, 60) else model end,
      plate = case when coalesce(p_plate, '') <> '' then upper(left(p_plate, 12)) else plate end, odometer = coalesce(p_odometer, odometer), color = case when coalesce(p_color, '') <> '' then left(p_color, 30) else color end,
      trim = coalesce(p_trim, trim), engine = coalesce(p_engine, engine), body = coalesce(p_body, body), drive = coalesce(p_drive, drive), fuel = coalesce(p_fuel, fuel)
    where id = vid;
    return jsonb_build_object('id', vid, 'merged', true);
  end if;
  insert into public.customer_vehicles (shop_id, customer_id, year, make, model, plate, vin, odometer, color, trim, engine, body, drive, fuel)
  values (prof.shop_id, cid, p_year, left(coalesce(p_make, ''), 40), left(coalesce(p_model, ''), 60), upper(left(coalesce(p_plate, ''), 12)), upper(left(coalesce(p_vin, ''), 17)), p_odometer, left(coalesce(p_color, ''), 30), left(coalesce(p_trim, ''), 60), left(coalesce(p_engine, ''), 60), left(coalesce(p_body, ''), 40), left(coalesce(p_drive, ''), 30), left(coalesce(p_fuel, ''), 30))
  returning id into vid;
  return jsonb_build_object('id', vid);
end $$;
grant execute on function public.add_my_vehicle(int, text, text, text, int, text, text, text, text, text, text, text) to authenticated;

drop function if exists public.update_my_vehicle(uuid, int, text, text, text, text, text);
create or replace function public.update_my_vehicle(p_vehicle uuid, p_year int, p_make text, p_model text, p_plate text, p_color text, p_nickname text,
  p_vin text default null, p_trim text default null, p_engine text default null, p_body text default null, p_drive text default null, p_fuel text default null) returns void
language sql security definer set search_path = public as $$
  update public.customer_vehicles
  set year = p_year, make = left(coalesce(p_make, ''), 40), model = left(coalesce(p_model, ''), 60), plate = upper(left(coalesce(p_plate, ''), 12)),
      color = left(coalesce(p_color, ''), 30), nickname = left(coalesce(p_nickname, ''), 40),
      vin = coalesce(upper(left(p_vin, 17)), vin), trim = coalesce(left(p_trim, 60), trim), engine = coalesce(left(p_engine, 60), engine), body = coalesce(left(p_body, 40), body), drive = coalesce(left(p_drive, 30), drive), fuel = coalesce(left(p_fuel, 30), fuel)
  where id = p_vehicle and customer_id = public.my_customer_id()
$$;
grant execute on function public.update_my_vehicle(uuid, int, text, text, text, text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.my_vehicles() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'year', v.year, 'make', v.make, 'model', v.model, 'plate', v.plate, 'odometer', v.odometer,
    'color', v.color, 'nickname', v.nickname, 'last_visit_at', v.last_visit_at, 'last_service', v.last_service,
    'vin', v.vin, 'trim', v.trim, 'engine', v.engine, 'body', v.body, 'drive', v.drive, 'fuel', v.fuel,
    'visits', (select count(*) from public.appointments a where a.vehicle_id = v.id and a.status = 'done')) order by v.created_at), '[]'::jsonb)
  from public.customer_vehicles v where v.customer_id = public.my_customer_id()
$$;
