-- Shops carry a map location and real opening hours; the customer app lists every shop on Revyn.
alter table public.shops
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists city text not null default '',
  add column if not exists open_days int[] not null default '{1,2,3,4,5}',   -- 0 = Sunday
  add column if not exists open_from text not null default '08:00',
  add column if not exists open_to text not null default '17:00';

update public.shops set
  name = 'RyGuys Tire & Auto Sales', address = '204 N Main St, Manti, UT 84642', city = 'Manti, UT', phone = '4358354869',
  lat = 39.2686964, lng = -111.636588, open_days = '{1,2,4,5}', open_from = '08:00', open_to = '17:30',
  hours = 'Mon, Tue, Thu, Fri · 8:00 AM – 5:30 PM'
where shop_id = 'ryguys';

create or replace function public.shop_public(p_shop text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('shop_id', shop_id, 'name', name, 'address', address, 'city', city, 'phone', phone, 'hours', hours,
    'lat', lat, 'lng', lng, 'open_days', open_days, 'open_from', open_from, 'open_to', open_to)
  from public.shops where shop_id = p_shop
$$;

create or replace function public.shops_public() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('shop_id', shop_id, 'name', name, 'address', address, 'city', city, 'phone', phone, 'hours', hours,
    'lat', lat, 'lng', lng, 'open_days', open_days, 'open_from', open_from, 'open_to', open_to) order by name), '[]'::jsonb)
  from public.shops
$$;
grant execute on function public.shops_public() to anon, authenticated;
