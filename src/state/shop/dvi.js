// Inspection templates: the shop's own checklists, with the canned job to quote when an item is
// flagged. Reports: writer and technician numbers, parts usage, CSV and print.
import { supabase, SHOP_ID } from '../supabase.js';

const $ = (c) => '$' + (Math.abs(c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'item';

export const dviMethods = {
  templateFor(apptId) {
    const have = (this.state.inspections || []).find((i) => i.appointment_id === apptId);
    const tpls = this.state.inspTemplates || [];
    return (have && have.template_id && tpls.find((t) => t.id === have.template_id)) || tpls.find((t) => t.is_default) || tpls[0] || null;
  },
  async saveTemplate2(t) {
    const items = (t.items || []).filter((it) => (it.label || '').trim()).map((it, i) => ({ key: it.key || slug(it.label) + '_' + i, label: it.label.trim(), measLabel: (it.measLabel || 'Condition').trim(), hint: (it.hint || '').trim(), now_job: it.now_job || null, monitor_job: it.monitor_job || null }));
    const row = { name: (t.name || '').trim(), items, is_default: !!t.is_default, internal: !!t.internal, sort: Number(t.sort) || 100 };
    if (!row.name || !items.length) return;
    if (!supabase) { const list = this.state.inspTemplates || []; const next = t.id ? list.map((x) => (x.id === t.id ? { ...x, ...row } : row.is_default ? { ...x, is_default: false } : x)) : list.map((x) => (row.is_default ? { ...x, is_default: false } : x)).concat({ id: 'it' + Date.now(), ...row }); this.setState({ inspTemplates: next, inspEdit: null }); return; }
    if (row.is_default) await supabase.from('inspection_templates').update({ is_default: false }).eq('shop_id', SHOP_ID);
    const { error } = t.id ? await supabase.from('inspection_templates').update(row).eq('id', t.id) : await supabase.from('inspection_templates').insert({ ...row, shop_id: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    this.setState({ inspEdit: null }); await this.reload();
  },
  async removeTemplate2(id) {
    this.setState({ inspTemplates: (this.state.inspTemplates || []).filter((x) => x.id !== id), inspEdit: null });
    if (supabase) await supabase.from('inspection_templates').delete().eq('id', id);
  },
  async useTemplate(apptId, templateId) {
    const t = (this.state.inspTemplates || []).find((x) => x.id === templateId); if (!t) return;
    const items = t.items.map((it) => ({ key: it.key, label: it.label, measLabel: it.measLabel, hint: it.hint, now_job: it.now_job, monitor_job: it.monitor_job, status: '', meas: '', note: '', price: '', sent: false }));
    await this.saveInspection(apptId, { items, template_id: t.id, status: 'open' });
  },
  async loadStaffReport(from, to) {
    if (!supabase) return;
    const [sr, pu, pr, cf] = await Promise.all([supabase.rpc('staff_report', { p_shop: SHOP_ID, p_from: from, p_to: to }), supabase.rpc('parts_usage', { p_shop: SHOP_ID, p_from: from, p_to: to }), supabase.rpc('payroll_report', { p_shop: SHOP_ID, p_from: from, p_to: to }), supabase.rpc('carfax_export', { p_shop: SHOP_ID, p_from: from.slice(0, 10), p_to: to.slice(0, 10) })]);
    if (sr.error) return this.setState({ err: sr.error.message });
    this.setState({ staffRep: sr.data, partsUsage: pu.data || [], payroll: pr.data || [], carfax: cf.data || [], staffRepKey: from + to });
  },
};

export function dviVals(L, s, set) {
  const tpls = (s.inspTemplates || []).slice().sort((a, b) => a.sort - b.sort);
  const ie = s.inspEdit;
  const jobs = (s.cannedJobs || []).filter((j) => j.active !== false).sort((a, b) => a.name.localeCompare(b.name)).map((j) => ({ id: j.id, name: j.name }));
  return {
    templates: tpls.map((t) => ({ id: t.id, name: t.name, count: (t.items || []).length + ' items', isDefault: t.is_default, internal: t.internal, edit: () => set({ inspEdit: { ...t, items: (t.items || []).map((it) => ({ ...it })) } }) })),
    openNew: () => set({ inspEdit: { name: '', items: [{ label: '', measLabel: 'Condition', hint: '' }], is_default: !tpls.length, internal: false, sort: 100 } }),
    edit: ie ? { ...ie, set: (p) => set({ inspEdit: { ...ie, ...p } }), setItem: (i, p) => set({ inspEdit: { ...ie, items: ie.items.map((it, j) => (j === i ? { ...it, ...p } : it)) } }), addItem: () => set({ inspEdit: { ...ie, items: ie.items.concat({ label: '', measLabel: 'Condition', hint: '' }) } }), removeItem: (i) => set({ inspEdit: { ...ie, items: ie.items.filter((_, j) => j !== i) } }),
      move: (i, dir) => { const items = ie.items.slice(); const j = i + dir; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; set({ inspEdit: { ...ie, items } }); },
      save: () => L.saveTemplate2(ie), cancel: () => set({ inspEdit: null }), remove: ie.id ? () => L.removeTemplate2(ie.id) : null, jobs } : null,
    options: tpls.map((t) => ({ id: t.id, name: t.name })),
  };
}

export function reportVals(L, s, set, helpers) {
  const iso = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
  const today = iso(new Date());
  const from = s.repFrom || today.slice(0, 7) + '-01', to = s.repTo || today;
  const rep = s.staffRep || null;
  const csv = (rows) => rows.map((r) => r.map((v) => { const t = String(v == null ? '' : v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join(',')).join('\n');
  const download = (name, text) => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click(); } catch (e) {} };
  const fromTs = new Date(from + 'T00:00:00').toISOString(), toTs = new Date(to + 'T23:59:59').toISOString();
  // Demo fallback computed locally so the page reads without a backend.
  const localTechs = () => s.techs.filter((t) => t.active !== false).map((t) => { const ros = (s.ros || []).filter((r) => r.status === 'paid' && r.paid_at >= fromTs && r.paid_at <= toTs && (s.appointments.find((a) => a.id === r.appointment_id) || {}).tech_id === t.id); const tot = ros.map((r) => L.roTotals(r.id)); const clock = (s.timeEntries || []).filter((e) => e.tech_id === t.id && e.started_at >= fromTs && e.started_at <= toTs).reduce((h, e) => h + (new Date(e.ended_at || Date.now()) - new Date(e.started_at)) / 36e5, 0); return { id: t.id, name: t.name, role: t.role, visits: ros.length, sales: tot.reduce((x, y) => x + y.total, 0), labor: tot.reduce((x, y) => x + y.labor, 0), parts_gp: tot.reduce((x, y) => x + y.partsMargin, 0), billed_hours: tot.reduce((x, y) => x + y.laborHours, 0), clock_hours: clock, findings: 0, approved: 0 }; });
  const techs = (rep ? rep.techs : localTechs()).map((t) => ({ name: t.name, role: t.role, visits: String(t.visits), sales: $(t.sales), labor: $(t.labor), gp: $(t.labor + t.parts_gp), gpHr: Number(t.clock_hours) ? '$' + Math.round((t.labor + t.parts_gp) / 100 / Number(t.clock_hours)) + '/h' : '—', eff: Number(t.clock_hours) && Number(t.billed_hours) ? Math.round((Number(t.billed_hours) / Number(t.clock_hours)) * 100) + '%' : '—', hours: Number(t.billed_hours).toFixed(1) + ' / ' + Number(t.clock_hours).toFixed(1) + ' h', approval: t.findings ? Math.round((t.approved / t.findings) * 100) + '% of ' + t.findings : '—' }));
  const writers = (rep ? rep.writers : []).map((w) => ({ name: w.name, invoices: String(w.invoices), sales: $(w.sales), aro: $(w.aro) }));
  const usage = (s.partsUsage || []).map((p) => ({ name: p.name, number: p.part_number, vendor: p.vendor, qty: Number(p.qty).toString(), cost: $(p.cost_cents) }));
  const PAY = { hourly: 'Hourly', flat_rate: 'Flat rate', commission: 'Commission', salary: 'Salary' };
  const payroll = (s.payroll || []).map((p) => ({ name: p.name, type: PAY[p.pay_type] || p.pay_type, rate: p.pay_type === 'commission' ? Number(p.commission_pct) + '% of labor' : p.pay_type === 'salary' ? '—' : $(p.pay_rate_cents) + '/h', clock: Number(p.clock_hours).toFixed(1) + ' h', billed: Number(p.billed_hours).toFixed(1) + ' h', labor: $(p.labor_cents), pay: $(p.pay_cents) }));
  const carfax = s.carfax || [];
  return {
    from, to, setFrom: (v) => set({ repFrom: v }), setTo: (v) => set({ repTo: v }), run: () => L.loadStaffReport(fromTs, toTs), stale: !!supabase && s.staffRepKey !== fromTs + toTs,
    techs, writers, usage, noUsage: !usage.length,
    payroll, payrollTotal: $((s.payroll || []).reduce((t, p) => t + (p.pay_cents || 0), 0)),
    downloadPayroll: () => download('payroll-' + from + '-' + to + '.csv', csv([['Technician', 'Pay type', 'Rate', 'Clock hours', 'Billed hours', 'Labor sales', 'Pay']].concat(payroll.map((p) => [p.name, p.type, p.rate, p.clock, p.billed, p.labor, p.pay])))),
    carfaxCount: carfax.length, downloadCarfax: () => download('carfax-' + from + '-' + to + '.csv', csv([['VIN', 'Plate', 'Date', 'Odometer', 'RO', 'Services', 'Year', 'Make', 'Model']].concat(carfax.map((r) => [r.vin, r.plate, r.date, r.odometer, r.ro, r.services, r.year, r.make, r.model])))),
    downloadTechs: () => download('technicians-' + from + '-' + to + '.csv', csv([['Technician', 'Role', 'Visits', 'Sales', 'Labor', 'Gross profit', 'GP per hour', 'Efficiency', 'Billed / clock hours', 'Approval']].concat(techs.map((t) => [t.name, t.role, t.visits, t.sales, t.labor, t.gp, t.gpHr, t.eff, t.hours, t.approval])))),
    downloadUsage: () => download('parts-usage-' + from + '-' + to + '.csv', csv([['Part', 'Number', 'Vendor', 'Qty', 'Cost']].concat(usage.map((u) => [u.name, u.number, u.vendor, u.qty, u.cost])))),
    print: () => { try { window.print(); } catch (e) {} },
  };
}
