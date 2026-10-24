import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Approve({ vm }) {
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Service plan</div>
          <div style={css('width:30px')} />
        </div>
        {vm.approvedNow ? (
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
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;margin-top:22px')}>Approved.</div>
              <div style={css('font-size:13.5px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:8px')}>
                {'You approved '}
                {T(vm.approveTotal)}. Your technician has been notified and the parts are in stock.
              </div>{' '}
              <div
                onClick={vm.goService}
                style={css(
                  'margin-top:28px;display:inline-block;padding:13px 26px;border-radius:11px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                Track repair
              </div>
            </div>
          </>
        ) : null}
        {vm.notApproved ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>Your service plan</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                Nothing is charged today. You pay when the work is done.
              </div>
            </div>
            <div style={css('padding:20px 18px 0;display:flex;flex-direction:column;gap:10px')}>
              {L(vm.planItems).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={p?.toggle} style={css(p?.style)}>
                    <div style={css(p?.box)}>
                      {p?.on ? (
                        <>
                          <svg viewBox="0 0 24 24" style={css('width:12px;height:12px;display:block;flex:0 0 auto')}>
                            <path
                              d="M5 12.5l4.5 4.5L19 7"
                              style={css('fill:none;stroke:currentColor;stroke-width:2.6px;stroke-linecap:round;stroke-linejoin:round')}
                            />
                          </svg>
                        </>
                      ) : null}
                    </div>{' '}
                    <div style={css('flex:1')}>
                      <div
                        style={css(
                          'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                        )}
                      >
                        {T(p?.tier)}
                      </div>
                      <div style={css('font-size:14.5px;font-weight:500;margin-top:4px')}>{T(p?.name)}</div>
                    </div>
                    <div style={css('font-size:14px')}>{T(p?.price)}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('padding:22px 24px 0;display:flex;justify-content:space-between;align-items:baseline')}>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Total</div>
              <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px;transition:all .3s ease')}>{T(vm.approveTotal)}</div>
            </div>
            <div style={css('padding:6px 24px 0;font-size:11px;line-height:1.6;color:rgba(235,235,245,.35)')}>
              {'Parts and labor. Shop supplies and tax are added at checkout, estimated at '}
              {T(vm.approveTax)}.
            </div>
          </>
        ) : null}
      </div>
      {vm.notApproved ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);display:flex;gap:10px;z-index:6',
            )}
          >
            <div
              onClick={vm.goMessages}
              style={css(
                'flex:0 0 40%;text-align:center;padding:15px 0;border-radius:12px;background:#1c1c1e;font-size:13px;font-weight:500;color:#fff;cursor:pointer',
              )}
            >
              Ask a question
            </div>
            <div onClick={vm.approve} style={css(vm.approveBtnStyle)}>
              {'Approve '}
              {T(vm.approveTotal)}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
