-- Lobby displays (Apple TV, any screen) read a board through a display token, no sign-in.
create table if not exists public.display_tokens (
  token      text primary key default encode(gen_random_bytes(18), 'hex'),
  shop_id    text not null default 'ryguys',
  name       text not null default 'Lobby TV',
  created_at timestamptz not null default now()
);
alter table public.display_tokens enable row level security;
create policy "owner all" on public.display_tokens for all using (public.is_owner(shop_id)) with check (public.is_owner(shop_id));
grant select, insert, delete on public.display_tokens to authenticated;

create or replace function public.board_by_token(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'shop', public.shop_public(d.shop_id),
    'rentals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'number', r.number, 'status', r.status,
        'who', split_part(r.customer_name, ' ', 1) || case when split_part(r.customer_name, ' ', 2) <> '' then ' ' || left(split_part(r.customer_name, ' ', 2), 1) || '.' else '' end,
        'vehicle', case when v.id is null then null else v.year || ' ' || v.make || ' ' || v.model end, 'paint', v.paint,
        'start_date', r.start_date, 'end_date', r.end_date, 'out_at', r.out_at
      ) order by r.end_date, r.created_at)
      from public.rentals r left join public.loaner_vehicles v on v.id = r.vehicle_id
      where r.shop_id = d.shop_id and r.status in ('signed', 'out')), '[]'::jsonb),
    'fleet', coalesce((select jsonb_agg(jsonb_build_object('vehicle', year || ' ' || make || ' ' || model, 'color', color, 'paint', paint, 'status', status) order by year desc)
      from public.loaner_vehicles where shop_id = d.shop_id and status <> 'retired'), '[]'::jsonb),
    'generated_at', now()
  )
  from public.display_tokens d where d.token = p_token
$$;
grant execute on function public.board_by_token(text) to anon, authenticated;
