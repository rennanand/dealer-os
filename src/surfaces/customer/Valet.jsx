import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Valet({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:52px 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goHome}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>{'Pickup & delivery'}</div>
          <div style={css('width:30px')} />
        </div>
        {vm.vl0 ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15')}>We’ll come get Quicksilver.</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                A RyGuys driver picks it up, we do the work, and we bring it back. No charge within 15 miles.
              </div>
            </div>
            <div style={css('margin:22px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.valetRows).map((r, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      'padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:14px',
                    )}
                  >
                    <span style={css('font-size:13px;color:rgba(235,235,245,.5);flex:0 0 auto')}>{T(r?.k)}</span>
                    <span style={css('font-size:13px;text-align:right;line-height:1.4')}>{T(r?.v)}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div
              style={css(
                'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Keys
            </div>
            <div style={css('padding:10px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
              {L(vm.valetKeys).map((k, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={k?.pick} style={css(k?.style)}>
                    {T(k?.label)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        {vm.vl12 ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css(vm.valetPill)}>{T(vm.valetKicker)}</div>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15;margin-top:12px')}>
                {T(vm.valetTitle)}
              </div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>{T(vm.valetSub)}</div>
            </div>
            <div
              style={css(
                'margin:20px 18px 0;height:200px;border-radius:16px;position:relative;overflow:hidden;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);background:radial-gradient(ellipse at 30% 40%,#1d1f23 0%,#121214 60%,#0b0b0c 100%)',
              )}
            >
              <div
                style={css(
                  'position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:28px 28px',
                )}
              />
              <div
                style={css(
                  'position:absolute;left:14px;bottom:12px;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);color:rgba(235,235,245,.35)',
                )}
              >
                Map · Manti, UT
              </div>{' '}
              <div
                style={css(
                  `position:absolute;top:12px;right:12px;background:rgba(0,0,0,.55);backdrop-filter:blur(10px);${vm.valetMapPill ?? ''}`,
                )}
              >
                {T(vm.valetEta)}
              </div>{' '}
              <div style={css(vm.valetCarStyle)} />{' '}
              <div
                style={css(
                  'position:absolute;right:22%;bottom:34%;width:12px;height:12px;border-radius:6px;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.15)',
                )}
              />
            </div>
            <div
              style={css(
                'margin:14px 18px 0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:14px 16px;display:flex;align-items:center;gap:14px',
              )}
            >
              <div
                style={css(
                  'width:44px;height:44px;border-radius:22px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600',
                )}
              >
                LA
              </div>
              <div style={css('flex:1;min-width:0')}>
                <div style={css('font-size:14px;font-weight:600')}>Luis A.</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>
                  RyGuys driver · White Ford Transit · UT 4RG 221
                </div>
              </div>
              <div
                onClick={vm.goMessages}
                style={css(
                  'width:38px;height:38px;border-radius:19px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff',
                )}
              >
                <svg viewBox="0 0 24 24" style={css('width:16px;height:16px;display:block;flex:0 0 auto')}>
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
              </div>
            </div>
            <div style={css('padding:22px 22px 0')}>
              {L(vm.valetSteps).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('display:flex;gap:14px')}>
                    <div style={css('width:14px;display:flex;flex-direction:column;align-items:center;padding-top:4px')}>
                      <div style={css(t?.dotStyle)} />
                      <div style={css(t?.lineStyle)} />
                    </div>
                    <div style={css('padding-bottom:18px;flex:1;display:flex;justify-content:space-between;gap:12px')}>
                      <div style={css(`font-size:14px;font-weight:500;color:${t?.color ?? ''}`)}>{T(t?.name)}</div>
                      <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(t?.time)}</div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        {vm.vl3 ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15')}>Handoff</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                Luis takes four condition photos with you before he drives off. They’re attached to your work order.
              </div>
            </div>
            <div style={css('height:190px')} />
            <div style={css('margin:0 22px;border-top:1px solid rgba(235,235,245,.09)')}>
              <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Mileage</span>
                <span style={css('font-size:13px')}>52,431</span>
              </div>
              <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Charge</span>
                <span style={css('font-size:13px')}>64%</span>
              </div>
              <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Keys</span>
                <span style={css('font-size:13px')}>{T(vm.valetKeyLabel)}</span>
              </div>
            </div>
            <div
              style={css(
                'padding:20px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Condition photos
            </div>
            <div style={css('padding:10px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
              {L(vm.valetShots).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={p?.take} style={css(p?.style)}>
                    {T(p?.t)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px 30px;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
        )}
      >
        <div onClick={vm.valetNext} style={css(vm.valetCtaStyle)}>
          {T(vm.valetCta)}
        </div>
      </div>
    </>
  );
}
