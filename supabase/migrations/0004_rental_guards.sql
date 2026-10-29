-- A rental can only be signed once it has a vehicle and has been sent.
create or replace function public.sign_rental(p_token text, p_name text, p_signature text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.rentals;
begin
  select * into r from public.rentals where token = p_token;
  if r.id is null then raise exception 'not found'; end if;
  if r.status <> 'sent' then raise exception 'This agreement is not ready to sign yet.'; end if;
  if r.vehicle_id is null then raise exception 'No vehicle is attached to this agreement yet.'; end if;
  if length(coalesce(p_signature, '')) < 20 then raise exception 'signature required'; end if;
  update public.rentals set status = 'signed', signed_at = now(), signed_name = p_name, signature_svg = p_signature where id = r.id;
  return public.rental_by_token(p_token);
end $$;
