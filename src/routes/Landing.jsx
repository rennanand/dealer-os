import React from 'react';
import { Link } from 'react-router-dom';
import { css } from '../runtime/tpl.js';
import { SHOP } from '../state/agreement.js';
import { Backdrop } from './Backdrop.jsx';

// The front door in launch mode. Staff go to the shop desktop; customers arrive through the
// links the shop texts them, so there is nothing for them to find here.
const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
export function Landing() {
  return (
    <Backdrop>
      <div style={css('width:100%;max-width:430px;height:100%;display:flex;flex-direction:column;padding:0 26px calc(env(safe-area-inset-bottom,0px) + 22px)')}>
      <div style={css('flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:26px')}>
        <img src="/uploads/revyn.png" alt="Revyn" style={css('height:16px;width:auto;display:block')} />
        <div style={css('font-size:34px;font-weight:600;letter-spacing:-1.2px;line-height:1.05;margin-top:22px;text-wrap:pretty;text-shadow:0 2px 24px rgba(0,0,0,.5)')}>Loaner cars, without the clipboard.</div>
        <div style={css('font-size:14px;line-height:1.55;color:rgba(235,235,245,.7);margin-top:12px;text-wrap:pretty')}>
          Agreements signed on the customer's phone. Handoff and return recorded in a minute. Every rental in one place.
        </div>
        <Link to="/shop" style={css('display:block;text-align:center;margin-top:28px;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;text-decoration:none')}>Staff sign in</Link>
        <div style={css('text-align:center;font-size:12px;color:rgba(235,235,245,.5);margin-top:14px;line-height:1.5')}>Picking up a loaner? Use the link the shop texted you.</div>
      </div>
      <div style={css('text-align:center;font-size:11.5px;color:rgba(235,235,245,.35)')}>{SHOP.name}</div>
      </div>
    </Backdrop>
  );
}
