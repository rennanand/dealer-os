import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';

// Small pages the live customer app needs that the prototype did not have as data-driven screens.
const BAR = 'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.88);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center';
const INPUT = "width:100%;background:#2a2a2e;outline:0;border-radius:12px;padding:14px;font-size:15px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const CTA = (ok) => 'margin-top:14px;text-align:center;padding:14px 0;border-radius:12px;font-size:13px;font-weight:600;' + (ok ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);');
const Back = ({ go, title, right }) => (
  <div style={css(BAR)}>
    <div onClick={go} style={css('width:60px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}>
      <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block')}><path d="M15 6l-6 6 6 6" style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')} /></svg>
    </div>
    <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>{title}</div>
    <div style={css('width:60px;text-align:right;font-size:12px;color:#e0312b;cursor:pointer')}>{right || ''}</div>
  </div>
);

export function AddVehicle({ vm }) {
  const d = vm.addVeh || {};
  const ok = !!(d.make || d.model);
  return (
    <div style={css('animation:sIn .28s ease;padding:0 0 112px')}>
      <Back go={vm.cancelAddVeh} title="Add a vehicle" />
      <div style={css('padding:26px 22px 0')}>
        <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px;line-height:1.2')}>Which car?</div>
        <div style={css('font-size:13.5px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:8px')}>Year, make and model is plenty. Mileage is whatever the dash shows now; we never read it from the car.</div>
        <div style={css('display:grid;grid-template-columns:90px 1fr;gap:10px;margin-top:22px')}>
          <input value={d.year || ''} inputMode="numeric" placeholder="Year" onChange={(e) => vm.setAddVeh({ year: e.target.value.replace(/\D/g, '').slice(0, 4) })} style={css(INPUT)} autoFocus />
          <input value={d.make || ''} placeholder="Make" onChange={(e) => vm.setAddVeh({ make: e.target.value })} style={css(INPUT)} />
        </div>
        <input value={d.model || ''} placeholder="Model" onChange={(e) => vm.setAddVeh({ model: e.target.value })} style={css(INPUT + ';margin-top:10px')} />
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px')}>
          <input value={d.plate || ''} placeholder="Plate (optional)" onChange={(e) => vm.setAddVeh({ plate: e.target.value.toUpperCase() })} style={css(INPUT)} />
          <input value={d.odometer || ''} inputMode="numeric" placeholder="Mileage" onChange={(e) => vm.setAddVeh({ odometer: e.target.value.replace(/\D/g, '').slice(0, 7) })} style={css(INPUT)} />
        </div>
        {d.err ? <div style={css('font-size:12.5px;color:#ff6b64;margin-top:12px')}>{d.err}</div> : null}
        <div onClick={ok ? vm.saveAddVeh : null} style={css(CTA(ok))}>Save vehicle</div>
      </div>
    </div>
  );
}

export function GarageLive({ vm }) {
  return (
    <div style={css('animation:sIn .28s ease;padding:calc(var(--sat) + 11px) 0 112px')}>
      <div style={css('padding:0 22px 14px')}><img src="/uploads/revyn.png" alt="Revyn" style={css('height:11px;width:auto;display:block;opacity:.92')} /></div>
      <div style={css('padding:0 22px;display:flex;justify-content:space-between;align-items:center')}>
        <div style={css('font-size:28px;font-weight:600;letter-spacing:-.9px')}>Vehicles</div>
        <div onClick={vm.addVehicle} style={css('font-size:12px;color:#e0312b;cursor:pointer;font-weight:500')}>Add</div>
      </div>
      <div style={css('height:236px')} />
      <div style={css('padding:0 18px;display:flex;flex-direction:column;gap:10px')}>
        {L(vm.garageCars).map((c) => (
          <div key={c.id} onClick={c.pick} style={css('background:#141416;border-radius:16px;padding:16px 18px;display:flex;align-items:center;gap:14px;cursor:pointer')}>
            <div style={css('width:40px;height:40px;border-radius:20px;flex:0 0 auto;background:' + c.paint + ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)')} />
            <div style={css('flex:1;min-width:0')}>
              <div style={css('font-size:15px;font-weight:500')}>{T(c.name)}</div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{T(c.sub)}</div>
            </div>
            <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{c.visits ? c.visits + (c.visits === 1 ? ' visit' : ' visits') : 'New'}</div>
          </div>
        ))}
      </div>
      <div style={css('padding:18px 22px 0;font-size:12px;color:rgba(235,235,245,.35);line-height:1.5')}>Mileage and condition are what you or the shop entered at a visit. Nothing here is read from the vehicle.</div>
    </div>
  );
}

import { ShopsSection } from '../../routes/ShopMap.jsx';
export function ShopLive({ vm }) {
  return (
    <div style={css('animation:sIn .28s ease;padding:calc(var(--sat) + 11px) 22px 112px')}>
      <div style={css('padding:0 0 14px')}><img src="/uploads/revyn.png" alt="Revyn" style={css('height:11px;width:auto;display:block;opacity:.92')} /></div>
      <div style={css('font-size:28px;font-weight:600;letter-spacing:-.9px')}>Shop</div>
      <ShopsSection shops={vm.shopInfo ? [vm.shopInfo] : []} wide={false} />
      {vm.myLoaners && vm.myLoaners.length ? (
        <div style={css('margin-top:28px')}>
          <div style={css('font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)')}>Your loaners</div>
          <div style={css('display:flex;flex-direction:column;gap:10px;margin-top:12px')}>
            {vm.myLoaners.map((r) => (
              <div key={r.number} onClick={() => { window.location.assign('/rental/' + r.token + '?app=1'); }} style={css('background:#141416;border-radius:16px;padding:16px 18px;display:flex;align-items:center;gap:14px;cursor:pointer')}>
                <div style={css('width:40px;height:40px;border-radius:20px;flex:0 0 auto;background:' + (r.paint || '#b9bdc3') + ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)')} />
                <div style={css('flex:1;min-width:0')}>
                  <div style={css('font-size:15px;font-weight:500')}>{r.vehicle || 'Loaner'}</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{r.number} · {r.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
