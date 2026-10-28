import React from 'react';
import { useParams } from 'react-router-dom';
import { css } from '../runtime/tpl.js';
import { supabase } from '../state/supabase.js';
import { SHOP, fmt0, vehicleName, dayLabel, daysBetween, clausesFor, previewMeta } from '../state/agreement.js';

// The customer's private link: /rental/<token>. No account. Review the agreement, sign it,
// then follow the rental: handoff details, how to drive the car, how to return it.

const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const PAGE = 'min-height:100%;background:#000;color:#fff;' + FONT;
const WRAP = 'max-width:430px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 22px calc(env(safe-area-inset-bottom,0px) + 40px)';
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px';
const ROW = 'display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px';
const CTA = (ok) => 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (ok ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;');

const DEMO = { number: 'LN-3107', status: 'sent', customer_name: 'Rennan Anderson', start_date: '2026-11-02', end_date: '2026-11-03', rate_cents: 6500, shop_pays: false, clauses: {}, mile_cap: '100 mi/day', charge_min: '50%', deductible: '$1,000', work_ref: 'Front brake service · Bay 01', vehicle: { year: 2027, make: 'Tesla', model: 'Model 3', color: 'Quicksilver', paint: '#b9bdc3', plate: 'UT 1190', vin_last4: '1190', powertrain: 'ev', odometer: 22870, level: 88 } };

function useRental(token) {
  const [st, set] = React.useState({ loading: true, r: null, err: '' });
  const load = React.useCallback(async () => {
    if (!supabase) return set({ loading: false, r: DEMO, err: '' });
    const { data, error } = await supabase.rpc('rental_by_token', { p_token: token });
    if (error || !data) return set({ loading: false, r: null, err: 'This link is not valid.' });
    set({ loading: false, r: data, err: '' });
  }, [token]);
  React.useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
  return { ...st, setR: (r) => set({ loading: false, r, err: '' }) };
}

function SignaturePad({ strokes, setStrokes }) {
  const ref = React.useRef(null), drawing = React.useRef(false);
  const pt = (e) => { const el = ref.current, b = el.getBoundingClientRect(); return [Math.round(((e.clientX - b.left) / b.width) * 3000) / 10, Math.round(((e.clientY - b.top) / b.height) * 1200) / 10]; };
  const down = (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} drawing.current = true; setStrokes(strokes.concat([[pt(e)]])); };
  const move = (e) => { if (!drawing.current) return; const p = pt(e); setStrokes((s) => { const k = s[s.length - 1], q = k[k.length - 1]; if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 1.5) return s; return s.slice(0, -1).concat([k.concat([p])]); }); };
  const up = () => { drawing.current = false; };
  const path = toPath(strokes);
  return (
    <div ref={ref} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={css('position:relative;height:150px;border-radius:14px;background:#141416;border:1px solid rgba(235,235,245,.12);touch-action:none;overflow:hidden')}>
      {!strokes.length ? <div style={css('position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(235,235,245,.3);pointer-events:none')}>Sign with your finger</div> : null}
      <div style={css('position:absolute;left:18px;right:18px;bottom:34px;border-bottom:1px solid rgba(235,235,245,.18);pointer-events:none')} />
      <svg viewBox="0 0 300 120" preserveAspectRatio="none" style={css('position:absolute;inset:0;width:100%;height:100%;pointer-events:none')}>
        <path d={path} style={css('fill:none;stroke:#fff;stroke-width:2.2px;stroke-linecap:round;stroke-linejoin:round')} />
      </svg>
    </div>
  );
}
export const toPath = (strokes) => strokes.map((k) => (k.length === 1 ? 'M' + k[0][0] + ' ' + k[0][1] + ' l.6 0' : k.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' '))).join(' ');

