-- Canned jobs, labor and parts matrices, and estimates built from jobs.
-- A job on an estimate is a finding that carries its own lines (labor, parts, fees). The customer
-- approves or declines per job exactly as before; approved jobs expand into RO lines. Jobs the
-- customer already asked for (the booked service) are added as approved from the start.

alter table public.shops
  add column if not exists labor_rates jsonb not null default '[{"name":"Standard","cents":12500},{"name":"Diagnostic","cents":14500}]'::jsonb,
  add column if not exists parts_matrix jsonb not null default '[{"upto_cents":500,"markup_pct":150},{"upto_cents":2500,"markup_pct":100},{"upto_cents":10000,"markup_pct":65},{"upto_cents":50000,"markup_pct":40},{"upto_cents":0,"markup_pct":25}]'::jsonb,
  add column if not exists estimate_note text not null default 'Prices include labor and parts. Tax and shop supplies are added on the invoice.';

create table if not exists public.canned_jobs (
  id            uuid primary key default gen_random_uuid(),
  shop_id       text not null default 'ryguys',
  name          text not null,
  category      text not null default 'General',
  plain         text not null default '',        -- the sentence the customer reads
  lines         jsonb not null default '[]'::jsonb,  -- [{kind, description, qty, unit_cents, cost_cents, part_number, vendor}]
  hours         numeric(6,2) not null default 0,  -- labor guide hours (pre-fills the labor line at the shop rate)
  package_cents int not null default 0,           -- > 0 = package price, lines are informational
  active        boolean not null default true,
  sort          int not null default 100,
  uses          int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists canned_jobs_shop on public.canned_jobs (shop_id, active, sort);
alter table public.canned_jobs enable row level security;
drop policy if exists "staff all" on public.canned_jobs;
create policy "staff all" on public.canned_jobs for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.canned_jobs to authenticated;

alter table public.findings
  add column if not exists lines jsonb not null default '[]'::jsonb,
  add column if not exists source text not null default 'tech',     -- tech | writer | booked | canned
  add column if not exists canned_job_id uuid references public.canned_jobs (id) on delete set null,
  add column if not exists tech_id uuid references public.technicians (id) on delete set null,
  add column if not exists done_at timestamptz,
  add column if not exists token text unique default encode(gen_random_bytes(9), 'hex');
update public.findings set token = encode(gen_random_bytes(9), 'hex') where token is null;

alter table public.ro_lines
  add column if not exists part_id uuid,
  add column if not exists status text not null default '';   -- parts: '' | need | ordered | received | installed

-- Approved job → its lines on the RO (or one labor line when it has none). Declined → lines removed.
create or replace function public.findings_to_ro() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid; l jsonb; n int := 0;
begin
  if new.status in ('approved', 'done') then
    select id into rid from public.repair_orders where appointment_id = new.appointment_id;
    if rid is null then
      insert into public.repair_orders (shop_id, appointment_id, tax_rate_bp) select new.shop_id, new.appointment_id, coalesce((select tax_rate_bp from public.shops where shop_id = new.shop_id), 725) returning id into rid;
    end if;
    if exists (select 1 from public.ro_lines where finding_id = new.id) then
      if jsonb_array_length(new.lines) = 0 then
        update public.ro_lines set unit_cents = new.price_cents, description = new.name, approved = true where finding_id = new.id;
      else
        update public.ro_lines set approved = true where finding_id = new.id;
      end if;
    elsif jsonb_array_length(new.lines) = 0 then
      insert into public.ro_lines (shop_id, ro_id, kind, description, qty, unit_cents, finding_id, approved, sort)
      values (new.shop_id, rid, 'labor', new.name, 1, new.price_cents, new.id, true, 100);
    else
      for l in select * from jsonb_array_elements(new.lines) loop
        n := n + 1;
        insert into public.ro_lines (shop_id, ro_id, kind, description, qty, unit_cents, cost_cents, part_number, vendor, finding_id, approved, taxable, sort, part_id, status)
        values (new.shop_id, rid, coalesce(l->>'kind', 'labor'), coalesce(l->>'description', new.name), coalesce((l->>'qty')::numeric, 1), coalesce((l->>'unit_cents')::int, 0), coalesce((l->>'cost_cents')::int, 0),
                coalesce(l->>'part_number', ''), coalesce(l->>'vendor', ''), new.id, true, coalesce(l->>'kind', 'labor') <> 'discount',
                case when coalesce(l->>'kind', 'labor') = 'labor' then 100 when l->>'kind' = 'part' then 200 else 300 end + n,
                nullif(l->>'part_id', '')::uuid, case when l->>'kind' = 'part' and nullif(l->>'part_id', '') is null then 'need' else '' end);
      end loop;
    end if;
  elsif new.status = 'declined' then
    delete from public.ro_lines where finding_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists findings_to_ro on public.findings;
create trigger findings_to_ro after insert or update of status, price_cents, name on public.findings for each row execute function public.findings_to_ro();

-- Price of a job is the sum of its lines, kept on the row so every existing screen still reads price_cents.
create or replace function public.findings_price_from_lines() returns trigger
language plpgsql as $$
begin
  if jsonb_array_length(coalesce(new.lines, '[]'::jsonb)) > 0 then
    select coalesce(sum(round(coalesce((x->>'qty')::numeric, 1) * coalesce((x->>'unit_cents')::int, 0))), 0)::int into new.price_cents
    from jsonb_array_elements(new.lines) x where coalesce(x->>'kind', 'labor') <> 'discount';
  end if;
  return new;
end $$;
drop trigger if exists findings_price_from_lines on public.findings;
create trigger findings_price_from_lines before insert or update of lines on public.findings for each row execute function public.findings_price_from_lines();

-- The approval link: a customer without the app opens /estimate/<token> and decides there.
create or replace function public.estimate_by_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'appointment_id', a.id, 'job', a.job, 'starts_at', a.starts_at,
    'customer', split_part(coalesce(c.name, ''), ' ', 1),
    'vehicle', case when v.id is null then '' else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end,
    'shop', (select jsonb_build_object('name', name, 'phone', phone, 'address', address, 'estimate_note', estimate_note) from public.shops where shop_id = a.shop_id),
    'findings', (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'tier', g.tier, 'name', g.name, 'plain', g.plain, 'meas', g.meas, 'meas_label', g.meas_label, 'urgency', g.urgency, 'price_cents', g.price_cents, 'status', g.status, 'lines', g.lines, 'created_at', g.created_at) order by case g.tier when 'now' then 0 when 'soon' then 1 else 2 end, g.created_at), '[]'::jsonb)
                  from public.findings g where g.appointment_id = a.id and g.source <> 'booked'),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('path', ph.path, 'caption', ph.caption, 'finding_id', ph.finding_id)), '[]'::jsonb) from public.visit_photos ph where ph.appointment_id = a.id)
  )
  from public.findings f join public.appointments a on a.id = f.appointment_id
  left join public.customers c on c.id = a.customer_id left join public.customer_vehicles v on v.id = a.vehicle_id
  where f.token = p_token limit 1
