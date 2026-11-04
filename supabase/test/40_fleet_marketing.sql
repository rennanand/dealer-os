\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false); select set_config('request.jwt.claim.role', 'authenticated', false);
-- warranty job: zero-priced lines on the RO
insert into public.findings (id, shop_id, appointment_id, tier, name, price_cents, status, warranty, lines) values ('40000000-0000-0000-0000-000000000077', 'ryguys', '30000000-0000-0000-0000-000000000001', 'now', 'Redo brake bleed', 4500, 'approved', true, '[{"kind":"labor","description":"Brake bleed","qty":0.5,"unit_cents":12500}]');
select description, unit_cents, warranty from public.ro_lines where finding_id = '40000000-0000-0000-0000-000000000077';
update public.repair_orders set po_number = 'PO-88' where appointment_id = '30000000-0000-0000-0000-000000000001';
-- waitlist
insert into public.waitlist (shop_id, customer_id, vehicle_id, service, earliest) values ('ryguys', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Alignment', current_date);
select count(*) as waiting from public.waitlist where status = 'waiting';
-- payroll
update public.technicians set pay_type = 'flat_rate', pay_rate_cents = 3200 where id = '60000000-0000-0000-0000-000000000001';
select x->>'name' as tech, x->>'billed_hours' as billed, x->>'pay_cents' as pay from jsonb_array_elements(public.payroll_report('ryguys', now() - interval '1 day', now() + interval '1 day')) x;
-- fleet
insert into public.fleets (id, shop_id, name, contact, po_required) values ('70000000-0000-0000-0000-000000000001', 'ryguys', 'Skyline Plumbing', 'Jordan', true);
update public.customers set fleet_id = '70000000-0000-0000-0000-000000000001' where id = '10000000-0000-0000-0000-000000000001';
select charge_account, terms_days from public.customers where id = '10000000-0000-0000-0000-000000000001';
select (public.fleet_statement('70000000-0000-0000-0000-000000000001', current_date - 30, current_date)->>'total')::int as fleet_total, jsonb_array_length(public.fleet_statement('70000000-0000-0000-0000-000000000001', current_date - 30, current_date)->'invoices') as fleet_invoices;
-- email receipt (manual since no email_url)
update public.customers set email = 'sarah@example.com' where id = '10000000-0000-0000-0000-000000000001';
select public.email_receipt((select id from public.repair_orders where appointment_id = '30000000-0000-0000-0000-000000000001')) is not null as receipt_queued;
select kind, status, subject, length(html) > 500 as has_html from public.emails;
select position('RO 1' in public.receipt_html((select id from public.repair_orders where appointment_id = '30000000-0000-0000-0000-000000000001'))) > 0 as receipt_ok;
-- marketing
select jsonb_array_length(public.segment_customers('ryguys', '{}'::jsonb, 'text')) as all_text, jsonb_array_length(public.segment_customers('ryguys', '{"declined": true}'::jsonb, 'text')) as declined_seg, jsonb_array_length(public.segment_customers('ryguys', '{"makes": ["toyota"]}'::jsonb, 'email')) as toyota_email;
insert into public.campaigns (id, shop_id, name, channel, segment, body) values ('80000000-0000-0000-0000-000000000001', 'ryguys', 'Winter tires', 'text', '{"makes":["toyota"]}', 'Hi {first}, {shop} here. Winter tires are in — book here: {link}');
select public.send_campaign('80000000-0000-0000-0000-000000000001') as sent;
