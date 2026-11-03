import React from 'react';
import { css } from '../../runtime/tpl.js';
import { Title, Err, Empty, Tabs, LBL, INPUT, SELECT, CARD, DATA, Btn, Link, Field, Dot, KV } from './ui.jsx';

const ROW = 'display:grid;gap:14px;align-items:center;padding:12px 12px;margin:0 -12px;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px';

/** Parts: the shelf, what open invoices still need, purchase orders, returns, and tires with DOT codes. */
export function PartsLive({ vm }) {
  const p = vm.partsPage;
  return (
    <div style={css('animation:sIn .28s ease')}>
      <Title t="Parts" sub={p.sub} right={<>
        {p.tab === 'Purchase orders' || p.tab === 'To order' ? <Btn on={p.openNewPO}>New purchase order</Btn> : p.tab === 'Returns' ? <Btn on={p.openNewReturn}>New return</Btn> : <Btn on={p.openNew}>{p.tab === 'Tires' ? 'Add tire' : 'Add part'}</Btn>}
      </>} />
      <Err vm={vm} />
      <Tabs tabs={p.tabs} />
      {p.edit ? <PartForm f={p.edit} /> : null}
      {p.poEdit ? <POForm f={p.poEdit} /> : null}
      {p.returnEdit ? <ReturnForm f={p.returnEdit} /> : null}

      {p.tab === 'Stock' || p.tab === 'Tires' ? (
        <div style={css('margin-top:18px')}>
          <input value={p.q} placeholder={p.tab === 'Tires' ? 'Search size, brand, DOT…' : 'Search part number, name, vendor…'} onChange={(e) => p.setQ(e.target.value)} style={css(INPUT + ';max-width:420px')} />
          <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
            <div style={css(ROW + ';grid-template-columns:2fr 1fr 1fr .6fr .8fr .8fr 96px;color:rgba(235,235,245,.4);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-family:var(--data-font,inherit)')}><div>Part</div><div>Number</div><div>{p.tab === 'Tires' ? 'Size · DOT' : 'Vendor · bin'}</div><div style={css('text-align:right')}>On hand</div><div style={css('text-align:right')}>Cost</div><div style={css('text-align:right')}>Retail</div><div /></div>
            {p.rows.map((r) => (
              <div key={r.id} style={css(ROW + ';grid-template-columns:2fr 1fr 1fr .6fr .8fr .8fr 96px')}>
                <div onClick={r.edit} style={css('cursor:pointer;font-weight:500')}>{r.name}</div>
                <div style={css(DATA + ';color:rgba(235,235,245,.6)')}>{r.number}</div>
                <div style={css('color:rgba(235,235,245,.6);font-size:12px')}>{p.tab === 'Tires' ? [r.size, r.dots].filter(Boolean).join(' · ') : [r.vendor, r.bin].filter(Boolean).join(' · ')}</div>
                <div style={css(DATA + ';text-align:right;color:' + (r.low ? '#ffd60a' : '#fff'))}>{r.qty}</div>
                <div style={css(DATA + ';text-align:right;color:rgba(235,235,245,.6)')}>{r.cost}</div>
                <div style={css(DATA + ';text-align:right')}>{r.price}{r.priceNote ? <span style={css('font-size:10px;color:rgba(235,235,245,.35);margin-left:4px')}>{r.priceNote}</span> : null}</div>
                <div style={css('display:flex;gap:10px;justify-content:flex-end')}><Link on={r.minus}>−</Link><Link on={r.plus}>+</Link><Link on={r.edit}>Edit</Link></div>
              </div>
            ))}
            {p.empty ? <Empty>Nothing on the shelf yet. Add parts here, or receive a purchase order and they are added for you.</Empty> : null}
          </div>
        </div>
      ) : null}

      {p.tab === 'To order' ? (
        <div style={css('margin-top:18px')}>
          {p.needVendors.length ? <div style={css('display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px')}>{p.needVendors.map((v) => <Btn key={v.label} ghost on={v.draft}>Draft PO · {v.label} ({v.n})</Btn>)}</div> : null}
          <div style={css('border-top:1px solid rgba(235,235,245,.09)')}>
            {p.need.map((l) => (
              <div key={l.id} style={css(ROW + ';grid-template-columns:2fr 1fr 1fr .5fr .8fr 1fr')}>
                <div style={css('font-weight:500')}>{l.description}</div><div style={css(DATA + ';color:rgba(235,235,245,.6)')}>{l.number}</div><div style={css('color:rgba(235,235,245,.6)')}>{l.vendor}</div><div style={css(DATA + ';text-align:right')}>{l.qty}</div><div style={css(DATA + ';text-align:right;color:rgba(235,235,245,.6)')}>{l.cost}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{l.ro}</div>
              </div>
            ))}
            {!p.need.length ? <Empty>Every part on an open invoice is in stock or on order.</Empty> : null}
          </div>
          <div style={css(CARD + ';margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:16px')}>
            <div><div style={css('font-size:14px;font-weight:500')}>PartsTech</div><div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px;line-height:1.5')}>{p.partstech ? 'Connected. Look up and order parts with pricing from your suppliers.' : 'Look parts up across your suppliers with live pricing. Connect the shop’s PartsTech account in Settings · Integrations to order from here; until then, open PartsTech and record the PO.'}</div></div>
            <a href={p.partstechUrl} target="_blank" rel="noreferrer" style={css('padding:11px 16px;border-radius:10px;background:#1c1c1e;color:rgba(235,235,245,.85);font-size:13px;font-weight:500;text-decoration:none;white-space:nowrap')}>Open PartsTech</a>
          </div>
        </div>
      ) : null}

      {p.tab === 'Purchase orders' ? (
        <div style={css('margin-top:18px;display:flex;flex-direction:column;gap:10px')}>
          {p.pos.map((po) => <PO key={po.id} po={po} />)}
          {!p.pos.length ? <Empty>No purchase orders yet. Draft one from "To order" or start one here.</Empty> : null}
        </div>
      ) : null}

      {p.tab === 'Returns' ? (
        <div style={css('margin-top:18px;border-top:1px solid rgba(235,235,245,.09)')}>
          {p.returns.map((r) => (
            <div key={r.id} style={css(ROW + ';grid-template-columns:2fr 1fr .5fr 1.4fr .8fr 1fr auto')}>
              <div style={css('font-weight:500')}>{r.description}</div><div style={css('color:rgba(235,235,245,.6)')}>{r.vendor}</div><div style={css(DATA + ';text-align:right')}>{r.qty}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{r.reason}</div><div style={css(DATA + ';text-align:right')}>{r.credit}</div>
              <div style={css('display:flex;align-items:center;gap:7px;font-size:12px;color:' + r.color)}><Dot c={r.color} />{r.status} · {r.when}</div>
              <div style={css('display:flex;gap:10px')}>{r.credited ? <Link on={r.credited} color="#30d158">Credited</Link> : null}{r.denied ? <Link on={r.denied}>Denied</Link> : null}</div>
            </div>
          ))}
          {!p.returns.length ? <Empty>No returns. A return takes the part off the shelf and waits for the vendor credit.</Empty> : null}
        </div>
      ) : null}
    </div>
  );
}

