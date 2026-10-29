import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Pickup({ vm }) {
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Pickup</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>{T(vm.pickupTitle)}</div>
          <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>{T(vm.pickupSub)}</div>
        </div>
        <div style={css('margin:12px 6px 0;height:190px;position:relative')}>
          <div
            style={css(
              'position:absolute;top:8px;left:18px;background:rgba(0,0,0,.6);backdrop-filter:blur(10px);border-radius:6px;padding:5px 9px;font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#30d158;pointer-events:none',
            )}
          >
            {vm.pickupBayLabel || 'Ready for pickup · Bay 4'}
          </div>
        </div>
        <div style={css('margin:14px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
            <span style={css('font-size:13px;color:rgba(235,235,245,.6)')}>Location</span>
            <span style={css('font-size:13px')}>{vm.pickupBay || 'Bay 4'}</span>
          </div>
          <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
            <span style={css('font-size:13px;color:rgba(235,235,245,.6)')}>Hours today</span>
            <span style={css('font-size:13px')}>{vm.pickupHours || 'Until 6:00 PM'}</span>
          </div>
          <div style={css('padding:13px 0;display:flex;justify-content:space-between')}>
            <span style={css('font-size:13px;color:rgba(235,235,245,.6)')}>Payment</span>
            <span style={css('font-size:13px;color:#30d158')}>{vm.pickupPay || 'Paid · $545.23'}</span>
          </div>
        </div>
        {vm.pickupLoaner ? (
          <>
            <div
              onClick={vm.goLoanerReturn}
              style={css(
                'margin:12px 18px 0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer',
              )}
            >
              <div style={css('flex:1')}>
                <div style={css('font-size:13px;font-weight:500')}>Return loaner</div>
                <div style={css('font-size:11px;color:rgba(235,235,245,.42);margin-top:4px')}>
                  Your loaner can be returned when you arrive.
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
          </>
        ) : null}
        <div style={css('padding:22px 18px 0')}>
          {vm.pickup0 ? (
            <>
              <div
                onClick={vm.onMyWay}
                style={css(
                  'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                I'm on my way
              </div>
            </>
          ) : null}
          {vm.pickup1 ? (
            <>
              <div
                style={css('text-align:center;font-size:12.5px;color:rgba(235,235,245,.5);padding-bottom:14px;animation:fadeIn .3s ease')}
              >
                We'll let the team know you're coming.
              </div>
              <div
                onClick={vm.imHere}
                style={css(
                  'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                I'm here
              </div>
            </>
          ) : null}
          {vm.pickup2 ? (
            <>
              <div
                style={css(
                  'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px;display:flex;align-items:center;gap:12px;animation:fadeIn .3s ease',
                )}
              >
                <div style={css('width:10px;height:10px;border-radius:5px;background:#e0312b;box-shadow:0 0 0 4px rgba(224,49,43,.22)')} />
                <div style={css('flex:1;font-size:13px;line-height:1.4')}>
                  {vm.pickupHereSub || "The team is bringing Quicksilver around. They'll release it from the bay in a moment."}
                </div>
              </div>
            </>
          ) : null}
          {vm.pickupDone ? (
            <>
              <div style={css('text-align:center;padding:10px 0;animation:pop .5s cubic-bezier(.2,.8,.2,1)')}>
                <div style={css('font-size:22px;font-weight:500')}>Released. Drive safe.</div>
                <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:6px')}>
                  Your report and receipt are in History.
                </div>{' '}
                <div
                  onClick={vm.goRate}
                  style={css(
                    'margin-top:18px;display:inline-block;padding:12px 24px;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                  )}
                >
                  Rate your visit
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
