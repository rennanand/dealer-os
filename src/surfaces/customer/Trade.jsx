import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Trade({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:52px 22px 12px;display:flex;align-items:center',
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Trade-in</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>Tell us about your vehicle</div>
        </div>
        <div
          style={css(
            'margin:18px 18px 0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:15px 16px;display:flex;align-items:center;gap:13px',
          )}
        >
          <div
            style={css(
              'width:22px;height:22px;border-radius:11px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center',
            )}
          >
            <svg viewBox="0 0 24 24" style={css('width:12px;height:12px;display:block;flex:0 0 auto')}>
              <path
                d="M5 12.5l4.5 4.5L19 7"
                style={css('fill:none;stroke:currentColor;stroke-width:2.6px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1')}>
            <div style={css('font-size:14.5px;font-weight:500')}>Quicksilver</div>
            <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:3px')}>
              {'2022 Tesla Model Y · '}
              {T(vm.odoFmt)}
              {' mi'}
            </div>
          </div>
        </div>
        <div
          style={css(
            'padding:22px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Condition
        </div>
        <div style={css('padding:10px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
          {L(vm.tradeConds).map((c, _i) => (
            <React.Fragment key={_i}>
              <div onClick={c?.pick} style={css(c?.style)}>
                {T(c?.label)}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          style={css(
            'padding:20px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Mileage
        </div>
        <div style={css('padding:10px 22px 0')}>
          <input
            value={val(vm.tradeMiles)}
            onChange={vm.onTradeMiles}
            inputMode="numeric"
            style={css(
              'width:100%;background:#1c1c1e;border:none;border-radius:12px;padding:14px;color:#fff;font-size:14px;outline:none;font-family:inherit',
            )}
          />
        </div>
        <div
          style={css(
            'padding:20px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Photos
        </div>
        <div style={css('padding:10px 18px 0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px')}>
          {L(vm.tradeShots).map((p, _i) => (
            <React.Fragment key={_i}>
              <div onClick={p?.take} style={css(p?.style)}>
                {T(p?.t)}
              </div>
            </React.Fragment>
          ))}
        </div>
        {vm.tradeResult ? (
          <>
            <div
              style={css(
                'margin:22px 18px 0;animation:sIn .32s ease;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px',
              )}
            >
              <div style={css('font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:#e0312b')}>
                Trade-in estimate
              </div>
              <div style={css('font-size:32px;font-weight:500;letter-spacing:-.8px;margin-top:12px')}>{T(vm.tradeRange)}</div>
              <div
                style={css(
                  'margin-top:14px;height:4px;border-radius:2px;background:rgba(235,235,245,.12);position:relative;overflow:hidden',
                )}
              >
                <div style={css('position:absolute;left:24%;width:52%;height:100%;border-radius:2px;background:#e0312b')} />
              </div>
              <div style={css('font-size:12px;line-height:1.6;color:rgba(235,235,245,.6);margin-top:14px')}>
                This is an estimate, not a final offer. A firm number takes about 20 minutes on site and is good for 7 days.
              </div>
              <div
                onClick={vm.goShop}
                style={css(
                  'margin-top:14px;text-align:center;padding:13px 0;border-radius:11px;background:rgba(235,235,245,.1);font-size:12.5px;font-weight:500;cursor:pointer',
                )}
              >
                Apply toward a vehicle
              </div>
            </div>
          </>
        ) : null}
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px 30px;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
        )}
      >
        <div
          onClick={vm.runTrade}
          style={css(
            'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
          )}
        >
          Get a trade-in estimate
        </div>
      </div>
    </>
  );
}
