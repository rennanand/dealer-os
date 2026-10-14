import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Updates({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 112px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:52px 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goBack}
            style={css('width:60px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Updates</div>
          <div onClick={vm.markRead} style={css('width:60px;text-align:right;font-size:12px;color:#e0312b;cursor:pointer')}>
            Read all
          </div>
        </div>
        {vm.noUpdates ? (
          <>
            <div style={css('padding:60px 30px 0;text-align:center')}>
              <div style={css('font-size:22px;font-weight:500')}>No messages</div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>You're all caught up.</div>
            </div>
          </>
        ) : null}
        <div style={css('padding:8px 18px 0;display:flex;flex-direction:column;gap:9px')}>
          {L(vm.updates).map((m, _i) => (
            <React.Fragment key={_i}>
              <div onClick={m?.open} style={css(m?.style)}>
                <div style={css('display:flex;align-items:center;gap:9px')}>
                  <div style={css(m?.dotStyle)} />
                  <div
                    style={css('font-size:11px;font-weight:500;letter-spacing:.06em;color:rgba(235,235,245,.45);text-transform:uppercase')}
                  >
                    {T(m?.kind)}
                  </div>
                  <div style={css('flex:1')} />
                  <div style={css('font-size:11px;color:rgba(235,235,245,.3)')}>{T(m?.time)}</div>
                </div>
                <div style={css('font-size:14px;font-weight:500;margin-top:10px;line-height:1.35')}>{T(m?.title)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
