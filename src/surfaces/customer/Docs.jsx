import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Docs({ vm }) {
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
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Documents</div>
          <div style={css('width:30px')} />
        </div>
        {L(vm.docGroups).map((g, _i) => (
          <React.Fragment key={_i}>
            <div
              style={css(
                'padding:14px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              {T(g?.title)}
            </div>
            <div style={css('margin:10px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(g?.items).map((d, _i1) => (
                <React.Fragment key={_i1}>
                  <div
                    onClick={d?.go}
                    style={css(
                      'padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:12px;cursor:pointer',
                    )}
                  >
                    <div
                      style={css(
                        'width:34px;height:42px;border-radius:6px;background:rgba(255,255,255,.04);border:1px solid rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:9px;color:rgba(235,235,245,.4)',
                      )}
                    >
                      {T(d?.ext)}
                    </div>
                    <div style={css('flex:1')}>
                      <div style={css('font-size:13.5px;font-weight:500')}>{T(d?.t)}</div>
                      <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:3px')}>{T(d?.m)}</div>
                    </div>
                    <div style={css('display:flex;color:rgba(235,235,245,.3)')}>
                      <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                        <path
                          d="M9 6l6 6-6 6"
                          style={css(
                            'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round',
                          )}
                        />
                      </svg>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
