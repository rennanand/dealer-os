-- Shop details editable by the owner; handoff/return photos visible on the customer's link.

create table if not exists public.shops (
  shop_id            text primary key,
  name               text not null,
  address            text not null default '',
  phone              text not null default '',
  default_rate_cents int  not null default 6500,
  hours              text not null default '',
  updated_at         timestamptz not null default now()
);
alter table public.shops enable row level security;
create policy "members read" on public.shops for select using (public.is_member(shop_id));
create policy "owner update" on public.shops for update using (exists (select 1 from public.shop_members where user_id = auth.uid() and shop_id = shops.shop_id and role = 'owner'));
grant select, update on public.shops to authenticated;
drop trigger if exists shops_touch on public.shops;
create trigger shops_touch before update on public.shops for each row execute function public.touch_updated_at();
insert into public.shops (shop_id, name, address, phone) values ('ryguys', 'RyGuys Tire & Auto Sales', '', '') on conflict do nothing;

-- Shop details for the customer's link (no sign-in): name, address, phone only.
create or replace function public.shop_public(p_shop text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', name, 'address', address, 'phone', phone, 'hours', hours) from public.shops where shop_id = p_shop
$$;
grant execute on function public.shop_public(text) to anon, authenticated;

-- Photos: the bucket becomes readable by URL. Paths are unguessable (rental id + timestamp) and
-- only the rental's own link lists them.
update storage.buckets set public = true where id = 'rental-photos';

create or replace function public.rental_by_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', r.id, 'number', r.number, 'status', r.status, 'customer_name', r.customer_name,
    'start_date', r.start_date, 'end_date', r.end_date, 'rate_cents', r.rate_cents, 'shop_pays', r.shop_pays,
    'clauses', r.clauses, 'mile_cap', r.mile_cap, 'charge_min', r.charge_min, 'deductible', r.deductible,
    'signed_at', r.signed_at, 'signed_name', r.signed_name, 'out_at', r.out_at, 'out_odometer', r.out_odometer, 'out_level', r.out_level,
    'returned_at', r.returned_at, 'in_odometer', r.in_odometer, 'in_level', r.in_level, 'extra_cents', r.extra_cents, 'work_ref', r.work_ref,
    'vehicle', case when v.id is null then null else jsonb_build_object('year', v.year, 'make', v.make, 'model', v.model, 'color', v.color, 'paint', v.paint, 'plate', v.plate, 'vin_last4', v.vin_last4, 'powertrain', v.powertrain, 'odometer', v.odometer, 'level', v.level) end,
    'photos', coalesce((select jsonb_agg(jsonb_build_object('phase', p.phase, 'path', p.path) order by p.created_at) from public.rental_photos p where p.rental_id = r.id and p.phase in ('out', 'in')), '[]'::jsonb),
    'shop', public.shop_public(r.shop_id)
  )
  from public.rentals r left join public.loaner_vehicles v on v.id = r.vehicle_id
  where r.token = p_token
$$;
