import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Ask({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;height:100%;display:flex;flex-direction:column')}>
        <div style={css('padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center;border-bottom:1px solid rgba(235,235,245,.07)')}>
          <div
            onClick={vm.goBack}
            style={css('width:40px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center')}>
            <div style={css('font-size:15px;font-weight:600')}>Sales</div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:2px',
              )}
            >
              RyGuys · Manti
            </div>
          </div>
          <div style={css('width:40px')} />
        </div>
        <div
          style={css('margin:14px 18px 0;background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,.085));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -1px 0 rgba(0,0,0,.22),0 8px 20px -8px rgba(0,0,0,.55);border-radius:12px;padding:11px 14px;display:flex;align-items:center;gap:12px')}
        >
          <div style={css(`width:44px;height:34px;border-radius:7px;${vm.ph ?? ''}`)} />
          <div style={css('flex:1')}>
            <div style={css('font-size:10.5px;color:rgba(235,235,245,.45)')}>You're asking about</div>
            <div style={css('font-size:13px;font-weight:500;margin-top:2px')}>
              {T(vm.sel?.name)}
              {' · '}
              {T(vm.sel?.price)}
            </div>
          </div>
        </div>
        <div style={css('flex:1;overflow-y:auto;padding:14px 18px 10px;display:flex;flex-direction:column;gap:8px')} className="hidescroll">
          {L(vm.askMsgs).map((m, _i) => (
            <React.Fragment key={_i}>
              <div style={css(m?.wrap)}>
                <div style={css(m?.bubble)}>{T(m?.text)}</div>
                <div style={css(m?.timeStyle)}>{T(m?.time)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:8px 14px 0;display:flex;gap:6px;flex-wrap:wrap')}>
          {L(vm.askChips).map((q, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={q?.send}
                style={css(
                  'padding:7px 11px;border-radius:14px;border:1px solid rgba(235,235,245,.16);font-size:11.5px;color:rgba(235,235,245,.75);cursor:pointer',
                )}
                className="px1"
              >
                {T(q?.text)}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:10px 14px calc(var(--sab) + 13px);display:flex;gap:8px;align-items:center')}>
          <input
            value={val(vm.askDraft)}
            onChange={vm.onAskDraft}
            onKeyDown={vm.onAskKey}
            placeholder="Ask anything about this vehicle"
            style={css(
              'flex:1;background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,.085));border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),inset 0 -1px 0 rgba(0,0,0,.22),0 8px 20px -8px rgba(0,0,0,.55);border-radius:20px;padding:12px 16px;color:#fff;font-size:13px;outline:none;font-family:inherit',
            )}
          />
          <div
            onClick={vm.sendAsk}
            style={css(
              'width:40px;height:40px;border-radius:20px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;cursor:pointer',
            )}
          >
            <svg viewBox="0 0 24 24" style={css('width:18px;height:18px;display:block;flex:0 0 auto')}>
              <path
                d="M12 19V5M5 12l7-7 7 7"
                style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
