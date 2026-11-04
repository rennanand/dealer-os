import React from 'react';
import { css } from '../../runtime/tpl.js';
import { Title, Err, Empty, LBL, INPUT, SELECT, CARD, DATA, Btn, Link, Field, Dot, KV } from './ui.jsx';

/** Fleet accounts: a business, its drivers and units, PO rules, and a statement by date range. */
export function FleetLive({ vm }) {
  const f = vm.fleet, sel = f.sel, e = f.edit;
  return (
    <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
      <div style={css('width:300px;flex:0 0 300px')}>
        <Title t="Fleet" sub="Businesses on account. One statement a month." />
        <Err vm={vm} />
        <div style={css('margin-top:18px')}><Btn ghost on={f.openNew}>New fleet account</Btn></div>
        <div style={css('margin-top:14px;display:flex;flex-direction:column;gap:8px')}>
          {f.list.map((x) => (
            <div key={x.id} onClick={x.pick} style={css(CARD + ';padding:14px 16px;cursor:pointer;' + (x.on ? 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.25)' : ''))}>
              <div style={css('font-size:15px;font-weight:500')}>{x.name}</div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:4px')}>{x.sub}</div>
            </div>
          ))}
          {f.empty ? <Empty>No fleet accounts yet.</Empty> : null}
        </div>
      </div>
      <div style={css('flex:1;min-width:0')}>
        {e ? <FleetForm e={e} /> : sel ? <FleetDetail s={sel} vm={vm} note={f.note} /> : <Empty>Select a fleet.</Empty>}
      </div>
    </div>
  );
}

function FleetForm({ e }) {
  return (
    <div style={css(CARD + ';max-width:760px')}>
      <div style={css('font-size:18px;font-weight:600')}>{e.id ? 'Edit fleet' : 'New fleet account'}</div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:14px')}>
        <Field label="Business" span><input value={e.name} autoFocus onChange={(ev) => e.set({ name: ev.target.value })} style={css(INPUT)} /></Field>
        <Field label="Contact"><input value={e.contact} onChange={(ev) => e.set({ contact: ev.target.value })} style={css(INPUT)} /></Field>
        <Field label="Phone"><input value={e.phone} inputMode="tel" onChange={(ev) => e.set({ phone: ev.target.value })} style={css(INPUT)} /></Field>
        <Field label="Email · statements"><input value={e.email} inputMode="email" onChange={(ev) => e.set({ email: ev.target.value })} style={css(INPUT)} /></Field>
        <Field label="Terms · days"><input value={e.terms_days} inputMode="numeric" onChange={(ev) => e.set({ terms_days: ev.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Labor rate · $ (blank = shop rate)"><input value={e.labor_rate} inputMode="decimal" onChange={(ev) => e.set({ labor_rate: ev.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Parts discount · %"><input value={e.parts_discount_pct} inputMode="decimal" onChange={(ev) => e.set({ parts_discount_pct: ev.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="PO number"><div onClick={() => e.set({ po_required: !e.po_required })} style={css(INPUT + ';cursor:pointer;color:' + (e.po_required ? '#fff' : 'rgba(235,235,245,.5)'))}>{e.po_required ? 'Required on every RO' : 'Optional'}</div></Field>
        <Field label="Notes" span><input value={e.notes} placeholder="Who approves work, billing quirks, keys" onChange={(ev) => e.set({ notes: ev.target.value })} style={css(INPUT)} /></Field>
      </div>
      <div style={css('display:flex;gap:8px;margin-top:16px;align-items:center')}><Btn on={e.save} ok={!!e.name.trim()}>Save</Btn><Btn ghost on={e.cancel}>Cancel</Btn><div style={css('flex:1')} />{e.retire ? <Link on={e.retire}>Close account</Link> : null}</div>
    </div>
  );
}

function FleetDetail({ s, vm, note }) {
  const [add, setAdd] = React.useState('');
  return (
    <div style={css('display:flex;flex-direction:column;gap:16px')}>
      <div style={css(CARD)}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:16px')}>
          <div>
            <div style={css('font-size:22px;font-weight:600;letter-spacing:-.4px')}>{s.name}</div>
            <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px')}>{[s.contact, s.phone ? s.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : '', s.email, 'Terms ' + (s.terms_days || 30) + ' days', s.po_required ? 'PO required' : '', s.parts_discount_pct ? s.parts_discount_pct + '% off parts' : ''].filter(Boolean).join(' · ')}</div>
            {s.notes ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.6);margin-top:6px')}>{s.notes}</div> : null}
          </div>
          <div style={css('display:flex;gap:16px;align-items:center')}>
            {s.owed ? <div style={css('text-align:right')}><div style={css(DATA + ';font-size:18px;font-weight:600;color:#ffd60a')}>{s.owed}</div><div style={css('font-size:11px;color:rgba(235,235,245,.5)')}>owed</div></div> : null}
            {s.inShop ? <div style={css('text-align:right')}><div style={css(DATA + ';font-size:18px;font-weight:600')}>{s.inShop}</div><div style={css('font-size:11px;color:rgba(235,235,245,.5)')}>in the shop</div></div> : null}
            <Link on={s.edit}>Edit</Link>
          </div>
        </div>
      </div>
      <div style={css('display:grid;grid-template-columns:1fr 1.4fr;gap:16px')}>
        <div style={css(CARD)}>
          <div style={css(LBL)}>Drivers · {s.members.length}</div>
          {s.members.map((m) => <div key={m.id} style={css('display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}><div>{m.name}{m.open ? <span style={css('color:#ffd60a;margin-left:8px;font-size:12px')}>{m.open} open</span> : null}</div><Link on={m.remove}>Remove</Link></div>)}
          <div style={css('display:flex;gap:8px;margin-top:10px')}>
            <select value={add} onChange={(e) => setAdd(e.target.value)} style={css(SELECT + ';padding:9px 10px')}><option value="">Add a customer…</option>{s.candidates.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            <Btn ghost on={() => { if (add) { s.addMember(add); setAdd(''); } }} ok={!!add} style="padding:9px 14px">Add</Btn>
          </div>
        </div>
        <div style={css(CARD)}>
          <div style={css(LBL)}>Units · {s.units.length}</div>
          {s.units.map((u) => (
            <div key={u.id} style={css('display:grid;grid-template-columns:70px 1.4fr 1fr 1fr auto;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}>
              <input defaultValue={u.unit} placeholder="Unit" onBlur={(e) => e.target.value !== u.unit && u.setUnit(e.target.value.trim())} style={css(INPUT + ';padding:7px 8px;font-size:12px;' + DATA)} />
              <div>{u.name}{u.plate ? <span style={css('color:rgba(235,235,245,.5);margin-left:8px;font-size:12px')}>{u.plate}</span> : null}</div>
              <div style={css('color:rgba(235,235,245,.5);font-size:12px')}>{u.driver}</div>
              <div style={css('color:rgba(235,235,245,.5);font-size:12px;' + DATA)}>{u.odometer}</div>
              <div style={css('font-size:12px;color:' + (u.status ? '#ffd60a' : 'rgba(235,235,245,.3)'))}>{u.status || '—'}</div>
            </div>
          ))}
          {!s.units.length ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:10px 0')}>Vehicles on the drivers' records show here. Give each a unit number.</div> : null}
        </div>
      </div>
      <div style={css(CARD)}>
        <div style={css('display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap')}>
          <div style={css(LBL + ';align-self:center;margin-right:8px')}>Statement</div>
          <Field label="From"><input type="date" value={s.from} onChange={(e) => s.setFrom(e.target.value)} style={css(INPUT + ';color-scheme:dark')} /></Field>
          <Field label="To"><input type="date" value={s.to} onChange={(e) => s.setTo(e.target.value)} style={css(INPUT + ';color-scheme:dark')} /></Field>
          <Btn on={s.run}>Run</Btn>
          <div style={css('flex:1')} />
          {s.statement ? <><Btn ghost on={s.statement.download}>Download CSV</Btn>{s.statement.email ? <Btn ghost on={s.statement.email}>Email statement</Btn> : null}</> : null}
        </div>
        {note ? <div style={css('font-size:12.5px;color:#30d158;margin-top:10px')}>{note}</div> : null}
        {s.statement ? (
          <div style={css('margin-top:14px')}>
            {s.statement.rows.map((r) => <div key={r.id} style={css('display:grid;grid-template-columns:80px 160px 1fr 110px 110px;gap:12px;padding:9px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}><div style={css('color:rgba(235,235,245,.5)')}>{r.date}</div><div style={css(DATA)}>{r.ro}</div><div>{r.what}</div><div style={css(DATA + ';text-align:right')}>{r.total}</div><div style={css(DATA + ';text-align:right;color:' + r.dueColor)}>{r.due}</div></div>)}
            {!s.statement.rows.length ? <Empty>No invoices in that range.</Empty> : null}
            <div style={css('display:flex;gap:24px;justify-content:flex-end;margin-top:12px;font-size:13px')}><div style={css('color:rgba(235,235,245,.5)')}>Invoiced <span style={css(DATA + ';color:#fff')}>{s.statement.totalLabel}</span></div><div style={css('color:rgba(235,235,245,.5)')}>Paid <span style={css(DATA + ';color:#30d158')}>{s.statement.paidLabel}</span></div><div style={css('font-weight:600')}>Balance <span style={css(DATA)}>{s.statement.balanceLabel}</span></div></div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
