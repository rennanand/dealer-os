-- DealerOS · backend step 2: sign-in and access control.
-- Every signed-in person is a member of a shop with a role. Shop state is only visible to
-- that shop's members; nothing is open to the public key any more.

create type public.member_role as enum ('customer', 'tech', 'advisor', 'owner');

create table if not exists public.shop_members (
  user_id    uuid not null references auth.users (id) on delete cascade,
  shop_id    text not null,
  role       public.member_role not null default 'customer',
  name       text,
  created_at timestamptz not null default now(),
  primary key (user_id, shop_id)
);
alter table public.shop_members enable row level security;
create policy "members see themselves" on public.shop_members for select using (user_id = auth.uid());
grant select on public.shop_members to authenticated;

-- Pilot is a single shop: anyone who signs in becomes a RyGuys customer. Staff roles are
-- granted by the shop (see set_role below). Multi-shop invites replace this trigger later.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.shop_members (user_id, shop_id, role, name)
  values (new.id, 'ryguys', 'customer', coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Helpers the policies use.
create or replace function public.is_member(p_shop text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shop_members where user_id = auth.uid() and shop_id = p_shop)
$$;
create or replace function public.is_staff(p_shop text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shop_members where user_id = auth.uid() and shop_id = p_shop and role in ('tech', 'advisor', 'owner'))
$$;

-- Owners promote staff by email (run from the shop desktop later; from SQL for the pilot).
create or replace function public.set_role(p_email text, p_shop text, p_role public.member_role) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if auth.uid() is not null and not exists (select 1 from public.shop_members where user_id = auth.uid() and shop_id = p_shop and role = 'owner') then
    raise exception 'only an owner can set roles';
  end if;
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'no account for %', p_email; end if;
  insert into public.shop_members (user_id, shop_id, role) values (uid, p_shop, p_role)
  on conflict (user_id, shop_id) do update set role = excluded.role;
end $$;

-- Shop state: members only. The public key alone no longer reads or writes anything.
drop policy if exists "pilot read"   on public.shop_state;
drop policy if exists "pilot update" on public.shop_state;
revoke all on public.shop_state from anon;
create policy "members read"   on public.shop_state for select using (public.is_member(shop_id));
create policy "members update" on public.shop_state for update using (public.is_member(shop_id)) with check (public.is_member(shop_id));
