import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Estimate({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div
          onClick={vm.dgoApprovals}
          style={css('display:inline-flex;align-items:center;gap:2px;font-size:13px;font-weight:500;color:#e0312b;cursor:pointer')}
        >
          <svg viewBox="0 0 24 24" style={css('width:15px;height:15px;display:block;flex:0 0 auto')}>
            <path
              d="M15 6l-6 6 6 6"
              style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
            />
          </svg>
          Approvals
        </div>{' '}
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;gap:20px')}>
          <div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Estimate · WO-8842
            </div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px;margin-top:8px')}>Rennan Anderson</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>
              2022 Tesla Model Y · Quicksilver · 52,431 mi · inspected by Marcus T. at 9:37 AM
            </div>
          </div>
          <div style={css(vm.estPill)}>{T(vm.estPillText)}</div>
        </div>
        <div style={css('display:grid;grid-template-columns:minmax(0,1.3fr) 400px;gap:24px;margin-top:26px;align-items:start')}>
          <div>
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Technician findings
            </div>
            <div style={css('margin-top:10px;display:flex;flex-direction:column;gap:10px')}>
              {L(vm.estLines).map((l, _i) => (
                <React.Fragment key={_i}>
                  <div style={css(l?.style)}>
                    <div style={css('display:flex;align-items:center;gap:14px')}>
                      <div onClick={l?.toggle} style={css(l?.box)}>
                        {l?.on ? (
                          <>
                            <svg viewBox="0 0 24 24" style={css('width:13px;height:13px;display:block;flex:0 0 auto')}>
                              <path
                                d="M5 12.5l4.5 4.5L19 7"
                                style={css('fill:none;stroke:currentColor;stroke-width:2.6px;stroke-linecap:round;stroke-linejoin:round')}
                              />
                            </svg>
                          </>
                        ) : null}
                      </div>
                      <div style={css(l?.dot)} />
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css('font-size:15px;font-weight:600')}>{T(l?.name)}</div>
                        <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:3px')}>{T(l?.meta)}</div>
                      </div>
                      <div style={css('font-size:16px;font-weight:500')}>{T(l?.price)}</div>
                    </div>
                    {l?.on ? (
                      <>
                        <div style={css('margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px')}>
                          <div>
                            <div
                              style={css(
                                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                              )}
                            >
                              Technician wrote
                            </div>
                            <div
                              style={css('font-size:12.5px;line-height:1.5;color:rgba(235,235,245,.6);margin-top:6px;font-style:italic')}
                            >
                              “{T(l?.tech)}”
                            </div>
                          </div>
                          <div>
                            <div
                              style={css(
                                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                              )}
                            >
                              Rennan reads
                            </div>
                            <textarea
                              value={val(l?.plain)}
                              onChange={l?.onPlain}
                              style={css(
                                'margin-top:6px;width:100%;min-height:72px;resize:none;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px;color:#fff;font-size:12.5px;line-height:1.5;outline:none;font-family:inherit',
                              )}
                            />
                          </div>
                        </div>
                        {l?.optional ? (
                          <>
                            <div style={css('margin-top:10px;font-size:11.5px;color:rgba(235,235,245,.45)')}>
                              Offered as optional. Rennan can add it with one tap; it’s unchecked by default.
                            </div>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div
              style={css(
                'margin-top:18px;display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:rgba(235,235,245,.45)',
              )}
            >
              <div>Labor $120/h · parts at list · shop supplies $12 · Sanpete County tax 8.974%</div>
              <div>4 photos attached</div>
            </div>
          </div>
          <div
            style={css(
              'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px 24px;position:sticky;top:0',
            )}
          >
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Rennan sees
            </div>
            <div style={css('margin-top:14px;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.estPreview).map((p, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                    <div style={css('display:flex;justify-content:space-between;gap:10px')}>
                      <div style={css('display:flex;align-items:center;gap:8px')}>
                        <div style={css(p?.dot)} />
                        <div style={css('font-size:13.5px;font-weight:500')}>{T(p?.name)}</div>
                      </div>
                      <div style={css('font-size:13.5px')}>{T(p?.price)}</div>
                    </div>
                    <div style={css('font-size:12px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:6px')}>{T(p?.plain)}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('display:flex;justify-content:space-between;align-items:baseline;padding-top:16px')}>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5)')}>Total</div>
              <div style={css('font-size:30px;font-weight:600;letter-spacing:-.9px')}>{T(vm.estTotal)}</div>
            </div>
            <div style={css('font-size:11px;line-height:1.6;color:rgba(235,235,245,.35);margin-top:4px')}>
              {'Plus shop supplies and tax, estimated at '}
              {T(vm.estTax)}. Nothing charged until the work is done.
            </div>{' '}
            <div onClick={vm.estSend} style={css(vm.estSendStyle)}>
              {T(vm.estSendLabel)}
            </div>{' '}
            <div style={css('font-size:11.5px;line-height:1.5;color:rgba(235,235,245,.4);margin-top:12px;text-align:center')}>
              {T(vm.estFoot)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
