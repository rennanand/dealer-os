import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '../runtime/tpl.js';
import { supabase } from '../state/supabase.js';
import { signOut } from '../state/auth.js';
import { dayLabel } from '../state/agreement.js';

// A customer's own loaners in the app. Matched to the mobile number the shop has on the
// rental, so the first open asks for it once.

const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const PAGE = 'position:fixed;inset:0;background:#000;color:#fff;overflow-y:auto;' + FONT;
const WRAP = 'max-width:430px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 22px) 22px calc(env(safe-area-inset-bottom,0px) + 30px)';
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px';
const INPUT = 'width:100%;background:#141416;border:0;outline:0;border-radius:12px;padding:16px 14px;font-size:18px;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);font-family:var(--data-font,inherit)';
const CTA = (ok) => 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;' + (ok ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);');
const STATUS = { draft: ['Being prepared', 'rgba(235,235,245,.5)'], sent: ['Ready to sign', '#ffd60a'], signed: ['Signed · keys at the desk', '#30d158'], out: ['Out with you', '#e0312b'], returned: ['Returned', 'rgba(235,235,245,.5)'] };
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const VSTATUS = { booked: ['Booked', '#fff'], arrived: ['Checked in', '#ffd60a'], in_progress: ['In service', '#ffd60a'], done: ['Ready for pickup', '#30d158'], cancelled: ['Cancelled', 'rgba(235,235,245,.5)'], no_show: ['Missed', 'rgba(235,235,245,.5)'] };
const STEPS = ['Booked', 'Checked in', 'In service', 'Complete'];
const STEP_OF = { booked: 0, arrived: 1, in_progress: 2, done: 3 };
const whenLabel = (ts) => { const d = new Date(ts), t = new Date(), same = (a, b) => a.toDateString() === b.toDateString(); const tm = new Date(t.getTime() + 864e5); const day = same(d, t) ? 'Today' : same(d, tm) ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); return day + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); };
const fmtPhone = (d) => (d.length <= 3 ? d : d.length <= 6 ? '(' + d.slice(0, 3) + ') ' + d.slice(3) : '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6, 10));

// Wide layouts (iPhone Duo unfolded, iPad, landscape) get two columns; the width is read from the window
// at layout time and again whenever it changes, never from a fixed device size.
export const useWide = () => { const [w, setW] = React.useState(() => window.innerWidth >= 700); React.useEffect(() => { const on = () => setW(window.innerWidth >= 700); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []); return w; };

export function MyLoaners({ auth }) {
  const nav = useNavigate();
  const wide = useWide();
  const [profile, setProfile] = React.useState(undefined);
  const [rentals, setRentals] = React.useState([]);
  const [visits, setVisits] = React.useState([]);
  const [book, setBook] = React.useState(null);
  const [open, setOpen] = React.useState(null);
  const [phone, setPhone] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(async () => {
    if (!supabase) { setProfile({ phone: '4355550142' }); setRentals([{ number: 'LN-3107', status: 'sent', token: 'demo', start_date: '2026-11-02', end_date: '2026-11-03', vehicle: '2027 Tesla Model 3', color: 'Quicksilver', paint: '#b9bdc3' }]); setVisits([{ id: 'a1', starts_at: new Date(Date.now() + 864e5).toISOString(), job: 'Oil change', visit: 'wait', status: 'booked', vehicle: '2021 Toyota 4Runner' }]); return; }
    const { data } = await supabase.from('customer_profiles').select('*').eq('user_id', auth.session.user.id).maybeSingle();
    setProfile(data || null);
    if (data && data.phone) { const [r, a] = await Promise.all([supabase.rpc('my_rentals'), supabase.rpc('my_appointments')]); setRentals(r.data || []); setVisits(a.data || []); }
  }, [auth.session]);
  React.useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  const save = async () => {
    if (phone.length !== 10 || busy) return;
    setBusy(true);
    if (supabase) await supabase.from('customer_profiles').upsert({ user_id: auth.session.user.id, phone, name: auth.member?.name || '' });
    setBusy(false); load();
  };
  const first = (auth.member?.name || '').split(' ')[0];
  if (profile === undefined) return <div style={css(PAGE)} />;
  if (!profile || !profile.phone) {
    return (
      <div style={css(PAGE)}><div style={css(WRAP)}>
        <div style={css('flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:8px')}>
          <img src="/uploads/revyn.png" alt="Revyn" style={css('height:12px;width:auto;display:block')} />
          <div style={css('font-size:34px;font-weight:600;letter-spacing:-1.2px;line-height:1.05;margin-top:22px')}>Your mobile number.</div>
          <div style={css('font-size:14px;line-height:1.55;color:rgba(235,235,245,.55);margin-top:12px')}>The one the shop has for you. Your loaner agreements show up here.</div>
        </div>
        <div style={css('padding-top:18px')}>
          <input inputMode="tel" autoComplete="tel" placeholder="(435) 555-0100" value={fmtPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} style={css(INPUT)} autoFocus />
          <div onClick={save} style={css('margin-top:14px;' + CTA(phone.length === 10 && !busy))}>Continue</div>
        </div>
      </div></div>
    );
  }
  if (book) return <BookVisit auth={auth} draft={book} setDraft={setBook} onDone={() => { setBook(null); load(); }} />;
  const openVisit = open && visits.find((v) => v.id === open);
  if (openVisit) return <VisitDetail v={openVisit} back={() => setOpen(null)} cancel={async () => { if (supabase) await supabase.rpc('cancel_my_appointment', { p_id: openVisit.id }); setOpen(null); load(); }} />;
  const upcoming = visits.filter((v) => v.status !== 'cancelled' && v.status !== 'no_show' && (v.status !== 'done' || Date.now() - new Date(v.starts_at) < 864e5));
  return (
    <div style={css(PAGE)}><div style={css(WRAP + (wide ? ';max-width:900px' : ''))}>
      <div style={css('display:flex;justify-content:space-between;align-items:center')}>
        <img src="/uploads/revyn.png" alt="Revyn" style={css('height:11px;width:auto;display:block')} />
        <div onClick={signOut} style={css('font-size:12px;color:rgba(235,235,245,.4);cursor:pointer')}>Sign out</div>
      </div>
      <div style={css('font-size:28px;font-weight:600;letter-spacing:-.9px;line-height:1.1;margin-top:26px')}>{first ? 'Hi ' + first + '.' : 'Your car.'}</div>
      <div style={css('font-size:14px;color:rgba(235,235,245,.55);margin-top:8px')}>{upcoming.length ? 'Your visits update as the shop works.' : 'Book a visit and follow it here, from check-in to pickup.'}</div>
      <div onClick={() => setBook({ step: 0, job: '', vehicle: '', plate: '', visit: 'dropoff', day: '', time: '', notes: '' })} style={css('margin-top:22px;' + CTA(true) + (wide ? ';max-width:300px' : ''))}>Book a visit</div>
      <div style={css(wide ? 'display:grid;grid-template-columns:1fr 1fr;gap:0 32px;align-items:start' : '')}>
      <div>
      {upcoming.length ? <div style={css(LBL + ';margin-top:28px')}>Visits</div> : null}
      <div style={css('display:flex;flex-direction:column;gap:10px;margin-top:12px')}>
        {upcoming.map((v) => {
          const st = VSTATUS[v.status] || ['', '#fff'];
          return (
            <div key={v.id} onClick={() => setOpen(v.id)} style={css(CARD + ';cursor:pointer')}>
              <div style={css('display:flex;justify-content:space-between;align-items:center;gap:12px')}>
                <div style={css('font-size:15px;font-weight:500')}>{v.job || 'Service'}</div>
                <div style={css('font-size:12px;font-weight:500;color:' + st[1])}>{st[0]}</div>
              </div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{whenLabel(v.starts_at)}{v.vehicle ? ' · ' + v.vehicle : ''}</div>
              <Track status={v.status} />
            </div>
          );
        })}
      </div>
      </div>
      <div>
      {rentals.length ? <div style={css(LBL + ';margin-top:28px')}>Loaners</div> : null}
      <div style={css('display:flex;flex-direction:column;gap:10px;margin-top:12px')}>
        {rentals.map((r) => {
          const st = STATUS[r.status] || ['', '#fff'];
          return (
            <div key={r.number} onClick={() => nav('/rental/' + r.token)} style={css(CARD + ';display:flex;align-items:center;gap:14px;cursor:pointer')}>
              <div style={css('width:40px;height:40px;border-radius:20px;flex:0 0 auto;background:' + (r.paint || '#b9bdc3') + ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)')} />
              <div style={css('flex:1;min-width:0')}>
                <div style={css('font-size:15px;font-weight:500')}>{r.vehicle || 'Loaner'}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{dayLabel(r.start_date)} → {dayLabel(r.end_date)} · {r.number}</div>
              </div>
              <div style={css('font-size:12px;font-weight:500;text-align:right;max-width:110px;line-height:1.3;color:' + st[1])}>{st[0]}</div>
            </div>
          );
        })}
      </div>
      </div>
      </div>
      <div style={css('font-size:12px;color:rgba(235,235,245,.35);margin-top:auto;padding-top:30px;text-align:center')}>Number on file: {fmtPhone(profile.phone)} · <span onClick={() => setProfile({ phone: '' })} style={css('cursor:pointer;color:rgba(235,235,245,.55)')}>change</span></div>
    </div></div>
  );
}

function Track({ status }) {
  const n = STEP_OF[status]; if (n === undefined) return null;
  return (
    <div style={css('display:flex;gap:4px;margin-top:12px')}>
      {STEPS.map((_, i) => <div key={i} style={css('flex:1;height:3px;border-radius:2px;background:' + (i <= n ? (n === 3 ? '#30d158' : '#fff') : 'rgba(235,235,245,.14)'))} />)}
    </div>
  );
}

const NOTE = { booked: 'We will text you when your car is checked in.', arrived: 'Your car is checked in. We will let you know when work begins.', in_progress: 'Your car is in the bay. We will text you the moment it is ready.', done: 'All done. Pick up any time during shop hours.', cancelled: 'This visit was cancelled.', no_show: 'We missed you. Book another time whenever you are ready.' };
function VisitDetail({ v, back, cancel }) {
  const st = VSTATUS[v.status] || ['', '#fff'], n = STEP_OF[v.status];
  return (
    <div style={css(PAGE)}><div style={css(WRAP)}>
      <div onClick={back} style={css('font-size:13px;color:rgba(235,235,245,.55);cursor:pointer')}>‹ Back</div>
      <div style={css('font-size:28px;font-weight:600;letter-spacing:-.9px;line-height:1.1;margin-top:26px')}>{v.job || 'Service'}</div>
      <div style={css('font-size:14px;color:rgba(235,235,245,.55);margin-top:8px')}>{whenLabel(v.starts_at)}{v.vehicle ? ' · ' + v.vehicle : ''}{v.visit === 'wait' ? ' · Waiting' : v.visit === 'loaner' ? ' · Loaner requested' : ' · Drop off'}</div>
      <div style={css(CARD + ';margin-top:22px')}>
        <div style={css('font-size:15px;font-weight:500;color:' + st[1])}>{st[0]}{v.bay ? ' · Bay ' + v.bay : ''}</div>
        <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:4px')}>{NOTE[v.status]}</div>
        {n !== undefined ? (
          <div style={css('margin-top:16px')}>
            {STEPS.map((label, i) => (
              <div key={i} style={css('display:flex;align-items:center;gap:12px;padding:8px 0;font-size:13px;color:' + (i <= n ? '#fff' : 'rgba(235,235,245,.35)'))}>
                <div style={css('width:8px;height:8px;border-radius:4px;background:' + (i < n ? '#30d158' : i === n ? (n === 3 ? '#30d158' : '#fff') : 'rgba(235,235,245,.14)'))} />{label}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div style={css('font-size:12px;color:rgba(235,235,245,.35);margin-top:14px;line-height:1.5')}>Status is updated by the shop as your car moves through the day. Nothing here is read from the vehicle.</div>
      {v.status === 'booked' ? <div onClick={cancel} style={css('margin-top:auto;text-align:center;padding:15px 0;font-size:13px;color:#ff6b64;cursor:pointer')}>Cancel this visit</div> : null}
    </div></div>
  );
}

const JOBS = ['Oil change', 'Tires', 'Brakes', 'Check engine light', 'Inspection', 'Something else'];
const TIMES = []; for (let h = 8; h <= 17; h++) for (const m of [0, 30]) if (!(h === 17 && m === 30)) TIMES.push((h < 10 ? '0' : '') + h + ':' + (m ? '30' : '00'));
const isoDay = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
const CHIP = (on) => 'padding:10px 14px;border-radius:999px;font-size:13px;font-weight:500;cursor:pointer;' + (on ? 'background:#fff;color:#000' : 'background:#141416;color:rgba(235,235,245,.75);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)');
function BookVisit({ draft: d, setDraft, onDone }) {
  const set = (p) => setDraft({ ...d, ...p });
  const [err, setErr] = React.useState(''); const [busy, setBusy] = React.useState(false);
  const days = []; for (let i = 0; i < 14; i++) { const t = new Date(); t.setDate(t.getDate() + i); if (t.getDay() !== 0) days.push(t); }
  const titles = ['What does your car need?', 'Which car?', 'When works?', 'Review and book.'];
  const subs = ['Pick the closest one; the shop confirms details at check-in.', 'Year, make and model is plenty.', 'The shop is open Monday to Saturday.', 'The shop sees this right away.'];
  const ok = [d.job.trim(), d.vehicle.trim(), d.day && d.time, true][d.step];
  const submit = async () => {
    if (busy) return; setBusy(true); setErr('');
    if (supabase) {
      const { error } = await supabase.rpc('book_appointment', { p_starts_at: new Date(d.day + 'T' + d.time + ':00').toISOString(), p_job: d.job.trim(), p_visit: d.visit, p_vehicle: d.vehicle.trim(), p_plate: d.plate.trim(), p_notes: d.notes.trim() });
      setBusy(false); if (error) return setErr(error.message);
    } else setBusy(false);
    onDone();
  };
  const next = () => (d.step < 3 ? set({ step: d.step + 1 }) : submit());
  return (
    <div style={css(PAGE)}><div style={css(WRAP)}>
      <div onClick={() => (d.step ? set({ step: d.step - 1 }) : setDraft(null))} style={css('font-size:13px;color:rgba(235,235,245,.55);cursor:pointer')}>‹ {d.step ? 'Back' : 'Cancel'}</div>
      <div style={css('display:flex;gap:4px;margin-top:18px')}>{[0, 1, 2, 3].map((i) => <div key={i} style={css('flex:1;height:3px;border-radius:2px;background:' + (i <= d.step ? '#fff' : 'rgba(235,235,245,.14)'))} />)}</div>
      <div style={css('font-size:28px;font-weight:600;letter-spacing:-.9px;line-height:1.1;margin-top:26px')}>{titles[d.step]}</div>
      <div style={css('font-size:14px;color:rgba(235,235,245,.55);margin-top:8px')}>{subs[d.step]}</div>
      <div style={css('margin-top:22px;display:flex;flex-direction:column;gap:10px')}>
        {d.step === 0 ? (<>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>{JOBS.map((j) => <div key={j} onClick={() => set({ job: j === 'Something else' ? '' : j, other: j === 'Something else' })} style={css(CHIP(d.other ? j === 'Something else' : d.job === j))}>{j}</div>)}</div>
          {d.other ? <input value={d.job} onChange={(e) => set({ job: e.target.value })} placeholder="Tell us what is going on" style={css(INPUT + ';font-size:16px;margin-top:6px')} autoFocus /> : null}
          <div style={css(LBL + ';margin-top:12px')}>While it is in the shop</div>
          <div style={css('display:flex;gap:8px')}>{[['dropoff', 'Drop off'], ['wait', 'Wait'], ['loaner', 'Loaner']].map(([k, l]) => <div key={k} onClick={() => set({ visit: k })} style={css(CHIP(d.visit === k))}>{l}</div>)}</div>
        </>) : null}
        {d.step === 1 ? (<>
          <input value={d.vehicle} onChange={(e) => set({ vehicle: e.target.value })} placeholder="2021 Toyota 4Runner" style={css(INPUT + ';font-size:16px')} autoFocus />
          <input value={d.plate} onChange={(e) => set({ plate: e.target.value })} placeholder="Plate (optional)" style={css(INPUT + ';font-size:16px')} />
        </>) : null}
        {d.step === 2 ? (<>
          <div style={css('display:flex;gap:8px;overflow-x:auto;margin:0 -22px;padding:0 22px 4px')}>{days.map((t) => { const k = isoDay(t); return <div key={k} onClick={() => set({ day: k, time: '' })} style={css(CHIP(d.day === k) + ';flex:0 0 auto;text-align:center;min-width:58px;padding:10px 8px')}><div style={css('font-size:11px;opacity:.7')}>{t.toLocaleDateString('en-US', { weekday: 'short' })}</div><div style={css('font-size:15px;font-weight:600;margin-top:2px')}>{t.getDate()}</div></div>; })}</div>
          {d.day ? <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px')}>{TIMES.filter((t) => new Date(d.day + 'T' + t + ':00') > new Date()).map((t) => <div key={t} onClick={() => set({ time: t })} style={css(CHIP(d.time === t) + ';text-align:center')}>{new Date('2000-01-01T' + t + ':00').toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>)}</div> : null}
        </>) : null}
        {d.step === 3 ? (<>
          <div style={css(CARD)}>
            {[['Service', d.job], ['Vehicle', d.vehicle + (d.plate ? ' · ' + d.plate.toUpperCase() : '')], ['When', whenLabel(d.day + 'T' + d.time + ':00')], ['Visit', { dropoff: 'Drop off', wait: 'Wait at the shop', loaner: 'Loaner requested' }[d.visit]]].map(([k, v]) => (
              <div key={k} style={css('display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}><div style={css('color:rgba(235,235,245,.5)')}>{k}</div><div style={css('text-align:right')}>{v}</div></div>
            ))}
            <textarea value={d.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Anything the shop should know (optional)" rows={2} style={css(INPUT + ';font-size:14px;margin-top:12px;resize:none;box-shadow:none;background:rgba(255,255,255,.05)')} />
          </div>
          {d.visit === 'loaner' ? <div style={css('font-size:12px;color:rgba(235,235,245,.4);line-height:1.5')}>Loaners are confirmed by the shop; the agreement comes to this app once one is assigned.</div> : null}
        </>) : null}
        {err ? <div style={css('font-size:12.5px;color:#ff6b64')}>{err}</div> : null}
      </div>
      <div style={css('margin-top:auto;padding-top:24px')}>
        <div onClick={ok && !busy ? next : null} style={css(CTA(!!ok && !busy))}>{d.step < 3 ? 'Continue' : busy ? 'Booking…' : 'Book it'}</div>
      </div>
    </div></div>
  );
}
