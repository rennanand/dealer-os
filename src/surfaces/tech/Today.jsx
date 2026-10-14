import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/service-scene.js';

export function Today({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:30px 34px;height:100%;overflow-y:auto')} className="hidescroll">
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end')}>
          <div>
            <div style={css('font-size:36px;font-weight:600;letter-spacing:-1.1px')}>Today's Work</div>
            <div style={css('font-size:14px;color:rgba(235,235,245,.5);margin-top:6px')}>
              Monday, October 5 · Marcus T. · 4 vehicles assigned
            </div>
          </div>
          <div style={css('display:flex;gap:8px')}>
            {L(vm.padStats).map((x, _i) => (
              <React.Fragment key={_i}>
                <div style={css('background:#1c1c1e;border-radius:12px;padding:12px 16px;min-width:96px')}>
                  <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px')}>{T(x?.n)}</div>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:3px',
                    )}
                  >
                    {T(x?.l)}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:28px')}>
          {L(vm.bays).map((b, _i) => (
            <React.Fragment key={_i}>
              <div onClick={b?.go} style={css(b?.style)}>
                <div style={css('display:flex;gap:22px;align-items:stretch')}>
                  <div style={css('width:176px;flex:0 0 176px')}>
                    {b?.scene ? (
                      <>
                        <div className="sc-host-x" style={css('width:176px;height:132px')}>
                          <service-scene scene={b?.scene} phase={b?.phase} />
                        </div>
                      </>
                    ) : null}{' '}
                    {b?.noScene ? (
                      <>
                        <div style={css(`height:132px;border-radius:12px;${b?.ph ?? ''}`)}>{T(b?.shot)}</div>
                      </>
                    ) : null}
                  </div>
                  <div style={css('flex:1;min-width:0;display:flex;flex-direction:column')}>
                    <div style={css('display:flex;justify-content:space-between;align-items:center')}>
                      <div
                        style={css(
                          'font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.5)',
                        )}
                      >
                        {T(b?.bay)}
                      </div>
                      <div style={css(b?.dot)} />
                    </div>
                    <div style={css('font-size:19px;font-weight:500;margin-top:12px;letter-spacing:-.2px')}>{T(b?.car)}</div>
                    <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:4px')}>{T(b?.who)}</div>
                    <div style={css('flex:1')} />
                    <div style={css('display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:16px')}>
                      <div style={css('font-size:14px;font-weight:500')}>{T(b?.job)}</div>
                      <div style={css(`font-size:12.5px;font-weight:500;text-align:right;color:${b?.color ?? ''}`)}>{T(b?.status)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        {vm.releaseReady ? (
          <>
            <div
              style={css(
                'margin-top:18px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 22px;display:flex;align-items:center;gap:16px;animation:sIn .3s ease',
              )}
            >
              <div style={css('width:10px;height:10px;border-radius:5px;background:#30d158;box-shadow:0 0 0 4px rgba(48,209,88,.18)')} />
              <div style={css('flex:1')}>
                <div style={css('font-size:16px;font-weight:500')}>Rennan Anderson is here for Quicksilver</div>
                <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:3px')}>
                  Paid $545.23 · Bay 4 · Release when the vehicle is out front.
                </div>
              </div>
              <div
                onClick={vm.releaseVehicle}
                style={css('padding:14px 22px;border-radius:12px;background:#fff;color:#000;font-size:14px;font-weight:500;cursor:pointer')}
              >
                Release vehicle
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
