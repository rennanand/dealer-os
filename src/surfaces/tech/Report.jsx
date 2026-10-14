import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Report({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;height:100%;overflow-y:auto;padding:30px 34px')} className="hidescroll">
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
          Inspection
        </div>{' '}
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Customer report</div>
            <div style={css('font-size:14px;color:rgba(235,235,245,.5);margin-top:6px')}>
              What Rennan will see. Technical values stay on your side.
            </div>
          </div>
          {vm.reportReady ? (
            <>
              <div
                onClick={vm.sendReport}
                style={css('padding:14px 24px;border-radius:12px;background:#fff;color:#000;font-size:14px;font-weight:500;cursor:pointer')}
              >
                Send to Rennan
              </div>
            </>
          ) : null}
          {vm.reportSent ? (
            <>
              <div style={css('font-size:13px;font-weight:500;color:#30d158')}>Sent 9:41 AM</div>
            </>
          ) : null}
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:24px')}>
          {L(vm.reportCards).map((f, _i) => (
            <React.Fragment key={_i}>
              <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);overflow:hidden')}>
                <div style={css(`height:130px;position:relative;${f?.ph ?? ''}`)}>
                  {T(f?.shot)}
                  <div
                    style={css(
                      'position:absolute;left:12px;bottom:10px;font-size:22px;font-weight:500;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.6)',
                    )}
                  >
                    {T(f?.meas)}
                  </div>
                </div>{' '}
                <div style={css('padding:16px 18px 18px')}>
                  <div style={css('display:flex;align-items:center;gap:8px')}>
                    <div style={css(f?.dot)} />
                    <div
                      style={css('font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:rgba(235,235,245,.5)')}
                    >
                      {T(f?.tier)}
                    </div>
                  </div>
                  <div style={css('display:flex;justify-content:space-between;margin-top:8px')}>
                    <div style={css('font-size:16px;font-weight:500')}>{T(f?.name)}</div>
                    <div style={css('font-size:15px')}>{T(f?.price)}</div>
                  </div>
                  <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.7);margin-top:8px')}>{T(f?.plain)}</div>
                  <div
                    style={css(
                      'margin-top:12px;padding-top:12px;border-top:1px solid rgba(235,235,245,.08);font-size:11.5px;color:rgba(235,235,245,.4)',
                    )}
                  >
                    {'Tech: '}
                    {T(f?.tech)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
