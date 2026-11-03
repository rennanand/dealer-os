import React from 'react';
import { css } from '../runtime/tpl.js';
import { supabase, SHOP_ID } from '../state/supabase.js';

// Online booking: /book. No account. Pick a service, a day, a time; leave a name and mobile number.
// Slots come from the shop's hours, bays and what is already booked (booking_slots).

const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const PAGE = 'min-height:100%;background:#000;color:#fff;' + FONT;
const WRAP = 'max-width:430px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 22px calc(env(safe-area-inset-bottom,0px) + 40px)';
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const INPUT = 'width:100%;background:#141416;border:0;outline:0;border-radius:12px;padding:14px;font-size:15px;color:#fff;box-sizing:border-box;' + FONT;
const chip = (on) => 'padding:10px 14px;border-radius:12px;font-size:13px;font-weight:500;cursor:pointer;text-align:center;' + (on ? 'background:#fff;color:#000' : 'background:#141416;color:rgba(235,235,245,.75)');
const iso = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
const DEMO_INFO = { name: 'RyGuys Tire & Auto Sales', address: '204 N Main St, Manti, UT 84642', phone: '4358354869', open_days: [1, 2, 4, 5], open_from: '08:00', open_to: '17:30', online: true, days_ahead: 30, services: [{ name: 'Oil change', minutes: 45 }, { name: 'Tires', minutes: 60 }, { name: 'Brakes', minutes: 120 }, { name: 'Alignment', minutes: 60 }, { name: 'Check engine light', minutes: 60 }, { name: 'Inspection', minutes: 45 }, { name: 'Something else', minutes: 60 }] };