$$;
grant execute on function public.estimate_by_token(text) to anon, authenticated;

create or replace function public.decide_by_token(p_token text, p_approve uuid[], p_decline uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare aid uuid;
begin
  select appointment_id into aid from public.findings where token = p_token;
  if aid is null then raise exception 'This estimate link is not valid.'; end if;
  update public.findings set status = 'approved', decided_at = now() where appointment_id = aid and status = 'pending' and id = any(p_approve);
  update public.findings set status = 'declined', decided_at = now() where appointment_id = aid and status = 'pending' and id = any(p_decline);
end $$;
grant execute on function public.decide_by_token(text, uuid[], uuid[]) to anon, authenticated;

-- (my_appointments gains job lines, paid amount and the pay link in 0031, once those tables exist.)

-- A starter library so the first RO is not typed from scratch. Hours are typical for a light truck
-- or sedan; the writer adjusts per vehicle. Parts carry no numbers until the shop's own are filled in.
create or replace function public.seed_canned_jobs(p_shop text default 'ryguys') returns int
language plpgsql security definer set search_path = public as $$
declare n int; rate int; j record;
begin
  if not public.is_staff(p_shop) then raise exception 'Not allowed.'; end if;
  select count(*) into n from public.canned_jobs where shop_id = p_shop;
  if n > 0 then return 0; end if;
  select labor_rate_cents into rate from public.shops where shop_id = p_shop; rate := coalesce(rate, 12500);
  for j in select * from (values
    ('Oil change · conventional', 'Maintenance', 'Engine oil and filter replaced, fluids topped off, tire pressure set.', 0.5, 10, '[{"kind":"part","description":"Engine oil · 5 qt conventional","qty":1,"unit_cents":2995,"cost_cents":1800},{"kind":"part","description":"Oil filter","qty":1,"unit_cents":1295,"cost_cents":600}]'),
    ('Oil change · full synthetic', 'Maintenance', 'Full synthetic oil and filter replaced, fluids topped off, tire pressure set.', 0.5, 11, '[{"kind":"part","description":"Engine oil · 5 qt full synthetic","qty":1,"unit_cents":5495,"cost_cents":3400},{"kind":"part","description":"Oil filter","qty":1,"unit_cents":1295,"cost_cents":600}]'),
    ('Tire rotation', 'Tires', 'All four tires rotated and torqued, pressures set.', 0.5, 20, '[]'),
    ('Tire mount & balance · 4', 'Tires', 'Four tires mounted, balanced and installed with new valve stems.', 1.0, 21, '[{"kind":"part","description":"Valve stems / TPMS service kits","qty":4,"unit_cents":895,"cost_cents":350},{"kind":"fee","description":"Tire disposal","qty":4,"unit_cents":400,"cost_cents":0}]'),
    ('Flat repair', 'Tires', 'Tire dismounted, patched from the inside, remounted and balanced.', 0.5, 22, '[{"kind":"part","description":"Patch / plug","qty":1,"unit_cents":895,"cost_cents":250}]'),
    ('Wheel alignment · 4 wheel', 'Tires', 'All four wheels aligned to factory specification; printout included.', 1.0, 23, '[]'),
    ('Front brake pads & rotors', 'Brakes', 'Front pads and rotors replaced, caliper slides serviced, brakes bedded in.', 1.8, 30, '[{"kind":"part","description":"Front brake pads · ceramic","qty":1,"unit_cents":8995,"cost_cents":4500},{"kind":"part","description":"Front rotors","qty":2,"unit_cents":7995,"cost_cents":4200}]'),
    ('Rear brake pads & rotors', 'Brakes', 'Rear pads and rotors replaced, hardware serviced, brakes bedded in.', 1.8, 31, '[{"kind":"part","description":"Rear brake pads · ceramic","qty":1,"unit_cents":7995,"cost_cents":4000},{"kind":"part","description":"Rear rotors","qty":2,"unit_cents":6995,"cost_cents":3600}]'),
    ('Brake fluid exchange', 'Brakes', 'Old brake fluid flushed and replaced with new DOT 3/4 fluid.', 0.8, 32, '[{"kind":"part","description":"Brake fluid · DOT 4","qty":1,"unit_cents":2495,"cost_cents":1100}]'),
    ('Battery replacement', 'Electrical', 'Battery tested, replaced, terminals cleaned, charging system checked.', 0.4, 40, '[{"kind":"part","description":"Battery · group size to fit","qty":1,"unit_cents":21995,"cost_cents":14500},{"kind":"fee","description":"Core charge (refunded on return)","qty":1,"unit_cents":2200,"cost_cents":0}]'),
    ('Alternator replacement', 'Electrical', 'Alternator replaced, belt inspected, charging output verified.', 1.5, 41, '[{"kind":"part","description":"Alternator · remanufactured","qty":1,"unit_cents":32995,"cost_cents":21000}]'),
    ('Starter replacement', 'Electrical', 'Starter replaced and cranking verified.', 1.3, 42, '[{"kind":"part","description":"Starter · remanufactured","qty":1,"unit_cents":27995,"cost_cents":17500}]'),
    ('Engine air filter', 'Maintenance', 'Engine air filter replaced.', 0.2, 12, '[{"kind":"part","description":"Engine air filter","qty":1,"unit_cents":2995,"cost_cents":1400}]'),
    ('Cabin air filter', 'Maintenance', 'Cabin air filter replaced.', 0.3, 13, '[{"kind":"part","description":"Cabin air filter","qty":1,"unit_cents":3495,"cost_cents":1600}]'),
    ('Wiper blades · pair', 'Maintenance', 'Front wiper blades replaced.', 0.1, 14, '[{"kind":"part","description":"Wiper blades · pair","qty":1,"unit_cents":3995,"cost_cents":2000}]'),
    ('Coolant flush', 'Maintenance', 'Cooling system flushed and refilled with the correct coolant, system pressure tested.', 1.0, 15, '[{"kind":"part","description":"Coolant · 2 gal","qty":1,"unit_cents":4995,"cost_cents":2600}]'),
    ('Transmission fluid service', 'Maintenance', 'Transmission fluid drained and refilled with the correct fluid; filter where fitted.', 1.2, 16, '[{"kind":"part","description":"Transmission fluid","qty":1,"unit_cents":8995,"cost_cents":5200}]'),
    ('Spark plugs · 4 cyl', 'Engine', 'Spark plugs replaced and gapped, coils inspected.', 0.9, 50, '[{"kind":"part","description":"Spark plugs · iridium","qty":4,"unit_cents":1495,"cost_cents":800}]'),
    ('Spark plugs · V6 / V8', 'Engine', 'Spark plugs replaced and gapped, coils inspected.', 1.8, 51, '[{"kind":"part","description":"Spark plugs · iridium","qty":8,"unit_cents":1495,"cost_cents":800}]'),
    ('Serpentine belt', 'Engine', 'Drive belt replaced and tensioner checked.', 0.6, 52, '[{"kind":"part","description":"Serpentine belt","qty":1,"unit_cents":4995,"cost_cents":2600}]'),
    ('Check engine light diagnosis', 'Diagnostic', 'Codes read, freeze frame reviewed, cause pinpointed; repair quoted separately.', 1.0, 60, '[]'),
    ('Electrical diagnosis · 1 hr', 'Diagnostic', 'One hour of diagnostic time to find the fault; repair quoted separately.', 1.0, 61, '[]'),
    ('Multi-point inspection', 'Diagnostic', 'Tires, brakes, fluids, belts, lights and underbody inspected with a written report.', 0.4, 62, '[]'),
    ('Shocks / struts · front pair', 'Suspension', 'Front struts replaced and alignment checked.', 2.2, 70, '[{"kind":"part","description":"Front strut assemblies · pair","qty":1,"unit_cents":29995,"cost_cents":18500}]'),
    ('Outer tie rod · each', 'Suspension', 'Outer tie rod end replaced; alignment recommended after.', 0.8, 71, '[{"kind":"part","description":"Outer tie rod end","qty":1,"unit_cents":5995,"cost_cents":3000}]'),
    ('Wheel bearing / hub · each', 'Suspension', 'Hub bearing assembly replaced.', 1.5, 72, '[{"kind":"part","description":"Hub bearing assembly","qty":1,"unit_cents":16995,"cost_cents":9500}]'),
    ('A/C recharge', 'Climate', 'System evacuated, leak checked and recharged to specification.', 1.0, 80, '[{"kind":"part","description":"Refrigerant","qty":1,"unit_cents":9995,"cost_cents":4500}]'),
    ('Headlight bulb · each', 'Electrical', 'Bulb replaced and aim checked.', 0.3, 43, '[{"kind":"part","description":"Headlight bulb","qty":1,"unit_cents":2495,"cost_cents":1100}]')
  ) as t(name, category, plain, hours, sort, lines) loop
    insert into public.canned_jobs (shop_id, name, category, plain, hours, sort, lines)
    values (p_shop, j.name, j.category, j.plain, j.hours, j.sort,
      jsonb_build_array(jsonb_build_object('kind', 'labor', 'description', j.name, 'qty', j.hours, 'unit_cents', rate, 'cost_cents', 0)) || j.lines::jsonb);
  end loop;
  return (select count(*) from public.canned_jobs where shop_id = p_shop);
end $$;
grant execute on function public.seed_canned_jobs(text) to authenticated;

alter publication supabase_realtime add table public.canned_jobs;
