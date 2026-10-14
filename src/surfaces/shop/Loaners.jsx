import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Loaners({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:20px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Loaners</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>4 vehicles · 72% utilization this month</div>
          </div>
          <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);text-align:right;line-height:1.5')}>
            Agreement text is a draft template.
            <br />
            Have your attorney review it before use.
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:290px minmax(0,1fr);gap:14px;margin-top:22px;align-items:start')}>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
              <div style={css('font-size:15px;font-weight:500')}>Fleet</div>
              <div style={css('margin-top:6px')}>
                {L(vm.loanerFleet).map((l, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07)')}
                    >
                      <div style={css(l?.dot)} />
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css('font-size:13px;font-weight:500')}>{T(l?.car)}</div>
                        <div style={css('font-size:11.5px;color:rgba(235,235,245,.5);margin-top:2px')}>
                          {T(l?.color)}
                          {' · ···· '}
                          {T(l?.vin)}
                          {' · '}
                          {T(l?.miles)}
                          {' mi'}
                        </div>
                      </div>
                      <div
                        style={css(
                          `font-size:11.5px;font-weight:500;text-align:right;max-width:90px;line-height:1.3;color:${l?.stateColor ?? ''}`,
                        )}
                      >
                        {T(l?.state)}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
              <div style={css('font-size:15px;font-weight:500')}>Rentals</div>
              <div style={css('margin-top:6px')}>
                {L(vm.rentalList).map((x, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css('display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07)')}
                    >
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css('font-size:13px;font-weight:500')}>{T(x?.who)}</div>
                        <div style={css('font-size:11.5px;color:rgba(235,235,245,.5);margin-top:2px')}>{T(x?.sub)}</div>
                      </div>
                      <div
                        style={css(
                          `font-size:11.5px;font-weight:500;text-align:right;max-width:100px;line-height:1.3;color:${x?.color ?? ''}`,
                        )}
                      >
                        {T(x?.state)}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px 24px')}>
            <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:16px')}>
              <div>
                <div
                  style={css('font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:rgba(235,235,245,.45)')}
                >
                  {T(vm.rental?.no)}
                  {' · WO-8842'}
                </div>
                <div style={css('font-size:22px;font-weight:500;letter-spacing:-.4px;margin-top:6px')}>{T(vm.rental?.who)}</div>
                <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>
                  {'Front brake service · Bay 01 · '}
                  {T(vm.rental?.car)}
                </div>
              </div>
              <div style={css(vm.rental?.statusStyle)}>{T(vm.rental?.status)}</div>
            </div>
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px')}>
              <div>
                <div
                  style={css(
                    'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                  )}
                >
                  Vehicle
                </div>
                <div style={css('display:flex;flex-direction:column;gap:6px;margin-top:8px')}>
                  {L(vm.rVehicles).map((v, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={v?.pick} style={css(v?.style)}>
                        <div style={css(v?.dot)} />
                        <div style={css('flex:1;font-size:12.5px;font-weight:500')}>{T(v?.car)}</div>
                        <div style={css('font-size:11px;opacity:.6;white-space:nowrap')}>{T(v?.sub)}</div>
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
                  Rate
                </div>
                <div style={css('display:flex;gap:8px;margin-top:8px')}>
                  {L(vm.rPay).map((p, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={p?.pick} style={css(p?.style)}>
                        {T(p?.label)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div style={css('margin-top:12px;border:1px solid rgba(235,235,245,.1);border-radius:12px;padding:2px 14px')}>
                  {L(vm.rSummary).map((x, _i) => (
                    <React.Fragment key={_i}>
                      <div
                        style={css(
                          'display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:12.5px',
                        )}
                      >
                        <span style={css('color:rgba(235,235,245,.5)')}>{T(x?.k)}</span>
                        <span style={css(`text-align:right;color:${x?.c ?? ''}`)}>{T(x?.v)}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:24px')}>
              <div>
                <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                    )}
                  >
                    Rental dates
                  </div>
                  <div style={css('font-size:11px;color:rgba(235,235,245,.35)')}>Click pickup, then return</div>
                </div>
                <div style={css('margin-top:10px;font-size:13px;font-weight:500')}>October 2026</div>
                <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:8px')}>
                  {L(vm.calHead).map((h, _i) => (
                    <React.Fragment key={_i}>
                      <div style={css('text-align:center;font-size:10.5px;color:rgba(235,235,245,.35);padding:4px 0')}>{T(h?.t)}</div>
                    </React.Fragment>
                  ))}
                  {L(vm.calCells).map((c, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={c?.pick} style={css(c?.style)}>
                        {T(c?.label)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div style={css('margin-top:12px;font-size:11.5px;line-height:1.5;color:rgba(235,235,245,.42)')}>{T(vm.calNote)}</div>
              </div>
              <div>
                <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                    )}
                  >
                    Agreement terms
                  </div>
                  <div style={css('font-size:11px;color:rgba(235,235,245,.35)')}>{T(vm.rClauseHint)}</div>
                </div>{' '}
                <div style={css(vm.rClauseWrap)}>
                  {L(vm.rClauses).map((c, _i) => (
                    <React.Fragment key={_i}>
                      <div style={css(c?.rowStyle)}>
                        <div onClick={c?.toggle} style={css('display:flex;align-items:center;gap:10px;cursor:pointer')}>
                          <div style={css(c?.boxStyle)}>
                            <svg viewBox="0 0 24 24" style={css('width:11px;height:11px;display:block;flex:0 0 auto')}>
                              <path
                                d="M5 12.5l4.5 4.5L19 7"
                                style={css('fill:none;stroke:currentColor;stroke-width:2.8px;stroke-linecap:round;stroke-linejoin:round')}
                              />
                            </svg>
                          </div>
                          <div style={css('font-size:12.5px;font-weight:500;flex:1')}>{T(c?.t)}</div>
                        </div>
                        {c?.hasOpts ? (
                          <>
                            <div style={css('display:flex;gap:6px;margin:8px 0 0 28px;flex-wrap:wrap')}>
                              {L(c?.opts).map((o, _i1) => (
                                <React.Fragment key={_i1}>
                                  <div onClick={o?.pick} style={css(o?.style)}>
                                    {T(o?.label)}
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div style={css('margin-top:24px')}>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                Customer sees
              </div>
              <div
                style={css(
                  'margin-top:8px;border:1px solid rgba(235,235,245,.1);border-radius:12px;padding:16px 18px;max-height:220px;overflow-y:auto',
                )}
                className="hidescroll"
              >
                <div style={css('display:flex;align-items:center;gap:8px')}>
                  <div style={css('font-size:14px;font-weight:500')}>Loaner Vehicle Agreement</div>
                  <div
                    style={css(
                      'font-size:9.5px;font-weight:600;letter-spacing:.08em;padding:2px 6px;border-radius:4px;background:rgba(255,214,10,.16);color:#ffd60a',
                    )}
                  >
                    DRAFT
                  </div>
                </div>
                <div style={css('font-size:12px;line-height:1.55;color:rgba(235,235,245,.55);margin-top:6px')}>{T(vm.rPreviewMeta)}</div>
                <div style={css('display:flex;flex-direction:column;gap:12px;margin-top:14px')}>
                  {L(vm.agreeClauses).map((c, _i) => (
                    <React.Fragment key={_i}>
                      <div>
                        <div style={css('font-size:12.5px;font-weight:500')}>{T(c?.title)}</div>
                        <div style={css('font-size:12px;line-height:1.6;color:rgba(235,235,245,.6);margin-top:3px')}>{T(c?.text)}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div
              style={css(
                'display:flex;align-items:center;gap:16px;margin-top:22px;padding-top:18px;border-top:1px solid rgba(235,235,245,.08)',
              )}
            >
              <div style={css('flex:1')}>
                <div style={css('font-size:14px;font-weight:500')}>{T(vm.rAction?.t)}</div>
                <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.rAction?.s)}</div>
              </div>
              {vm.rSigned ? (
                <>
                  <div
                    style={css(
                      'width:150px;height:56px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(235,235,245,.1);overflow:hidden',
                    )}
                  >
                    <svg viewBox={vm.rSigBox} preserveAspectRatio="xMidYMid meet" style={css('width:100%;height:100%;display:block')}>
                      <path
                        d={vm.sigPath}
                        style={css('fill:none;stroke:#fff;stroke-width:3px;stroke-linecap:round;stroke-linejoin:round')}
                      />
                    </svg>
                  </div>
                </>
              ) : null}
              {vm.rAction?.cta ? (
                <>
                  <div
                    onClick={vm.rAction?.go}
                    style={css(
                      'padding:12px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap',
                    )}
                  >
                    {T(vm.rAction?.cta)}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
