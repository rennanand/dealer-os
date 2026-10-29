// View-model for the live Customers and Appointments pages (real records in Supabase).
// Without a backend it runs on a few in-memory rows so the screens can be reviewed.
import { DCLogic } from '../runtime/logic.js';
import { supabase, SHOP_ID } from './supabase.js';

const ACC = '#e0312b', GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';
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
  appointments: [{ id: 'a1', customer_id: 'c1', vehicle_id: 'v1', starts_at: today() + 'T10:30:00', job: 'Tire replacement', visit: 'wait', status: 'booked' }, { id: 'a2', customer_id: 'c2', vehicle_id: 'v2', starts_at: today() + 'T08:00:00', job: 'Plugs + coils', visit: 'dropoff', status: 'done' }],
};

export class ShopLogic extends DCLogic {
  state = { customers: [], vehicles: [], appointments: [], rentals: [], loading: !!supabase, err: '', day: today(), selId: null, custId: null, newAppt: null, newCust: null, search: '', busy: false, editVeh: null };

  async componentDidMount() {
    if (!supabase) { this.setState({ ...DEMO, loading: false }); return; }
    await this.reload();
    this.chan = supabase.channel('shop:' + SHOP_ID);
    for (const t of ['customers', 'customer_vehicles', 'appointments']) this.chan.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => this.reload());
    this.chan.subscribe();
  }
  componentWillUnmount() { if (this.chan) supabase.removeChannel(this.chan); }

  async reload() {
    const [c, v, a, r] = await Promise.all([
      supabase.from('customers').select('*').eq('shop_id', SHOP_ID).order('name'),
      supabase.from('customer_vehicles').select('*').eq('shop_id', SHOP_ID).order('created_at'),
      supabase.from('appointments').select('*').eq('shop_id', SHOP_ID).gte('starts_at', addDays(today(), -60)).order('starts_at'),
      supabase.from('rentals').select('id,number,customer_id,customer_name,customer_phone,status,start_date,created_at').eq('shop_id', SHOP_ID).order('created_at', { ascending: false }).limit(300),
    ]);
    const bad = c.error || v.error || a.error;
    if (bad) return this.setState({ loading: false, err: /does not exist|schema cache/.test(bad.message) ? 'Customers and appointments need the 0009 migration run in Supabase.' : bad.message });
    this.setState({ customers: c.data, vehicles: v.data, appointments: a.data, rentals: r.data || [], loading: false, err: '' });
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

    return {
      loading: s.loading, err: s.err, busy: s.busy, dismissErr: () => set({ err: '' }),
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
      } : null,
      newAppt: na, openNewAppt: () => set({ newAppt: { customer_id: '', vehicle_id: '', name: '', phone: '', year: '', make: '', model: '', plate: '', day: s.day, time: '09:00', visit: 'dropoff', job: '' } }),
      setNewAppt: (p) => set({ newAppt: { ...na, ...p, ...(p.customer_id !== undefined && p.customer_id !== na.customer_id ? { vehicle_id: '' } : {}) } }), cancelNewAppt: () => set({ newAppt: null }),
      saveNewAppt: () => this.addAppt(na), newApptOk: !!na && !!(na.customer_id || na.name.trim()) && !!na.day && !!na.time,
      custOpts, naCars: naCars.map((v) => ({ id: v.id, label: vehName(v) + (v.plate ? ' · ' + v.plate : '') })), times: TIMES.map((t) => ({ v: t, label: fmtTime('2000-01-01T' + t + ':00') })),
    };
  }
}
