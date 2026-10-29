import React from 'react';
import { css } from '../runtime/tpl.js';
import { LogicHost } from '../runtime/LogicHost.jsx';
import { DEFAULT_OPTIONS } from '../state/options.js';
import { CustomerLive } from '../state/customerLive.js';
import { CustomerApp } from '../surfaces/customer/CustomerApp.jsx';
import { supabase } from '../state/supabase.js';
import { signOut } from '../state/auth.js';

// The customer app on real records. First open asks for the mobile number the shop has on file;
// that number is what ties this account to its vehicles, visits and loaners.
const PAGE = "position:fixed;inset:0;background:#000;color:#fff;overflow-y:auto;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const WRAP = 'max-width:430px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 22px) 22px calc(env(safe-area-inset-bottom,0px) + 30px)';
const INPUT = 'width:100%;background:rgba(255,255,255,.06);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:0;outline:0;border-radius:12px;padding:16px 14px;font-size:18px;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);font-family:var(--data-font,inherit)';
const CTA = (ok) => 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;' + (ok ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);');
const fmtPhone = (d) => (d.length <= 3 ? d : d.length <= 6 ? '(' + d.slice(0, 3) + ') ' + d.slice(3) : '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6, 10));

export function CustomerLiveRoute({ auth }) {
  const [profile, setProfile] = React.useState(undefined);
  const [phone, setPhone] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    if (!supabase) return setProfile({ phone: '4355550142', name: auth.member?.name || 'Rennan' });
    supabase.from('customer_profiles').select('*').eq('user_id', auth.session.user.id).maybeSingle().then(({ data }) => setProfile(data || null));
  }, [auth.session]);
  const save = async () => {
    if (phone.length !== 10 || busy) return;
    setBusy(true);
    const row = { user_id: auth.session.user.id, phone, name: auth.member?.name || '' };
    if (supabase) await supabase.from('customer_profiles').upsert(row);
    setBusy(false); setProfile(row);
  };
  if (profile === undefined) return <div style={css(PAGE)} />;
  if (!profile || !profile.phone) {
    return (
      <div style={css(PAGE)}><div style={css(WRAP)}>
        <div style={css('flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:8px')}>
          <img src="/uploads/revyn.png" alt="Revyn" style={css('height:12px;width:auto;display:block')} />
          <div style={css('font-size:34px;font-weight:600;letter-spacing:-1.2px;line-height:1.05;margin-top:22px')}>Your mobile number.</div>
          <div style={css('font-size:14px;line-height:1.55;color:rgba(235,235,245,.55);margin-top:12px')}>The one the shop has for you. Your vehicles, visits and loaner agreements show up here.</div>
        </div>
        <div style={css('padding-top:18px')}>
          <input inputMode="tel" autoComplete="tel" placeholder="(435) 555-0100" value={fmtPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} style={css(INPUT)} autoFocus />
          <div onClick={save} style={css('margin-top:14px;' + CTA(phone.length === 10 && !busy))}>Continue</div>
        </div>
      </div></div>
    );
  }
  return (
    <LogicHost Logic={CustomerLive} options={{ ...DEFAULT_OPTIONS, profile, member: auth.member, signOut, userId: auth.session.user.id }}>
      {(vm) => (
        <div className="surface surface-customer">
          <div className="phone"><CustomerApp vm={vm} /></div>
        </div>
      )}
    </LogicHost>
  );
}
