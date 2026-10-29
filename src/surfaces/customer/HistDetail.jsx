import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function HistDetail({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 112px')}>
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>{T(vm.hd?.date)}</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('font-size:26px;font-weight:600;letter-spacing:-.7px')}>{T(vm.hd?.title)}</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:6px')}>
            {T(vm.hd?.miles)}
            {' miles · '}
            {T(vm.hd?.tech)}
            {' · '}
            {T(vm.hd?.pay)}
          </div>
        </div>
        <div
          style={css(
            'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Invoice
        </div>
        <div style={css('margin:10px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.hd?.lines).map((l, _i) => (
            <React.Fragment key={_i}>
              <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between')}>
                <span style={css('font-size:13px;color:rgba(235,235,245,.6)')}>{T(l?.k)}</span>
                <span style={css('font-size:13px')}>{T(l?.v)}</span>
              </div>
            </React.Fragment>
          ))}
          <div style={css('padding:13px 0;display:flex;justify-content:space-between')}>
            <span style={css('font-size:13px;font-weight:500')}>Total</span>
            <span style={css('font-size:13px;font-weight:500')}>{T(vm.hd?.totalLabel)}</span>
          </div>
        </div>
        {vm.hd?.hasPhotos ? (
          <>
            <div
              style={css(
                'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Technician photos
            </div>
            <div style={css('display:flex;gap:8px;overflow-x:auto;padding:10px 22px 0')} className="hidescroll">
              {L(vm.hd?.photos).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div style={css(`flex:0 0 140px;height:96px;border-radius:11px;${p?.ph ?? ''}`)}>{T(p?.t)}</div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        <div
          style={css(
            'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Technician notes
        </div>
        <div
          style={css(
            'margin:10px 18px 0;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);backdrop-filter:blur(32px) saturate(200%);-webkit-backdrop-filter:blur(32px) saturate(200%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:14px 16px;font-size:13px;line-height:1.55;color:rgba(235,235,245,.8)',
          )}
        >
          {T(vm.hd?.notes)}
        </div>
        {vm.hd?.hasParts ? (
          <>
            <div
              style={css(
                'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Parts
            </div>
            <div style={css('margin:10px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.hd?.parts).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;display:flex;gap:10px')}>
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
          </>
        ) : null}
        {vm.hd?.hasRecs ? (
          <>
            <div
              style={css(
                'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Recommendations
            </div>
            <div style={css('margin:10px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.hd?.recs).map((r, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;display:flex;gap:10px')}>
                    <span style={css('color:#ffd60a')}>●</span>
                    {T(r?.t)}
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
