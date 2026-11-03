import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';

const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const INPUT = "width:100%;background:rgba(255,255,255,.06);border:0;outline:0;border-radius:10px;padding:11px 12px;font-size:13px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const BTN = 'padding:11px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap';
const GHOST = 'padding:11px 16px;border-radius:10px;background:#1c1c1e;color:rgba(235,235,245,.85);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap';
const SELECT = INPUT + ';appearance:none;-webkit-appearance:none;cursor:pointer';
const Field = ({ label, children }) => (<div><div style={css(LBL + ';margin-bottom:6px')}>{label}</div>{children}</div>);
const Row = ({ t, d }) => (<div style={css('display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}><div style={css('font-size:13px')}>{t}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5);white-space:nowrap')}>{d}</div></div>);

/** Customers on real records: the design's table and side card, plus add / vehicle / notes. */
export function CustomersLive({ vm }) {
  const c = vm.cust, nc = vm.newCust, ev = vm.editVeh;
  return (
    <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
      <div style={css('flex:1;min-width:0;display:flex;flex-direction:column')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:16px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Customers</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{T(vm.customersSub)}</div>
          </div>
          <div style={css('display:flex;gap:8px;align-items:center')}>
            <input value={vm.search} onChange={(e) => vm.setSearch(e.target.value)} placeholder="Search name, phone, plate" style={css(INPUT + ';width:220px;padding:10px 12px')} />
            <ImportButton vm={vm} />
            <div onClick={vm.openNewCust} style={css(BTN)}>Add customer</div>
          </div>
        </div>
        {vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null}
        {vm.importPreview ? <ImportPanel p={vm.importPreview} vm={vm} /> : null}
        <div style={css('margin-top:22px;border-top:1px solid rgba(235,235,245,.09)')}>
          <div style={css('display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;padding:12px 0;' + LBL + ';border-bottom:1px solid rgba(235,235,245,.07)')}>
            <div>Customer</div><div>Vehicles</div><div>Visits</div><div>Last visit</div><div>App</div>
          </div>
          {L(vm.customers).map((r) => (
            <div key={r.id} onClick={r.open} style={css(r.style)}>
              <div style={css('display:flex;align-items:center;gap:12px')}>
                <div style={css('width:32px;height:32px;border-radius:16px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:11px')}>{T(r.initials)}</div>
                <div style={css('font-weight:500')}>{T(r.name)}</div>
              </div>
              <div style={css('color:rgba(235,235,245,.7)')}>{T(r.vehicles)}</div>
              <div style={css('color:rgba(235,235,245,.7)')}>{T(r.visits)}</div>
              <div style={css('color:rgba(235,235,245,.7)')}>{T(r.last)}</div>
              <div style={css(r.joined ? 'color:#30d158' : 'color:rgba(235,235,245,.5)')}>{T(r.ltv)}</div>
            </div>
          ))}
          {vm.loading ? <div style={css('padding:40px;text-align:center;font-size:13px;color:rgba(235,235,245,.45)')}>Loading…</div> : null}
          {vm.noCustomers ? <div style={css('padding:48px 20px;text-align:center;font-size:13px;color:rgba(235,235,245,.45);line-height:1.6')}>No customers yet.<br />Add the first one, or they appear here the moment a loaner is created for them.</div> : null}
          {vm.noMatches ? <div style={css('padding:40px;text-align:center;font-size:13px;color:rgba(235,235,245,.45)')}>No one matches that search.</div> : null}
        </div>
      </div>

      <div style={css('width:380px;flex:0 0 380px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:24px;display:flex;flex-direction:column;gap:18px;overflow:auto')}>
        {nc ? (
          <>
            <div style={css('font-size:20px;font-weight:500;letter-spacing:-.3px')}>New customer</div>
            <Field label="Name"><input value={nc.name} onChange={(e) => vm.setNewCust({ name: e.target.value })} style={css(INPUT)} autoFocus /></Field>
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
              <Field label="Phone"><input value={nc.phone} inputMode="tel" onChange={(e) => vm.setNewCust({ phone: e.target.value })} style={css(INPUT)} /></Field>
              <Field label="City"><input value={nc.city} onChange={(e) => vm.setNewCust({ city: e.target.value })} style={css(INPUT)} placeholder="Manti, UT" /></Field>
            </div>
            <Field label="Email (optional)"><input value={nc.email} inputMode="email" onChange={(e) => vm.setNewCust({ email: e.target.value })} style={css(INPUT)} /></Field>
            <div style={css(LBL)}>Vehicle (optional)</div>
            <div style={css('display:grid;grid-template-columns:70px 1fr 1fr;gap:10px;margin-top:-8px')}>
              <input value={nc.year} inputMode="numeric" placeholder="Year" onChange={(e) => vm.setNewCust({ year: e.target.value })} style={css(INPUT)} />
              <input value={nc.make} placeholder="Make" onChange={(e) => vm.setNewCust({ make: e.target.value })} style={css(INPUT)} />
              <input value={nc.model} placeholder="Model" onChange={(e) => vm.setNewCust({ model: e.target.value })} style={css(INPUT)} />
            </div>
            <input value={nc.plate} placeholder="Plate" onChange={(e) => vm.setNewCust({ plate: e.target.value })} style={css(INPUT + ';margin-top:-8px')} />
            <div style={css('flex:1')} />
            <div style={css('display:flex;gap:8px')}>
              <div onClick={nc.name.trim() && !vm.busy ? vm.saveNewCust : null} style={css(BTN + ';flex:1;text-align:center;' + (nc.name.trim() ? '' : 'opacity:.4;cursor:default'))}>{vm.busy ? 'Saving…' : 'Save'}</div>
              <div onClick={vm.cancelNewCust} style={css(GHOST + ';flex:1;text-align:center')}>Cancel</div>
            </div>
          </>
        ) : c ? (
          <>
            <div style={css('display:flex;align-items:center;gap:14px')}>
              <div style={css('width:46px;height:46px;border-radius:23px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:14px')}>{T(c.initials)}</div>
              <div>
                <div style={css('font-size:20px;font-weight:500;letter-spacing:-.3px')}>{T(c.name)}</div>
                <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(c.meta)}</div>
              </div>
            </div>
            <div>
              <div style={css('display:flex;justify-content:space-between;align-items:center')}>
                <div style={css(LBL)}>Vehicles</div>
                {!ev ? <div onClick={() => vm.setEditVeh({ year: '', make: '', model: '', plate: '', odometer: '' })} style={css('font-size:12px;color:rgba(235,235,245,.6);cursor:pointer')}>Add</div> : null}
              </div>
              {L(c.cars).map((v) => <Row key={v.id} t={v.n} d={v.s} />)}
              {!c.cars.length && !ev ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:11px 0')}>No vehicle on file.</div> : null}
              {ev ? (
                <div style={css('margin-top:10px;display:flex;flex-direction:column;gap:8px')}>
                  <div style={css('display:flex;gap:6px')}>
                    <input value={ev.vin || ''} placeholder="VIN" onChange={(e) => vm.setEditVeh({ ...ev, vin: e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17), decoded: null })} style={css(INPUT + ';font-family:var(--data-font,inherit)')} autoFocus />
                    <div onClick={(ev.vin || '').length === 17 && !ev.decoding ? vm.decodeVeh : null} style={css(((ev.vin || '').length === 17 ? BTN : GHOST) + ';padding:9px 12px')}>{ev.decoding ? '…' : 'Decode'}</div>
                  </div>
                  {ev.decoded ? <div style={css('font-size:12px;color:#30d158')}>{ev.decoded}</div> : ev.decodeErr ? <div style={css('font-size:12px;color:#ffd60a')}>{ev.decodeErr}</div> : null}
                  <div style={css('display:grid;grid-template-columns:70px 1fr 1fr;gap:8px')}>
                    <input value={ev.year} inputMode="numeric" placeholder="Year" onChange={(e) => vm.setEditVeh({ ...ev, year: e.target.value })} style={css(INPUT)} />
                    <input value={ev.make} placeholder="Make" onChange={(e) => vm.setEditVeh({ ...ev, make: e.target.value })} style={css(INPUT)} />
                    <input value={ev.model} placeholder="Model" onChange={(e) => vm.setEditVeh({ ...ev, model: e.target.value })} style={css(INPUT)} />
                  </div>
                  <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
                    <input value={ev.plate} placeholder="Plate" onChange={(e) => vm.setEditVeh({ ...ev, plate: e.target.value })} style={css(INPUT)} />
                    <input value={ev.odometer} inputMode="numeric" placeholder="Odometer" onChange={(e) => vm.setEditVeh({ ...ev, odometer: e.target.value })} style={css(INPUT)} />
                    <input value={ev.color || ''} placeholder="Color" onChange={(e) => vm.setEditVeh({ ...ev, color: e.target.value })} style={css(INPUT)} />
                  </div>
                  <div style={css('display:flex;gap:8px')}>
                    <div onClick={ev.make || ev.model ? vm.saveVeh : null} style={css(BTN + ';flex:1;text-align:center;padding:9px 0;' + (ev.make || ev.model ? '' : 'opacity:.4;cursor:default'))}>Save vehicle</div>
                    <div onClick={() => vm.setEditVeh(null)} style={css(GHOST + ';flex:1;text-align:center;padding:9px 0')}>Cancel</div>
                  </div>
                </div>
              ) : null}
            </div>
            <div style={css('display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04)')}>
              <div style={css('font-size:12.5px;color:' + (c.joined ? '#30d158' : 'rgba(235,235,245,.6)'))}>{T(c.appStatus)}</div>
              {c.invite ? <div onClick={c.invite} style={css('font-size:12px;font-weight:600;cursor:pointer')}>Text invite</div> : null}
            </div>
            {c.lastKnown && c.lastKnown.length ? (
              <div>
                <div style={css(LBL)}>From the old system</div>
                {c.lastKnown.map((t, i) => <div key={i} style={css('font-size:12.5px;color:rgba(235,235,245,.6);padding:8px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>{t}</div>)}
              </div>
            ) : null}
            <div>
              <div style={css(LBL)}>Recent visits</div>
              {L(c.visitsList).map((v, i) => <Row key={i} t={v.t} d={v.d} />)}
              {!c.visitsList.length ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:11px 0')}>No visits yet.</div> : null}
            </div>
            {c.loaners.length ? (
              <div>
                <div style={css(LBL)}>Loaners</div>
                {L(c.loaners).map((v, i) => <Row key={i} t={v.t} d={v.d} />)}
              </div>
            ) : null}
            <Account c={c} />
            <div>
              <div style={css(LBL + ';margin-bottom:6px')}>Notes</div>
              <textarea key={c.id} defaultValue={c.notes} onBlur={(e) => e.target.value !== c.notes && c.setNotes(e.target.value)} placeholder="Preferences, how they like to be contacted, anything the next advisor should know." rows={3} style={css(INPUT + ';resize:vertical;line-height:1.5')} />
            </div>
            <div style={css('flex:1')} />
            <div style={css('display:flex;gap:8px')}>
              <div onClick={c.message} style={css(BTN + ';flex:1;text-align:center')}>Message</div>
              <div onClick={c.book} style={css(GHOST + ';flex:1;text-align:center')}>Book visit</div>
            </div>
          </>
        ) : (
          <div style={css('margin:auto;text-align:center;font-size:13px;color:rgba(235,235,245,.4);line-height:1.6')}>Select a customer<br />to see their record.</div>
        )}
      </div>
    </div>
  );
}

function ImportButton({ vm }) {
  const ref = React.useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept=".csv,text/csv" style={css('display:none')} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) vm.previewImport(f); e.target.value = ''; }} />
      <div onClick={() => ref.current && ref.current.click()} style={css(GHOST)}>Import CSV</div>
    </>
  );
}

/** Preview, then import. Repeat imports update rather than duplicate (matched by phone, VIN, plate). */
function ImportPanel({ p, vm }) {
  const r = p.result;
  return (
    <div style={css('margin-top:16px;padding:16px 18px;border-radius:14px;background:#141416;border:1px solid rgba(255,255,255,.06);animation:sIn .25s ease')}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:16px')}>
        <div>
          <div style={css('font-size:15px;font-weight:600')}>{r ? 'Imported' : 'Ready to import'} · {p.file}</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.55);margin-top:4px;line-height:1.5')}>
            {r ? <>{r.customers_new} new customers, {r.customers_updated} updated · {r.vehicles_new} new vehicles, {r.vehicles_updated} updated. They can sign in with their number and see their cars right away.</>
              : <>{p.count} customers ({p.withPhone} with a phone number) · {p.vehicles} vehicles. Matched columns: {p.mapped.join(', ') || 'none'}.{p.missing.length ? <span style={css('color:#ffd60a')}> Not found: {p.missing.join(', ')} — check the column headers.</span> : null}</>}
          </div>
          {!r && p.customers.length ? <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:8px')}>First row: {p.customers[0].name || '—'} · {p.customers[0].phone || 'no phone'} · {(p.customers[0].vehicles[0] ? [p.customers[0].vehicles[0].year, p.customers[0].vehicles[0].make, p.customers[0].vehicles[0].model].filter(Boolean).join(' ') : 'no vehicle')}</div> : null}
        </div>
        <div style={css('display:flex;gap:8px;flex:0 0 auto')}>
          {!r ? <div onClick={p.count && !p.busy ? vm.runImport : null} style={css(BTN + (p.count && !p.busy ? '' : ';opacity:.4;cursor:default'))}>{p.busy ? 'Importing…' : 'Import ' + p.count}</div> : null}
          <div onClick={vm.closeImport} style={css(GHOST)}>{r ? 'Done' : 'Cancel'}</div>
        </div>
      </div>
    </div>
  );
}

const TAGS = ['VIP', 'Fleet', 'Family', 'Price sensitive', 'Needs loaner', 'Warranty'];
/** Account: charge account & terms, store credit, texting consent, tags. */
function Account({ c }) {
  const a = c.account; const ce = c.creditEdit;
  const [limit, setLimit] = React.useState(a.limit); const [terms, setTerms] = React.useState(a.terms);
  React.useEffect(() => { setLimit(a.limit); setTerms(a.terms); }, [c.id]);
  const Toggle = ({ on, set, label }) => (<div onClick={() => set(!on)} style={css('display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer;font-size:13px')}><div>{label}</div><div style={css('width:34px;height:20px;border-radius:10px;background:' + (on ? '#30d158' : 'rgba(235,235,245,.15)') + ';position:relative;flex:0 0 auto')}><div style={css('position:absolute;top:2px;left:' + (on ? '16px' : '2px') + ';width:16px;height:16px;border-radius:8px;background:#fff;transition:left .18s ease')} /></div></div>);
  return (
    <div>
      <div style={css(LBL)}>Account{a.source ? ' · ' + a.source : ''}</div>
      {a.owed ? <div style={css('font-size:12.5px;color:#ffd60a;padding:8px 0 0')}>{a.owed}</div> : null}
      {a.creditLabel ? <div style={css('font-size:12.5px;color:#30d158;padding:6px 0 0')}>{a.creditLabel}</div> : null}
      <Toggle on={a.charge} set={(v) => a.setCharge(v, limit, terms)} label="Charge account · may leave with a balance" />
      {a.charge ? (
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 0')}>
          <input value={limit} inputMode="decimal" placeholder="Credit limit · $" onChange={(e) => setLimit(e.target.value)} onBlur={() => a.setCharge(true, limit, terms)} style={css(INPUT + ';padding:9px 10px;font-family:var(--data-font,inherit)')} />
          <input value={terms} inputMode="numeric" placeholder="Terms · days" onChange={(e) => setTerms(e.target.value)} onBlur={() => a.setCharge(true, limit, terms)} style={css(INPUT + ';padding:9px 10px;font-family:var(--data-font,inherit)')} />
        </div>
      ) : null}
      <Toggle on={a.optOut} set={a.setOptOut} label="Opted out of texts" />
      <Toggle on={a.noMarket} set={a.setNoMarket} label="Do not market · reminders and follow-ups only on request" />
      <div style={css('display:flex;gap:6px;flex-wrap:wrap;padding:10px 0 0')}>{TAGS.map((t) => { const on = a.tags.includes(t); return <div key={t} onClick={() => a.setTags(on ? a.tags.filter((x) => x !== t) : a.tags.concat(t))} style={css('padding:5px 10px;border-radius:999px;font-size:11.5px;cursor:pointer;' + (on ? 'background:#fff;color:#000;font-weight:500' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.6)'))}>{t}</div>; })}</div>
      {ce ? (
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 0 0')}>
          <input value={ce.amount} inputMode="decimal" placeholder="$ amount" autoFocus onChange={(e) => ce.set({ amount: e.target.value })} style={css(INPUT + ';padding:9px 10px;font-family:var(--data-font,inherit)')} />
          <select value={ce.kind} onChange={(e) => ce.set({ kind: e.target.value })} style={css(SELECT + ';padding:9px 10px')}><option value="store_credit">Store credit</option><option value="goodwill">Goodwill</option><option value="trade">Trade credit</option></select>
          <input value={ce.note} placeholder="Why" onChange={(e) => ce.set({ note: e.target.value })} style={css(INPUT + ';padding:9px 10px;grid-column:1 / -1')} />
          <div onClick={ce.save} style={css(BTN + ';padding:9px 0;text-align:center')}>Issue</div><div onClick={ce.cancel} style={css(GHOST + ';padding:9px 0;text-align:center')}>Cancel</div>
        </div>
      ) : <div onClick={a.issueCredit} style={css('font-size:12px;color:rgba(235,235,245,.6);cursor:pointer;padding:10px 0 0')}>Issue store credit</div>}
    </div>
  );
}
