-- DealerOS · Loaners. The first module that runs on real records.
-- Fleet vehicles, rentals (one agreement each), and handoff/return photos. Staff work through
-- the shop desktop with their account; the customer reviews and signs through a private link.

create table if not exists public.loaner_vehicles (
  id          uuid primary key default gen_random_uuid(),
  shop_id     text not null default 'ryguys',
  year        int not null,
  make        text not null,
  model       text not null,
  color       text not null default '',
  paint       text not null default '#b9bdc3',          -- swatch shown in the app
  plate       text not null default '',
  vin_last4   text not null default '',
  powertrain  text not null default 'gas' check (powertrain in ('gas', 'ev')),
  odometer    int  not null default 0,                   -- recorded by staff at the last handoff/return
  level       int  not null default 100,                 -- fuel % or charge %, recorded by staff
  status      text not null default 'available' check (status in ('available', 'out', 'service', 'retired')),
  created_at  timestamptz not null default now()
);

create table if not exists public.rentals (
  id              uuid primary key default gen_random_uuid(),
  shop_id         text not null default 'ryguys',
  number          text not null,                         -- LN-3107, shown to the customer
  token           text not null unique default encode(gen_random_bytes(18), 'hex'),
  vehicle_id      uuid references public.loaner_vehicles (id),
  customer_name   text not null default '',
  customer_phone  text not null default '',
  customer_plate  text not null default '',              -- the customer's own car, for the work order
  work_ref        text not null default '',              -- e.g. "Front brake service · Bay 01"
  status          text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'out', 'returned', 'cancelled')),
  start_date      date not null default current_date,
  end_date        date not null default current_date,
  rate_cents      int  not null default 6500,
  shop_pays       boolean not null default false,
  clauses         jsonb not null default '{"driver":true,"insurance":true,"mileage":true,"charge":true,"use":true,"damage":true,"tolls":true,"late":true}',
  mile_cap        text not null default '100 mi/day',
  charge_min      text not null default '50%',
  deductible      text not null default '$1,000',
  sent_at         timestamptz,
  signed_at       timestamptz,
  signed_name     text,
  signature_svg   text,                                  -- the signature path drawn on the phone
  out_at          timestamptz,
  out_odometer    int,
  out_level       int,
  returned_at     timestamptz,
  in_odometer     int,
  in_level        int,
  extra_cents     int not null default 0,
  notes           text not null default '',
  created_by      uuid references auth.users (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists rentals_number_idx on public.rentals (shop_id, number);

create table if not exists public.rental_photos (
  id          uuid primary key default gen_random_uuid(),
  rental_id   uuid not null references public.rentals (id) on delete cascade,
  phase       text not null check (phase in ('out', 'in')),
  path        text not null,                             -- object path in the rental-photos bucket
  taken_by    uuid references auth.users (id),
  created_at  timestamptz not null default now()
);

drop trigger if exists rentals_touch on public.rentals;
create trigger rentals_touch before update on public.rentals for each row execute function public.touch_updated_at();

-- Rental numbers: LN-3100 upwards, per shop.
create or replace function public.next_rental_number(p_shop text) returns text
language sql stable as $$
  select 'LN-' || (3100 + count(*))::text from public.rentals where shop_id = p_shop
$$;

-- Access: staff of the shop do everything; nobody else reads the tables directly.
alter table public.loaner_vehicles enable row level security;
alter table public.rentals          enable row level security;
alter table public.rental_photos    enable row level security;
create policy "staff all" on public.loaner_vehicles for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
create policy "staff all" on public.rentals          for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
create policy "staff all" on public.rental_photos    for all
  using (exists (select 1 from public.rentals r where r.id = rental_id and public.is_staff(r.shop_id)))
  with check (exists (select 1 from public.rentals r where r.id = rental_id and public.is_staff(r.shop_id)));
grant select, insert, update, delete on public.loaner_vehicles, public.rentals, public.rental_photos to authenticated;

-- The customer's private link. Knowing the token is the credential: it reads one rental and
-- can sign it once. Nothing else is reachable through it.
create or replace function public.rental_by_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', r.id, 'number', r.number, 'status', r.status, 'customer_name', r.customer_name,
    'start_date', r.start_date, 'end_date', r.end_date, 'rate_cents', r.rate_cents, 'shop_pays', r.shop_pays,
    'clauses', r.clauses, 'mile_cap', r.mile_cap, 'charge_min', r.charge_min, 'deductible', r.deductible,
    'signed_at', r.signed_at, 'signed_name', r.signed_name, 'out_at', r.out_at, 'out_odometer', r.out_odometer, 'out_level', r.out_level,
    'returned_at', r.returned_at, 'in_odometer', r.in_odometer, 'in_level', r.in_level, 'extra_cents', r.extra_cents, 'work_ref', r.work_ref,
    'vehicle', case when v.id is null then null else jsonb_build_object('year', v.year, 'make', v.make, 'model', v.model, 'color', v.color, 'paint', v.paint, 'plate', v.plate, 'vin_last4', v.vin_last4, 'powertrain', v.powertrain, 'odometer', v.odometer, 'level', v.level) end
  )
  from public.rentals r left join public.loaner_vehicles v on v.id = r.vehicle_id
  where r.token = p_token
$$;

create or replace function public.sign_rental(p_token text, p_name text, p_signature text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.rentals;
begin
  select * into r from public.rentals where token = p_token;
  if r.id is null then raise exception 'not found'; end if;
  if r.status not in ('sent', 'draft') then raise exception 'already signed'; end if;
  if length(coalesce(p_signature, '')) < 20 then raise exception 'signature required'; end if;
  update public.rentals set status = 'signed', signed_at = now(), signed_name = p_name, signature_svg = p_signature where id = r.id;
  return public.rental_by_token(p_token);
end $$;

grant execute on function public.rental_by_token(text), public.sign_rental(text, text, text), public.next_rental_number(text) to anon, authenticated;

-- Photos live in a private bucket; staff upload through their session, customers see them through the token later.
insert into storage.buckets (id, name, public) values ('rental-photos', 'rental-photos', false) on conflict do nothing;
create policy "staff photos" on storage.objects for all to authenticated
  using (bucket_id = 'rental-photos' and public.is_staff('ryguys')) with check (bucket_id = 'rental-photos' and public.is_staff('ryguys'));

alter publication supabase_realtime add table public.rentals, public.loaner_vehicles;
