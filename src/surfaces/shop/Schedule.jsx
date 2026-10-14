import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Schedule({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Schedule</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>Monday, October 5 · 5 bays · 6 jobs</div>
          </div>
          <div style={css(vm.nowPill)}>Now · 2:41 PM</div>
        </div>
        <div style={css('margin-top:26px;position:relative;user-select:none')}>
          <div style={css('display:grid;grid-template-columns:76px minmax(0,1fr)')}>
            <div />
            <div style={css('position:relative;height:16px')}>
              {L(vm.schedHours).map((h, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      `position:absolute;top:0;left:${h?.left ?? ''};transform:translateX(-50%);font-size:10.5px;color:rgba(235,235,245,.35);white-space:nowrap`,
                    )}
                  >
                    {T(h?.label)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          {L(vm.schedRows).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css('display:grid;grid-template-columns:76px minmax(0,1fr);border-top:1px solid rgba(235,235,245,.08);height:84px')}
              >
                <div style={css('padding-top:12px')}>
                  <div style={css('font-size:12px;font-weight:600;letter-spacing:.08em')}>{T(r?.bay)}</div>
                  <div style={css('font-size:11px;color:rgba(235,235,245,.4);margin-top:4px')}>{T(r?.tech)}</div>
                </div>
                <div style={css('position:relative')}>
                  {L(vm.schedHours).map((h, _i1) => (
                    <React.Fragment key={_i1}>
                      <div
                        style={css(`position:absolute;top:0;bottom:0;left:${h?.left ?? ''};width:1px;background:rgba(235,235,245,.05)`)}
                      />
                    </React.Fragment>
                  ))}{' '}
                  {L(r?.blocks).map((b, _i1) => (
                    <React.Fragment key={_i1}>
                      {' '}
                      <div
                        onPointerDown={b?.down}
                        onPointerMove={b?.move}
                        onPointerUp={b?.up}
                        onPointerCancel={b?.up}
                        style={css(b?.style)}
                      >
                        <div style={css('display:flex;justify-content:space-between;gap:8px')}>
                          <div style={css('font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>
                            {T(b?.who)}
                          </div>
                          <div
                            style={css(
                              'font-family:var(--data-font,inherit);font-size:10px;color:rgba(235,235,245,.45);white-space:nowrap',
                            )}
                          >
                            {T(b?.time)}
                          </div>
                        </div>
                        <div
                          style={css(
                            'font-size:11.5px;color:rgba(235,235,245,.55);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
                          )}
                        >
                          {T(b?.job)}
                        </div>{' '}
                        <div
                          style={css(
                            `margin-top:9px;font-size:10.5px;font-weight:500;color:${b?.c ?? ''};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`,
                          )}
                        >
                          {T(b?.status)}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
          <div style={css('border-top:1px solid rgba(235,235,245,.08)')} />{' '}
          <div style={css(`position:absolute;top:16px;bottom:0;left:${vm.nowLeft ?? ''};width:1px;background:#e0312b;pointer-events:none`)}>
            <div style={css('position:absolute;top:-3px;left:-3px;width:7px;height:7px;border-radius:4px;background:#e0312b')} />
          </div>
        </div>
        <div style={css('margin-top:14px;font-size:12px;color:rgba(235,235,245,.45)')}>{T(vm.schedNote)}</div>
      </div>
    </>
  );
}
