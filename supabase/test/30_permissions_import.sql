\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false); select set_config('request.jwt.claim.role', 'authenticated', false);
select public.my_role('ryguys') as role, public.can('ryguys', 'refund') as owner_can_refund;
-- an advisor
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000002', 'adv@test');
update public.shop_members set role = 'advisor', name = 'Ava Advisor' where user_id = '00000000-0000-0000-0000-000000000002';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
select public.my_role('ryguys') as role, public.can('ryguys', 'refund') as adv_refund, public.can('ryguys', 'discount') as adv_discount, public.can('ryguys', 'payments') as adv_pay;
-- advisor takes a payment on a fresh RO: allowed
insert into public.appointments (id, shop_id, customer_id, vehicle_id, starts_at, job, status) values ('30000000-0000-0000-0000-000000000009', 'ryguys', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', now(), 'Oil change', 'in_progress');
select public.ensure_ro('30000000-0000-0000-0000-000000000009') as ro9;
insert into public.ro_lines (shop_id, ro_id, kind, description, qty, unit_cents) values ('ryguys', (select id from public.repair_orders where appointment_id = '30000000-0000-0000-0000-000000000009'), 'labor', 'Oil change', 0.5, 12500);
insert into public.ro_lines (shop_id, ro_id, kind, description, qty, unit_cents) values ('ryguys', (select id from public.repair_orders where appointment_id = '30000000-0000-0000-0000-000000000009'), 'discount', 'Friends', 1, 1000);
select (public.record_payment((select id from public.repair_orders where appointment_id = '30000000-0000-0000-0000-000000000009'), 'cash', 10000)->>'balance') as adv_paid_balance;
-- advisor refund: denied
do $$ begin perform public.refund_payment((select id from public.payments where method = 'cash' order by created_at desc limit 1), 500, false, 'x'); raise exception 'should have failed'; exception when others then raise notice 'refund denied as expected: %', sqlerrm; end $$;
-- advisor void: denied
do $$ begin perform public.ro_set_status((select id from public.repair_orders where appointment_id = '30000000-0000-0000-0000-000000000009'), 'void'); raise exception 'should have failed'; exception when others then raise notice 'void denied as expected: %', sqlerrm; end $$;
-- owner grants advisors refunds, advisor tries again
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select public.set_permissions('ryguys', (select permissions from public.shops where shop_id = 'ryguys') || jsonb_build_object('advisor', (select permissions->'advisor' from public.shops where shop_id = 'ryguys') || '{"refund": true}'::jsonb));
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', false);
select public.refund_payment((select id from public.payments where method = 'cash' order by created_at desc limit 1), 500, false, 'goodwill');
-- audit log
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select who, action, ref, summary from public.audit_log order by id desc limit 8;
-- history import
select public.import_history('[{"external_id":"RO-5001","date":"2025-06-14","name":"Dale Christensen","phone":"4355550177","year":"2018","make":"Ford","model":"F-150","odometer":"138000","job":"Front brakes","total":"612.40","declined":[{"name":"Cabin air filter","price":"65"}]},{"external_id":"RO-5001","date":"2025-06-14","name":"Dale Christensen","phone":"4355550177","job":"dup","total":"1"},{"external_id":"RO-5002","date":"2026-01-10","name":"New Person","phone":"4355550199","year":"2020","make":"Subaru","model":"Outback","job":"Oil change","total":"89.95"}]'::jsonb) as imported;
select c.name, c.last_visit_at, v.make, v.odometer, v.last_service from public.customers c left join public.customer_vehicles v on v.customer_id = c.id where c.name in ('Dale Christensen', 'New Person') order by c.name;
select r.status, r.paid_cents from public.repair_orders r join public.appointments a on a.id = r.appointment_id where a.source = 'tekmetric';
select name, status, fu_status from public.findings where name = 'Cabin air filter' and status = 'declined' limit 1;
-- duplicates + merge
insert into public.customers (id, shop_id, name, phone) values ('10000000-0000-0000-0000-000000000077', 'ryguys', 'Sarah Mitchell', '4355550141');
select jsonb_array_length(public.duplicate_customers('ryguys')) as dup_groups;
select public.merge_customers('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000077');
select count(*) as sarahs from public.customers where phone = '4355550141';
select public.find_customer('ryguys', '(435) 555-0177') -> 0 ->> 'name' as found;
select action, summary from public.audit_log where action = 'customer.merged';
