import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Oil({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:20px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Oil</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>
              Bulk tanks, today’s changes, filters. Tank levels are read from the gauges at open.
            </div>
          </div>
          <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>3 oil changes today · $89.95 full synthetic</div>
        </div>
        <div style={css('display:grid;grid-template-columns:minmax(0,1.25fr) 380px;gap:24px;margin-top:26px;align-items:start')}>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
                <div style={css('font-size:15px;font-weight:600')}>Bulk tanks</div>
                <div style={css('font-size:11.5px;color:rgba(235,235,245,.45)')}>Read 7:55 AM · reorder at 30%</div>
              </div>
              <div style={css('display:grid;grid-template-columns:250px minmax(0,1fr);gap:22px;margin-top:10px;align-items:center')}>
                <div className="sc-host-x" style={css('width:250px;height:230px')}>
                  <service-scene scene={'bulk'} phase={vm.bulkPhase} accent={'#e0a33a'} />
                </div>
                <div>
                  {L(vm.tanks).map((t, _i) => (
                    <React.Fragment key={_i}>
                      <div style={css('padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                        <div style={css('display:flex;justify-content:space-between;align-items:baseline;gap:10px')}>
                          <div>
                            <span style={css('font-family:var(--data-font,inherit);font-size:13.5px;font-weight:500')}>{T(t?.grade)}</span>
                            <span style={css('font-size:12px;color:rgba(235,235,245,.45);margin-left:8px')}>{T(t?.use)}</span>
                          </div>
                          <div style={css(`font-family:var(--data-font,inherit);font-size:13.5px;color:${t?.c ?? ''}`)}>{T(t?.pct)}</div>
                        </div>
                        <div style={css(`margin-top:9px;${t?.ruler?.base ?? ''}`)}>
                          <div style={css(t?.ruler?.fill)} />
                        </div>
                        <div
                          style={css('display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:rgba(235,235,245,.4)')}
                        >
                          <span>{T(t?.gal)}</span>
                          <span style={css(`color:${t?.c ?? ''}`)}>{T(t?.note)}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
              <div style={css('font-size:15px;font-weight:600')}>Today’s oil changes</div>
              <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
                {L(vm.oilToday).map((o, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css(
                        'display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:14px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07)',
                      )}
                    >
                      <div>
                        <div style={css('font-size:13.5px;font-weight:500')}>{T(o?.who)}</div>
                        <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:2px')}>{T(o?.car)}</div>
                      </div>
                      <div style={css('font-family:var(--data-font,inherit);font-size:13px')}>{T(o?.spec)}</div>
                      <div style={css('font-size:12.5px;color:rgba(235,235,245,.55)')}>{T(o?.bay)}</div>
                      <div style={css(`font-size:12.5px;font-weight:500;text-align:right;color:${o?.c ?? ''}`)}>{T(o?.status)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
                <div style={css('font-size:15px;font-weight:600')}>Filters in stock</div>
                <div style={css('font-size:11.5px;color:rgba(235,235,245,.45)')}>Reorder at 6</div>
              </div>
              <div style={css('margin-top:6px')}>
                {L(vm.oilFilters).map((f, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css(
                        'display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)',
                      )}
                    >
                      <div>
                        <div style={css('font-family:var(--data-font,inherit);font-size:13px')}>{T(f?.part)}</div>
                        <div style={css('font-size:11px;color:rgba(235,235,245,.4);margin-top:2px')}>{T(f?.fits)}</div>
                      </div>
                      <div style={css(`font-family:var(--data-font,inherit);font-size:13px;color:${f?.c ?? ''}`)}>{T(f?.n)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
              <div style={css('font-size:15px;font-weight:600')}>Reorder</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.7);margin-top:8px')}>{T(vm.reorderText)}</div>{' '}
              <div onClick={vm.reorderGo} style={css(vm.reorderStyle)}>
                {T(vm.reorderCta)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
