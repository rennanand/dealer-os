import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';
import { TakePayment } from './RegisterLive.jsx';

const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const INPUT = "width:100%;background:rgba(255,255,255,.06);border:0;outline:0;border-radius:10px;padding:11px 12px;font-size:13px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const SELECT = INPUT + ';appearance:none;-webkit-appearance:none;cursor:pointer';
const BTN = 'padding:11px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap';
const GHOST = 'padding:11px 16px;border-radius:10px;background:#1c1c1e;color:rgba(235,235,245,.85);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap';
const Field = ({ label, children }) => (<div><div style={css(LBL + ';margin-bottom:6px')}>{label}</div>{children}</div>);
const KV = ({ k, v }) => (<div style={css('display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}><div style={css('color:rgba(235,235,245,.5)')}>{k}</div><div style={css('text-align:right')}>{v}</div></div>);

/** The appointment book on real records: the design's day list, a detail card, and booking at the desk. */
export function AppointmentsLive({ vm }) {
  const a = vm.sel, na = vm.newAppt;
  return (
    <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
      <div style={css('flex:1;min-width:0')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:16px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Appointments</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{T(vm.apptSub)}</div>
          </div>
          <div onClick={vm.openNewAppt} style={css(BTN)}>Book at the desk</div>
        </div>
        {vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null}
        <div style={css('display:flex;gap:6px;margin-top:22px;flex-wrap:wrap')}>
          {L(vm.apptDays).map((d, i) => <div key={i} onClick={d.pick} style={css(d.style)}>{T(d.label)}</div>)}
          <input type="date" value={vm.day} onChange={(e) => e.target.value && vm.setDay(e.target.value)} style={css('background:rgba(235,235,245,.08);border:0;outline:0;border-radius:999px;padding:8px 14px;font-size:12.5px;color:rgba(235,235,245,.7);color-scheme:dark;font-family:inherit')} />
        </div>
        <div style={css('margin-top:14px;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.appts).map((r) => (
            <div key={r.id} onClick={r.open} style={css(r.style)}>
              <div style={css('width:84px;font-size:14px;font-weight:500')}>{T(r.time)}</div>
              <div style={css('flex:1;min-width:0')}>
                <div style={css('font-size:14px;font-weight:500')}>{T(r.who)}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(r.car)} · {T(r.job)}</div>
              </div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{T(r.visit)}</div>
              <div style={css('min-width:150px;text-align:right;font-size:12.5px;font-weight:500;color:' + r.color)}>{T(r.status)}</div>
            </div>
          ))}
          {vm.loading ? <div style={css('padding:40px;text-align:center;font-size:13px;color:rgba(235,235,245,.45)')}>Loading…</div> : null}
          {vm.noAppts ? <div style={css('padding:40px;text-align:center;font-size:13px;color:rgba(235,235,245,.45)')}>Nothing booked. Appointments made in the customer app land here instantly.</div> : null}
        </div>
      </div>

      <div style={css('width:380px;flex:0 0 380px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:24px;display:flex;flex-direction:column;gap:16px;overflow:auto')}>
        {na ? (
          <>
            <div style={css('font-size:20px;font-weight:500;letter-spacing:-.3px')}>Book at the desk</div>
            <Field label="Customer">
              <select value={na.customer_id} onChange={(e) => vm.setNewAppt({ customer_id: e.target.value })} style={css(SELECT)}>
                <option value="">New customer…</option>
                {vm.custOpts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            {!na.customer_id ? (
              <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
                <input value={na.name} placeholder="Name" onChange={(e) => vm.setNewAppt({ name: e.target.value })} style={css(INPUT)} autoFocus />
                <input value={na.phone} inputMode="tel" placeholder="Mobile" onChange={(e) => vm.setNewAppt({ phone: e.target.value })} style={css(INPUT)} />
              </div>
            ) : null}
            <Field label="Vehicle">
              {na.customer_id && vm.naCars.length ? (
                <select value={na.vehicle_id} onChange={(e) => vm.setNewAppt({ vehicle_id: e.target.value })} style={css(SELECT)}>
                  {vm.naCars.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                  <option value="">Another vehicle…</option>
                </select>
              ) : null}
              {!na.vehicle_id ? (
                <div style={css('display:grid;grid-template-columns:70px 1fr 1fr;gap:8px;margin-top:' + (na.customer_id && vm.naCars.length ? '8px' : '0'))}>
                  <input value={na.year} inputMode="numeric" placeholder="Year" onChange={(e) => vm.setNewAppt({ year: e.target.value })} style={css(INPUT)} />
                  <input value={na.make} placeholder="Make" onChange={(e) => vm.setNewAppt({ make: e.target.value })} style={css(INPUT)} />
                  <input value={na.model} placeholder="Model" onChange={(e) => vm.setNewAppt({ model: e.target.value })} style={css(INPUT)} />
                </div>
              ) : null}
            </Field>
            <Field label="Service"><input value={na.job} placeholder="Oil change, tires, check engine light…" onChange={(e) => vm.setNewAppt({ job: e.target.value })} style={css(INPUT)} /></Field>
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
              <Field label="Day"><input type="date" value={na.day} onChange={(e) => vm.setNewAppt({ day: e.target.value })} style={css(INPUT + ';color-scheme:dark')} /></Field>
              <Field label="Time">
                <select value={na.time} onChange={(e) => vm.setNewAppt({ time: e.target.value })} style={css(SELECT)}>
                  {vm.times.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Visit">
              <div style={css('display:flex;gap:6px')}>
                {[['dropoff', 'Drop off'], ['wait', 'Wait'], ['loaner', 'Loaner']].map(([k, l]) => <div key={k} onClick={() => vm.setNewAppt({ visit: k })} style={css('flex:1;text-align:center;padding:9px 0;border-radius:10px;font-size:12.5px;font-weight:500;cursor:pointer;' + (na.visit === k ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)'))}>{l}</div>)}
              </div>
            </Field>
            <div style={css('flex:1')} />
            <div style={css('display:flex;gap:8px')}>
              <div onClick={vm.newApptOk && !vm.busy ? vm.saveNewAppt : null} style={css(BTN + ';flex:1;text-align:center;' + (vm.newApptOk ? '' : 'opacity:.4;cursor:default'))}>{vm.busy ? 'Booking…' : 'Book'}</div>
              <div onClick={vm.cancelNewAppt} style={css(GHOST + ';flex:1;text-align:center')}>Cancel</div>
            </div>
          </>
        ) : a ? (
          <>
            <div>
              <div style={css('font-size:20px;font-weight:500;letter-spacing:-.3px')}>{T(a.who)}</div>
              <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(a.time)} · {T(a.visit)}{a.phone ? ' · ' + a.phone : ''}</div>
            </div>
            <div style={css('display:flex;justify-content:space-between;align-items:center;gap:10px')}>
              <div style={css('font-size:13px;font-weight:500;color:' + a.color)}>{T(a.status)}{a.bay ? ' · Bay ' + a.bay : ''}{a.confirmed ? ' · confirmed' : ''}{a.source === 'app' ? ' · booked in the app' : a.source === 'online' ? ' · booked online' : ''}</div>
              {a.confirm ? <div onClick={a.confirm} style={css('font-size:12px;color:rgba(235,235,245,.6);cursor:pointer')}>Mark confirmed</div> : null}
            </div>
            {a.rating ? <div style={css('font-size:12.5px;color:#ffd60a')}>{a.rating}{a.ratingTags ? <span style={css('color:rgba(235,235,245,.5)')}> · {a.ratingTags}</span> : null}</div> : null}
            <div>
              <KV k="Service" v={a.job} />
              <KV k="Vehicle" v={a.car + (a.plate ? ' · ' + a.plate : '')} />
              {a.onlineCheckin ? <KV k="Online" v={<span style={css('color:#30d158')}>{a.onlineCheckin}</span>} /> : null}
              {a.concern ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.7);padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);line-height:1.45')}><span style={css('color:rgba(235,235,245,.45)')}>Customer: </span>“{a.concern}”</div> : null}
              {a.signed.map((z, i) => <KV key={i} k={z.kind} v={z.who + ' · ' + z.when + (z.amount ? ' · ' + z.amount : '')} />)}
            </div>
            {a.visitLink ? (
              <div style={css('display:flex;gap:12px;align-items:center;font-size:12px;color:rgba(235,235,245,.5)')}>
                <span>Visit link</span>
                <span onClick={a.copyVisitLink} style={css('cursor:pointer;color:rgba(235,235,245,.8)')}>Copy</span>
                {a.textVisitLink ? <span onClick={a.textVisitLink} style={css('cursor:pointer;color:rgba(235,235,245,.8)')}>Text it</span> : null}
                <a href={a.visitLink} target="_blank" rel="noreferrer" style={css('color:rgba(235,235,245,.8);text-decoration:none')}>Open</a>
              </div>
            ) : null}
            {a.techOpts.length ? (
              <div>
                <div style={css(LBL + ';margin-bottom:6px')}>Technician</div>
                <select value={a.techId} onChange={(e) => a.setTech(e.target.value)} style={css(SELECT)}>
                  <option value="">Not assigned</option>
                  {a.techOpts.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <div style={css('display:flex;align-items:center;gap:10px;margin-top:8px')}>
                  {a.clock.on
                    ? <div onClick={a.clock.stop} style={css(GHOST + ';padding:8px 12px;font-size:12px')}>Clock off · {a.clock.who} since {a.clock.since}</div>
                    : <div onClick={a.techId ? () => a.clock.start(a.techId) : null} style={css(GHOST + ';padding:8px 12px;font-size:12px;' + (a.techId ? '' : 'opacity:.4;cursor:default'))}>Clock on</div>}
                  <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{a.clock.hours}</div>
                </div>
                {a.clock.entries.length ? <div style={css('font-size:11.5px;color:rgba(235,235,245,.35);margin-top:6px;line-height:1.6')}>{a.clock.entries.join('  ·  ')}</div> : null}
              </div>
            ) : null}
            <div>
              <div style={css(LBL + ';margin-bottom:6px')}>Bay</div>
              <div style={css('display:flex;gap:6px')}>
                {[1, 2, 3, 4, 5].map((b) => <div key={b} onClick={() => a.setBay(a.bay === b ? '' : b)} style={css('flex:1;text-align:center;padding:9px 0;border-radius:10px;font-size:12.5px;font-weight:500;cursor:pointer;' + (a.bay === b ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)'))}>{b}</div>)}
              </div>
            </div>
            <div>
              <div style={css(LBL + ';margin-bottom:6px')}>Notes</div>
              <textarea key={a.id} defaultValue={a.notes} onBlur={(e) => e.target.value !== a.notes && a.setNotes(e.target.value)} placeholder="Concern as described, what the tech found, parts on order." rows={4} style={css(INPUT + ';resize:vertical;line-height:1.5')} />
            </div>
            {a.texts.length ? (
              <div>
                <div style={css(LBL + ';margin-bottom:6px')}>Text the customer</div>
                <div style={css('display:flex;gap:6px;flex-wrap:wrap')}>{a.texts.map((t) => <div key={t.key} onClick={t.send} title={t.body} style={css('padding:7px 11px;border-radius:999px;font-size:12px;cursor:pointer;background:rgba(235,235,245,.08);color:rgba(235,235,245,.75)')}>{t.name}</div>)}</div>
                {a.textsSent.length ? <div style={css('font-size:11.5px;color:rgba(235,235,245,.35);margin-top:6px')}>{a.textsSent.map((t) => t.kind + ' · ' + t.time + (t.status === 'manual' ? ' (from phone)' : '')).join('  ·  ')}</div> : null}
              </div>
            ) : null}
            {a.inspTemplates.length > 1 ? (
              <div>
                <div style={css(LBL + ';margin-bottom:6px')}>Inspection</div>
                <select value={a.inspTemplateId} onChange={(e) => a.useTemplate(e.target.value)} style={css(SELECT)}>{a.inspTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              </div>
            ) : null}
            <Findings a={a} />
            <Invoice inv={a.invoice} />
            <div style={css('flex:1')} />
            {a.next ? <div onClick={a.next.go} style={css(BTN + ';text-align:center')}>{a.next.label}</div> : null}
            <div style={css('display:flex;gap:8px')}>
              {a.smsHref ? <a href={a.smsHref} style={css(GHOST + ';flex:1;text-align:center;text-decoration:none')}>Text</a> : null}
              {a.noShow ? <div onClick={a.noShow} style={css(GHOST + ';flex:1;text-align:center')}>No-show</div> : null}
              {a.cancel ? <div onClick={a.cancel} style={css(GHOST + ';flex:1;text-align:center;color:#ff6b64')}>Cancel</div> : null}
            </div>
          </>
        ) : (
          <div style={css('margin:auto;text-align:center;font-size:13px;color:rgba(235,235,245,.4);line-height:1.6')}>Select an appointment<br />to check it in and track it.</div>
        )}
      </div>
    </div>
  );
}

const TIERS = [['now', 'Now'], ['soon', 'Soon'], ['monitor', 'Monitor']];
function Findings({ a }) {
  const nf = a.newFinding;
  const fileRef = React.useRef(null);
  const [forId, setForId] = React.useState(null);
  const pick = (id) => { setForId(id || null); fileRef.current && fileRef.current.click(); };
  return (
    <div>
      <div style={css('display:flex;justify-content:space-between;align-items:center')}>
        <div style={css(LBL)}>Findings{a.pendingCount ? ' · ' + a.pendingCount + ' waiting' : ''}</div>
        <div style={css('display:flex;gap:12px')}>
          <div onClick={() => pick(null)} style={css('font-size:12px;color:rgba(235,235,245,.6);cursor:pointer')}>Add photo</div>
          {!nf ? <div onClick={a.openNewFinding} style={css('font-size:12px;color:rgba(235,235,245,.6);cursor:pointer')}>Add finding</div> : null}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={css('display:none')} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) a.addPhoto(f, '', forId); e.target.value = ''; }} />
      {a.findings.map((f) => (
        <div key={f.id} style={css('padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
          <div style={css('display:flex;justify-content:space-between;gap:10px;font-size:13px')}>
            <div style={css('font-weight:500')}>{f.name}</div>
            <div style={css('white-space:nowrap')}>{f.price}</div>
          </div>
          <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{f.tier}{f.meas ? ' · ' + f.meas : ''}</div>
          {f.plain ? <div style={css('font-size:12px;color:rgba(235,235,245,.6);margin-top:4px;line-height:1.45')}>{f.plain}</div> : null}
          {f.photos.length ? <div style={css('display:flex;gap:6px;margin-top:8px')}>{f.photos.map((u, i) => <div key={i} style={css('width:54px;height:40px;border-radius:7px;background:#222 url(' + u + ') center/cover')} />)}</div> : null}
          <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:8px')}>
            <div style={css('font-size:12px;font-weight:500;color:' + f.color)}>{f.status}</div>
            <div style={css('display:flex;gap:12px;font-size:12px;color:rgba(235,235,245,.5)')}>
              <div onClick={() => pick(f.id)} style={css('cursor:pointer')}>Photo</div>
              {f.markDone ? <div onClick={f.markDone} style={css('cursor:pointer;color:#30d158')}>Mark done</div> : null}
              <div onClick={f.remove} style={css('cursor:pointer')}>Remove</div>
            </div>
          </div>
        </div>
      ))}
      {a.photos.length ? (
        <div style={css('margin-top:10px')}>
          <div style={css(LBL)}>Photos · {a.photos.length}</div>
          <div style={css('display:flex;gap:6px;margin-top:8px;flex-wrap:wrap')}>{a.photos.map((p) => <a key={p.id} href={p.url} target="_blank" rel="noreferrer" style={css('width:62px;height:46px;border-radius:7px;background:#222 url(' + p.url + ') center/cover;display:block')} />)}</div>
        </div>
      ) : null}
      {!a.findings.length && !nf ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:10px 0;line-height:1.5')}>Nothing recorded yet. A finding goes to the customer's phone with its price; they approve or decline there.</div> : null}
      {nf ? (
        <div style={css('margin-top:10px;display:flex;flex-direction:column;gap:8px')}>
          <div style={css('display:flex;gap:6px')}>{TIERS.map(([k, l]) => <div key={k} onClick={() => a.setNewFinding({ tier: k })} style={css('flex:1;text-align:center;padding:8px 0;border-radius:10px;font-size:12px;font-weight:500;cursor:pointer;' + (nf.tier === k ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)'))}>{l}</div>)}</div>
          <input value={nf.name} placeholder="What (e.g. Front brake pads + rotors)" onChange={(e) => a.setNewFinding({ name: e.target.value })} style={css(INPUT)} autoFocus />
          <textarea value={nf.plain} placeholder="In plain words, for the customer" rows={2} onChange={(e) => a.setNewFinding({ plain: e.target.value })} style={css(INPUT + ';resize:vertical;line-height:1.45')} />
          <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px')}>
            <input value={nf.meas_label} placeholder="Measured" onChange={(e) => a.setNewFinding({ meas_label: e.target.value })} style={css(INPUT)} />
            <input value={nf.meas} placeholder="3 mm" onChange={(e) => a.setNewFinding({ meas: e.target.value })} style={css(INPUT)} />
            <input value={nf.price} inputMode="decimal" placeholder="$ price" onChange={(e) => a.setNewFinding({ price: e.target.value })} style={css(INPUT)} />
          </div>
          <input value={nf.urgency} placeholder="How soon (e.g. Safe to drive today; within a few weeks)" onChange={(e) => a.setNewFinding({ urgency: e.target.value })} style={css(INPUT)} />
          <div style={css('display:flex;gap:8px')}>
            <div onClick={nf.name.trim() ? a.saveNewFinding : null} style={css(BTN + ';flex:1;text-align:center;padding:9px 0;' + (nf.name.trim() ? '' : 'opacity:.4;cursor:default'))}>Send to customer</div>
            <div onClick={a.cancelNewFinding} style={css(GHOST + ';flex:1;text-align:center;padding:9px 0')}>Cancel</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const KINDS = [['labor', 'Labor'], ['part', 'Part'], ['fee', 'Fee'], ['discount', 'Discount']];
/** The repair order: approved findings arrive as lines on their own; parts, extra labor, fees and discounts are added here. */
function Invoice({ inv }) {
  if (!inv) return null;
  const nl = inv.newLine;
  return (
    <div style={css('margin-top:22px')}>
      <div style={css('display:flex;justify-content:space-between;align-items:center')}>
        <div style={css(LBL)}>Invoice{inv.number ? ' · ' + inv.number : ''}</div>
        <div style={css('display:flex;gap:12px;align-items:center')}>
          <div style={css('font-size:12px;font-weight:500;color:' + inv.color)}>{inv.status}</div>
          {inv.ro && !nl ? <div onClick={inv.addJob} style={css('font-size:12px;color:rgba(235,235,245,.6);cursor:pointer')}>Add job</div> : null}
          {inv.ro && !nl ? <div onClick={inv.openNewLine} style={css('font-size:12px;color:rgba(235,235,245,.6);cursor:pointer')}>Add line</div> : null}
        </div>
      </div>
      {inv.ro && inv.stockOpts.length && !nl ? (
        <select defaultValue="" onChange={(e) => { if (e.target.value) inv.addFromStock(e.target.value, 1); e.target.value = ''; }} style={css(SELECT + ';margin-top:8px;padding:8px 10px;font-size:12px;color:rgba(235,235,245,.6)')}>
          <option value="">Add a part from the shelf…</option>
          {inv.stockOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      ) : null}
      {!inv.ro ? (
        <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0')}>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);line-height:1.5')}>Approved findings become lines here on their own. Start the RO to add parts, labor and fees.</div>
          <div onClick={inv.start} style={css(GHOST + ';padding:8px 14px;white-space:nowrap')}>Start RO</div>
        </div>
      ) : null}
      {inv.lines.map((l) => (
        <div key={l.id} style={css('display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:9px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;' + (l.pending ? 'opacity:.5' : ''))}>
          <div style={css('flex:1;min-width:0')}>
            <span style={css('font-family:var(--data-font,inherit);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-right:8px')}>{l.kind}</span>
            {l.description}
            {l.qty ? <span style={css('color:rgba(235,235,245,.45);margin-left:8px;font-size:12px')}>{l.qty}</span> : null}
            {l.meta ? <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);margin-top:2px')}>{l.meta}</div> : null}
            {l.pending ? <span style={css('color:#ffd60a;margin-left:8px;font-size:11px')}>waiting</span> : null}
            {l.pstatus && inv.partStatus[l.pstatus] ? <span style={css('margin-left:8px;font-size:11px;color:' + inv.partStatus[l.pstatus][1])}>{inv.partStatus[l.pstatus][0]}</span> : null}
          </div>
          <div style={css('font-family:var(--data-font,inherit);white-space:nowrap')}>{l.total}</div>
          {l.remove ? <div onClick={l.remove} style={css('font-size:11px;color:rgba(235,235,245,.4);cursor:pointer')}>Remove</div> : <div style={css('width:38px')} />}
        </div>
      ))}
      {nl ? (
        <div style={css('margin-top:10px;display:flex;flex-direction:column;gap:8px')}>
          <div style={css('display:flex;gap:6px')}>{KINDS.map(([k, l]) => <div key={k} onClick={() => inv.setNewLine({ kind: k })} style={css('flex:1;text-align:center;padding:8px 0;border-radius:10px;font-size:12px;cursor:pointer;' + (nl.kind === k ? 'background:#fff;color:#000;font-weight:600' : 'background:rgba(255,255,255,.06)'))}>{l}</div>)}</div>
          <input value={nl.description} placeholder={nl.kind === 'part' ? 'Part · brand, number' : nl.kind === 'labor' ? 'Labor · what was done' : nl.kind === 'fee' ? 'Fee · shop supplies, disposal' : 'Discount · reason'} onChange={(e) => inv.setNewLine({ description: e.target.value })} style={css(INPUT)} autoFocus />
          {nl.kind === 'part' ? (
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
              <input value={nl.part_number || ''} placeholder="Part #" onChange={(e) => inv.setNewLine({ part_number: e.target.value })} style={css(INPUT)} />
              <input value={nl.vendor || ''} placeholder="Vendor · NAPA, O'Reilly, dealer" onChange={(e) => inv.setNewLine({ vendor: e.target.value })} style={css(INPUT)} />
            </div>
          ) : null}
          <div style={css('display:grid;grid-template-columns:' + (nl.kind === 'part' ? '1fr 1fr 1fr' : '1fr 1fr') + ';gap:8px')}>
            <input value={nl.qty} inputMode="decimal" placeholder={nl.kind === 'labor' ? 'Hours' : 'Qty'} onChange={(e) => inv.setNewLine({ qty: e.target.value })} style={css(INPUT)} />
            {nl.kind === 'part' ? <input value={nl.cost || ''} inputMode="decimal" placeholder="$ cost each" onChange={(e) => inv.setNewLine({ cost: e.target.value })} style={css(INPUT)} /> : null}
            <input value={nl.unit} inputMode="decimal" placeholder={nl.kind === 'labor' ? '$ per hour' : '$ retail each'} onChange={(e) => inv.setNewLine({ unit: e.target.value })} style={css(INPUT)} />
          </div>
          <div style={css('display:flex;gap:8px')}>
            <div onClick={nl.description.trim() ? inv.saveNewLine : null} style={css(BTN + ';flex:1;text-align:center;padding:9px 0;' + (nl.description.trim() ? '' : 'opacity:.4;cursor:default'))}>Add to invoice</div>
            <div onClick={inv.cancelNewLine} style={css(GHOST + ';flex:1;text-align:center;padding:9px 0')}>Cancel</div>
          </div>
        </div>
      ) : null}
      {inv.ro ? (
        <div style={css('margin-top:12px')}>
          {inv.rows.map(([k, v]) => <div key={k} style={css('display:flex;justify-content:space-between;font-size:12.5px;color:rgba(235,235,245,.55);padding:3px 0')}><span>{k}</span><span style={css('font-family:var(--data-font,inherit)')}>{v}</span></div>)}
          <div style={css('display:flex;justify-content:space-between;font-size:16px;font-weight:600;padding:8px 0 0;margin-top:4px;border-top:1px solid rgba(235,235,245,.12)')}><span>Total</span><span style={css('font-family:var(--data-font,inherit)')}>{inv.total}</span></div>
          {inv.pending ? <div style={css('font-size:12px;color:#ffd60a;margin-top:4px')}>{inv.pending}</div> : null}
          {inv.margin ? <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:8px')}>{inv.margin}</div> : null}
          {inv.hours ? <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{inv.hours}</div> : null}
          {inv.pay.payments.length ? <div style={css('margin-top:10px')}>{inv.pay.payments.map((p) => <div key={p.id} style={css('display:flex;justify-content:space-between;font-size:12px;color:rgba(235,235,245,.6);padding:3px 0')}><span>{p.t} · {p.d}</span><span style={css('font-family:var(--data-font,inherit)')}>{p.v}</span></div>)}</div> : null}
          {inv.pay.paidLabel ? <div style={css('font-size:12.5px;color:' + (inv.pay.balance > 0 ? '#ffd60a' : '#30d158') + ';margin-top:8px;font-weight:500')}>{inv.pay.paidLabel}</div> : inv.paid ? <div style={css('font-size:12.5px;color:#30d158;margin-top:8px;font-weight:500')}>{inv.paid}</div> : null}
          {inv.pay.note ? <div style={css('font-size:12px;color:#30d158;margin-top:6px')}>{inv.pay.note}</div> : null}
          {inv.take && inv.take.ro_id === inv.ro.id ? <TakePayment t={inv.take} compact /> : null}
          <div style={css('display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap')}>
            {inv.sendInvoice ? <div onClick={inv.sendInvoice} style={css(BTN + ';padding:9px 14px')}>Send invoice</div> : null}
            {inv.pay.canTake && !(inv.take && inv.take.ro_id === inv.ro.id) ? <div onClick={inv.pay.canTake} style={css((inv.sendInvoice ? GHOST : BTN) + ';padding:9px 14px')}>Take payment</div> : null}
            {inv.pay.textToPay ? <div onClick={inv.pay.textToPay} style={css(GHOST + ';padding:9px 14px')}>Text to pay</div> : null}
            {inv.reopen ? <div onClick={inv.reopen} style={css('font-size:12px;color:rgba(235,235,245,.5);cursor:pointer;margin-left:auto')}>Reopen</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
