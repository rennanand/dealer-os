-- Customers with an account see their own rentals in the app, matched by mobile number.
create table if not exists public.customer_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  shop_id    text not null default 'ryguys',
  phone      text not null default '',               -- digits only
  name       text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.customer_profiles enable row level security;
create policy "own profile" on public.customer_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.customer_profiles to authenticated;

create or replace function public.my_rentals() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'number', r.number, 'status', r.status, 'token', r.token, 'start_date', r.start_date, 'end_date', r.end_date,
    'vehicle', case when v.id is null then null else v.year || ' ' || v.make || ' ' || v.model end, 'color', v.color, 'paint', v.paint
  ) order by r.created_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.rentals r on r.shop_id = p.shop_id and regexp_replace(r.customer_phone, '\D', '', 'g') = p.phone and p.phone <> ''
  left join public.loaner_vehicles v on v.id = r.vehicle_id
  where p.user_id = auth.uid() and r.status <> 'cancelled'
$$;
grant execute on function public.my_rentals() to authenticated;
