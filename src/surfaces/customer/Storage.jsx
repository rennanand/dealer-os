import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Storage({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goBack}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:1.8px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Tire storage</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css(vm.swapPill)}>{T(vm.swapStatus)}</div>{' '}
          <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15;margin-top:12px')}>
            Your winter set is ready.
          </div>
          <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
            Four Michelin X-Ice Snow on rack B-14 at RyGuys. Swap season in Sanpete County runs mid-October through November.
          </div>
        </div>
        <div style={css('margin:22px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.storageRowsP).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css(
                  'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:14px',
                )}
              >
                <span style={css('font-size:13px;color:rgba(235,235,245,.5);flex:0 0 auto')}>{T(r?.k)}</span>
                <span style={css('font-size:13px;text-align:right')}>{T(r?.v)}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          style={css(
            'margin:18px 18px 0;height:150px;border-radius:16px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);background:radial-gradient(ellipse at 50% 62%,#2b2b30 0%,#151517 58%,#0b0b0c 100%);display:flex;align-items:center;justify-content:center;color:rgba(235,235,245,.3);font-size:11px;letter-spacing:.04em;text-align:center;padding:12px',
          )}
        >
          Photo at storage — rack B-14, tagged RA-1190
        </div>
        <div
          onClick={vm.goTires}
          style={css(
            'margin:14px 18px 0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer',
          )}
        >
          <div style={css('flex:1')}>
            <div style={css('font-size:14px;font-weight:500')}>All-season set on the car</div>
            <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:3px')}>
              4/32" front right, measured Oct 5. Replacement range.
            </div>
          </div>
          <div style={css('font-size:12px;font-weight:500;color:#e0312b;display:flex;align-items:center;gap:2px')}>
            {T(vm.tqLinkLabel)}
            <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
              <path
                d="M9 6l6 6-6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
        </div>
        <div style={css('padding:14px 22px 0;font-size:11px;line-height:1.6;color:rgba(235,235,245,.32)')}>
          Tread and pressure were measured when the set was stored. We re-check both at the swap.
        </div>
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
        )}
      >
        <div onClick={vm.bookSwap} style={css(vm.swapCtaStyle)}>
          {T(vm.swapCta)}
        </div>
      </div>
    </>
  );
}
