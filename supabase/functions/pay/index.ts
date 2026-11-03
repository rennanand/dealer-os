// Text-to-pay: turns a pay link token into a Stripe Checkout session. Secrets: STRIPE_SECRET,
// SUPABASE_SERVICE_ROLE_KEY, PUBLIC_APP_URL (where /pay/<token> lives). Without STRIPE_SECRET the
// invoice page simply shows "pay at the counter".
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization, apikey', 'content-type': 'application/json' };
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { headers: cors });
  const sk = Deno.env.get('STRIPE_SECRET');
  if (!sk) return new Response(JSON.stringify({ error: 'Card payments are not set up yet.' }), { status: 400, headers: cors });
  const { token } = await req.json().catch(() => ({}));
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: inv } = await db.rpc('invoice_by_token', { p_token: token });
  if (!inv || inv.link_status !== 'open') return new Response(JSON.stringify({ error: 'This link is no longer valid.' }), { status: 400, headers: cors });
  const due = Number(inv.totals.total) - Number(inv.paid);
  if (due <= 0) return new Response(JSON.stringify({ error: 'Nothing is owed on this invoice.' }), { status: 400, headers: cors });
  const app = Deno.env.get('PUBLIC_APP_URL') || 'https://dealer-os-rosy.vercel.app';
  const form = new URLSearchParams({ mode: 'payment', 'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': 'usd', 'line_items[0][price_data][unit_amount]': String(due),
    'line_items[0][price_data][product_data][name]': (inv.shop?.name || 'Invoice') + ' · RO ' + inv.number + (inv.vehicle ? ' · ' + inv.vehicle : ''),
    success_url: app + '/pay/' + token + '?paid=1', cancel_url: app + '/pay/' + token, 'metadata[token]': token, 'metadata[ro_id]': inv.ro_id, 'payment_intent_data[description]': 'RO ' + inv.number });
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: 'Bearer ' + sk, 'content-type': 'application/x-www-form-urlencoded' }, body: form });
  const j = await r.json();
  if (!r.ok) return new Response(JSON.stringify({ error: j.error?.message || 'Stripe error' }), { status: 400, headers: cors });
  await db.from('pay_links').update({ provider: 'stripe', provider_ref: j.id }).eq('token', token);
  return new Response(JSON.stringify({ url: j.url }), { headers: cors });
});
