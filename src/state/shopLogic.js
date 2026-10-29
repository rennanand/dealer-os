// View-model for the live Customers and Appointments pages (real records in Supabase).
// Without a backend it runs on a few in-memory rows so the screens can be reviewed.
import { DCLogic } from '../runtime/logic.js';
import { supabase, SHOP_ID, SUPABASE_URL } from './supabase.js';
import { RULER, PILL_L } from './appLogic.js';

const ACC = '#e0312b', GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';
const pill = (c) => 'display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border:1px solid ' + c + ';border-radius:4px;font-family:var(--data-font,inherit);font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;line-height:1.3;color:' + c;
const iso = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtDay = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const relDay = (ts) => { const d = iso(new Date(ts)); return d === today() ? 'Today' : d === addDays(today(), -1) ? 'Yesterday' : fmtDay(ts); };
export const vehName = (v) => (v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : '');
const initials = (n) => (n || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
export const fmtPhone = (p) => { const d = (p || '').replace(/\D/g, ''); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : p || ''; };
const STATUS = { booked: ['Booked', ACC], arrived: ['Checked in', YEL], in_progress: ['In service', YEL], done: ['Complete', GRN], cancelled: ['Cancelled', DIM], no_show: ['No-show', DIM] };
const VISIT = { dropoff: 'Drop off', wait: 'Wait', loaner: 'Loaner' };
const NEXT = { booked: 'arrived', arrived: 'in_progress', in_progress: 'done' };
const NEXT_LABEL = { booked: 'Check in', arrived: 'Start work', in_progress: 'Mark complete' };
const DAY_LABEL = (d) => (d === today() ? 'Today' : d === addDays(today(), 1) ? 'Tomorrow' : new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
const TIMES = []; for (let h = 7; h <= 18; h++) for (const m of [0, 30]) TIMES.push((h < 10 ? '0' : '') + h + ':' + (m ? '30' : '00'));

const DEMO = {
  customers: [{ id: 'c1', name: 'Sarah Mitchell', phone: '4355550141', email: '', city: 'Ephraim, UT', created_at: '2025-03-01' }, { id: 'c2', name: 'Dale Christensen', phone: '4355550177', email: '', city: 'Gunnison, UT', created_at: '2024-06-12' }],
  vehicles: [{ id: 'v1', customer_id: 'c1', year: 2021, make: 'Toyota', model: '4Runner', plate: 'UT 4RNR', odometer: 61220 }, { id: 'v2', customer_id: 'c2', year: 2018, make: 'Ford', model: 'F-150', plate: 'UT F150', odometer: 142300 }],
  appointments: [{ id: 'a1', customer_id: 'c1', vehicle_id: 'v1', starts_at: today() + 'T10:30:00', job: 'Tire replacement', visit: 'wait', status: 'in_progress', bay: 2 }, { id: 'a2', customer_id: 'c2', vehicle_id: 'v2', starts_at: today() + 'T08:00:00', job: 'Plugs + coils', visit: 'dropoff', status: 'done' }, { id: 'a3', customer_id: 'c1', vehicle_id: 'v1', starts_at: today() + 'T15:00:00', job: 'Inspection', visit: 'dropoff', status: 'booked' }],
  findings: [{ id: 'f1', appointment_id: 'a1', tier: 'now', name: 'Front brake pads + rotors', plain: 'Pads are worn down.', price_cents: 48932, status: 'pending', created_at: new Date(Date.now() - 25 * 60000).toISOString() }, { id: 'f2', appointment_id: 'a2', tier: 'soon', name: 'Cabin air filter', plain: 'Getting dirty.', price_cents: 6500, status: 'declined', decided_at: new Date(Date.now() - 3 * 864e5).toISOString(), created_at: new Date(Date.now() - 3 * 864e5).toISOString(), fu_status: 'open' }],
  rentals: [{ id: 'r1', number: 'LN-3107', customer_id: 'c2', customer_name: 'Dale Christensen', status: 'out', start_date: today(), end_date: addDays(today(), 1), vehicle_id: 'lv1' }], loanerFleet: [{ id: 'lv1', year: 2027, make: 'Tesla', model: 'Model 3', status: 'out' }],
};

export class ShopLogic extends DCLogic {
  state = { drag: null, schedMsg: '', findings: [], photos: [], newFinding: null, estId: null, fuTab: 'Open', fuNote: '', repRange: '31 days', techs: [], newTech: null, editTech: null, messages: [], threadId: null, reply: '', customers: [], vehicles: [], appointments: [], rentals: [], loanerFleet: [], loading: !!supabase, err: '', day: today(), selId: null, custId: null, newAppt: null, newCust: null, search: '', busy: false, editVeh: null };

  async componentDidMount() {
    if (!supabase) { this.setState({ ...DEMO, loading: false }); return; }
    await this.reload();
    this.chan = supabase.channel('shop:' + SHOP_ID);
    for (const t of ['customers', 'customer_vehicles', 'appointments', 'findings', 'visit_photos', 'technicians', 'messages']) this.chan.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => this.reload());
    this.chan.subscribe();
  }
  componentWillUnmount() { if (this.chan) supabase.removeChannel(this.chan); }

  async reload() {
    const [c, v, a, r, lf, fi, ph, te, sh, ms] = await Promise.all([
      supabase.from('customers').select('*').eq('shop_id', SHOP_ID).order('name'),
      supabase.from('customer_vehicles').select('*').eq('shop_id', SHOP_ID).order('created_at'),
      supabase.from('appointments').select('*').eq('shop_id', SHOP_ID).gte('starts_at', addDays(today(), -60)).order('starts_at'),
      supabase.from('loaner_vehicles').select('id,year,make,model,color,status').eq('shop_id', SHOP_ID).neq('status', 'retired'),
      supabase.from('findings').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -60)).order('created_at'),
      supabase.from('visit_photos').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -60)).order('created_at'),
      supabase.from('technicians').select('*').eq('shop_id', SHOP_ID).order('created_at'),
      supabase.from('shops').select('*').eq('shop_id', SHOP_ID).maybeSingle(),
      supabase.from('messages').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -90)).order('created_at'),
      supabase.from('rentals').select('id,number,customer_id,customer_name,customer_phone,status,start_date,end_date,vehicle_id,created_at').eq('shop_id', SHOP_ID).order('created_at', { ascending: false }).limit(300),
    ]);
    const bad = c.error || v.error || a.error;
    if (bad) return this.setState({ loading: false, err: /does not exist|schema cache/.test(bad.message) ? 'Customers and appointments need the 0009 migration run in Supabase.' : bad.message });
    this.setState({ customers: c.data, vehicles: v.data, appointments: a.data, rentals: r.data || [], loanerFleet: lf.data || [], findings: fi.data || [], photos: ph.data || [], techs: te.data || [], shop: sh.data || null, messages: ms.data || [], loading: false, err: '' });
  }

  // ---- customers ----
  async addCustomer(d) {
    const row = { name: d.name.trim(), phone: d.phone.replace(/\D/g, ''), email: (d.email || '').trim(), city: (d.city || '').trim() };
    if (!row.name) return;
    let cust;
    if (!supabase) { cust = { id: 'c' + Date.now(), created_at: new Date().toISOString(), ...row }; this.setState({ customers: [...this.state.customers, cust].sort((a, b) => a.name.localeCompare(b.name)) }); }
    else {
      this.setState({ busy: true });
      const { data, error } = await supabase.from('customers').insert({ ...row, shop_id: SHOP_ID }).select().single();
      this.setState({ busy: false });
      if (error) return this.setState({ err: error.message });
      cust = data; this.setState({ customers: [...this.state.customers, data].sort((a, b) => a.name.localeCompare(b.name)) });
    }
    if ((d.make || d.model || d.year) && cust) await this.addVehicle(cust.id, d);
    return cust;
  }
  async addVehicle(customer_id, d) {
    const row = { customer_id, year: parseInt(d.year, 10) || null, make: (d.make || '').trim(), model: (d.model || '').trim(), plate: (d.plate || '').trim().toUpperCase(), odometer: parseInt(String(d.odometer || '').replace(/\D/g, ''), 10) || null };
    if (!supabase) { this.setState({ vehicles: [...this.state.vehicles, { id: 'v' + Date.now(), ...row }], editVeh: null }); return; }
    const { data, error } = await supabase.from('customer_vehicles').insert({ ...row, shop_id: SHOP_ID }).select().single();
    if (error) return this.setState({ err: error.message });
    this.setState({ vehicles: [...this.state.vehicles, data], editVeh: null });
    return data;
  }
  async updateCustomer(id, p) {
    this.setState({ customers: this.state.customers.map((c) => (c.id === id ? { ...c, ...p } : c)) });
    if (supabase) { const { error } = await supabase.from('customers').update(p).eq('id', id); if (error) this.setState({ err: error.message }); }
  }

  // ---- appointments ----
  async addAppt(d) {
    let customer_id = d.customer_id || null;
    if (!customer_id && d.name) { const c = await this.addCustomer(d); customer_id = c && c.id; }
    let vehicle_id = d.vehicle_id || null;
    if (!vehicle_id && customer_id && (d.make || d.model)) { const v = await this.addVehicle(customer_id, d); vehicle_id = v && v.id; }
    const row = { customer_id, vehicle_id, starts_at: new Date(d.day + 'T' + d.time + ':00').toISOString(), job: (d.job || '').trim(), visit: d.visit || 'dropoff', notes: (d.notes || '').trim(), status: 'booked' };
    if (!supabase) { const a = { id: 'a' + Date.now(), ...row }; this.setState({ appointments: [...this.state.appointments, a].sort((x, y) => x.starts_at.localeCompare(y.starts_at)), newAppt: null, selId: a.id }); return; }
    this.setState({ busy: true });
    const { data, error } = await supabase.from('appointments').insert({ ...row, shop_id: SHOP_ID }).select().single();
    this.setState({ busy: false });
    if (error) return this.setState({ err: error.message });
    this.setState({ appointments: [...this.state.appointments, data].sort((x, y) => x.starts_at.localeCompare(y.starts_at)), newAppt: null, selId: data.id });
  }
  async setAppt(id, p) {
    this.setState({ appointments: this.state.appointments.map((a) => (a.id === id ? { ...a, ...p } : a)) });
    if (supabase) { const { error } = await supabase.from('appointments').update(p).eq('id', id); if (error) this.setState({ err: error.message }); }
  }

  async addFinding(apptId, d) {
    const row = { appointment_id: apptId, tier: d.tier || 'now', name: d.name.trim(), plain: (d.plain || '').trim(), tech: (d.tech || '').trim(), meas: (d.meas || '').trim(), meas_label: (d.meas_label || '').trim(), urgency: (d.urgency || '').trim(), wait_text: (d.wait_text || '').trim(), price_cents: Math.round(parseFloat(String(d.price || '0').replace(/[^\d.]/g, '')) * 100) || 0 };
    if (!row.name) return;
    if (!supabase) { this.setState({ findings: this.state.findings.concat({ id: 'f' + Date.now(), status: 'pending', created_at: new Date().toISOString(), ...row }), newFinding: null }); return; }
    const { data, error } = await supabase.from('findings').insert({ ...row, shop_id: SHOP_ID }).select().single();
    if (error) return this.setState({ err: error.message });
    this.setState({ findings: this.state.findings.concat(data), newFinding: null });
  }
  async setFinding(id, p) {
    this.setState({ findings: this.state.findings.map((f) => (f.id === id ? { ...f, ...p } : f)) });
    if (supabase) { const { error } = await supabase.from('findings').update(p).eq('id', id); if (error) this.setState({ err: error.message }); }
  }
  async removeFinding(id) {
    this.setState({ findings: this.state.findings.filter((f) => f.id !== id) });
    if (supabase) await supabase.from('findings').delete().eq('id', id);
  }
  async addVisitPhoto(apptId, file, caption, findingId) {
    if (!file) return;
    if (!supabase) { this.setState({ photos: this.state.photos.concat({ id: 'p' + Date.now(), appointment_id: apptId, finding_id: findingId || null, path: '', local: URL.createObjectURL(file), caption: caption || '', created_at: new Date().toISOString() }) }); return; }
    const path = apptId + '/' + Date.now() + '.jpg';
    const up = await supabase.storage.from('visit-photos').upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (up.error) return this.setState({ err: up.error.message });
    const { data, error } = await supabase.from('visit_photos').insert({ shop_id: SHOP_ID, appointment_id: apptId, finding_id: findingId || null, path, caption: caption || '' }).select().single();
    if (error) return this.setState({ err: error.message });
    this.setState({ photos: this.state.photos.concat(data) });
  }
  async saveTech(d) {
    const row = { name: (d.name || '').trim(), role: (d.role || 'Technician').trim() || 'Technician', bays: (d.bays || []).map(Number).filter(Boolean), active: d.active !== false };
    if (!row.name) return;
    if (!supabase) { this.setState({ techs: d.id ? this.state.techs.map((t) => (t.id === d.id ? { ...t, ...row } : t)) : this.state.techs.concat({ id: 't' + Date.now(), created_at: new Date().toISOString(), ...row }), newTech: null, editTech: null }); return; }
    const q = d.id ? supabase.from('technicians').update(row).eq('id', d.id).select().single() : supabase.from('technicians').insert({ ...row, shop_id: SHOP_ID }).select().single();
    const { data, error } = await q;
    if (error) return this.setState({ err: error.message });
    this.setState({ techs: d.id ? this.state.techs.map((t) => (t.id === d.id ? data : t)) : this.state.techs.concat(data), newTech: null, editTech: null });
  }
  async sendReply(customerId, text) {
    const t = (text || '').trim(); if (!t || !customerId) return;
    const appt = this.state.appointments.find((a) => a.customer_id === customerId && ['booked', 'arrived', 'in_progress'].includes(a.status));
    const local = { id: 'm' + Date.now(), shop_id: SHOP_ID, customer_id: customerId, appointment_id: appt ? appt.id : null, sender: 'advisor', text: t, read_by_shop: true, read_by_cust: false, created_at: new Date().toISOString() };
    this.setState({ messages: this.state.messages.concat(local), reply: '' });
    if (!supabase) return;
    const { error } = await supabase.from('messages').insert({ shop_id: SHOP_ID, customer_id: customerId, appointment_id: local.appointment_id, sender: 'advisor', text: t, read_by_shop: true });
    if (error) this.setState({ err: error.message });
  }
  async markThreadRead(customerId) {
    if (!this.state.messages.some((m) => m.customer_id === customerId && m.sender === 'customer' && !m.read_by_shop)) return;
    this.setState({ messages: this.state.messages.map((m) => (m.customer_id === customerId && m.sender === 'customer' ? { ...m, read_by_shop: true } : m)) });
    if (supabase) await supabase.from('messages').update({ read_by_shop: true }).eq('customer_id', customerId).eq('sender', 'customer').eq('read_by_shop', false);
  }
  photoUrl(p) { return p.local || (SUPABASE_URL + '/storage/v1/object/public/visit-photos/' + p.path); }

  custOf(id) { return this.state.customers.find((c) => c.id === id) || null; }
  vehOf(id) { return this.state.vehicles.find((v) => v.id === id) || null; }

  renderVals() {
    const s = this.state, set = (p) => this.setState(p);
    const apptsOf = (cid) => s.appointments.filter((a) => a.customer_id === cid);
    const rentalsOf = (c) => s.rentals.filter((r) => r.customer_id === c.id || (c.phone && (r.customer_phone || '').replace(/\D/g, '') === c.phone));
    const lastVisit = (c) => { const done = apptsOf(c.id).filter((a) => a.status !== 'cancelled' && a.status !== 'no_show'); const l = done.filter((a) => a.starts_at <= new Date().toISOString()).pop(); return l ? relDay(l.starts_at) : '—'; };
    const q = s.search.trim().toLowerCase();
    const custRows = s.customers.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q.replace(/\D/g, '') || '§') || s.vehicles.some((v) => v.customer_id === c.id && (vehName(v).toLowerCase().includes(q) || (v.plate || '').toLowerCase().includes(q))));
    const custId = s.custId && s.customers.some((c) => c.id === s.custId) ? s.custId : (custRows[0] || {}).id || null;
    const cust = this.custOf(custId);
    const custCars = cust ? s.vehicles.filter((v) => v.customer_id === cust.id) : [];
    const custAppts = cust ? apptsOf(cust.id).slice().reverse() : [];
    const custRentals = cust ? rentalsOf(cust) : [];
    const activeToday = new Set(s.appointments.filter((a) => iso(new Date(a.starts_at)) === today() && a.status !== 'cancelled').map((a) => a.customer_id));

    const dayAppts = s.appointments.filter((a) => iso(new Date(a.starts_at)) === s.day);
    const days = [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(today(), n));
    if (!days.includes(s.day)) days.unshift(s.day);
    const selId = s.selId && dayAppts.some((a) => a.id === s.selId) ? s.selId : (dayAppts.find((a) => a.status === 'booked' || a.status === 'arrived') || dayAppts[0] || {}).id || null;
    const sel = s.appointments.find((a) => a.id === selId) || null;
    const selCust = sel && this.custOf(sel.customer_id), selVeh = sel && this.vehOf(sel.vehicle_id);
    const chip = (on) => 'padding:8px 14px;border-radius:999px;font-size:12.5px;font-weight:500;cursor:pointer;' + (on ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)');
    const row = (on) => 'display:flex;align-items:center;gap:18px;padding:16px 12px;margin:0 -12px;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer;border-radius:10px;' + (on ? 'background:rgba(235,235,245,.06)' : '');
    const na = s.newAppt, nc = s.newCust;
    const custOpts = s.customers.map((c) => ({ id: c.id, label: c.name + (c.phone ? ' · ' + fmtPhone(c.phone) : '') }));
    const naCars = na && na.customer_id ? s.vehicles.filter((v) => v.customer_id === na.customer_id) : [];

    // Overview: today's day from the same records
    const nowIso = new Date().toISOString();
    const todays = s.appointments.filter((a) => iso(new Date(a.starts_at)) === today() && a.status !== 'cancelled');
    const openRentals = s.rentals.filter((r) => r.status === 'out' || r.status === 'signed' || r.status === 'sent');
    const out = openRentals.filter((r) => r.status === 'out');
    const dueBack = out.filter((r) => r.end_date && r.end_date <= today());
    const lvName = (id) => { const v = s.loanerFleet.find((x) => x.id === id); return v ? vehName(v) : 'Loaner'; };
    const PCT = { arrived: 10, in_progress: 55, done: 100 };
    const floor = [1, 2, 3, 4, 5].map((bay) => {
      const a = todays.find((x) => x.bay === bay && (x.status === 'arrived' || x.status === 'in_progress')) || todays.find((x) => x.bay === bay && x.status === 'done');
      const c = a && this.custOf(a.customer_id), v = a && this.vehOf(a.vehicle_id), st = a && STATUS[a.status];
      const pct = a ? PCT[a.status] || 0 : 0;
      return { bay: 'Bay 0' + bay, open: !a, car: a ? vehName(v) || 'Vehicle' : 'Open', who: a ? (c ? c.name : 'Walk-in') + ' · ' + (a.job || 'Service') : 'Nothing assigned', status: a ? st[0] + (a.status === 'done' && a.pickup === 'here' ? ' · here' : a.status === 'done' && a.pickup === 'on_way' ? ' · on the way' : '') : '', color: a ? st[1] : 'rgba(235,235,245,.3)', pctLabel: a ? pct + '%' : '—', eta: a ? fmtTime(a.starts_at) : '',
        dot: 'width:7px;height:7px;border-radius:4px;background:' + (a ? st[1] : 'rgba(235,235,245,.18)'), pill: pill(a ? st[1] : DIM), go: a ? () => set({ selId: a.id, day: today() }) : null,
        ruler: { base: 'height:2px;background:rgba(235,235,245,.1);border-radius:1px', fill: 'height:2px;border-radius:1px;width:' + pct + '%;background:' + (a ? st[1] : 'transparent') },
        style: 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px;min-height:170px;' + (a ? 'cursor:pointer' : 'opacity:.6') };
    });
    const upNext = s.appointments.filter((a) => a.status === 'booked' && a.starts_at >= nowIso).slice(0, 4).map((a) => { const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id); return { id: a.id, who: c ? c.name : 'Walk-in', car: (vehName(v) || 'Vehicle') + ' · ' + (a.job || 'Service'), when: (iso(new Date(a.starts_at)) === today() ? '' : DAY_LABEL(iso(new Date(a.starts_at))) + ' · ') + fmtTime(a.starts_at), open: () => set({ selId: a.id, day: iso(new Date(a.starts_at)) }) }; });
    const loanerRows = openRentals.slice(0, 4).map((r) => ({ id: r.id, who: r.customer_name, car: lvName(r.vehicle_id) + ' · ' + r.number, state: r.status === 'out' ? (r.end_date && r.end_date <= today() ? 'Due back' : 'Out · back ' + fmtDay(r.end_date + 'T12:00:00')) : r.status === 'signed' ? 'Signed · keys at the desk' : 'Awaiting signature', color: r.status === 'out' ? (r.end_date && r.end_date <= today() ? YEL : ACC) : r.status === 'signed' ? GRN : YEL }));
    const overview = {
      sub: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' · ' + todays.length + (todays.length === 1 ? ' appointment' : ' appointments') + ' · ' + out.length + (out.length === 1 ? ' loaner out' : ' loaners out'),
      stats: [{ n: String(todays.length), l: 'Appointments today' }, { n: String(todays.filter((a) => a.status === 'arrived' || a.status === 'in_progress').length), l: 'In the shop now' }, { n: String(todays.filter((a) => a.status === 'done').length), l: 'Complete' }, { n: String(out.length), l: 'Loaners out' }, { n: String(dueBack.length), l: 'Loaners due back' }],
      baysNow: floor.filter((b) => !b.open).length + ' of 5', floor, upNext, loanerRows,
      noUpNext: !s.loading && !upNext.length, noLoaners: !s.loading && !loanerRows.length,
    };

    // Schedule: the day's appointments on a bay timeline, draggable between times and bays.
    const H0 = 7, H1 = 19, SPAN = H1 - H0, HOURS = []; for (let h = H0; h <= H1; h++) HOURS.push(h);
    const hl = (hr) => (((hr - H0) / SPAN) * 100).toFixed(2) + '%';
    const fmtH = (hr) => { const h12 = ((Math.floor(hr) + 11) % 12) + 1, m = Math.round((hr % 1) * 60); return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + (hr >= 12 ? ' PM' : ' AM'); };
    const hourOf = (ts) => { const d = new Date(ts); return d.getHours() + d.getMinutes() / 60; };
    const drag = s.drag;
    const lanes = [1, 2, 3, 4, 5, 0]; // 0 = not yet assigned to a bay
    const dayJobs = dayAppts.filter((a) => a.status !== 'cancelled' && a.status !== 'no_show');
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    const techFor = (bay) => s.techs.filter((t) => t.active !== false && (t.bays || []).includes(bay)).map((t) => t.name.split(' ')[0]).join(', ');
    const schedRows = lanes.map((bay) => ({ bay: bay ? 'Bay 0' + bay : 'Unassigned', tech: bay ? techFor(bay) : 'Drag into a bay', blocks: dayJobs.filter((a) => (a.bay || 0) === bay).map((a) => {
      const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id), st = STATUS[a.status] || STATUS.booked, start = hourOf(a.starts_at), dur = Math.max(0.5, (a.minutes || 60) / 60), dragging = drag && drag.id === a.id;
      return {
        id: a.id, who: c ? c.name : 'Walk-in', job: (vehName(v) || 'Vehicle') + ' · ' + (a.job || 'Service'), time: fmtH(start) + ' – ' + fmtH(start + dur), status: st[0], c: st[1],
        style: 'position:absolute;top:8px;bottom:8px;left:' + hl(start) + ';width:calc(' + ((dur / SPAN) * 100).toFixed(2) + '% - 4px);min-width:92px;padding:10px 12px;border-radius:10px;background:#141416;user-select:none;touch-action:none;overflow:hidden;' + (dragging ? 'transform:translate(' + drag.dx + 'px,' + drag.dy + 'px);z-index:5;cursor:grabbing;box-shadow:0 16px 44px rgba(0,0,0,.65),inset 0 0 0 1px rgba(255,255,255,.28),inset 3px 0 0 ' + st[1] + ';' : 'cursor:grab;transition:left .25s ease,width .25s ease;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 3px 0 0 ' + st[1] + ';'),
        down: (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} const lane = e.currentTarget.parentElement.getBoundingClientRect(); set({ drag: { id: a.id, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, pxh: lane.width / SPAN, rowH: lane.height, scale: lane.height / 84, moved: false }, schedMsg: '' }); },
        move: (e) => { const d = this.state.drag; if (!d || d.id !== a.id) return; set({ drag: { ...d, dx: (e.clientX - d.x0) / d.scale, dy: (e.clientY - d.y0) / d.scale, moved: d.moved || Math.abs(e.clientX - d.x0) + Math.abs(e.clientY - d.y0) > 4 } }); },
        up: (e) => {
          const d = this.state.drag; if (!d || d.id !== a.id) return;
          if (!d.moved) { set({ drag: null, selId: a.id }); return; }
          let nstart = Math.max(H0, Math.min(H1 - dur, Math.round((start + (e.clientX - d.x0) / d.pxh) * 4) / 4));
          const li = lanes.indexOf(bay), nb = lanes[Math.max(0, Math.min(lanes.length - 1, li + Math.round((e.clientY - d.y0) / d.rowH)))];
          const others = dayJobs.filter((x) => (x.bay || 0) === nb && x.id !== a.id).map((x) => ({ start: hourOf(x.starts_at), dur: Math.max(0.5, (x.minutes || 60) / 60) }));
          const clash = (t) => others.some((o) => t < o.start + o.dur && t + dur > o.start);
          let tries = 0; while (nb && tries++ < 48 && clash(nstart)) nstart = Math.min(H1 - dur, nstart + 0.25);
          if (nb && clash(nstart)) { set({ drag: null, schedMsg: 'No room in Bay 0' + nb + ' at that time.' }); return; }
          const changed = nstart !== start || nb !== bay;
          set({ drag: null, schedMsg: changed ? (c ? c.name.split(' ')[0] : 'Walk-in') + (nb !== bay ? (nb ? ' moved to Bay 0' + nb : ' taken off the bays') : '') + (nstart !== start ? (nb !== bay ? ', ' : ' moved to ') + fmtH(nstart) : '') + '.' : '' });
          if (!changed) return;
          const d0 = new Date(a.starts_at); d0.setHours(Math.floor(nstart), Math.round((nstart % 1) * 60), 0, 0);
          this.setAppt(a.id, { starts_at: d0.toISOString(), bay: nb || null });
        },
      };
    }) }));
    // Technicians page
    const techJobs = (t) => todays.filter((a) => a.tech_id === t.id);
    const techs = s.techs.filter((t) => t.active !== false).map((t) => { const jobs = techJobs(t), mins = jobs.reduce((m, a) => m + (a.minutes || 60), 0), pct = Math.min(100, Math.round((mins / 480) * 100)); return { id: t.id, name: t.name, role: t.role + ((t.bays || []).length ? ' · Bay ' + t.bays.map((b) => '0' + b).join(', ') : ''), initials: t.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), hours: (mins / 60).toFixed(1).replace(/\.0$/, '') + ' h / 8 h', bar: 'height:100%;width:' + pct + '%;background:' + (pct > 85 ? YEL : ACC) + ';border-radius:2px', jobs: jobs.map((a) => { const st = STATUS[a.status] || STATUS.booked, v = this.vehOf(a.vehicle_id); return { t: (v ? (v.model || vehName(v)) : 'Vehicle') + ' · ' + (a.job || 'Service'), s: a.status === 'booked' ? fmtTime(a.starts_at) : st[0], c: st[1] }; }), edit: () => set({ editTech: { ...t, bays: t.bays || [] } }) }; });
    const techsSub = techs.length + (techs.length === 1 ? ' technician' : ' technicians') + ' · ' + todays.filter((a) => a.tech_id).length + ' of ' + todays.length + ' jobs today assigned';
    const techForm = s.editTech || s.newTech;
    const technicians = { techs, sub: techsSub, none: !s.loading && !techs.length, form: techForm, isNew: !!s.newTech && !s.editTech,
      openNew: () => set({ newTech: { name: '', role: 'Technician', bays: [] }, editTech: null }), setForm: (p) => set(s.editTech ? { editTech: { ...s.editTech, ...p } } : { newTech: { ...s.newTech, ...p } }), cancel: () => set({ newTech: null, editTech: null }),
      toggleBay: (b) => { const f = techForm; const bays = (f.bays || []).includes(b) ? f.bays.filter((x) => x !== b) : (f.bays || []).concat(b).sort(); set(s.editTech ? { editTech: { ...f, bays } } : { newTech: { ...f, bays } }); },
      save: () => techForm && this.saveTech(techForm), retire: s.editTech ? () => this.saveTech({ ...s.editTech, active: false }) : null };

    // Lobby board rows: today's bays, first name + initial, no prices
    const LPCT = { arrived: 8, in_progress: 55, done: 100 };
    const lobbyRows = [1, 2, 3, 4, 5].map((bay) => {
      const a = todays.find((x) => x.bay === bay && (x.status === 'arrived' || x.status === 'in_progress')) || todays.find((x) => x.bay === bay && x.status === 'done');
      if (!a) return { bay: 'Bay 0' + bay, who: 'Open', car: '', status: '', c: 'rgba(235,235,245,.3)', pctLabel: '', ruler: RULER(0, '#fff', 14), eta: '', etaSub: '', etaColor: DIM, bayPill: PILL_L('rgba(235,235,245,.3)') };
      const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id), pend = s.findings.some((f) => f.appointment_id === a.id && f.status === 'pending');
      const st = pend ? ['Waiting for approval', YEL] : STATUS[a.status], pct = pend ? 35 : LPCT[a.status] || 0, t = s.techs.find((x) => x.id === a.tech_id);
      const who = c ? c.name.split(' ')[0] + (c.name.split(' ')[1] ? ' ' + c.name.split(' ')[1][0] + '.' : '') : 'Walk-in';
      return { bay: 'Bay 0' + bay, who, car: v ? [v.make, v.model].filter(Boolean).join(' ') : 'Vehicle', status: st[0], c: st[1], pctLabel: pct + '%', ruler: RULER(pct, st[1], 14), eta: a.status === 'done' ? (a.pickup === 'here' ? 'Here' : 'Ready') : '—', etaSub: a.status === 'done' ? (a.pickup === 'here' ? 'Guest is at the desk' : a.pickup === 'on_way' ? 'Guest on the way' : 'Pick up at the desk') : t ? t.name.split(' ')[0] + ' on it' : (a.job || 'Service'), etaColor: a.status === 'done' ? GRN : '#fff', bayPill: PILL_L(st[1]) };
    });
    const live = todays.find((x) => x.status === 'in_progress' && x.bay) || null;
    const liveC = live && this.custOf(live.customer_id);
    const lobby = { rows: lobbyRows, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).replace(/,/g, ' ·'),
      liveBay: live ? 'Live · Bay 0' + live.bay + (liveC ? ' · ' + liveC.name.split(' ')[0] : '') : 'Shop floor', liveTitle: live ? (live.job || 'Service') + ' in progress' : 'Nothing on the lifts right now', liveSub: live ? 'Status is updated by the technician as the work moves along.' : 'Checked-in vehicles appear here as work starts.',
      scene: live ? (/oil|maint/i.test(live.job || '') ? 'oil' : /tire|wheel/i.test(live.job || '') ? 'tire' : /batter/i.test(live.job || '') ? 'battery' : 'brake') : 'brake', phase: live ? (/oil|maint/i.test(live.job || '') ? 'filter' : /tire|wheel/i.test(live.job || '') ? 'off' : /batter/i.test(live.job || '') ? 'load' : 'remove') : 'worn',
      foot: [{ k: 'Hours today', v: (s.shop && s.shop.hours) || 'Mon, Tue, Thu, Fri · 8:00 AM – 5:30 PM' }, { k: 'Front desk', v: 'Ask us anything' }, { k: 'Loaners out', v: String(out.length) }] };

    // Inbox: one thread per customer
    const byCust = {};
    for (const m of s.messages) (byCust[m.customer_id] = byCust[m.customer_id] || []).push(m);
    const threads = Object.keys(byCust).map((cid) => { const ms = byCust[cid], c = this.custOf(cid), last = ms[ms.length - 1], unread = ms.some((m) => m.sender === 'customer' && !m.read_by_shop); const appt = s.appointments.find((a) => a.customer_id === cid && ['booked', 'arrived', 'in_progress'].includes(a.status)); const pend = appt && s.findings.some((f) => f.appointment_id === appt.id && f.status === 'pending'); const v = appt && this.vehOf(appt.vehicle_id); return { id: cid, who: c ? c.name : 'Customer', initials: c ? c.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?', context: appt ? (vehName(v) || 'Vehicle') + ' · ' + (appt.job || 'Service') : c && c.phone ? fmtPhone(c.phone) : '', time: relDay(last.created_at) === 'Today' ? fmtTime(last.created_at) : relDay(last.created_at), section: unread ? 'Needs response' : pend ? 'Waiting for approval' : appt ? 'General' : 'Completed', color: unread ? ACC : pend ? YEL : GRN, preview: last.text, msgs: ms, state: appt ? (pend ? 'Waiting for approval' : STATUS[appt.status][0]) : 'No open visit', stateColor: appt ? (pend ? YEL : STATUS[appt.status][1]) : DIM, placeholder: 'Reply to ' + (c ? c.name.split(' ')[0] : 'customer'), lastAt: last.created_at }; }).sort((x, y) => y.lastAt.localeCompare(x.lastAt));
    let thread = threads.find((t) => t.id === s.threadId) || null;
    if (!thread && s.threadId && this.custOf(s.threadId)) { const c = this.custOf(s.threadId); thread = { id: c.id, who: c.name, initials: c.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), context: c.phone ? fmtPhone(c.phone) : '', state: 'New conversation', stateColor: DIM, msgs: [], placeholder: 'Message ' + c.name.split(' ')[0], section: 'General', color: GRN, time: '', preview: '', lastAt: '' }; }
    if (!thread) thread = threads[0] || null;
    const bubble = (m) => { const adv = m.sender === 'advisor'; return { text: m.text, time: fmtTime(m.created_at), wrap: 'display:flex;flex-direction:column;align-items:' + (adv ? 'flex-end' : 'flex-start') + ';max-width:70%;align-self:' + (adv ? 'flex-end' : 'flex-start'), bubble: 'padding:10px 14px;border-radius:16px;font-size:13.5px;line-height:1.45;' + (adv ? 'background:#fff;color:#000;border-bottom-right-radius:5px' : 'background:rgba(255,255,255,.08);color:#fff;border-bottom-left-radius:5px'), timeStyle: 'font-size:10px;color:rgba(235,235,245,.3);margin:4px 10px 0' }; };
    const dotOf = (c) => 'width:7px;height:7px;border-radius:4px;flex:0 0 auto;background:' + c;
    const inbox = {
      sections: ['Needs response', 'Waiting for approval', 'General', 'Completed'].map((title) => ({ title, items: threads.filter((t) => t.section === title).map((t) => ({ who: t.who, time: t.time, preview: t.preview, open: () => { set({ threadId: t.id }); this.markThreadRead(t.id); }, dot: dotOf(t.color), style: 'display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:12px;cursor:pointer;transition:background .18s ease;' + (thread && thread.id === t.id ? 'background:#1c1c1e;' : 'background:transparent;') })) })).filter((sec) => sec.items.length),
      thread: thread ? { ...thread, msgs: thread.msgs.map(bubble) } : null, none: !s.loading && !threads.length && !(s.threadId && this.custOf(s.threadId)), goInboxFlag: !!s.goInbox, clearGoInbox: () => set({ goInbox: false }),
      reply: s.reply, onReply: (e) => set({ reply: e.target.value }), onReplyKey: (e) => { if (e.key === 'Enter' && thread) this.sendReply(thread.id, s.reply); }, send: () => thread && this.sendReply(thread.id, s.reply),
      unread: threads.filter((t) => t.section === 'Needs response').length,
      startWith: (cid) => set({ threadId: cid }),
    };

    // Approvals: every visit with an estimate waiting, plus visits in progress with nothing sent yet
    const fmtC = (c) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const TCOL = { now: ACC, soon: YEL, monitor: GRN };
    const openVisits = s.appointments.filter((a) => a.status === 'arrived' || a.status === 'in_progress');
    const ageOf = (ts) => { const m = Math.round((Date.now() - new Date(ts)) / 60000); return m < 60 ? m + ' min' : Math.round(m / 60) + ' h'; };
    const queue = openVisits.map((a) => { const fs = s.findings.filter((f) => f.appointment_id === a.id), pend = fs.filter((f) => f.status === 'pending'), c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id); const sentAt = pend.length ? pend.reduce((t, f) => (t < f.created_at ? t : f.created_at), pend[0].created_at) : null; return { id: a.id, who: c ? c.name : 'Walk-in', car: (vehName(v) || 'Vehicle') + ' · ' + (a.job || 'Service'), total: pend.length ? fmtC(pend.reduce((t, f) => t + f.price_cents, 0)) : fs.length ? fmtC(fs.filter((f) => f.status === 'approved' || f.status === 'done').reduce((t, f) => t + f.price_cents, 0)) : '—', wait: pend.length ? 'Waiting ' + ageOf(sentAt) : fs.length ? 'Decided' : a.status === 'in_progress' ? 'In service · nothing sent' : 'Checked in', waitColor: pend.length ? (Date.now() - new Date(sentAt) > 20 * 60000 ? ACC : YEL) : DIM, kicker: pend.length ? 'Waiting for approval' : fs.length ? 'Decided' : 'No estimate yet', kColor: pend.length ? YEL : fs.length ? GRN : DIM, pend, fs, a, c, v, sentAt, rank: pend.length ? 0 : 1 }; }).sort((x, y) => x.rank - y.rank || (x.sentAt || '').localeCompare(y.sentAt || ''));
    const est = queue.find((q) => q.id === s.estId) || queue[0] || null;
    const approvals = {
      count: queue.filter((q) => q.pend.length).length,
      queueFull: queue.map((q) => ({ who: q.who, car: q.car, total: q.total, wait: q.wait, waitColor: q.waitColor, kicker: q.kicker, kColor: q.kColor, open: () => set({ estId: q.id }), style: 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px;cursor:pointer;transition:all .18s ease;' + (est && est.id === q.id ? 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.2);' : '') })),
      estSel: est ? { wo: 'Visit · ' + fmtTime(est.a.starts_at), totalLabel: 'Total · tax at the counter', who: est.who, car: (vehName(est.v) || 'Vehicle') + (est.v && est.v.odometer ? ' · ' + est.v.odometer.toLocaleString('en-US') + ' mi' : ''), total: est.total, lines: est.fs.map((f) => ({ k: f.name + (f.status === 'declined' ? ' (declined)' : f.status === 'approved' || f.status === 'done' ? ' (approved)' : ''), v: f.price_cents ? fmtC(f.price_cents) : '$0.00', dot: 'width:7px;height:7px;border-radius:4px;flex:0 0 auto;background:' + (f.status === 'declined' ? DIM : TCOL[f.tier] || DIM) })), note: est.pend.length ? 'Sent ' + fmtTime(est.sentAt) + ' to the customer\u2019s phone. ' + est.pend.length + (est.pend.length === 1 ? ' item' : ' items') + ' waiting.' : est.fs.length ? 'Customer decided in the app.' : 'Add findings on the appointment to send an estimate.', cta: est.pend.length ? 'Send a gentle reminder' : '', canRemind: est.pend.length > 0 } : { wo: '', who: 'Nothing waiting', car: '', total: '', lines: [], note: 'Estimates appear here the moment a finding is sent from an appointment.', cta: '', canRemind: false },
      sendReminder: () => { if (!est || !est.pend.length || !est.c) return; this.sendReply(est.c.id, 'Just checking in \u2014 your estimate is ready in the app whenever you are. Happy to answer anything about it.'); set({ fuNote: 'Reminder sent to ' + est.who.split(' ')[0] + ' in the app.' }); },
      none: !s.loading && !queue.length,
    };

    // Follow-ups: declined work, with remind / snooze / close
    const declined = s.findings.filter((f) => f.status === 'declined');
    const fuAll = declined.map((f) => { const a = s.appointments.find((x) => x.id === f.appointment_id), c = a && this.custOf(a.customer_id), v = a && this.vehOf(a.vehicle_id); const stt = f.fu_status === 'snoozed' && f.fu_until && new Date(f.fu_until) < new Date() ? 'open' : f.fu_status || 'open'; const weeks = Math.round((Date.now() - new Date(f.decided_at || f.created_at)) / (7 * 864e5)); return { f, a, c, v, stt, weeks }; });
    const fuRowsAll = fuAll.map(({ f, a, c, v, stt, weeks }) => {
      const status = stt === 'reminded' ? 'Reminded · ' + relDay(f.fu_at) : stt === 'snoozed' ? 'Snoozed · ' + fmtDay(f.fu_until) : stt === 'done' ? 'Closed' : 'Open · ' + (weeks < 1 ? 'this week' : weeks + ' wk');
      const sc = stt === 'reminded' ? YEL : stt === 'snoozed' ? DIM : stt === 'done' ? GRN : TCOL[f.tier] || DIM;
      const setFu = (p) => this.setFinding(f.id, p);
      return { cust: c ? c.name : 'Customer', car: v ? vehName(v) : 'Vehicle', item: f.name, wo: a ? 'Visit · ' + fmtDay(a.starts_at) : '', tier: { now: 'Recommended now', soon: 'Recommended soon', monitor: 'Monitor' }[f.tier] || f.tier, declined: relDay(f.decided_at || f.created_at) + ' · in app', reason: 'Left unchecked in the service plan', price: fmtC(f.price_cents), dot: 'width:7px;height:7px;border-radius:4px;flex:0 0 auto;background:' + (TCOL[f.tier] || DIM), status, statusPill: pill(sc), stt, value: f.price_cents,
        canRemind: (stt === 'open' || stt === 'snoozed') && !!c, canSnooze: stt === 'open', canDone: stt !== 'done',
        remind: () => { if (c) this.sendReply(c.id, 'Hi ' + c.name.split(' ')[0] + ', a reminder that ' + f.name.toLowerCase() + ' was recommended at your last visit' + (f.price_cents ? ' (' + fmtC(f.price_cents) + ')' : '') + '. Book whenever it suits you \u2014 it is in the app.'); setFu({ fu_status: 'reminded', fu_at: new Date().toISOString() }); set({ fuNote: 'Reminder sent to ' + (c ? c.name.split(' ')[0] : 'the customer') + ' in the app.' }); },
        snooze: () => { const d = new Date(); d.setDate(d.getDate() + 30); setFu({ fu_status: 'snoozed', fu_until: d.toISOString() }); }, done: () => setFu({ fu_status: 'done' }),
        style: 'display:grid;grid-template-columns:1.25fr 1.5fr .9fr .55fr 1.35fr 1fr 196px;gap:14px;padding:16px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;align-items:center;transition:opacity .2s ease;opacity:' + (stt === 'done' ? 0.45 : 1) };
    });
    const fuTab = s.fuTab || 'Open';
    const fuRows = fuRowsAll.filter((r) => fuTab === 'All' || (fuTab === 'Open' ? r.stt === 'open' : r.stt === 'reminded'));
    const fuOpen = fuRowsAll.filter((r) => r.stt === 'open');
    const chipF = (on) => 'padding:8px 14px;border-radius:999px;font-size:12.5px;font-weight:500;cursor:pointer;' + (on ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)');
    const followups = {
      count: fuOpen.length,
      fuTabs: ['Open', 'Reminded', 'All'].map((x) => ({ label: x, pick: () => set({ fuTab: x }), style: chipF(fuTab === x) })),
      fuStats: [{ n: String(fuOpen.length), l: 'Open', c: '#fff' }, { n: fmtC(fuOpen.reduce((t, r) => t + r.value, 0)), l: 'Declined value, open', c: '#fff' }, { n: String(fuRowsAll.filter((r) => r.stt === 'reminded').length), l: 'Reminded', c: fuRowsAll.some((r) => r.stt === 'reminded') ? YEL : '#fff' }],
      fuRows, fuEmpty: fuRows.length === 0,
      fuNote: s.fuNote || 'Remind sends an in-app message to the customer. Snooze hides the item for 30 days. Nothing is sent automatically.',
    };

    // Reports on real numbers. No payments are recorded, so money figures are approved work from estimates.
    const repRange = s.repRange || '31 days';
    const dayKey = (ts) => iso(new Date(ts));
    const monthKey = (ts) => dayKey(ts).slice(0, 7);
    const buckets = repRange === '12 months' ? Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 11 + i); return d.toISOString().slice(0, 7); }) : Array.from({ length: repRange === '7 days' ? 7 : 31 }, (_, i) => addDays(today(), i - (repRange === '7 days' ? 6 : 30)));
    const keyOf = (ts) => (repRange === '12 months' ? monthKey(ts) : dayKey(ts));
    const apptOf = (f) => s.appointments.find((a) => a.id === f.appointment_id);
    const decided = s.findings.filter((f) => f.status !== 'pending' && f.decided_at);
    const approvedAll = s.findings.filter((f) => f.status === 'approved' || f.status === 'done');
    const repData = buckets.map((k) => approvedAll.filter((f) => keyOf(f.decided_at || f.created_at) === k).reduce((t, f) => t + f.price_cents, 0) / 100);
    const doneVisits = s.appointments.filter((a) => a.status === 'done');
    const visitsIn = buckets.map((k) => doneVisits.filter((a) => keyOf(a.done_at || a.starts_at) === k).length);
    const repMax = Math.max(100, Math.max.apply(null, repData) * 1.1);
    const sum = (arr) => arr.reduce((t, x) => t + x, 0);
    const fmt0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
    const monthDone = doneVisits.filter((a) => monthKey(a.done_at || a.starts_at) === today().slice(0, 7));
    const apprRate = decided.length ? Math.round((approvedAll.filter((f) => f.decided_at).length / decided.length) * 100) : null;
    const apprMins = decided.length ? Math.round(decided.reduce((t, f) => t + (new Date(f.decided_at) - new Date(f.created_at)) / 60000, 0) / decided.length) : null;
    const newCust = s.customers.filter((c) => monthKey(c.created_at) === today().slice(0, 7)).length;
    const loanerDays = s.rentals.filter((r) => (r.status === 'out' || r.status === 'returned') && r.start_date && r.end_date && r.start_date.slice(0, 7) === today().slice(0, 7)).reduce((t, r) => t + Math.max(1, Math.round((new Date(r.end_date) - new Date(r.start_date)) / 864e5)), 0);
    const byJob = {}; for (const a of doneVisits) { const k = (a.job || 'Service').trim(); byJob[k] = byJob[k] || { n: 0, v: 0 }; byJob[k].n++; byJob[k].v += s.findings.filter((f) => f.appointment_id === a.id && (f.status === 'approved' || f.status === 'done')).reduce((t, f) => t + f.price_cents, 0) / 100; }
    const topJobs = Object.keys(byJob).map((k) => ({ k, ...byJob[k] })).sort((x, y) => y.n - x.n).slice(0, 5);
    const topMax = topJobs.length ? topJobs[0].n : 1;
    const techRows = s.techs.filter((t) => t.active !== false).map((t) => { const jobs = doneVisits.filter((a) => a.tech_id === t.id), fs = s.findings.filter((f) => jobs.some((a) => a.id === f.appointment_id) && f.status !== 'pending'), ok = fs.filter((f) => f.status === 'approved' || f.status === 'done'); return { k: t.name, v: String(jobs.length) + (jobs.length === 1 ? ' visit' : ' visits'), s: fs.length ? Math.round((ok.length / fs.length) * 100) + '% approval · ' + fmt0(ok.reduce((x, f) => x + f.price_cents, 0) / 100) + ' approved' : 'No estimates yet', r: '' }; });
    const reports = {
      repSub: (repRange === '12 months' ? new Date(buckets[0] + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : new Date(buckets[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })) + ' – ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' · no card payments are recorded in Revyn yet, so money figures are approved estimates',
      repTitle: 'Approved work', repRanges: ['7 days', '31 days', '12 months'].map((r) => ({ label: r, pick: () => set({ repRange: r }), style: 'padding:9px 14px;border-radius:9px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (repRange === r ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.7);') })),
      repRangeLabel: 'last ' + repRange, repTotal: fmt0(sum(repData)),
      repGrid: [0, 0.5, 1].map((f) => ({ v: f === 0 ? '0' : fmt0(Math.round((repMax * f) / 10) * 10), style: 'position:absolute;left:0;right:0;bottom:' + f * 100 + '%;height:1px;background:rgba(235,235,245,' + (f === 0 ? '.18' : '.07') + ')' + (f === 0.5 ? ';background-image:linear-gradient(90deg,rgba(235,235,245,.2) 50%,transparent 50%);background-size:6px 1px;background-color:transparent' : ''), lbl: 'position:absolute;right:0;bottom:' + f * 100 + '%;transform:translateY(50%);font-size:11px;color:rgba(235,235,245,.45)' })),
      repBars: repData.map((v, i) => ({ style: 'flex:1;border-radius:2px 2px 0 0;transition:height .5s ease;height:' + Math.max(v ? 2 : 0, Math.round((v / repMax) * 100)) + '%;background:' + (i === repData.length - 1 ? '#30d158' : 'rgba(48,209,88,.72)') })),
      repTicks: repRange === '12 months' ? buckets.filter((_, i) => i % 2 === 0).map((k, i) => ({ l: new Date(k + '-15').toLocaleDateString('en-US', { month: 'short' }), left: ((i * 2) / 12 * 100).toFixed(1) + '%' })) : repRange === '7 days' ? buckets.map((k, i) => ({ l: new Date(k + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }), left: ((i / 7) * 100).toFixed(1) + '%' })) : [0, 7, 14, 21, 28].map((i) => ({ l: String(new Date(buckets[i] + 'T12:00:00').getDate()), left: ((i / 31) * 100).toFixed(1) + '%' })),
      repLegend: [{ k: 'Visits', v: String(sum(visitsIn)) }, { k: 'Estimates', v: String(decided.filter((f) => buckets.includes(keyOf(f.decided_at))).length) }, { k: 'Avg', v: fmt0(sum(repData) / Math.max(1, repData.filter(Boolean).length)) + (repRange === '12 months' ? '/mo' : '/day') }],
      repTop: topJobs.length ? topJobs.map((t) => ({ k: t.k, v: t.n + (t.n === 1 ? ' visit' : ' visits') + (t.v ? ' · ' + fmt0(t.v) : ''), bar: 'height:100%;width:' + Math.round((t.n / topMax) * 100) + '%;background:#30d158;border-radius:2px' })) : [{ k: 'No finished visits yet', v: '', bar: 'height:100%;width:0' }],
      repTechs: techRows.length ? techRows : [{ k: 'No technicians yet', v: '', s: 'Add them on the Technicians page.', r: '' }],
      metrics: [
        { l: 'Visits today', n: String(todays.length), d: todays.filter((a) => a.status === 'done').length + ' complete', c: DIM },
        { l: 'Visits this month', n: String(monthDone.length), d: 'finished', c: DIM },
        { l: 'Approved work this month', n: fmt0(approvedAll.filter((f) => monthKey(f.decided_at || f.created_at) === today().slice(0, 7)).reduce((t, f) => t + f.price_cents, 0) / 100), d: 'from estimates in the app', c: GRN },
        { l: 'Approval rate', n: apprRate === null ? '—' : apprRate + '%', d: decided.length ? decided.length + ' decided' : 'No estimates decided yet', c: apprRate === null ? DIM : apprRate >= 70 ? GRN : YEL },
        { l: 'Average approval time', n: apprMins === null ? '—' : apprMins < 60 ? apprMins + ' min' : (apprMins / 60).toFixed(1) + ' h', d: 'from sent to tapped', c: DIM },
        { l: 'Declined value, open', n: fmt0(fuOpen.reduce((t, r) => t + r.value, 0) / 100), d: fuOpen.length + ' follow-ups', c: fuOpen.length ? YEL : DIM },
        { l: 'Customers', n: String(s.customers.length), d: newCust + ' new this month', c: DIM },
        { l: 'Loaner days this month', n: String(loanerDays), d: out.length + ' out now', c: DIM },
      ],
    };

    const schedule = {
      sub: DAY_LABEL(s.day) + ' · 5 bays · ' + dayJobs.length + (dayJobs.length === 1 ? ' job' : ' jobs'),
      nowPill: pill(ACC), nowLabel: 'Now · ' + fmtH(nowH), showNow: s.day === today() && nowH >= H0 && nowH <= H1,
      hours: HOURS.map((hr) => ({ left: hl(hr), label: hr === 12 ? '12 PM' : hr > 12 ? (hr - 12) + ' PM' : hr + ' AM' })), nowLeft: 'calc(76px + (100% - 76px) * ' + ((nowH - H0) / SPAN).toFixed(4) + ')',
      rows: schedRows, msg: s.schedMsg || (dayJobs.length ? 'Drag a job to another time or bay. The customer\u2019s phone and Today update as soon as you let go.' : 'Nothing booked for this day yet.'),
      setMinutes: (id, m) => this.setAppt(id, { minutes: m }),
    };

    return {
      loading: s.loading, err: s.err, busy: s.busy, dismissErr: () => set({ err: '' }), overview, schedule, technicians, lobby, inbox, approvals, followups, reports,
      // Customers page
      customersSub: s.customers.length + (s.customers.length === 1 ? ' customer' : ' customers') + ' · ' + activeToday.size + ' active today',
      search: s.search, setSearch: (v) => set({ search: v }),
      customers: custRows.map((c) => ({ id: c.id, initials: initials(c.name), name: c.name, vehicles: String(s.vehicles.filter((v) => v.customer_id === c.id).length), visits: String(apptsOf(c.id).filter((a) => a.status === 'done').length), last: lastVisit(c), ltv: rentalsOf(c).length + (rentalsOf(c).length === 1 ? ' loaner' : ' loaners'), open: () => set({ custId: c.id, newCust: null }), style: 'display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;align-items:center;padding:14px 12px;margin:0 -12px;border-bottom:1px solid rgba(235,235,245,.07);font-size:13.5px;cursor:pointer;border-radius:10px;' + (c.id === custId ? 'background:rgba(235,235,245,.06)' : '') })),
      noCustomers: !s.loading && !s.customers.length, noMatches: !!q && !custRows.length && !!s.customers.length,
      cust: cust ? { id: cust.id, initials: initials(cust.name), name: cust.name, meta: [fmtPhone(cust.phone), cust.city, 'Since ' + new Date(cust.created_at).getFullYear()].filter(Boolean).join(' · '), phone: cust.phone, email: cust.email, city: cust.city, notes: cust.notes || '',
        cars: custCars.map((v) => ({ id: v.id, n: vehName(v) || 'Vehicle', s: [v.plate, v.odometer ? v.odometer.toLocaleString('en-US') + ' mi' : ''].filter(Boolean).join(' · ') })),
        visitsList: custAppts.slice(0, 6).map((a) => ({ t: (a.job || 'Service') + (a.status === 'done' ? '' : ' · ' + STATUS[a.status][0]), d: relDay(a.starts_at) })),
        loaners: custRentals.slice(0, 4).map((r) => ({ t: r.number + ' · ' + ({ draft: 'Draft', sent: 'Sent', signed: 'Signed', out: 'Out', returned: 'Returned', cancelled: 'Cancelled' }[r.status] || r.status), d: relDay(r.created_at) })),
        smsHref: cust.phone ? 'sms:' + cust.phone : '', telHref: cust.phone ? 'tel:' + cust.phone : '',
        book: () => set({ newAppt: { customer_id: cust.id, vehicle_id: (custCars[0] || {}).id || '', day: s.day, time: '09:00', visit: 'dropoff', job: '' } }),
        setNotes: (v) => this.updateCustomer(cust.id, { notes: v }), message: () => set({ threadId: cust.id, goInbox: true }),
      } : null,
      editVeh: s.editVeh, setEditVeh: (v) => set({ editVeh: v }), saveVeh: () => cust && s.editVeh && this.addVehicle(cust.id, s.editVeh),
      newCust: nc, openNewCust: () => set({ newCust: { name: '', phone: '', email: '', city: '', year: '', make: '', model: '', plate: '' } }), setNewCust: (p) => set({ newCust: { ...nc, ...p } }), cancelNewCust: () => set({ newCust: null }),
      saveNewCust: async () => { const c = await this.addCustomer(nc); if (c) set({ newCust: null, custId: c.id }); },
      // Appointments page
      apptSub: dayAppts.length ? dayAppts.length + ' booked · ' + dayAppts.filter((a) => a.status === 'done').length + ' complete' : 'Nothing booked for ' + DAY_LABEL(s.day).toLowerCase(),
      apptDays: days.map((d) => ({ label: DAY_LABEL(d), pick: () => set({ day: d }), style: chip(d === s.day) })),
      dayLabel: DAY_LABEL(s.day), day: s.day, setDay: (d) => set({ day: d }),
      appts: dayAppts.map((a) => { const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id), st = STATUS[a.status] || STATUS.booked; return { id: a.id, time: fmtTime(a.starts_at), who: c ? c.name : 'Walk-in', car: vehName(v) || 'Vehicle not listed', job: a.job || 'Service', visit: VISIT[a.visit] || '', status: st[0] + (a.bay ? ' · Bay ' + a.bay : '') + (a.status === 'done' && a.pickup === 'here' ? ' · here now' : a.status === 'done' && a.pickup === 'on_way' ? ' · on the way' : ''), color: st[1], open: () => set({ selId: a.id }), style: row(a.id === selId) }; }),
      noAppts: !s.loading && !dayAppts.length,
      sel: sel ? { id: sel.id, time: fmtTime(sel.starts_at), who: selCust ? selCust.name : 'Walk-in', phone: selCust ? fmtPhone(selCust.phone) : '', car: vehName(selVeh) || 'Vehicle not listed', plate: selVeh ? selVeh.plate : '', job: sel.job || 'Service', visit: VISIT[sel.visit], status: STATUS[sel.status][0], color: STATUS[sel.status][1], notes: sel.notes || '', bay: sel.bay || '',
        next: NEXT[sel.status] ? { label: NEXT_LABEL[sel.status], go: () => this.setAppt(sel.id, { status: NEXT[sel.status] }) } : null,
        cancel: sel.status === 'booked' || sel.status === 'arrived' ? () => this.setAppt(sel.id, { status: 'cancelled' }) : null,
        noShow: sel.status === 'booked' ? () => this.setAppt(sel.id, { status: 'no_show' }) : null,
        setBay: (b) => this.setAppt(sel.id, { bay: parseInt(b, 10) || null }), setNotes: (v) => this.setAppt(sel.id, { notes: v }),
        openCustomer: selCust ? () => set({ custId: selCust.id }) : null, smsHref: selCust && selCust.phone ? 'sms:' + selCust.phone : '',
        techId: sel.tech_id || '', setTech: (id) => this.setAppt(sel.id, { tech_id: id || null }), techOpts: s.techs.filter((t) => t.active !== false).map((t) => ({ id: t.id, label: t.name + ((t.bays || []).length ? ' · Bay ' + t.bays.map((b) => '0' + b).join(', ') : '') })),
        findings: s.findings.filter((f) => f.appointment_id === sel.id).map((f) => ({ id: f.id, name: f.name, tier: { now: 'Recommended now', soon: 'Recommended soon', monitor: 'Monitor' }[f.tier] || f.tier, price: f.price_cents ? '$' + (f.price_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'No charge', status: { pending: 'Waiting for approval', approved: 'Approved', declined: 'Declined', done: 'Done' }[f.status], color: { pending: YEL, approved: GRN, declined: DIM, done: GRN }[f.status], plain: f.plain, meas: [f.meas_label, f.meas].filter(Boolean).join(' · '), remove: () => this.removeFinding(f.id), markDone: f.status === 'approved' ? () => this.setFinding(f.id, { status: 'done' }) : null, photos: s.photos.filter((p) => p.finding_id === f.id).map((p) => this.photoUrl(p)) })),
        photos: s.photos.filter((p) => p.appointment_id === sel.id).map((p) => ({ id: p.id, url: this.photoUrl(p), caption: p.caption })),
        addPhoto: (file, caption, findingId) => this.addVisitPhoto(sel.id, file, caption, findingId),
        newFinding: s.newFinding, openNewFinding: () => set({ newFinding: { tier: 'now', name: '', plain: '', meas: '', meas_label: '', urgency: '', price: '' } }), setNewFinding: (p) => set({ newFinding: { ...s.newFinding, ...p } }), cancelNewFinding: () => set({ newFinding: null }), saveNewFinding: () => s.newFinding && this.addFinding(sel.id, s.newFinding),
        pendingCount: s.findings.filter((f) => f.appointment_id === sel.id && f.status === 'pending').length,
      } : null,
      newAppt: na, openNewAppt: () => set({ newAppt: { customer_id: '', vehicle_id: '', name: '', phone: '', year: '', make: '', model: '', plate: '', day: s.day, time: '09:00', visit: 'dropoff', job: '' } }),
      setNewAppt: (p) => set({ newAppt: { ...na, ...p, ...(p.customer_id !== undefined && p.customer_id !== na.customer_id ? { vehicle_id: '' } : {}) } }), cancelNewAppt: () => set({ newAppt: null }),
      saveNewAppt: () => this.addAppt(na), newApptOk: !!na && !!(na.customer_id || na.name.trim()) && !!na.day && !!na.time,
      custOpts, naCars: naCars.map((v) => ({ id: v.id, label: vehName(v) + (v.plate ? ' · ' + v.plate : '') })), times: TIMES.map((t) => ({ v: t, label: fmtTime('2000-01-01T' + t + ':00') })),
    };
  }
}

