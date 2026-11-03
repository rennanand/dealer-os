import React from 'react';
import { useParams } from 'react-router-dom';
import { css } from '../runtime/tpl.js';
import { supabase, SUPABASE_URL } from '../state/supabase.js';

// The estimate link: /estimate/<token>. No account. Each job has a plain description, its lines and a
// price; the customer checks what they want done and sends the plan back. Mirrors the in-app flow.

const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const PAGE = 'min-height:100%;background:#000;color:#fff;' + FONT;
const WRAP = 'max-width:430px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 22px calc(env(safe-area-inset-bottom,0px) + 110px)';
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px';
const DATA = 'font-family:var(--data-font,inherit)';
const $ = (c) => '$' + ((c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TIER = { now: ['Recommended now', '#e0312b'], soon: ['Recommended soon', '#ffd60a'], monitor: ['Monitor', '#30d158'] };
const DEMO = { customer: 'Sarah', vehicle: '2021 Toyota 4Runner', job: 'Tire replacement', shop: { name: 'RyGuys Tire & Auto Sales', phone: '4358354869', estimate_note: 'Prices include labor and parts. Tax and shop supplies are added on the invoice.' }, photos: [],
  findings: [{ id: 'f1', tier: 'now', name: 'Front brake pads & rotors', plain: 'Pads are worn to 2 mm. Rotors are grooved and should go with them.', meas: '2 mm', meas_label: 'Pad', urgency: 'Recommended before you drive far.', price_cents: 47485, status: 'pending', lines: [{ kind: 'labor', description: 'Front brake pads & rotors', qty: 1.8, unit_cents: 12500 }, { kind: 'part', description: 'Front brake pads · ceramic', qty: 1, unit_cents: 8995 }, { kind: 'part', description: 'Front rotors', qty: 2, unit_cents: 7995 }] }, { id: 'f2', tier: 'monitor', name: 'Cabin air filter', plain: 'Getting dirty. Fine for a few more months.', price_cents: 6500, status: 'pending', lines: [] }] };

export function EstimateRoute() {
  const { token } = useParams();
  const [st, set] = React.useState({ loading: true, e: null, err: '' });
  const [plan, setPlan] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const load = React.useCallback(async () => {
    if (!supabase) return set({ loading: false, e: DEMO, err: '' });
    const { data, error } = await supabase.rpc('estimate_by_token', { p_token: token });
    if (error || !data) return set({ loading: false, e: null, err: 'This estimate link is not valid.' });
    set({ loading: false, e: data, err: '' });
  }, [token]);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { if (st.e) setPlan((p) => { const n = { ...p }; for (const f of st.e.findings) if (n[f.id] === undefined) n[f.id] = f.tier !== 'monitor'; return n; }); }, [st.e]);
  const e = st.e;
  if (st.loading) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center;color:rgba(235,235,245,.45);font-size:13px')}>Loading…</div></div>;
  if (!e) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center')}><div style={css('font-size:20px;font-weight:600')}>{st.err}</div><div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>Ask the shop to send it again.</div></div></div>;
  const pending = e.findings.filter((f) => f.status === 'pending'), decided = e.findings.filter((f) => f.status !== 'pending');
  const on = (f) => !!plan[f.id];
  const total = pending.filter(on).reduce((t, f) => t + f.price_cents, 0);
  const send = async () => {
    if (busy) return; setBusy(true);
    const approve = pending.filter(on).map((f) => f.id), decline = pending.filter((f) => !on(f)).map((f) => f.id);
    if (supabase) { const { error } = await supabase.rpc('decide_by_token', { p_token: token, p_approve: approve, p_decline: decline }); if (error) { setBusy(false); return set({ ...st, err: error.message }); } await load(); }
    else set({ ...st, e: { ...e, findings: e.findings.map((f) => (approve.includes(f.id) ? { ...f, status: 'approved' } : decline.includes(f.id) ? { ...f, status: 'declined' } : f)) } });
    setBusy(false); setDone(true);
  };
  const photo = (p) => (p.path ? SUPABASE_URL + '/storage/v1/object/public/visit-photos/' + p.path : '');
  const Job = ({ f, pick }) => {
    const [open, setOpen] = React.useState(false);
    const t = TIER[f.tier] || TIER.monitor; const sel = pick ? on(f) : f.status === 'approved' || f.status === 'done';
    const ph = (e.photos || []).filter((p) => p.finding_id === f.id);
    return (
      <div style={css(CARD + ';margin-top:10px;' + (pick ? 'cursor:pointer;' : 'opacity:.8;') + (sel && pick ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)' : ''))} onClick={pick ? () => setPlan({ ...plan, [f.id]: !on(f) }) : null}>
        <div style={css('display:flex;gap:12px;align-items:flex-start')}>
          {pick ? <div style={css('width:22px;height:22px;border-radius:11px;flex:0 0 auto;margin-top:1px;display:flex;align-items:center;justify-content:center;' + (sel ? 'background:#fff' : 'box-shadow:inset 0 0 0 1.5px rgba(235,235,245,.3)'))}>{sel ? <svg viewBox="0 0 24 24" style={css('width:14px;height:14px')}><path d="M5 12.5l4.5 4.5L19 7" style={css('fill:none;stroke:#000;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')} /></svg> : null}</div> : null}
          <div style={css('flex:1;min-width:0')}>
            <div style={css('display:flex;justify-content:space-between;gap:10px;align-items:baseline')}><div style={css('font-size:15px;font-weight:600')}>{f.name}</div><div style={css(DATA + ';font-size:15px;font-weight:600;white-space:nowrap')}>{f.price_cents ? $(f.price_cents) : 'No charge'}</div></div>
            <div style={css('font-size:11.5px;margin-top:3px;color:' + t[1])}>{t[0]}{f.meas ? ' · ' + [f.meas_label, f.meas].filter(Boolean).join(' ') : ''}{!pick ? ' · ' + (f.status === 'declined' ? 'Declined' : 'Approved') : ''}</div>
            {f.plain ? <div style={css('font-size:13px;color:rgba(235,235,245,.7);margin-top:8px;line-height:1.5')}>{f.plain}</div> : null}
            {f.urgency ? <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:4px')}>{f.urgency}</div> : null}
            {ph.length ? <div style={css('display:flex;gap:6px;margin-top:10px')}>{ph.map((p, i) => <a key={i} href={photo(p)} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()} style={css('width:70px;height:52px;border-radius:8px;background:#222 url(' + photo(p) + ') center/cover;display:block')} />)}</div> : null}
            {(f.lines || []).length ? (
              <div onClick={(ev) => { ev.stopPropagation(); setOpen(!open); }} style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:10px;cursor:pointer')}>{open ? 'Hide the breakdown' : 'What is included'}</div>
            ) : null}
            {open ? <div style={css('margin-top:6px')}>{f.lines.map((l, i) => <div key={i} style={css('display:flex;justify-content:space-between;gap:10px;font-size:12px;color:rgba(235,235,245,.55);padding:3px 0')}><div>{l.description}{Number(l.qty) !== 1 ? <span style={css('margin-left:6px;color:rgba(235,235,245,.35)')}>{Number(l.qty)}{l.kind === 'labor' ? ' h' : ' ×'}</span> : null}</div><div style={css(DATA)}>{$(Math.round(Number(l.qty) * l.unit_cents))}</div></div>)}</div> : null}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div style={css(PAGE)}>
      <div style={css(WRAP)}>
        <div style={css(LBL)}>{e.shop.name}</div>
        <div style={css('font-size:26px;font-weight:600;letter-spacing:-.6px;margin-top:6px;line-height:1.15')}>{done ? 'Thank you, ' + e.customer + '.' : pending.length ? 'Your estimate, ' + e.customer + '.' : 'Your service plan, ' + e.customer + '.'}</div>
        <div style={css('font-size:13px;color:rgba(235,235,245,.55);margin-top:6px;line-height:1.5')}>{e.vehicle}{e.job ? ' · ' + e.job : ''}. {done ? 'The shop has your answer and is getting started.' : pending.length ? 'Check what you would like done. Nothing is charged until the work is finished.' : 'Everything has been decided.'}</div>
        {st.err ? <div style={css('margin-top:12px;font-size:12.5px;color:#ff6b64')}>{st.err}</div> : null}
        {pending.length ? <div style={css(LBL + ';margin-top:24px')}>Recommended · {pending.length}</div> : null}
        {pending.map((f) => <Job key={f.id} f={f} pick />)}
        {decided.length ? <div style={css(LBL + ';margin-top:24px')}>Decided</div> : null}
        {decided.map((f) => <Job key={f.id} f={f} />)}
        <div style={css('font-size:11.5px;color:rgba(235,235,245,.35);margin-top:18px;line-height:1.5')}>{e.shop.estimate_note}{e.shop.phone ? ' Questions? Call ' + e.shop.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') + '.' : ''}</div>
      </div>
      {pending.length && !done ? (
        <div style={css('position:fixed;left:0;right:0;bottom:0;padding:12px 22px calc(env(safe-area-inset-bottom,0px) + 16px);background:linear-gradient(transparent,#000 30%)')}>
          <div style={css('max-width:430px;margin:0 auto')}>
            <div onClick={send} style={css('text-align:center;padding:15px 0;border-radius:12px;font-size:14px;font-weight:600;background:#fff;color:#000;cursor:pointer;' + (busy ? 'opacity:.6' : ''))}>{busy ? 'Sending…' : total ? 'Approve ' + $(total) : pending.some(on) ? 'Approve' : 'Decline all for now'}</div>
            <div style={css('text-align:center;font-size:11.5px;color:rgba(235,235,245,.4);margin-top:8px')}>{pending.filter(on).length} of {pending.length} selected · unchecked items are declined</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
