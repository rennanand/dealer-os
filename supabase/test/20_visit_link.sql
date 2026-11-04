\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
-- visit link flow on Sarah's visit
select token is not null as has_token from public.appointments where id = '30000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claim.role', 'anon', false); select set_config('request.jwt.claim.sub', '', false);
select (public.visit_by_token((select token from public.appointments where id = '30000000-0000-0000-0000-000000000001'))->>'customer') as who;
select (public.visit_action((select token from public.appointments where id = '30000000-0000-0000-0000-000000000001'), 'checkin', '{"odometer": 61500, "concern": "Squeal when braking", "name": "Sarah Mitchell", "signature": "M1 1 L2 2"}')->>'online_checkin_at') is not null as checked_in;
select odometer from public.customer_vehicles where id = '20000000-0000-0000-0000-000000000001';
select kind, name, amount_cents from public.authorizations;
select (public.visit_action((select token from public.appointments where id = '30000000-0000-0000-0000-000000000001'), 'message', '{"text": "Hi, can you also look at the wipers?"}')->'messages'->0->>'text') as msg;
insert into public.appointments (id, shop_id, customer_id, vehicle_id, starts_at, job, status) values ('30000000-0000-0000-0000-000000000002', 'ryguys', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', now() + interval '2 days', 'Oil change', 'booked');
select public.visit_action((select token from public.appointments where id = '30000000-0000-0000-0000-000000000002'), 'reschedule', jsonb_build_object('starts_at', (now() + interval '3 days')::text)) ->> 'confirmed_at' is not null as rescheduled;
select public.visit_action((select token from public.appointments where id = '30000000-0000-0000-0000-000000000002'), 'cancel') ->> 'status' as cancelled;
-- ready text + pay link automation (staff marks done)
select set_config('request.jwt.claim.role', 'authenticated', false); select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
update public.appointments set status = 'done' where id = '30000000-0000-0000-0000-000000000001';
select kind, status, left(body, 90) from public.sms_messages where kind in ('ready', 'thank_you', 'followup') order by created_at;
select count(*) as pay_links from public.pay_links;
select ready_sent_at is not null as ready_sent from public.appointments where id = '30000000-0000-0000-0000-000000000001';
-- a declined job, then pickup → thank-you + follow-up scheduled
insert into public.findings (shop_id, appointment_id, tier, name, price_cents, status, decided_at) values ('ryguys', '30000000-0000-0000-0000-000000000001', 'soon', 'Cabin air filter', 6500, 'declined', now());
update public.appointments set pickup = 'picked_up' where id = '30000000-0000-0000-0000-000000000001';
select kind, status, scheduled_for is not null as scheduled, left(body, 80) from public.sms_messages where kind in ('thank_you', 'followup') order by created_at;
select public.text_due_reminders('ryguys') as due_texts;
select public.sms_fill('ready', '30000000-0000-0000-0000-000000000001') as ready_text;
