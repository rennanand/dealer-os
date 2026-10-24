import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Garage({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:calc(var(--sat) + 11px) 0 112px')}>
        <div style={css('padding:0 22px')}>
          <div style={css('font-size:30px;font-weight:600;letter-spacing:-.9px')}>My Garage</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:6px')}>{T(vm.garageSub)}</div>
        </div>
        <div style={css('height:190px')} />
        <div style={css('padding:20px 18px 0;display:flex;flex-direction:column;gap:12px')}>
          {L(vm.garageCars).map((g, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={g?.go}
                style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);overflow:hidden;cursor:pointer')}
                className="px4"
              >
                <div style={css('padding:16px 16px 17px;display:flex;align-items:center;gap:12px')}>
                  <div style={css('flex:1')}>
                    <div style={css('font-size:16px;font-weight:500')}>{T(g?.name)}</div>
                    <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:4px')}>{T(g?.sub)}</div>
                  </div>
                  <div style={css(g?.tagStyle)}>{T(g?.tag)}</div>
                </div>
              </div>
            </React.Fragment>
          ))}
          <div
            onClick={vm.goShop}
            style={css(
              'border:1px dashed rgba(235,235,245,.16);border-radius:16px;padding:16px;text-align:center;font-size:13px;color:rgba(235,235,245,.5);cursor:pointer',
            )}
            className="px5"
          >
            Add a vehicle
          </div>
        </div>
        <div style={css('padding:24px 22px 0')}>
          <div
            style={css(
              'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
            )}
          >
            Quicksilver
          </div>
          <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
            {L(vm.garageRows).map((r, _i) => (
              <React.Fragment key={_i}>
                <div
                  onClick={r?.go}
                  style={css(
                    'padding:15px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:12px;cursor:pointer',
                  )}
                >
                  <div style={css('flex:1;font-size:14px;font-weight:500')}>{T(r?.t)}</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(r?.v)}</div>
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
        </div>
      </div>
    </>
  );
}
