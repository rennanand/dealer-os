import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Care({ vm }) {
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>RyGuys Care</div>
          <div style={css('width:30px')} />
        </div>
        {vm.careJoined ? (
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
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;margin-top:22px')}>
                {'Welcome to Care '}
                {T(vm.careTierName)}
              </div>
              <div style={css('font-size:13.5px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:8px;text-wrap:pretty')}>
                {T(vm.careDoneSub)}
              </div>{' '}
              <div
                onClick={vm.goHome}
                style={css(
                  'margin-top:28px;display:inline-block;padding:13px 26px;border-radius:12px;background:#2a2a2e;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                Done
              </div>
            </div>
            <div
              style={css(
                'padding:30px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              What’s included
            </div>
            <div style={css('margin:8px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.carePerks).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;gap:10px;align-items:center;font-size:13.5px',
                    )}
                  >
                    <span style={css('color:#30d158;display:inline-flex')}>
                      <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                        <path
                          d="M5 12.5l4.5 4.5L19 7"
                          style={css('fill:none;stroke:currentColor;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')}
                        />
                      </svg>
                    </span>
                    {T(p?.t)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        {vm.careOpen ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15')}>Maintenance, handled.</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px;text-wrap:pretty')}>
                A monthly plan that covers routine service on Quicksilver. Cancel any time.
              </div>
            </div>
            <div style={css('padding:22px 22px 0;display:flex;justify-content:center')}>
              <div style={css('display:flex;background:#2a2a2e;border-radius:10px;padding:3px;gap:2px')}>
                {L(vm.careBills).map((b, _i) => (
                  <React.Fragment key={_i}>
                    <div onClick={b?.pick} style={css(b?.style)}>
                      {T(b?.label)}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={css('padding:18px 18px 0;display:flex;flex-direction:column;gap:10px')}>
              {L(vm.careTiers).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={t?.pick} style={css(t?.style)}>
                    <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
                      <div style={css('font-size:17px;font-weight:600')}>{T(t?.name)}</div>
                      <div style={css('display:flex;align-items:baseline;gap:3px')}>
                        <div style={css('font-size:24px;font-weight:500;letter-spacing:-.6px')}>{T(t?.price)}</div>
                        <div style={css('font-size:11px;color:rgba(235,235,245,.45)')}>{T(t?.per)}</div>
                      </div>
                    </div>
                    <div style={css('margin-top:14px;display:flex;flex-direction:column;gap:8px')}>
                      {L(t?.perks).map((p, _i1) => (
                        <React.Fragment key={_i1}>
                          <div style={css('display:flex;gap:9px;align-items:center;font-size:12.5px;color:rgba(235,235,245,.8)')}>
                            <span style={css('color:#30d158;display:inline-flex')}>
                              <svg viewBox="0 0 24 24" style={css('width:13px;height:13px;display:block;flex:0 0 auto')}>
                                <path
                                  d="M5 12.5l4.5 4.5L19 7"
                                  style={css('fill:none;stroke:currentColor;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')}
                                />
                              </svg>
                            </span>
                            {T(p?.t)}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('padding:16px 24px 0;font-size:11px;line-height:1.6;color:rgba(235,235,245,.35)')}>
              Billed to Apple Pay. Covers one vehicle. Work beyond the plan is billed at member rates.
            </div>
          </>
        ) : null}
      </div>
      {vm.careOpen ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
            )}
          >
            <div
              onClick={vm.joinCare}
              style={css(
                'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
              )}
            >
              {T(vm.careCta)}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
