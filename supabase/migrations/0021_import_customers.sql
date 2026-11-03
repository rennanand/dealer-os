-- Migrating a shop onto Revyn: customers, their vehicles and last-visit facts come in from the old
-- system's export (Tekmetric or any CSV). Idempotent: matched by phone, then by plate/VIN, so a second
-- import updates rather than duplicates.

alter table public.customers
  add column if not exists source text not null default '',       -- 'tekmetric', 'csv'
  add column if not exists external_id text not null default '',
  add column if not exists last_visit_at date,
  add column if not exists invited_at timestamptz,
  add column if not exists joined_at timestamptz;                   -- first app sign-in matched to this record
create index if not exists customers_shop_external on public.customers (shop_id, external_id);

alter table public.customer_vehicles
  add column if not exists last_visit_at date,
  add column if not exists last_service text not null default '';
create index if not exists customer_vehicles_plate on public.customer_vehicles (shop_id, plate);
create index if not exists customer_vehicles_vin on public.customer_vehicles (shop_id, vin);

-- rows: [{name, phone, email, city, external_id, last_visit, vehicles: [{year, make, model, plate, vin, odometer, color, last_visit, last_service}]}]
create or replace function public.import_customers(p_rows jsonb, p_source text default 'csv') returns jsonb
language plpgsql security definer set search_path = public as $$
declare sid text; row jsonb; veh jsonb; cid uuid; vid uuid; ph text; n_new int := 0; n_upd int := 0; v_new int := 0; v_upd int := 0; nm text;
begin
  select shop_id into sid from public.shop_members where user_id = auth.uid() and role in ('advisor', 'owner') limit 1;
  if sid is null then raise exception 'Only advisors and owners can import.'; end if;
  for row in select * from jsonb_array_elements(p_rows) loop
    ph := regexp_replace(coalesce(row->>'phone', ''), '\D', '', 'g');
    if length(ph) = 11 and left(ph, 1) = '1' then ph := substr(ph, 2); end if;
    nm := trim(coalesce(row->>'name', ''));
    if nm = '' and ph = '' then continue; end if;
    if nm = '' then nm := 'Customer'; end if;
    cid := null;
    if ph <> '' then select id into cid from public.customers where shop_id = sid and phone = ph limit 1; end if;
    if cid is null and coalesce(row->>'external_id', '') <> '' then select id into cid from public.customers where shop_id = sid and external_id = row->>'external_id' limit 1; end if;
    if cid is null then
      insert into public.customers (shop_id, name, phone, email, city, source, external_id, last_visit_at)
      values (sid, nm, ph, lower(trim(coalesce(row->>'email', ''))), trim(coalesce(row->>'city', '')), p_source, coalesce(row->>'external_id', ''), nullif(row->>'last_visit', '')::date)
      returning id into cid; n_new := n_new + 1;
    else
      update public.customers set
        name = case when nm <> 'Customer' then nm else name end,
        email = case when coalesce(row->>'email', '') <> '' then lower(trim(row->>'email')) else email end,
        city = case when coalesce(row->>'city', '') <> '' then trim(row->>'city') else city end,
        source = case when source = '' then p_source else source end,
        external_id = case when external_id = '' then coalesce(row->>'external_id', '') else external_id end,
        last_visit_at = greatest(last_visit_at, nullif(row->>'last_visit', '')::date)
      where id = cid; n_upd := n_upd + 1;
    end if;
    for veh in select * from jsonb_array_elements(coalesce(row->'vehicles', '[]'::jsonb)) loop
      if coalesce(veh->>'make', '') = '' and coalesce(veh->>'model', '') = '' and coalesce(veh->>'vin', '') = '' then continue; end if;
      vid := null;
      if coalesce(veh->>'vin', '') <> '' then select id into vid from public.customer_vehicles where customer_id = cid and upper(vin) = upper(veh->>'vin') limit 1; end if;
      if vid is null and coalesce(veh->>'plate', '') <> '' then select id into vid from public.customer_vehicles where customer_id = cid and upper(plate) = upper(veh->>'plate') limit 1; end if;
      if vid is null then select id into vid from public.customer_vehicles where customer_id = cid and lower(make) = lower(coalesce(veh->>'make', '')) and lower(model) = lower(coalesce(veh->>'model', '')) and coalesce(year, 0) = coalesce(nullif(veh->>'year', '')::int, 0) limit 1; end if;
      if vid is null then
        insert into public.customer_vehicles (shop_id, customer_id, year, make, model, plate, vin, odometer, color, last_visit_at, last_service)
        values (sid, cid, nullif(veh->>'year', '')::int, left(coalesce(veh->>'make', ''), 40), left(coalesce(veh->>'model', ''), 60), upper(left(coalesce(veh->>'plate', ''), 12)), upper(left(coalesce(veh->>'vin', ''), 17)), nullif(regexp_replace(coalesce(veh->>'odometer', ''), '\D', '', 'g'), '')::int, left(coalesce(veh->>'color', ''), 30), nullif(veh->>'last_visit', '')::date, left(coalesce(veh->>'last_service', ''), 120));
        v_new := v_new + 1;
      else
        update public.customer_vehicles set
          plate = case when coalesce(veh->>'plate', '') <> '' then upper(left(veh->>'plate', 12)) else plate end,
          vin = case when coalesce(veh->>'vin', '') <> '' then upper(left(veh->>'vin', 17)) else vin end,
          odometer = greatest(odometer, nullif(regexp_replace(coalesce(veh->>'odometer', ''), '\D', '', 'g'), '')::int),
          color = case when color = '' then left(coalesce(veh->>'color', ''), 30) else color end,
          last_visit_at = greatest(last_visit_at, nullif(veh->>'last_visit', '')::date),
          last_service = case when coalesce(veh->>'last_service', '') <> '' then left(veh->>'last_service', 120) else last_service end
        where id = vid; v_upd := v_upd + 1;
      end if;
    end loop;
  end loop;
  return jsonb_build_object('customers_new', n_new, 'customers_updated', n_upd, 'vehicles_new', v_new, 'vehicles_updated', v_upd);
end $$;
grant execute on function public.import_customers(jsonb, text) to authenticated;

-- When a customer signs in with a number the shop already has, note that they joined.
create or replace function public.mark_joined() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.customers set joined_at = coalesce(joined_at, now()) where shop_id = new.shop_id and phone = new.phone and new.phone <> '';
  return new;
end $$;
drop trigger if exists customer_profiles_joined on public.customer_profiles;
create trigger customer_profiles_joined after insert or update of phone on public.customer_profiles for each row execute function public.mark_joined();

-- The customer sees what the shop already knows about the car: last visit and what was done.
create or replace function public.my_vehicles() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'year', v.year, 'make', v.make, 'model', v.model, 'plate', v.plate, 'odometer', v.odometer,
    'color', v.color, 'nickname', v.nickname, 'last_visit_at', v.last_visit_at, 'last_service', v.last_service,
    'visits', (select count(*) from public.appointments a where a.vehicle_id = v.id and a.status = 'done')) order by v.created_at), '[]'::jsonb)
  from public.customer_vehicles v where v.customer_id = public.my_customer_id()
$$;

-- Staff: mark a customer invited (the desk texts the link by hand until SMS is wired).
create or replace function public.mark_invited(p_customer uuid) returns void
language sql security definer set search_path = public as $$
  update public.customers set invited_at = now() where id = p_customer and public.is_staff(shop_id)
$$;
grant execute on function public.mark_invited(uuid) to authenticated;
