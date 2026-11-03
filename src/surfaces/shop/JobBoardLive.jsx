import React from 'react';
import { css } from '../../runtime/tpl.js';
import { Title, Err, Empty, LBL, CARD, DATA, Dot, Link, chip } from './ui.jsx';

/** The job board: who is on what, each approved job with its techs, a clock per job, and GP per hour. */
export function JobBoardLive({ vm }) {
  const b = vm.board;
  return (
    <div style={css('animation:sIn .28s ease')}>
      <Title t="Job board" sub={b.techs.filter((t) => t.on).length + ' of ' + b.techs.length + ' technicians on a job'} />
      <Err vm={vm} />
      <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:22px')}>
        {b.techs.map((t) => (
          <div key={t.id} style={css(CARD + ';padding:14px 16px;display:flex;gap:12px;align-items:center')}>
            <div style={css('width:34px;height:34px;border-radius:17px;background:' + (t.on ? '#30d158' : '#1c1c1e') + ';color:' + (t.on ? '#000' : '#fff') + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600')}>{t.initials}</div>
            <div style={css('flex:1;min-width:0')}>
              <div style={css('font-size:13.5px;font-weight:500')}>{t.name}</div>
              <div style={css('font-size:11.5px;color:rgba(235,235,245,.5);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{t.now}</div>
            </div>
            {t.stop ? <Link on={t.stop}>Off</Link> : null}
          </div>
        ))}
      </div>
      <div style={css('display:flex;flex-direction:column;gap:12px;margin-top:22px')}>
        {b.visits.map((v) => (
          <div key={v.id} style={css(CARD)}>
            <div style={css('display:flex;justify-content:space-between;gap:16px;align-items:baseline')}>
              <div style={css('display:flex;align-items:center;gap:10px')}>
                <Dot c={v.color} />
                <div style={css('font-size:16px;font-weight:600')}>{v.who}</div>
                <div style={css('font-size:12.5px;color:rgba(235,235,245,.5)')}>{v.car} · {v.booked} · {v.bay}</div>
              </div>
              <div style={css('display:flex;gap:16px;font-size:12.5px;color:rgba(235,235,245,.55)')}>
                {v.hours ? <div>{v.hours} on the clock{v.billed ? ' · ' + v.billed : ''}</div> : null}
                {v.gpHr ? <div style={css('color:#30d158;' + DATA)}>{v.gpHr} GP</div> : null}
                <Link on={v.open}>Open visit</Link>
              </div>
            </div>
            {v.jobs.length ? v.jobs.map((j) => (
              <div key={j.id} style={css('display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr auto;gap:14px;align-items:center;padding:11px 0;border-top:1px solid rgba(235,235,245,.07);font-size:13px;' + (j.done ? 'opacity:.5' : ''))}>
                <div><div style={css('font-weight:500')}>{j.name}</div><div style={css(DATA + ';font-size:11.5px;color:rgba(235,235,245,.45);margin-top:2px')}>{j.total}</div></div>
                <TechPick j={j} opts={b.techOpts} />
                <div style={css('font-size:12px;color:' + (j.on ? '#30d158' : 'rgba(235,235,245,.5)'))}>{j.on ? j.onWho + ' on it now' : j.done ? 'Done' : j.techs ? 'Assigned' : 'Unassigned'}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);' + DATA)}>{j.hours}{j.eff ? ' · ' + j.eff : ''}</div>
                <div style={css('display:flex;gap:12px;justify-content:flex-end')}>
                  {j.on ? <Link on={j.stop}>Clock off</Link> : !j.done ? <ClockOn j={j} opts={b.techOpts} /> : null}
                  {j.markDone ? <Link on={j.markDone} color="#30d158">Done</Link> : null}
                </div>
              </div>
            )) : <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:10px 0 0')}>No approved jobs yet. Jobs appear here as the customer approves them.</div>}
          </div>
        ))}
        {b.empty ? <Empty>Nothing in the shop right now.</Empty> : null}
      </div>
    </div>
  );
}

function TechPick({ j, opts }) {
  return (
    <div style={css('display:flex;gap:4px;flex-wrap:wrap')}>
      {opts.map((t) => { const on = j.techIds.includes(t.id); return <div key={t.id} onClick={() => j.assign(on ? j.techIds.filter((x) => x !== t.id) : j.techIds.concat(t.id))} style={css(chip(on) + ';padding:5px 10px;font-size:11.5px')}>{t.name}</div>; })}
    </div>
  );
}
function ClockOn({ j, opts }) {
  const ids = j.techIds.length ? j.techIds : opts.map((t) => t.id);
  if (ids.length === 1) return <Link on={() => j.start(ids[0])} color="#fff">Clock on</Link>;
  return (
    <select defaultValue="" onChange={(e) => { if (e.target.value) j.start(e.target.value); e.target.value = ''; }} style={css('background:#1c1c1e;border:0;color:#fff;border-radius:8px;padding:6px 8px;font-size:12px;font-family:inherit')}>
      <option value="">Clock on…</option>
      {opts.filter((t) => ids.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}
