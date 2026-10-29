-- Tire quotes: up to three options sent to the customer's phone; the accepted one becomes an approved finding.
create table if not exists public.tire_quotes (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  size           text not null default '',
  tread          text not null default '',
  options        jsonb not null default '[]'::jsonb,   -- [{tier, name, each_cents, warranty, stock, note}]
  recommended    text not null default 'better',
  hazard_offered boolean not null default true,
  fee_cents      int not null default 3700,            -- mount, balance, TPMS, disposal — per tire
  status         text not null default 'sent' check (status in ('sent', 'accepted', 'declined')),
  accepted_tier  text,
  accepted_hazard boolean,
  total_cents    int,
  finding_id     uuid references public.findings (id) on delete set null,
  created_by     uuid references auth.users (id),
  created_at     timestamptz not null default now(),
  decided_at     timestamptz
);
create index if not exists tire_quotes_appt on public.tire_quotes (appointment_id);
alter table public.tire_quotes enable row level security;
create policy "staff all" on public.tire_quotes for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.tire_quotes to authenticated;
alter publication supabase_realtime add table public.tire_quotes;

create or replace function public.accept_tire_quote(p_id uuid, p_tier text, p_hazard boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare q public.tire_quotes; a public.appointments; opt jsonb; tires int; fees int; haz int; total int; fid uuid; prof public.customer_profiles;
begin
  select * into prof from public.customer_profiles where user_id = auth.uid();
  select * into q from public.tire_quotes where id = p_id and status = 'sent';
  if q.id is null then raise exception 'This quote is no longer open.'; end if;
  select * into a from public.appointments where id = q.appointment_id;
  if not (a.customer_user = auth.uid() or a.customer_id in (select c.id from public.customers c where c.shop_id = prof.shop_id and c.phone = prof.phone and prof.phone <> '')) then raise exception 'Not your visit.'; end if;
  select o into opt from jsonb_array_elements(q.options) o where o->>'tier' = p_tier limit 1;
  if opt is null then raise exception 'Pick an option.'; end if;
  tires := (opt->>'each_cents')::int * 4; fees := q.fee_cents * 4; haz := case when p_hazard then round(tires * 0.12) else 0 end; total := tires + fees + haz;
  insert into public.findings (shop_id, appointment_id, tier, name, plain, price_cents, status, decided_at, created_by)
  values (q.shop_id, q.appointment_id, 'now', '4× ' || (opt->>'name'), 'Tires accepted from the quote · ' || (opt->>'tier') || case when p_hazard then ' · road hazard' else '' end, total, 'approved', now(), auth.uid())
  returning id into fid;
  update public.tire_quotes set status = 'accepted', accepted_tier = p_tier, accepted_hazard = p_hazard, total_cents = total, finding_id = fid, decided_at = now() where id = p_id;
  return jsonb_build_object('finding', fid, 'total_cents', total);
end $$;
grant execute on function public.accept_tire_quote(uuid, text, boolean) to authenticated;

create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'vehicle_id', a.vehicle_id,
    'pickup', a.pickup, 'rating', a.rating, 'tech', split_part(t.name, ' ', 1),
    'vehicle', case when v.id is null then null else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end,
    'findings', (select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'tier', f.tier, 'name', f.name, 'plain', f.plain, 'tech', f.tech, 'meas', f.meas, 'meas_label', f.meas_label, 'urgency', f.urgency, 'wait_text', f.wait_text, 'price_cents', f.price_cents, 'status', f.status, 'created_at', f.created_at) order by f.created_at), '[]'::jsonb) from public.findings f where f.appointment_id = a.id),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.id, 'path', ph.path, 'caption', ph.caption, 'meas', ph.meas, 'finding_id', ph.finding_id, 'created_at', ph.created_at) order by ph.created_at), '[]'::jsonb) from public.visit_photos ph where ph.appointment_id = a.id),
    'tire_quote', (select jsonb_build_object('id', q.id, 'size', q.size, 'tread', q.tread, 'options', q.options, 'recommended', q.recommended, 'hazard_offered', q.hazard_offered, 'fee_cents', q.fee_cents, 'status', q.status, 'accepted_tier', q.accepted_tier, 'accepted_hazard', q.accepted_hazard, 'total_cents', q.total_cents, 'created_at', q.created_at) from public.tire_quotes q where q.appointment_id = a.id order by q.created_at desc limit 1)
  ) order by a.starts_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.appointments a on a.shop_id = p.shop_id and (a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
  left join public.customer_vehicles v on v.id = a.vehicle_id
  left join public.technicians t on t.id = a.tech_id
  where p.user_id = auth.uid() and a.starts_at > now() - interval '180 days'
$$;

-- A tire quote is worth a push, like a finding.
create or replace function public.tire_quotes_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare a public.appointments; users uuid[];
begin
  select * into a from public.appointments where id = new.appointment_id;
  select array_agg(u) into users from public.users_for_customer(a.customer_id, a.customer_user) u;
  if users is null then return new; end if;
  perform public.push_to_users(users, 'Tire quote ready.', 'Three options for your ' || coalesce(new.size, 'tires') || '. Pick one in the app.', jsonb_build_object('view', 'tires', 'appointment', a.id));
  return new;
end $$;
drop trigger if exists tire_quotes_push on public.tire_quotes;
create trigger tire_quotes_push after insert on public.tire_quotes for each row execute function public.tire_quotes_push();
