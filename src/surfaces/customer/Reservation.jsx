import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Reservation({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 112px')}>
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
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>My reservation</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('font-size:26px;font-weight:600;letter-spacing:-.7px')}>{T(vm.sel?.name)}</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:6px')}>
            {T(vm.sel?.price)}
            {' · RES-20481'}
          </div>
          <div style={css('font-size:12px;font-weight:500;color:#e0312b;margin-top:12px')}>{T(vm.resStatusLabel)}</div>
        </div>
        <div style={css('padding:26px 22px 0')}>
          {L(vm.resTimeline).map((t, _i) => (
            <React.Fragment key={_i}>
              <div style={css('display:flex;gap:14px')}>
                <div style={css('width:14px;display:flex;flex-direction:column;align-items:center;padding-top:4px')}>
                  <div style={css(t?.dotStyle)} />
                  <div style={css(t?.lineStyle)} />
                </div>
                <div style={css('padding-bottom:22px;flex:1;display:flex;justify-content:space-between;gap:12px')}>
                  <div style={css(`font-size:14px;font-weight:500;color:${t?.color ?? ''}`)}>{T(t?.name)}</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(t?.state)}</div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:0 22px')}>
          <div
            onClick={vm.goAsk}
            style={css(
              'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer',
            )}
          >
            <div style={css('flex:1')}>
              <div style={css('font-size:13px;font-weight:500')}>Questions about your purchase?</div>
              <div style={css('font-size:11px;color:rgba(235,235,245,.42);margin-top:4px')}>
                Message the sales team — your vehicle is attached.
              </div>
            </div>
            <div style={css('display:flex;color:rgba(235,235,245,.3)')}>
              <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                <path
                  d="M9 6l6 6-6 6"
                  style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
