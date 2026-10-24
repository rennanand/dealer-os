import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Health({ vm }) {
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Vehicle Health</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('height:230px;position:relative')}>
          {L(vm.healthCallouts).map((k, _i) => (
            <React.Fragment key={_i}>
              <div style={css(k?.style)}>
                <div
                  style={css(
                    'font-family:var(--data-font,inherit);font-size:9.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:rgba(235,235,245,.45)',
                  )}
                >
                  {T(k?.k)}
                </div>{' '}
                <div
                  style={css(
                    `font-family:var(--data-font,inherit);font-size:12.5px;font-weight:500;letter-spacing:.02em;margin-top:3px;color:${k?.c ?? ''}`,
                  )}
                >
                  {T(k?.v)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('font-size:26px;font-weight:600;letter-spacing:-.7px;line-height:1.2')}>{T(vm.healthHeadline)}</div>
          <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
            Based on inspections performed at RyGuys. Nothing here is guessed from sensors.
          </div>
        </div>
        <div style={css('margin:20px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.health).map((h, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={h?.go}
                style={css(
                  'padding:15px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:12px;cursor:pointer',
                )}
              >
                <div
                  style={css(
                    'width:34px;height:34px;border-radius:17px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;color:rgba(235,235,245,.85)',
                  )}
                >
                  <svg viewBox="0 0 24 24" style={css('width:17px;height:17px;display:block;flex:0 0 auto')}>
                    <path
                      d={h?.d}
                      style={css('fill:none;stroke:currentColor;stroke-width:1.6px;stroke-linecap:round;stroke-linejoin:round')}
                    />
                  </svg>
                </div>
                <div style={css('flex:1;font-size:14px;font-weight:500')}>{T(h?.name)}</div>
                <div style={css('display:flex;align-items:center;gap:8px')}>
                  <div style={css(h?.dot)} />
                  <div style={css('font-size:12.5px;color:rgba(235,235,245,.6)')}>{T(h?.status)}</div>
                </div>
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
        <div style={css('padding:12px 22px 0;font-size:11px;line-height:1.6;color:rgba(235,235,245,.32)')}>
          Measured by hand at your Oct 5 visit · 52,431 mi. The app is not connected to the car.
        </div>
      </div>
    </>
  );
}
