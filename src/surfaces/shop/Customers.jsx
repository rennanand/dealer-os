import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Customers({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
        <div style={css('flex:1;min-width:0')}>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Customers</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>412 customers · 6 active today</div>
          <div style={css('margin-top:22px;border-top:1px solid rgba(235,235,245,.09)')}>
            <div
              style={css(
                'display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;padding:12px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);border-bottom:1px solid rgba(235,235,245,.07)',
              )}
            >
              <div>Customer</div>
              <div>Vehicles</div>
              <div>Visits</div>
              <div>Last visit</div>
              <div>Lifetime</div>
            </div>{' '}
            {L(vm.customers).map((c, _i) => (
              <React.Fragment key={_i}>
                {' '}
                <div onClick={c?.open} style={css(c?.style)}>
                  <div style={css('display:flex;align-items:center;gap:12px')}>
                    <div
                      style={css(
                        'width:32px;height:32px;border-radius:16px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:11px',
                      )}
                    >
                      {T(c?.initials)}
                    </div>
                    <div style={css('font-weight:500')}>{T(c?.name)}</div>
                  </div>
                  <div style={css('color:rgba(235,235,245,.7)')}>{T(c?.vehicles)}</div>
                  <div style={css('color:rgba(235,235,245,.7)')}>{T(c?.visits)}</div>
                  <div style={css('color:rgba(235,235,245,.7)')}>{T(c?.last)}</div>
                  <div>{T(c?.ltv)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div
          style={css(
            'width:380px;flex:0 0 380px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:24px;display:flex;flex-direction:column;gap:18px',
          )}
        >
          <div style={css('display:flex;align-items:center;gap:14px')}>
            <div
              style={css(
                'width:46px;height:46px;border-radius:23px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:14px',
              )}
            >
              {T(vm.cust?.initials)}
            </div>
            <div>
              <div style={css('font-size:20px;font-weight:500;letter-spacing:-.3px')}>{T(vm.cust?.name)}</div>
              <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.cust?.meta)}</div>
            </div>
          </div>
          <div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Vehicles
            </div>
            {L(vm.cust?.cars).map((v, _i) => (
              <React.Fragment key={_i}>
                <div style={css('display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                  <div style={css('font-size:13px')}>{T(v?.n)}</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{T(v?.s)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Recent visits
            </div>
            {L(vm.cust?.visitsList).map((v, _i) => (
              <React.Fragment key={_i}>
                <div style={css('display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                  <div style={css('font-size:13px')}>{T(v?.t)}</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{T(v?.d)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('flex:1')} />
          <div style={css('display:flex;gap:8px')}>
            <div
              onClick={vm.dgoInbox}
              style={css(
                'flex:1;text-align:center;padding:12px 0;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
              )}
            >
              Message
            </div>
            <div
              onClick={vm.dgoCustomer}
              style={css(
                'flex:1;text-align:center;padding:12px 0;border-radius:10px;background:rgba(235,235,245,.1);font-size:13px;font-weight:500;cursor:pointer',
              )}
            >
              Full record
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
