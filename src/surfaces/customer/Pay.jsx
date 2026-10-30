import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Pay({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.88);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Checkout</div>
          <div style={css('width:30px')} />
        </div>
        {vm.paidNow ? (
          <>
            <div style={css('padding:calc(var(--sat) + 23px) 30px 0;text-align:center;animation:pop .5s cubic-bezier(.2,.8,.2,1)')}>
              <div
                style={css(
                  'width:72px;height:72px;border-radius:36px;background:#30d158;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#000',
                )}
              >
                <svg viewBox="0 0 24 24" style={css('width:32px;height:32px;display:block;flex:0 0 auto')}>
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    style={css('fill:none;stroke:currentColor;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
              </div>
              <div style={css('font-size:28px;font-weight:500;letter-spacing:-.5px;margin-top:22px')}>You're all set.</div>
              <div style={css('font-size:13.5px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:8px')}>
                Your receipt has been saved to your vehicle history.
              </div>{' '}
              <div
                onClick={vm.payDoneGo}
                style={css(
                  'margin-top:28px;display:inline-block;padding:13px 26px;border-radius:11px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                {T(vm.payDoneCta)}
              </div>
            </div>
          </>
        ) : null}
        {vm.notPaid ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>{T(vm.payTitle)}</div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>{T(vm.paySub)}</div>
            </div>
            <div style={css('margin:18px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.invoice).map((r, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:12px',
                    )}
                  >
                    <span style={css('font-size:13px;color:rgba(235,235,245,.6)')}>{T(r?.k)}</span>
                    <span style={css('font-size:13px')}>{T(r?.v)}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('padding:20px 24px 0;display:flex;justify-content:space-between;align-items:baseline')}>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Total</div>
              <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>{T(vm.invoiceTotal)}</div>
            </div>
            <div
              style={css(
                'padding:24px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Payment method
            </div>
            <div style={css('padding:10px 18px 0;display:flex;flex-direction:column;gap:8px')}>
              {L(vm.payMethods).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={p?.pick} style={css(p?.style)}>
                    <div style={css('flex:1;font-size:14px;font-weight:500')}>{T(p?.name)}</div>
                    <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(p?.sub)}</div> <div style={css(p?.radio)} />
                  </div>
                </React.Fragment>
              ))}
            </div>
            {vm.payErr ? (
              <>
                <div
                  style={css(
                    'margin:16px 18px 0;background:rgba(255,69,58,.14);border-radius:12px;padding:13px 14px;animation:sIn .25s ease',
                  )}
                >
                  <div style={css('font-size:13px;font-weight:500;color:#ff8a80')}>Payment didn't go through</div>
                  <div style={css('font-size:12px;line-height:1.5;color:rgba(255,138,128,.85);margin-top:4px')}>{T(vm.payErr)}</div>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>
      {vm.notPaid ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
            )}
          >
            <div onClick={vm.pay} style={css(vm.payBtnStyle)}>
              {T(vm.payLabel)}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
