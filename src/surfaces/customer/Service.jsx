import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/service-scene.js';

export function Service({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 112px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goHome}
            style={css('width:60px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Service</div>
          <div onClick={vm.goMessages} style={css('width:60px;text-align:right;font-size:12px;color:#e0312b;cursor:pointer')}>
            Message
          </div>
        </div>
        {vm.noService ? (
          <>
            <div style={css('padding:calc(var(--sat) + 13px) 30px 0;text-align:center')}>
              <div
                style={css(
                  'width:56px;height:56px;border-radius:28px;background:#1c1c1e;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#30d158',
                )}
              >
                <svg viewBox="0 0 24 24" style={css('width:24px;height:24px;display:block;flex:0 0 auto')}>
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    style={css('fill:none;stroke:currentColor;stroke-width:2.2px;stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
              </div>
              <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px;margin-top:18px')}>No active service</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                Your vehicles are looking good.
              </div>{' '}
              <div
                onClick={vm.goBook}
                style={css(
                  'margin-top:26px;display:inline-block;padding:13px 26px;border-radius:11px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                Book service
              </div>
            </div>
          </>
        ) : null}
        {vm.hasService ? (
          <>
            <div style={css('height:196px')} />
            <div style={css('padding:6px 22px 0;text-align:center')}>
              <div style={css('font-size:26px;font-weight:600;letter-spacing:-.7px')}>{vm.svcCarName || 'Quicksilver'}</div>{' '}
              <div style={css(vm.svcKickerStyle)}>{T(vm.svcKicker)}</div>{' '}
              <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:6px')}>
                {(vm.svcCarSub || '2022 Tesla Model Y') + ' · '}
                {T(vm.odoLabel)}
              </div>
            </div>
            {vm.showRings === false ? null : (<>
            <div
              style={css(
                'margin:20px 18px 0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px;display:flex;align-items:center;gap:18px',
              )}
            >
              <div style={css('position:relative;width:124px;height:124px;flex:0 0 auto')}>
                <svg viewBox="0 0 120 120" style={css('width:124px;height:124px;display:block;transform:rotate(-90deg)')}>
                  <circle
                    cx="60"
                    cy="60"
                    r="58.5"
                    style={css('fill:none;stroke:rgba(255,255,255,.16);stroke-width:3;stroke-dasharray:1 2.675')}
                  />{' '}
                  {L(vm.rings).map((g, _i) => (
                    <React.Fragment key={_i}>
                      {' '}
                      <circle cx="60" cy="60" r={g?.r} style={css(g?.track)} /> <circle cx="60" cy="60" r={g?.r} style={css(g?.bar)} />{' '}
                    </React.Fragment>
                  ))}{' '}
                </svg>{' '}
                <div
                  style={css(
                    'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--data-font,inherit);font-size:13px;font-weight:500;letter-spacing:0',
                  )}
                >
                  {T(vm.ringCenter)}
                </div>
              </div>
              <div style={css('flex:1;min-width:0;display:flex;flex-direction:column;gap:12px')}>
                {L(vm.rings).map((g, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css('display:flex;align-items:center;gap:10px')}>
                      <div style={css(g?.dot)} />
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css('font-size:13px;font-weight:500')}>{T(g?.name)}</div>
                        <div
                          style={css(
                            'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
                          )}
                        >
                          {T(g?.sub)}
                        </div>
                      </div>
                      <div style={css(`font-size:13px;font-weight:500;color:${g?.color ?? ''}`)}>{T(g?.pctLabel)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            </>)}
            <div style={css('padding:26px 22px 0;display:flex;align-items:center;justify-content:space-between')}>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                {T(vm.cardCounter)}
              </div>
              <div style={css('display:flex;gap:6px')}>
                <div onClick={vm.cardsPrev} style={css(vm.cardPrevStyle)}>
                  <svg viewBox="0 0 24 24" style={css('width:16px;height:16px;display:block;flex:0 0 auto')}>
                    <path
                      d="M15 6l-6 6 6 6"
                      style={css(
                        'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round',
                      )}
                    />
                  </svg>
                </div>
                <div onClick={vm.cardsNext} style={css(vm.cardNextStyle)}>
                  <svg viewBox="0 0 24 24" style={css('width:16px;height:16px;display:block;flex:0 0 auto')}>
                    <path
                      d="M9 6l6 6-6 6"
                      style={css(
                        'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round',
                      )}
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div
              ref={vm.cardsRef}
              onScroll={vm.onCardsScroll}
              style={css('display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px 18px 0;scroll-padding:0 18px')}
              className="hidescroll"
            >
              {L(vm.svcCards).map((c, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      'flex:0 0 300px;scroll-snap-align:start;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:26px 22px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;min-height:250px',
                    )}
                  >
                    {c?.scene ? (
                      <>
                        <div className="sc-host-x" style={css('width:100%;height:130px')}>
                          <service-scene scene={c?.scene} phase={c?.phase} />
                        </div>
                      </>
                    ) : null}
                    {c?.noScene ? (
                      <>
                        <div style={css(c?.iconStyle)}>
                          {c?.d ? (
                            <>
                              <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block')}>
                                <path
                                  d={c?.d}
                                  style={css(
                                    'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round',
                                  )}
                                />
                              </svg>
                            </>
                          ) : null}
                          {c?.txt ? <>{T(c?.txt)}</> : null}
                        </div>
                      </>
                    ) : null}
                    <div
                      style={css(
                        `font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;margin-top:18px;color:${c?.kColor ?? ''}`,
                      )}
                    >
                      {T(c?.k)}
                    </div>
                    <div
                      style={css('font-size:20px;font-weight:500;letter-spacing:-.4px;margin-top:8px;line-height:1.15;text-wrap:pretty')}
                    >
                      {T(c?.t)}
                    </div>
                    <div style={css('font-size:12.5px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:6px;text-wrap:pretty')}>
                      {T(c?.sub)}
                    </div>
                    <div style={css('flex:1')} />
                    {c?.cta ? (
                      <>
                        <div
                          onClick={c?.go}
                          style={css(
                            'margin-top:18px;padding:11px 22px;border-radius:10px;background:#fff;color:#000;font-size:12.5px;font-weight:500;cursor:pointer',
                          )}
                        >
                          {T(c?.cta)}
                        </div>
                      </>
                    ) : null}
                  </div>
                </React.Fragment>
              ))}
              <div style={css('flex:0 0 8px')} />
            </div>
            <div
              style={css(
                'padding:28px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Timeline
            </div>
            <div style={css('padding:14px 22px 0')}>
              {L(vm.timeline).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('display:flex;gap:14px')}>
                    <div style={css('width:14px;display:flex;flex-direction:column;align-items:center;padding-top:4px')}>
                      <div style={css(t?.dotStyle)} />
                      <div style={css(t?.lineStyle)} />
                    </div>
                    <div style={css('padding-bottom:22px;flex:1')}>
                      <div style={css('font-family:var(--data-font,inherit);font-size:10.5px;color:rgba(235,235,245,.35)')}>
                        {T(t?.time)}
                      </div>{' '}
                      <div style={css(`font-size:14px;font-weight:500;margin-top:4px;color:${t?.color ?? ''}`)}>{T(t?.name)}</div>{' '}
                      {t?.desc ? (
                        <>
                          <div style={css('font-size:12.5px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:4px')}>{T(t?.desc)}</div>
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
    </>
  );
}
