import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';

/** The bay timeline on real appointments: the design's Schedule, with day chips and an Unassigned lane. */
export function ScheduleLive({ vm }) {
  const sc = vm.schedule;
  return (
    <div style={css('animation:sIn .28s ease')}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-end')}>
        <div>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Schedule</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{T(sc.sub)}</div>
        </div>
        {sc.showNow ? <div style={css(sc.nowPill)}>{T(sc.nowLabel)}</div> : null}
      </div>
      {vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null}
      <div style={css('display:flex;gap:6px;margin-top:22px;flex-wrap:wrap')}>
        {L(vm.apptDays).map((d, i) => <div key={i} onClick={d.pick} style={css(d.style)}>{T(d.label)}</div>)}
      </div>
      <div style={css('margin-top:22px;position:relative;user-select:none')}>
        <div style={css('display:grid;grid-template-columns:76px minmax(0,1fr)')}>
          <div />
          <div style={css('position:relative;height:16px')}>
            {L(sc.hours).map((h, i) => <div key={i} style={css('position:absolute;top:0;left:' + h.left + ';transform:translateX(-50%);font-size:10.5px;color:rgba(235,235,245,.35);white-space:nowrap')}>{T(h.label)}</div>)}
          </div>
        </div>
        {L(sc.rows).map((r, i) => (
          <div key={i} style={css('display:grid;grid-template-columns:76px minmax(0,1fr);border-top:1px solid rgba(235,235,245,.08);height:84px')}>
            <div style={css('padding-top:12px')}>
              <div style={css('font-size:12px;font-weight:600;letter-spacing:.08em')}>{T(r.bay)}</div>
              <div style={css('font-size:11px;color:rgba(235,235,245,.4);margin-top:4px')}>{T(r.tech)}</div>
            </div>
            <div style={css('position:relative')}>
              {L(sc.hours).map((h, j) => <div key={j} style={css('position:absolute;top:0;bottom:0;left:' + h.left + ';width:1px;background:rgba(235,235,245,.05)')} />)}
              {L(r.blocks).map((b) => (
                <div key={b.id} onPointerDown={b.down} onPointerMove={b.move} onPointerUp={b.up} onPointerCancel={b.up} style={css(b.style)}>
                  <div style={css('display:flex;justify-content:space-between;gap:8px')}>
                    <div style={css('flex:1;min-width:0;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{T(b.who)}</div>
                    <div style={css('flex:0 1 auto;min-width:0;font-family:var(--data-font,inherit);font-size:10px;color:rgba(235,235,245,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{T(b.time)}</div>
                  </div>
                  <div style={css('font-size:11.5px;color:rgba(235,235,245,.55);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{T(b.job)}</div>
                  <div style={css('margin-top:9px;font-size:10.5px;font-weight:500;color:' + b.c + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{T(b.status)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={css('border-top:1px solid rgba(235,235,245,.08)')} />
        {sc.showNow ? (
          <div style={css('position:absolute;top:16px;bottom:0;left:' + sc.nowLeft + ';width:1px;background:#e0312b;pointer-events:none')}>
            <div style={css('position:absolute;top:-3px;left:-3px;width:7px;height:7px;border-radius:4px;background:#e0312b')} />
          </div>
        ) : null}
      </div>
      <div style={css('margin-top:14px;font-size:12px;color:rgba(235,235,245,.45)')}>{T(sc.msg)}</div>
    </div>
  );
}