/** Walk-in check-in from the Overview: creates (or finds by phone) the customer, the vehicle, and an
 *  appointment already in the "arrived" state with its bay. Returns an error message or ''. */
export async function checkInWalkIn(d) {
  if (!supabase) return '';
  const phone = (d.phone || '').replace(/\D/g, '');
  let cust = null;
  if (phone) { const { data } = await supabase.from('customers').select('*').eq('shop_id', SHOP_ID).eq('phone', phone).maybeSingle(); cust = data; }
  if (!cust) {
    const { data, error } = await supabase.from('customers').insert({ shop_id: SHOP_ID, name: d.name.trim(), phone }).select().single();
    if (error) return error.message; cust = data;
  }
  const parts = (d.car || '').trim().split(/\s+/), year = /^\d{4}$/.test(parts[0]) ? parseInt(parts.shift(), 10) : null;
  let veh = null;
  if (d.plate) { const { data } = await supabase.from('customer_vehicles').select('*').eq('customer_id', cust.id).eq('plate', d.plate.trim().toUpperCase()).maybeSingle(); veh = data; }
  if (!veh && (parts[0] || d.plate)) {
    const { data, error } = await supabase.from('customer_vehicles').insert({ shop_id: SHOP_ID, customer_id: cust.id, year, make: parts[0] || '', model: parts.slice(1).join(' '), plate: (d.plate || '').trim().toUpperCase(), odometer: parseInt(d.odo, 10) || null }).select().single();
    if (error) return error.message; veh = data;
  } else if (veh && d.odo) await supabase.from('customer_vehicles').update({ odometer: parseInt(d.odo, 10) || null }).eq('id', veh.id);
  const visit = { Wait: 'wait', 'Drop off': 'dropoff', Loaner: 'loaner' }[d.visit] || 'dropoff';
  const { error } = await supabase.from('appointments').insert({ shop_id: SHOP_ID, customer_id: cust.id, vehicle_id: veh ? veh.id : null, starts_at: new Date().toISOString(), job: d.service || 'Service', visit, status: 'arrived', bay: d.bay || null, notes: (d.concern || '').trim() });
  return error ? error.message : '';
}

/** Plate lookup for the check-in screen: the vehicle and its owner, if the shop has seen it before. */
export async function lookupPlate(plate) {
  if (!supabase) return null;
  const { data: v } = await supabase.from('customer_vehicles').select('*').eq('shop_id', SHOP_ID).eq('plate', plate.trim().toUpperCase()).maybeSingle();
  if (!v) return null;
  const [{ data: c }, { count }] = await Promise.all([supabase.from('customers').select('*').eq('id', v.customer_id).maybeSingle(), supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('vehicle_id', v.id).eq('status', 'done')]);
  return { name: vehName(v) || 'Vehicle on file', sub: [v.plate, v.odometer ? v.odometer.toLocaleString('en-US') + ' mi' : '', count ? 'serviced here ' + count + (count === 1 ? ' time' : ' times') : 'new to the shop'].filter(Boolean).join(' · '), customer: c };
}
