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
const fmtPhone = (d) => (d.length <= 3 ? d : d.length <= 6 ? '(' + d.slice(0, 3) + ') ' + d.slice(3) : '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6, 10));

export function MyLoaners({ auth }) {
  const nav = useNavigate();
  const [profile, setProfile] = React.useState(undefined);
  const [rentals, setRentals] = React.useState([]);
  const [phone, setPhone] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(async () => {
    if (!supabase) { setProfile({ phone: '4355550142' }); setRentals([{ number: 'LN-3107', status: 'sent', token: 'demo', start_date: '2026-11-02', end_date: '2026-11-03', vehicle: '2027 Tesla Model 3', color: 'Quicksilver', paint: '#b9bdc3' }]); return; }
    const { data } = await supabase.from('customer_profiles').select('*').eq('user_id', auth.session.user.id).maybeSingle();
    setProfile(data || null);
    if (data && data.phone) { const r = await supabase.rpc('my_rentals'); setRentals(r.data || []); }
  }, [auth.session]);
  React.useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
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
          <img src="/uploads/revyn.png" alt="Revyn" style={css('height:16px;width:auto;display:block')} />
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
  return (
    <div style={css(PAGE)}><div style={css(WRAP)}>
      <div style={css('display:flex;justify-content:space-between;align-items:center')}>
        <img src="/uploads/revyn.png" alt="Revyn" style={css('height:11px;width:auto;display:block')} />
        <div onClick={signOut} style={css('font-size:12px;color:rgba(235,235,245,.4);cursor:pointer')}>Sign out</div>
      </div>
      <div style={css('font-size:28px;font-weight:600;letter-spacing:-.9px;line-height:1.1;margin-top:26px')}>{first ? 'Hi ' + first + '.' : 'Your loaners.'}</div>
      <div style={css('font-size:14px;color:rgba(235,235,245,.55);margin-top:8px')}>{rentals.length ? 'Tap a rental to open it.' : 'Nothing yet. When the shop sends you a loaner agreement, it appears here.'}</div>
      <div style={css('display:flex;flex-direction:column;gap:10px;margin-top:22px')}>
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
      <div style={css('font-size:12px;color:rgba(235,235,245,.35);margin-top:auto;padding-top:30px;text-align:center')}>Number on file: {fmtPhone(profile.phone)} · <span onClick={() => setProfile({ phone: '' })} style={css('cursor:pointer;color:rgba(235,235,245,.55)')}>change</span></div>
    </div></div>
  );
}
