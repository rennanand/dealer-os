import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

// Walk-in check-in from the shop desktop: customer, vehicle, concern, service, bay. One page,
// one action. Everything it records shows on Schedule, Appointments and the lobby board.

const LABEL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-bottom:10px';
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px';
const INPUT = "width:100%;background:#1c1c1e;border:0;outline:0;border-radius:10px;padding:13px 14px;font-size:13.5px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";

export function Checkin({ vm }) {
  return (
    <div style={css('animation:sIn .28s ease')}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:24px')}>
        <div>
          <div onClick={vm.ciBack} style={css('font-size:12.5px;color:#e0312b;cursor:pointer;margin-bottom:10px')}>‹ Today</div>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Check in a walk-in</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{T(vm.ciSub)}</div>
        </div>
      </div>

      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px')}>
        <div style={css(CARD)}>
          <div style={css(LABEL)}>Customer</div>
          <input placeholder="Name" value={val(vm.ciName)} onChange={vm.onCiName} style={css(INPUT)} />
          <input placeholder="Mobile number" inputMode="tel" value={val(vm.ciPhone)} onChange={vm.onCiPhone} style={css(INPUT + ';margin-top:8px')} />
          <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:10px;line-height:1.5')}>
            {T(vm.ciCustomerNote)}
          </div>
        </div>
        <div style={css(CARD)}>
          <div style={css(LABEL)}>Vehicle</div>
          <div style={css('display:flex;gap:8px')}>
            <input placeholder="Plate or VIN" value={val(vm.ciPlate)} onChange={vm.onCiPlate} onKeyDown={vm.onCiPlateKey} style={css(INPUT + ';text-transform:uppercase;font-family:var(--data-font,inherit)')} />
            <div onClick={vm.ciLookup} style={css('flex:0 0 auto;padding:13px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer')}>Look up</div>
          </div>
          {vm.ciFound ? (
            <div style={css('margin-top:12px;display:flex;align-items:center;gap:12px')}>
              <div style={css('width:46px;height:34px;border-radius:7px;' + (vm.ciFoundPh || ''))} />
              <div>
                <div style={css('font-size:14px;font-weight:500')}>{T(vm.ciFoundName)}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{T(vm.ciFoundSub)}</div>
              </div>
            </div>
          ) : (
            <input placeholder="Or type year, make, model" value={val(vm.ciCar)} onChange={vm.onCiCar} style={css(INPUT + ';margin-top:8px')} />
          )}
          <input placeholder="Odometer (ask the customer)" inputMode="numeric" value={val(vm.ciOdo)} onChange={vm.onCiOdo} style={css(INPUT + ';margin-top:8px')} />
        </div>
      </div>

      <div style={css(CARD + ';margin-top:16px')}>
        <div style={css(LABEL)}>Concern</div>
        <textarea placeholder="In the customer's words. They see this on their phone." value={val(vm.ciConcern)} onChange={vm.onCiConcern} rows={2} style={css(INPUT + ';resize:none;line-height:1.5')} />
        <div style={css(LABEL + ';margin-top:18px')}>Service</div>
        <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>
          {L(vm.ciServices).map((c, _i) => (
            <div key={_i} onClick={c?.pick} style={css(c?.style)}>{T(c?.label)}</div>
          ))}
        </div>
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px')}>
          <div>
            <div style={css(LABEL)}>Bay</div>
            <div style={css('display:flex;gap:8px')}>
              {L(vm.ciBays).map((b, _i) => (
                <div key={_i} onClick={b?.pick} style={css(b?.style)}>
                  <div>{T(b?.label)}</div>
                  <div style={css('font-size:10.5px;margin-top:3px;opacity:.6')}>{T(b?.sub)}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={css(LABEL)}>While they wait</div>
            <div style={css('display:flex;gap:8px')}>
              {L(vm.ciVisits).map((v, _i) => (
                <div key={_i} onClick={v?.pick} style={css(v?.style)}>{T(v?.label)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={css('display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px')}>
        <div style={css('font-size:12.5px;color:rgba(235,235,245,.45);line-height:1.5')}>{T(vm.ciFoot)}</div>
        <div onClick={vm.ciSubmit} style={css(vm.ciCtaStyle)}>{T(vm.ciCta)}</div>
      </div>
    </div>
  );
}
