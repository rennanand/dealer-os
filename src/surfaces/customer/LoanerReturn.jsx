import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function LoanerReturn({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:linear-gradient(180deg,rgba(10,10,14,.72),rgba(10,10,14,.42));backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 -1px 0 rgba(255,255,255,.06);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Return loaner</div>
          <div style={css('width:30px')} />
        </div>
        {vm.returnDone ? (
          <>
            <div style={css('padding:calc(var(--sat) + 23px) 30px 0;text-align:center;animation:pop .5s cubic-bezier(.2,.8,.2,1)')}>
              <div
                style={css(
                  'width:72px;height:72px;border-radius:36px;background:#fff;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#000',
                )}
              >
                <svg viewBox="0 0 24 24" style={css('width:32px;height:32px;display:block;flex:0 0 auto')}>
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    style={css('fill:none;stroke:currentColor;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
              </div>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;margin-top:22px')}>Return complete</div>
              <div style={css('font-size:13.5px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:8px')}>
                {T(vm.returnDoneSub)}
              </div>{' '}
              <div
                onClick={vm.goService}
                style={css(
                  'margin-top:28px;display:inline-block;padding:13px 26px;border-radius:11px;background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,.085));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -1px 0 rgba(0,0,0,.22),0 8px 20px -8px rgba(0,0,0,.55);font-size:13px;font-weight:500;cursor:pointer',
                )}
              >
                Back to Service
              </div>
            </div>
          </>
        ) : null}
        {vm.returnPending ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>{T(vm.returnTitle)}</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>{T(vm.returnSub)}</div>
            </div>
            <div style={css('margin:18px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              <div style={css('padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Mileage</span>
                <span style={css('font-size:13px')}>{T(vm.lv?.milesIn)}</span>
              </div>
              <div style={css('padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Charge</span>
                <span style={css('font-size:13px')}>81%</span>
              </div>
              <div style={css('padding:14px 0;display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Condition</span>
                <span style={css('font-size:13px')}>Excellent</span>
              </div>
            </div>
            <div
              style={css(
                'padding:20px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Return photos
            </div>
            <div style={css('padding:10px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
              {L(vm.returnShots).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={p?.take} style={css(p?.style)}>
                    {T(p?.t)}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div
              onClick={vm.goGuide}
              style={css(
                'margin:22px 18px 0;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer',
              )}
            >
              <div style={css('flex:1')}>
                <div style={css('font-size:13px;font-weight:500')}>
                  {'How to drive your '}
                  {T(vm.lv?.short)}
                </div>
                <div style={css('font-size:11px;color:rgba(235,235,245,.42);margin-top:4px')}>
                  Phone key, one-pedal driving, charging, return.
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
      </div>
      {vm.returnPending ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
            )}
          >
            <div
              onClick={vm.completeReturn}
              style={css(
                'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
              )}
            >
              Complete return
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
