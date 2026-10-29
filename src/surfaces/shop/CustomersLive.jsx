import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';

const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const INPUT = "width:100%;background:rgba(255,255,255,.06);border:0;outline:0;border-radius:10px;padding:11px 12px;font-size:13px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const BTN = 'padding:11px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap';
const GHOST = 'padding:11px 16px;border-radius:10px;background:#1c1c1e;color:rgba(235,235,245,.85);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap';
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
            <div onClick={vm.openNewCust} style={css(BTN)}>Add customer</div>
          </div>
        </div>
        {vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null}
        <div style={css('margin-top:22px;border-top:1px solid rgba(235,235,245,.09)')}>
          <div style={css('display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;padding:12px 0;' + LBL + ';border-bottom:1px solid rgba(235,235,245,.07)')}>
            <div>Customer</div><div>Vehicles</div><div>Visits</div><div>Last visit</div><div>Loaners</div>
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
              <div>{T(r.ltv)}</div>
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
                  <div style={css('display:grid;grid-template-columns:70px 1fr 1fr;gap:8px')}>
                    <input value={ev.year} inputMode="numeric" placeholder="Year" onChange={(e) => vm.setEditVeh({ ...ev, year: e.target.value })} style={css(INPUT)} autoFocus />
                    <input value={ev.make} placeholder="Make" onChange={(e) => vm.setEditVeh({ ...ev, make: e.target.value })} style={css(INPUT)} />
                    <input value={ev.model} placeholder="Model" onChange={(e) => vm.setEditVeh({ ...ev, model: e.target.value })} style={css(INPUT)} />
                  </div>
                  <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px')}>
                    <input value={ev.plate} placeholder="Plate" onChange={(e) => vm.setEditVeh({ ...ev, plate: e.target.value })} style={css(INPUT)} />
                    <input value={ev.odometer} inputMode="numeric" placeholder="Odometer" onChange={(e) => vm.setEditVeh({ ...ev, odometer: e.target.value })} style={css(INPUT)} />
                  </div>
                  <div style={css('display:flex;gap:8px')}>
                    <div onClick={ev.make || ev.model ? vm.saveVeh : null} style={css(BTN + ';flex:1;text-align:center;padding:9px 0;' + (ev.make || ev.model ? '' : 'opacity:.4;cursor:default'))}>Save vehicle</div>
                    <div onClick={() => vm.setEditVeh(null)} style={css(GHOST + ';flex:1;text-align:center;padding:9px 0')}>Cancel</div>
                  </div>
                </div>
              ) : null}
            </div>
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
            <div>
              <div style={css(LBL + ';margin-bottom:6px')}>Notes</div>
              <textarea key={c.id} defaultValue={c.notes} onBlur={(e) => e.target.value !== c.notes && c.setNotes(e.target.value)} placeholder="Preferences, how they like to be contacted, anything the next advisor should know." rows={3} style={css(INPUT + ';resize:vertical;line-height:1.5')} />
            </div>
            <div style={css('flex:1')} />
            <div style={css('display:flex;gap:8px')}>
              {c.smsHref ? <a href={c.smsHref} style={css(BTN + ';flex:1;text-align:center;text-decoration:none')}>Text</a> : null}
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
