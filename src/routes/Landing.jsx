import React from 'react';
import { Link } from 'react-router-dom';
import { css } from '../runtime/tpl.js';
import { SHOP } from '../state/agreement.js';

// The front door in launch mode. Staff go to the shop desktop; customers arrive through the
// links the shop texts them, so there is nothing for them to find here.
const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
export function Landing() {
  return (
    <div style={css('position:fixed;inset:0;background:#000;color:#fff;display:flex;flex-direction:column;' + FONT)}>
      <div style={css('flex:1;display:flex;flex-direction:column;justify-content:center;max-width:430px;width:100%;margin:0 auto;padding:0 26px')}>
        <div style={css('background:#fff;border-radius:8px;padding:8px 10px;align-self:flex-start')}>
          <img src="/uploads/ryguys-logo-trim.png" alt="RyGuys" style={css('height:20px;width:auto;display:block')} />
        </div>
        <div style={css('font-size:34px;font-weight:600;letter-spacing:-1.2px;line-height:1.05;margin-top:22px;text-wrap:pretty')}>Loaner cars, without the clipboard.</div>
        <div style={css('font-size:14px;line-height:1.55;color:rgba(235,235,245,.55);margin-top:12px;text-wrap:pretty')}>
          Agreements signed on the customer's phone. Handoff and return recorded in a minute. Every rental in one place.
        </div>
        <Link to="/shop" style={css('display:block;text-align:center;margin-top:28px;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;text-decoration:none')}>Staff sign in</Link>
        <div style={css('text-align:center;font-size:12px;color:rgba(235,235,245,.4);margin-top:14px;line-height:1.5')}>Picking up a loaner? Use the link {SHOP.name.split(' ')[0]} texted you.</div>
      </div>
      <div style={css('text-align:center;font-size:11.5px;color:rgba(235,235,245,.3);padding:0 0 calc(env(safe-area-inset-bottom,0px) + 22px)')}>{SHOP.name} · {SHOP.address}</div>
    </div>
  );
}
