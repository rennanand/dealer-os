-- Customers can give a vehicle a color (drives the 3D paint) and a nickname (Tesla-style title).
alter table public.customer_vehicles
  add column if not exists color text not null default '',
  add column if not exists nickname text not null default '';

create or replace function public.my_vehicles() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'year', v.year, 'make', v.make, 'model', v.model, 'plate', v.plate, 'odometer', v.odometer,
    'color', v.color, 'nickname', v.nickname,
    'visits', (select count(*) from public.appointments a where a.vehicle_id = v.id and a.status = 'done')) order by v.created_at), '[]'::jsonb)
  from public.customer_vehicles v where v.customer_id = public.my_customer_id()
$$;

create or replace function public.update_my_vehicle(p_vehicle uuid, p_year int, p_make text, p_model text, p_plate text, p_color text, p_nickname text) returns void
language sql security definer set search_path = public as $$
  update public.customer_vehicles
  set year = p_year, make = left(coalesce(p_make, ''), 40), model = left(coalesce(p_model, ''), 60), plate = upper(left(coalesce(p_plate, ''), 12)),
      color = left(coalesce(p_color, ''), 30), nickname = left(coalesce(p_nickname, ''), 40)
  where id = p_vehicle and customer_id = public.my_customer_id()
$$;
grant execute on function public.update_my_vehicle(uuid, int, text, text, text, text, text) to authenticated;

create or replace function public.remove_my_vehicle(p_vehicle uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.customer_vehicles
  where id = p_vehicle and customer_id = public.my_customer_id()
    and not exists (select 1 from public.appointments a where a.vehicle_id = p_vehicle and a.status in ('booked', 'arrived', 'in_progress'))
$$;
grant execute on function public.remove_my_vehicle(uuid) to authenticated;
