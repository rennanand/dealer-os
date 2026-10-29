import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function HealthDetail({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>{T(vm.hdt?.name)}</div>
          <div style={css('width:30px')} />
        </div>
        {vm.hdt?.scene ? (
          <>
            <div className="sc-host-x" style={css('height:190px')}>
              <service-scene scene={vm.hdt?.scene} phase={vm.hdt?.phase} params={vm.hdt?.params} />
            </div>
          </>
        ) : null}
        <div style={css('padding:14px 22px 0')}>
          <div style={css('display:flex;align-items:baseline;gap:8px')}>
            <div
              style={css(
                `font-family:var(--data-font,inherit);font-size:54px;font-weight:300;letter-spacing:-2px;line-height:1;color:${vm.hdt?.color ?? ''}`,
              )}
            >
              {T(vm.hdt?.big)}
            </div>
            <div style={css('font-size:17px;color:rgba(235,235,245,.5)')}>{T(vm.hdt?.unit)}</div>
          </div>
          <div
            style={css(
              'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:10px',
            )}
          >
            {T(vm.hdt?.bigLabel)}
          </div>
        </div>
        {vm.hdt?.hasScale ? (
          <>
            <div style={css('padding:20px 22px 0')}>
              <div style={css('position:relative;height:14px;display:flex')}>
                {L(vm.hdt?.zones).map((z, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css(z?.style)} />
                  </React.Fragment>
                ))}
                <div style={css(vm.hdt?.needle)} />
              </div>
              <div style={css('position:relative;height:14px;margin-top:7px')}>
                {L(vm.hdt?.scaleLabels).map((l, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css(l?.style)}>{T(l?.t)}</div>
                  </React.Fragment>
                ))}
              </div>
              <div
                style={css(
                  'display:flex;justify-content:space-between;margin-top:4px;font-family:var(--data-font,inherit);font-size:9.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase',
                )}
              >
                <span style={css('color:#e0312b')}>Replace</span>
                <span style={css('color:#ffd60a')}>Monitor</span>
                <span style={css('color:#30d158')}>Good</span>
              </div>
            </div>
          </>
        ) : null}
        <div style={css('padding:22px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
          {L(vm.hdt?.pos).map((p, _i) => (
            <React.Fragment key={_i}>
              <div style={css('background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);backdrop-filter:blur(32px) saturate(200%);-webkit-backdrop-filter:blur(32px) saturate(200%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:14px 16px')}>
                <div
                  style={css(
                    'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                  )}
                >
                  {T(p?.n)}
                </div>
                <div style={css('display:flex;align-items:baseline;gap:4px;margin-top:8px')}>
                  <div style={css(`font-size:22px;font-weight:500;letter-spacing:-.4px;color:${p?.c ?? ''}`)}>{T(p?.v)}</div>
                  <div style={css('font-size:11px;color:rgba(235,235,245,.4)')}>{T(p?.u)}</div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        {vm.hdt?.hasHist ? (
          <>
            <div style={css('padding:28px 22px 0;display:flex;justify-content:space-between;align-items:baseline')}>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                {T(vm.hdt?.histLabel)}
              </div>
              <div style={css('font-size:11px;color:rgba(235,235,245,.35)')}>{T(vm.hdt?.histRange)}</div>
            </div>
            <div
              style={css(
                'margin:14px 22px 0;display:flex;align-items:flex-end;gap:12px;height:124px;border-bottom:1px solid rgba(235,235,245,.14)',
              )}
            >
              {L(vm.hdt?.hist).map((b, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:7px')}
                  >
                    <div style={css('font-size:12px;color:rgba(235,235,245,.7)')}>{T(b?.v)}</div>
                    <div style={css(b?.style)} />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('margin:0 22px;display:flex;gap:12px')}>
              {L(vm.hdt?.hist).map((b, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('flex:1;text-align:center;font-size:10.5px;color:rgba(235,235,245,.35);padding-top:8px')}>{T(b?.d)}</div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        <div style={css('padding:28px 22px 0')}>
          <div
            style={css(
              'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
            )}
          >
            What this means
          </div>
          <div style={css('font-size:14px;line-height:1.55;margin-top:10px;text-wrap:pretty;color:rgba(235,235,245,.9)')}>
            {T(vm.hdt?.means)}
          </div>
        </div>
        <div style={css('padding:16px 22px 0;font-size:11px;line-height:1.6;color:rgba(235,235,245,.32)')}>{T(vm.hdt?.foot)}</div>
      </div>
      {vm.hdt?.cta ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
            )}
          >
            <div
              onClick={vm.hdt?.go}
              style={css(
                'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
              )}
            >
              {T(vm.hdt?.cta)}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
