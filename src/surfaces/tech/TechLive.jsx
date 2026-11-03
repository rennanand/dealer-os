import React from 'react';
import { css } from '../../runtime/tpl.js';
import { LogicHost } from '../../runtime/LogicHost.jsx';
import { ShopLogic } from '../../state/shopLogic.js';

// The technician's iPad, on real records: today's jobs on the left, the open job on the right —
// clock on, inspect with the checklist, photos, send the estimate, finish. Big targets, one idea
// per block, nothing the tech does not need at the bay.
const BG = "position:fixed;inset:0;background:#000;color:#fff;display:flex;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const LBL = 'font-family:var(--data-font,inherit);font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const CARD = 'background:#141416;border-radius:18px;padding:18px 20px';
const INPUT = "background:rgba(255,255,255,.07);border:0;outline:0;border-radius:12px;padding:12px 14px;font-size:15px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const BTN = 'padding:14px 20px;border-radius:14px;background:#fff;color:#000;font-size:15px;font-weight:600;cursor:pointer;text-align:center;white-space:nowrap';
const GHOST = 'padding:14px 20px;border-radius:14px;background:#2a2a2e;color:#fff;font-size:15px;font-weight:500;cursor:pointer;text-align:center;white-space:nowrap';
const GRN = '#30d158', YEL = '#ffd60a', RED = '#e0312b';

export function TechLiveRoute({ userId }) {
  return <LogicHost Logic={ShopLogic} options={{ userId: userId || '' }}>{(vm) => <TechLive t={vm.tech} />}</LogicHost>;
}

function TechLive({ t }) {
  if (!t.me) return <PickMe t={t} />;
  return (
    <div style={css(BG)}>
      <div style={css('width:340px;flex:0 0 340px;border-right:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 22px) 18px 20px')}>
        <div style={css('display:flex;justify-content:space-between;align-items:center')}>
          <div>
            <div style={css('font-size:24px;font-weight:600;letter-spacing:-.6px')}>Today</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:3px')}>{t.date}</div>
          </div>
          <div onClick={() => t.pick('')} style={css('width:40px;height:40px;border-radius:20px;background:#2a2a2e;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;cursor:pointer')} title={t.meName}>{t.meName.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
        </div>
        <div style={css('margin-top:18px;display:flex;flex-direction:column;gap:8px;overflow:auto;flex:1')}>
          {t.jobs.map((j) => (
            <div key={j.id} onClick={j.open} style={css('padding:14px 16px;border-radius:16px;cursor:pointer;background:' + (j.selected ? '#2a2a2e' : '#141416') + ';border:1px solid ' + (j.mine ? 'rgba(255,255,255,.14)' : 'transparent'))}>
              <div style={css('display:flex;justify-content:space-between;align-items:baseline;gap:8px')}>
                <div style={css('font-size:16px;font-weight:600')}>{j.car}</div>
                <div style={css('font-size:12px;font-family:var(--data-font,inherit);color:rgba(235,235,245,.5)')}>{j.bay || j.time}</div>
              </div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.6);margin-top:3px')}>{j.job} · {j.who}</div>
              <div style={css('display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px;font-weight:500;color:' + j.color)}>
                <span style={css('width:7px;height:7px;border-radius:4px;background:' + j.color)} />{j.status}{j.clocked ? ' · on the clock' : ''}{j.mine ? ' · yours' : ''}
              </div>
            </div>
          ))}
          {!t.jobs.length && !t.loading ? <div style={css('padding:40px 10px;text-align:center;font-size:14px;color:rgba(235,235,245,.4);line-height:1.6')}>Nothing on the board today.</div> : null}
        </div>
      </div>
      <div style={css('flex:1;min-width:0;overflow:auto;padding:calc(env(safe-area-inset-top,0px) + 22px) 26px 40px')}>
        {t.err ? <div onClick={t.dismissErr} style={css('margin-bottom:14px;padding:12px 14px;border-radius:12px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:13px;cursor:pointer')}>{t.err}</div> : null}
        {t.job ? <Job j={t.job} /> : (
          <div style={css('height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font-size:15px;color:rgba(235,235,245,.4);line-height:1.6')}>Pick a job on the left.<br />{t.mine ? t.mine + ' assigned to you.' : 'None assigned to you yet; take any.'}</div>
        )}
      </div>
    </div>
  );
}

