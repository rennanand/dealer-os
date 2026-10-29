-- Technicians: who works which bays; a visit can be assigned to one. The lobby board reads today's bays.

create table if not exists public.technicians (
  id         uuid primary key default gen_random_uuid(),
  shop_id    text not null default 'ryguys',
  name       text not null,
  role       text not null default 'Technician',
  bays       int[] not null default '{}',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.technicians enable row level security;
create policy "staff all" on public.technicians for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.technicians to authenticated;
alter publication supabase_realtime add table public.technicians;

alter table public.appointments add column if not exists tech_id uuid references public.technicians (id) on delete set null;

-- Customers see the first name of whoever is on their car.
create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'vehicle_id', a.vehicle_id,
    'tech', split_part(t.name, ' ', 1),
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

-- The lobby board (Apple TV / any screen with a display token): today's bays plus loaners.
create or replace function public.board_by_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'shop', public.shop_public(d.shop_id),
    'bays', coalesce((
      select jsonb_agg(jsonb_build_object(
        'bay', a.bay, 'status', a.status, 'job', a.job, 'starts_at', a.starts_at, 'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at,
        'who', split_part(c.name, ' ', 1) || case when split_part(c.name, ' ', 2) <> '' then ' ' || left(split_part(c.name, ' ', 2), 1) || '.' else '' end,
        'vehicle', case when v.id is null then null else trim(coalesce(v.make, '') || ' ' || coalesce(v.model, '')) end,
        'tech', split_part(t.name, ' ', 1),
        'pending', (select count(*) from public.findings f where f.appointment_id = a.id and f.status = 'pending')
      ) order by a.bay)
      from public.appointments a
      left join public.customers c on c.id = a.customer_id
      left join public.customer_vehicles v on v.id = a.vehicle_id
      left join public.technicians t on t.id = a.tech_id
      where a.shop_id = d.shop_id and a.bay is not null and a.status in ('arrived', 'in_progress', 'done')
        and a.starts_at >= date_trunc('day', now() at time zone 'America/Denver') at time zone 'America/Denver'), '[]'::jsonb),
    'rentals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'number', r.number, 'status', r.status,
        'who', split_part(r.customer_name, ' ', 1) || case when split_part(r.customer_name, ' ', 2) <> '' then ' ' || left(split_part(r.customer_name, ' ', 2), 1) || '.' else '' end,
        'vehicle', case when v.id is null then null else v.year || ' ' || v.make || ' ' || v.model end, 'paint', v.paint,
        'start_date', r.start_date, 'end_date', r.end_date, 'out_at', r.out_at
      ) order by r.end_date, r.created_at)
      from public.rentals r left join public.loaner_vehicles v on v.id = r.vehicle_id
      where r.shop_id = d.shop_id and r.status in ('signed', 'out')), '[]'::jsonb),
    'fleet', coalesce((select jsonb_agg(jsonb_build_object('vehicle', year || ' ' || make || ' ' || model, 'color', color, 'paint', paint, 'status', status) order by year desc)
      from public.loaner_vehicles where shop_id = d.shop_id and status <> 'retired'), '[]'::jsonb),
    'generated_at', now()
  )
  from public.display_tokens d where d.token = p_token
$$;
