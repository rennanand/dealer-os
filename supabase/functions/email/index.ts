// Sends queued emails through Resend. The database calls this (pg_net) with { id } for one row, or
// a sweep with {}. Secrets: RESEND_API_KEY, EMAIL_FROM ("RyGuys Tire & Auto <hello@revyn.app>"),
// EMAIL_REPLY_TO (optional), SUPABASE_SERVICE_ROLE_KEY, PUSH_SECRET (shared with the database).
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  if ((req.headers.get('x-push-secret') || '') !== (Deno.env.get('PUSH_SECRET') || '')) return new Response('forbidden', { status: 403 });
  const key = Deno.env.get('RESEND_API_KEY') || '', from = Deno.env.get('EMAIL_FROM') || '';
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { id } = await req.json().catch(() => ({}));
  const q = db.from('emails').select('*').eq('status', 'queued').limit(50);
  const { data: rows } = id ? await q.eq('id', id) : await q;
  const out = [];
  for (const m of rows || []) {
    if (!key || !from) { await db.from('emails').update({ status: 'manual', error: 'Email is not configured' }).eq('id', m.id); continue; }
    try {
      const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify({ from, to: [m.to_email], subject: m.subject, html: m.html, reply_to: Deno.env.get('EMAIL_REPLY_TO') || undefined }) });
      const j = await r.json();
      if (r.ok) await db.from('emails').update({ status: 'sent', sent_at: new Date().toISOString(), provider_id: j.id || '' }).eq('id', m.id);
      else await db.from('emails').update({ status: 'failed', error: j.message || String(r.status) }).eq('id', m.id);
      out.push({ id: m.id, ok: r.ok });
    } catch (e) { await db.from('emails').update({ status: 'failed', error: String(e) }).eq('id', m.id); out.push({ id: m.id, ok: false }); }
  }
  return new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json' } });
});
