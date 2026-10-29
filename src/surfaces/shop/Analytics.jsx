import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Analytics({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Reports</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{vm.repSub || 'September 5 – October 5'}</div>
          </div>
          <div style={css('display:flex;gap:6px')}>
            {L(vm.repRanges).map((r, _i) => (
              <React.Fragment key={_i}>
                <div onClick={r?.pick} style={css(r?.style)}>
                  {T(r?.label)}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={css('margin-top:28px;display:flex;align-items:baseline;gap:10px')}>
          <div
            style={css(
              'font-family:var(--data-font,inherit);font-size:48px;font-weight:300;letter-spacing:-1.5px;line-height:1;color:#30d158',
            )}
          >
            {T(vm.repTotal)}
          </div>
        </div>
        <div
          style={css(
            'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:10px',
          )}
        >
          {(vm.repTitle || 'Revenue') + ' · '}
          {T(vm.repRangeLabel)}
        </div>
        <div style={css('margin-top:26px;display:grid;grid-template-columns:minmax(0,1fr) 44px')}>
          <div style={css('position:relative;height:200px')}>
            {L(vm.repGrid).map((g, _i) => (
              <React.Fragment key={_i}>
                <div style={css(g?.style)} />
              </React.Fragment>
            ))}{' '}
            <div style={css('position:absolute;inset:0;display:flex;align-items:flex-end;gap:4px')}>
              {L(vm.repBars).map((b, _i) => (
                <React.Fragment key={_i}>
                  <div style={css(b?.style)} />
                </React.Fragment>
              ))}
            </div>
          </div>
          <div style={css('position:relative;height:200px')}>
            {L(vm.repGrid).map((g, _i) => (
              <React.Fragment key={_i}>
                <div style={css(g?.lbl)}>{T(g?.v)}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:minmax(0,1fr) 44px;margin-top:8px')}>
          <div style={css('position:relative;height:14px')}>
            {L(vm.repTicks).map((t, _i) => (
              <React.Fragment key={_i}>
                <div style={css(`position:absolute;top:0;left:${t?.left ?? ''};font-size:11px;color:rgba(235,235,245,.4)`)}>{T(t?.l)}</div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('font-size:11px;color:rgba(235,235,245,.3);text-align:right')}>USD</div>
        </div>
        <div style={css('display:flex;gap:28px;margin-top:22px')}>
          {L(vm.repLegend).map((x, _i) => (
            <React.Fragment key={_i}>
              <div style={css('display:flex;align-items:baseline;gap:6px;font-size:13px')}>
                <span style={css('color:rgba(235,235,245,.6);font-weight:500')}>{T(x?.k)}</span>
                <span style={css('color:#30d158;font-weight:600')}>{T(x?.v)}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('margin-top:30px;border-top:1px solid rgba(235,235,245,.09)')} />
        <div style={css('display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:22px')}>
          {L(vm.metrics).map((x, _i) => (
            <React.Fragment key={_i}>
              <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
                <div
                  style={css(
                    'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                  )}
                >
                  {T(x?.l)}
                </div>
                <div style={css('font-size:28px;font-weight:500;letter-spacing:-.7px;margin-top:10px')}>{T(x?.n)}</div>
                <div style={css(`font-size:12px;margin-top:6px;color:${x?.c ?? ''}`)}>{T(x?.d)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:30px')}>
          <div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              By service
            </div>
            <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.repTop).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                    <div style={css('display:flex;justify-content:space-between;font-size:13px')}>
                      <span style={css('font-weight:500')}>{T(t?.k)}</span>
                      <span>{T(t?.v)}</span>
                    </div>
                    <div style={css('margin-top:8px;height:3px;border-radius:2px;background:rgba(235,235,245,.08);overflow:hidden')}>
                      <div style={css(t?.bar)} />
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              By technician
            </div>
            <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.repTechs).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                    <div style={css('display:flex;justify-content:space-between;font-size:13px')}>
                      <span style={css('font-weight:500')}>{T(t?.k)}</span>
                      <span>{T(t?.v)}</span>
                    </div>
                    <div
                      style={css('display:flex;justify-content:space-between;font-size:11.5px;color:rgba(235,235,245,.45);margin-top:4px')}
                    >
                      <span>{T(t?.s)}</span>
                      <span>{T(t?.r)}</span>
                    </div>
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
