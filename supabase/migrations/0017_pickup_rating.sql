-- Pickup ("on my way" / "here") and a rating after the visit, both from the customer app.
alter table public.appointments
  add column if not exists pickup text not null default '' check (pickup in ('', 'on_way', 'here', 'picked_up')),
  add column if not exists pickup_at timestamptz,
  add column if not exists rating int check (rating between 1 and 5),
  add column if not exists rating_tags text[] not null default '{}',
  add column if not exists rating_note text not null default '',
  add column if not exists rated_at timestamptz;

create or replace function public.set_my_pickup(p_id uuid, p_state text) returns void
language sql security definer set search_path = public as $$
  update public.appointments a set pickup = p_state, pickup_at = now()
  where a.id = p_id and p_state in ('on_way', 'here') and a.status = 'done'
    and (a.customer_user = auth.uid() or a.customer_id in (select c.id from public.customers c join public.customer_profiles p on p.user_id = auth.uid() and c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
$$;
grant execute on function public.set_my_pickup(uuid, text) to authenticated;

create or replace function public.rate_my_visit(p_id uuid, p_stars int, p_tags text[], p_note text) returns void
language sql security definer set search_path = public as $$
  update public.appointments a set rating = p_stars, rating_tags = coalesce(p_tags, '{}'), rating_note = left(coalesce(p_note, ''), 1000), rated_at = now()
  where a.id = p_id and a.status = 'done' and p_stars between 1 and 5
    and (a.customer_user = auth.uid() or a.customer_id in (select c.id from public.customers c join public.customer_profiles p on p.user_id = auth.uid() and c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
$$;
grant execute on function public.rate_my_visit(uuid, int, text[], text) to authenticated;

create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'vehicle_id', a.vehicle_id,
    'pickup', a.pickup, 'rating', a.rating, 'tech', split_part(t.name, ' ', 1),
    'vehicle', case when v.id is null then null else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end,
    'findings', (select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'tier', f.tier, 'name', f.name, 'plain', f.plain, 'tech', f.tech, 'meas', f.meas, 'meas_label', f.meas_label, 'urgency', f.urgency, 'wait_text', f.wait_text, 'price_cents', f.price_cents, 'status', f.status, 'created_at', f.created_at) order by f.created_at), '[]'::jsonb) from public.findings f where f.appointment_id = a.id),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.id, 'path', ph.path, 'caption', ph.caption, 'meas', ph.meas, 'finding_id', ph.finding_id, 'created_at', ph.created_at) order by ph.created_at), '[]'::jsonb) from public.visit_photos ph where ph.appointment_id = a.id)
  ) order by a.starts_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.appointments a on a.shop_id = p.shop_id and (a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
  left join public.customer_vehicles v on v.id = a.vehicle_id
  left join public.technicians t on t.id = a.tech_id
  where p.user_id = auth.uid() and a.starts_at > now() - interval '180 days'
$$;
