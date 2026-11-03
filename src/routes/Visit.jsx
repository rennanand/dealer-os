import React from 'react';
import { useParams } from 'react-router-dom';
import { css } from '../runtime/tpl.js';
import { supabase, SUPABASE_URL, SHOP_ID } from '../state/supabase.js';
import { SignaturePad, toPath } from './Rental.jsx';

// The visit link: /visit/<token>. One private page that does everything the app does for one
// visit, with no account: confirm, reschedule, cancel, check in and sign, see the inspection,
// approve the estimate, look at photos, read the invoice and pay, message the shop, say you are on
// the way, rate the visit, and look back at earlier visits.

const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const PAGE = 'min-height:100%;background:#000;color:#fff;' + FONT;
const WRAP = 'max-width:430px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 22px calc(env(safe-area-inset-bottom,0px) + 60px)';
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px';
const DATA = 'font-family:var(--data-font,inherit)';
const INPUT = 'width:100%;background:rgba(255,255,255,.06);border:0;outline:0;border-radius:12px;padding:13px 14px;font-size:15px;color:#fff;box-sizing:border-box;' + FONT;
const BTN = (ok = true) => 'text-align:center;padding:14px 0;border-radius:12px;font-size:14px;font-weight:600;' + (ok ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;');
const GHOST = 'text-align:center;padding:13px 0;border-radius:12px;font-size:13.5px;font-weight:500;background:rgba(255,255,255,.08);color:#fff;cursor:pointer';
const chip = (on) => 'padding:9px 12px;border-radius:12px;font-size:13px;font-weight:500;cursor:pointer;text-align:center;' + (on ? 'background:#fff;color:#000' : 'background:rgba(255,255,255,.08);color:rgba(235,235,245,.75)');
const RED = '#e0312b', GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';
const $ = (c) => '$' + ((c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtT = (ts) => (ts ? new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '');
const fmtD = (ts) => (ts ? new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '');
const iso = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
const TIER = { now: ['Recommended now', RED], soon: ['Recommended soon', YEL], monitor: ['Monitor', GRN] };
const photoUrl = (p) => (p.path ? SUPABASE_URL + '/storage/v1/object/public/visit-photos/' + p.path : '');

const DEMO = { id: 'a1', starts_at: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 11) + '10:30:00', minutes: 60, job: 'Brakes', visit: 'dropoff', status: 'booked', customer: 'Sarah', customer_name: 'Sarah Mitchell', vehicle: '2021 Toyota 4Runner', odometer: 61220, tech: '', pickup: '', in_app: false,
  shop: { name: 'RyGuys Tire & Auto Sales', phone: '4358354869', address: '204 N Main St, Manti, UT 84642', hours: 'Mon, Tue, Thu, Fri · 8:00 AM – 5:30 PM', lat: 39.2686964, lng: -111.636588, estimate_note: 'Prices include labor and parts. Tax and shop supplies are added on the invoice.', authorization_text: 'I authorize the repair work described, including the parts and labor it needs, and grant the shop permission to operate the vehicle for testing and inspection. I understand an estimate is not a final bill and that I will be contacted before any work beyond it is done.', review_url: 'https://g.page/r/example/review', open_days: [1, 2, 4, 5], booking: { lead_hours: 2, services: [] } },
  findings: [], photos: [], inspection: null, invoice: null, rental: null, messages: [], authorizations: [], history: [{ id: 'h1', token: 'demo', starts_at: '2026-05-12T10:00:00', job: 'Tire rotation', total: 4500 }] };
const DEMO_LIVE = { ...DEMO, status: 'in_progress', starts_at: new Date(Date.now() - 36e5).toISOString(), arrived_at: new Date(Date.now() - 30e5).toISOString(), started_at: new Date(Date.now() - 12e5).toISOString(), bay: 2, tech: 'Mike', online_checkin_at: new Date(Date.now() - 32e5).toISOString(), confirmed_at: new Date().toISOString(),
  findings: [{ id: 'f1', tier: 'now', name: 'Front brake pads & rotors', plain: 'Pads are worn to 2 mm. Rotors are grooved and should go with them.', meas: '2 mm', meas_label: 'Pad', urgency: 'Recommended before you drive far.', price_cents: 47485, status: 'pending', lines: [{ kind: 'labor', description: 'Front brake pads & rotors', qty: 1.8, unit_cents: 12500 }, { kind: 'part', description: 'Front brake pads · ceramic', qty: 1, unit_cents: 8995 }, { kind: 'part', description: 'Front rotors', qty: 2, unit_cents: 7995 }] }, { id: 'f2', tier: 'monitor', name: 'Cabin air filter', plain: 'Getting dirty. Fine for a few more months.', price_cents: 6500, status: 'pending', lines: [] }],
  inspection: { sent_at: new Date().toISOString(), tech: 'Mike', items: [{ key: 'tires', label: 'Tires', status: 'good', meas: '7/32', meas_label: 'Tread 32nds' }, { key: 'brakes', label: 'Brakes', status: 'now', meas: '2 mm', meas_label: 'Pad mm', note: 'Front pads at the wear line.' }, { key: 'battery', label: 'Battery', status: 'good', meas: '12.6 V' }, { key: 'fluids', label: 'Fluids', status: 'good' }, { key: 'filters', label: 'Filters', status: 'monitor', note: 'Cabin filter getting dirty.' }, { key: 'lights', label: 'Lights & wipers', status: 'good' }] },
  invoice: { number: 1042, status: 'open', totals: { subtotal: 12500, tax: 906, total: 13406 }, paid_cents: 0, lines: [{ kind: 'labor', description: 'Brake inspection', qty: 1, unit_cents: 12500, cents: 12500 }], card: false },
  messages: [{ id: 'm1', sender: 'advisor', text: 'Hi Sarah — car is on the lift, inspection coming shortly.', created_at: new Date(Date.now() - 10e5).toISOString() }] };

function useVisit(token) {
  const [st, set] = React.useState({ loading: true, v: null, err: '' });
  const load = React.useCallback(async () => {
    if (!supabase) return set({ loading: false, v: token === 'live' ? DEMO_LIVE : DEMO, err: '' });
    const { data, error } = await supabase.rpc('visit_by_token', { p_token: token });
    if (error || !data) return set({ loading: false, v: null, err: 'This link is not valid.' });
    set({ loading: false, v: data, err: '' });
  }, [token]);
  React.useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  const act = React.useCallback(async (action, arg) => {
    if (!supabase) { set((s) => ({ ...s, v: demoAct(s.v, action, arg) })); return true; }
    const { data, error } = await supabase.rpc('visit_action', { p_token: token, p_action: action, p_arg: arg || {} });
    if (error) { set((s) => ({ ...s, err: error.message })); return false; }
    set({ loading: false, v: data, err: '' }); return true;
  }, [token]);
  return { ...st, act, clearErr: () => set((s) => ({ ...s, err: '' })) };
}
function demoAct(v, action, arg) {
  const now = new Date().toISOString();
  if (action === 'confirm') return { ...v, confirmed_at: now };
  if (action === 'cancel') return { ...v, status: 'cancelled' };
  if (action === 'reschedule') return { ...v, starts_at: arg.starts_at, confirmed_at: now };
  if (action === 'checkin') return { ...v, online_checkin_at: now, concern: arg.concern || v.concern, odometer: arg.odometer || v.odometer, pickup: 'here', authorizations: v.authorizations.concat(arg.signature ? { kind: 'checkin', name: arg.name, created_at: now } : []) };
  if (action === 'decide') return { ...v, findings: v.findings.map((f) => (arg.approve.includes(f.id) ? { ...f, status: 'approved' } : arg.decline.includes(f.id) ? { ...f, status: 'declined' } : f)) };
  if (action === 'message') return { ...v, messages: v.messages.concat({ id: 'm' + Date.now(), sender: 'customer', text: arg.text, created_at: now }) };
  if (action === 'pickup') return { ...v, pickup: arg.state };
  if (action === 'rate') return { ...v, rating: arg.stars };
  if (action === 'odometer') return { ...v, odometer: arg.odometer };
  return v;
}

export function VisitRoute() {
  const { token } = useParams();
  const { loading, v, err, act, clearErr } = useVisit(token);
  if (loading) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center;color:rgba(235,235,245,.45);font-size:13px')}>Loading…</div></div>;
  if (!v) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center')}><div style={css('font-size:20px;font-weight:600')}>{err}</div><div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>Ask the shop to send the link again.</div></div></div>;
  const stage = { booked: 0, arrived: 1, in_progress: 2, done: 3 }[v.status]; const over = v.status === 'cancelled' || v.status === 'no_show';
  const pending = v.findings.filter((f) => f.status === 'pending');
  const inv = v.invoice; const due = inv ? (inv.totals.total || 0) - (inv.paid_cents || 0) : 0;
  const sh = v.shop;
  const phone = sh.phone ? sh.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : '';
  const maps = sh.lat ? 'https://maps.apple.com/?daddr=' + sh.lat + ',' + sh.lng : 'https://maps.apple.com/?q=' + encodeURIComponent(sh.address || sh.name);
  const headline = over ? 'This visit was cancelled.' : v.status === 'done' ? (v.pickup === 'picked_up' ? 'Thanks for coming in, ' + v.customer + '.' : v.vehicle + ' is ready.') : v.status === 'in_progress' ? 'Work is under way.' : v.status === 'arrived' ? 'You are checked in.' : 'Hi ' + v.customer + '.';
  return (
    <div style={css(PAGE)}>
      <div style={css(WRAP)}>
        <div style={css(LBL)}>{sh.name}</div>
        <div style={css('font-size:26px;font-weight:600;letter-spacing:-.6px;margin-top:6px;line-height:1.15')}>{headline}</div>
        <div style={css('font-size:13.5px;color:rgba(235,235,245,.55);margin-top:6px;line-height:1.5')}>{v.vehicle || 'Your vehicle'}{v.job ? ' · ' + v.job : ''}{v.odometer ? ' · ' + v.odometer.toLocaleString('en-US') + ' mi' : ''}</div>
        {err ? <div onClick={clearErr} style={css('margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{err}</div> : null}

        {!over ? <Status v={v} stage={stage} /> : null}
        {!over && v.status === 'booked' ? <Booked v={v} act={act} maps={maps} /> : null}
        {!over && (v.status === 'booked' || v.status === 'arrived') && !v.online_checkin_at ? <CheckIn v={v} act={act} /> : null}
        {!over && v.online_checkin_at && v.status !== 'done' ? <div style={css('font-size:12.5px;color:' + GRN + ';margin-top:12px')}>Checked in online · {fmtT(v.online_checkin_at)}{v.authorizations.some((a) => a.kind === 'checkin') ? ' · authorization signed' : ''}</div> : null}
        {pending.length ? <Estimate v={v} act={act} /> : null}
        {v.findings.length && !pending.length ? <Decided v={v} /> : null}
        {v.inspection ? <Inspection v={v} /> : null}
        {v.photos.length ? <Photos v={v} /> : null}
        {inv && (inv.lines || []).length ? <Invoice v={v} inv={inv} due={due} token={token} /> : null}
        {v.rental ? <Loaner v={v} /> : null}
        {!over && v.status === 'done' && v.pickup !== 'picked_up' ? <Pickup v={v} act={act} maps={maps} /> : null}
        {!over && (v.status === 'done') ? <Rate v={v} act={act} /> : null}
        <Messages v={v} act={act} />
        {v.history.length ? <History v={v} /> : null}
        <div style={css(CARD + ';margin-top:22px;display:flex;flex-direction:column;gap:10px')}>
          <div style={css('font-size:14px;font-weight:600')}>{sh.name}</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.55);line-height:1.5')}>{sh.address}{sh.hours ? <><br />{sh.hours}</> : null}</div>
          <div style={css('display:flex;gap:8px')}>
            {sh.phone ? <a href={'tel:' + sh.phone} style={css(GHOST + ';flex:1;text-decoration:none')}>Call</a> : null}
            <a href={maps} target="_blank" rel="noreferrer" style={css(GHOST + ';flex:1;text-decoration:none')}>Directions</a>
          </div>
        </div>
        {!v.in_app ? <a href="/join" style={css('display:block;margin-top:14px;text-align:center;font-size:12.5px;color:rgba(235,235,245,.45);text-decoration:none;line-height:1.5')}>Every visit, estimate and receipt in one place — <span style={css('color:#fff')}>get the Revyn app</span>.</a> : null}
      </div>
    </div>
  );
}

function Status({ v, stage }) {
  const steps = [['Booked', v.starts_at], ['Checked in', v.arrived_at], ['In service', v.started_at], ['Ready', v.done_at]];
  return (
    <div style={css(CARD + ';margin-top:20px')}>
      <div style={css('display:flex;gap:6px')}>{steps.map((s, i) => <div key={i} style={css('flex:1;height:3px;border-radius:2px;background:' + (i < stage ? 'rgba(235,235,245,.5)' : i === stage ? (stage === 3 ? GRN : RED) : 'rgba(235,235,245,.12)'))} />)}</div>
      <div style={css('display:flex;justify-content:space-between;margin-top:10px')}>{steps.map((s, i) => <div key={i} style={css('font-size:11px;color:' + (i === stage ? '#fff' : i < stage ? 'rgba(235,235,245,.5)' : 'rgba(235,235,245,.3)') + ';text-align:' + (i === 0 ? 'left' : i === 3 ? 'right' : 'center'))}><div style={css('font-weight:' + (i === stage ? '600' : '400'))}>{s[0]}</div><div style={css(DATA + ';margin-top:2px')}>{i <= stage ? fmtT(s[1]) : ''}</div></div>)}</div>
      {stage >= 1 && stage < 3 ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.55);margin-top:12px;line-height:1.5')}>{v.bay ? 'Bay 0' + v.bay : ''}{v.tech ? (v.bay ? ' · ' : '') + v.tech + ' is your technician' : ''}{v.bay || v.tech ? '. ' : ''}Status is updated by the shop as the work moves along.</div> : null}
    </div>
  );
}

function Booked({ v, act, maps }) {
  const [mode, setMode] = React.useState('');
  const [day, setDay] = React.useState('');
  const [slots, setSlots] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const days = React.useMemo(() => { const out = []; const d = new Date(); for (let i = 0; i < 30 && out.length < 10; i++) { const x = new Date(d); x.setDate(d.getDate() + i); if ((v.shop.open_days || [1, 2, 3, 4, 5]).includes(x.getDay())) out.push(iso(x)); } return out; }, [v.shop.open_days]);
  React.useEffect(() => { if (mode === 'move' && !day && days.length) setDay(days[0]); }, [mode, days, day]);
  React.useEffect(() => {
    if (mode !== 'move' || !day) return; setSlots(null);
    if (!supabase) { const out = []; for (let h = 8; h < 17; h++) for (const m of [0, 30]) if ((h + m) % 3) out.push({ starts_at: day + 'T' + String(h).padStart(2, '0') + ':' + (m ? '30' : '00') + ':00', label: ((h + 11) % 12 + 1) + ':' + (m ? '30' : '00') + (h >= 12 ? ' PM' : ' AM') }); return setSlots(out); }
    supabase.rpc('booking_slots', { p_shop: SHOP_ID, p_day: day, p_minutes: v.minutes || 60 }).then(({ data }) => setSlots(Array.isArray(data) ? data : []));
  }, [mode, day, v.minutes]);
  const ics = () => {
    const s = new Date(v.starts_at), e = new Date(s.getTime() + (v.minutes || 60) * 60000); const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Revyn//EN', 'BEGIN:VEVENT', 'UID:' + v.id + '@revyn', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(s), 'DTEND:' + f(e), 'SUMMARY:' + v.shop.name + ' · ' + (v.job || 'Service'), 'LOCATION:' + (v.shop.address || ''), 'DESCRIPTION:' + window.location.href, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    try { const a = document.createElement('a'); a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(text); a.download = 'revyn-visit.ics'; a.click(); } catch (e) {}
  };
  const when = new Date(v.starts_at);
  return (
    <div style={css(CARD + ';margin-top:12px')}>
      <div style={css('display:flex;justify-content:space-between;align-items:baseline;gap:12px')}>
        <div><div style={css('font-size:18px;font-weight:600')}>{when.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div><div style={css('font-size:14px;color:rgba(235,235,245,.6);margin-top:2px')}>{fmtT(v.starts_at)} · {{ wait: 'Wait at the shop', loaner: 'Loaner', dropoff: 'Drop off' }[v.visit] || 'Drop off'}</div></div>
        <div style={css('font-size:12px;font-weight:500;color:' + (v.confirmed_at ? GRN : YEL))}>{v.confirmed_at ? 'Confirmed' : 'Not confirmed'}</div>
      </div>
      {mode === '' ? (
        <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:14px')}>
          {!v.confirmed_at ? <div onClick={() => act('confirm')} style={css(BTN())}>Confirm this visit</div> : null}
          <div style={css('display:flex;gap:8px')}>
            <div onClick={() => setMode('move')} style={css(GHOST + ';flex:1')}>Reschedule</div>
            <div onClick={ics} style={css(GHOST + ';flex:1')}>Add to calendar</div>
            <div onClick={() => setMode('cancel')} style={css(GHOST + ';flex:1;color:#ff6b64')}>Cancel</div>
          </div>
        </div>
      ) : mode === 'cancel' ? (
        <div style={css('margin-top:14px')}>
          <div style={css('font-size:13.5px;color:rgba(235,235,245,.7);line-height:1.5')}>Cancel this visit? You can book again any time.</div>
          <div style={css('display:flex;gap:8px;margin-top:10px')}><div onClick={async () => { setBusy(true); await act('cancel'); setBusy(false); }} style={css(BTN() + ';flex:1;background:#ff6b64;color:#000;' + (busy ? 'opacity:.6' : ''))}>Yes, cancel</div><div onClick={() => setMode('')} style={css(GHOST + ';flex:1')}>Keep it</div></div>
        </div>
      ) : (
        <div style={css('margin-top:14px')}>
          <div style={css(LBL)}>Pick a new time</div>
          <div style={css('display:flex;gap:8px;overflow-x:auto;margin:8px -18px 0;padding:0 18px 4px')} className="hidescroll">{days.map((d) => <div key={d} onClick={() => setDay(d)} style={css(chip(day === d) + ';flex:0 0 auto;min-width:60px;white-space:pre-line;line-height:1.3;font-size:12px')}>{new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }) + '\n' + new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>)}</div>
          {slots === null ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.45);margin-top:10px')}>Checking the schedule…</div> : slots.length ? <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px')}>{slots.map((s) => <div key={s.starts_at} onClick={async () => { setBusy(true); const ok = await act('reschedule', { starts_at: s.starts_at }); setBusy(false); if (ok) setMode(''); }} style={css(chip(false) + ';font-size:12.5px;' + (busy ? 'opacity:.6' : ''))}>{s.label}</div>)}</div> : <div style={css('font-size:12.5px;color:rgba(235,235,245,.45);margin-top:10px')}>Nothing open that day.</div>}
          <div onClick={() => setMode('')} style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:12px;cursor:pointer;text-align:center')}>Keep the current time</div>
        </div>
      )}
    </div>
  );
}

function CheckIn({ v, act }) {
  const [open, setOpen] = React.useState(false);
  const [odo, setOdo] = React.useState(v.odometer ? String(v.odometer) : '');
  const [concern, setConcern] = React.useState(v.concern || '');
  const [name, setName] = React.useState(v.customer_name || '');
  const [strokes, setStrokes] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const today = iso(new Date()) === iso(new Date(v.starts_at));
  if (!open) return (
    <div style={css(CARD + ';margin-top:12px;display:flex;align-items:center;gap:14px;cursor:pointer')} onClick={() => setOpen(true)}>
      <div style={css('flex:1')}><div style={css('font-size:15px;font-weight:600')}>Check in online</div><div style={css('font-size:12.5px;color:rgba(235,235,245,.55);margin-top:3px;line-height:1.45')}>{today ? 'Skip the counter: mileage, what you are noticing, and your signature. Then drop the key.' : 'Do it now and skip the counter on the day: mileage, what you are noticing, your signature.'}</div></div>
      <svg viewBox="0 0 24 24" style={css('width:18px;height:18px;color:rgba(235,235,245,.4);flex:0 0 auto')}><path d="M9 6l6 6-6 6" style={css('fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round')} /></svg>
    </div>
  );
  const ok = name.trim().length > 1 && strokes.length > 0;
  return (
    <div style={css(CARD + ';margin-top:12px;display:flex;flex-direction:column;gap:10px')}>
      <div style={css('font-size:16px;font-weight:600')}>Check in</div>
      <input value={odo} inputMode="numeric" placeholder="Mileage on the dash" onChange={(e) => setOdo(e.target.value.replace(/\D/g, ''))} style={css(INPUT + ';' + DATA)} />
      <textarea value={concern} rows={3} placeholder="What are you noticing? Noises, when it happens, warning lights." onChange={(e) => setConcern(e.target.value)} style={css(INPUT + ';resize:none;line-height:1.45;font-size:14px')} />
      <div style={css('font-size:12px;color:rgba(235,235,245,.5);line-height:1.5')}>{v.shop.authorization_text}</div>
      <input value={name} placeholder="Your full name" autoComplete="name" onChange={(e) => setName(e.target.value)} style={css(INPUT)} />
      <SignaturePad strokes={strokes} setStrokes={setStrokes} />
      <div style={css('display:flex;gap:8px')}>
        <div onClick={ok && !busy ? async () => { setBusy(true); await act('checkin', { odometer: parseInt(odo, 10) || null, concern, name: name.trim(), signature: toPath(strokes) }); setBusy(false); } : null} style={css(BTN(ok) + ';flex:1;' + (busy ? 'opacity:.6' : ''))}>{busy ? 'Checking in…' : 'Sign and check in'}</div>
        <div onClick={() => setOpen(false)} style={css(GHOST + ';flex:0 0 90px')}>Later</div>
      </div>
    </div>
  );
}

function Job({ f, v, pick, on, toggle }) {
  const [open, setOpen] = React.useState(false);
  const t = TIER[f.tier] || TIER.monitor; const sel = pick ? on : f.status === 'approved' || f.status === 'done';
  const ph = (v.photos || []).filter((p) => p.finding_id === f.id);
  return (
    <div style={css(CARD + ';margin-top:10px;' + (pick ? 'cursor:pointer;' : 'opacity:.85;') + (sel && pick ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)' : ''))} onClick={pick ? toggle : null}>
      <div style={css('display:flex;gap:12px;align-items:flex-start')}>
        {pick ? <div style={css('width:22px;height:22px;border-radius:11px;flex:0 0 auto;margin-top:1px;display:flex;align-items:center;justify-content:center;' + (sel ? 'background:#fff' : 'box-shadow:inset 0 0 0 1.5px rgba(235,235,245,.3)'))}>{sel ? <svg viewBox="0 0 24 24" style={css('width:14px;height:14px')}><path d="M5 12.5l4.5 4.5L19 7" style={css('fill:none;stroke:#000;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')} /></svg> : null}</div> : null}
        <div style={css('flex:1;min-width:0')}>
          <div style={css('display:flex;justify-content:space-between;gap:10px;align-items:baseline')}><div style={css('font-size:15px;font-weight:600')}>{f.name}</div><div style={css(DATA + ';font-size:15px;font-weight:600;white-space:nowrap')}>{f.price_cents ? $(f.price_cents) : 'No charge'}</div></div>
          <div style={css('font-size:11.5px;margin-top:3px;color:' + (pick ? t[1] : f.status === 'declined' ? DIM : GRN))}>{pick ? t[0] + (f.meas ? ' · ' + [f.meas_label, f.meas].filter(Boolean).join(' ') : '') : f.status === 'declined' ? 'Declined' : 'Approved'}</div>
          {f.plain ? <div style={css('font-size:13px;color:rgba(235,235,245,.7);margin-top:8px;line-height:1.5')}>{f.plain}</div> : null}
          {f.urgency && pick ? <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:4px')}>{f.urgency}</div> : null}
          {ph.length ? <div style={css('display:flex;gap:6px;margin-top:10px')}>{ph.map((p, i) => <a key={i} href={photoUrl(p)} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()} style={css('width:70px;height:52px;border-radius:8px;background:#222 url(' + photoUrl(p) + ') center/cover;display:block')} />)}</div> : null}
          {(f.lines || []).length ? <div onClick={(ev) => { ev.stopPropagation(); setOpen(!open); }} style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:10px;cursor:pointer')}>{open ? 'Hide the breakdown' : 'What is included'}</div> : null}
          {open ? <div style={css('margin-top:6px')}>{f.lines.map((l, i) => <div key={i} style={css('display:flex;justify-content:space-between;gap:10px;font-size:12px;color:rgba(235,235,245,.55);padding:3px 0')}><div>{l.description}{Number(l.qty) !== 1 ? <span style={css('margin-left:6px;color:rgba(235,235,245,.35)')}>{Number(l.qty)}{l.kind === 'labor' ? ' h' : ' ×'}</span> : null}</div><div style={css(DATA)}>{$(Math.round(Number(l.qty) * l.unit_cents))}</div></div>)}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Estimate({ v, act }) {
  const pending = v.findings.filter((f) => f.status === 'pending');
  const [plan, setPlan] = React.useState(() => Object.fromEntries(pending.map((f) => [f.id, f.tier !== 'monitor'])));
  const [sign, setSign] = React.useState(false);
  const [name, setName] = React.useState(v.customer_name || '');
  const [strokes, setStrokes] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const chosen = pending.filter((f) => !!plan[f.id]);
  const total = chosen.reduce((t, f) => t + f.price_cents, 0);
  const send = async () => {
    if (busy) return; setBusy(true);
    await act('decide', { approve: chosen.map((f) => f.id), decline: pending.filter((f) => !plan[f.id]).map((f) => f.id), name: name.trim(), signature: strokes.length ? toPath(strokes) : '' });
    setBusy(false); setSign(false);
  };
  return (
    <div style={css('margin-top:22px')}>
      <div style={css('display:flex;justify-content:space-between;align-items:baseline')}><div style={css('font-size:18px;font-weight:600')}>Your estimate</div><div style={css('font-size:12px;color:' + YEL)}>{pending.length} to decide</div></div>
      <div style={css('font-size:13px;color:rgba(235,235,245,.55);margin-top:4px;line-height:1.5')}>Check what you would like done. Unchecked items are declined; you can always book them later.</div>
      {pending.map((f) => <Job key={f.id} f={f} v={v} pick on={!!plan[f.id]} toggle={() => setPlan({ ...plan, [f.id]: !plan[f.id] })} />)}
      {!sign ? (
        <div onClick={() => setSign(true)} style={css(BTN() + ';margin-top:12px')}>{total ? 'Approve ' + $(total) : chosen.length ? 'Approve' : 'Decline all for now'}</div>
      ) : (
        <div style={css(CARD + ';margin-top:12px;display:flex;flex-direction:column;gap:10px')}>
          <div style={css('font-size:13px;color:rgba(235,235,245,.7);line-height:1.5')}>{chosen.length ? 'Approving ' + chosen.length + (chosen.length === 1 ? ' item' : ' items') + ' for ' + $(total) + '. ' : 'Declining everything for now. '}{chosen.length ? 'Sign to authorize the work — or skip the signature and approve by tapping.' : ''}</div>
          {chosen.length ? <><input value={name} placeholder="Your full name" onChange={(e) => setName(e.target.value)} style={css(INPUT)} /><SignaturePad strokes={strokes} setStrokes={setStrokes} /></> : null}
          <div style={css('display:flex;gap:8px')}>
            <div onClick={send} style={css(BTN() + ';flex:1;' + (busy ? 'opacity:.6' : ''))}>{busy ? 'Sending…' : chosen.length && strokes.length ? 'Sign and approve' : chosen.length ? 'Approve without signing' : 'Confirm'}</div>
            <div onClick={() => setSign(false)} style={css(GHOST + ';flex:0 0 80px')}>Back</div>
          </div>
        </div>
      )}
      <div style={css('font-size:11.5px;color:rgba(235,235,245,.35);margin-top:12px;line-height:1.5')}>{v.shop.estimate_note}</div>
    </div>
  );
}

function Decided({ v }) {
  const [open, setOpen] = React.useState(false);
  const appr = v.findings.filter((f) => f.status === 'approved' || f.status === 'done'), decl = v.findings.filter((f) => f.status === 'declined');
  return (
    <div style={css('margin-top:22px')}>
      <div onClick={() => setOpen(!open)} style={css('display:flex;justify-content:space-between;align-items:baseline;cursor:pointer')}><div style={css('font-size:18px;font-weight:600')}>Service plan</div><div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{appr.length} approved{decl.length ? ' · ' + decl.length + ' declined' : ''} {open ? '▴' : '▾'}</div></div>
      {open ? v.findings.map((f) => <Job key={f.id} f={f} v={v} />) : null}
    </div>
  );
}

function Inspection({ v }) {
  const [open, setOpen] = React.useState(false);
  const it = v.inspection.items || []; const good = it.filter((x) => x.status === 'good'), flag = it.filter((x) => x.status !== 'good');
  const C = { good: GRN, monitor: YEL, now: RED };
  return (
    <div style={css('margin-top:22px')}>
      <div onClick={() => setOpen(!open)} style={css('display:flex;justify-content:space-between;align-items:baseline;cursor:pointer')}><div style={css('font-size:18px;font-weight:600')}>Inspection report</div><div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{good.length} good · {flag.length} flagged {open ? '▴' : '▾'}</div></div>
      <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px')}>{v.inspection.tech ? 'By ' + v.inspection.tech + ' · ' : ''}{fmtD(v.inspection.sent_at)} {fmtT(v.inspection.sent_at)} · measured at the visit</div>
      {open ? <div style={css(CARD + ';margin-top:10px;padding:6px 18px')}>{flag.concat(good).map((x) => <div key={x.key} style={css('display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07)')}><div style={css('width:8px;height:8px;border-radius:4px;background:' + (C[x.status] || DIM) + ';margin-top:6px;flex:0 0 auto')} /><div style={css('flex:1')}><div style={css('display:flex;justify-content:space-between;gap:10px;font-size:14px')}><div style={css('font-weight:500')}>{x.label}</div><div style={css(DATA + ';color:rgba(235,235,245,.6);font-size:13px')}>{x.meas || ''}</div></div>{x.note ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.55);margin-top:3px;line-height:1.45')}>{x.note}</div> : null}</div></div>)}</div> : null}
    </div>
  );
}

function Photos({ v }) {
  return (
    <div style={css('margin-top:22px')}>
      <div style={css('font-size:18px;font-weight:600')}>Photos from your technician</div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:10px')}>{v.photos.map((p) => <a key={p.id} href={photoUrl(p)} target="_blank" rel="noreferrer" style={css('aspect-ratio:4/3;border-radius:10px;background:#222 url(' + photoUrl(p) + ') center/cover;display:block')} />)}</div>
    </div>
  );
}

function Invoice({ v, inv, due, token }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const paid = inv.status === 'paid' || due <= 0;
  const KIND = { labor: 'Labor', part: 'Part', fee: 'Fee', discount: 'Discount' };
  const pay = async () => {
    if (busy || !supabase || !inv.pay_token) return; setBusy(true);
    try { const r = await fetch(SUPABASE_URL + '/functions/v1/pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: inv.pay_token }) }); const j = await r.json(); if (j.url) window.location.href = j.url; else setErr(j.error || 'Could not start the payment.'); } catch (e) { setErr('Could not reach the payment service.'); }
    setBusy(false);
  };
  return (
    <div style={css('margin-top:22px')}>
      <div style={css('display:flex;justify-content:space-between;align-items:baseline')}><div style={css('font-size:18px;font-weight:600')}>{paid ? 'Receipt' : inv.status === 'invoiced' || v.status === 'done' ? 'Invoice' : 'Running total'}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>RO {inv.number}</div></div>
      <div style={css(CARD + ';margin-top:10px')}>
        {inv.lines.map((l, i) => <div key={i} style={css('display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}><div><span style={css('font-family:var(--data-font,inherit);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.35);margin-right:8px')}>{KIND[l.kind] || l.kind}</span>{l.description}{Number(l.qty) !== 1 ? <span style={css('color:rgba(235,235,245,.4);margin-left:6px;font-size:12px')}>{Number(l.qty)}{l.kind === 'labor' ? ' h' : ' ×'}</span> : null}</div><div style={css(DATA + ';white-space:nowrap')}>{$(l.cents)}</div></div>)}
        <div style={css('margin-top:8px')}>
          {[['Subtotal', inv.totals.subtotal], ['Tax', inv.totals.tax]].map(([k, val]) => <div key={k} style={css('display:flex;justify-content:space-between;font-size:12.5px;color:rgba(235,235,245,.55);padding:3px 0')}><span>{k}</span><span style={css(DATA)}>{$(val)}</span></div>)}
          <div style={css('display:flex;justify-content:space-between;font-size:17px;font-weight:600;padding:10px 0 0;margin-top:6px;border-top:1px solid rgba(235,235,245,.12)')}><span>Total</span><span style={css(DATA)}>{$(inv.totals.total)}</span></div>
          {inv.paid_cents ? <div style={css('display:flex;justify-content:space-between;font-size:12.5px;color:' + GRN + ';padding:6px 0 0')}><span>Paid{inv.paid_method ? ' · ' + inv.paid_method : ''}</span><span style={css(DATA)}>{$(inv.paid_cents)}</span></div> : null}
          {!paid && inv.paid_cents ? <div style={css('display:flex;justify-content:space-between;font-size:14px;font-weight:600;padding:4px 0 0')}><span>Due</span><span style={css(DATA)}>{$(due)}</span></div> : null}
        </div>
      </div>
      {err ? <div style={css('font-size:12.5px;color:#ff6b64;margin-top:10px')}>{err}</div> : null}
      {!paid && (inv.status === 'invoiced' || v.status === 'done') ? (inv.card && inv.pay_token ? <div onClick={pay} style={css(BTN() + ';margin-top:12px;' + (busy ? 'opacity:.6' : ''))}>{busy ? 'One moment…' : 'Pay ' + $(due) + ' by card'}</div> : <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:10px;text-align:center')}>Pay at the counter when you pick up — card, cash or check.</div>) : null}
      {!paid && inv.status === 'open' && v.status !== 'done' ? <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:8px;text-align:center')}>Updates as approved work is done. Nothing is charged until the visit is finished.</div> : null}
    </div>
  );
}

function Loaner({ v }) {
  const r = v.rental;
  return (
    <a href={'/rental/' + r.token} style={css(CARD + ';margin-top:12px;display:flex;align-items:center;gap:14px;text-decoration:none;color:#fff')}>
      <div style={css('flex:1')}><div style={css('font-size:15px;font-weight:600')}>Loaner · {r.number}</div><div style={css('font-size:12.5px;color:rgba(235,235,245,.55);margin-top:3px')}>{{ sent: 'Agreement ready to sign', signed: 'Signed · keys at the desk', out: 'Keys in hand · agreement and photos' }[r.status] || r.status}</div></div>
      <svg viewBox="0 0 24 24" style={css('width:18px;height:18px;color:rgba(235,235,245,.4)')}><path d="M9 6l6 6-6 6" style={css('fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round')} /></svg>
    </a>
  );
}

function Pickup({ v, act, maps }) {
  return (
    <div style={css(CARD + ';margin-top:22px')}>
      <div style={css('font-size:16px;font-weight:600')}>{v.pickup === 'here' ? 'Welcome — come to the counter.' : v.pickup === 'on_way' ? 'See you soon.' : 'Ready when you are.'}</div>
      <div style={css('font-size:12.5px;color:rgba(235,235,245,.55);margin-top:4px;line-height:1.5')}>{v.bay ? 'Bay 0' + v.bay + ' · ' : ''}{v.shop.hours || ''}</div>
      <div style={css('display:flex;gap:8px;margin-top:12px')}>
        {v.pickup !== 'on_way' && v.pickup !== 'here' ? <div onClick={() => act('pickup', { state: 'on_way' })} style={css(BTN() + ';flex:1')}>I'm on my way</div> : null}
        {v.pickup !== 'here' ? <div onClick={() => act('pickup', { state: 'here' })} style={css((v.pickup === 'on_way' ? BTN() : GHOST) + ';flex:1')}>I'm here</div> : null}
        <a href={maps} target="_blank" rel="noreferrer" style={css(GHOST + ';flex:1;text-decoration:none')}>Directions</a>
      </div>
    </div>
  );
}

function Rate({ v, act }) {
  const [stars, setStars] = React.useState(v.rating || 0);
  const [tags, setTags] = React.useState([]);
  const [note, setNote] = React.useState('');
  const [sent, setSent] = React.useState(!!v.rating);
  const TAGS = ['Clear estimate', 'Fair price', 'On time', 'Friendly', 'Clean car', 'Would come back'];
  if (sent) return (
    <div style={css(CARD + ';margin-top:12px;text-align:center')}>
      <div style={css('font-size:15px;font-weight:600')}>Thanks for the {stars || v.rating}-star rating.</div>
      {(stars || v.rating) >= 4 && v.shop.review_url ? <a href={v.shop.review_url} target="_blank" rel="noreferrer" style={css(BTN() + ';display:block;margin-top:12px;text-decoration:none')}>Leave a Google review</a> : <div style={css('font-size:12.5px;color:rgba(235,235,245,.55);margin-top:4px')}>The shop reads every one.</div>}
    </div>
  );
  return (
    <div style={css(CARD + ';margin-top:12px')}>
      <div style={css('font-size:16px;font-weight:600')}>How was the visit?</div>
      <div style={css('display:flex;gap:6px;margin-top:10px')}>{[1, 2, 3, 4, 5].map((n) => <div key={n} onClick={() => setStars(n)} style={css('flex:1;text-align:center;font-size:26px;cursor:pointer;color:' + (n <= stars ? YEL : 'rgba(235,235,245,.2)'))}>★</div>)}</div>
      {stars ? <>
        <div style={css('display:flex;gap:6px;flex-wrap:wrap;margin-top:10px')}>{TAGS.map((t) => <div key={t} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : tags.concat(t))} style={css(chip(tags.includes(t)) + ';font-size:12px;padding:7px 10px')}>{t}</div>)}</div>
        <input value={note} placeholder="Anything else?" onChange={(e) => setNote(e.target.value)} style={css(INPUT + ';margin-top:10px;font-size:14px')} />
        <div onClick={async () => { if (await act('rate', { stars, tags, note })) setSent(true); }} style={css(BTN() + ';margin-top:10px')}>Send</div>
      </> : null}
    </div>
  );
}

function Messages({ v, act }) {
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const send = async () => { const t = text.trim(); if (!t || busy) return; setBusy(true); if (await act('message', { text: t })) setText(''); setBusy(false); };
  return (
    <div style={css('margin-top:22px')}>
      <div style={css('font-size:18px;font-weight:600')}>Messages</div>
      <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px')}>Reaches the desk right away. Replies come back here{v.in_app ? ' and in the app' : ' and by text'}.</div>
      <div style={css(CARD + ';margin-top:10px;display:flex;flex-direction:column;gap:8px;padding:14px')}>
        {v.messages.slice(-12).map((m) => <div key={m.id} style={css('display:flex;flex-direction:column;align-items:' + (m.sender === 'customer' ? 'flex-end' : 'flex-start') + ';max-width:80%;align-self:' + (m.sender === 'customer' ? 'flex-end' : 'flex-start'))}><div style={css('padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.45;' + (m.sender === 'customer' ? 'background:#fff;color:#000;border-bottom-right-radius:4px' : 'background:rgba(255,255,255,.08);color:#fff;border-bottom-left-radius:4px'))}>{m.text}</div><div style={css('font-size:10px;color:rgba(235,235,245,.3);margin:3px 8px 0')}>{fmtT(m.created_at)}</div></div>)}
        {!v.messages.length ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);text-align:center;padding:6px 0')}>No messages yet.</div> : null}
        <div style={css('display:flex;gap:8px;margin-top:4px')}>
          <input value={text} placeholder="Message the shop" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} style={css(INPUT + ';font-size:14px;padding:11px 12px')} />
          <div onClick={send} style={css(BTN(!!text.trim()) + ';padding:11px 16px;' + (busy ? 'opacity:.6' : ''))}>Send</div>
        </div>
      </div>
    </div>
  );
}

function History({ v }) {
  return (
    <div style={css('margin-top:22px')}>
      <div style={css('font-size:18px;font-weight:600')}>Earlier visits</div>
      <div style={css(CARD + ';margin-top:10px;padding:4px 18px')}>
        {v.history.map((h) => <a key={h.id} href={'/visit/' + h.token} style={css('display:flex;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13.5px;text-decoration:none;color:#fff')}><div><div style={css('font-weight:500')}>{h.job || 'Service'}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{new Date(h.starts_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div></div><div style={css(DATA + ';color:rgba(235,235,245,.7)')}>{h.total ? $(h.total) : ''}</div></a>)}
      </div>
    </div>
  );
}
