import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Odometer({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:52px 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goHome}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:1.8px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Mileage</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15')}>What does the odometer say?</div>
          <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
            The app isn’t connected to your car. We record mileage at each visit and estimate in between. A quick update keeps your
            reminders honest.
          </div>
        </div>
        <div
          style={css(
            'margin:26px 18px 0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px;display:flex;align-items:baseline;gap:8px',
          )}
        >
          <input
            value={val(vm.odoDraft)}
            onChange={vm.onOdoDraft}
            inputMode="numeric"
            placeholder={vm.odoPlaceholder}
            style={css(
              'flex:1;min-width:0;background:transparent;border:none;outline:none;color:#fff;font-family:var(--data-font,inherit);font-size:40px;font-weight:300;letter-spacing:-1.5px;font-variant-numeric:tabular-nums',
            )}
          />
          <div style={css('font-size:14px;color:rgba(235,235,245,.45)')}>mi</div>
        </div>
        <div style={css('margin:18px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.odoRows).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css(
                  'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:14px',
                )}
              >
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>{T(r?.k)}</span>
                <span style={css('font-size:13px;text-align:right')}>{T(r?.v)}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          style={css(
            'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Reminders at this mileage
        </div>
        <div style={css('margin:8px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.nextDue).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css(
                  'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:14px',
                )}
              >
                <span style={css('font-size:13px')}>{T(r?.name)}</span>
                <span style={css(`font-size:13px;color:${r?.c ?? ''}`)}>{T(r?.due)}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px 30px;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
        )}
      >
        <div onClick={vm.saveOdo} style={css(vm.odoCtaStyle)}>
          Save mileage
        </div>
      </div>
    </>
  );
}
