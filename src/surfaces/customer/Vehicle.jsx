import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Vehicle({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .26s ease;padding-bottom:130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:linear-gradient(180deg,rgba(10,10,14,.72),rgba(10,10,14,.42));backdrop-filter:blur(30px) saturate(190%);-webkit-backdrop-filter:blur(30px) saturate(190%);box-shadow:inset 0 -1px 0 rgba(255,255,255,.06);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>{T(vm.sel?.short)}</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('height:236px')} />
        <div style={css('display:flex;gap:8px;overflow-x:auto;padding:0 22px')} className="hidescroll">
          {L(vm.gallery).map((g, _i) => (
            <React.Fragment key={_i}>
              <div style={css(`flex:0 0 150px;height:100px;border-radius:12px;${g?.ph ?? ''}`)}>{T(g?.t)}</div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:8px 22px 0;font-size:11px;color:rgba(235,235,245,.3)')}>
          {T(vm.galleryCount)}
          {' photos · drag the car to look around'}
        </div>
        <div style={css('padding:16px 22px 0')}>
          <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.1')}>{T(vm.sel?.name)}</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:6px')}>
            {T(vm.sel?.trim)}
            {' · '}
            {T(vm.sel?.milesLabel)}
            {' miles'}
          </div>
          <div style={css('display:flex;align-items:baseline;gap:12px;margin-top:14px')}>
            <div style={css('font-size:26px;font-weight:500;letter-spacing:-.4px')}>{T(vm.sel?.price)}</div>
            <div style={css(`font-size:12px;font-weight:500;color:${vm.sel?.availColor ?? ''}`)}>{T(vm.sel?.avail)}</div>
          </div>
          {vm.sel?.servicedHere ? (
            <>
              <div
                onClick={vm.toggleInvHist}
                style={css(
                  'margin-top:18px;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);backdrop-filter:blur(32px) saturate(200%);-webkit-backdrop-filter:blur(32px) saturate(200%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:15px 16px;cursor:pointer',
                )}
              >
                <div style={css('display:flex;align-items:center;gap:12px')}>
                  <div
                    style={css(
                      'width:34px;height:34px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center',
                    )}
                  >
                    <img src="/uploads/revyn.png" alt="" style={css('height:12px;width:auto')} />
                  </div>
                  <div style={css('flex:1')}>
                    <div style={css('font-size:14px;font-weight:500')}>Serviced here</div>
                    <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>
                      {T(vm.sel?.servicedHere)}
                      {' service records'}
                    </div>
                  </div>
                  <div style={css('font-size:12px;color:#e0312b;font-weight:500')}>{T(vm.invHistLabel)}</div>
                </div>
                {vm.invHistOpen ? (
                  <>
                    <div style={css('margin-top:12px;border-top:1px solid rgba(235,235,245,.07);animation:fadeIn .25s ease')}>
                      {L(vm.invHist).map((r, _i) => (
                        <React.Fragment key={_i}>
                          <div
                            style={css(
                              'padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:12px',
                            )}
                          >
                            <span style={css('font-size:12.5px;color:rgba(235,235,245,.55)')}>{T(r?.d)}</span>
                            <span style={css('font-size:12.5px;text-align:right')}>{T(r?.t)}</span>
                          </div>
                        </React.Fragment>
                      ))}
                      <div style={css('padding-top:10px;font-size:11px;color:rgba(235,235,245,.35)')}>
                        Every visit since 2024, with photos. This is a vehicle we actually know.
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
          <div
            style={css(
              'margin-top:14px;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
            )}
          >
            Overview
          </div>
          <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
            {L(vm.selSpecs).map((r, _i) => (
              <React.Fragment key={_i}>
                <div
                  style={css(
                    'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:12px',
                  )}
                >
                  <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>{T(r?.k)}</span>
                  <span style={css('font-size:13px')}>{T(r?.v)}</span>
                </div>
              </React.Fragment>
            ))}
            <div onClick={vm.toggleVin} style={css('padding:13px 0;display:flex;justify-content:space-between;gap:12px;cursor:pointer')}>
              <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>VIN</span>
              <span style={css(`font-size:13px;color:${vm.vinColor ?? ''}`)}>{T(vm.vinLabel)}</span>
            </div>
          </div>
          <div
            style={css(
              'margin-top:18px;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
            )}
          >
            Vehicle history
          </div>
          <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
            {L(vm.selHistory).map((r, _i) => (
              <React.Fragment key={_i}>
                <div
                  style={css(
                    'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:12px',
                  )}
                >
                  <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>{T(r?.k)}</span>
                  <span style={css('font-size:13px;text-align:right')}>{T(r?.v)}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('margin-top:8px;font-size:11px;line-height:1.6;color:rgba(235,235,245,.32)')}>
            Only information verified by RyGuys is shown.
          </div>
          <div style={css('margin-top:18px;border-top:1px solid rgba(235,235,245,.09)')}>
            <div
              onClick={vm.goAsk}
              style={css(
                'padding:15px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:12px;cursor:pointer',
              )}
            >
              <div style={css('flex:1;font-size:14px;font-weight:500')}>Ask about this vehicle</div>
              <div style={css('display:flex;color:rgba(235,235,245,.3)')}>
                <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                  <path
                    d="M9 6l6 6-6 6"
                    style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
              </div>
            </div>
            <div
              onClick={vm.goTestdrive}
              style={css(
                'padding:15px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:12px;cursor:pointer',
              )}
            >
              <div style={css('flex:1;font-size:14px;font-weight:500')}>Schedule a test drive</div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(vm.tdLabel)}</div>
              <div style={css('display:flex;color:rgba(235,235,245,.3)')}>
                <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                  <path
                    d="M9 6l6 6-6 6"
                    style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
              </div>
            </div>
            <div onClick={vm.goTrade} style={css('padding:15px 0;display:flex;align-items:center;gap:12px;cursor:pointer')}>
              <div style={css('flex:1;font-size:14px;font-weight:500')}>Trade in your vehicle</div>
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
        </div>
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);display:flex;gap:10px;z-index:6',
        )}
      >
        <div
          onClick={vm.goTestdrive}
          style={css(
            'flex:0 0 42%;text-align:center;padding:15px 0;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,.085));backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -1px 0 rgba(0,0,0,.22),0 8px 20px -8px rgba(0,0,0,.55);font-size:13px;font-weight:500;color:#fff;cursor:pointer',
          )}
        >
          Test drive
        </div>
        <div
          onClick={vm.goReserve}
          style={css(
            'flex:1;text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
          )}
        >
          {T(vm.reserveCta)}
        </div>
      </div>
    </>
  );
}
