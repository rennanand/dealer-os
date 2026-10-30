import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Reserve({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:linear-gradient(180deg,rgba(10,10,14,.72),rgba(10,10,14,.42));backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 -1px 0 rgba(255,255,255,.06);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.resBack}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>{T(vm.resNavTitle)}</div>
          <div style={css('width:30px')} />
        </div>
        {vm.rs0 ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>Reserve your vehicle</div>
              <div style={css('font-size:14px;margin-top:10px')}>{T(vm.sel?.name)}</div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.sel?.price)}</div>
            </div>
            <div
              style={css('margin:22px 18px 0;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:20px')}
            >
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                Reservation deposit
              </div>
              <div style={css('font-size:40px;font-weight:500;letter-spacing:-1px;margin-top:6px')}>$250</div>
              <div style={css('font-size:13px;line-height:1.55;color:rgba(235,235,245,.7);margin-top:10px')}>
                Place a $250 reservation deposit to begin the vehicle purchase process.
              </div>
            </div>
            <div style={css('margin:12px 18px 0;border:1px solid rgba(235,235,245,.1);border-radius:14px;padding:16px')}>
              <div style={css('font-size:13px;font-weight:500')}>Reservation terms</div>
              <div style={css('font-size:12.5px;line-height:1.6;color:rgba(235,235,245,.6);margin-top:8px')}>{T(vm.policyText)}</div>
            </div>
          </>
        ) : null}
        {vm.rs1 ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>Checkout</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                You are paying $250 today. The vehicle price is not charged now.
              </div>
            </div>
            <div style={css('margin:20px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              <div
                style={css(
                  'padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:12px',
                )}
              >
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Vehicle</span>
                <span style={css('font-size:13px;text-align:right')}>
                  {T(vm.sel?.name)}
                  <br />
                  <span style={css('color:rgba(235,235,245,.5)')}>{T(vm.sel?.price)}</span>
                </span>
              </div>
              <div style={css('padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Reservation deposit</span>
                <span style={css('font-size:13px')}>$250.00</span>
              </div>
              <div style={css('padding:14px 0;display:flex;justify-content:space-between;align-items:baseline')}>
                <span style={css('font-size:14px;font-weight:500')}>Due today</span>
                <span style={css('font-size:22px;font-weight:600;letter-spacing:-.5px')}>$250.00</span>
              </div>
            </div>
            <div
              style={css(
                'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Payment method
            </div>
            <div style={css('padding:10px 18px 0;display:flex;flex-direction:column;gap:8px')}>
              {L(vm.resPayMethods).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={p?.pick} style={css(p?.style)}>
                    <div style={css('flex:1;font-size:14px;font-weight:500')}>{T(p?.name)}</div>
                    <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(p?.sub)}</div>
                    <div style={css(p?.radio)} />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        {vm.rs2 ? (
          <>
            <div style={css('padding:30px 22px 0;text-align:center;animation:pop .5s cubic-bezier(.2,.8,.2,1)')}>
              <div style={css('font-size:38px;font-weight:600;letter-spacing:-1.2px')}>You're in.</div>
              <div style={css('font-size:13.5px;color:rgba(235,235,245,.55);margin-top:8px')}>Your vehicle has been reserved.</div>
            </div>
            <div style={css('margin:22px 18px 0;height:170px')} />
            <div style={css('padding:16px 22px 0;text-align:center')}>
              <div style={css('font-size:18px;font-weight:500')}>{T(vm.sel?.name)}</div>
              <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px')}>
                {T(vm.sel?.trim)}
                {' · '}
                {T(vm.sel?.milesLabel)}
                {' miles'}
              </div>
            </div>
            <div style={css('margin:18px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              <div style={css('padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Reservation deposit</span>
                <span style={css('font-size:13px;font-weight:500')}>$250</span>
              </div>
              <div style={css('padding:14px 0;display:flex;justify-content:space-between;align-items:baseline')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Reservation ID</span>
                <span style={css('font-size:20px;font-weight:500;letter-spacing:-.2px')}>RES-20481</span>
              </div>
            </div>
            <div style={css('padding:24px 22px 0;font-size:14px;font-weight:500')}>What happens next?</div>
            <div style={css('padding:14px 22px 0')}>
              {L(vm.nextSteps).map((n, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('display:flex;gap:14px')}>
                    <div style={css('width:22px;display:flex;flex-direction:column;align-items:center')}>
                      <div style={css(n?.num)}>{T(n?.i)}</div>
                      <div style={css(n?.line)} />
                    </div>
                    <div style={css('padding-bottom:18px;flex:1')}>
                      <div style={css('font-size:13.5px;font-weight:500;padding-top:2px')}>{T(n?.t)}</div>
                      {n?.d ? (
                        <>
                          <div style={css('font-size:12px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:3px')}>{T(n?.d)}</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);display:flex;gap:10px;z-index:6',
        )}
      >
        {vm.rs2 ? (
          <>
            <div
              onClick={vm.goAsk}
              style={css(
                'flex:0 0 46%;text-align:center;padding:15px 0;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,.085));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -1px 0 rgba(0,0,0,.22),0 8px 20px -8px rgba(0,0,0,.55);font-size:13px;font-weight:500;color:#fff;cursor:pointer',
              )}
            >
              Contact our team
            </div>
          </>
        ) : null}
        <div
          onClick={vm.resNext}
          style={css(
            'flex:1;text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
          )}
        >
          {T(vm.resCta)}
        </div>
      </div>
    </>
  );
}
