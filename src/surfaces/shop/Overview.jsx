import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/service-scene.js';

export function Overview({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:24px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Today</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>
              Monday, October 5 · 2:41 PM · 5 bays · 3 technicians
            </div>
          </div>
          <div
            onClick={vm.dgoApprovals}
            style={css(
              'padding:11px 16px;border-radius:10px;background:#1c1c1e;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap',
            )}
            className="px0"
          >
            {T(vm.approvalsBtn)}
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:24px')}>
          {L(vm.overviewStats).map((x, _i) => (
            <React.Fragment key={_i}>
              <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
                <div style={css('font-family:var(--data-font,inherit);font-size:34px;font-weight:300;letter-spacing:-1px;line-height:1')}>
                  {T(x?.n)}
                </div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:6px')}>{T(x?.l)}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('margin-top:36px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px')}>
          <div style={css('font-size:13px;font-weight:500')}>Shop floor</div>
          <div style={css('display:flex;align-items:flex-end;gap:16px')}>
            <div style={css('text-align:right')}>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                Bays in use
              </div>
              <div style={css('font-family:var(--data-font,inherit);font-size:12px;color:#e0312b;margin-top:5px')}>{T(vm.baysNow)}</div>
            </div>
            <div style={css('width:220px')}>
              <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={css('width:220px;height:36px;display:block;overflow:visible')}>
                <path
                  d={vm.loadPath}
                  style={css('fill:none;stroke:rgba(235,235,245,.85);stroke-width:1.5px;stroke-linejoin:round;stroke-linecap:round')}
                />
                <path d={vm.loadNow} style={css('fill:none;stroke:#e0312b;stroke-width:1px')} />
              </svg>
              <div
                style={css(
                  'display:flex;justify-content:space-between;margin-top:5px;font-family:var(--data-font,inherit);font-size:9.5px;color:rgba(235,235,245,.35)',
                )}
              >
                <span>8 AM</span>
                <span>1 PM</span>
                <span>6 PM</span>
              </div>
            </div>
          </div>
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:14px')}>
          {L(vm.floor).map((b, _i) => (
            <React.Fragment key={_i}>
              <div onClick={b?.go} style={css(b?.style)}>
                <div style={css('display:flex;justify-content:space-between;align-items:center')}>
                  <div
                    style={css('font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.5)')}
                  >
                    {T(b?.bay)}
                  </div>
                  <div style={css(b?.dot)} />
                </div>
                <div style={css('margin-top:18px;display:flex;justify-content:space-between;align-items:baseline')}>
                  <div
                    style={css(
                      `font-family:var(--data-font,inherit);font-size:24px;font-weight:300;letter-spacing:-.6px;line-height:1;color:${b?.color ?? ''}`,
                    )}
                  >
                    {T(b?.pctLabel)}
                  </div>
                  <div style={css('font-family:var(--data-font,inherit);font-size:10.5px;color:rgba(235,235,245,.45)')}>{T(b?.eta)}</div>
                </div>{' '}
                <div style={css(`margin-top:10px;${b?.ruler?.base ?? ''}`)}>
                  <div style={css(b?.ruler?.fill)} />
                </div>{' '}
                <div style={css('font-size:14px;font-weight:500;margin-top:16px')}>{T(b?.car)}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(b?.who)}</div>
                <div style={css('margin-top:14px')}>
                  <span style={css(b?.pill)}>{T(b?.status)}</span>
                </div>
                {b?.scene ? (
                  <>
                    <div className="sc-host-x" style={css('height:110px')}>
                      <service-scene scene={b?.scene} phase={b?.phase} />
                    </div>
                  </>
                ) : null}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:30px')}>
          <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
            <div style={css('display:flex;justify-content:space-between')}>
              <div style={css('font-size:13px;font-weight:500')}>Waiting for approval</div>
              <div onClick={vm.dgoApprovals} style={css('font-size:12px;color:#e0312b;cursor:pointer')}>
                View all
              </div>
            </div>
            {L(vm.queue).map((q, _i) => (
              <React.Fragment key={_i}>
                <div style={css('display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                  <div style={css('flex:1')}>
                    <div style={css('font-size:14px;font-weight:500')}>{T(q?.who)}</div>
                    <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>
                      {T(q?.car)}
                      {' · '}
                      {T(q?.total)}
                    </div>
                  </div>
                  <div style={css(`font-size:12px;font-weight:500;color:${q?.waitColor ?? ''}`)}>{T(q?.wait)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
            <div style={css('display:flex;justify-content:space-between')}>
              <div style={css('font-size:13px;font-weight:500')}>Inbox</div>
              <div onClick={vm.dgoInbox} style={css('font-size:12px;color:#e0312b;cursor:pointer')}>
                Open
              </div>
            </div>
            {L(vm.inboxPreview).map((m, _i) => (
              <React.Fragment key={_i}>
                <div style={css('display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                  <div style={css(m?.dot)} />
                  <div style={css('flex:1')}>
                    <div style={css('font-size:14px;font-weight:500')}>{T(m?.who)}</div>
                    <div
                      style={css(
                        'font-size:12px;color:rgba(235,235,245,.5);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
                      )}
                    >
                      {T(m?.preview)}
                    </div>
                  </div>
                  <div style={css('font-size:11px;color:rgba(235,235,245,.35)')}>{T(m?.time)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
