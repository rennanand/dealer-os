\set ON_ERROR_STOP 1
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001', 'owner@test');
update public.shop_members set role = 'owner' where user_id = '00000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
select public.is_staff('ryguys') as staff;
select public.seed_canned_jobs('ryguys') as seeded;
insert into public.customers (id, shop_id, name, phone) values ('10000000-0000-0000-0000-000000000001', 'ryguys', 'Sarah Mitchell', '4355550141');
insert into public.customer_vehicles (id, shop_id, customer_id, year, make, model) values ('20000000-0000-0000-0000-000000000001', 'ryguys', '10000000-0000-0000-0000-000000000001', 2021, 'Toyota', '4Runner');
insert into public.appointments (id, shop_id, customer_id, vehicle_id, starts_at, job, status) values ('30000000-0000-0000-0000-000000000001', 'ryguys', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', now() + interval '1 day', 'Brakes', 'booked');
select status, kind, left(body, 60) from public.sms_messages;
select public.ensure_ro('30000000-0000-0000-0000-000000000001') as ro;
-- a job from the library sent for approval
insert into public.findings (id, shop_id, appointment_id, tier, name, plain, lines, source, status)
select '40000000-0000-0000-0000-000000000001', 'ryguys', '30000000-0000-0000-0000-000000000001', 'now', name, plain, lines, 'canned', 'pending' from public.canned_jobs where name = 'Front brake pads & rotors';
select price_cents, token is not null as has_token from public.findings where id = '40000000-0000-0000-0000-000000000001';
select (public.estimate_by_token((select token from public.findings where id = '40000000-0000-0000-0000-000000000001'))->'findings'->0->>'name') as est_name;
select public.decide_by_token((select token from public.findings where id = '40000000-0000-0000-0000-000000000001'), array['40000000-0000-0000-0000-000000000001'::uuid], '{}');
select kind, description, qty, unit_cents, cost_cents, status from public.ro_lines order by sort;
select public.ro_totals((select id from public.repair_orders limit 1)) as totals;
-- parts: PO for the pads, receive it
insert into public.purchase_orders (id, shop_id, vendor, status, ro_id) values ('50000000-0000-0000-0000-000000000001', 'ryguys', 'NAPA', 'ordered', (select id from public.repair_orders limit 1));
insert into public.po_lines (shop_id, po_id, part_number, description, qty, cost_cents, ro_line_id) values ('ryguys', '50000000-0000-0000-0000-000000000001', 'TCP1234', 'Front brake pads · ceramic', 1, 4300, (select id from public.ro_lines where kind = 'part' and description like 'Front brake pads%'));
select public.receive_po('50000000-0000-0000-0000-000000000001', 'INV-991');
select part_number, name, qty_on_hand, cost_cents from public.parts;
select status, cost_cents, part_id is not null as linked from public.ro_lines where kind = 'part' and description like 'Front brake pads%';
-- payments: partial then the rest
select public.record_payment((select id from public.repair_orders limit 1), 'cash', 10000) as p1;
select status, paid_cents from public.repair_orders;
select public.record_payment((select id from public.repair_orders limit 1), 'card', (public.ro_totals((select id from public.repair_orders limit 1))->>'total')::int - 10000, '4242') as p2;
select status, paid_cents, paid_method from public.repair_orders;
select part_number, qty_on_hand from public.parts;
select public.refund_payment((select id from public.payments where method = 'cash'), 2500, true, 'overcharge');
select public.customer_credit('10000000-0000-0000-0000-000000000001') as credit;
select status from public.repair_orders;
select public.eod_report('ryguys', (now() at time zone 'America/Denver')::date) as eod;
select public.tax_report('ryguys', current_date - 30, current_date) -> 'months' as tax;
select public.ar_report('ryguys') as ar;
select jsonb_array_length(public.booking_slots('ryguys', (current_date + 7)::date, 60)) as slots_in_a_week;
select public.sms_fill('reminder', '30000000-0000-0000-0000-000000000001') as reminder;
select public.send_sms('10000000-0000-0000-0000-000000000001', 'hello', 'manual') as sms;
select status from public.sms_messages order by created_at desc limit 1;
select public.sms_inbound('+14355550141', 'C');
select confirmed_at is not null as confirmed from public.appointments;
insert into public.technicians (id, shop_id, name) values ('60000000-0000-0000-0000-000000000001', 'ryguys', 'Mike Tech');
select public.clock_on('30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001');
select techs, started_at is not null as started from public.findings;
select public.staff_report('ryguys', now() - interval '1 day', now() + interval '1 day') -> 'techs' -> 0 ->> 'name' as tech_report;
select count(*) as templates from public.inspection_templates;
select jsonb_array_length(public.parts_usage('ryguys', now() - interval '1 day', now() + interval '1 day')) as usage_rows;
