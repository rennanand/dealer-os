import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Loaner({ vm }) {
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Loaner</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15')}>Need a ride while we're working?</div>
        </div>
        <div style={css('height:206px')} />
        <div style={css('padding:16px 22px 0;display:flex;justify-content:space-between;align-items:flex-end;gap:12px')}>
          <div>
            <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px')}>{T(vm.lv?.car)}</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>
              {T(vm.lv?.color)}
              {' · '}
              {T(vm.lv?.miles)}
              {' miles'}
            </div>
          </div>
          <div style={css('text-align:right;flex:0 0 auto')}>
            <div style={css(`font-size:20px;font-weight:500;letter-spacing:-.3px;color:${vm.loanerPriceColor ?? ''}`)}>
              {T(vm.loanerPrice)}
            </div>
            <div style={css('font-size:11px;color:rgba(235,235,245,.42);margin-top:4px')}>{T(vm.loanerPriceSub)}</div>
          </div>
        </div>
        <div style={css('margin:18px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.loanerTerms).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css(
                  'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:12px',
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
            'padding:20px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Included
        </div>
        <div style={css('padding:10px 18px 0;display:flex;gap:8px;flex-wrap:wrap')}>
          {L(vm.loanerIncl).map((x, _i) => (
            <React.Fragment key={_i}>
              <div style={css('padding:9px 12px;border-radius:10px;background:#2a2a2e;font-size:12px')}>{T(x?.t)}</div>
            </React.Fragment>
          ))}
        </div>
        {vm.loanerSentNote ? (
          <>
            <div
              style={css(
                'margin:18px 18px 0;background:rgba(224,49,43,.14);border-radius:12px;padding:12px 14px;font-size:12px;line-height:1.5;color:rgba(235,235,245,.85)',
              )}
            >
              {T(vm.loanerSentNote)}
            </div>
          </>
        ) : null}
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
        )}
      >
        <div
          onClick={vm.reviewAgreement}
          style={css(
            'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
          )}
        >
          Review agreement
        </div>
      </div>
    </>
  );
}
