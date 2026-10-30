import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Messages({ vm }) {
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
            <div style={css('font-size:15px;font-weight:600')}>Service</div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:2px',
              )}
            >
              {vm.msgsSub || 'Quicksilver · Tyler L.'}
            </div>
          </div>
          <div style={css('width:40px')} />
        </div>
        <div style={css('flex:1;overflow-y:auto;padding:16px 18px 10px;display:flex;flex-direction:column;gap:8px')} className="hidescroll">
          <div style={css('text-align:center;font-size:11px;color:rgba(235,235,245,.3);padding:4px 0 8px')}>Today</div>
          {L(vm.msgs).map((m, _i) => (
            <React.Fragment key={_i}>
              <div style={css(m?.wrap)}>
                {m?.who ? (
                  <>
                    <div style={css('font-size:10.5px;color:rgba(235,235,245,.4);margin:0 0 4px 12px')}>{T(m?.who)}</div>
                  </>
                ) : null}{' '}
                <div style={css(m?.bubble)}>{T(m?.text)}</div> <div style={css(m?.timeStyle)}>{T(m?.time)}</div>
              </div>
            </React.Fragment>
          ))}
          {vm.needsApproval ? (
            <>
              <div
                onClick={vm.goApprove}
                style={css(
                  'margin-top:8px;align-self:center;padding:12px 22px;border-radius:11px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                Approve repair
              </div>
            </>
          ) : null}
        </div>
        <div style={css('padding:8px 14px 0;display:flex;gap:6px;flex-wrap:wrap')}>
          {L(vm.quickReplies).map((q, _i) => (
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
            value={val(vm.draft)}
            onChange={vm.onDraft}
            onKeyDown={vm.onDraftKey}
            placeholder={vm.msgPlaceholder || "Message Tyler"}
            style={css(
              'flex:1;background:#2a2a2e;border-radius:20px;padding:12px 16px;color:#fff;font-size:13px;outline:none;font-family:inherit',
            )}
          />
          <div
            onClick={vm.sendDraft}
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
