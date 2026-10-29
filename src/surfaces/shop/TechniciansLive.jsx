import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';

const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const INPUT = "width:100%;background:rgba(255,255,255,.06);border:0;outline:0;border-radius:10px;padding:11px 12px;font-size:13px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const BTN = 'padding:11px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap';
const GHOST = 'padding:11px 16px;border-radius:10px;background:#1c1c1e;color:rgba(235,235,245,.85);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap';
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px';

/** Technicians on real records: the design's cards, with today's assigned jobs and bays. */
export function TechniciansLive({ vm }) {
  const t = vm.technicians, f = t.form;
  return (
    <div style={css('animation:sIn .28s ease')}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:16px')}>
        <div>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Technicians</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{T(t.sub)}</div>
        </div>
        {!f ? <div onClick={t.openNew} style={css(BTN)}>Add technician</div> : null}
      </div>
      {vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null}
      {f ? (
        <div style={css(CARD + ';margin-top:22px;max-width:520px;display:flex;flex-direction:column;gap:12px')}>
          <div style={css('font-size:16px;font-weight:500')}>{t.isNew ? 'New technician' : f.name}</div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
            <input value={f.name} placeholder="Name" onChange={(e) => t.setForm({ name: e.target.value })} style={css(INPUT)} autoFocus />
            <input value={f.role} placeholder="Role (Master tech, Tech, QC)" onChange={(e) => t.setForm({ role: e.target.value })} style={css(INPUT)} />
          </div>
          <div>
            <div style={css(LBL + ';margin-bottom:6px')}>Bays</div>
            <div style={css('display:flex;gap:6px')}>{[1, 2, 3, 4, 5].map((b) => <div key={b} onClick={() => t.toggleBay(b)} style={css('flex:1;text-align:center;padding:9px 0;border-radius:10px;font-size:12.5px;font-weight:500;cursor:pointer;' + ((f.bays || []).includes(b) ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)'))}>Bay 0{b}</div>)}</div>
          </div>
          <div style={css('display:flex;gap:8px')}>
            <div onClick={f.name.trim() ? t.save : null} style={css(BTN + ';flex:1;text-align:center;' + (f.name.trim() ? '' : 'opacity:.4;cursor:default'))}>Save</div>
            <div onClick={t.cancel} style={css(GHOST + ';flex:1;text-align:center')}>Cancel</div>
            {t.retire ? <div onClick={t.retire} style={css(GHOST + ';color:#ff6b64')}>Remove</div> : null}
          </div>
        </div>
      ) : null}
      <div style={css('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px')}>
        {L(t.techs).map((x) => (
          <div key={x.id} onClick={x.edit} style={css(CARD + ';cursor:pointer')}>
            <div style={css('display:flex;align-items:center;gap:12px')}>
              <div style={css('width:40px;height:40px;border-radius:20px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:12px')}>{T(x.initials)}</div>
              <div>
                <div style={css('font-size:16px;font-weight:500')}>{T(x.name)}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{T(x.role)}</div>
              </div>
            </div>
            <div style={css('margin-top:18px;display:flex;justify-content:space-between;font-size:12px;color:rgba(235,235,245,.5)')}><span>Booked today</span><span>{T(x.hours)}</span></div>
            <div style={css('margin-top:8px;height:4px;border-radius:2px;background:rgba(235,235,245,.12);overflow:hidden')}><div style={css(x.bar)} /></div>
            <div style={css('margin-top:16px;display:flex;flex-direction:column;gap:8px')}>
              {L(x.jobs).map((j, i) => <div key={i} style={css('display:flex;justify-content:space-between;gap:10px')}><div style={css('font-size:13px')}>{T(j.t)}</div><div style={css('font-size:12px;font-weight:500;color:' + j.c)}>{T(j.s)}</div></div>)}
              {!x.jobs.length ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4)')}>Nothing assigned today.</div> : null}
            </div>
          </div>
        ))}
      </div>
      {t.none && !f ? <div style={css('padding:48px 20px;text-align:center;font-size:13px;color:rgba(235,235,245,.45);line-height:1.6')}>No technicians yet.<br />Add the crew and which bays they run; names show on the Schedule and on the customer\u2019s phone.</div> : null}
    </div>
  );
}
