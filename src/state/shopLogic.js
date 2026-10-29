// View-model for the live Customers and Appointments pages (real records in Supabase).
// Without a backend it runs on a few in-memory rows so the screens can be reviewed.
import { DCLogic } from '../runtime/logic.js';
import { supabase, SHOP_ID, SUPABASE_URL } from './supabase.js';

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
  rentals: [{ id: 'r1', number: 'LN-3107', customer_id: 'c2', customer_name: 'Dale Christensen', status: 'out', start_date: today(), end_date: addDays(today(), 1), vehicle_id: 'lv1' }], loanerFleet: [{ id: 'lv1', year: 2027, make: 'Tesla', model: 'Model 3', status: 'out' }],
};

export class ShopLogic extends DCLogic {
  state = { drag: null, schedMsg: '', findings: [], photos: [], newFinding: null, customers: [], vehicles: [], appointments: [], rentals: [], loanerFleet: [], loading: !!supabase, err: '', day: today(), selId: null, custId: null, newAppt: null, newCust: null, search: '', busy: false, editVeh: null };

  async componentDidMount() {
    if (!supabase) { this.setState({ ...DEMO, loading: false }); return; }
    await this.reload();
    this.chan = supabase.channel('shop:' + SHOP_ID);
    for (const t of ['customers', 'customer_vehicles', 'appointments', 'findings', 'visit_photos']) this.chan.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => this.reload());
    this.chan.subscribe();
  }
  componentWillUnmount() { if (this.chan) supabase.removeChannel(this.chan); }

  async reload() {
    const [c, v, a, r, lf, fi, ph] = await Promise.all([
      supabase.from('customers').select('*').eq('shop_id', SHOP_ID).order('name'),
      supabase.from('customer_vehicles').select('*').eq('shop_id', SHOP_ID).order('created_at'),
      supabase.from('appointments').select('*').eq('shop_id', SHOP_ID).gte('starts_at', addDays(today(), -60)).order('starts_at'),
      supabase.from('loaner_vehicles').select('id,year,make,model,color,status').eq('shop_id', SHOP_ID).neq('status', 'retired'),
      supabase.from('findings').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -60)).order('created_at'),
      supabase.from('visit_photos').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -60)).order('created_at'),
      supabase.from('rentals').select('id,number,customer_id,customer_name,customer_phone,status,start_date,end_date,vehicle_id,created_at').eq('shop_id', SHOP_ID).order('created_at', { ascending: false }).limit(300),
    ]);
    const bad = c.error || v.error || a.error;
    if (bad) return this.setState({ loading: false, err: /does not exist|schema cache/.test(bad.message) ? 'Customers and appointments need the 0009 migration run in Supabase.' : bad.message });
    this.setState({ customers: c.data, vehicles: v.data, appointments: a.data, rentals: r.data || [], loanerFleet: lf.data || [], findings: fi.data || [], photos: ph.data || [], loading: false, err: '' });
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
      return { bay: 'Bay 0' + bay, open: !a, car: a ? vehName(v) || 'Vehicle' : 'Open', who: a ? (c ? c.name : 'Walk-in') + ' · ' + (a.job || 'Service') : 'Nothing assigned', status: a ? st[0] : '', color: a ? st[1] : 'rgba(235,235,245,.3)', pctLabel: a ? pct + '%' : '—', eta: a ? fmtTime(a.starts_at) : '',
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
    const schedRows = lanes.map((bay) => ({ bay: bay ? 'Bay 0' + bay : 'Unassigned', tech: bay ? '' : 'Drag into a bay', blocks: dayJobs.filter((a) => (a.bay || 0) === bay).map((a) => {
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
    const schedule = {
      sub: DAY_LABEL(s.day) + ' · 5 bays · ' + dayJobs.length + (dayJobs.length === 1 ? ' job' : ' jobs'),
      nowPill: pill(ACC), nowLabel: 'Now · ' + fmtH(nowH), showNow: s.day === today() && nowH >= H0 && nowH <= H1,
      hours: HOURS.map((hr) => ({ left: hl(hr), label: hr === 12 ? '12 PM' : hr > 12 ? (hr - 12) + ' PM' : hr + ' AM' })), nowLeft: 'calc(76px + (100% - 76px) * ' + ((nowH - H0) / SPAN).toFixed(4) + ')',
      rows: schedRows, msg: s.schedMsg || (dayJobs.length ? 'Drag a job to another time or bay. The customer\u2019s phone and Today update as soon as you let go.' : 'Nothing booked for this day yet.'),
      setMinutes: (id, m) => this.setAppt(id, { minutes: m }),
    };

    return {
      loading: s.loading, err: s.err, busy: s.busy, dismissErr: () => set({ err: '' }), overview, schedule,
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
        setNotes: (v) => this.updateCustomer(cust.id, { notes: v }),
      } : null,
      editVeh: s.editVeh, setEditVeh: (v) => set({ editVeh: v }), saveVeh: () => cust && s.editVeh && this.addVehicle(cust.id, s.editVeh),
      newCust: nc, openNewCust: () => set({ newCust: { name: '', phone: '', email: '', city: '', year: '', make: '', model: '', plate: '' } }), setNewCust: (p) => set({ newCust: { ...nc, ...p } }), cancelNewCust: () => set({ newCust: null }),
      saveNewCust: async () => { const c = await this.addCustomer(nc); if (c) set({ newCust: null, custId: c.id }); },
      // Appointments page
      apptSub: dayAppts.length ? dayAppts.length + ' booked · ' + dayAppts.filter((a) => a.status === 'done').length + ' complete' : 'Nothing booked for ' + DAY_LABEL(s.day).toLowerCase(),
      apptDays: days.map((d) => ({ label: DAY_LABEL(d), pick: () => set({ day: d }), style: chip(d === s.day) })),
      dayLabel: DAY_LABEL(s.day), day: s.day, setDay: (d) => set({ day: d }),
      appts: dayAppts.map((a) => { const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id), st = STATUS[a.status] || STATUS.booked; return { id: a.id, time: fmtTime(a.starts_at), who: c ? c.name : 'Walk-in', car: vehName(v) || 'Vehicle not listed', job: a.job || 'Service', visit: VISIT[a.visit] || '', status: st[0] + (a.bay ? ' · Bay ' + a.bay : ''), color: st[1], open: () => set({ selId: a.id }), style: row(a.id === selId) }; }),
      noAppts: !s.loading && !dayAppts.length,
      sel: sel ? { id: sel.id, time: fmtTime(sel.starts_at), who: selCust ? selCust.name : 'Walk-in', phone: selCust ? fmtPhone(selCust.phone) : '', car: vehName(selVeh) || 'Vehicle not listed', plate: selVeh ? selVeh.plate : '', job: sel.job || 'Service', visit: VISIT[sel.visit], status: STATUS[sel.status][0], color: STATUS[sel.status][1], notes: sel.notes || '', bay: sel.bay || '',
        next: NEXT[sel.status] ? { label: NEXT_LABEL[sel.status], go: () => this.setAppt(sel.id, { status: NEXT[sel.status] }) } : null,
        cancel: sel.status === 'booked' || sel.status === 'arrived' ? () => this.setAppt(sel.id, { status: 'cancelled' }) : null,
        noShow: sel.status === 'booked' ? () => this.setAppt(sel.id, { status: 'no_show' }) : null,
        setBay: (b) => this.setAppt(sel.id, { bay: parseInt(b, 10) || null }), setNotes: (v) => this.setAppt(sel.id, { notes: v }),
        openCustomer: selCust ? () => set({ custId: selCust.id }) : null, smsHref: selCust && selCust.phone ? 'sms:' + selCust.phone : '',
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
