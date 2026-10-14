import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Settings({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Settings</div>
        <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>
          {'RyGuys Tire & Auto Sales · 145 S Main St, Manti UT'}
        </div>
        <div style={css('display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-top:22px')}>
          <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px')}>
            <div style={css('font-size:15px;font-weight:500')}>Reservation deposit policy</div>
            <div style={css('font-size:12.5px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:4px')}>
              Shown to customers before they place a deposit. Until you choose, the app shows placeholder terms.
            </div>
            <div style={css('display:flex;gap:8px;margin-top:16px')}>
              {L(vm.policies).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={p?.pick} style={css(p?.style)}>
                    {T(p?.label)}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('margin-top:16px;border:1px solid rgba(235,235,245,.1);border-radius:12px;padding:14px 16px')}>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                Customer sees
              </div>
              <div style={css('font-size:13px;line-height:1.6;margin-top:6px;color:rgba(235,235,245,.8)')}>{T(vm.policyText)}</div>
            </div>
            <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:16px')}>
              <div style={css('font-size:13px')}>Deposit amount</div>
              <div style={css('font-size:15px;font-weight:500')}>$250</div>
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px')}>
              <div style={css('font-size:15px;font-weight:500')}>Hours</div>
              {L(vm.hours).map((h, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      'display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px',
                    )}
                  >
                    <span style={css('color:rgba(235,235,245,.6)')}>{T(h?.d)}</span>
                    <span>{T(h?.t)}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px')}>
              <div style={css('font-size:15px;font-weight:500')}>Customer notifications</div>
              {L(vm.shopNotifs).map((n, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      'display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07)',
                    )}
                  >
                    <span style={css('font-size:13px')}>{T(n?.t)}</span>
                    <span style={css('font-size:12px;color:#30d158')}>{T(n?.s)}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