function PartForm({ f }) {
  return (
    <div style={css(CARD + ';margin-top:18px;max-width:760px')}>
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px')}>
        <Field label="Name" span><input value={f.name} autoFocus placeholder="Oil filter" onChange={(e) => f.set({ name: e.target.value })} style={css(INPUT)} /></Field>
        <Field label="Part number"><input value={f.part_number} onChange={(e) => f.set({ part_number: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Brand"><input value={f.brand} onChange={(e) => f.set({ brand: e.target.value })} style={css(INPUT)} /></Field>
        <Field label="Vendor"><input value={f.vendor} onChange={(e) => f.set({ vendor: e.target.value })} style={css(INPUT)} /></Field>
        <Field label="Cost · $"><input value={f.cost} inputMode="decimal" onChange={(e) => f.set({ cost: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label={'Retail · $' + (f.matrixPrice && !f.price ? ' (matrix ' + f.matrixPrice + ')' : '')}><input value={f.price} inputMode="decimal" placeholder="Blank = matrix" onChange={(e) => f.set({ price: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Bin"><input value={f.bin} onChange={(e) => f.set({ bin: e.target.value })} style={css(INPUT)} /></Field>
        <Field label="On hand"><input value={f.qty_on_hand} inputMode="decimal" onChange={(e) => f.set({ qty_on_hand: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Reorder at"><input value={f.qty_min} inputMode="decimal" onChange={(e) => f.set({ qty_min: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Category"><input value={f.category} onChange={(e) => f.set({ category: e.target.value })} style={css(INPUT)} /></Field>
        <Field label="Tire"><div onClick={() => f.set({ is_tire: !f.is_tire })} style={css(INPUT + ';cursor:pointer;color:' + (f.is_tire ? '#fff' : 'rgba(235,235,245,.5)'))}>{f.is_tire ? 'Yes · tracks DOT codes' : 'No'}</div></Field>
        {f.is_tire ? <Field label="Size"><input value={f.tire_size} placeholder="265/70R17" onChange={(e) => f.set({ tire_size: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field> : null}
        {f.is_tire ? <Field label="DOT codes on hand · one per tire" span><input value={f.dots} placeholder="2426 2426 2526 2526" onChange={(e) => f.set({ dots: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field> : null}
      </div>
      <div style={css('display:flex;gap:8px;margin-top:16px;align-items:center')}>
        <Btn on={f.save} ok={!!f.name.trim()}>Save</Btn><Btn ghost on={f.cancel}>Cancel</Btn>
        <div style={css('flex:1')} />
        {f.retire ? <Link on={f.retire}>Remove from the shelf</Link> : null}
      </div>
    </div>
  );
}

function POForm({ f }) {
  const [pickFor, setPickFor] = React.useState(null);
  return (
    <div style={css(CARD + ';margin-top:18px;max-width:860px')}>
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px')}>
        <Field label="Vendor"><input value={f.vendor} list="po-vendors" autoFocus placeholder="NAPA, O'Reilly, WorldPac…" onChange={(e) => f.set({ vendor: e.target.value })} style={css(INPUT)} /><datalist id="po-vendors">{f.vendors.map((v) => <option key={v} value={v} />)}</datalist></Field>
        <Field label="Vendor order / invoice #"><input value={f.reference} onChange={(e) => f.set({ reference: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Notes"><input value={f.notes} onChange={(e) => f.set({ notes: e.target.value })} style={css(INPUT)} /></Field>
      </div>
      <div style={css(LBL + ';margin:16px 0 8px')}>Lines</div>
      <div style={css('display:flex;flex-direction:column;gap:6px')}>
        {f.lines.map((l, i) => (
          <div key={i} style={css('display:grid;grid-template-columns:2fr 1fr 70px 100px 24px;gap:6px;align-items:center')}>
            <div style={css('position:relative')}>
              <input value={l.description} placeholder="Part" onFocus={() => setPickFor(i)} onChange={(e) => f.setLine(i, { description: e.target.value })} style={css(INPUT + ';padding:9px 10px')} />
              {pickFor === i && f.parts.length && (l.description || '').length >= 2 && !l.part_id ? (
                <div style={css('position:absolute;left:0;right:0;top:100%;z-index:5;background:#1c1c1e;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.5);max-height:180px;overflow:auto')}>
                  {f.parts.filter((p) => p.label.toLowerCase().includes(l.description.toLowerCase())).slice(0, 8).map((p) => <div key={p.id} onMouseDown={() => { f.pickPart(i, p.part); setPickFor(null); }} style={css('padding:8px 10px;font-size:12.5px;cursor:pointer')}>{p.label}</div>)}
                </div>
              ) : null}
            </div>
            <input value={l.part_number} placeholder="Part #" onChange={(e) => f.setLine(i, { part_number: e.target.value })} style={css(INPUT + ';padding:9px 10px;' + DATA)} />
            <input value={l.qty} inputMode="decimal" onChange={(e) => f.setLine(i, { qty: e.target.value })} style={css(INPUT + ';padding:9px 8px;text-align:right;' + DATA)} />
            <input value={l.cost} inputMode="decimal" placeholder="$ cost" onChange={(e) => f.setLine(i, { cost: e.target.value })} style={css(INPUT + ';padding:9px 8px;text-align:right;' + DATA)} />
            <div onClick={() => f.removeLine(i)} style={css('color:rgba(235,235,245,.35);cursor:pointer;text-align:center;font-size:16px')}>×</div>
          </div>
        ))}
      </div>
      <div style={css('display:flex;gap:12px;align-items:center;margin-top:8px')}><Link on={f.addLine}>+ Line</Link><div style={css('flex:1')} /><div style={css(DATA + ';font-size:14px;font-weight:600')}>{f.total}</div></div>
      <div style={css('display:flex;gap:8px;margin-top:16px')}>
        <Btn on={f.order} ok={f.ok}>Mark ordered</Btn><Btn ghost on={f.save} ok={f.ok}>Save draft</Btn><Btn ghost on={f.cancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function PO({ po }) {
  const [ref, setRef] = React.useState('');
  return (
    <div style={css(CARD + ';padding:16px 18px')}>
      <div onClick={po.toggle} style={css('display:grid;grid-template-columns:90px 1.4fr 1fr 1fr 1fr auto;gap:14px;align-items:center;cursor:pointer;font-size:13px')}>
        <div style={css(DATA + ';font-weight:600')}>{po.number}</div>
        <div><div style={css('font-weight:500')}>{po.vendor}</div>{po.ro ? <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:2px')}>{po.ro}</div> : null}</div>
        <div style={css('display:flex;align-items:center;gap:7px;color:' + po.color)}><Dot c={po.color} />{po.status} · {po.when}</div>
        <div style={css('font-size:12px;color:rgba(235,235,245,.5);' + DATA)}>{po.reference}</div>
        <div style={css(DATA + ';text-align:right')}>{po.total}</div>
        <div style={css('font-size:12px;color:rgba(235,235,245,.4)')}>{po.open ? '▴' : '▾'}</div>
      </div>
      {po.open ? (
        <div style={css('margin-top:12px;border-top:1px solid rgba(235,235,245,.07)')}>
          {po.lines.map((l) => <div key={l.id} style={css('display:grid;grid-template-columns:2fr 1fr .5fr .8fr .8fr 1fr;gap:14px;padding:8px 0;border-bottom:1px solid rgba(235,235,245,.05);font-size:12.5px')}><div>{l.description}</div><div style={css(DATA + ';color:rgba(235,235,245,.6)')}>{l.number}</div><div style={css(DATA + ';text-align:right')}>{l.qty}</div><div style={css(DATA + ';text-align:right;color:rgba(235,235,245,.6)')}>{l.cost}</div><div style={css(DATA + ';text-align:right')}>{l.total}</div><div style={css('font-size:11.5px;color:rgba(235,235,245,.45)')}>{l.ro}</div></div>)}
          <div style={css('display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap')}>
            {po.order ? <Btn on={po.order}>Mark ordered</Btn> : null}
            {po.receive ? <><input value={ref} placeholder="Vendor invoice #" onChange={(e) => setRef(e.target.value)} style={css(INPUT + ';width:180px;padding:9px 10px')} /><Btn on={() => po.receive(ref)}>Receive all</Btn></> : null}
            {po.edit ? <Link on={po.edit}>Edit</Link> : null}
            <div style={css('flex:1')} />
            {po.cancel ? <Link on={po.cancel}>Cancel PO</Link> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReturnForm({ f }) {
  return (
    <div style={css(CARD + ';margin-top:18px;max-width:760px')}>
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px')}>
        <Field label="From the shelf" span><select value={f.part_id} onChange={(e) => f.pickPart(e.target.value)} style={css(SELECT)}><option value="">Not a stocked part…</option>{f.parts.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
        <Field label="Part" span><input value={f.description} placeholder="What is going back" onChange={(e) => f.set({ description: e.target.value })} style={css(INPUT)} /></Field>
        <Field label="Vendor"><input value={f.vendor} onChange={(e) => f.set({ vendor: e.target.value })} style={css(INPUT)} /></Field>
        <Field label="Qty"><input value={f.qty} inputMode="decimal" onChange={(e) => f.set({ qty: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Credit expected · $"><input value={f.credit} inputMode="decimal" onChange={(e) => f.set({ credit: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        <Field label="Reason" span><input value={f.reason} placeholder="Wrong part, core, warranty, unused" onChange={(e) => f.set({ reason: e.target.value })} style={css(INPUT)} /></Field>
      </div>
      <div style={css('display:flex;gap:8px;margin-top:16px')}><Btn on={f.save} ok={f.ok}>Record return</Btn><Btn ghost on={f.cancel}>Cancel</Btn></div>
    </div>
  );
}
