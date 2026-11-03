import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '../runtime/tpl.js';

// The link the shop texts a customer when it moves onto Revyn: what the app is, and one way in.
const WRAP = "position:fixed;inset:0;background:#000;color:#fff;overflow-y:auto;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const CARD = 'background:#141416;border-radius:16px;padding:18px 20px';
const STEPS = [
  ['Sign in', 'Create an account with your email, or sign in if you have one.'],
  ['Your number', 'Enter the mobile number the shop has on file. That is what links you to your cars.'],
  ['Your cars are there', 'Vehicles, past work and mileage come across from the shop. Book, follow a visit, approve estimates and message the desk from your phone.'],
];

export function Join() {
  const nav = useNavigate();
  return (
    <div style={css(WRAP)}>
      <div style={css('max-width:440px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 48px) 24px calc(env(safe-area-inset-bottom,0px) + 40px)')}>
        <img src="/uploads/revyn.png" alt="Revyn" style={css('height:14px;width:auto;display:block')} />
        <div style={css('font-size:36px;font-weight:600;letter-spacing:-1.2px;line-height:1.05;margin-top:26px')}>Your shop.<br />In your pocket.</div>
        <div style={css('font-size:15px;line-height:1.55;color:rgba(235,235,245,.6);margin-top:14px')}>RyGuys Tire &amp; Auto Sales now runs on Revyn. Everything about your car — visits, estimates, photos from the technician, your invoice — lives here, and the shop can reach you without a phone call.</div>
        <div style={css('display:flex;flex-direction:column;gap:10px;margin-top:28px')}>
          {STEPS.map(([t, d], i) => (
            <div key={t} style={css(CARD + ';display:flex;gap:14px;align-items:flex-start')}>
              <div style={css('width:26px;height:26px;border-radius:13px;background:#fff;color:#000;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:0 0 auto;margin-top:1px')}>{i + 1}</div>
              <div><div style={css('font-size:15px;font-weight:600')}>{t}</div><div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:3px')}>{d}</div></div>
            </div>
          ))}
        </div>
        <div onClick={() => nav('/app')} style={css('margin-top:26px;text-align:center;padding:16px 0;border-radius:14px;background:#fff;color:#000;font-size:15px;font-weight:600;cursor:pointer')}>Get started</div>
        <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);text-align:center;margin-top:14px;line-height:1.5')}>The iPhone app is coming to the App Store. Until then this works the same in Safari — add it to your Home Screen from the share menu.</div>
      </div>
    </div>
  );
}
