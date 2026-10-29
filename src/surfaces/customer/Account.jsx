import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Account({ vm }) {
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Account</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:12px 22px 0;display:flex;align-items:center;gap:14px')}>
          <div
            style={css(
              'width:54px;height:54px;border-radius:27px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:15px;letter-spacing:.5px',
            )}
          >
            {vm.initials || 'RA'}
          </div>
          <div>
            <div style={css('font-size:21px;font-weight:500')}>{vm.accountName || 'Rennan Anderson'}</div>
            <div style={css('font-size:12px;color:rgba(235,235,245,.42);margin-top:5px')}>{vm.accountSub || 'Member since 2024 · Manti, UT'}</div>
          </div>
        </div>
        <div style={css('margin:22px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.accountRows).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={r?.go}
                style={css(
                  'padding:15px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:12px;cursor:pointer',
                )}
              >
                <div style={css('color:rgba(235,235,245,.7)')}>
                  <svg viewBox="0 0 24 24" style={css('width:17px;height:17px;display:block;flex:0 0 auto')}>
                    <path
                      d={r?.d}
                      style={css('fill:none;stroke:currentColor;stroke-width:1.6px;stroke-linecap:round;stroke-linejoin:round')}
                    />
                  </svg>
                </div>
                <div style={css('flex:1;font-size:13px')}>{T(r?.t)}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.4)')}>{T(r?.v)}</div>
                <div style={css('display:flex;color:rgba(235,235,245,.3)')}>
                  <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                    <path
                      d="M9 6l6 6-6 6"
                      style={css(
                        'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round',
                      )}
                    />
                  </svg>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('margin-top:26px;display:flex;justify-content:center')}>
          <div style={css('background:#fff;border-radius:10px;padding:14px 18px')}>
            <img src="/uploads/revyn.png" alt={'RyGuys Tire & Auto Sales'} style={css('height:58px;width:auto;display:block')} />
          </div>
        </div>
        <div style={css('font-size:11px;line-height:1.6;color:rgba(235,235,245,.28);text-align:center;margin-top:14px')}>
          {vm.accountFoot1 || 'v4.0 · 145 S Main St, Manti UT'}
          <br />
          {vm.accountFoot2 || 'Mon–Fri 8–6 · Sat 9–2'}
        </div>
      </div>
    </>
  );
}
