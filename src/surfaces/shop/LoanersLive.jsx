import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const INPUT = "width:100%;background:rgba(255,255,255,.06);border:0;outline:0;border-radius:10px;padding:11px 12px;font-size:13px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const BTN = 'padding:11px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap';
const GHOST = 'padding:11px 16px;border-radius:10px;background:#1c1c1e;color:rgba(235,235,245,.85);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap';

export function LoanersLive({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:20px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Loaners</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{T(vm.fleetSub)}</div>
          </div>
          <div style={css('display:flex;align-items:center;gap:14px')}>
            <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);text-align:right;line-height:1.5')}>
              Agreement text is a draft template.
              <br />
              Have it reviewed before customers sign.
            </div>
            <div onClick={vm.openNew} style={css(BTN)} className="px2">New rental</div>
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:290px minmax(0,1fr);gap:14px;margin-top:22px;align-items:start')}>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:center')}>
                <div style={css('font-size:15px;font-weight:500')}>Fleet</div>
                <div onClick={vm.openFleet} style={css('font-size:12px;font-weight:500;color:rgba(235,235,245,.7);cursor:pointer')}>+ Add vehicle</div>
              </div>
              {vm.fleetOpen ? (
                <div style={css('margin-top:12px;padding:12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(235,235,245,.1)')}>
                  <div style={css('display:grid;grid-template-columns:70px 1fr;gap:6px')}>
                    <input placeholder="Year" inputMode="numeric" value={val(vm.fv?.year)} onChange={vm.onF?.('year')} style={css(INPUT)} />
                    <input placeholder="Make" value={val(vm.fv?.make)} onChange={vm.onF?.('make')} style={css(INPUT)} />
                  </div>
                  <input placeholder="Model" value={val(vm.fv?.model)} onChange={vm.onF?.('model')} style={css(INPUT + ';margin-top:6px')} />
                  <input placeholder="Color" value={val(vm.fv?.color)} onChange={vm.onF?.('color')} style={css(INPUT + ';margin-top:6px')} />
                  <div style={css('display:flex;gap:6px;margin-top:8px;flex-wrap:wrap')}>
                    {L(vm.fPaints).map((p, _i) => <div key={_i} onClick={p?.pick} style={css(p?.style)} />)}
                  </div>
                  <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px')}>
                    <input placeholder="Plate" value={val(vm.fv?.plate)} onChange={vm.onF?.('plate')} style={css(INPUT + ';font-family:var(--data-font,inherit)')} />
                    <input placeholder="VIN last 4" value={val(vm.fv?.vin)} onChange={vm.onF?.('vin')} style={css(INPUT + ';font-family:var(--data-font,inherit)')} />
                    <input placeholder="Odometer" inputMode="numeric" value={val(vm.fv?.odometer)} onChange={vm.onF?.('odometer')} style={css(INPUT)} />
                    <input placeholder={vm.fv?.ev ? 'Charge %' : 'Fuel %'} inputMode="numeric" value={val(vm.fv?.level)} onChange={vm.onF?.('level')} style={css(INPUT)} />
                  </div>
                  <div style={css('display:flex;gap:6px;margin-top:6px')}>
                    {[['Gas', false], ['Electric', true]].map(([l, ev]) => (
                      <div key={l} onClick={() => vm.setFEv?.(ev)} style={css('flex:1;text-align:center;padding:9px 0;border-radius:9px;font-size:12px;font-weight:500;cursor:pointer;' + (!!vm.fv?.ev === ev ? 'background:#fff;color:#000;' : 'background:rgba(255,255,255,.06);color:rgba(235,235,245,.75);'))}>{l}</div>
                    ))}
                  </div>
                  <div style={css('display:flex;justify-content:flex-end;gap:6px;margin-top:10px')}>
                    <div onClick={vm.closeFleet} style={css(GHOST + ';padding:9px 12px;font-size:12px')}>Cancel</div>
                    <div onClick={vm.fSubmit} style={css(vm.fCtaStyle)}>{T(vm.fCta)}</div>
                  </div>
                </div>
              ) : null}
              {vm.err ? <div style={css('font-size:12px;color:#e0312b;margin-top:8px;line-height:1.5')}>{T(vm.err)}</div> : null}
              {!vm.err && !vm.loading && !L(vm.loanerFleet).length ? <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:8px;line-height:1.5')}>No loaner vehicles yet. Add the first one above.</div> : null}
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
                        {l?.canToggle ? (
                          <div style={css('margin-top:4px;font-size:10.5px;font-weight:400;color:rgba(235,235,245,.4)')}>
                            <span onClick={l?.toggle} style={css('cursor:pointer')}>{T(l?.toggleLabel)}</span>
                            {' · '}
                            <span onClick={l?.retire} style={css('cursor:pointer')}>Remove</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:center')}>
                <div style={css('font-size:15px;font-weight:500')}>Rentals</div>
                <div style={css('display:flex;gap:4px')}>{L(vm.rFilters).map((f, _i) => <div key={_i} onClick={f?.pick} style={css(f?.style)}>{T(f?.label)}</div>)}</div>
              </div>
              <input placeholder="Search name, number, plate" value={val(vm.rSearch)} onChange={vm.onRSearch} style={css(INPUT + ';margin-top:10px;padding:9px 12px;font-size:12.5px')} />
              <div style={css('margin-top:6px')}>
                {L(vm.rentalList).map((x, _i) => (
                  <React.Fragment key={_i}>
                    <div onClick={x?.pick} style={css(x?.style)}>
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
          {vm.newOpen ? (
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px 24px')}>
              <div style={css('font-size:22px;font-weight:500;letter-spacing:-.4px')}>New rental</div>
              <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>Who is taking the loaner. Vehicle, dates and terms come next.</div>
              <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px')}>
                <div><div style={css(LBL + ';margin-bottom:8px')}>Customer</div><input placeholder="Full name" value={val(vm.dName)} onChange={vm.onDName} style={css(INPUT)} autoFocus /></div>
                <div><div style={css(LBL + ';margin-bottom:8px')}>Mobile</div><input placeholder="(435) 555-0100" inputMode="tel" value={val(vm.dPhone)} onChange={vm.onDPhone} style={css(INPUT)} /></div>
                <div><div style={css(LBL + ';margin-bottom:8px')}>Their car · plate</div><input placeholder="Optional" value={val(vm.dPlate)} onChange={vm.onDPlate} style={css(INPUT + ';font-family:var(--data-font,inherit)')} /></div>
                <div><div style={css(LBL + ';margin-bottom:8px')}>Work</div><input placeholder="e.g. Front brakes · Bay 01" value={val(vm.dWork)} onChange={vm.onDWork} style={css(INPUT)} /></div>
              </div>
              <div style={css('display:flex;justify-content:flex-end;gap:8px;margin-top:20px')}>
                <div onClick={vm.closeNew} style={css(GHOST)}>Cancel</div>
                <div onClick={vm.dSubmit} style={css(vm.dCtaStyle)}>{T(vm.dCta)}</div>
              </div>
            </div>
          ) : !vm.hasSel ? (
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:60px 24px;text-align:center')}>
              <div style={css('font-size:18px;font-weight:500')}>{vm.loading ? 'Loading…' : 'No rentals yet.'}</div>
              {!vm.loading ? <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>Start one with New rental. The customer signs on their phone.</div> : null}
            </div>
          ) : (
          <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px 24px')}>
            <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:16px')}>
              <div style={css('flex:1;min-width:0')}>
                <div
                  style={css('font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:rgba(235,235,245,.45)')}
                >
                  {T(vm.rental?.no)}
                </div>
                {vm.rLocked ? (
                  <>
                    <div style={css('font-size:22px;font-weight:500;letter-spacing:-.4px;margin-top:6px')}>{T(vm.rental?.who)}</div>
                    <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>
                      {T(vm.rental?.work)}
                      {' · '}
                      {T(vm.rental?.car)}
                    </div>
                  </>
                ) : (
                  <div style={css('display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px;margin-top:8px')}>
                    <input placeholder="Customer name" value={val(vm.rName)} onChange={vm.onRName} style={css(INPUT + ';font-size:15px;font-weight:500')} />
                    <input placeholder="Mobile" inputMode="tel" value={val(vm.rPhone)} onChange={vm.onRPhone} style={css(INPUT)} />
                    <input placeholder="Work · bay" value={val(vm.rWork)} onChange={vm.onRWork} style={css(INPUT)} />
                  </div>
                )}
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
                <div style={css('margin-top:10px;display:flex;justify-content:space-between;align-items:center')}>
                  <div style={css('font-size:13px;font-weight:500')}>{T(vm.calMonth)}</div>
                  <div style={css('display:flex;gap:4px')}>
                    <div onClick={vm.calPrev} style={css('padding:2px 8px;border-radius:6px;background:#1c1c1e;cursor:pointer;font-size:12px')}>‹</div>
                    <div onClick={vm.calNext} style={css('padding:2px 8px;border-radius:6px;background:#1c1c1e;cursor:pointer;font-size:12px')}>›</div>
                  </div>
                </div>
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
              {vm.canCancel ? <div onClick={vm.cancelRental} style={css('font-size:12.5px;color:rgba(235,235,245,.45);cursor:pointer')}>Cancel</div> : null}
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
            <div style={css('display:flex;align-items:center;gap:10px;margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(235,235,245,.08)')}>
              <div style={css('flex:1;min-width:0')}>
                <div style={css(LBL)}>Customer link</div>
                <div style={css('font-family:var(--data-font,inherit);font-size:12px;color:rgba(235,235,245,.7);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{T(vm.rLink)}</div>
              </div>
              <div onClick={vm.copyLink} style={css(GHOST)}>{vm.copied ? 'Copied' : 'Copy link'}</div>
              <a href={vm.smsHref} style={css(BTN + ';text-decoration:none')}>Text it</a>
            </div>
            {vm.record ? (
              <div style={css('margin-top:18px;padding:18px 20px;border-radius:14px;background:#0f0f10;border:1px solid rgba(235,235,245,.1)')}>
                <div style={css('display:flex;justify-content:space-between;align-items:flex-start')}>
                  <div>
                    <div style={css('font-size:17px;font-weight:500')}>{T(vm.record?.title)}</div>
                    <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.record?.sub)}</div>
                  </div>
                  <div onClick={vm.recClose} style={css('font-size:12.5px;color:rgba(235,235,245,.45);cursor:pointer')}>Close</div>
                </div>
                <div style={css('display:grid;grid-template-columns:1fr 1fr 2fr;gap:12px;margin-top:16px')}>
                  <div><div style={css(LBL + ';margin-bottom:8px')}>Odometer</div><input inputMode="numeric" placeholder="miles" value={val(vm.recOdo)} onChange={vm.onRecOdo} style={css(INPUT + ';font-family:var(--data-font,inherit);font-size:16px')} /></div>
                  <div><div style={css(LBL + ';margin-bottom:8px')}>{T(vm.record?.levelLabel)}</div><input inputMode="numeric" placeholder="0–100" value={val(vm.recLevel)} onChange={vm.onRecLevel} style={css(INPUT + ';font-family:var(--data-font,inherit);font-size:16px')} /></div>
                  <div>
                    <div style={css(LBL + ';margin-bottom:8px')}>Photos</div>
                    <div style={css('display:flex;gap:6px;flex-wrap:wrap;align-items:center')}>
                      {L(vm.recPhotos).map((p, _i) => (
                        <img key={_i} src={p} alt="" style={css('width:52px;height:40px;object-fit:cover;border-radius:6px')} />
                      ))}
                      <label style={css('width:52px;height:40px;border-radius:6px;border:1px dashed rgba(235,235,245,.3);display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(235,235,245,.6);cursor:pointer')}>
                        +<input type="file" accept="image/*" capture="environment" multiple onChange={vm.onRecPhoto} style={css('display:none')} />
                      </label>
                    </div>
                  </div>
                </div>
                {L(vm.recExtras).length ? (
                  <div style={css('margin-top:14px;border:1px solid rgba(235,235,245,.1);border-radius:10px;padding:2px 12px')}>
                    {L(vm.recExtras).map((x, _i) => (
                      <div key={_i} style={css('display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:12.5px')}>
                        <span style={css('color:rgba(235,235,245,.6)')}>{T(x?.k)}</span><span>{T(x?.v)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div style={css('display:flex;justify-content:flex-end;margin-top:16px')}>
                  <div onClick={vm.recSubmit} style={css(vm.recCtaStyle)}>{T(vm.recCta)}</div>
                </div>
              </div>
            ) : null}
          </div>
          )}
        </div>
      </div>
    </>
  );
}
