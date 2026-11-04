import React from 'react';
import { css } from '../../runtime/tpl.js';
import { Title, Err, Empty, LBL, INPUT, CARD, DATA, Btn, Link, Dot, Seg, LinesEditor, chip } from './ui.jsx';

/** Estimates: every visit in the shop, and the jobs on it. The writer adds jobs from the library or
 *  by hand, sends the estimate (in-app + text with a link), and sees each job approved or declined. */
export function EstimatesLive({ vm }) {
  const e = vm.estimates, sel = e.sel;
  return (
    <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
      <div style={css('width:320px;flex:0 0 320px;min-width:0')}>
        <Title t="Estimates" sub={e.waiting ? e.waiting + (e.waiting === 1 ? ' estimate waiting' : ' estimates waiting') : 'Nothing waiting on a customer'} />
        <Err vm={vm} />
        <div style={css('margin-top:22px;display:flex;flex-direction:column;gap:8px')}>
          {e.queue.map((q) => (
            <div key={q.id} onClick={q.open} style={css(CARD + ';padding:14px 16px;cursor:pointer;' + (q.on ? 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.25)' : ''))}>
              <div style={css('display:flex;justify-content:space-between;gap:10px;align-items:baseline')}><div style={css('font-size:14px;font-weight:500')}>{q.who}</div><div style={css(DATA + ';font-size:13px')}>{q.total}</div></div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{q.car}</div>
              <div style={css('display:flex;align-items:center;gap:7px;font-size:12px;margin-top:8px;color:' + q.color)}><Dot c={q.color} />{q.state}</div>
            </div>
          ))}
          {e.none ? <Empty>No visits in the shop today.<br />Check a customer in from Appointments to start an estimate.</Empty> : null}
        </div>
      </div>
      <div style={css('flex:1;min-width:0')}>
        {sel ? <Builder est={sel} /> : <Empty>Select a visit.</Empty>}
      </div>
    </div>
  );
}

function Builder({ est }) {
  const d = est.draft, ed = est.edit;
  return (
    <div style={css(CARD + ';padding:24px;display:flex;flex-direction:column;gap:18px')}>
      <div style={css('display:flex;justify-content:space-between;gap:16px;align-items:flex-start')}>
        <div>
          <div style={css('font-size:22px;font-weight:600;letter-spacing:-.4px')}>{est.who}</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{est.car} · {est.job} · {est.when}</div>
          <div style={css('font-size:12.5px;margin-top:4px;color:' + est.color)}>{est.status}{est.inApp ? ' · in the app' : est.phone ? ' · approves by text link' : ''}</div>
        </div>
        <div style={css('display:flex;gap:8px')}>
          {!est.picking && !d ? <Btn on={est.openPick}>Add job</Btn> : null}
        </div>
      </div>

      {est.picking ? (
        <div style={css('background:rgba(255,255,255,.04);border-radius:12px;padding:14px')}>
          <div style={css('display:flex;gap:8px;align-items:center')}>
            <input value={est.pickQ} autoFocus placeholder="Search the job library…" onChange={(e) => est.setPickQ(e.target.value)} style={css(INPUT)} />
            <Btn ghost on={est.custom}>Custom job</Btn>
            <Link on={est.closePick}>Close</Link>
          </div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:10px;max-height:300px;overflow:auto')}>
            {est.pickRows.map((j) => (
              <div key={j.id} onClick={j.pick} style={css('display:flex;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:9px;cursor:pointer;font-size:13px;background:rgba(255,255,255,.03)')}>
                <div><div>{j.name}</div><div style={css('font-size:11px;color:rgba(235,235,245,.4);margin-top:2px')}>{j.category}</div></div>
                <div style={css(DATA + ';white-space:nowrap')}>{j.total}</div>
              </div>
            ))}
            {!est.pickRows.length ? <div style={css('grid-column:1 / -1;font-size:12.5px;color:rgba(235,235,245,.45);padding:12px')}>No match. Add it as a custom job; save it to the library from Settings if it comes up again.</div> : null}
          </div>
        </div>
      ) : null}

      {d ? <JobForm f={d} title="New job" primary={[{ l: 'Send for approval', on: d.send }, { l: 'Add as approved', on: d.approve, ghost: true }]} /> : null}
      {ed ? <JobForm f={ed} title="Edit job" primary={[{ l: 'Save', on: ed.save }]} /> : null}

      {est.jobs.length ? (
        <div>
          {est.jobs.map((j) => (
            <div key={j.id} style={css('padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
              <div style={css('display:flex;justify-content:space-between;gap:12px;align-items:baseline')}>
                <div style={css('display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500')}><Dot c={j.tierColor} />{j.name}</div>
                <div style={css(DATA + ';font-size:14px;font-weight:600;' + (j.warranty ? 'color:#30d158' : ''))}>{j.total}</div>
              </div>
              {j.plain ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.6);margin-top:4px;line-height:1.45;padding-left:15px')}>{j.plain}</div> : null}
              <div style={css('padding-left:15px;margin-top:6px')}>
                {j.lines.map((l, i) => (
                  <div key={i} style={css('display:flex;justify-content:space-between;gap:10px;font-size:12px;color:rgba(235,235,245,.55);padding:2px 0')}>
                    <div><span style={css('font-family:var(--data-font,inherit);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.35);margin-right:8px')}>{l.kind}</span>{l.description}{l.qty ? <span style={css('margin-left:8px')}>{l.qty} × {l.unit}</span> : null}{l.meta ? <span style={css('margin-left:8px;color:rgba(235,235,245,.35)')}>{l.meta}</span> : null}</div>
                    <div style={css(DATA)}>{l.total}</div>
                  </div>
                ))}
              </div>
              {j.photos.length ? <div style={css('display:flex;gap:6px;margin-top:8px;padding-left:15px')}>{j.photos.map((u, i) => <div key={i} style={css('width:54px;height:40px;border-radius:7px;background:#222 url(' + u + ') center/cover')} />)}</div> : null}
              <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-left:15px')}>
                <div style={css('font-size:12px;font-weight:500;color:' + j.color)}>{j.status}{j.status !== 'Waiting on customer' ? ' · ' + j.when : ''}</div>
                <div style={css('display:flex;gap:14px')}>
                  {j.approve ? <Link on={j.approve} color="#30d158">Approve at the desk</Link> : null}
                  {j.decline ? <Link on={j.decline}>Decline</Link> : null}
                  {j.reopen ? <Link on={j.reopen}>Offer again</Link> : null}
                  {j.edit ? <Link on={j.edit}>Edit</Link> : null}
                  {j.remove ? <Link on={j.remove}>Remove</Link> : null}
                </div>
              </div>
            </div>
          ))}
          <div style={css('display:flex;gap:18px;margin-top:14px;font-size:12.5px;color:rgba(235,235,245,.55)')}>
            <div>Waiting <span style={css(DATA + ';color:#ffd60a')}>{est.pendTotal}</span></div>
            <div>Approved <span style={css(DATA + ';color:#30d158')}>{est.apprTotal}</span></div>
            {est.declCount ? <div>Declined <span style={css(DATA)}>{est.declTotal}</span></div> : null}
          </div>
        </div>
      ) : !d && !est.picking ? <Empty>No jobs on this visit yet. Add one from the library — the booked service, anything the technician found, or a custom job.</Empty> : null}

      <div style={css('display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid rgba(235,235,245,.09);padding-top:16px')}>
        {est.send ? <Btn on={est.send}>{est.sendLabel}</Btn> : null}
        {est.smsHref ? <a href={est.smsHref} style={css('font-size:12px;color:rgba(235,235,245,.6);text-decoration:none;padding:0 6px')}>Open in Messages</a> : null}
        {est.copyLink ? <Link on={est.copyLink}>Copy approval link</Link> : null}
        <div style={css('flex:1')} />
        {est.note ? <div onClick={est.clearNote} style={css('font-size:12px;color:#30d158;cursor:pointer')}>{est.note}</div> : <div style={css('font-size:11.5px;color:rgba(235,235,245,.35)')}>The customer approves each job on their phone — in the app or on the link. Approved jobs land on the invoice on their own.</div>}
      </div>
    </div>
  );
}

function JobForm({ f, title, primary }) {
  return (
    <div style={css('background:rgba(255,255,255,.04);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px')}>
      <div style={css(LBL)}>{title}</div>
      <div style={css('display:grid;grid-template-columns:1fr 200px;gap:8px')}>
        <input value={f.name} placeholder="Job name (what the customer sees)" onChange={(e) => f.set({ name: e.target.value })} style={css(INPUT)} autoFocus />
        <Seg small opts={[['now', 'Now'], ['soon', 'Soon'], ['monitor', 'Monitor']]} value={f.tier} pick={(k) => f.set({ tier: k })} />
      </div>
      <textarea value={f.plain} placeholder="In plain words, for the customer" rows={2} onChange={(e) => f.set({ plain: e.target.value })} style={css(INPUT + ';resize:vertical;line-height:1.45')} />
      <LinesEditor ed={f} />
      <div onClick={() => f.set({ warranty: !f.warranty })} style={css('font-size:12px;cursor:pointer;color:' + (f.warranty ? '#30d158' : 'rgba(235,235,245,.5)'))}>{f.warranty ? '✓ Warranty — no charge to the customer, lines kept for the record' : 'Warranty work (no charge)'}</div>
      <div style={css('display:flex;gap:8px;margin-top:4px')}>
        {primary.map((p) => <Btn key={p.l} ghost={p.ghost} on={p.on} ok={f.ok !== false} style="flex:1">{p.l}</Btn>)}
        <Btn ghost on={f.cancel} style="flex:0 0 auto">Cancel</Btn>
      </div>
    </div>
  );
}
