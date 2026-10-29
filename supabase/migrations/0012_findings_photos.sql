-- Inspection findings and technician photos on a visit; customers approve or decline work from the app.

create table if not exists public.findings (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  tier           text not null default 'now' check (tier in ('now', 'soon', 'monitor')),
  name           text not null,
  plain          text not null default '',    -- what the customer reads
  tech           text not null default '',    -- the technician's note
  meas           text not null default '',    -- e.g. "3 mm", measured at the visit
  meas_label     text not null default '',
  urgency        text not null default '',
  wait_text      text not null default '',
  price_cents    int  not null default 0,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'done')),
  decided_at     timestamptz,
  created_by     uuid references auth.users (id),
  created_at     timestamptz not null default now()
);
create index if not exists findings_appt on public.findings (appointment_id);

create table if not exists public.visit_photos (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  finding_id     uuid references public.findings (id) on delete set null,
  path           text not null,
  caption        text not null default '',
  meas           text not null default '',
  created_at     timestamptz not null default now()
);
create index if not exists visit_photos_appt on public.visit_photos (appointment_id);

alter table public.findings enable row level security;
alter table public.visit_photos enable row level security;
create policy "staff all" on public.findings for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
create policy "staff all" on public.visit_photos for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.findings, public.visit_photos to authenticated;
alter publication supabase_realtime add table public.findings, public.visit_photos;

insert into storage.buckets (id, name, public) values ('visit-photos', 'visit-photos', true) on conflict (id) do update set public = true;
create policy "staff upload visit photos" on storage.objects for insert to authenticated with check (bucket_id = 'visit-photos' and public.is_staff('ryguys'));
create policy "staff manage visit photos" on storage.objects for update to authenticated using (bucket_id = 'visit-photos' and public.is_staff('ryguys'));
create policy "staff delete visit photos" on storage.objects for delete to authenticated using (bucket_id = 'visit-photos' and public.is_staff('ryguys'));
create policy "visit photos are readable by url" on storage.objects for select to anon, authenticated using (bucket_id = 'visit-photos');

-- The customer's visits now carry their findings and photos.
create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'vehicle_id', a.vehicle_id,
    'vehicle', case when v.id is null then null else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end,
    'findings', (select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'tier', f.tier, 'name', f.name, 'plain', f.plain, 'tech', f.tech, 'meas', f.meas, 'meas_label', f.meas_label, 'urgency', f.urgency, 'wait_text', f.wait_text, 'price_cents', f.price_cents, 'status', f.status, 'created_at', f.created_at) order by f.created_at), '[]'::jsonb) from public.findings f where f.appointment_id = a.id),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.id, 'path', ph.path, 'caption', ph.caption, 'meas', ph.meas, 'finding_id', ph.finding_id, 'created_at', ph.created_at) order by ph.created_at), '[]'::jsonb) from public.visit_photos ph where ph.appointment_id = a.id)
  ) order by a.starts_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.appointments a on a.shop_id = p.shop_id and (a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
  left join public.customer_vehicles v on v.id = a.vehicle_id
  where p.user_id = auth.uid() and a.starts_at > now() - interval '180 days'
$$;

create or replace function public.decide_findings(p_approve uuid[], p_decline uuid[]) returns void
language sql security definer set search_path = public as $$
  update public.findings f set status = case when f.id = any (p_approve) then 'approved' else 'declined' end, decided_at = now()
  where (f.id = any (p_approve) or f.id = any (p_decline)) and f.status = 'pending'
    and f.appointment_id in (select a.id from public.appointments a join public.customer_profiles p on p.user_id = auth.uid()
      where a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
$$;
grant execute on function public.decide_findings(uuid[], uuid[]) to authenticated;
