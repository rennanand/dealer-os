import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function LoanerCheckout({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Your loaner</div>
          <div style={css('width:30px')} />
        </div>
        {vm.loanerAccepted ? (
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
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;margin-top:22px')}>Keys are yours</div>
              <div style={css('font-size:13.5px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:8px')}>
                {'Handoff recorded at '}
                {T(vm.handoffAt)}. Tyler set up your phone key. Return it when Quicksilver is ready.
              </div>
              <div style={css('margin-top:28px;display:flex;flex-direction:column;gap:10px;align-items:center')}>
                <div
                  onClick={vm.goGuide}
                  style={css(
                    'padding:13px 26px;border-radius:11px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                  )}
                >
                  {'Get to know your '}
                  {T(vm.lv?.short)}
                </div>
                <div
                  onClick={vm.goService}
                  style={css('padding:13px 26px;border-radius:11px;background:#1c1c1e;font-size:13px;font-weight:500;cursor:pointer')}
                >
                  Back to Service
                </div>
              </div>
            </div>
          </>
        ) : null}
        {vm.loanerPending ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>{T(vm.lv?.car)}</div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:6px')}>
                Agreement signed. Review the vehicle, then accept to record the handoff.
              </div>
            </div>
            <div style={css('margin:18px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.loanerRows).map((r, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css('padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}
                  >
                    <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>{T(r?.k)}</span>
                    <span style={css('font-size:13px')}>{T(r?.v)}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div
              style={css(
                'padding:20px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Condition photos · taken this morning
            </div>
            <div style={css('display:flex;gap:8px;overflow-x:auto;padding:10px 22px 0')} className="hidescroll">
              {L(vm.loanerShots).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div style={css(`flex:0 0 150px;height:104px;border-radius:11px;${p?.ph ?? ''}`)}>{T(p?.t)}</div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
      </div>
      {vm.loanerPending ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
            )}
          >
            <div
              onClick={vm.acceptLoaner}
              style={css(
                'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
              )}
            >
              Accept vehicle
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
