// Sends APNs pushes for Revyn. Called by database triggers (see migration 0016) with
// { tokens, title, body, data }. Secrets: APNS_KEY (the .p8 contents), APNS_KEY_ID, APNS_TEAM_ID,
// APNS_BUNDLE_ID, APNS_SANDBOX ("1" for development builds), PUSH_SECRET (shared with the database).
const b64url = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = new TextEncoder();
let cached: { jwt: string; at: number } | null = null;

async function apnsJwt() {
  if (cached && Date.now() - cached.at < 45 * 60 * 1000) return cached.jwt;
  const pem = (Deno.env.get('APNS_KEY') || '').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64url(enc.encode(JSON.stringify({ alg: 'ES256', kid: Deno.env.get('APNS_KEY_ID') })));
  const body = b64url(enc.encode(JSON.stringify({ iss: Deno.env.get('APNS_TEAM_ID'), iat: Math.floor(Date.now() / 1000) })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
  cached = { jwt: head + '.' + body + '.' + b64url(sig), at: Date.now() };
  return cached.jwt;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  if ((req.headers.get('x-push-secret') || '') !== (Deno.env.get('PUSH_SECRET') || '')) return new Response('forbidden', { status: 403 });
  const { tokens = [], title = '', body = '', data = {} } = await req.json();
  const jwt = await apnsJwt();
  const host = Deno.env.get('APNS_SANDBOX') === '1' ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com';
  const payload = JSON.stringify({ aps: { alert: { title, body }, sound: 'default', badge: 1 }, ...data });
  const results = await Promise.all((tokens as string[]).map(async (t) => {
    try {
      const r = await fetch(host + '/3/device/' + t, { method: 'POST', headers: { authorization: 'bearer ' + jwt, 'apns-topic': Deno.env.get('APNS_BUNDLE_ID') || 'com.revyn.app', 'apns-push-type': 'alert', 'apns-priority': '10' }, body: payload });
      return { t, status: r.status, text: r.status === 200 ? '' : await r.text() };
    } catch (e) { return { t, status: 0, text: String(e) }; }
  }));
  return new Response(JSON.stringify(results), { headers: { 'content-type': 'application/json' } });
});
