import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '../runtime/tpl.js';
import { supabase } from '../state/supabase.js';
import { updatePassword } from '../state/auth.js';
import { Backdrop } from './Backdrop.jsx';

// Landing page of the password-reset email. Supabase signs the person in from the link; here they choose a new password.
const INPUT = "width:100%;background:rgba(20,20,22,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:0;outline:0;border-radius:12px;padding:16px 14px;font-size:16px;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
export function ResetRoute() {
  const nav = useNavigate();
  const [pw, setPw] = React.useState('');
  const [ready, setReady] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    if (!supabase) return setReady(true);
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (s) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);
  const save = async () => {
    if (pw.length < 8 || busy) return;
    setBusy(true); setErr('');
    const { error } = supabase ? await updatePassword(pw) : { error: null };
    setBusy(false);
    if (error) return setErr(error.message);
    nav('/shop', { replace: true });
  };
  return (
    <Backdrop>
      <div style={css('width:100%;max-width:430px;height:100%;display:flex;flex-direction:column;padding:0 22px calc(env(safe-area-inset-bottom,0px) + 34px)')}>
        <div style={css('flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:8px')}>
          <div style={css('font-size:34px;font-weight:600;letter-spacing:-1.2px;line-height:1.05;text-shadow:0 2px 24px rgba(0,0,0,.5)')}>New password.</div>
          <div style={css('font-size:14px;line-height:1.55;color:rgba(235,235,245,.55);margin-top:12px')}>{ready ? 'At least 8 characters.' : 'This link has expired or was already used. Request a new one from the sign-in screen.'}</div>
        </div>
        {ready ? (
          <div style={css('padding-top:18px')}>
            <input type="password" autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} style={css(INPUT)} autoFocus />
            {err ? <div style={css('font-size:12.5px;color:#e0312b;margin-top:12px')}>{err}</div> : null}
            <div onClick={save} style={css('margin-top:14px;text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;' + (pw.length >= 8 && !busy ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);'))}>{busy ? 'Saving…' : 'Save and sign in'}</div>
          </div>
        ) : null}
      </div>
    </Backdrop>
  );
}
