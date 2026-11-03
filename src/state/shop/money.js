// Payments, refunds, the cash drawer, charge accounts (A/R), store credit, text-to-pay, and the
// end-of-day, sales tax and QuickBooks exports.
import { supabase, SHOP_ID } from '../supabase.js';

const GRN = '#30d158', YEL = '#ffd60a', ACC = '#e0312b', DIM = 'rgba(235,235,245,.5)';
const $ = (c) => (c < 0 ? '-' : '') + '$' + (Math.abs(c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cents = (v) => Math.round((parseFloat(String(v == null ? '' : v).replace(/[^0-9.-]/g, '')) || 0) * 100);
const iso = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const METHOD = { cash: 'Cash', card: 'Card', check: 'Check', ach: 'Bank transfer', store_credit: 'Store credit', charge: 'On account', other: 'Other' };
const ORIGIN = () => (typeof location !== 'undefined' ? location.origin : 'https://dealer-os-rosy.vercel.app');

export const moneyMethods = {
  roPaid(roId) { return (this.state.payments || []).filter((p) => p.ro_id === roId).reduce((t, p) => t + p.amount_cents, 0); },
  roBalance(roId) { return this.roTotals(roId).total - this.roPaid(roId); },
  creditOf(custId) { return (this.state.credits || []).filter((c) => c.customer_id === custId).reduce((t, c) => t + c.amount_cents, 0); },
  async takePayment(roId, method, amount, reference, note) {
    const amt = cents(amount); if (!amt) return this.setState({ err: 'Enter an amount.' });
    const drawer = (this.state.drawers || []).find((d) => !d.closed_at);
    if (!supabase) {
      const ro = this.state.ros.find((r) => r.id === roId); const a = this.state.appointments.find((x) => x.id === ro.appointment_id);
      const payments = (this.state.payments || []).concat({ id: 'pay' + Date.now(), ro_id: roId, customer_id: a.customer_id, method, amount_cents: amt, reference: reference || '', note: note || '', created_at: new Date().toISOString() });
      const paid = payments.filter((p) => p.ro_id === roId).reduce((t, p) => t + p.amount_cents, 0), total = this.roTotals(roId).total;
      const credits = method === 'store_credit' ? (this.state.credits || []).concat({ id: 'cr' + Date.now(), customer_id: a.customer_id, amount_cents: -amt, kind: 'used', note: 'Applied to RO ' + ro.number, created_at: new Date().toISOString() }) : this.state.credits || [];
      this.setState({ payments, credits, payTake: null, ros: this.state.ros.map((r) => (r.id === roId ? { ...r, status: paid >= total && method !== 'charge' ? 'paid' : 'invoiced', paid_cents: paid, paid_method: method, paid_at: paid >= total ? new Date().toISOString() : r.paid_at, invoiced_at: r.invoiced_at || new Date().toISOString() } : r)) }); return;
    }
    const { error } = await supabase.rpc('record_payment', { p_ro: roId, p_method: method, p_amount_cents: amt, p_reference: reference || '', p_note: note || '', p_drawer: drawer ? drawer.id : null });
    if (error) return this.setState({ err: error.message });
    this.setState({ payTake: null }); await this.reload();
  },
  async refund(paymentId, amount, asCredit, note) {
    const amt = cents(amount); if (!amt) return;
    if (!supabase) { const p = this.state.payments.find((x) => x.id === paymentId); this.setState({ payments: this.state.payments.concat({ id: 'pay' + Date.now(), ro_id: p.ro_id, customer_id: p.customer_id, method: asCredit ? 'store_credit' : p.method, amount_cents: -amt, refund_of: paymentId, note: note || '', created_at: new Date().toISOString() }), credits: asCredit ? (this.state.credits || []).concat({ id: 'cr' + Date.now(), customer_id: p.customer_id, amount_cents: amt, kind: 'refund', note: note || 'Refund', created_at: new Date().toISOString() }) : this.state.credits, refundOf: null }); return; }
    const { error } = await supabase.rpc('refund_payment', { p_payment: paymentId, p_amount_cents: amt, p_as_credit: !!asCredit, p_note: note || '' });
    if (error) return this.setState({ err: error.message });
    this.setState({ refundOf: null }); await this.reload();
  },
  async issueCredit(custId, amount, kind, note) {
    const amt = cents(amount); if (!amt) return;
    if (!supabase) { this.setState({ credits: (this.state.credits || []).concat({ id: 'cr' + Date.now(), customer_id: custId, amount_cents: amt, kind: kind || 'store_credit', note: note || '', created_at: new Date().toISOString() }), creditEdit: null }); return; }
    const { error } = await supabase.rpc('issue_credit', { p_customer: custId, p_amount_cents: amt, p_kind: kind || 'store_credit', p_note: note || '' });
    if (error) return this.setState({ err: error.message });
    this.setState({ creditEdit: null }); await this.reload();
  },
  async setChargeAccount(custId, on, limit, terms) {
    const p = { charge_account: !!on, credit_limit_cents: cents(limit), terms_days: parseInt(terms, 10) || 30 };
    await this.updateCustomer(custId, p);
  },
  async openDrawer(opening) {
    if (!supabase) { this.setState({ drawers: (this.state.drawers || []).concat({ id: 'dr' + Date.now(), opened_at: new Date().toISOString(), opening_cents: cents(opening), closed_at: null }) }); return; }
    const { error } = await supabase.rpc('drawer_open', { p_shop: SHOP_ID, p_opening_cents: cents(opening) });
    if (error) return this.setState({ err: error.message });
    await this.reload();
  },
  async closeDrawer(id, counted, note) {
    if (!supabase) { const d = this.state.drawers.find((x) => x.id === id); const cash = (this.state.payments || []).filter((p) => p.method === 'cash' && p.created_at >= d.opened_at).reduce((t, p) => t + p.amount_cents, 0); this.setState({ drawers: this.state.drawers.map((x) => (x.id === id ? { ...x, closed_at: new Date().toISOString(), closing_cents: cents(counted), expected_cents: d.opening_cents + cash, note: note || '' } : x)) }); return; }
    const { error } = await supabase.rpc('drawer_close', { p_drawer: id, p_counted_cents: cents(counted), p_note: note || '' });
    if (error) return this.setState({ err: error.message });
    await this.reload();
  },
  async payLink(roId) {   // create (or reuse) the text-to-pay link for an RO
    const have = (this.state.payLinks || []).find((l) => l.ro_id === roId && l.status === 'open');
    if (have) return ORIGIN() + '/pay/' + have.token;
    if (!supabase) { const l = { id: 'pl' + Date.now(), ro_id: roId, token: 'demo' + Date.now(), status: 'open' }; this.setState({ payLinks: (this.state.payLinks || []).concat(l) }); return ORIGIN() + '/pay/' + l.token; }
    const { data, error } = await supabase.from('pay_links').insert({ shop_id: SHOP_ID, ro_id: roId }).select().single();
    if (error) { this.setState({ err: error.message }); return ''; }
    this.setState({ payLinks: (this.state.payLinks || []).concat(data) });
    return ORIGIN() + '/pay/' + data.token;
  },
  async textToPay(roId) {
    const ro = this.state.ros.find((r) => r.id === roId); const a = ro && this.state.appointments.find((x) => x.id === ro.appointment_id); const c = a && this.custOf(a.customer_id);
    if (!c) return;
    if (ro.status === 'open') await this.setROStatus(roId, 'invoiced');
    const link = await this.payLink(roId); if (!link) return;
    const body = 'Hi ' + c.name.split(' ')[0] + ', your invoice from ' + ((this.state.shop && this.state.shop.name) || 'the shop') + ' is ' + $(this.roBalance(roId)) + '. Pay here: ' + link;
    await this.sendText(c.id, body, 'pay', a.id);
    this.setState({ payNote: 'Pay link sent to ' + c.name.split(' ')[0] + '.' });
  },
  async loadEOD(day) {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('eod_report', { p_shop: SHOP_ID, p_day: day });
    if (error) return this.setState({ err: error.message });
    this.setState({ eod: data, eodDay: day });
  },
  async loadTax(from, to) {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('tax_report', { p_shop: SHOP_ID, p_from: from, p_to: to });
    if (error) return this.setState({ err: error.message });
    this.setState({ taxRep: data });
  },
  async loadAR() {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('ar_report', { p_shop: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    this.setState({ ar: data });
  },
  /** QuickBooks: one row per paid invoice plus one per payment, as a CSV QuickBooks Online imports (Sales Receipts / Invoices). */
  exportQuickBooks(from, to) {
    const rows = [['Type', 'Date', 'Number', 'Customer', 'Item', 'Description', 'Qty', 'Rate', 'Amount', 'Taxable', 'Tax', 'Total', 'Payment method', 'Reference']];
    const ros = (this.state.ros || []).filter((r) => r.status === 'paid' && r.paid_at && iso(new Date(r.paid_at)) >= from && iso(new Date(r.paid_at)) <= to);
    for (const r of ros) {
      const a = this.state.appointments.find((x) => x.id === r.appointment_id); const c = a && this.custOf(a.customer_id); const t = this.roTotals(r.id);
      for (const l of (this.state.roLines || []).filter((x) => x.ro_id === r.id && x.approved !== false)) rows.push(['Invoice', iso(new Date(r.paid_at)), 'RO ' + r.number, c ? c.name : 'Walk-in', { labor: 'Labor', part: 'Parts', fee: 'Fees', discount: 'Discount' }[l.kind], l.description, Number(l.qty), (l.unit_cents / 100).toFixed(2), ((l.kind === 'discount' ? -1 : 1) * Math.round(Number(l.qty) * l.unit_cents) / 100).toFixed(2), l.taxable === false ? 'N' : 'Y', '', '', '', '']);
      if (t.supplies) rows.push(['Invoice', iso(new Date(r.paid_at)), 'RO ' + r.number, c ? c.name : 'Walk-in', 'Fees', 'Shop supplies', 1, (t.supplies / 100).toFixed(2), (t.supplies / 100).toFixed(2), 'Y', '', '', '', '']);
      rows.push(['Invoice total', iso(new Date(r.paid_at)), 'RO ' + r.number, c ? c.name : 'Walk-in', '', '', '', '', (t.subtotal / 100).toFixed(2), '', (t.tax / 100).toFixed(2), (t.total / 100).toFixed(2), '', '']);
      for (const p of (this.state.payments || []).filter((x) => x.ro_id === r.id)) rows.push([p.amount_cents < 0 ? 'Refund' : 'Payment', iso(new Date(p.created_at)), 'RO ' + r.number, c ? c.name : 'Walk-in', '', p.note || '', '', '', '', '', '', (p.amount_cents / 100).toFixed(2), METHOD[p.method] || p.method, p.reference || '']);
    }
    return rows;
  },
};

export function moneyVals(L, s, set, helpers) {
  const { vehName, relDay, fmtTime } = helpers;
  const payments = (s.payments || []).slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const day = s.regDay || today();
  const dayPays = payments.filter((p) => iso(new Date(p.created_at)) === day);
  const byMethod = {}; for (const p of dayPays) { byMethod[p.method] = byMethod[p.method] || { taken: 0, refunded: 0, n: 0 }; if (p.amount_cents > 0) { byMethod[p.method].taken += p.amount_cents; byMethod[p.method].n++; } else byMethod[p.method].refunded -= p.amount_cents; }
  const paidDay = (s.ros || []).filter((r) => r.status === 'paid' && r.paid_at && iso(new Date(r.paid_at)) === day);
  const sumT = (k) => paidDay.reduce((t, r) => t + L.roTotals(r.id)[k], 0);
  const drawer = (s.drawers || []).find((d) => !d.closed_at) || null;
  const drawerCash = drawer ? payments.filter((p) => p.method === 'cash' && p.created_at >= drawer.opened_at).reduce((t, p) => t + p.amount_cents, 0) : 0;
  const open = (s.ros || []).filter((r) => r.status === 'invoiced');
  const roMeta = (r) => { const a = s.appointments.find((x) => x.id === r.appointment_id); const c = a && L.custOf(a.customer_id); const v = a && L.vehOf(a.vehicle_id); return { a, c, v, who: c ? c.name : 'Walk-in', car: v ? vehName(v) : '', job: a ? a.job || 'Service' : '' }; };
  const arRows = open.map((r) => { const m = roMeta(r); const bal = L.roBalance(r.id); const days = r.invoiced_at ? Math.round((Date.now() - new Date(r.invoiced_at)) / 864e5) : 0; const terms = (m.c && m.c.terms_days) || 30; return { id: r.id, number: 'RO ' + r.number, who: m.who, car: m.car, job: m.job, balance: $(bal), bal, since: r.invoiced_at ? relDay(r.invoiced_at) : '', days, overdue: days > terms, charge: !!(m.c && m.c.charge_account), open: () => set({ selId: m.a.id, day: m.a.starts_at.slice(0, 10) }), take: () => set({ payTake: { ro_id: r.id, method: 'card', amount: (bal / 100).toFixed(2), reference: '', note: '' } }), link: () => L.textToPay(r.id), custId: m.c && m.c.id }; }).sort((x, y) => y.days - x.days);
  const pt = s.payTake, rf = s.refundOf, ce = s.creditEdit;
  const ptRo = pt && (s.ros || []).find((r) => r.id === pt.ro_id); const ptMeta = ptRo && roMeta(ptRo);
  const ptCredit = ptMeta && ptMeta.c ? L.creditOf(ptMeta.c.id) : 0;
  const custCredits = (s.credits || []).slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const creditBal = {}; for (const c of custCredits) creditBal[c.customer_id] = (creditBal[c.customer_id] || 0) + c.amount_cents;
  const creditRows = Object.keys(creditBal).filter((k) => creditBal[k] !== 0).map((k) => { const c = L.custOf(k); return { id: k, who: c ? c.name : 'Customer', balance: $(creditBal[k]), history: custCredits.filter((x) => x.customer_id === k).slice(0, 5).map((x) => ({ t: (x.amount_cents > 0 ? '+' : '') + $(x.amount_cents) + ' · ' + ({ store_credit: 'Store credit', goodwill: 'Goodwill', trade: 'Trade credit', used: 'Used', refund: 'Refund' }[x.kind] || x.kind) + (x.note ? ' · ' + x.note : ''), d: relDay(x.created_at) })) }; });
  const eod = s.eod && s.eodDay === day ? s.eod : null;
  const taxRep = s.taxRep || null;
  const qbFrom = s.qbFrom || (today().slice(0, 7) + '-01'), qbTo = s.qbTo || today();
  const csv = (rows) => rows.map((r) => r.map((v) => { const t = String(v == null ? '' : v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join(',')).join('\n');
  const download = (name, text) => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click(); } catch (e) {} };
  return {
    day, setDay: (d) => { set({ regDay: d }); L.loadEOD(d); }, isToday: day === today(), dayLabel: day === today() ? 'Today' : new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    tab: s.regTab || 'Day', tabs: ['Day', 'Open invoices', 'Store credit', 'Sales tax', 'Export'].map((t) => ({ label: t + (t === 'Open invoices' && open.length ? ' · ' + open.length : ''), pick: () => { set({ regTab: t }); if (t === 'Sales tax' && !taxRep) L.loadTax(qbFrom, qbTo); }, on: (s.regTab || 'Day') === t })),
    stats: [{ n: $(sumT('total')), l: 'Sales · ' + paidDay.length + (paidDay.length === 1 ? ' invoice' : ' invoices') }, { n: $(dayPays.reduce((t, p) => t + p.amount_cents, 0)), l: 'Collected' }, { n: $(sumT('tax')), l: 'Sales tax' }, { n: $(sumT('labor') + sumT('partsMargin')), l: 'Gross profit' }, { n: paidDay.length ? $(sumT('total') / paidDay.length) : '—', l: 'Average RO' }, { n: $(open.reduce((t, r) => t + L.roBalance(r.id), 0)), l: 'Owed · ' + open.length + ' open' }],
    methods: Object.keys(byMethod).map((m) => ({ k: METHOD[m] || m, v: $(byMethod[m].taken - byMethod[m].refunded), s: byMethod[m].n + (byMethod[m].n === 1 ? ' payment' : ' payments') + (byMethod[m].refunded ? ' · ' + $(byMethod[m].refunded) + ' refunded' : '') })),
    breakdown: [['Labor', $(sumT('labor'))], ['Parts', $(sumT('parts'))], ['Parts cost', '-' + $(sumT('partsCost'))], ['Fees & supplies', $(sumT('fees'))], ['Discounts', '-' + $(sumT('discount'))], ['Tax collected', $(sumT('tax'))], ['Hours billed', sumT('laborHours').toFixed(1) + ' h']],
    payments: dayPays.map((p) => { const r = (s.ros || []).find((x) => x.id === p.ro_id); const m = r ? roMeta(r) : {}; return { id: p.id, time: fmtTime(p.created_at), who: m.who || 'Customer', ro: r ? 'RO ' + r.number : '', method: METHOD[p.method] || p.method, amount: $(p.amount_cents), refund: p.amount_cents < 0, reference: p.reference, note: p.note, canRefund: p.amount_cents > 0 && p.method !== 'charge' && L.can('refund') ? () => set({ refundOf: { id: p.id, amount: (p.amount_cents / 100).toFixed(2), asCredit: false, note: '' } }) : null }; }),
    noPayments: !s.loading && !dayPays.length,
    drawer: drawer ? { id: drawer.id, since: fmtTime(drawer.opened_at), opening: $(drawer.opening_cents), cash: $(drawerCash), expected: $(drawer.opening_cents + drawerCash), close: (counted, note) => L.closeDrawer(drawer.id, counted, note) } : null,
    openDrawer: (opening) => L.openDrawer(opening),
    lastDrawer: (s.drawers || []).filter((d) => d.closed_at).sort((a, b) => b.closed_at.localeCompare(a.closed_at)).slice(0, 1).map((d) => ({ when: relDay(d.closed_at) + ' ' + fmtTime(d.closed_at), expected: $(d.expected_cents || 0), counted: $(d.closing_cents || 0), diff: (d.closing_cents - d.expected_cents) === 0 ? 'Balanced' : (d.closing_cents - d.expected_cents > 0 ? 'Over ' : 'Short ') + $(Math.abs(d.closing_cents - d.expected_cents)), color: (d.closing_cents - d.expected_cents) === 0 ? GRN : YEL }))[0] || null,
    ar: arRows, arTotal: $(arRows.reduce((t, r) => t + r.bal, 0)), arOverdue: arRows.filter((r) => r.overdue).length,
    take: pt ? { ...pt, who: ptMeta ? ptMeta.who : '', ro: ptRo ? 'RO ' + ptRo.number : '', total: ptRo ? $(L.roTotals(ptRo.id).total) : '', balance: ptRo ? $(L.roBalance(ptRo.id)) : '', credit: ptCredit ? $(ptCredit) : '', charge: !!(ptMeta && ptMeta.c && ptMeta.c.charge_account),
      methods: ['card', 'cash', 'check', 'ach', 'other'].concat(ptCredit > 0 ? ['store_credit'] : []).concat(ptMeta && ptMeta.c && ptMeta.c.charge_account ? ['charge'] : []).map((m) => ({ k: m, label: METHOD[m], on: pt.method === m, pick: () => set({ payTake: { ...pt, method: m, amount: m === 'store_credit' ? (Math.min(ptCredit, L.roBalance(ptRo.id)) / 100).toFixed(2) : pt.amount } }) })),
      set: (p) => set({ payTake: { ...pt, ...p } }), save: () => L.takePayment(pt.ro_id, pt.method, pt.amount, pt.reference, pt.note), cancel: () => set({ payTake: null }), ok: cents(pt.amount) > 0, link: () => L.textToPay(pt.ro_id) } : null,
    refund: rf ? { ...rf, set: (p) => set({ refundOf: { ...rf, ...p } }), save: () => L.refund(rf.id, rf.amount, rf.asCredit, rf.note), cancel: () => set({ refundOf: null }) } : null,
    credits: creditRows, openCredit: () => set({ creditEdit: { customer_id: '', amount: '', kind: 'store_credit', note: '' } }),
    creditEdit: ce ? { ...ce, set: (p) => set({ creditEdit: { ...ce, ...p } }), save: () => L.issueCredit(ce.customer_id, ce.amount, ce.kind, ce.note), cancel: () => set({ creditEdit: null }), ok: !!ce.customer_id && cents(ce.amount) !== 0, custOpts: s.customers.map((c) => ({ id: c.id, label: c.name })) } : null,
    note: s.payNote || '', clearNote: () => set({ payNote: '' }),
    eod: eod ? { invoices: eod.invoices, sales: $(eod.sales), collected: $(eod.collected), tax: $(eod.tax), ar: eod.ar_open + ' open · ' + $(eod.ar_balance) } : null, loadEOD: () => L.loadEOD(day),
    tax: { from: qbFrom, to: qbTo, setFrom: (v) => set({ qbFrom: v }), setTo: (v) => set({ qbTo: v }), run: () => L.loadTax(qbFrom, qbTo),
      months: taxRep ? (taxRep.months || []).map((m) => ({ month: new Date(m.month + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), invoices: m.invoices, subtotal: $(m.subtotal), taxable: $(m.taxable), tax: $(m.tax), total: $(m.total) })) : [],
      total: taxRep ? $((taxRep.months || []).reduce((t, m) => t + m.tax, 0)) : '', rate: ((s.shop && s.shop.tax_rate_bp) || 725) / 100 + '%',
      download: taxRep ? () => download('sales-tax-' + qbFrom + '-' + qbTo + '.csv', csv([['Invoice', 'Paid', 'Subtotal', 'Tax', 'Total']].concat((taxRep.invoices || []).map((i) => ['RO ' + i.number, i.paid_at.slice(0, 10), (i.subtotal / 100).toFixed(2), (i.tax / 100).toFixed(2), (i.total / 100).toFixed(2)])))) : null },
    quickbooks: { from: qbFrom, to: qbTo, setFrom: (v) => set({ qbFrom: v }), setTo: (v) => set({ qbTo: v }), count: (s.ros || []).filter((r) => r.status === 'paid' && r.paid_at && iso(new Date(r.paid_at)) >= qbFrom && iso(new Date(r.paid_at)) <= qbTo).length,
      download: () => download('revyn-quickbooks-' + qbFrom + '-' + qbTo + '.csv', csv(L.exportQuickBooks(qbFrom, qbTo))),
      downloadPayments: () => download('revyn-payments-' + qbFrom + '-' + qbTo + '.csv', csv([['Date', 'Time', 'RO', 'Customer', 'Method', 'Amount', 'Reference', 'Note']].concat(payments.filter((p) => iso(new Date(p.created_at)) >= qbFrom && iso(new Date(p.created_at)) <= qbTo).map((p) => { const r = (s.ros || []).find((x) => x.id === p.ro_id); const m = r ? roMeta(r) : {}; return [iso(new Date(p.created_at)), fmtTime(p.created_at), r ? 'RO ' + r.number : '', m.who || '', METHOD[p.method] || p.method, (p.amount_cents / 100).toFixed(2), p.reference, p.note]; })))) },
    stripe: !!(s.config && s.config.stripe),
  };
}

/** The invoice block on an appointment gains payments. */
export function invoicePayVals(L, s, set, ro) {
  if (!ro) return { payments: [], balance: '', canTake: null };
  const paid = L.roPaid(ro.id), bal = L.roBalance(ro.id);
  const pays = (s.payments || []).filter((p) => p.ro_id === ro.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const link = (s.payLinks || []).find((l) => l.ro_id === ro.id && l.status === 'open');
  return {
    payments: pays.map((p) => ({ id: p.id, t: (p.amount_cents < 0 ? 'Refund · ' : '') + (METHOD[p.method] || p.method) + (p.reference ? ' · ' + p.reference : ''), v: $(p.amount_cents), d: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })),
    paidLabel: paid ? 'Paid ' + $(paid) + (bal > 0 ? ' · ' + $(bal) + ' due' : bal < 0 ? ' · ' + $(-bal) + ' over' : '') : '', balance: bal, balanceLabel: $(bal),
    canTake: ro.status !== 'void' && bal > 0 ? () => set({ payTake: { ro_id: ro.id, method: 'card', amount: (bal / 100).toFixed(2), reference: '', note: '' } }) : null,
    textToPay: ro.status !== 'void' && bal > 0 ? () => L.textToPay(ro.id) : null, linkUrl: link ? ORIGIN() + '/pay/' + link.token : '',
    note: s.payNote || '',
  };
}
