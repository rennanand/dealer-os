import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Fleet({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
        <div style={css('width:320px;flex:0 0 320px')}>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Fleet</div>
          <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:5px')}>
            Local businesses on account. One statement a month, approvals by the fleet lead.
          </div>
          <div style={css('margin-top:22px;display:flex;flex-direction:column;gap:8px')}>
            {L(vm.fleets).map((a, _i) => (
              <React.Fragment key={_i}>
                <div onClick={a?.pick} style={css(a?.style)}>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;gap:10px')}>
                    <div style={css('font-size:15px;font-weight:500')}>{T(a?.name)}</div>
                    {a?.flag ? (
                      <>
                        <div style={css(a?.flagStyle)}>{T(a?.flag)}</div>
                      </>
                    ) : null}
                  </div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:4px')}>{T(a?.sub)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div
          style={css(
            'flex:1;min-width:0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:24px 26px;display:flex;flex-direction:column',
          )}
        >
          <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:16px')}>
            <div>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                {'Fleet account · '}
                {T(vm.fl?.code)}
              </div>
              <div style={css('font-size:24px;font-weight:600;letter-spacing:-.5px;margin-top:8px')}>{T(vm.fl?.name)}</div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:4px')}>{T(vm.fl?.contact)}</div>
            </div>
            <div style={css('display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end')}>
              {L(vm.fl?.pills).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div style={css(p?.style)}>{T(p?.t)}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div
            style={css(
              'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0 24px;margin-top:22px;padding-top:20px;border-top:1px solid rgba(235,235,245,.09)',
            )}
          >
            {L(vm.fl?.stats).map((x, _i) => (
              <React.Fragment key={_i}>
                <div>
                  <div
                    style={css(
                      `font-family:var(--data-font,inherit);font-size:30px;font-weight:300;letter-spacing:-.8px;line-height:1;color:${x?.c ?? ''}`,
                    )}
                  >
                    {T(x?.n)}
                  </div>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:9px',
                    )}
                  >
                    {T(x?.l)}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('margin-top:26px;display:flex;justify-content:space-between;align-items:baseline')}>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Units
            </div>
            <div style={css('font-size:11.5px;color:rgba(235,235,245,.4)')}>
              Odometer as recorded at each unit’s last visit. Intervals are estimated from it.
            </div>
          </div>
          <div style={css('margin-top:8px;border-top:1px solid rgba(235,235,245,.09)')}>
            {L(vm.fl?.units).map((u, _i) => (
              <React.Fragment key={_i}>
                <div
                  style={css(
                    'display:grid;grid-template-columns:56px 1.35fr 1fr minmax(0,1.6fr) 160px;gap:18px;align-items:center;padding:16px 0;border-bottom:1px solid rgba(235,235,245,.07)',
                  )}
                >
                  <div>
                    <div style={css(u?.unitPill)}>{T(u?.unit)}</div>
                  </div>
                  <div>
                    <div style={css('font-size:13.5px;font-weight:500')}>{T(u?.veh)}</div>
                    <div style={css('font-family:var(--data-font,inherit);font-size:11px;color:rgba(235,235,245,.45);margin-top:3px')}>
                      {T(u?.plate)}
                    </div>
                  </div>
                  <div>
                    <div style={css('font-family:var(--data-font,inherit);font-size:13px')}>{T(u?.odo)}</div>
                    <div style={css('font-size:11px;color:rgba(235,235,245,.45);margin-top:3px')}>
                      {'recorded '}
                      {T(u?.odoAt)}
                    </div>
                  </div>
                  <div>
                    <div style={css('display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:9px')}>
                      <div style={css('font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{T(u?.due)}</div>
                      <div
                        style={css(
                          `font-family:var(--data-font,inherit);font-size:11px;white-space:nowrap;flex:0 0 auto;color:${u?.c ?? ''}`,
                        )}
                      >
                        {T(u?.dueIn)}
                      </div>
                    </div>
                    <div style={css(u?.ruler?.base)}>
                      <div style={css(u?.ruler?.fill)} />
                    </div>
                  </div>
                  <div style={css('text-align:right')}>
                    {u?.cta ? (
                      <>
                        <div
                          onClick={u?.go}
                          style={css(
                            'display:inline-block;padding:9px 14px;border-radius:9px;background:#fff;color:#000;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap',
                          )}
                        >
                          {T(u?.cta)}
                        </div>
                      </>
                    ) : null}
                    {u?.state ? (
                      <>
                        <div style={css(`font-size:12px;font-weight:500;color:${u?.sc ?? ''}`)}>{T(u?.state)}</div>
                      </>
                    ) : null}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('flex:1')} />
          <div
            style={css(
              'display:flex;align-items:center;gap:16px;margin-top:22px;padding-top:18px;border-top:1px solid rgba(235,235,245,.08)',
            )}
          >
            <div style={css('flex:1')}>
              <div style={css('font-size:14px;font-weight:500')}>{T(vm.flAction?.t)}</div>
              <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.flAction?.s)}</div>
            </div>
            <div
              onClick={vm.flAction?.go}
              style={css(
                'padding:12px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap',
              )}
            >
              {T(vm.flAction?.cta)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