export function RentalRoute() {
  const { token } = useParams();
  const { loading, r, err, setR } = useRental(token);
  const [strokes, setStrokes] = React.useState([]);
  const [agree, setAgree] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [sErr, setSErr] = React.useState('');
  if (loading) return <div style={css(PAGE)} />;
  if (!r) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center')}><div style={css('font-size:20px;font-weight:600')}>{err}</div><div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>Ask the front desk to send it again.</div></div></div>;

  const v = r.vehicle, ev = v && v.powertrain === 'ev', first = (r.customer_name || '').split(' ')[0];
  const days = daysBetween(r.start_date, r.end_date), total = r.shop_pays ? 0 : (days * r.rate_cents) / 100;
  const canSign = ['draft', 'sent'].includes(r.status);
  const sigOk = strokes.reduce((n, k) => n + k.length, 0) >= 12;
  const sign = async () => {
    if (!(agree && sigOk) || busy) return;
    setBusy(true); setSErr('');
    if (!supabase) { setR({ ...r, status: 'signed', signed_at: new Date().toISOString(), signed_name: r.customer_name }); setBusy(false); return; }
    const { data, error } = await supabase.rpc('sign_rental', { p_token: token, p_name: r.customer_name, p_signature: toPath(strokes) });
    setBusy(false);
    if (error) return setSErr(error.message);
    setR(data);
  };
  const Header = () => (
    <div style={css('display:flex;align-items:center;justify-content:space-between')}>
      <div style={css('background:#fff;border-radius:7px;padding:6px 9px')}><img src="/uploads/ryguys-logo-trim.png" alt="RyGuys" style={css('height:14px;width:auto;display:block')} /></div>
      <div style={css(LBL)}>{r.number}</div>
    </div>
  );
  const Vehicle = () => v ? (
    <div style={css(CARD + ';margin-top:18px;display:flex;align-items:center;gap:14px')}>
      <div style={css('width:44px;height:44px;border-radius:22px;flex:0 0 auto;background:' + v.paint + ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)')} />
      <div style={css('flex:1;min-width:0')}>
        <div style={css('font-size:16px;font-weight:500')}>{vehicleName(v)}</div>
        <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{v.color} · {v.plate || 'VIN ···· ' + v.vin_last4}</div>
      </div>
    </div>
  ) : null;

  // ---- after signing: the rental itself
  if (!canSign) {
    const steps = r.status === 'returned' ? 3 : r.status === 'out' ? 2 : 1;
    const title = r.status === 'returned' ? 'Returned. Thank you, ' + first + '.' : r.status === 'out' ? 'Your loaner is out with you.' : r.status === 'cancelled' ? 'This rental was cancelled.' : 'Signed. The keys will be waiting.';
    const sub = r.status === 'returned' ? (r.in_odometer - r.out_odometer) + ' miles · returned at ' + r.in_level + '%' + (r.extra_cents ? ' · ' + fmt0(r.extra_cents / 100) + ' in extras, settled at the counter' : r.shop_pays ? ' · no charge' : ' · ' + fmt0(total) + ' settled at the counter') : r.status === 'out' ? 'Due back ' + dayLabel(r.end_date) + ', or when your car is ready.' : 'Show this screen at the front desk when you arrive.';
    return (
      <div style={css(PAGE)}><div style={css(WRAP)}>
        <Header />
        <div style={css('font-size:28px;font-weight:600;letter-spacing:-.9px;line-height:1.1;margin-top:26px;text-wrap:pretty')}>{title}</div>
        <div style={css('font-size:14px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:10px')}>{sub}</div>
        <Vehicle />
        {r.status !== 'cancelled' ? (
          <div style={css(CARD + ';margin-top:12px')}>
            {[['Signed', r.signed_at], ['Handoff', r.out_at], ['Return', r.returned_at]].map(([k, at], i) => (
              <div key={k} style={css('display:flex;align-items:center;gap:12px;padding:9px 0;' + (i < 2 ? 'border-bottom:1px solid rgba(235,235,245,.07);' : ''))}>
                <div style={css('width:8px;height:8px;border-radius:4px;background:' + (i < steps ? '#30d158' : 'rgba(235,235,245,.18)'))} />
                <div style={css('flex:1;font-size:13.5px;font-weight:500;color:' + (i < steps ? '#fff' : 'rgba(235,235,245,.4)'))}>{k}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{at ? new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : i === 1 ? dayLabel(r.start_date) : dayLabel(r.end_date)}</div>
              </div>
            ))}
          </div>
        ) : null}
        {r.status === 'out' ? (
          <div style={css(CARD + ';margin-top:12px')}>
            <div style={css(ROW)}><span style={css('color:rgba(235,235,245,.5)')}>Mileage at handoff</span><span>{r.out_odometer.toLocaleString('en-US')} mi</span></div>
            <div style={css(ROW)}><span style={css('color:rgba(235,235,245,.5)')}>{ev ? 'Charge' : 'Fuel'} at handoff</span><span>{r.out_level}%</span></div>
            <div style={css(ROW + ';border-bottom:0')}><span style={css('color:rgba(235,235,245,.5)')}>Bring it back with</span><span>{r.charge_min === 'No minimum' ? 'any level' : r.charge_min + ' or more'}</span></div>
          </div>
        ) : null}
        {r.status === 'signed' || r.status === 'out' ? (
          <>
            <div style={css(LBL + ';margin:26px 0 10px')}>Good to know</div>
            {(ev ? GUIDE_EV : GUIDE_GAS).map((g) => (
              <div key={g.t} style={css(CARD + ';margin-bottom:10px')}>
                <div style={css('font-size:14px;font-weight:500')}>{g.t}</div>
                <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:4px')}>{g.d}</div>
              </div>
            ))}
            <div style={css(CARD + ';margin-bottom:10px')}>
              <div style={css('font-size:14px;font-weight:500')}>Returning</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:4px')}>Pull into the lot at {SHOP.address.split(',')[0]} and hand the keys to the front desk. We record mileage and {ev ? 'charge' : 'fuel'} with you there.</div>
            </div>
          </>
        ) : null}
        <div style={css('font-size:12px;color:rgba(235,235,245,.35);margin-top:26px;text-align:center')}>{SHOP.name} · Questions? Call the shop.</div>
      </div></div>
    );
  }

  // ---- review and sign
  return (
    <div style={css(PAGE)}><div style={css(WRAP)}>
      <Header />
      <div style={css('font-size:28px;font-weight:600;letter-spacing:-.9px;line-height:1.1;margin-top:26px;text-wrap:pretty')}>{first ? first + ', your loaner is ready to sign.' : 'Your loaner is ready to sign.'}</div>
      <div style={css('font-size:14px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:10px')}>Read it once, sign at the bottom, and the car is held for you.</div>
      <Vehicle />
      <div style={css(CARD + ';margin-top:12px')}>
        <div style={css(ROW)}><span style={css('color:rgba(235,235,245,.5)')}>Pick up</span><span>{dayLabel(r.start_date)}</span></div>
        <div style={css(ROW)}><span style={css('color:rgba(235,235,245,.5)')}>Return</span><span>{dayLabel(r.end_date)}{r.work_ref ? ' · or when your car is ready' : ''}</span></div>
        <div style={css(ROW)}><span style={css('color:rgba(235,235,245,.5)')}>Rate</span><span>{r.shop_pays ? 'Covered by RyGuys' : fmt0(r.rate_cents / 100) + ' / day'}</span></div>
        <div style={css(ROW + ';border-bottom:0')}><span style={css('color:rgba(235,235,245,.5)')}>Your total</span><span style={css('font-weight:500;' + (r.shop_pays ? 'color:#30d158' : ''))}>{r.shop_pays ? '$0' : fmt0(total)}</span></div>
      </div>
      <div style={css(LBL + ';margin:26px 0 10px')}>Loaner vehicle agreement</div>
      <div style={css('font-size:12.5px;line-height:1.6;color:rgba(235,235,245,.55)')}>{previewMeta(r)}</div>
      {clausesFor(r).map((c) => (
        <div key={c.id} style={css('margin-top:16px')}>
          <div style={css('font-size:13.5px;font-weight:500')}>{c.title}</div>
          <div style={css('font-size:12.5px;line-height:1.6;color:rgba(235,235,245,.6);margin-top:3px')}>{c.text}</div>
        </div>
      ))}
      <div style={css(LBL + ';margin:28px 0 10px')}>Signature</div>
      <SignaturePad strokes={strokes} setStrokes={setStrokes} />
      <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:8px')}>
        <div style={css('font-size:12px;color:rgba(235,235,245,.4)')}>{r.customer_name}</div>
        <div onClick={() => setStrokes([])} style={css('font-size:12px;color:rgba(235,235,245,.5);cursor:pointer')}>Clear</div>
      </div>
      <div onClick={() => setAgree(!agree)} style={css('display:flex;align-items:flex-start;gap:10px;margin-top:18px;cursor:pointer')}>
        <div style={css('width:20px;height:20px;border-radius:6px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;margin-top:1px;' + (agree ? 'background:#fff;color:#000;' : 'border:1px solid rgba(235,235,245,.3);color:transparent;'))}>
          <svg viewBox="0 0 24 24" style={css('width:12px;height:12px')}><path d="M5 12.5l4.5 4.5L19 7" style={css('fill:none;stroke:currentColor;stroke-width:2.8px;stroke-linecap:round;stroke-linejoin:round')} /></svg>
        </div>
        <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.7)')}>I have read the agreement, I hold a valid driver's license, and I am at least 21.</div>
      </div>
      {sErr ? <div style={css('font-size:12.5px;color:#e0312b;margin-top:12px')}>{sErr}</div> : null}
      <div onClick={sign} style={css('margin-top:18px;' + CTA(agree && sigOk && !busy))}>{busy ? 'Signing…' : 'Sign and hold the car'}</div>
      <div style={css('font-size:12px;color:rgba(235,235,245,.35);margin-top:14px;text-align:center;line-height:1.5')}>A copy stays on this link. {SHOP.name}.</div>
    </div></div>
  );
}

const GUIDE_EV = [
  { t: 'Your phone is not the key here.', d: 'Use the key card: tap it on the door pillar to unlock, then set it on the console to drive. Sit down, press the brake, and the car is on.' },
  { t: 'Lift off, and it slows.', d: 'Easing off the accelerator slows the car to a stop. It feels strong for the first mile; leave extra room until it clicks.' },
  { t: 'Charging is on us.', d: 'Supercharging during the rental is billed to RyGuys. The port is at the rear driver side; press the small door to open it.' },
];
const GUIDE_GAS = [
  { t: 'Keys and start.', d: 'Press the brake and the start button. Lights and wipers are on auto.' },
  { t: 'Fuel.', d: 'Regular unleaded. Bring it back at the level in your agreement and there is nothing extra to pay.' },
];
