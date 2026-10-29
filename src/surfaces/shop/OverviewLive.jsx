import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';

const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px';
const EMPTY = 'padding:22px 0 8px;font-size:12.5px;color:rgba(235,235,245,.4)';

/** Today, on real records: the design's Overview with appointments, bays and loaners from the database. */
export function OverviewLive({ vm, goCheckin, goAppointments, goLoaners }) {
  const o = vm.overview;
  const open = (fn) => () => { fn(); if (goAppointments) goAppointments(); };
  return (
    <div style={css('animation:sIn .28s ease')}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:24px')}>
        <div>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Today</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{T(o.sub)}</div>
        </div>
        <div style={css('display:flex;gap:8px')}>
          <div onClick={goCheckin} style={css('padding:11px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap')}>Check in a walk-in</div>
          <div onClick={goLoaners} style={css('padding:11px 16px;border-radius:10px;background:#1c1c1e;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap')}>New loaner</div>
        </div>
      </div>
      {vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null}
      <div style={css('display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:24px')}>
        {L(o.stats).map((x, i) => (
          <div key={i} style={css(CARD)}>
            <div style={css('font-family:var(--data-font,inherit);font-size:34px;font-weight:300;letter-spacing:-1px;line-height:1')}>{T(x.n)}</div>
            <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:6px')}>{T(x.l)}</div>
          </div>
        ))}
      </div>
      <div style={css('margin-top:36px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px')}>
        <div style={css('font-size:13px;font-weight:500')}>Shop floor</div>
        <div style={css('text-align:right')}>
          <div style={css('font-family:var(--data-font,inherit);font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:rgba(235,235,245,.4)')}>Bays in use</div>
          <div style={css('font-family:var(--data-font,inherit);font-size:12px;color:#e0312b;margin-top:5px')}>{T(o.baysNow)}</div>
        </div>
      </div>
      <div style={css('display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:14px')}>
        {L(o.floor).map((b, i) => (
          <div key={i} onClick={b.go ? open(b.go) : null} style={css(b.style)}>
            <div style={css('display:flex;justify-content:space-between;align-items:center')}>
              <div style={css('font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.5)')}>{T(b.bay)}</div>
              <div style={css(b.dot)} />
            </div>
            <div style={css('margin-top:18px;display:flex;justify-content:space-between;align-items:baseline')}>
              <div style={css('font-family:var(--data-font,inherit);font-size:24px;font-weight:300;letter-spacing:-.6px;line-height:1;color:' + b.color)}>{T(b.pctLabel)}</div>
              <div style={css('font-family:var(--data-font,inherit);font-size:10.5px;color:rgba(235,235,245,.45)')}>{T(b.eta)}</div>
            </div>
            <div style={css('margin-top:10px;' + b.ruler.base)}><div style={css(b.ruler.fill)} /></div>
            <div style={css('font-size:14px;font-weight:500;margin-top:16px')}>{T(b.car)}</div>
            <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(b.who)}</div>
            {b.status ? <div style={css('margin-top:14px')}><span style={css(b.pill)}>{T(b.status)}</span></div> : null}
          </div>
        ))}
      </div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:30px')}>
        <div style={css(CARD)}>
          <div style={css('display:flex;justify-content:space-between')}>
            <div style={css('font-size:13px;font-weight:500')}>Up next</div>
            <div onClick={goAppointments} style={css('font-size:12px;color:#e0312b;cursor:pointer')}>Appointments</div>
          </div>
          {L(o.upNext).map((q) => (
            <div key={q.id} onClick={open(q.open)} style={css('display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer')}>
              <div style={css('flex:1')}>
                <div style={css('font-size:14px;font-weight:500')}>{T(q.who)}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(q.car)}</div>
              </div>
              <div style={css('font-size:12px;font-weight:500;color:rgba(235,235,245,.7)')}>{T(q.when)}</div>
            </div>
          ))}
          {o.noUpNext ? <div style={css(EMPTY)}>Nothing booked ahead. Bookings from the app land here.</div> : null}
        </div>
        <div style={css(CARD)}>
          <div style={css('display:flex;justify-content:space-between')}>
            <div style={css('font-size:13px;font-weight:500')}>Loaners</div>
            <div onClick={goLoaners} style={css('font-size:12px;color:#e0312b;cursor:pointer')}>Open</div>
          </div>
          {L(o.loanerRows).map((r) => (
            <div key={r.id} onClick={goLoaners} style={css('display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer')}>
              <div style={css('flex:1')}>
                <div style={css('font-size:14px;font-weight:500')}>{T(r.who)}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(r.car)}</div>
              </div>
              <div style={css('font-size:12px;font-weight:500;color:' + r.color)}>{T(r.state)}</div>
            </div>
          ))}
          {o.noLoaners ? <div style={css(EMPTY)}>No loaners out.</div> : null}
        </div>
      </div>
    </div>
  );
}
