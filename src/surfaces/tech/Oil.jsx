import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/service-scene.js';

export function Oil({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;height:100%;display:flex')}>
        <div
          style={css(
            'width:400px;flex:0 0 400px;border-right:1px solid rgba(235,235,245,.07);padding:30px 26px;display:flex;flex-direction:column',
          )}
        >
          <div
            onClick={vm.tgoToday}
            style={css('font-size:13px;color:#e0312b;cursor:pointer;display:inline-flex;align-items:center;gap:2px;font-weight:500')}
          >
            <svg viewBox="0 0 24 24" style={css('width:15px;height:15px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
            Today
          </div>
          <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:18px')}>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Bay 04 · WO-8851 · Oil change
            </div>
            <div style={css(`font-size:12px;font-weight:500;color:${vm.oilStatusColor ?? ''}`)}>{T(vm.oilStatusLabel)}</div>
          </div>
          <div style={css('font-size:26px;font-weight:600;letter-spacing:-.7px;margin-top:8px')}>2019 Toyota Tacoma</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:4px')}>
            Rennan Anderson · 61,840 mi · entered by the customer
          </div>
          <div className="sc-host-x" style={css('height:240px')}>
            <service-scene scene={'oil'} phase={vm.oilPhase} />
          </div>
          <div style={css('border-top:1px solid rgba(235,235,245,.09)')}>
            {L(vm.oilSteps).map((x, _i) => (
              <React.Fragment key={_i}>
                <div style={css('display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                  <div style={css(x?.dot)} />
                  <div style={css(`flex:1;font-size:12.5px;line-height:1.35;color:${x?.c ?? ''}`)}>{T(x?.t)}</div>
                  <div style={css('font-family:var(--data-font,inherit);font-size:11px;color:rgba(235,235,245,.4);flex:0 0 auto')}>
                    {T(x?.time)}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('flex:1')} />
          <div onClick={vm.oilNext} style={css(vm.oilCtaStyle)}>
            {T(vm.oilCta)}
          </div>
        </div>
        <div style={css('flex:1;min-width:0;padding:30px 34px;overflow-y:auto')} className="hidescroll">
          <div style={css('font-size:26px;font-weight:500;letter-spacing:-.4px')}>Fill record</div>
          <div style={css('font-size:14px;color:rgba(235,235,245,.5);margin-top:6px')}>
            Goes on the work order. Rennan sees a plain-language version on his phone.
          </div>
          <div style={css('margin-top:24px;font-size:14px;color:rgba(235,235,245,.5)')}>Viscosity</div>
          <div style={css('display:flex;gap:8px;margin-top:10px')}>
            {L(vm.oilVisc).map((v, _i) => (
              <React.Fragment key={_i}>
                <div onClick={v?.pick} style={css(v?.style)}>
                  {T(v?.label)}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('margin-top:22px;font-size:14px;color:rgba(235,235,245,.5)')}>Oil type</div>
          <div style={css('display:flex;gap:8px;margin-top:10px')}>
            {L(vm.oilTypes).map((v, _i) => (
              <React.Fragment key={_i}>
                <div onClick={v?.pick} style={css(v?.style)}>
                  {T(v?.label)}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px')}>
            <div>
              <div style={css('font-size:14px;color:rgba(235,235,245,.5)')}>Quarts</div>
              <div style={css('display:flex;gap:8px;margin-top:10px')}>
                <div
                  onClick={vm.oilQtsDown}
                  style={css(
                    'width:56px;height:64px;border-radius:14px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer',
                  )}
                >
                  −
                </div>
                <div
                  style={css(
                    'flex:1;height:64px;border-radius:14px;background:#141416;display:flex;align-items:baseline;justify-content:center;gap:6px;padding-top:14px',
                  )}
                >
                  <span style={css(`font-family:var(--data-font,inherit);font-size:30px;font-weight:300;color:${vm.oilQtsColor ?? ''}`)}>
                    {T(vm.oilQts)}
                  </span>
                  <span style={css('font-size:13px;color:rgba(235,235,245,.45)')}>qt</span>
                </div>
                <div
                  onClick={vm.oilQtsUp}
                  style={css(
                    'width:56px;height:64px;border-radius:14px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer',
                  )}
                >
                  +
                </div>
              </div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:8px')}>Spec 6.2 qt with filter · 2TR-FE</div>
            </div>
            <div>
              <div style={css('font-size:14px;color:rgba(235,235,245,.5)')}>Drain plug torque</div>
              <div style={css('display:flex;gap:8px;margin-top:10px')}>
                <div
                  onClick={vm.oilTorqueDown}
                  style={css(
                    'width:56px;height:64px;border-radius:14px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer',
                  )}
                >
                  −
                </div>
                <div
                  style={css(
                    'flex:1;height:64px;border-radius:14px;background:#141416;display:flex;align-items:baseline;justify-content:center;gap:6px;padding-top:14px',
                  )}
                >
                  <span style={css(`font-family:var(--data-font,inherit);font-size:30px;font-weight:300;color:${vm.oilTorqueColor ?? ''}`)}>
                    {T(vm.oilTorque)}
                  </span>
                  <span style={css('font-size:13px;color:rgba(235,235,245,.45)')}>lb-ft</span>
                </div>
                <div
                  onClick={vm.oilTorqueUp}
                  style={css(
                    'width:56px;height:64px;border-radius:14px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer',
                  )}
                >
                  +
                </div>
              </div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:8px')}>Spec 30 lb-ft · new crush washer every time</div>
            </div>
          </div>
          <div style={css('margin-top:22px;font-size:14px;color:rgba(235,235,245,.5)')}>Oil filter</div>{' '}
          <input
            value={val(vm.oilFilter)}
            onChange={vm.onOilFilter}
            style={css(
              'margin-top:10px;width:100%;background:#141416;border:none;border-radius:14px;padding:18px 18px;color:#fff;font-size:16px;font-family:var(--data-font,inherit);outline:none',
            )}
          />{' '}
          <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:8px')}>
            Toyota OE · 14 in stock · scanned from the box or typed
          </div>
          <div style={css('margin-top:22px;font-size:14px;color:rgba(235,235,245,.5)')}>Notes</div>{' '}
          <textarea
            placeholder="Optional. Customers see a plain-language version."
            style={css(
              'margin-top:10px;width:100%;min-height:80px;resize:none;background:#141416;border:none;border-radius:14px;padding:16px 18px;color:#fff;font-size:15px;line-height:1.5;outline:none;font-family:inherit',
            )}
          />{' '}
          <div
            style={css('margin-top:22px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px')}
          >
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Rennan sees
            </div>
            <div style={css('font-size:14px;line-height:1.55;margin-top:8px;color:rgba(235,235,245,.85)')}>{T(vm.oilCustomerText)}</div>
          </div>
        </div>
      </div>
    </>
  );
}
