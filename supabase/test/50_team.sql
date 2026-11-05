\set ON_ERROR_STOP 1
-- The team list must work for a signed-in owner running as the authenticated role (not the superuser).
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;
select user_id, role, email from public.team where shop_id = 'ryguys' order by email;
-- add staff: an existing account takes the role now, a new email is invited
reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000009', 'maya@test.com');
set role authenticated;
select public.invite_staff('ryguys', 'maya@test.com', 'advisor') as existing_account;
select public.invite_staff('ryguys', 'New.Tech@Test.com', 'tech') as new_email;
select public.staff_pending('ryguys') -> 0 ->> 'email' as pending;
select user_id, role, email from public.team where shop_id = 'ryguys' order by email;
-- the invited email signs up and lands with its role
reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000010', 'new.tech@test.com');
select role from public.shop_members where user_id = '00000000-0000-0000-0000-000000000010';
select count(*) as invites_left from public.staff_invites where shop_id = 'ryguys';
set role authenticated;
-- an advisor sees no team list and cannot invite
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000009', false);
select count(*) as advisor_sees from public.team where shop_id = 'ryguys';
do $$ begin perform public.invite_staff('ryguys', 'x@test.com', 'tech'); raise exception 'advisor could invite'; exception when others then if sqlerrm <> 'Only an owner can add staff.' then raise; end if; end $$;
-- role change in place, never their own
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select public.set_staff_role('ryguys', '00000000-0000-0000-0000-000000000009', 'tech');
select role from public.shop_members where user_id = '00000000-0000-0000-0000-000000000009';
do $$ begin perform public.set_staff_role('ryguys', '00000000-0000-0000-0000-000000000001', 'tech'); raise exception 'owner demoted self'; exception when others then if sqlerrm <> 'You cannot change your own role.' then raise; end if; end $$;
-- owner takes maya off the team, not themself
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select public.remove_staff('ryguys', '00000000-0000-0000-0000-000000000009');
do $$ begin perform public.remove_staff('ryguys', '00000000-0000-0000-0000-000000000001'); raise exception 'owner removed self'; exception when others then if sqlerrm <> 'You cannot remove yourself.' then raise; end if; end $$;
select role from public.shop_members where user_id = '00000000-0000-0000-0000-000000000009';
reset role;
