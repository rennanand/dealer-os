import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Rewards({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 112px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:linear-gradient(180deg,rgba(10,10,14,.72),rgba(10,10,14,.42));backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 -1px 0 rgba(255,255,255,.06);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Rewards</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:14px 22px 0')}>
          <div style={css('display:flex;align-items:baseline;gap:8px')}>
            <div style={css('font-family:var(--data-font,inherit);font-size:54px;font-weight:300;letter-spacing:-2px;line-height:1')}>
              {T(vm.points)}
            </div>
            <div style={css('font-size:17px;color:rgba(235,235,245,.5)')}>pts</div>
          </div>
          <div
            style={css(
              'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:10px',
            )}
          >
            {T(vm.rewardsTier)}
            {' · '}
            {T(vm.toNext)}
          </div>
          <div style={css('margin-top:14px;height:3px;border-radius:2px;background:rgba(235,235,245,.1);overflow:hidden')}>
            <div style={css(vm.tierBar)} />
          </div>
          <div style={css('display:flex;justify-content:space-between;margin-top:8px;font-size:10.5px;color:rgba(235,235,245,.35)')}>
            <span>Silver</span>
            <span>Gold · 2,000</span>
          </div>
        </div>
        <div
          style={css(
            'padding:28px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Redeem
        </div>
        <div style={css('padding:10px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
          {L(vm.redeems).map((r, _i) => (
            <React.Fragment key={_i}>
              <div onClick={r?.pick} style={css(r?.style)}>
                <div style={css('font-size:18px;font-weight:600;letter-spacing:-.3px')}>{T(r?.v)}</div>
                <div style={css('font-size:11px;color:rgba(235,235,245,.5);margin-top:4px')}>{T(r?.cost)}</div>
                <div style={css(`font-size:11px;font-weight:500;margin-top:12px;color:${r?.sc ?? ''}`)}>{T(r?.state)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          style={css(
            'padding:28px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Refer a friend
        </div>
        <div
          style={css('margin:10px 18px 0;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:16px 18px')}
        >
          <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.75)')}>
            They get $25 off their first visit. You get 500 points when they check in.
          </div>
          <div style={css('margin-top:14px;display:flex;gap:8px;align-items:center')}>
            <div
              style={css(
                'flex:1;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);font-family:var(--data-font,inherit);font-size:14px;font-weight:500;letter-spacing:.12em',
              )}
            >
              RENNAN-RG
            </div>
            <div
              onClick={vm.shareRef}
              style={css('padding:12px 16px;border-radius:12px;background:#fff;color:#000;font-size:12.5px;font-weight:600;cursor:pointer')}
            >
              {T(vm.shareLabel)}
            </div>
          </div>
          {vm.refCount ? (
            <>
              <div style={css('margin-top:12px;font-size:11.5px;color:rgba(235,235,245,.5)')}>{T(vm.refNote)}</div>
            </>
          ) : null}
        </div>
        <div
          style={css(
            'padding:28px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          How you earn
        </div>
        <div style={css('margin:8px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.earnRows).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css(
                  'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;font-size:13px',
                )}
              >
                <span style={css('color:rgba(235,235,245,.75)')}>{T(r?.k)}</span>
                <span style={css('font-weight:500')}>{T(r?.v)}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          style={css(
            'padding:28px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Activity
        </div>
        <div style={css('margin:8px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.pointsLog).map((r, _i) => (
            <React.Fragment key={_i}>
              <div style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:12px')}>
                <div style={css('flex:1')}>
                  <div style={css('font-size:13.5px;font-weight:500')}>{T(r?.t)}</div>
                  <div style={css('font-size:11px;color:rgba(235,235,245,.4);margin-top:3px')}>{T(r?.d)}</div>
                </div>
                <div style={css('font-size:13.5px;font-weight:500;color:#30d158')}>{T(r?.v)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
