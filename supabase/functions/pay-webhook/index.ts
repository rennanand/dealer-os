// Stripe webhook (checkout.session.completed): records the card payment on the RO. Secrets:
// STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2';

async function verify(raw: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(parts.t + '.' + raw)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return sig === parts.v1 && Math.abs(Date.now() / 1000 - Number(parts.t)) < 600;
}

Deno.serve(async (req) => {
  const raw = await req.text();
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
  if (secret && !(await verify(raw, req.headers.get('stripe-signature') || '', secret))) return new Response('bad signature', { status: 400 });
  const ev = JSON.parse(raw);
  if (ev.type !== 'checkout.session.completed') return new Response('ignored');
  const s = ev.data.object, token = s.metadata?.token, ro = s.metadata?.ro_id;
  if (!token || !ro) return new Response('no token');
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: dup } = await db.from('payments').select('id').eq('provider_ref', s.payment_intent || s.id).maybeSingle();
  if (dup) return new Response('already recorded');
  // Service role bypasses RLS; record_payment checks is_staff, so insert directly and close the RO the same way it does.
  const { data: ro_row } = await db.from('repair_orders').select('id, shop_id, appointment_id, status').eq('id', ro).single();
  const { data: appt } = await db.from('appointments').select('customer_id').eq('id', ro_row.appointment_id).single();
  await db.from('payments').insert({ shop_id: ro_row.shop_id, ro_id: ro, customer_id: appt.customer_id, method: 'card', amount_cents: Number(s.amount_total), reference: 'online', provider: 'stripe', provider_ref: s.payment_intent || s.id, note: 'Paid by link' });
  const { data: totals } = await db.rpc('ro_totals', { p_ro: ro }); const { data: paid } = await db.rpc('ro_paid', { p_ro: ro });
  if (Number(paid) >= Number(totals.total)) { await db.from('repair_orders').update({ status: 'paid', paid_at: new Date().toISOString(), paid_method: 'card', paid_cents: paid }).eq('id', ro); await db.from('pay_links').update({ status: 'paid' }).eq('token', token); }
  else await db.from('repair_orders').update({ paid_cents: paid, status: 'invoiced' }).eq('id', ro);
  return new Response('ok');
});
