import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/service-scene.js';

export function Home({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:58px 0 112px')}>
        <div style={css('padding:0 22px;display:flex;justify-content:space-between;align-items:center')}>
          <div style={css('font-size:14px;color:rgba(235,235,245,.55)')}>Good morning, Rennan.</div>
          <div style={css('display:flex;gap:9px')}>
            <div
              onClick={vm.goUpdates}
              style={css(
                'width:34px;height:34px;border-radius:17px;background:#141416;border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;color:rgba(235,235,245,.85)',
              )}
            >
              <svg viewBox="0 0 24 24" style={css('width:17px;height:17px;display:block;flex:0 0 auto')}>
                <path
                  d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"
                  style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                />
              </svg>
              {vm.hasUnread ? (
                <>
                  <span
                    style={css(
                      'position:absolute;top:4px;right:5px;width:7px;height:7px;border-radius:4px;background:#e0312b;box-shadow:0 0 0 2px #000',
                    )}
                  />
                </>
              ) : null}
            </div>
            <div
              onClick={vm.goAccount}
              style={css(
                'width:34px;height:34px;border-radius:17px;background:#141416;border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;letter-spacing:.4px;cursor:pointer;color:rgba(235,235,245,.9)',
              )}
            >
              RA
            </div>
          </div>
        </div>
        <div
          id="car-strip"
          onScroll={vm.onHeroScroll}
          style={css('display:flex;overflow-x:auto;scroll-snap-type:x mandatory;margin-top:14px;height:236px')}
          className="hidescroll"
        >
          {L(vm.myCars).map((car, _i) => (
            <React.Fragment key={_i}>
              <div style={css('flex:0 0 100%;scroll-snap-align:start;height:236px')} />
            </React.Fragment>
          ))}
        </div>
        {vm.multiCar ? (
          <>
            <div style={css('display:flex;justify-content:center;gap:6px;margin-top:10px')}>
              {L(vm.dots).map((d, _i) => (
                <React.Fragment key={_i}>
                  <div style={css(d?.style)} />
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        <div style={css('padding:14px 22px 0;text-align:center')}>
          <div style={css('font-size:30px;font-weight:600;letter-spacing:-.9px')}>{T(vm.car0?.name)}</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:6px')}>{T(vm.car0?.sub)}</div>
        </div>
        <div
          style={css(
            'margin:22px 18px 0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 18px 16px',
          )}
        >
          {vm.homeScene ? (
            <>
              <div className="sc-host-x" style={css('height:150px')}>
                <service-scene scene={vm.homeScene} phase={vm.homeScenePhase} />
              </div>
            </>
          ) : null}
          <div style={css('display:flex;align-items:center;gap:16px')}>
            {vm.homeRings ? (
              <>
                <div style={css('width:68px;height:68px;flex:0 0 auto;position:relative')}>
                  <svg viewBox="0 0 120 120" style={css('width:68px;height:68px;display:block;transform:rotate(-90deg)')}>
                    <circle
                      cx="60"
                      cy="60"
                      r="58.5"
                      style={css('fill:none;stroke:rgba(255,255,255,.14);stroke-width:3;stroke-dasharray:1 2.675')}
                    />
                    {L(vm.ringsMini).map((g, _i) => (
                      <React.Fragment key={_i}>
                        <circle cx="60" cy="60" r={g?.r} style={css(g?.track)} />
                        <circle cx="60" cy="60" r={g?.r} style={css(g?.bar)} />
                      </React.Fragment>
                    ))}
                  </svg>{' '}
                  <div
                    style={css(
                      'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--data-font,inherit);font-size:11px;font-weight:500',
                    )}
                  >
                    {T(vm.statusPct)}%
                  </div>
                </div>
              </>
            ) : null}
            <div style={css('flex:1;min-width:0')}>
              <div style={css(vm.homeKickerStyle)}>{T(vm.homeKicker)}</div>{' '}
              <div style={css('font-size:20px;font-weight:600;line-height:1.2;margin-top:10px;letter-spacing:-.4px;text-wrap:pretty')}>
                {T(vm.homeTitle)}
              </div>
              <div style={css('font-size:12.5px;line-height:1.45;color:rgba(235,235,245,.5);margin-top:5px')}>{T(vm.homeSub)}</div>
            </div>
          </div>
          {vm.homeRings ? (
            <>
              <div style={css('margin-top:16px;padding-top:14px;border-top:1px solid rgba(235,235,245,.07);display:flex')}>
                {L(vm.ringsMini).map((g, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css('flex:1;display:flex;align-items:center;gap:7px')}>
                      <div style={css(g?.dot)} />
                      <div style={css('font-size:11px;color:rgba(235,235,245,.6)')}>{T(g?.name)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : null}
          <div
            onClick={vm.homeGo}
            style={css(
              'margin-top:16px;text-align:center;padding:13px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
            )}
            className="px2"
          >
            {T(vm.homeCta)}
          </div>
        </div>
        <div style={css('padding:22px 22px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px')}>
          {L(vm.shortcuts).map((q, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={q?.go}
                style={css('display:flex;flex-direction:column;align-items:center;gap:8px;padding:6px 0;cursor:pointer')}
                className="px3"
              >
                <div
                  style={css(
                    'width:48px;height:48px;border-radius:24px;background:#141416;border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;color:rgba(235,235,245,.9)',
                  )}
                >
                  <svg viewBox="0 0 24 24" style={css('width:20px;height:20px;display:block;flex:0 0 auto')}>
                    <path
                      d={q?.d}
                      style={css(
                        'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round',
                      )}
                    />
                  </svg>
                </div>
                <div style={css('font-size:10.5px;color:rgba(235,235,245,.55)')}>{T(q?.label)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:28px 22px 0;display:flex;justify-content:space-between;align-items:baseline')}>
          <div
            style={css(
              'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
            )}
          >
            Next due
          </div>
          <div onClick={vm.goOdometer} style={css('font-size:11px;color:#e0312b;cursor:pointer;font-weight:500')}>
            {T(vm.odoLabel)}
            {' · Update'}
          </div>
        </div>
        <div style={css('margin:8px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.nextDue).map((r, _i) => (
            <React.Fragment key={_i}>
              <div onClick={r?.go} style={css('padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer')}>
                <div style={css('display:flex;justify-content:space-between;align-items:baseline;gap:12px')}>
                  <div style={css('font-size:14px;font-weight:500')}>{T(r?.name)}</div>
                  <div style={css(`font-size:12px;color:${r?.c ?? ''}`)}>{T(r?.due)}</div>
                </div>
                <div style={css('margin-top:9px;height:2px;border-radius:1px;background:rgba(235,235,245,.1);overflow:hidden')}>
                  <div style={css(r?.bar)} />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('margin:24px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
          <div
            onClick={vm.goCare}
            style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px;cursor:pointer')}
            className="px4"
          >
            <div style={css('display:flex;align-items:center;justify-content:space-between;color:rgba(235,235,245,.85)')}>
              <svg viewBox="0 0 24 24" style={css('width:18px;height:18px;display:block;flex:0 0 auto')}>
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                />
              </svg>
              <div style={css(vm.careTagStyle)}>{T(vm.careTag)}</div>
            </div>
            <div style={css('font-size:14px;font-weight:600;margin-top:16px')}>RyGuys Care</div>
            <div style={css('font-size:11.5px;color:rgba(235,235,245,.5);margin-top:3px;line-height:1.4')}>{T(vm.careSub)}</div>
          </div>
          <div
            onClick={vm.goRewards}
            style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px;cursor:pointer')}
            className="px4"
          >
            <div style={css('display:flex;align-items:center;justify-content:space-between;color:rgba(235,235,245,.85)')}>
              <svg viewBox="0 0 24 24" style={css('width:18px;height:18px;display:block;flex:0 0 auto')}>
                <path
                  d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"
                  style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                />
              </svg>
              <div style={css(vm.rewardsTagStyle)}>{T(vm.rewardsTier)}</div>
            </div>
            <div style={css('font-size:14px;font-weight:600;margin-top:16px')}>{T(vm.pointsLabel)}</div>
            <div style={css('font-size:11.5px;color:rgba(235,235,245,.5);margin-top:3px;line-height:1.4')}>{T(vm.rewardsSub)}</div>
          </div>
        </div>
        <div
          onClick={vm.goShop}
          style={css(
            'margin:24px 22px 0;padding:16px 0 0;border-top:1px solid rgba(235,235,245,.09);cursor:pointer;display:flex;align-items:center;gap:12px',
          )}
        >
          <div style={css('flex:1')}>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              {T(vm.promoKicker)}
            </div>
            <div style={css('font-size:14px;font-weight:500;margin-top:6px;line-height:1.3')}>{T(vm.promoTitle)}</div>
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
      </div>
    </>
  );
}
