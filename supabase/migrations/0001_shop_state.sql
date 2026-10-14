-- DealerOS · step 1 of the backend.
-- One row per shop holds the live shop state the four surfaces share, so every device
-- sees the same thing and a reload does not lose it. Later migrations split this into
-- work orders, vehicles, inspections and messages; the app keeps working through the change.

create table if not exists public.shop_state (
  shop_id    text primary key,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shop_state enable row level security;

-- Pilot access, before sign-in exists: anyone with the publishable key can read and
-- update the RyGuys row, and nothing else. Replaced by per-user policies when accounts land.
create policy "pilot read"   on public.shop_state for select using (shop_id = 'ryguys');
create policy "pilot update" on public.shop_state for update using (shop_id = 'ryguys') with check (shop_id = 'ryguys');

insert into public.shop_state (shop_id, state) values ('ryguys', '{}') on conflict do nothing;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists shop_state_touch on public.shop_state;
create trigger shop_state_touch before update on public.shop_state for each row execute function public.touch_updated_at();

-- Live updates to every open surface.
alter publication supabase_realtime add table public.shop_state;

-- New tables are not exposed automatically (project setting), so grant the API roles
-- exactly what the policies above allow and nothing more.
grant select, update on public.shop_state to anon, authenticated;
