-- Owners invite staff by email; the account takes its role the moment it is created.
-- Handoff can also keep a photo of the driver's license.

create table if not exists public.staff_invites (
  email      text not null,
  shop_id    text not null default 'ryguys',
  role       public.member_role not null default 'advisor',
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (email, shop_id)
);
alter table public.staff_invites enable row level security;
create or replace function public.is_owner(p_shop text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shop_members where user_id = auth.uid() and shop_id = p_shop and role = 'owner')
$$;
create policy "owner all" on public.staff_invites for all using (public.is_owner(shop_id)) with check (public.is_owner(shop_id));
grant select, insert, update, delete on public.staff_invites to authenticated;

-- Owners see who is on the team.
create policy "owner sees team" on public.shop_members for select using (public.is_owner(shop_id));
create or replace view public.team with (security_invoker = true) as
  select m.user_id, m.shop_id, m.role, m.name, u.email, m.created_at
  from public.shop_members m join auth.users u on u.id = m.user_id;
grant select on public.team to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.staff_invites;
begin
  select * into inv from public.staff_invites where lower(email) = lower(new.email) limit 1;
  insert into public.shop_members (user_id, shop_id, role, name)
  values (new.id, coalesce(inv.shop_id, 'ryguys'), coalesce(inv.role, 'customer'), coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict do nothing;
  if inv.email is not null then delete from public.staff_invites where email = inv.email and shop_id = inv.shop_id; end if;
  return new;
end $$;

alter table public.rental_photos drop constraint if exists rental_photos_phase_check;
alter table public.rental_photos add constraint rental_photos_phase_check check (phase in ('out', 'in', 'license'));
