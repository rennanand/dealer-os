// Sends queued texts through Twilio. The database calls this (pg_net) with { id } for one queued
// row, or a cron hits it with {} to sweep everything queued. Secrets: TWILIO_SID, TWILIO_TOKEN,
// TWILIO_FROM (the shop's 10DLC-registered number or Messaging Service SID as MG…),
// SUPABASE_SERVICE_ROLE_KEY, PUSH_SECRET (shared with the database).
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  if ((req.headers.get('x-push-secret') || '') !== (Deno.env.get('PUSH_SECRET') || '')) return new Response('forbidden', { status: 403 });
  const sid = Deno.env.get('TWILIO_SID') || '', token = Deno.env.get('TWILIO_TOKEN') || '', from = Deno.env.get('TWILIO_FROM') || '';
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { id } = await req.json().catch(() => ({}));
  const q = db.from('sms_messages').select('*').eq('direction', 'out').in('status', ['queued']).limit(50);
  const { data: rows } = id ? await q.eq('id', id) : await q;
  const out = [];
  for (const m of rows || []) {
    if (!sid || !token || !from) { await db.from('sms_messages').update({ status: 'manual', error: 'Twilio is not configured' }).eq('id', m.id); continue; }
    const to = '+1' + String(m.phone).replace(/\D/g, '').slice(-10);
    const form = new URLSearchParams({ To: to, Body: m.body });
    if (from.startsWith('MG')) form.set('MessagingServiceSid', from); else form.set('From', from);
    form.set('StatusCallback', Deno.env.get('SUPABASE_URL') + '/functions/v1/sms-inbound?status=1');
    try {
      const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', { method: 'POST', headers: { authorization: 'Basic ' + btoa(sid + ':' + token), 'content-type': 'application/x-www-form-urlencoded' }, body: form });
      const j = await r.json();
      if (r.ok) await db.from('sms_messages').update({ status: 'sent', sent_at: new Date().toISOString(), provider_sid: j.sid || '' }).eq('id', m.id);
      else await db.from('sms_messages').update({ status: 'failed', error: j.message || String(r.status) }).eq('id', m.id);
      out.push({ id: m.id, ok: r.ok });
    } catch (e) { await db.from('sms_messages').update({ status: 'failed', error: String(e) }).eq('id', m.id); out.push({ id: m.id, ok: false }); }
  }
  return new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json' } });
});
