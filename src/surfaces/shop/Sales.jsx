import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Sales({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Vehicle Sales</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>
              Inventory, reservations, test drives, trade-ins.
            </div>
          </div>
          <div
            onClick={vm.toggleAdd}
            style={css('padding:11px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer')}
          >
            {T(vm.addLabel)}
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:24px')}>
          {L(vm.salesStats).map((x, _i) => (
            <React.Fragment key={_i}>
              <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
                <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>{T(x?.n)}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:6px')}>{T(x?.l)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        {vm.addOpen ? (
          <>
            <div
              style={css(
                'margin-top:18px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:22px;animation:sIn .25s ease',
              )}
            >
              <div style={css('font-size:15px;font-weight:500')}>Add vehicle</div>
              <div style={css('display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px')}>
                {L(vm.addFields).map((f, _i) => (
                  <React.Fragment key={_i}>
                    <div>
                      <div
                        style={css(
                          'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                        )}
                      >
                        {T(f?.l)}
                      </div>
                      <input
                        placeholder={f?.p}
                        style={css(
                          'margin-top:7px;width:100%;background:#0b0b0c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);border:none;border-radius:9px;padding:11px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit',
                        )}
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div style={css('display:flex;gap:10px;margin-top:16px;align-items:center')}>
                <div
                  style={css(
                    'border:1px dashed rgba(235,235,245,.18);border-radius:10px;padding:12px 16px;font-size:12.5px;color:rgba(235,235,245,.5);flex:1',
                  )}
                >
                  + Upload photos (exterior, interior, condition)
                </div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>Service history attaches automatically by VIN.</div>
                <div
                  onClick={vm.toggleAdd}
                  style={css(
                    'padding:12px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                  )}
                >
                  Save as draft
                </div>
              </div>
            </div>
          </>
        ) : null}
        <div style={css('display:flex;gap:6px;margin-top:26px')}>
          {L(vm.salesTabs).map((t, _i) => (
            <React.Fragment key={_i}>
              <div onClick={t?.pick} style={css(t?.style)}>
                {T(t?.label)}
              </div>
            </React.Fragment>
          ))}
        </div>
        {vm.stInventory ? (
          <>
            <div style={css('margin-top:14px;border-top:1px solid rgba(235,235,245,.09)')}>
              <div
                style={css(
                  'display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr 1fr 1fr;padding:12px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);border-bottom:1px solid rgba(235,235,245,.07)',
                )}
              >
                <div>Vehicle</div>
                <div>VIN</div>
                <div>Mileage</div>
                <div>Price</div>
                <div>Serviced here</div>
                <div>Status</div>
              </div>
              {L(vm.invRows).map((r, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      'display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr 1fr 1fr;padding:15px 0;font-size:13px;border-bottom:1px solid rgba(235,235,245,.07);align-items:center',
                    )}
                  >
                    <div style={css('display:flex;align-items:center;gap:12px')}>
                      <div style={css(`width:52px;height:36px;border-radius:7px;${r?.ph ?? ''}`)} />
                      <div>
                        <div style={css('font-weight:500')}>{T(r?.name)}</div>
                        <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:2px')}>
                          {T(r?.trim)}
                          {' · '}
                          {T(r?.color)}
                        </div>
                      </div>
                    </div>
                    <div style={css('color:rgba(235,235,245,.6)')}>{T(r?.vin)}</div>
                    <div>{T(r?.miles)}</div>
                    <div>{T(r?.price)}</div>
                    <div style={css('color:rgba(235,235,245,.6)')}>{T(r?.svc)}</div>
                    <div>
                      <span style={css(r?.statusStyle)}>{T(r?.status)}</span>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        {vm.stReservations ? (
          <>
            <div style={css('margin-top:14px;display:flex;flex-direction:column;gap:10px')}>
              {L(vm.reservations).map((r, _i) => (
                <React.Fragment key={_i}>
                  <div
                    style={css(
                      'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px;display:flex;align-items:center;gap:20px',
                    )}
                  >
                    <div style={css(`width:84px;height:58px;border-radius:9px;${r?.ph ?? ''}`)} />
                    <div style={css('flex:1')}>
                      <div style={css('font-size:16px;font-weight:500')}>{T(r?.who)}</div>
                      <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>
                        {T(r?.car)}
                        {' · '}
                        {T(r?.price)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={css(
                          'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                        )}
                      >
                        Deposit
                      </div>
                      <div style={css('font-size:13px;color:#30d158;margin-top:3px')}>$250 received</div>
                    </div>
                    <div>
                      <div
                        style={css(
                          'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                        )}
                      >
                        Reservation
                      </div>
                      <div style={css('font-size:13px;margin-top:3px')}>{T(r?.id)}</div>
                    </div>
                    <div style={css('min-width:150px')}>
                      <div
                        style={css(
                          'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                        )}
                      >
                        Status
                      </div>
                      <div style={css('font-size:13px;font-weight:500;margin-top:3px;color:#e0312b')}>{T(r?.status)}</div>
                    </div>
                    {r?.live ? (
                      <>
                        <div
                          onClick={r?.advance}
                          style={css(
                            'padding:11px 16px;border-radius:10px;background:rgba(235,235,245,.1);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;flex:0 0 auto',
                          )}
                        >
                          {T(r?.cta)}
                        </div>
                      </>
                    ) : null}
                  </div>
                </React.Fragment>
              ))}
              {vm.noReservations ? (
                <>
                  <div style={css('padding:40px;text-align:center;font-size:13px;color:rgba(235,235,245,.45)')}>
                    No active reservations. Deposits placed in the customer app appear here instantly.
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
        {vm.stTestdrives ? (
          <>
            <div style={css('margin-top:14px;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.testDrives).map((r, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('display:flex;align-items:center;gap:16px;padding:15px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                    <div style={css('width:120px;font-size:13px;font-weight:500')}>{T(r?.when)}</div>
                    <div style={css('flex:1')}>
                      <div style={css('font-size:13.5px;font-weight:500')}>{T(r?.who)}</div>
                      <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{T(r?.car)}</div>
                    </div>
                    <div style={css(`font-size:12px;font-weight:500;color:${r?.color ?? ''}`)}>{T(r?.state)}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
        {vm.stTradeins ? (
          <>
            <div style={css('margin-top:14px;border-top:1px solid rgba(235,235,245,.09)')}>
              {L(vm.tradeIns).map((r, _i) => (
                <React.Fragment key={_i}>
                  <div style={css('display:flex;align-items:center;gap:16px;padding:15px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                    <div style={css('flex:1')}>
                      <div style={css('font-size:13.5px;font-weight:500')}>{T(r?.who)}</div>
                      <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{T(r?.car)}</div>
                    </div>
                    <div style={css('font-size:13px')}>{T(r?.est)}</div>
                    <div style={css(`font-size:12px;font-weight:500;color:${r?.color ?? ''}`)}>{T(r?.state)}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
