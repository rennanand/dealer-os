import React from 'react';
import { css } from '../runtime/tpl.js';
import { sendCode, verifyCode } from '../state/auth.js';

const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const INPUT = 'width:100%;background:#141416;border:0;outline:0;border-radius:12px;padding:16px 14px;font-size:16px;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);' + FONT;
const btn = (ok) => 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (ok ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;');

/** Email → six-digit code. One field per step, in the app's own language. */
export function SignIn({ title = 'Sign in', note }) {
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const go = async () => {
    if (busy) return;
    setErr('');
    setBusy(true);
    const { error } = step === 0 ? await sendCode(email) : await verifyCode(email, code);
    setBusy(false);
    if (error) return setErr(error.message);
    if (step === 0) setStep(1);
  };
  const ok = step === 0 ? emailOk : code.length === 6;
  return (
    <div style={css('position:fixed;inset:0;background:#000;color:#fff;display:flex;justify-content:center;' + FONT)}>
      <div style={css('width:100%;max-width:430px;height:100%;display:flex;flex-direction:column;padding:0 22px 34px')}>
        <div style={css('flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:8px')}>
          <div style={css('background:#fff;border-radius:8px;padding:8px 10px;align-self:flex-start')}>
            <img src="/uploads/ryguys-logo-trim.png" alt="RyGuys" style={css('height:20px;width:auto;display:block')} />
          </div>
          <div style={css('font-size:34px;font-weight:600;letter-spacing:-1.2px;line-height:1.05;margin-top:22px')}>{step === 0 ? title : 'Enter your code.'}</div>
          <div style={css('font-size:14px;line-height:1.55;color:rgba(235,235,245,.55);margin-top:12px')}>
            {step === 0 ? note || 'We will email you a six-digit code. No password to remember.' : 'Sent to ' + email.trim() + '. It expires in an hour.'}
          </div>
        </div>
        <div style={css('padding-top:18px')}>
          {step === 0 ? (
            <input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ok && go()} style={css(INPUT)} autoFocus />
          ) : (
            <div style={css('position:relative')}>
              <div style={css('display:grid;grid-template-columns:repeat(6,1fr);gap:8px')}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={css('height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:var(--data-font,inherit);font-size:22px;font-weight:500;background:#141416;box-shadow:inset 0 0 0 1px ' + (i === code.length ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.08)'))}>{code[i] || ''}</div>
                ))}
              </div>
              <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={(e) => e.key === 'Enter' && ok && go()} style={css('position:absolute;inset:0;opacity:0;width:100%;height:100%;font-size:16px')} autoFocus />
            </div>
          )}
          {err ? <div style={css('font-size:12.5px;color:#e0312b;margin-top:12px')}>{err}</div> : null}
          <div onClick={() => ok && go()} style={css('margin-top:14px;' + btn(ok && !busy))}>{busy ? 'One moment…' : step === 0 ? 'Send code' : 'Continue'}</div>
          {step === 1 ? (
            <div onClick={() => { setStep(0); setCode(''); setErr(''); }} style={css('text-align:center;font-size:12px;color:rgba(235,235,245,.4);margin-top:14px;cursor:pointer')}>
              Use a different email
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Blocked({ message, onSignOut }) {
  return (
    <div style={css('position:fixed;inset:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;' + FONT)}>
      <div style={css('max-width:360px')}>
        <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px')}>{message}</div>
        <div onClick={onSignOut} style={css('margin-top:18px;font-size:13px;color:rgba(235,235,245,.5);cursor:pointer')}>Sign out</div>
      </div>
    </div>
  );
}