export function BookRoute() {
  const [info, setInfo] = React.useState(null);
  const [svc, setSvc] = React.useState(null);
  const [day, setDay] = React.useState('');
  const [slots, setSlots] = React.useState(null);
  const [slot, setSlot] = React.useState(null);
  const [f, setF] = React.useState({ name: '', phone: '', vehicle: '', notes: '' });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [done, setDone] = React.useState(null);
  React.useEffect(() => { if (!supabase) return setInfo(DEMO_INFO); supabase.rpc('booking_info', { p_shop: SHOP_ID }).then(({ data }) => setInfo(data || DEMO_INFO)); }, []);
  const days = React.useMemo(() => { if (!info) return []; const out = []; const d = new Date(); for (let i = 0; i < (info.days_ahead || 30) && out.length < 14; i++) { const x = new Date(d); x.setDate(d.getDate() + i); if ((info.open_days || [1, 2, 3, 4, 5]).includes(x.getDay())) out.push(iso(x)); } return out; }, [info]);
  React.useEffect(() => { if (!day && days.length) setDay(days[0]); }, [days, day]);
  React.useEffect(() => {
    if (!day || !svc) return; setSlots(null); setSlot(null);
    if (!supabase) { const out = []; for (let h = 8; h < 17; h++) for (const m of [0, 30]) if (Math.random() > 0.3) out.push({ starts_at: day + 'T' + String(h).padStart(2, '0') + ':' + (m ? '30' : '00') + ':00', label: ((h + 11) % 12 + 1) + ':' + (m ? '30' : '00') + (h >= 12 ? ' PM' : ' AM') }); return setSlots(out); }
    supabase.rpc('booking_slots', { p_shop: SHOP_ID, p_day: day, p_minutes: svc.minutes || 60 }).then(({ data }) => setSlots(Array.isArray(data) ? data : []));
  }, [day, svc]);
  const submit = async () => {
    if (busy || !slot) return; setErr(''); setBusy(true);
    if (!supabase) { setBusy(false); return setDone({ starts_at: slot.starts_at, job: svc.name, shop: info.name, address: info.address }); }
    const { data, error } = await supabase.rpc('book_online', { p_shop: SHOP_ID, p_name: f.name, p_phone: f.phone, p_starts_at: slot.starts_at, p_job: svc.name, p_vehicle: f.vehicle, p_notes: f.notes, p_minutes: svc.minutes || 60 });
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(data);
  };
  if (!info) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center;color:rgba(235,235,245,.45);font-size:13px')}>Loading…</div></div>;
  const dayLabel = (d) => { const x = new Date(d + 'T12:00:00'); const t = iso(new Date()); return (d === t ? 'Today' : x.toLocaleDateString('en-US', { weekday: 'short' })) + '\n' + x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  if (done) return (
    <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:80px;text-align:center')}>
      <div style={css('width:56px;height:56px;border-radius:28px;background:#30d158;margin:0 auto;display:flex;align-items:center;justify-content:center')}><svg viewBox="0 0 24 24" style={css('width:26px;height:26px')}><path d="M5 12.5l4.5 4.5L19 7" style={css('fill:none;stroke:#000;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')} /></svg></div>
      <div style={css('font-size:24px;font-weight:600;letter-spacing:-.5px;margin-top:18px')}>You are booked.</div>
      <div style={css('font-size:14px;color:rgba(235,235,245,.65);margin-top:8px;line-height:1.5')}>{done.job} · {new Date(done.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {new Date(done.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
      <div style={css('font-size:13px;color:rgba(235,235,245,.45);margin-top:16px;line-height:1.5')}>{done.shop}<br />{done.address}</div>
      <div style={css('font-size:12.5px;color:rgba(235,235,245,.45);margin-top:24px;line-height:1.5')}>We text a confirmation to your mobile. Reply C to confirm, or call the shop to change it.</div>
      <a href="/join" style={css('display:block;margin-top:28px;text-align:center;padding:14px 0;border-radius:12px;background:#141416;color:#fff;font-size:13px;font-weight:600;text-decoration:none')}>Follow the visit in the Revyn app</a>
    </div></div>
  );
  if (info.online === false) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center')}><div style={css('font-size:20px;font-weight:600')}>Call to book.</div><div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>{info.name}{info.phone ? ' · ' + info.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : ''}</div></div></div>;
  return (
    <div style={css(PAGE)}>
      <div style={css(WRAP)}>
        <div style={css(LBL)}>{info.name}</div>
        <div style={css('font-size:26px;font-weight:600;letter-spacing:-.6px;margin-top:6px;line-height:1.15')}>Book a visit.</div>
        <div style={css(LBL + ';margin-top:26px')}>Service</div>
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px')}>{(info.services || []).map((s) => <div key={s.name} onClick={() => setSvc(s)} style={css(chip(svc && svc.name === s.name))}>{s.name}</div>)}</div>
        {svc ? (<>
          <div style={css(LBL + ';margin-top:26px')}>Day</div>
          <div style={css('display:flex;gap:8px;overflow-x:auto;margin:8px -22px 0;padding:0 22px 4px')} className="hidescroll">{days.map((d) => <div key={d} onClick={() => setDay(d)} style={css(chip(day === d) + ';flex:0 0 auto;min-width:64px;white-space:pre-line;line-height:1.3')}>{dayLabel(d)}</div>)}</div>
          <div style={css(LBL + ';margin-top:22px')}>Time</div>
          {slots === null ? <div style={css('font-size:13px;color:rgba(235,235,245,.45);margin-top:8px')}>Checking the schedule…</div> : slots.length ? <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px')}>{slots.map((s) => <div key={s.starts_at} onClick={() => setSlot(s)} style={css(chip(slot && slot.starts_at === s.starts_at))}>{s.label}</div>)}</div> : <div style={css('font-size:13px;color:rgba(235,235,245,.45);margin-top:8px')}>Nothing open that day. Try another.</div>}
        </>) : null}
        {slot ? (<>
          <div style={css(LBL + ';margin-top:26px')}>You</div>
          <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:8px')}>
            <input value={f.name} placeholder="Name" autoComplete="name" onChange={(e) => setF({ ...f, name: e.target.value })} style={css(INPUT)} />
            <input value={f.phone} placeholder="Mobile number" inputMode="tel" autoComplete="tel" onChange={(e) => setF({ ...f, phone: e.target.value })} style={css(INPUT)} />
            <input value={f.vehicle} placeholder="Vehicle · 2019 Subaru Outback" onChange={(e) => setF({ ...f, vehicle: e.target.value })} style={css(INPUT)} />
            <textarea value={f.notes} placeholder="Anything we should know" rows={2} onChange={(e) => setF({ ...f, notes: e.target.value })} style={css(INPUT + ';resize:none;font-size:14px;line-height:1.45')} />
          </div>
          {err ? <div style={css('font-size:12.5px;color:#ff6b64;margin-top:12px')}>{err}</div> : null}
          <div onClick={f.name.trim() && f.phone.replace(/\D/g, '').length >= 10 ? submit : null} style={css('margin-top:18px;text-align:center;padding:15px 0;border-radius:12px;font-size:14px;font-weight:600;' + (f.name.trim() && f.phone.replace(/\D/g, '').length >= 10 ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);') + (busy ? 'opacity:.6' : ''))}>{busy ? 'Booking…' : 'Book ' + svc.name + ' · ' + slot.label}</div>
          <div style={css('text-align:center;font-size:11.5px;color:rgba(235,235,245,.4);margin-top:10px;line-height:1.5')}>We text a confirmation. Standard rates apply.</div>
        </>) : null}
        <div style={css('font-size:11.5px;color:rgba(235,235,245,.35);margin-top:30px;line-height:1.5;text-align:center')}>{info.address}{info.phone ? ' · ' + info.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : ''}{info.hours ? ' · ' + info.hours : ''}</div>
      </div>
    </div>
  );
}
