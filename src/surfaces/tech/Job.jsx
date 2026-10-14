import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/car-hero.js';

export function Job({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;height:100%;display:flex')}>
        <div
          style={css(
            'width:320px;flex:0 0 320px;border-right:1px solid rgba(235,235,245,.07);padding:30px 26px;display:flex;flex-direction:column',
          )}
        >
          <div
            onClick={vm.tgoToday}
            style={css('font-size:13px;color:#e0312b;cursor:pointer;display:inline-flex;align-items:center;gap:2px;font-weight:500')}
          >
            <svg viewBox="0 0 24 24" style={css('width:15px;height:15px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
            Today
          </div>
          <div className="sc-host-x" style={css('height:170px')}>
            <car-hero
              view={'quarter'}
              paint={vm.job?.paint}
              autorotate={'true'}
              drag={'true'}
              model={'/uploads/hardtop.glb.txt /uploads/hardtop.obj'}
            />
          </div>
          <div style={css('font-size:26px;font-weight:600;letter-spacing:-.7px;margin-top:18px')}>{T(vm.job?.car)}</div>
          <div style={css('font-size:14px;color:rgba(235,235,245,.6);margin-top:5px')}>
            {T(vm.job?.who)}
            {' · '}
            {T(vm.job?.miles)}
            {' miles'}
          </div>
          <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:3px')}>{T(vm.job?.meta)}</div>
          <div
            style={css('margin-top:20px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:14px 16px')}
          >
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Customer concern
            </div>
            <div style={css('font-size:15px;line-height:1.45;margin-top:6px;font-style:italic')}>“{T(vm.job?.concern)}”</div>
          </div>
          <div
            style={css('margin-top:12px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:14px 16px')}
          >
            <div
              style={css(
                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Status
            </div>
            <div style={css(`font-size:15px;font-weight:500;margin-top:6px;color:${vm.job?.color ?? ''}`)}>{T(vm.job?.status)}</div>
          </div>
          {vm.job?.live ? (
            <>
              <div style={css('margin-top:12px;display:flex;flex-wrap:wrap;gap:6px')}>
                {L(vm.askChipsTech).map((q, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      onClick={q?.send}
                      style={css(
                        'padding:9px 12px;border-radius:10px;border:1px solid rgba(235,235,245,.16);font-size:12px;color:rgba(235,235,245,.8);cursor:pointer',
                      )}
                      className="px1"
                    >
                      {T(q?.text)}
                    </div>
                  </React.Fragment>
                ))}
              </div>
              {vm.needInfo ? (
                <>
                  <div style={css('margin-top:10px;font-size:12px;color:#ffd60a')}>Question sent · waiting on Rennan</div>
                </>
              ) : null}
            </>
          ) : null}
          <div style={css('flex:1')} />
          <div style={css('font-size:11px;line-height:1.6;color:rgba(235,235,245,.32)')}>
            {'Visit type · '}
            {T(vm.job?.visit)}
            <br />
            {'Loaner · '}
            {T(vm.job?.loaner)}
          </div>
        </div>
        <div style={css('flex:1;min-width:0;padding:30px 34px;overflow-y:auto')} className="hidescroll">
          <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
            <div style={css('font-size:26px;font-weight:500;letter-spacing:-.4px')}>Today's inspection</div>
            <div style={css('font-size:14px;color:rgba(235,235,245,.5)')}>{T(vm.inspProgress)}</div>
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:20px')}>
            {L(vm.inspCats).map((c, _i) => (
              <React.Fragment key={_i}>
                <div onClick={c?.go} style={css(c?.style)}>
                  <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:12px')}>
                    <div style={css('color:rgba(235,235,245,.85)')}>
                      <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
                        <path
                          d={c?.d}
                          style={css('fill:none;stroke:currentColor;stroke-width:1.6px;stroke-linecap:round;stroke-linejoin:round')}
                        />
                      </svg>
                    </div>
                    <div style={css(c?.box)}>
                      {c?.on ? (
                        <>
                          <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                            <path
                              d="M5 12.5l4.5 4.5L19 7"
                              style={css('fill:none;stroke:currentColor;stroke-width:2.6px;stroke-linecap:round;stroke-linejoin:round')}
                            />
                          </svg>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div style={css('font-size:16px;font-weight:500;line-height:1.2;margin-top:14px')}>{T(c?.name)}</div>{' '}
                  <div style={css(`font-size:12px;color:${c?.subColor ?? ''};margin-top:10px`)}>{T(c?.sub)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          {vm.otherJobNote ? (
            <>
              <div
                style={css(
                  'margin-top:22px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px',
                )}
              >
                <div style={css('display:flex;align-items:center;gap:14px')}>
                  <div style={css(vm.job?.dot)} />
                  <div style={css('flex:1')}>
                    <div style={css('font-size:18px;font-weight:500')}>{T(vm.job?.status)}</div>
                    <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.otherJobNote)}</div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {vm.reportReady ? (
            <>
              <div
                style={css(
                  'margin-top:22px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px;animation:sIn .3s ease',
                )}
              >
                <div style={css('display:flex;align-items:center;gap:14px')}>
                  <div
                    style={css('width:10px;height:10px;border-radius:5px;background:#ffd60a;box-shadow:0 0 0 4px rgba(255,214,10,.18)')}
                  />
                  <div style={css('flex:1')}>
                    <div style={css('font-size:18px;font-weight:500')}>Customer report ready</div>
                    <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:3px')}>
                      3 findings will be sent to Rennan. Written in plain language from your measurements.
                    </div>
                  </div>
                  <div
                    onClick={vm.tgoReport}
                    style={css(
                      'padding:13px 20px;border-radius:12px;background:rgba(235,235,245,.1);font-size:14px;font-weight:500;cursor:pointer',
                    )}
                  >
                    Review
                  </div>
                  <div
                    onClick={vm.sendReport}
                    style={css(
                      'padding:13px 22px;border-radius:12px;background:#fff;color:#000;font-size:14px;font-weight:500;cursor:pointer',
                    )}
                  >
                    Send
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {vm.reportSent ? (
            <>
              <div
                style={css(
                  'margin-top:22px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px',
                )}
              >
                <div style={css('display:flex;align-items:center;gap:14px')}>
                  <div style={css(vm.repairDot)} />
                  <div style={css('flex:1')}>
                    <div style={css('font-size:18px;font-weight:500')}>{T(vm.repairTitle)}</div>
                    <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.repairSub)}</div>
                  </div>
                  {vm.repairCta ? (
                    <>
                      <div
                        onClick={vm.repairGo}
                        style={css(
                          'padding:13px 22px;border-radius:12px;background:#fff;color:#000;font-size:14px;font-weight:500;cursor:pointer',
                        )}
                      >
                        {T(vm.repairCta)}
                      </div>
                    </>
                  ) : null}
                </div>
                {vm.showParts ? (
                  <>
                    <div style={css('margin-top:16px;padding-top:16px;border-top:1px solid rgba(235,235,245,.08)')}>
                      <div style={css('display:flex;justify-content:space-between;align-items:center')}>
                        <div
                          style={css(
                            'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                          )}
                        >
                          Parts · Front brake service
                        </div>
                        <div style={css(vm.partsPill)}>{T(vm.partsPillText)}</div>
                      </div>
                      <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
                        {L(vm.partsList).map((p, _i) => (
                          <React.Fragment key={_i}>
                            <div
                              style={css(
                                'padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:14px',
                              )}
                            >
                              <div style={css(p?.dot)} />
                              <div style={css('flex:1;min-width:0')}>
                                <div style={css('font-size:14px;font-weight:500')}>{T(p?.name)}</div>
                                <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:2px')}>{T(p?.sku)}</div>
                              </div>
                              <div style={css(`font-size:12.5px;font-weight:500;color:${p?.c ?? ''}`)}>{T(p?.status)}</div>
                              {p?.cta ? (
                                <>
                                  <div
                                    onClick={p?.go}
                                    style={css(
                                      'padding:9px 14px;border-radius:10px;background:rgba(235,235,245,.1);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap',
                                    )}
                                  >
                                    {T(p?.cta)}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                      {vm.orderOpen ? (
                        <>
                          <div style={css('margin-top:16px;animation:sIn .25s ease')}>
                            <div
                              style={css(
                                'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                              )}
                            >
                              Order rotors from
                            </div>
                            <div style={css('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px')}>
                              {L(vm.suppliers).map((x, _i) => (
                                <React.Fragment key={_i}>
                                  <div onClick={x?.pick} style={css(x?.style)} className="px4">
                                    <div style={css('font-size:14px;font-weight:600')}>{T(x?.name)}</div>
                                    <div style={css(`font-size:12.5px;margin-top:8px;font-weight:500;color:${x?.c ?? ''}`)}>
                                      {T(x?.eta)}
                                    </div>
                                    <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:3px')}>{T(x?.price)}</div>
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                            <div style={css('margin-top:10px;font-size:11.5px;line-height:1.5;color:rgba(235,235,245,.4)')}>
                              A supplier that can’t deliver today moves Rennan’s estimate automatically and tells him why. His loaner
                              extends to match.
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
          {vm.tireJob ? (
            <>
              <div
                style={css(
                  'margin-top:22px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px;animation:sIn .3s ease',
                )}
              >
                <div style={css('display:flex;align-items:center;gap:14px')}>
                  <div
                    style={css('width:10px;height:10px;border-radius:5px;background:#30d158;box-shadow:0 0 0 4px rgba(48,209,88,.18)')}
                  />
                  <div style={css('flex:1')}>
                    <div style={css('font-size:18px;font-weight:600')}>
                      {'Tires added · '}
                      {T(vm.tireJobName)}
                    </div>
                    <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.tireJobSub)}</div>
                  </div>
                  <div style={css(vm.tireJobPill)}>{T(vm.tireJobState)}</div>
                </div>
                <div
                  style={css(
                    'margin-top:16px;padding-top:16px;border-top:1px solid rgba(235,235,245,.09);display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px',
                  )}
                >
                  <div>
                    <div
                      style={css(
                        'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                      )}
                    >
                      Size
                    </div>
                    <div style={css('font-family:var(--data-font,inherit);font-size:14px;margin-top:6px')}>255/45R19</div>
                  </div>
                  <div>
                    <div
                      style={css(
                        'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                      )}
                    >
                      Torque
                    </div>
                    <div style={css('font-family:var(--data-font,inherit);font-size:14px;margin-top:6px')}>129 lb-ft</div>
                  </div>
                  <div>
                    <div
                      style={css(
                        'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                      )}
                    >
                      Set pressure
                    </div>
                    <div style={css('font-family:var(--data-font,inherit);font-size:14px;margin-top:6px')}>42 psi</div>
                  </div>
                  <div>
                    <div
                      style={css(
                        'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                      )}
                    >
                      TPMS
                    </div>
                    <div style={css('font-size:14px;margin-top:6px')}>Relearn after install</div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {vm.needsStartInsp ? (
            <>
              <div style={css('margin-top:22px;display:flex;justify-content:flex-end')}>
                <div
                  onClick={vm.startInspection}
                  style={css(
                    'padding:15px 26px;border-radius:12px;background:#fff;color:#000;font-size:14px;font-weight:500;cursor:pointer',
                  )}
                >
                  Start inspection
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
