-- The customer sees the whole inspection once the technician sends it: what was checked and found
-- good, not only what needs work.
create or replace function public.my_appointments() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'starts_at', a.starts_at, 'job', a.job, 'visit', a.visit, 'status', a.status, 'bay', a.bay, 'notes', a.notes,
    'arrived_at', a.arrived_at, 'started_at', a.started_at, 'done_at', a.done_at, 'vehicle_id', a.vehicle_id,
    'pickup', a.pickup, 'rating', a.rating, 'tech', split_part(t.name, ' ', 1),
    'vehicle', case when v.id is null then null else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end,
    'findings', (select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'tier', f.tier, 'name', f.name, 'plain', f.plain, 'tech', f.tech, 'meas', f.meas, 'meas_label', f.meas_label, 'urgency', f.urgency, 'wait_text', f.wait_text, 'price_cents', f.price_cents, 'status', f.status, 'created_at', f.created_at) order by f.created_at), '[]'::jsonb) from public.findings f where f.appointment_id = a.id),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.id, 'path', ph.path, 'caption', ph.caption, 'meas', ph.meas, 'finding_id', ph.finding_id, 'created_at', ph.created_at) order by ph.created_at), '[]'::jsonb) from public.visit_photos ph where ph.appointment_id = a.id),
    'tire_quote', (select jsonb_build_object('id', q.id, 'size', q.size, 'tread', q.tread, 'options', q.options, 'recommended', q.recommended, 'hazard_offered', q.hazard_offered, 'fee_cents', q.fee_cents, 'status', q.status, 'accepted_tier', q.accepted_tier, 'accepted_hazard', q.accepted_hazard, 'total_cents', q.total_cents, 'created_at', q.created_at) from public.tire_quotes q where q.appointment_id = a.id order by q.created_at desc limit 1),
    'invoice', (select jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'invoiced_at', r.invoiced_at, 'paid_at', r.paid_at, 'paid_method', r.paid_method, 'totals', public.ro_totals(r.id),
                  'lines', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'kind', l.kind, 'description', l.description, 'qty', l.qty, 'unit_cents', l.unit_cents, 'cents', round(l.qty * l.unit_cents)::int) order by l.sort, l.created_at), '[]'::jsonb) from public.ro_lines l where l.ro_id = r.id and l.approved))
                from public.repair_orders r where r.appointment_id = a.id and r.status <> 'void'),
    'inspection', (select jsonb_build_object('sent_at', i.sent_at, 'tech', split_part(coalesce(it.name, ''), ' ', 1),
                  'items', (select coalesce(jsonb_agg(jsonb_build_object('key', x->>'key', 'label', x->>'label', 'status', x->>'status', 'meas', x->>'meas', 'meas_label', x->>'measLabel', 'note', x->>'note')), '[]'::jsonb) from jsonb_array_elements(i.items) x where coalesce(x->>'status', '') <> ''))
                from public.inspections i left join public.technicians it on it.id = i.tech_id where i.appointment_id = a.id and i.status = 'sent')
  ) order by a.starts_at desc), '[]'::jsonb)
  from public.customer_profiles p
  join public.appointments a on a.shop_id = p.shop_id and (a.customer_user = p.user_id or a.customer_id in (select id from public.customers c where c.shop_id = p.shop_id and c.phone = p.phone and p.phone <> ''))
  left join public.customer_vehicles v on v.id = a.vehicle_id
  left join public.technicians t on t.id = a.tech_id
  where p.user_id = auth.uid() and a.starts_at > now() - interval '180 days'
$$;
