// Twilio webhook: replies from customers (set as the number's "A message comes in" URL) and
// delivery status callbacks (?status=1). Validates the Twilio signature when TWILIO_TOKEN is set.
import { createClient } from 'npm:@supabase/supabase-js@2';

async function valid(req: Request, params: URLSearchParams) {
  const token = Deno.env.get('TWILIO_TOKEN'); if (!token) return true;
  const url = (Deno.env.get('PUBLIC_FUNCTION_URL') || req.url);
  const keys = [...params.keys()].sort();
  const data = url + keys.map((k) => k + params.get(k)).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(token), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)))));
  return sig === (req.headers.get('x-twilio-signature') || '');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  const params = new URLSearchParams(await req.text());
  if (!(await valid(req, params))) return new Response('forbidden', { status: 403 });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const u = new URL(req.url);
  if (u.searchParams.get('status')) {
    const map: Record<string, string> = { delivered: 'delivered', failed: 'failed', undelivered: 'failed' };
    const st = map[params.get('MessageStatus') || ''];
    if (st) await db.from('sms_messages').update({ status: st, error: params.get('ErrorMessage') || '' }).eq('provider_sid', params.get('MessageSid') || '');
    return new Response('', { status: 204 });
  }
  await db.rpc('sms_inbound', { p_from: params.get('From') || '', p_body: params.get('Body') || '', p_sid: params.get('MessageSid') || '' });
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { 'content-type': 'text/xml' } });
});
