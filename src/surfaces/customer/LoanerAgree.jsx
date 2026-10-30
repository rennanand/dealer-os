import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function LoanerAgree({ vm }) {
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Agreement</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('display:flex;align-items:center;gap:8px')}>
            <div style={css('font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:rgba(235,235,245,.45)')}>
              {T(vm.agreeNo)}
            </div>
            <div
              style={css(
                'font-size:10px;font-weight:600;letter-spacing:.08em;padding:3px 7px;border-radius:5px;background:rgba(255,214,10,.16);color:#ffd60a',
              )}
            >
              DRAFT
            </div>
          </div>
          <div style={css('font-size:24px;font-weight:500;letter-spacing:-.5px;line-height:1.15;margin-top:10px')}>
            Loaner Vehicle Agreement
          </div>
          <div style={css('font-size:12.5px;line-height:1.55;color:rgba(235,235,245,.55);margin-top:8px')}>
            {'Between RyGuys Tire & Auto Sales, 145 S Main St, Manti UT (“RyGuys”) and Rennan Anderson (“Driver”).'}
          </div>
        </div>
        <div style={css('margin:18px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.agreeRows).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css(
                  'padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:14px',
                )}
              >
                <span style={css('font-size:12.5px;color:rgba(235,235,245,.5);flex:0 0 auto')}>{T(r?.k)}</span>
                <span style={css('font-size:12.5px;text-align:right;line-height:1.4')}>{T(r?.v)}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:22px 22px 0;display:flex;flex-direction:column;gap:18px')}>
          {L(vm.agreeClauses).map((c, _i) => (
            <React.Fragment key={_i}>
              <div>
                <div style={css('font-size:13px;font-weight:500')}>{T(c?.title)}</div>
                <div style={css('font-size:12.5px;line-height:1.6;color:rgba(235,235,245,.65);margin-top:5px')}>{T(c?.text)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:24px 22px 0;font-size:12px;line-height:1.55;color:rgba(235,235,245,.5)')}>
          By signing, I confirm I have read this agreement, that I hold a valid driver’s license and personal auto insurance, and that the
          condition photos taken at handoff are accurate.
        </div>
        <div style={css('padding:14px 18px 0')}>
          <div
            onPointerDown={vm.sigDown}
            onPointerMove={vm.sigMove}
            onPointerUp={vm.sigUp}
            onPointerCancel={vm.sigUp}
            style={css(
              'position:relative;height:140px;border-radius:14px;background:rgba(255,255,255,.03);border:1px dashed rgba(235,235,245,.18);touch-action:none;cursor:crosshair;overflow:hidden;user-select:none',
            )}
          >
            {vm.sigEmpty ? (
              <>
                <div
                  style={css(
                    'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(235,235,245,.3);pointer-events:none',
                  )}
                >
                  Sign here with your finger
                </div>
              </>
            ) : null}
            <div
              style={css(
                'position:absolute;left:18px;right:18px;bottom:30px;height:1px;background:rgba(235,235,245,.14);pointer-events:none',
              )}
            />{' '}
            <svg style={css('position:absolute;inset:0;width:100%;height:100%;pointer-events:none')}>
              <path d={vm.sigPath} style={css('fill:none;stroke:#fff;stroke-width:2.2px;stroke-linecap:round;stroke-linejoin:round')} />
            </svg>
          </div>
          <div style={css('display:flex;justify-content:space-between;margin-top:10px;padding:0 4px')}>
            <div style={css('font-size:11px;color:rgba(235,235,245,.42)')}>
              {'Rennan Anderson · '}
              {T(vm.agreeDate)}
            </div>
            <div onClick={vm.sigClear} style={css('font-size:12px;color:#e0312b;cursor:pointer')}>
              Clear
            </div>
          </div>
        </div>
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
        )}
      >
        <div onClick={vm.signAgreement} style={css(vm.signCtaStyle)}>
          Agree and sign
        </div>
      </div>
    </>
  );
}
