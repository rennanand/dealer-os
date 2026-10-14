import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Followups({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:20px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Follow-ups</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>
              Work customers declined or deferred. Nothing goes out until you send it.
            </div>
          </div>
          <div style={css('display:flex;gap:6px')}>
            {L(vm.fuTabs).map((t, _i) => (
              <React.Fragment key={_i}>
                <div onClick={t?.pick} style={css(t?.style)}>
                  {T(t?.label)}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:24px')}>
          {L(vm.fuStats).map((x, _i) => (
            <React.Fragment key={_i}>
              <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
                <div
                  style={css(
                    `font-family:var(--data-font,inherit);font-size:34px;font-weight:300;letter-spacing:-1px;line-height:1;color:${x?.c ?? ''}`,
                  )}
                >
                  {T(x?.n)}
                </div>
                <div
                  style={css(
                    'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-top:10px',
                  )}
                >
                  {T(x?.l)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('margin-top:26px;border-top:1px solid rgba(235,235,245,.09)')}>
          <div
            style={css(
              'display:grid;grid-template-columns:1.25fr 1.5fr .9fr .55fr 1.35fr 1fr 196px;gap:14px;padding:12px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);border-bottom:1px solid rgba(235,235,245,.07)',
            )}
          >
            <div>Customer</div>
            <div>Declined work</div>
            <div>Declined</div>
            <div>Value</div>
            <div>Reason given</div>
            <div>Status</div>
            <div />
          </div>{' '}
          {L(vm.fuRows).map((f, _i) => (
            <React.Fragment key={_i}>
              {' '}
              <div style={css(f?.style)}>
                <div>
                  <div style={css('font-weight:500')}>{T(f?.cust)}</div>
                  <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:2px')}>{T(f?.car)}</div>
                </div>
                <div>
                  <div style={css('display:flex;align-items:center;gap:8px')}>
                    <div style={css(f?.dot)} />
                    <div style={css('font-weight:500')}>{T(f?.item)}</div>
                  </div>
                  <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:2px')}>
                    {T(f?.wo)}
                    {' · '}
                    {T(f?.tier)}
                  </div>
                </div>
                <div style={css('color:rgba(235,235,245,.6)')}>{T(f?.declined)}</div>
                <div style={css('font-family:var(--data-font,inherit)')}>{T(f?.price)}</div>
                <div style={css('font-size:12.5px;line-height:1.4;color:rgba(235,235,245,.6);font-style:italic')}>{T(f?.reason)}</div>
                <div>
                  <div style={css(f?.statusPill)}>{T(f?.status)}</div>
                </div>
                <div style={css('display:flex;gap:6px;justify-content:flex-end')}>
                  {f?.canRemind ? (
                    <>
                      <div
                        onClick={f?.remind}
                        style={css(
                          'padding:9px 14px;border-radius:9px;background:#fff;color:#000;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap',
                        )}
                      >
                        Remind
                      </div>
                    </>
                  ) : null}
                  {f?.canSnooze ? (
                    <>
                      <div
                        onClick={f?.snooze}
                        style={css(
                          'padding:9px 12px;border-radius:9px;background:rgba(235,235,245,.1);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap',
                        )}
                      >
                        Snooze
                      </div>
                    </>
                  ) : null}
                  {f?.canDone ? (
                    <>
                      <div
                        onClick={f?.done}
                        style={css(
                          'padding:9px 12px;border-radius:9px;background:rgba(235,235,245,.1);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap',
                        )}
                      >
                        Close
                      </div>
                    </>
                  ) : null}
                </div>
              </div>{' '}
            </React.Fragment>
          ))}{' '}
          {vm.fuEmpty ? (
            <>
              <div style={css('padding:40px;text-align:center;font-size:13px;color:rgba(235,235,245,.45)')}>Nothing here.</div>
            </>
          ) : null}
        </div>
        <div style={css('margin-top:14px;font-size:12px;line-height:1.5;color:rgba(235,235,245,.45)')}>{T(vm.fuNote)}</div>
      </div>
    </>
  );
}
