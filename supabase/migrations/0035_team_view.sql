-- The team list (who has a staff login) joins auth.users, which the authenticated role may not read.
-- As a security-invoker view it failed for everyone, so the Technicians page could never link a
-- technician to a login. Run the view as its owner and keep the owner-only rule inside it.

drop view if exists public.team;
create view public.team as
  select m.user_id, m.shop_id, m.role, m.name, u.email, m.created_at
  from public.shop_members m join auth.users u on u.id = m.user_id
  where public.is_owner(m.shop_id);
grant select on public.team to authenticated;

-- Owners add staff from the desk: an existing account takes the role now, an email that has no
-- account yet is invited and takes the role the moment it signs up (handle_new_user).
create or replace function public.invite_staff(p_shop text, p_email text, p_role public.member_role default 'advisor') returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid; em text;
begin
  if not public.is_owner(p_shop) then raise exception 'Only an owner can add staff.'; end if;
  em := lower(trim(p_email));
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter an email address.'; end if;
  if p_role = 'customer' then raise exception 'Pick a staff role.'; end if;
  select id into uid from auth.users where lower(email) = em;
  if uid is not null then
    insert into public.shop_members (user_id, shop_id, role, name) values (uid, p_shop, p_role, split_part(em, '@', 1))
    on conflict (user_id, shop_id) do update set role = excluded.role;
    return 'member';
  end if;
  insert into public.staff_invites (email, shop_id, role, invited_by) values (em, p_shop, p_role, auth.uid())
  on conflict (email, shop_id) do update set role = excluded.role, invited_by = excluded.invited_by;
  return 'invited';
end $$;
grant execute on function public.invite_staff(text, text, public.member_role) to authenticated;

-- Owners can also take a login off the team (it becomes a customer account again) — never their own.
create or replace function public.remove_staff(p_shop text, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(p_shop) then raise exception 'Only an owner can change the team.'; end if;
  if p_user = auth.uid() then raise exception 'You cannot remove yourself.'; end if;
  update public.shop_members set role = 'customer' where shop_id = p_shop and user_id = p_user;
  update public.technicians set user_id = null where shop_id = p_shop and user_id = p_user;
end $$;
grant execute on function public.remove_staff(text, uuid) to authenticated;

-- Change a role in place (advisor ↔ technician ↔ owner). Owners cannot demote themselves.
create or replace function public.set_staff_role(p_shop text, p_user uuid, p_role public.member_role) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(p_shop) then raise exception 'Only an owner can change the team.'; end if;
  if p_role = 'customer' then raise exception 'Use remove to take someone off the team.'; end if;
  if p_user = auth.uid() and p_role <> 'owner' then raise exception 'You cannot change your own role.'; end if;
  update public.shop_members set role = p_role where shop_id = p_shop and user_id = p_user;
end $$;
grant execute on function public.set_staff_role(text, uuid, public.member_role) to authenticated;

-- Pending invites, for the same list.
create or replace function public.staff_pending(p_shop text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('email', email, 'role', role, 'created_at', created_at) order by created_at), '[]'::jsonb)
  from public.staff_invites where shop_id = p_shop and public.is_owner(p_shop)
$$;
grant execute on function public.staff_pending(text) to authenticated;
create or replace function public.cancel_invite(p_shop text, p_email text) returns void
language sql security definer set search_path = public as $$
  delete from public.staff_invites where shop_id = p_shop and lower(email) = lower(trim(p_email)) and public.is_owner(p_shop)
$$;
grant execute on function public.cancel_invite(text, text) to authenticated;
