import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/car-hero.js';

export function Customer({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div
          onClick={vm.dgoCustomers}
          style={css('display:inline-flex;align-items:center;gap:2px;font-size:13px;font-weight:500;color:#e0312b;cursor:pointer')}
        >
          <svg viewBox="0 0 24 24" style={css('width:15px;height:15px;display:block;flex:0 0 auto')}>
            <path
              d="M15 6l-6 6 6 6"
              style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
            />
          </svg>
          Customers
        </div>{' '}
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;gap:20px')}>
          <div style={css('display:flex;align-items:center;gap:16px')}>
            <div
              style={css(
                'width:56px;height:56px;border-radius:28px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600',
              )}
            >
              {T(vm.cust?.initials)}
            </div>
            <div>
              <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px;line-height:1.1')}>{T(vm.cust?.name)}</div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:6px')}>{T(vm.cust?.meta)}</div>
            </div>
          </div>
          <div style={css('display:flex;gap:8px;flex:0 0 auto')}>
            <div
              onClick={vm.dgoInbox}
              style={css('padding:11px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer')}
            >
              Message
            </div>
            <div
              onClick={vm.dgoApprovals}
              style={css(
                'padding:11px 18px;border-radius:10px;background:rgba(235,235,245,.1);font-size:13px;font-weight:500;cursor:pointer',
              )}
            >
              Open work order
            </div>
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:24px')}>
          {L(vm.custStats).map((x, _i) => (
            <React.Fragment key={_i}>
              <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px')}>
                <div style={css('font-size:26px;font-weight:500;letter-spacing:-.6px')}>{T(x?.n)}</div>
                <div
                  style={css(
                    'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:6px',
                  )}
                >
                  {T(x?.l)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:14px;margin-top:14px;align-items:start')}>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px 24px')}>
              <div style={css('display:flex;gap:22px;align-items:center')}>
                <div style={css('width:250px;height:150px;flex:0 0 auto')}>
                  <div className="sc-host-x" style={css('width:250px;height:150px')}>
                    <car-hero
                      view={'quarter'}
                      paint={vm.custCar?.paint}
                      autorotate={'true'}
                      drag={'true'}
                      model={'/uploads/hardtop.glb.txt /uploads/hardtop.obj'}
                    />
                  </div>
                </div>
                <div style={css('flex:1;min-width:0')}>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                    )}
                  >
                    Vehicle record
                  </div>
                  <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px;margin-top:8px')}>{T(vm.custCar?.name)}</div>
                  <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:4px')}>{T(vm.custCar?.sub)}</div>
                  <div style={css('display:flex;gap:6px;margin-top:14px;flex-wrap:wrap')}>
                    {L(vm.custCar?.pills).map((p, _i) => (
                      <React.Fragment key={_i}>
                        <div style={css(p?.style)}>{T(p?.t)}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <div
                style={css(
                  'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 28px;margin-top:20px;border-top:1px solid rgba(235,235,245,.09)',
                )}
              >
                {L(vm.custCar?.specs).map((r, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css(
                        'display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:12.5px',
                      )}
                    >
                      <span style={css('color:rgba(235,235,245,.5)')}>{T(r?.k)}</span>
                      <span style={css('text-align:right')}>{T(r?.v)}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 24px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:center;gap:16px')}>
                <div>
                  <div style={css('font-size:15px;font-weight:600')}>Recalls</div>
                  <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px')}>{T(vm.recall?.sub)}</div>
                </div>
                <div onClick={vm.recall?.go} style={css(vm.recall?.btnStyle)}>
                  {T(vm.recall?.btn)}
                </div>
              </div>
              {vm.recall?.checking ? (
                <>
                  <div style={css('margin-top:16px;display:flex;align-items:center;gap:12px')}>
                    <div style={css(`flex:1;${vm.recall?.scanBase ?? ''}`)}>
                      <div style={css(vm.recall?.scanFill)} />
                    </div>
                    <div
                      style={css(
                        'font-family:var(--data-font,inherit);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.5)',
                      )}
                    >
                      Querying NHTSA
                    </div>
                  </div>
                </>
              ) : null}
              {vm.recall?.hasRows ? (
                <>
                  <div style={css('margin-top:14px;border-top:1px solid rgba(235,235,245,.09)')}>
                    {L(vm.recall?.rows).map((r, _i) => (
                      <React.Fragment key={_i}>
                        <div
                          style={css(
                            'padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;gap:16px;align-items:flex-start',
                          )}
                        >
                          <div style={css(r?.pill)}>{T(r?.id)}</div>
                          <div style={css('flex:1;min-width:0')}>
                            <div style={css('font-size:13.5px;font-weight:500')}>{T(r?.t)}</div>
                            <div style={css('font-size:12.5px;line-height:1.5;color:rgba(235,235,245,.6);margin-top:4px')}>{T(r?.d)}</div>
                            <div style={css('font-size:11px;color:rgba(235,235,245,.4);margin-top:6px')}>{T(r?.m)}</div>
                          </div>
                          {r?.cta ? (
                            <>
                              <div
                                onClick={r?.go}
                                style={css(
                                  'padding:9px 14px;border-radius:9px;background:#fff;color:#000;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;flex:0 0 auto',
                                )}
                              >
                                {T(r?.cta)}
                              </div>
                            </>
                          ) : null}
                          {r?.state ? (
                            <>
                              <div style={css('font-size:12px;font-weight:500;color:#30d158;white-space:nowrap;flex:0 0 auto')}>
                                {T(r?.state)}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {vm.recall?.none ? (
                <>
                  <div style={css('margin-top:14px;display:flex;align-items:center;gap:9px')}>
                    <div style={css('width:8px;height:8px;border-radius:4px;background:#30d158')} />
                    <div style={css('font-size:13px')}>No open recalls for this VIN.</div>
                  </div>
                </>
              ) : null}
              <div style={css('margin-top:12px;font-size:11px;line-height:1.5;color:rgba(235,235,245,.35)')}>{T(vm.recall?.foot)}</div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px 24px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
                <div style={css('font-size:15px;font-weight:600')}>Service history</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(vm.custHistCount)}</div>
              </div>
              <div style={css('margin-top:12px;border-top:1px solid rgba(235,235,245,.09)')}>
                {L(vm.custHist).map((h, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css(
                        'display:grid;grid-template-columns:120px minmax(0,1fr) 90px 90px;gap:14px;padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;align-items:center',
                      )}
                    >
                      <div style={css('color:rgba(235,235,245,.5)')}>{T(h?.date)}</div>
                      <div style={css('min-width:0')}>
                        <div style={css('font-weight:500')}>{T(h?.title)}</div>
                        <div
                          style={css(
                            'font-size:11.5px;color:rgba(235,235,245,.45);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
                          )}
                        >
                          {T(h?.notes)}
                        </div>
                      </div>
                      <div style={css('color:rgba(235,235,245,.6)')}>{T(h?.miles)}</div>
                      <div style={css('text-align:right;font-weight:500')}>{T(h?.total)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
              <div style={css('font-size:15px;font-weight:600')}>Health</div>
              <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
                {L(vm.custHealth).map((h, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css(
                        'display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px',
                      )}
                    >
                      <div style={css(h?.dot)} />
                      <div style={css('flex:1')}>{T(h?.name)}</div>
                      <div style={css('color:rgba(235,235,245,.55);font-size:12.5px')}>{T(h?.status)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
              <div style={css('font-size:15px;font-weight:600')}>Preferences</div>
              <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
                {L(vm.custPrefs).map((r, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css(
                        'display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:12.5px',
                      )}
                    >
                      <span style={css('color:rgba(235,235,245,.5);flex:0 0 auto')}>{T(r?.k)}</span>
                      <span style={css('text-align:right')}>{T(r?.v)}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
              <div style={css('font-size:15px;font-weight:600')}>Documents</div>
              <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
                {L(vm.custDocs).map((d, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      style={css('display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07)')}
                    >
                      <div
                        style={css(
                          'width:28px;height:34px;border-radius:5px;background:rgba(255,255,255,.04);border:1px solid rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:8.5px;color:rgba(235,235,245,.4)',
                        )}
                      >
                        PDF
                      </div>
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css('font-size:13px;font-weight:500')}>{T(d?.t)}</div>
                        <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:2px')}>{T(d?.m)}</div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
