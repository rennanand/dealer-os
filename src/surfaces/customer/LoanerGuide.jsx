import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function LoanerGuide({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 150px')}>
        <div style={css('padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center')}>
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>
            {'Your '}
            {T(vm.lv?.short)}
          </div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0;font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:#e0312b')}>
          {T(vm.guideKicker)}
        </div>
        <div style={css('height:238px')} />
        <div style={css('padding:0 22px')}>
          <div style={css('font-size:30px;font-weight:600;letter-spacing:-.9px;line-height:1.1;text-wrap:pretty')}>{T(vm.guideTitle)}</div>
          <div style={css('font-size:14px;line-height:1.6;color:rgba(235,235,245,.62);margin-top:14px;text-wrap:pretty')}>
            {T(vm.guideBody)}
          </div>
        </div>
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
        )}
      >
        <div style={css('display:flex;justify-content:center;gap:5px;margin-bottom:16px')}>
          {L(vm.guideDots).map((d, _i) => (
            <React.Fragment key={_i}>
              <div onClick={d?.go} style={css(d?.style)} />
            </React.Fragment>
          ))}
        </div>
        <div style={css('display:flex;gap:10px')}>
          {vm.guideHasPrev ? (
            <>
              <div
                onClick={vm.guidePrev}
                style={css(
                  'flex:0 0 auto;padding:15px 20px;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,.085));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -1px 0 rgba(0,0,0,.22),0 8px 20px -8px rgba(0,0,0,.55);font-size:13px;font-weight:500;cursor:pointer',
                )}
              >
                Back
              </div>
            </>
          ) : null}
          <div
            onClick={vm.guideNext}
            style={css(
              'flex:1;text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
            )}
          >
            {T(vm.guideCta)}
          </div>
        </div>
      </div>
    </>
  );
}
