-- Payments at the counter and by link, refunds, partial payments and charge accounts (A/R), store
-- credit, the cash drawer, and the end-of-day and sales tax reports. Card processing runs through
-- the `pay` edge function when a Stripe key is configured; until then card payments are recorded
-- from the shop's own terminal.

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null default 'ryguys',
  ro_id        uuid references public.repair_orders (id) on delete set null,
  customer_id  uuid references public.customers (id) on delete set null,
  method       text not null check (method in ('cash', 'card', 'check', 'ach', 'store_credit', 'charge', 'other')),
  amount_cents int not null,                       -- negative = refund
  reference    text not null default '',           -- check number, last four, provider id
  note         text not null default '',
  refund_of    uuid references public.payments (id) on delete set null,
  drawer_id    uuid,
  provider     text not null default '',           -- '' | stripe
  provider_ref text not null default '',
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);
create index if not exists payments_ro on public.payments (ro_id);
create index if not exists payments_day on public.payments (shop_id, created_at);
alter table public.payments enable row level security;
drop policy if exists "staff all" on public.payments;
create policy "staff all" on public.payments for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.payments to authenticated;

create table if not exists public.drawer_sessions (
  id             uuid primary key default gen_random_uuid(),
  shop_id        text not null default 'ryguys',
  opened_at      timestamptz not null default now(),
  opened_by      uuid references auth.users (id),
  opening_cents  int not null default 0,
  closed_at      timestamptz,
  closing_cents  int,                 -- counted at close
  expected_cents int,                 -- opening + cash in - cash out
  note           text not null default ''
);
alter table public.drawer_sessions enable row level security;
drop policy if exists "staff all" on public.drawer_sessions;
create policy "staff all" on public.drawer_sessions for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.drawer_sessions to authenticated;

create table if not exists public.customer_credits (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null default 'ryguys',
  customer_id  uuid not null references public.customers (id) on delete cascade,
  amount_cents int not null,                       -- + issued, - used
  kind         text not null default 'store_credit' check (kind in ('store_credit', 'goodwill', 'trade', 'used', 'refund')),
  note         text not null default '',
  ro_id        uuid references public.repair_orders (id) on delete set null,
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);
create index if not exists customer_credits_cust on public.customer_credits (customer_id);
alter table public.customer_credits enable row level security;
drop policy if exists "staff all" on public.customer_credits;
create policy "staff all" on public.customer_credits for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.customer_credits to authenticated;

alter table public.customers
  add column if not exists charge_account boolean not null default false,   -- may leave with a balance (fleet, regulars)
  add column if not exists credit_limit_cents int not null default 0,
  add column if not exists terms_days int not null default 30;

create table if not exists public.pay_links (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null default 'ryguys',
  ro_id        uuid not null references public.repair_orders (id) on delete cascade,
  token        text not null unique default encode(gen_random_bytes(9), 'hex'),
  status       text not null default 'open' check (status in ('open', 'paid', 'expired')),
  provider     text not null default '',
  provider_ref text not null default '',
  created_at   timestamptz not null default now()
);
alter table public.pay_links enable row level security;
drop policy if exists "staff all" on public.pay_links;
create policy "staff all" on public.pay_links for all using (public.is_staff(shop_id)) with check (public.is_staff(shop_id));
grant select, insert, update, delete on public.pay_links to authenticated;

create or replace function public.ro_paid(p_ro uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount_cents), 0)::int from public.payments where ro_id = p_ro
$$;
grant execute on function public.ro_paid(uuid) to authenticated, anon;

create or replace function public.customer_credit(p_customer uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount_cents), 0)::int from public.customer_credits where customer_id = p_customer
$$;
grant execute on function public.customer_credit(uuid) to authenticated;

