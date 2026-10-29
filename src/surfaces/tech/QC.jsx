import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function QC({ vm }) {
  return (
    <>
      <div
        style={css('animation:sIn .28s ease;height:100%;overflow-y:auto;padding:30px 34px 120px;position:relative')}
        className="hidescroll"
      >
        <div
          onClick={vm.tgoJob}
          style={css('font-size:13px;color:#e0312b;cursor:pointer;display:inline-flex;align-items:center;gap:2px;font-weight:500')}
        >
          <svg viewBox="0 0 24 24" style={css('width:15px;height:15px;display:block;flex:0 0 auto')}>
            <path
              d="M15 6l-6 6 6 6"
              style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
            />
          </svg>
          Bay
        </div>{' '}
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;gap:20px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Quality check</div>
            <div style={css('font-size:14px;color:rgba(235,235,245,.5);margin-top:6px')}>
              Front brake service · done by Marcus T. · verified by Luis A.
            </div>
          </div>
          <div style={css('flex:1')} />
          <div className="sc-host-x" style={css('width:220px;height:110px')}>
            <service-scene scene={'battery'} phase={vm.qcScene} />
          </div>
          <div style={css('text-align:right')}>
            <div style={css('font-family:var(--data-font,inherit);font-size:36px;font-weight:300;letter-spacing:-1px;line-height:1')}>
              {T(vm.qcProgress)}
            </div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:6px',
              )}
            >
              checks passed
            </div>
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:24px')}>
          {L(vm.qcItems).map((q, _i) => (
            <React.Fragment key={_i}>
              <div onClick={q?.toggle} style={css(q?.style)}>
                <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:14px')}>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css('font-size:16px;font-weight:600')}>{T(q?.name)}</div>
                    <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.45')}>{T(q?.spec)}</div>
                  </div>
                  <div style={css(q?.box)}>
                    {q?.on ? (
                      <>
                        <svg viewBox="0 0 24 24" style={css('width:15px;height:15px;display:block;flex:0 0 auto')}>
                          <path
                            d="M5 12.5l4.5 4.5L19 7"
                            style={css('fill:none;stroke:currentColor;stroke-width:2.6px;stroke-linecap:round;stroke-linejoin:round')}
                          />
                        </svg>
                      </>
                    ) : null}
                  </div>
                </div>
                <div style={css('margin-top:14px;display:flex;align-items:baseline;gap:5px')}>
                  <div style={css(`font-size:24px;font-weight:500;letter-spacing:-.5px;color:${q?.vc ?? ''}`)}>{T(q?.value)}</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.4)')}>{T(q?.unit)}</div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          style={css(
            'margin-top:22px;display:flex;align-items:center;gap:14px;padding-top:18px;border-top:1px solid rgba(235,235,245,.09)',
          )}
        >
          <div style={css('flex:1;font-size:13px;line-height:1.5;color:rgba(235,235,245,.5)')}>{T(vm.qcNote)}</div>
          <div
            onClick={vm.qcFail}
            style={css(
              'padding:14px 20px;border-radius:12px;background:rgba(235,235,245,.1);font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap',
            )}
          >
            Send back to Marcus
          </div>
          <div onClick={vm.qcPass} style={css(vm.qcPassStyle)}>
            Pass · notify Rennan
          </div>
        </div>
      </div>
    </>
  );
}
