import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';
import { CARD, DATA, INPUT, SELECT, Btn, Link, Field, Dot, chip } from './ui.jsx';

/** The bay timeline on real appointments: the design's Schedule, with day chips and an Unassigned lane. */
export function ScheduleLive({ vm }) {
  const sc = vm.schedule, cal = vm.calendar;
  const week = cal.view === 'week';
  return (
    <div style={css('animation:sIn .28s ease')}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:16px')}>
        <div>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Schedule</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{week ? cal.weekLabel : T(sc.sub)}</div>
        </div>
        <div style={css('display:flex;gap:8px;align-items:center')}>
          {sc.showNow && !week ? <div style={css(sc.nowPill)}>{T(sc.nowLabel)}</div> : null}
          <div style={css('display:flex;gap:4px')}>{[['day', 'Day'], ['week', 'Week']].map(([k, l]) => <div key={k} onClick={() => cal.setView(k)} style={css(chip(cal.view === k || (!cal.view && k === 'day')) + ';padding:7px 12px')}>{l}</div>)}</div>
          <Btn ghost on={cal.openBlock}>Block time</Btn>
        </div>
      </div>
      {vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null}
      {cal.blockEdit ? <BlockForm f={cal.blockEdit} /> : null}
      {cal.unconfirmed.length ? (
        <div style={css(CARD + ';margin-top:18px;padding:14px 18px')}>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.5)')}>{cal.unconfirmed.length} upcoming {cal.unconfirmed.length === 1 ? 'visit' : 'visits'} not confirmed yet</div>
          <div style={css('display:flex;gap:8px;flex-wrap:wrap;margin-top:8px')}>
            {cal.unconfirmed.map((u) => <div key={u.id} style={css('display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.05);font-size:12.5px')}><span onClick={u.open} style={css('cursor:pointer;font-weight:500')}>{u.who}</span><span style={css('color:rgba(235,235,245,.5)')}>{u.when} · {u.job}{u.sent ? ' · ' + u.sent : ''}</span>{u.remind ? <Link on={u.remind}>Text reminder</Link> : null}<Link on={u.confirm} color="#30d158">Confirmed</Link></div>)}
          </div>
        </div>
      ) : null}
      {week ? <Week cal={cal} /> : null}
      {!week ? <div style={css('display:flex;gap:6px;margin-top:22px;flex-wrap:wrap')}>
        {L(vm.apptDays).map((d, i) => <div key={i} onClick={d.pick} style={css(d.style)}>{T(d.label)}</div>)}
        <input type="date" value={vm.day} onChange={(e) => e.target.value && vm.setDay(e.target.value)} style={css('background:rgba(235,235,245,.08);border:0;outline:0;border-radius:999px;padding:8px 14px;font-size:12.5px;color:rgba(235,235,245,.7);color-scheme:dark;font-family:inherit')} />
      </div> : null}
      {!week ? <><div style={css('margin-top:22px;position:relative;user-select:none')}>
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
              {cal.dayBlocks.filter((b) => (b.bay === 0 && !b.tech_id && i < 5) || b.bay === i + 1).map((b) => <div key={b.id} onClick={b.remove} title="Remove block" style={css('position:absolute;top:8px;bottom:8px;left:' + (((b.start - 7) / 12) * 100).toFixed(2) + '%;width:' + (((b.end - b.start) / 12) * 100).toFixed(2) + '%;border-radius:10px;background:repeating-linear-gradient(135deg,rgba(235,235,245,.06) 0 6px,rgba(235,235,245,.02) 6px 12px);box-shadow:inset 0 0 0 1px rgba(235,235,245,.1);padding:10px 12px;font-size:11px;color:rgba(235,235,245,.45);cursor:pointer;overflow:hidden;white-space:nowrap')}>{b.reason}</div>)}
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
      </> : null}
    </div>
  );
}