-- Record a payment. Full payment closes the RO; a partial one leaves it invoiced with a balance.
create or replace function public.record_payment(p_ro uuid, p_method text, p_amount_cents int, p_reference text default '', p_note text default '', p_drawer uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.repair_orders; a public.appointments; t jsonb; total int; paid int; pid uuid; credit int;
begin
  select * into r from public.repair_orders where id = p_ro;
  if r.id is null or not public.is_staff(r.shop_id) then raise exception 'Not allowed.'; end if;
  if p_amount_cents = 0 then raise exception 'Enter an amount.'; end if;
  select * into a from public.appointments where id = r.appointment_id;
  if p_method = 'store_credit' and p_amount_cents > 0 then
    credit := public.customer_credit(a.customer_id);
    if credit < p_amount_cents then raise exception 'Only $% of store credit is available.', to_char(credit / 100.0, 'FM999,990.00'); end if;
    insert into public.customer_credits (shop_id, customer_id, amount_cents, kind, note, ro_id, created_by) values (r.shop_id, a.customer_id, -p_amount_cents, 'used', 'Applied to RO ' || r.number, p_ro, auth.uid());
  end if;
  if p_method = 'charge' and not coalesce((select charge_account from public.customers where id = a.customer_id), false) then raise exception 'This customer does not have a charge account.'; end if;
  insert into public.payments (shop_id, ro_id, customer_id, method, amount_cents, reference, note, drawer_id, created_by)
  values (r.shop_id, p_ro, a.customer_id, p_method, p_amount_cents, coalesce(p_reference, ''), coalesce(p_note, ''), p_drawer, auth.uid()) returning id into pid;
  t := public.ro_totals(p_ro); total := (t->>'total')::int; paid := public.ro_paid(p_ro);
  if paid >= total and p_method <> 'charge' then
    update public.repair_orders set status = 'paid', paid_at = now(), paid_method = p_method, paid_cents = paid, invoiced_at = coalesce(invoiced_at, now()) where id = p_ro;
    update public.pay_links set status = 'paid' where ro_id = p_ro and status = 'open';
  else
    update public.repair_orders set status = case when status = 'open' then 'invoiced' else status end, invoiced_at = coalesce(invoiced_at, now()), paid_cents = paid, paid_method = p_method where id = p_ro;
  end if;
  return jsonb_build_object('payment_id', pid, 'total', total, 'paid', paid, 'balance', total - paid);
end $$;
grant execute on function public.record_payment(uuid, text, int, text, text, uuid) to authenticated;

-- Refund part or all of a payment (cash back, card reversal from the terminal, or as store credit).
create or replace function public.refund_payment(p_payment uuid, p_amount_cents int, p_as_credit boolean default false, p_note text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p public.payments; r public.repair_orders;
begin
  select * into p from public.payments where id = p_payment;
  if p.id is null or not public.is_staff(p.shop_id) then raise exception 'Not allowed.'; end if;
  if p_amount_cents <= 0 or p_amount_cents > p.amount_cents + coalesce((select sum(amount_cents) from public.payments where refund_of = p_payment), 0) then raise exception 'Refund is more than what was paid.'; end if;
  select * into r from public.repair_orders where id = p.ro_id;
  insert into public.payments (shop_id, ro_id, customer_id, method, amount_cents, reference, note, refund_of, created_by)
  values (p.shop_id, p.ro_id, p.customer_id, case when p_as_credit then 'store_credit' else p.method end, -p_amount_cents, p.reference, coalesce(p_note, ''), p_payment, auth.uid());
  if p_as_credit then
    insert into public.customer_credits (shop_id, customer_id, amount_cents, kind, note, ro_id, created_by) values (p.shop_id, p.customer_id, p_amount_cents, 'refund', 'Refund from RO ' || r.number, p.ro_id, auth.uid());
  end if;
  update public.repair_orders set paid_cents = public.ro_paid(p.ro_id) where id = p.ro_id;   -- stays paid: the money was taken and given back
end $$;
grant execute on function public.refund_payment(uuid, int, boolean, text) to authenticated;

-- Store credit, goodwill and trade credit issued by hand.
create or replace function public.issue_credit(p_customer uuid, p_amount_cents int, p_kind text default 'store_credit', p_note text default '') returns void
language plpgsql security definer set search_path = public as $$
declare sid text;
begin
  select shop_id into sid from public.customers where id = p_customer;
  if sid is null or not public.is_staff(sid) then raise exception 'Not allowed.'; end if;
  insert into public.customer_credits (shop_id, customer_id, amount_cents, kind, note, created_by) values (sid, p_customer, p_amount_cents, p_kind, coalesce(p_note, ''), auth.uid());
end $$;
grant execute on function public.issue_credit(uuid, int, text, text) to authenticated;

-- Cash drawer: one open session at a time per shop.
create or replace function public.drawer_open(p_shop text, p_opening_cents int) returns uuid
language plpgsql security definer set search_path = public as $$
declare did uuid;
begin
  if not public.is_staff(p_shop) then raise exception 'Not allowed.'; end if;
  if exists (select 1 from public.drawer_sessions where shop_id = p_shop and closed_at is null) then raise exception 'The drawer is already open.'; end if;
  insert into public.drawer_sessions (shop_id, opened_by, opening_cents) values (p_shop, auth.uid(), p_opening_cents) returning id into did;
  return did;
end $$;
grant execute on function public.drawer_open(text, int) to authenticated;

create or replace function public.drawer_close(p_drawer uuid, p_counted_cents int, p_note text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare d public.drawer_sessions; cash int;
begin
  select * into d from public.drawer_sessions where id = p_drawer;
  if d.id is null or not public.is_staff(d.shop_id) then raise exception 'Not allowed.'; end if;
  select coalesce(sum(amount_cents), 0) into cash from public.payments where shop_id = d.shop_id and method = 'cash' and created_at >= d.opened_at;
  update public.drawer_sessions set closed_at = now(), closing_cents = p_counted_cents, expected_cents = d.opening_cents + cash, note = coalesce(p_note, '') where id = p_drawer;
  return jsonb_build_object('expected', d.opening_cents + cash, 'counted', p_counted_cents, 'over_short', p_counted_cents - (d.opening_cents + cash));
end $$;
grant execute on function public.drawer_close(uuid, int, text) to authenticated;

-- End of day: what was sold, collected and still owed, for one day in the shop's local time.
create or replace function public.eod_report(p_shop text, p_day date, p_tz text default 'America/Denver') returns jsonb
language sql stable security definer set search_path = public as $$
  with win as (select (p_day::timestamp at time zone p_tz) as d0, ((p_day + 1)::timestamp at time zone p_tz) as d1),
  pay as (select method, sum(amount_cents) filter (where amount_cents > 0) as taken, sum(-amount_cents) filter (where amount_cents < 0) as refunded, count(*) filter (where amount_cents > 0) as n
          from public.payments, win where shop_id = p_shop and created_at >= win.d0 and created_at < win.d1 group by method),
  closed as (select r.id, public.ro_totals(r.id) as t from public.repair_orders r, win where r.shop_id = p_shop and r.status = 'paid' and r.paid_at >= win.d0 and r.paid_at < win.d1),
  sums as (select count(*) as invoices, coalesce(sum((t->>'total')::int), 0) as sales, coalesce(sum((t->>'labor')::int), 0) as labor, coalesce(sum((t->>'parts')::int), 0) as parts,
           coalesce(sum((t->>'parts_cost')::int), 0) as parts_cost, coalesce(sum((t->>'fees')::int), 0) as fees, coalesce(sum((t->>'discount')::int), 0) as discount, coalesce(sum((t->>'tax')::int), 0) as tax, coalesce(sum((t->>'labor_hours')::numeric), 0) as hours from closed),
  ar as (select count(*) as n, coalesce(sum((public.ro_totals(r.id)->>'total')::int - public.ro_paid(r.id)), 0) as balance from public.repair_orders r where r.shop_id = p_shop and r.status = 'invoiced')
  select jsonb_build_object(
    'day', p_day, 'invoices', (select invoices from sums), 'sales', (select sales from sums), 'labor', (select labor from sums), 'parts', (select parts from sums), 'parts_cost', (select parts_cost from sums),
    'fees', (select fees from sums), 'discount', (select discount from sums), 'tax', (select tax from sums), 'hours', (select hours from sums),
    'payments', (select coalesce(jsonb_agg(jsonb_build_object('method', method, 'taken', coalesce(taken, 0), 'refunded', coalesce(refunded, 0), 'n', n) order by method), '[]'::jsonb) from pay),
    'collected', (select coalesce(sum(coalesce(taken, 0) - coalesce(refunded, 0)), 0) from pay),
    'ar_open', (select n from ar), 'ar_balance', (select balance from ar),
    'drawer', (select jsonb_build_object('id', id, 'opened_at', opened_at, 'opening_cents', opening_cents, 'closed_at', closed_at, 'closing_cents', closing_cents, 'expected_cents', expected_cents) from public.drawer_sessions d, win where d.shop_id = p_shop and d.opened_at >= win.d0 and d.opened_at < win.d1 order by opened_at desc limit 1)
  ) where public.is_staff(p_shop)
$$;
grant execute on function public.eod_report(text, date, text) to authenticated;

-- Sales tax by month for the filing period.
create or replace function public.tax_report(p_shop text, p_from date, p_to date, p_tz text default 'America/Denver') returns jsonb
language sql stable security definer set search_path = public as $$
  with closed as (select r.id, r.number, r.paid_at, public.ro_totals(r.id) as t from public.repair_orders r
                  where r.shop_id = p_shop and r.status = 'paid' and r.paid_at >= (p_from::timestamp at time zone p_tz) and r.paid_at < ((p_to + 1)::timestamp at time zone p_tz)),
  by_month as (select to_char(paid_at at time zone p_tz, 'YYYY-MM') as month, count(*) as invoices, sum((t->>'subtotal')::int) as subtotal,
               sum((t->>'tax')::int) as tax, sum((t->>'total')::int) as total, sum((t->>'labor')::int) as labor, sum((t->>'parts')::int) as parts from closed group by 1)
  select jsonb_build_object('from', p_from, 'to', p_to,
    'months', (select coalesce(jsonb_agg(jsonb_build_object('month', month, 'invoices', invoices, 'subtotal', subtotal, 'taxable', case when tax > 0 then round(tax / ((select tax_rate_bp from public.shops where shop_id = p_shop) / 10000.0)) else 0 end, 'tax', tax, 'total', total, 'labor', labor, 'parts', parts) order by month), '[]'::jsonb) from by_month),
    'invoices', (select coalesce(jsonb_agg(jsonb_build_object('number', number, 'paid_at', paid_at, 'subtotal', (t->>'subtotal')::int, 'tax', (t->>'tax')::int, 'total', (t->>'total')::int) order by paid_at), '[]'::jsonb) from closed)
  ) where public.is_staff(p_shop)
$$;
grant execute on function public.tax_report(text, date, date, text) to authenticated;

-- Accounts receivable: every customer with an invoice still owed.
create or replace function public.ar_report(p_shop text) returns jsonb
language sql stable security definer set search_path = public as $$
  with open_ro as (select r.id, r.number, r.invoiced_at, a.customer_id, (public.ro_totals(r.id)->>'total')::int - public.ro_paid(r.id) as balance
                   from public.repair_orders r join public.appointments a on a.id = r.appointment_id where r.shop_id = p_shop and r.status = 'invoiced'),
  per as (select c.id, c.name, c.phone, c.charge_account, c.terms_days, public.customer_credit(c.id) as credit, sum(o.balance) as balance, min(o.invoiced_at) as oldest,
                 bool_or(o.invoiced_at < now() - (c.terms_days || ' days')::interval) as overdue
          from open_ro o join public.customers c on c.id = o.customer_id group by c.id)
  select coalesce(jsonb_agg(jsonb_build_object('customer_id', id, 'name', name, 'phone', phone, 'charge_account', charge_account, 'terms_days', terms_days, 'credit', credit,
    'balance', balance, 'oldest', oldest, 'overdue', overdue,
    'invoices', (select jsonb_agg(jsonb_build_object('ro_id', x.id, 'number', x.number, 'invoiced_at', x.invoiced_at, 'balance', x.balance) order by x.invoiced_at) from open_ro x where x.customer_id = per.id)) order by oldest), '[]'::jsonb)
  from per where public.is_staff(p_shop)
$$;
grant execute on function public.ar_report(text) to authenticated;

-- A pay link opens the invoice for anyone with the token (text-to-pay).
create or replace function public.invoice_by_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('ro_id', r.id, 'number', r.number, 'status', r.status, 'link_status', pl.status, 'totals', public.ro_totals(r.id), 'paid', public.ro_paid(r.id),
    'customer', split_part(coalesce(c.name, ''), ' ', 1), 'vehicle', case when v.id is null then '' else trim(coalesce(v.year::text, '') || ' ' || v.make || ' ' || v.model) end, 'job', a.job,
    'shop', (select jsonb_build_object('name', name, 'phone', phone, 'address', address) from public.shops where shop_id = r.shop_id),
    'card', exists (select 1 from public.app_config where key = 'stripe_pk'), 'stripe_pk', (select value from public.app_config where key = 'stripe_pk'),
    'lines', (select coalesce(jsonb_agg(jsonb_build_object('kind', l.kind, 'description', l.description, 'qty', l.qty, 'unit_cents', l.unit_cents, 'cents', round(l.qty * l.unit_cents)::int) order by l.sort, l.created_at), '[]'::jsonb) from public.ro_lines l where l.ro_id = r.id and l.approved))
  from public.pay_links pl join public.repair_orders r on r.id = pl.ro_id join public.appointments a on a.id = r.appointment_id
  left join public.customers c on c.id = a.customer_id left join public.customer_vehicles v on v.id = a.vehicle_id
  where pl.token = p_token
$$;
grant execute on function public.invoice_by_token(text) to anon, authenticated;

-- Customers with a charge account owe a balance; the app shows it.
create or replace function public.my_balance() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('credit', coalesce(public.customer_credit(public.my_customer_id()), 0),
    'owed', coalesce((select sum((public.ro_totals(r.id)->>'total')::int - public.ro_paid(r.id)) from public.repair_orders r join public.appointments a on a.id = r.appointment_id where a.customer_id = public.my_customer_id() and r.status = 'invoiced'), 0))
$$;
grant execute on function public.my_balance() to authenticated;

alter publication supabase_realtime add table public.payments;
