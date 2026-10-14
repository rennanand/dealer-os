import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Notifs({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 112px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:52px 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goBack}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Notifications</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0;font-size:13px;line-height:1.5;color:rgba(235,235,245,.5)')}>
          We only send what matters: when your car moves to a new step, when we need you, and when it's ready.
        </div>
        <div
          style={css(
            'padding:20px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Channels
        </div>
        <div style={css('margin:10px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.channels).map((c, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={c?.toggle}
                style={css(
                  'padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:12px;cursor:pointer',
                )}
              >
                <div style={css('flex:1')}>
                  <div style={css('font-size:13.5px;font-weight:500')}>{T(c?.t)}</div>
                  <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:3px')}>{T(c?.m)}</div>
                </div>
                <div style={css(c?.track)}>
                  <div style={css(c?.knob)} />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          style={css(
            'padding:20px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Quiet hours
        </div>
        <div
          style={css(
            'margin:10px 18px 0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:14px 16px;display:flex;justify-content:space-between;align-items:center',
          )}
        >
          <div style={css('font-size:13.5px')}>9:00 PM – 7:00 AM</div>
          <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>Ready-for-pickup still comes through</div>
        </div>
      </div>
    </>
  );
}
