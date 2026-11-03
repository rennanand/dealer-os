// Parts on the shelf, purchase orders, receiving, returns, counts, and tire DOT tracking.
import { supabase, SHOP_ID } from '../supabase.js';
import { matrixPrice } from './jobs.js';

const GRN = '#30d158', YEL = '#ffd60a', ACC = '#e0312b', DIM = 'rgba(235,235,245,.5)';
const $ = (c) => (c < 0 ? '-' : '') + '$' + (Math.abs(c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cents = (v) => Math.round((parseFloat(String(v == null ? '' : v).replace(/[^0-9.-]/g, '')) || 0) * 100);
const num = (v) => parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')) || 0;
const relDay = (ts) => { const d = new Date(ts); const t = new Date(); return d.toDateString() === t.toDateString() ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

export const partMethods = {
  async savePart(d) {
    const row = { part_number: (d.part_number || '').trim().toUpperCase(), name: (d.name || '').trim(), brand: (d.brand || '').trim(), vendor: (d.vendor || '').trim(), category: (d.category || 'General').trim() || 'General', bin: (d.bin || '').trim(), qty_min: num(d.qty_min), cost_cents: cents(d.cost), price_cents: cents(d.price), taxable: d.taxable !== false, is_tire: !!d.is_tire, tire_size: (d.tire_size || '').trim(), dots: String(d.dots || '').split(/[\s,]+/).map((x) => x.trim().toUpperCase()).filter(Boolean), active: d.active !== false };
    if (!row.name) return;
    if (!supabase) { const list = this.state.parts || []; const qty = num(d.qty_on_hand); this.setState({ parts: d.id ? list.map((p) => (p.id === d.id ? { ...p, ...row, qty_on_hand: qty } : p)) : list.concat({ id: 'p' + Date.now(), qty_on_hand: qty, created_at: new Date().toISOString(), ...row }), partEdit: null }); return; }
    if (d.id) {
      const { error } = await supabase.from('parts').update(row).eq('id', d.id); if (error) return this.setState({ err: error.message });
      const cur = (this.state.parts || []).find((p) => p.id === d.id); const want = num(d.qty_on_hand);
      if (cur && d.qty_on_hand !== undefined && want !== Number(cur.qty_on_hand)) await supabase.from('stock_moves').insert({ shop_id: SHOP_ID, part_id: d.id, qty: want - Number(cur.qty_on_hand), reason: 'count', note: 'Counted' });
    } else {
      const { data, error } = await supabase.from('parts').insert({ ...row, shop_id: SHOP_ID }).select().single(); if (error) return this.setState({ err: error.message });
      if (num(d.qty_on_hand)) await supabase.from('stock_moves').insert({ shop_id: SHOP_ID, part_id: data.id, qty: num(d.qty_on_hand), reason: 'count', note: 'Opening count' });
    }
    this.setState({ partEdit: null }); await this.reload();
  },
  async adjustStock(partId, qty, reason, note) {
    if (!qty) return;
    if (!supabase) { this.setState({ parts: (this.state.parts || []).map((p) => (p.id === partId ? { ...p, qty_on_hand: Number(p.qty_on_hand) + qty } : p)) }); return; }
    const { error } = await supabase.from('stock_moves').insert({ shop_id: SHOP_ID, part_id: partId, qty, reason: reason || 'adjust', note: note || '' });
    if (error) return this.setState({ err: error.message });
    await this.reload();
  },
  /** Put a shelf part on an invoice line (sold from stock, priced by the matrix unless the part has a retail). */
  async addPartLine(apptId, part, qty) {
    const unit = part.price_cents || matrixPrice(part.cost_cents, (this.state.shop || {}).parts_matrix);
    await this.addLine(apptId, { kind: 'part', description: [part.brand, part.name].filter(Boolean).join(' '), qty: qty || 1, unit: (unit / 100).toFixed(2), cost: (part.cost_cents / 100).toFixed(2), part_number: part.part_number, vendor: part.vendor, part_id: part.id });
  },
  // ---- purchase orders ----
  async savePO(d) {
    const lines = (d.lines || []).filter((l) => (l.description || '').trim()).map((l) => ({ part_id: l.part_id || null, part_number: (l.part_number || '').trim().toUpperCase(), description: l.description.trim(), qty: num(l.qty) || 1, cost_cents: cents(l.cost), ro_line_id: l.ro_line_id || null }));
    const row = { vendor: (d.vendor || '').trim(), notes: (d.notes || '').trim(), reference: (d.reference || '').trim(), ro_id: d.ro_id || null, status: d.status || 'draft' };
    if (!row.vendor || !lines.length) return;
    if (!supabase) { const id = d.id || 'po' + Date.now(); const po = { id, number: (this.state.pos || []).length + 101, created_at: new Date().toISOString(), ...row, ordered_at: row.status === 'ordered' ? new Date().toISOString() : null }; this.setState({ pos: (this.state.pos || []).filter((p) => p.id !== id).concat(po), poLines: (this.state.poLines || []).filter((l) => l.po_id !== id).concat(lines.map((l, i) => ({ id: 'pl' + Date.now() + i, po_id: id, received_qty: 0, ...l }))), poEdit: null }); return; }
    let id = d.id;
    if (id) { const { error } = await supabase.from('purchase_orders').update({ ...row, ordered_at: row.status === 'ordered' ? new Date().toISOString() : null }).eq('id', id); if (error) return this.setState({ err: error.message }); await supabase.from('po_lines').delete().eq('po_id', id); }
    else { const { data, error } = await supabase.from('purchase_orders').insert({ ...row, shop_id: SHOP_ID, ordered_at: row.status === 'ordered' ? new Date().toISOString() : null }).select().single(); if (error) return this.setState({ err: error.message }); id = data.id; }
    const { error } = await supabase.from('po_lines').insert(lines.map((l) => ({ ...l, shop_id: SHOP_ID, po_id: id })));
    if (error) return this.setState({ err: error.message });
    for (const l of lines) if (l.ro_line_id) await supabase.from('ro_lines').update({ status: row.status === 'ordered' ? 'ordered' : 'need' }).eq('id', l.ro_line_id);
    this.setState({ poEdit: null }); await this.reload();
  },
  async setPOStatus(id, status) {
    if (!supabase) { this.setState({ pos: (this.state.pos || []).map((p) => (p.id === id ? { ...p, status, ordered_at: status === 'ordered' ? new Date().toISOString() : p.ordered_at } : p)) }); return; }
    const { error } = await supabase.from('purchase_orders').update({ status, ordered_at: status === 'ordered' ? new Date().toISOString() : undefined }).eq('id', id);
    if (error) return this.setState({ err: error.message });
    if (status === 'ordered') for (const l of (this.state.poLines || []).filter((x) => x.po_id === id && x.ro_line_id)) await supabase.from('ro_lines').update({ status: 'ordered' }).eq('id', l.ro_line_id);
    await this.reload();
  },
  async receivePO(id, reference) {
    if (!supabase) { this.setState({ pos: (this.state.pos || []).map((p) => (p.id === id ? { ...p, status: 'received', received_at: new Date().toISOString() } : p)), poLines: (this.state.poLines || []).map((l) => (l.po_id === id ? { ...l, received_qty: l.qty } : l)), roLines: (this.state.roLines || []).map((l) => ((this.state.poLines || []).some((x) => x.po_id === id && x.ro_line_id === l.id) ? { ...l, status: 'received' } : l)) }); return; }
    const { error } = await supabase.rpc('receive_po', { p_po: id, p_reference: reference || '' });
    if (error) return this.setState({ err: error.message });
    await this.reload();
  },
  async addReturn(d) {
    const row = { part_id: d.part_id || null, po_id: d.po_id || null, vendor: (d.vendor || '').trim(), description: (d.description || '').trim(), qty: num(d.qty) || 1, reason: (d.reason || '').trim(), credit_cents: cents(d.credit), status: 'pending' };
    if (!row.description) return;
    if (!supabase) { this.setState({ returns: (this.state.returns || []).concat({ id: 'rt' + Date.now(), created_at: new Date().toISOString(), ...row }), returnEdit: null }); if (row.part_id) await this.adjustStock(row.part_id, -row.qty, 'returned', 'Returned to ' + row.vendor); return; }
    const { data, error } = await supabase.from('part_returns').insert({ ...row, shop_id: SHOP_ID }).select().single();
    if (error) return this.setState({ err: error.message });
    if (row.part_id) await supabase.from('stock_moves').insert({ shop_id: SHOP_ID, part_id: row.part_id, qty: -row.qty, reason: 'returned', ref_id: data.id, note: 'Returned to ' + row.vendor });
    this.setState({ returnEdit: null }); await this.reload();
  },
  async setReturn(id, status) {
    this.setState({ returns: (this.state.returns || []).map((r) => (r.id === id ? { ...r, status, credited_at: status === 'credited' ? new Date().toISOString() : r.credited_at } : r)) });
    if (supabase) await supabase.from('part_returns').update({ status, credited_at: status === 'credited' ? new Date().toISOString() : null }).eq('id', id);
  },
  /** Lines on open ROs that still need a part: the "to order" list. */
  partsNeeded() {
    const openRo = new Set((this.state.ros || []).filter((r) => r.status === 'open' || r.status === 'invoiced').map((r) => r.id));
    return (this.state.roLines || []).filter((l) => l.kind === 'part' && openRo.has(l.ro_id) && (l.status === 'need' || (!l.part_id && !l.status)));
  },
  /** Draft a PO for one vendor from everything that needs ordering. */
  draftPOFromNeeds(vendor) {
    const need = this.partsNeeded().filter((l) => !vendor || (l.vendor || '') === vendor);
    this.setState({ poEdit: { vendor: vendor || (need[0] && need[0].vendor) || '', notes: '', reference: '', status: 'draft', lines: need.map((l) => ({ description: l.description, part_number: l.part_number || '', qty: String(l.qty), cost: l.cost_cents ? (l.cost_cents / 100).toFixed(2) : '', ro_line_id: l.id, part_id: l.part_id || null })) } });
  },
};

export function partVals(L, s, set, helpers) {
  const { vehName } = helpers;
  const parts = (s.parts || []).filter((p) => p.active !== false);
  const q = (s.partQ || '').trim().toLowerCase();
  const tab = s.partTab || 'Stock';
  const rows = parts.filter((p) => !q || p.name.toLowerCase().includes(q) || p.part_number.toLowerCase().includes(q) || (p.vendor || '').toLowerCase().includes(q) || (p.tire_size || '').toLowerCase().includes(q) || (p.dots || []).some((d) => d.toLowerCase().includes(q))).sort((a, b) => a.name.localeCompare(b.name));
  const low = parts.filter((p) => p.qty_min > 0 && Number(p.qty_on_hand) <= Number(p.qty_min));
  const value = parts.reduce((t, p) => t + Number(p.qty_on_hand) * p.cost_cents, 0);
  const pe = s.partEdit, poe = s.poEdit, re = s.returnEdit;
  const sh = s.shop || {};
  const roOf = (roId) => { const r = (s.ros || []).find((x) => x.id === roId); const a = r && s.appointments.find((x) => x.id === r.appointment_id); const c = a && L.custOf(a.customer_id); const v = a && L.vehOf(a.vehicle_id); return r ? 'RO ' + r.number + (c ? ' · ' + c.name.split(' ')[0] : '') + (v ? ' · ' + (v.model || vehName(v)) : '') : ''; };
  const need = L.partsNeeded();
  const vendors = Array.from(new Set(parts.map((p) => p.vendor).concat(need.map((l) => l.vendor)).filter(Boolean))).sort();
  const pos = (s.pos || []).slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const poLinesOf = (id) => (s.poLines || []).filter((l) => l.po_id === id);
  const poTotal = (id) => poLinesOf(id).reduce((t, l) => t + Math.round(Number(l.qty) * l.cost_cents), 0);
  const statusOf = { draft: ['Draft', DIM], ordered: ['Ordered', YEL], received: ['Received', GRN], cancelled: ['Cancelled', DIM] };
  return {
    tab, tabs: ['Stock', 'To order', 'Purchase orders', 'Returns', 'Tires'].map((t) => ({ label: t + (t === 'To order' && need.length ? ' · ' + need.length : t === 'Purchase orders' && pos.filter((p) => p.status === 'ordered').length ? ' · ' + pos.filter((p) => p.status === 'ordered').length : ''), pick: () => set({ partTab: t }), on: tab === t })),
    sub: parts.length + (parts.length === 1 ? ' part' : ' parts') + ' on the shelf · ' + $(value) + ' at cost' + (low.length ? ' · ' + low.length + ' below reorder' : ''),
    q: s.partQ || '', setQ: (v) => set({ partQ: v }),
    rows: (tab === 'Tires' ? rows.filter((p) => p.is_tire) : rows).map((p) => ({ id: p.id, name: [p.brand, p.name].filter(Boolean).join(' '), number: p.part_number, vendor: p.vendor, bin: p.bin, size: p.tire_size, dots: (p.dots || []).join(', '), qty: Number(p.qty_on_hand).toString(), low: p.qty_min > 0 && Number(p.qty_on_hand) <= Number(p.qty_min), cost: $(p.cost_cents), price: $(p.price_cents || matrixPrice(p.cost_cents, sh.parts_matrix)), priceNote: p.price_cents ? '' : 'matrix',
      edit: () => set({ partEdit: { ...p, cost: (p.cost_cents / 100).toFixed(2), price: p.price_cents ? (p.price_cents / 100).toFixed(2) : '', qty_on_hand: String(p.qty_on_hand), qty_min: String(p.qty_min), dots: (p.dots || []).join(' ') } }),
      plus: () => L.adjustStock(p.id, 1, 'adjust', ''), minus: Number(p.qty_on_hand) > 0 ? () => L.adjustStock(p.id, -1, 'adjust', '') : null })),
    empty: !s.loading && !parts.length, lowCount: low.length,
    openNew: () => set({ partEdit: { name: '', part_number: '', brand: '', vendor: '', category: 'General', bin: '', cost: '', price: '', qty_on_hand: '0', qty_min: '0', is_tire: tab === 'Tires', tire_size: '', dots: '', taxable: true } }),
    edit: pe ? { ...pe, set: (p) => set({ partEdit: { ...pe, ...p } }), save: () => L.savePart(pe), cancel: () => set({ partEdit: null }), retire: pe.id ? () => L.savePart({ ...pe, active: false }) : null, matrixPrice: pe.cost ? $(matrixPrice(cents(pe.cost), sh.parts_matrix)) : '' } : null,
    // to order
    need: need.map((l) => ({ id: l.id, description: l.description, number: l.part_number, vendor: l.vendor || 'No vendor', qty: Number(l.qty).toString(), cost: l.cost_cents ? $(l.cost_cents) : '', ro: roOf(l.ro_id), status: l.status || 'need' })),
    needVendors: Array.from(new Set(need.map((l) => l.vendor || ''))).map((v) => ({ label: v || 'No vendor', n: need.filter((l) => (l.vendor || '') === v).length, draft: () => L.draftPOFromNeeds(v) })),
    partstech: !!(s.config && s.config.partstech), partstechUrl: 'https://app.partstech.com/',
    // purchase orders
    pos: pos.map((p) => ({ id: p.id, number: 'PO ' + p.number, vendor: p.vendor, status: statusOf[p.status][0], color: statusOf[p.status][1], when: relDay(p.received_at || p.ordered_at || p.created_at), total: $(poTotal(p.id)), ro: p.ro_id ? roOf(p.ro_id) : '', reference: p.reference, lines: poLinesOf(p.id).map((l) => ({ id: l.id, description: l.description, number: l.part_number, qty: Number(l.qty).toString(), cost: $(l.cost_cents), total: $(Math.round(Number(l.qty) * l.cost_cents)), ro: l.ro_line_id ? roOf(((s.roLines || []).find((x) => x.id === l.ro_line_id) || {}).ro_id) : '' })),
      order: p.status === 'draft' ? () => L.setPOStatus(p.id, 'ordered') : null, receive: p.status === 'ordered' || p.status === 'draft' ? (ref) => L.receivePO(p.id, ref) : null, cancel: p.status !== 'received' && p.status !== 'cancelled' ? () => L.setPOStatus(p.id, 'cancelled') : null,
      edit: p.status === 'draft' ? () => set({ poEdit: { ...p, lines: poLinesOf(p.id).map((l) => ({ ...l, qty: String(l.qty), cost: (l.cost_cents / 100).toFixed(2) })) } }) : null, open: s.poOpen === p.id, toggle: () => set({ poOpen: s.poOpen === p.id ? null : p.id }) })),
    openNewPO: () => set({ poEdit: { vendor: '', notes: '', reference: '', status: 'draft', lines: [{ description: '', part_number: '', qty: '1', cost: '' }] } }),
    poEdit: poe ? { ...poe, set: (p) => set({ poEdit: { ...poe, ...p } }), setLine: (i, p) => set({ poEdit: { ...poe, lines: poe.lines.map((l, j) => (j === i ? { ...l, ...p } : l)) } }), addLine: () => set({ poEdit: { ...poe, lines: poe.lines.concat({ description: '', part_number: '', qty: '1', cost: '' }) } }), removeLine: (i) => set({ poEdit: { ...poe, lines: poe.lines.filter((_, j) => j !== i) } }),
      total: $(poe.lines.reduce((t, l) => t + Math.round((num(l.qty) || 1) * cents(l.cost)), 0)), ok: !!(poe.vendor || '').trim() && poe.lines.some((l) => (l.description || '').trim()), save: () => L.savePO(poe), order: () => L.savePO({ ...poe, status: 'ordered' }), cancel: () => set({ poEdit: null }), vendors,
      pickPart: (i, part) => set({ poEdit: { ...poe, vendor: poe.vendor || part.vendor, lines: poe.lines.map((l, j) => (j === i ? { ...l, part_id: part.id, part_number: part.part_number, description: [part.brand, part.name].filter(Boolean).join(' '), cost: (part.cost_cents / 100).toFixed(2) } : l)) } }), parts: parts.map((p) => ({ id: p.id, label: [p.part_number, p.brand, p.name].filter(Boolean).join(' · '), part: p })) } : null,
    // returns
    returns: (s.returns || []).slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map((r) => ({ id: r.id, description: r.description, vendor: r.vendor, qty: Number(r.qty).toString(), reason: r.reason, credit: r.credit_cents ? $(r.credit_cents) : '', status: { pending: 'Waiting for credit', credited: 'Credited', denied: 'Denied' }[r.status], color: { pending: YEL, credited: GRN, denied: ACC }[r.status], when: relDay(r.created_at), credited: r.status === 'pending' ? () => L.setReturn(r.id, 'credited') : null, denied: r.status === 'pending' ? () => L.setReturn(r.id, 'denied') : null })),
    openNewReturn: () => set({ returnEdit: { description: '', vendor: '', qty: '1', reason: '', credit: '', part_id: '' } }),
    returnEdit: re ? { ...re, set: (p) => set({ returnEdit: { ...re, ...p } }), save: () => L.addReturn(re), cancel: () => set({ returnEdit: null }), ok: !!(re.description || '').trim(), parts: parts.map((p) => ({ id: p.id, label: [p.part_number, p.brand, p.name].filter(Boolean).join(' · ') })), pickPart: (id) => { const p = parts.find((x) => x.id === id); set({ returnEdit: { ...re, part_id: id, description: p ? [p.brand, p.name].filter(Boolean).join(' ') : re.description, vendor: p ? p.vendor : re.vendor, credit: p ? (p.cost_cents / 100).toFixed(2) : re.credit } }); } } : null,
    // for the invoice: pick from stock
    stockOpts: parts.filter((p) => Number(p.qty_on_hand) > 0).map((p) => ({ id: p.id, label: [p.part_number, p.brand, p.name].filter(Boolean).join(' · ') + ' · ' + Number(p.qty_on_hand) + ' on hand', part: p })),
  };
}