function Week({ cal }) {
  return (
    <div style={css('margin-top:18px')}>
      <div style={css('display:flex;gap:8px;align-items:center;margin-bottom:10px')}><Link on={cal.prev}>‹ Previous</Link><Link on={cal.thisWeek}>This week</Link><Link on={cal.next}>Next ›</Link></div>
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:8px')}>
        {cal.week.map((d) => (
          <div key={d.d} style={css(CARD + ';padding:12px;min-height:220px;display:flex;flex-direction:column;gap:6px;' + (d.closed ? 'opacity:.45;' : '') + (d.isToday ? 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.25);' : ''))}>
            <div onClick={d.pick} style={css('display:flex;justify-content:space-between;align-items:baseline;cursor:pointer')}>
              <div><span style={css('font-size:11px;color:rgba(235,235,245,.5)')}>{d.label}</span> <span style={css('font-size:16px;font-weight:600;margin-left:4px')}>{d.num}</span></div>
              <div style={css(DATA + ';font-size:11px;color:' + d.color)}>{d.closed ? 'Closed' : d.pctLabel}</div>
            </div>
            {!d.closed ? <div style={css('height:3px;border-radius:2px;background:rgba(235,235,245,.08)')}><div style={css('height:3px;border-radius:2px;width:' + d.pct + '%;background:' + d.color)} /></div> : null}
            {d.appts.map((a) => <div key={a.id} onClick={a.open} style={css('display:flex;align-items:center;gap:6px;font-size:11.5px;cursor:pointer;padding:5px 7px;border-radius:7px;background:rgba(255,255,255,.04)')}><Dot c={a.color} /><div style={css('flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}><span style={css(DATA + ';color:rgba(235,235,245,.5)')}>{a.time}</span> {a.who}{a.car ? ' · ' + a.car : ''}</div>{!a.confirmed ? <span title="Not confirmed" style={css('color:#ffd60a;font-size:10px')}>?</span> : null}</div>)}
            {d.blocks.map((b) => <div key={b.id} onClick={b.remove} style={css('font-size:11px;color:rgba(235,235,245,.4);padding:5px 7px;border-radius:7px;background:repeating-linear-gradient(135deg,rgba(235,235,245,.06) 0 6px,rgba(235,235,245,.02) 6px 12px);cursor:pointer')}>{b.label}</div>)}
            <div style={css('flex:1')} />
            {!d.closed ? <div onClick={d.block} style={css('font-size:11px;color:rgba(235,235,245,.35);cursor:pointer')}>+ Block time</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockForm({ f }) {
  return (
    <div style={css(CARD + ';margin-top:18px;max-width:820px;background:#1c1c1e')}>
      <div style={css('display:grid;grid-template-columns:1.2fr .8fr .8fr 1fr 1fr 1.4fr;gap:8px;align-items:end')}>
        <Field label="Day"><input type="date" value={f.day} onChange={(e) => f.set({ day: e.target.value })} style={css(INPUT + ';color-scheme:dark')} /></Field>
        <Field label="From"><input type="time" value={f.from} onChange={(e) => f.set({ from: e.target.value })} style={css(INPUT + ';color-scheme:dark;' + DATA)} /></Field>
        <Field label="To"><input type="time" value={f.to} onChange={(e) => f.set({ to: e.target.value })} style={css(INPUT + ';color-scheme:dark;' + DATA)} /></Field>
        <Field label="Bay"><select value={f.bay} onChange={(e) => f.set({ bay: e.target.value, tech_id: '' })} style={css(SELECT)}><option value="">Whole shop</option>{[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>Bay 0{b}</option>)}</select></Field>
        <Field label="Technician"><select value={f.tech_id} onChange={(e) => f.set({ tech_id: e.target.value, bay: '' })} style={css(SELECT)}><option value="">—</option>{f.techOpts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Reason"><input value={f.reason} placeholder="Lunch, training, lift down…" onChange={(e) => f.set({ reason: e.target.value })} style={css(INPUT)} /></Field>
      </div>
      <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);margin-top:8px')}>Whole-shop blocks hide those slots from online booking. Bay and technician blocks show on the timeline only.</div>
      <div style={css('display:flex;gap:8px;margin-top:12px')}><Btn on={f.save}>Block</Btn><Btn ghost on={f.cancel}>Cancel</Btn></div>
    </div>
  );
}
