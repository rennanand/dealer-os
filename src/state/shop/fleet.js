// Fleet accounts: businesses with several vehicles on one account, a monthly statement, PO numbers.
import { supabase, SHOP_ID } from '../supabase.js';

const $ = (c) => (c < 0 ? '-' : '') + '$' + (Math.abs(c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cents = (v) => Math.round((parseFloat(String(v == null ? '' : v).replace(/[^0-9.-]/g, '')) || 0) * 100);
const iso = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
const GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';

export const fleetMethods = {
  async saveFleet(d) {
    const row = { name: (d.name || '').trim(), contact: (d.contact || '').trim(), phone: (d.phone || '').replace(/\D/g, ''), email: (d.email || '').trim().toLowerCase(), po_required: !!d.po_required, terms_days: parseInt(d.terms_days, 10) || 30, labor_rate_cents: d.labor_rate ? cents(d.labor_rate) : null, parts_discount_pct: parseFloat(d.parts_discount_pct) || 0, notes: (d.notes || '').trim(), active: d.active !== false };
    if (!row.name) return;
    if (!supabase) { const list = this.state.fleets || []; this.setState({ fleets: d.id ? list.map((f) => (f.id === d.id ? { ...f, ...row } : f)) : list.concat({ id: 'fl' + Date.now(), created_at: new Date().toISOString(), ...row }), fleetEdit: null }); return; }
    const { error } = d.id ? await supabase.from('fleets').update(row).eq('id', d.id) : await supabase.from('fleets').insert({ ...row, shop_id: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    this.setState({ fleetEdit: null }); await this.reload();
  },
  async setCustomerFleet(custId, fleetId) { await this.updateCustomer(custId, { fleet_id: fleetId || null, ...(fleetId ? { charge_account: true } : {}) }); },
  async setVehicleUnit(vehId, unit) {
    this.setState({ vehicles: this.state.vehicles.map((v) => (v.id === vehId ? { ...v, unit } : v)) });
    if (supabase) await supabase.from('customer_vehicles').update({ unit }).eq('id', vehId);
  },
  async loadStatement(fleetId, from, to) {
    if (!supabase) { this.setState({ statement: { fleet: (this.state.fleets || []).find((f) => f.id === fleetId), from, to, invoices: [], total: 0, paid: 0, balance: 0, open_balance: 0 } }); return; }
    const { data, error } = await supabase.rpc('fleet_statement', { p_fleet: fleetId, p_from: from, p_to: to });
    if (error) return this.setState({ err: error.message });
    this.setState({ statement: data });
  },
  async emailStatement(fleet, st) {
    const to = fleet.email; if (!to) return this.setState({ err: 'Add an email for ' + fleet.name + ' first.' });
    const rows = (st.invoices || []).map((i) => '<tr><td style="padding:7px 0;border-bottom:1px solid #eee">' + new Date(i.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</td><td style="padding:7px 0;border-bottom:1px solid #eee">RO ' + i.number + (i.po_number ? ' · PO ' + i.po_number : '') + '</td><td style="padding:7px 0;border-bottom:1px solid #eee">' + [i.unit ? 'Unit ' + i.unit : '', i.vehicle, i.job].filter(Boolean).join(' · ') + '</td><td style="padding:7px 0;border-bottom:1px solid #eee;text-align:right">' + $(i.total) + '</td><td style="padding:7px 0;border-bottom:1px solid #eee;text-align:right;color:' + (i.total - i.paid > 0 ? '#b45309' : '#1a7f37') + '">' + (i.total - i.paid > 0 ? $(i.total - i.paid) + ' due' : 'Paid') + '</td></tr>').join('');
    const html = '<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111"><div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#888">' + ((this.state.shop && this.state.shop.name) || 'Statement') + '</div><div style="font-size:22px;font-weight:600;margin-top:6px">Statement · ' + fleet.name + '</div><div style="font-size:13px;color:#666;margin-top:4px">' + st.from + ' to ' + st.to + ' · terms ' + (fleet.terms_days || 30) + ' days</div><table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px">' + rows + '</table><div style="display:flex;justify-content:space-between;font-size:16px;font-weight:600;margin-top:14px"><span>Balance due</span><span>' + $(st.balance) + '</span></div></div>';
    if (!supabase) return this.setState({ payNote: 'Statement would be emailed to ' + to + '.' });
    const { error } = await supabase.rpc('send_email', { p_customer: null, p_to: to, p_subject: ((this.state.shop && this.state.shop.name) || 'Shop') + ' · Statement ' + st.from + ' to ' + st.to, p_html: html, p_kind: 'statement', p_ref: fleet.id });
    this.setState({ payNote: error ? error.message : 'Statement sent to ' + to + (this.state.config && this.state.config.email ? '.' : ' (opens in Mail until email is connected).') });
  },
};

export function fleetVals(L, s, set, helpers) {
  const { vehName, relDay } = helpers;
  const fleets = (s.fleets || []).filter((f) => f.active !== false).sort((a, b) => a.name.localeCompare(b.name));
  const sel = fleets.find((f) => f.id === s.fleetSel) || fleets[0] || null;
  const members = sel ? s.customers.filter((c) => c.fleet_id === sel.id) : [];
  const units = members.flatMap((c) => s.vehicles.filter((v) => v.customer_id === c.id).map((v) => ({ ...v, driver: c.name })));
  const openFor = (cid) => (s.ros || []).filter((r) => r.status === 'invoiced' && (s.appointments.find((a) => a.id === r.appointment_id) || {}).customer_id === cid);
  const owed = members.reduce((t, c) => t + openFor(c.id).reduce((x, r) => x + L.roBalance(r.id), 0), 0);
  const inShop = units.filter((v) => s.appointments.some((a) => a.vehicle_id === v.id && ['arrived', 'in_progress'].includes(a.status)));
  const fe = s.fleetEdit;
  const from = s.stFrom || iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to = s.stTo || iso(new Date());
  const st = s.statement && sel && s.statement.fleet && s.statement.fleet.id === sel.id ? s.statement : null;
  const csv = (rows) => rows.map((r) => r.map((v) => { const t = String(v == null ? '' : v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join(',')).join('\n');
  const download = (name, text) => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click(); } catch (e) {} };
  return {
    list: fleets.map((f) => { const ms = s.customers.filter((c) => c.fleet_id === f.id); const o = ms.reduce((t, c) => t + openFor(c.id).reduce((x, r) => x + L.roBalance(r.id), 0), 0); return { id: f.id, name: f.name, sub: ms.length + (ms.length === 1 ? ' driver' : ' drivers') + ' · ' + s.vehicles.filter((v) => ms.some((c) => c.id === v.customer_id)).length + ' units' + (o ? ' · ' + $(o) + ' owed' : ''), on: sel && sel.id === f.id, pick: () => set({ fleetSel: f.id, statement: null }) }; }),
    sel: sel ? { ...sel, owed: owed ? $(owed) : '', inShop: inShop.length, members: members.map((c) => ({ id: c.id, name: c.name, phone: c.phone, open: openFor(c.id).length, remove: () => L.setCustomerFleet(c.id, null) })),
      units: units.map((v) => ({ id: v.id, unit: v.unit || '', name: vehName(v) || 'Vehicle', plate: v.plate || '', driver: v.driver, odometer: v.odometer ? v.odometer.toLocaleString('en-US') + ' mi' : '', status: (() => { const a = s.appointments.find((x) => x.vehicle_id === v.id && ['booked', 'arrived', 'in_progress'].includes(x.status)); return a ? ({ booked: 'Booked', arrived: 'In the shop', in_progress: 'In service' }[a.status]) : ''; })(), setUnit: (u) => L.setVehicleUnit(v.id, u) })),
      edit: () => set({ fleetEdit: { ...sel, labor_rate: sel.labor_rate_cents ? (sel.labor_rate_cents / 100).toFixed(2) : '', parts_discount_pct: String(sel.parts_discount_pct || 0), terms_days: String(sel.terms_days || 30) } }),
      addMember: (cid) => L.setCustomerFleet(cid, sel.id), candidates: s.customers.filter((c) => !c.fleet_id).map((c) => ({ id: c.id, label: c.name + (c.phone ? ' · ' + c.phone : '') })),
      statement: st ? { ...st, totalLabel: $(st.total), paidLabel: $(st.paid), balanceLabel: $(st.balance), openLabel: $(st.open_balance), rows: (st.invoices || []).map((i) => ({ id: i.id, date: new Date(i.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), ro: 'RO ' + i.number + (i.po_number ? ' · PO ' + i.po_number : ''), what: [i.unit ? 'Unit ' + i.unit : '', i.vehicle, i.job].filter(Boolean).join(' · '), total: $(i.total), due: i.total - i.paid > 0 ? $(i.total - i.paid) : 'Paid', dueColor: i.total - i.paid > 0 ? YEL : GRN })),
        download: () => download('statement-' + sel.name.replace(/\s+/g, '-').toLowerCase() + '-' + from + '.csv', csv([['Date', 'RO', 'PO', 'Unit', 'Vehicle', 'Service', 'Total', 'Paid', 'Due']].concat((st.invoices || []).map((i) => [i.starts_at.slice(0, 10), i.number, i.po_number, i.unit, i.vehicle, i.job, (i.total / 100).toFixed(2), (i.paid / 100).toFixed(2), ((i.total - i.paid) / 100).toFixed(2)])))),
        email: sel.email ? () => L.emailStatement(sel, st) : null } : null,
      from, to, setFrom: (v) => set({ stFrom: v }), setTo: (v) => set({ stTo: v }), run: () => L.loadStatement(sel.id, from, to) } : null,
    openNew: () => set({ fleetEdit: { name: '', contact: '', phone: '', email: '', po_required: false, terms_days: '30', labor_rate: '', parts_discount_pct: '0', notes: '' } }),
    edit: fe ? { ...fe, set: (p) => set({ fleetEdit: { ...fe, ...p } }), save: () => L.saveFleet(fe), cancel: () => set({ fleetEdit: null }), retire: fe.id ? () => L.saveFleet({ ...fe, active: false }) : null } : null,
    empty: !s.loading && !fleets.length, note: s.payNote || '',
    options: fleets.map((f) => ({ id: f.id, name: f.name })),
  };
}
