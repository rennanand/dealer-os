-- Digital vehicle inspection, done by the technician at the bay. One per visit; items are a checklist
-- with a status (good / monitor / now), a measurement and a note. Sending it turns monitor/now items
-- into findings the customer approves on the phone.
create table if not exists public.inspections (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  tech_id        uuid references public.technicians (id) on delete set null,
  items          jsonb not null default '[]'::jsonb,
  status         text not null default 'open' check (status in ('open', 'sent')),
  sent_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.inspections enable row level security;
create policy "staff all" on public.inspections for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.inspections to authenticated;

-- Which technician a signed-in staff member is (so the iPad opens on their jobs).
alter table public.technicians add column if not exists user_id uuid references auth.users (id) on delete set null;