function PickMe({ t }) {
  return (
    <div style={css(BG + ';align-items:center;justify-content:center')}>
      <div style={css('width:420px;max-width:92vw')}>
        <img src="/uploads/revyn.png" alt="Revyn" style={css('height:13px;width:auto;display:block')} />
        <div style={css('font-size:30px;font-weight:600;letter-spacing:-.8px;margin-top:22px')}>Who’s on the iPad?</div>
        <div style={css('font-size:14px;color:rgba(235,235,245,.5);margin-top:8px;line-height:1.5')}>Your jobs, your clock, your inspections. The desk sees everything the moment you tap it.</div>
        <div style={css('display:flex;flex-direction:column;gap:8px;margin-top:24px')}>
          {t.techOpts.map((o) => <div key={o.id} onClick={() => t.pick(o.id)} style={css(CARD + ';font-size:17px;font-weight:600;cursor:pointer')}>{o.name}</div>)}
          {!t.techOpts.length ? <div style={css('font-size:13px;color:rgba(235,235,245,.4)')}>No technicians yet — add the crew on the shop desktop (Technicians).</div> : null}
        </div>
      </div>
    </div>
  );
}

function Job({ j }) {
  return (
    <div style={css('animation:sIn .25s ease;max-width:820px')}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:16px')}>
        <div>
          <div style={css('font-size:30px;font-weight:600;letter-spacing:-.8px')}>{j.car}</div>
          <div style={css('font-size:14px;color:rgba(235,235,245,.55);margin-top:5px')}>{j.who}{j.phone ? ' · ' + j.phone : ''} · {j.bay}</div>
          {j.specs ? <div style={css('font-size:13px;color:rgba(235,235,245,.4);margin-top:3px')}>{j.specs}</div> : null}
        </div>
        <div style={css('display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:' + j.color + ';padding-top:8px')}><span style={css('width:8px;height:8px;border-radius:4px;background:' + j.color)} />{j.status}</div>
      </div>

      <div style={css(CARD + ';margin-top:18px;display:flex;align-items:center;gap:16px')}>
        <div style={css('flex:1')}>
          <div style={css('font-size:17px;font-weight:600')}>{j.job}</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.55);margin-top:3px')}>{j.notes ? 'Customer: “' + j.notes + '”' : 'No note from the customer.'}</div>
          {j.hours || j.clockOn ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.45);margin-top:6px')}>{j.clockOn ? 'On the clock since ' + j.clockSince : 'Clock off'}{j.hours ? ' · ' + j.hours + ' total' : ''}</div> : null}
        </div>
        {j.arrive ? <div onClick={j.arrive} style={css(GHOST)}>Check in</div> : null}
        {j.clockOn ? <div onClick={j.stop} style={css(GHOST)}>Clock off</div> : j.start ? <div onClick={j.start} style={css(BTN)}>Clock on</div> : null}
      </div>

      <div style={css('margin-top:26px;display:flex;justify-content:space-between;align-items:baseline')}>
        <div style={css('font-size:20px;font-weight:600;letter-spacing:-.4px')}>Inspection</div>
        <div style={css('display:flex;align-items:center;gap:12px')}>
          {j.templates.length > 1 && j.useTemplate ? <select value={j.templateId} onChange={(e) => j.useTemplate(e.target.value)} style={css(INPUT + ';width:auto;padding:8px 10px;font-size:13px;appearance:none;-webkit-appearance:none;cursor:pointer')}>{j.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select> : null}
          <div style={css('font-size:13px;color:rgba(235,235,245,.5)')}>{j.goodCount} good · {j.flaggedCount ? j.flaggedCount + ' to send' : j.inspStatus === 'sent' ? 'sent ' + j.sentAt : 'nothing flagged'}</div>
        </div>
      </div>
      <div style={css('display:flex;flex-direction:column;gap:10px;margin-top:12px')}>
        {j.items.map((it) => <Item key={it.key} it={it} />)}
      </div>
      <div style={css('display:flex;gap:10px;margin-top:18px;align-items:center')}>
        {j.send ? <div onClick={j.send} style={css(BTN + ';flex:1')}>Send {j.flaggedCount} item{j.flaggedCount === 1 ? '' : 's'} to the customer</div> : <div style={css('flex:1;font-size:13px;color:rgba(235,235,245,.4)')}>Flag anything as Monitor or Now and it goes to the customer’s phone with the price for approval.</div>}
      </div>

      {j.findings.length ? (
        <div style={css('margin-top:26px')}>
          <div style={css(LBL)}>Sent to the customer</div>
          {j.findings.map((f) => (
            <div key={f.id} style={css('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.07)')}>
              <div><div style={css('font-size:15px;font-weight:500')}>{f.name}</div><div style={css('font-size:12.5px;margin-top:2px;color:' + f.color)}>{f.status}{f.jobHours ? ' · ' + f.jobHours + (f.onJob ? ' · on the clock' : '') : ''}</div>{f.included ? <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:2px')}>{f.included}</div> : null}</div>
              <div style={css('display:flex;align-items:center;gap:14px')}>
                <div style={css('font-family:var(--data-font,inherit);font-size:14px')}>{f.price}</div>
                {f.stopJob ? <div onClick={f.stopJob} style={css(GHOST + ';padding:9px 14px;font-size:13px')}>Clock off</div> : f.startJob ? <div onClick={f.startJob} style={css(BTN + ';padding:9px 14px;font-size:13px')}>Clock on</div> : null}
                {f.markDone ? <div onClick={f.markDone} style={css(GHOST + ';padding:9px 14px;font-size:13px')}>Done</div> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {j.finish ? <div onClick={j.finish} style={css(GHOST + ';margin-top:30px;width:100%;box-sizing:border-box')}>Finish — car is ready for pickup</div> : null}
    </div>
  );
}

function Item({ it }) {
  const fileRef = React.useRef(null);
  const flagged = it.status === 'now' || it.status === 'monitor';
  const seg = (k, label, color) => (
    <div onClick={() => it.setStatus(k)} style={css('flex:1;text-align:center;padding:11px 0;border-radius:11px;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .15s;' + (it.status === k ? 'background:' + color + ';color:' + (k === 'good' ? '#000' : k === 'monitor' ? '#000' : '#fff') : 'background:rgba(255,255,255,.06);color:rgba(235,235,245,.7)'))}>{label}</div>
  );
  return (
    <div style={css(CARD + ';padding:16px 18px;' + (it.sent ? 'opacity:.55' : ''))}>
      <div style={css('display:flex;align-items:center;gap:16px')}>
        <div style={css('flex:1;min-width:0')}>
          <div style={css('font-size:16px;font-weight:600')}>{it.label}{it.sent ? ' · sent' : ''}</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.45);margin-top:2px')}>{it.measLabel}</div>
        </div>
        <div style={css('display:flex;gap:6px;width:300px')}>{seg('good', 'Good', GRN)}{seg('monitor', 'Monitor', YEL)}{seg('now', 'Now', RED)}</div>
      </div>
      {flagged && !it.sent ? (
        <div style={css('margin-top:12px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px')}>
          <input value={it.name || ''} placeholder={'What needs doing · ' + it.label.toLowerCase()} onChange={(e) => it.setName(e.target.value)} style={css(INPUT)} />
          <input value={it.meas || ''} placeholder={it.measLabel} onChange={(e) => it.setMeas(e.target.value)} style={css(INPUT + ';font-family:var(--data-font,inherit)')} />
          <input value={it.price || ''} inputMode="decimal" placeholder="$ price" onChange={(e) => it.setPrice(e.target.value)} style={css(INPUT + ';font-family:var(--data-font,inherit)')} />
          <input value={it.note || ''} placeholder="In plain words, for the customer" onChange={(e) => it.setNote(e.target.value)} style={css(INPUT + ';grid-column:1 / -1')} />
        </div>
      ) : it.status === 'good' || it.sent ? null : null}
      <div style={css('display:flex;align-items:center;gap:8px;margin-top:' + (flagged || it.photos.length ? '10px' : '0'))}>
        {it.photos.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer" style={css('width:64px;height:48px;border-radius:9px;background:#222 url(' + u + ') center/cover')} />)}
        {flagged ? (<>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={css('display:none')} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) it.addPhoto(f); e.target.value = ''; }} />
          <div onClick={() => fileRef.current && fileRef.current.click()} style={css('width:64px;height:48px;border-radius:9px;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;font-size:12px;color:rgba(235,235,245,.6);cursor:pointer')}>+ Photo</div>
        </>) : null}
      </div>
    </div>
  );
}
