// View-model for the live Customers and Appointments pages (real records in Supabase).
// Without a backend it runs on a few in-memory rows so the screens can be reviewed.
import { DCLogic } from '../runtime/logic.js';
import { supabase, SHOP_ID, SUPABASE_URL } from './supabase.js';
import { RULER, PILL_L } from './appLogic.js';
import { jobMethods, jobVals } from './shop/jobs.js';
import { partMethods, partVals } from './shop/parts.js';
import { moneyMethods, moneyVals, invoicePayVals } from './shop/money.js';
import { commsMethods, commsVals } from './shop/comms.js';
import { calendarMethods, calendarVals, waitlistMethods } from './shop/calendar.js';
import { dviMethods, dviVals, reportVals } from './shop/dvi.js';
import { fleetMethods, fleetVals } from './shop/fleet.js';
import { marketingMethods, marketingVals } from './shop/marketing.js';

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
  shop: { shop_id: 'ryguys', name: 'RyGuys Tire & Auto Sales', phone: '4355550100', tax_rate_bp: 725, labor_rate_cents: 12500, shop_supplies_bp: 0, labor_rates: [{ name: 'Standard', cents: 12500 }, { name: 'Diagnostic', cents: 14500 }], parts_matrix: [{ upto_cents: 500, markup_pct: 150 }, { upto_cents: 2500, markup_pct: 100 }, { upto_cents: 10000, markup_pct: 65 }, { upto_cents: 50000, markup_pct: 40 }, { upto_cents: 0, markup_pct: 25 }], estimate_note: 'Prices include labor and parts. Tax and shop supplies are added on the invoice.', open_days: [1, 2, 4, 5], open_from: '08:00', open_to: '17:30', permissions: { advisor: { discount: true, void: false, refund: false, parts_cost: true, reports: true, settings: false, payments: true, delete_customer: false, edit_paid: false }, tech: { discount: false, void: false, refund: false, parts_cost: false, reports: false, settings: false, payments: false, delete_customer: false, edit_paid: false } } },
  cannedJobs: [
    { id: 'cj1', name: 'Oil change · full synthetic', category: 'Maintenance', plain: 'Full synthetic oil and filter replaced, fluids topped off, tire pressure set.', hours: 0.5, sort: 11, uses: 48, lines: [{ kind: 'labor', description: 'Oil change · full synthetic', qty: 0.5, unit_cents: 12500 }, { kind: 'part', description: 'Engine oil · 5 qt full synthetic', qty: 1, unit_cents: 5495, cost_cents: 3400 }, { kind: 'part', description: 'Oil filter', qty: 1, unit_cents: 1295, cost_cents: 600 }] },
    { id: 'cj2', name: 'Front brake pads & rotors', category: 'Brakes', plain: 'Front pads and rotors replaced, caliper slides serviced, brakes bedded in.', hours: 1.8, sort: 30, uses: 21, lines: [{ kind: 'labor', description: 'Front brake pads & rotors', qty: 1.8, unit_cents: 12500 }, { kind: 'part', description: 'Front brake pads · ceramic', qty: 1, unit_cents: 8995, cost_cents: 4500 }, { kind: 'part', description: 'Front rotors', qty: 2, unit_cents: 7995, cost_cents: 4200 }] },
    { id: 'cj3', name: 'Tire rotation', category: 'Tires', plain: 'All four tires rotated and torqued, pressures set.', hours: 0.5, sort: 20, uses: 60, lines: [{ kind: 'labor', description: 'Tire rotation', qty: 0.5, unit_cents: 12500 }] },
    { id: 'cj4', name: 'Battery replacement', category: 'Electrical', plain: 'Battery tested, replaced, terminals cleaned, charging system checked.', hours: 0.4, sort: 40, uses: 9, lines: [{ kind: 'labor', description: 'Battery replacement', qty: 0.4, unit_cents: 12500 }, { kind: 'part', description: 'Battery · group size to fit', qty: 1, unit_cents: 21995, cost_cents: 14500 }, { kind: 'fee', description: 'Core charge (refunded on return)', qty: 1, unit_cents: 2200 }] },
    { id: 'cj5', name: 'Check engine light diagnosis', category: 'Diagnostic', plain: 'Codes read, freeze frame reviewed, cause pinpointed; repair quoted separately.', hours: 1, sort: 60, uses: 14, lines: [{ kind: 'labor', description: 'Check engine light diagnosis', qty: 1, unit_cents: 14500 }] },
    { id: 'cj6', name: 'Wheel alignment · 4 wheel', category: 'Tires', plain: 'All four wheels aligned to factory specification; printout included.', hours: 1, sort: 23, uses: 17, lines: [{ kind: 'labor', description: 'Wheel alignment · 4 wheel', qty: 1, unit_cents: 12500 }] },
  ],
  parts: [{ id: 'p1', part_number: 'PH7317', name: 'Oil filter', brand: 'Fram', vendor: "O'Reilly", category: 'Filters', bin: 'A3', qty_on_hand: 14, qty_min: 6, cost_cents: 600, price_cents: 1295, taxable: true, is_tire: false, dots: [] }, { id: 'p2', part_number: '5W30-5Q', name: 'Full synthetic 5W-30 · 5 qt', brand: 'Valvoline', vendor: 'NAPA', category: 'Fluids', bin: 'Rack 1', qty_on_hand: 3, qty_min: 4, cost_cents: 3400, price_cents: 5495, taxable: true, is_tire: false, dots: [] }, { id: 'p3', part_number: '265/70R17', name: 'Defender LTX M/S', brand: 'Michelin', vendor: 'ATD', category: 'Tires', bin: 'Tire rack', qty_on_hand: 4, qty_min: 0, cost_cents: 18900, price_cents: 24900, taxable: true, is_tire: true, tire_size: '265/70R17', dots: ['2426', '2426', '2526', '2526'] }],
  pos: [], poLines: [], returns: [], payments: [], drawers: [], credits: [], payLinks: [], sms: [], blocks: [],
  smsTemplates: [{ id: 'tp1', key: 'confirmation', name: 'Booking confirmation', body: 'Hi {first}, this is {shop}. You are booked for {service} on {when}. Reply C to confirm or call {phone} to change it.', sort: 10 }, { id: 'tp2', key: 'reminder', name: 'Day-before reminder', body: 'Hi {first}, a reminder from {shop}: {vehicle} is booked for {service} tomorrow at {time}. Reply C to confirm.', sort: 20 }, { id: 'tp3', key: 'estimate', name: 'Estimate ready', body: 'Hi {first}, your estimate from {shop} is ready. Review and approve here: {link}', sort: 30 }, { id: 'tp4', key: 'ready', name: 'Vehicle ready', body: 'Hi {first}, your {vehicle} is ready at {shop}. Your total is {total}. Pay here or at the counter: {link}', sort: 40 }, { id: 'tp5', key: 'thank_you', name: 'Thank you', body: 'Thanks for visiting {shop}, {first}. If anything is not right, reply here and we will take care of it.', sort: 50 }, { id: 'tp6', key: 'pay', name: 'Text to pay', body: 'Hi {first}, your invoice from {shop} is {total}. Pay here: {link}', sort: 80 }],
  inspTemplates: [{ id: 'it1', name: 'Multi-point inspection', is_default: true, sort: 10, items: [['tires', 'Tires', 'Tread 32nds', 'Inspect tread depth, wear pattern, sidewalls, pressure'], ['brakes', 'Brakes', 'Pad mm', 'Pads, rotors, lines, fluid'], ['battery', 'Battery', 'Volts / CCA', 'Terminals, hold-down, load test'], ['fluids', 'Fluids', 'Level', 'Oil, coolant, brake, power steering, washer'], ['filters', 'Filters', 'Condition', 'Engine air, cabin air'], ['belts', 'Belts & hoses', 'Condition', 'Cracks, glazing, leaks'], ['lights', 'Lights & wipers', 'Condition', 'All exterior lights, wiper blades'], ['suspension', 'Steering & suspension', 'Condition', 'Shocks, struts, tie rods, bushings'], ['exhaust', 'Exhaust & underbody', 'Condition', 'Leaks, hangers, rust']].map(([key, label, measLabel, hint]) => ({ key, label, measLabel, hint })) }, { id: 'it2', name: 'Tire & brake check', is_default: false, sort: 20, items: [['lf', 'Left front tire', '32nds'], ['rf', 'Right front tire', '32nds'], ['lr', 'Left rear tire', '32nds'], ['rr', 'Right rear tire', '32nds'], ['fpads', 'Front brake pads', 'mm'], ['rpads', 'Rear brake pads', 'mm']].map(([key, label, measLabel]) => ({ key, label, measLabel, hint: '' })) }],
  config: { sms: false, stripe: false, partstech: false, email: false }, role: 'owner', activity: [], fleets: [{ id: 'fl1', name: 'Skyline Plumbing', contact: 'Jordan', phone: '4355550123', email: 'office@skylineplumbing.com', po_required: true, terms_days: 30, parts_discount_pct: 10, notes: '' }], campaigns: [], waitlist: [], emails: [],
};

export class ShopLogic extends DCLogic {
  state = { drag: null, schedMsg: '', findings: [], photos: [], newFinding: null, estId: null, fuTab: 'Open', fuNote: '', repRange: '31 days', quotes: [], tqVisit: null, tqDraft: null, techs: [], newTech: null, editTech: null, messages: [], threadId: null, reply: '', customers: [], vehicles: [], appointments: [], rentals: [], loanerFleet: [], loading: !!supabase, err: '', day: today(), selId: null, custId: null, newAppt: null, newCust: null, search: '', busy: false, editVeh: null };

  async componentDidMount() {
    if (!supabase) { this.setState({ ...DEMO, loading: false }); return; }
    await this.reload();
    this.chan = supabase.channel('shop:' + SHOP_ID);
    for (const t of ['customers', 'customer_vehicles', 'appointments', 'findings', 'visit_photos', 'technicians', 'messages', 'tire_quotes', 'repair_orders', 'ro_lines', 'payments', 'parts', 'purchase_orders', 'sms_messages', 'blocked_time', 'canned_jobs']) this.chan.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => this.reload());
    this.chan.subscribe();
  }
  componentWillUnmount() { if (this.chan) supabase.removeChannel(this.chan); }

  async reload() {
    const [c, v, a, lf, fi, ph, te, sh, ms, tq, r, ro, rl, tm, ins, rem, tmm, cj, pt, po, pl, prt, pay, dr, cr, pk, sm, st, bt, it, cfg, au, rl2, al, fl, cp, wl, em] = await Promise.all([
      supabase.from('customers').select('*').eq('shop_id', SHOP_ID).order('name'),
      supabase.from('customer_vehicles').select('*').eq('shop_id', SHOP_ID).order('created_at'),
      supabase.from('appointments').select('*').eq('shop_id', SHOP_ID).gte('starts_at', addDays(today(), -60)).order('starts_at'),
      supabase.from('loaner_vehicles').select('id,year,make,model,color,status').eq('shop_id', SHOP_ID).neq('status', 'retired'),
      supabase.from('findings').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -60)).order('created_at'),
      supabase.from('visit_photos').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -60)).order('created_at'),
      supabase.from('technicians').select('*').eq('shop_id', SHOP_ID).order('created_at'),
      supabase.from('shops').select('*').eq('shop_id', SHOP_ID).maybeSingle(),
      supabase.from('messages').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -90)).order('created_at'),
      supabase.from('tire_quotes').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -90)).order('created_at', { ascending: false }),
      supabase.from('rentals').select('id,number,customer_id,customer_name,customer_phone,status,start_date,end_date,vehicle_id,created_at').eq('shop_id', SHOP_ID).order('created_at', { ascending: false }).limit(300),
      supabase.from('repair_orders').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -120)),
      supabase.from('ro_lines').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -120)).order('sort').order('created_at'),
      supabase.from('time_entries').select('*').eq('shop_id', SHOP_ID).gte('started_at', addDays(today(), -120)),
      supabase.from('inspections').select('*').eq('shop_id', SHOP_ID).gte('updated_at', addDays(today(), -60)),
      supabase.rpc('shop_reminders'),
      supabase.from('team').select('*').eq('shop_id', SHOP_ID),
      supabase.from('canned_jobs').select('*').eq('shop_id', SHOP_ID).order('sort'),
      supabase.from('parts').select('*').eq('shop_id', SHOP_ID).order('name'),
      supabase.from('purchase_orders').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -180)).order('created_at', { ascending: false }),
      supabase.from('po_lines').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -180)),
      supabase.from('part_returns').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -180)),
      supabase.from('payments').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -120)).order('created_at'),
      supabase.from('drawer_sessions').select('*').eq('shop_id', SHOP_ID).gte('opened_at', addDays(today(), -30)).order('opened_at'),
      supabase.from('customer_credits').select('*').eq('shop_id', SHOP_ID).order('created_at'),
      supabase.from('pay_links').select('*').eq('shop_id', SHOP_ID).eq('status', 'open'),
      supabase.from('sms_messages').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -90)).order('created_at'),
      supabase.from('sms_templates').select('*').eq('shop_id', SHOP_ID).order('sort'),
      supabase.from('blocked_time').select('*').eq('shop_id', SHOP_ID).gte('starts_at', addDays(today(), -14)).order('starts_at'),
      supabase.from('inspection_templates').select('*').eq('shop_id', SHOP_ID).order('sort'),
      supabase.rpc('integrations', { p_shop: SHOP_ID }),
      supabase.from('authorizations').select('id,appointment_id,kind,name,amount_cents,created_at').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -120)),
      supabase.rpc('my_role', { p_shop: SHOP_ID }),
      supabase.from('audit_log').select('id,who,action,entity,entity_id,ref,summary,created_at').eq('shop_id', SHOP_ID).order('id', { ascending: false }).limit(400),
      supabase.from('fleets').select('*').eq('shop_id', SHOP_ID).order('name'),
      supabase.from('campaigns').select('*').eq('shop_id', SHOP_ID).order('created_at', { ascending: false }).limit(100),
      supabase.from('waitlist').select('*').eq('shop_id', SHOP_ID).in('status', ['waiting', 'offered']).order('created_at'),
      supabase.from('emails').select('id,customer_id,to_email,subject,kind,status,ref_id,created_at').eq('shop_id', SHOP_ID).order('created_at', { ascending: false }).limit(100),
    ]);
    const bad = c.error || v.error || a.error;
    if (bad) return this.setState({ loading: false, err: /does not exist|schema cache/.test(bad.message) ? 'Customers and appointments need the 0009 migration run in Supabase.' : bad.message });
    const arr = (x) => (x && Array.isArray(x.data) ? x.data : []);
    this.setState({ customers: arr(c), vehicles: arr(v), appointments: arr(a), rentals: arr(r), loanerFleet: arr(lf), findings: arr(fi), photos: arr(ph), techs: arr(te), shop: (sh && sh.data) || null, messages: arr(ms), quotes: arr(tq), ros: arr(ro), roLines: arr(rl), timeEntries: arr(tm), inspections: arr(ins), reminders: arr(rem), team: arr(tmm),
      cannedJobs: arr(cj), parts: arr(pt), pos: arr(po), poLines: arr(pl), returns: arr(prt), payments: arr(pay), drawers: arr(dr), credits: arr(cr), payLinks: arr(pk), sms: arr(sm), smsTemplates: arr(st), blocks: arr(bt), inspTemplates: arr(it), config: (cfg && cfg.data) || this.state.config || {}, authorizations: arr(au), role: (rl2 && rl2.data) || this.state.role || '', activity: arr(al), fleets: arr(fl), campaigns: arr(cp), waitlist: arr(wl), emails: arr(em), loading: false, err: '' });
  }

  // ---- customers ----
  async addCustomer(d) {
    const row = { name: d.name.trim(), phone: d.phone.replace(/\D/g, ''), email: (d.email || '').trim(), city: (d.city || '').trim() };
    if (!row.name) return;
    let cust;
    const same = row.phone.length === 10 ? this.state.customers.find((c) => c.phone === row.phone) : null;
    if (same && !d.force) { this.setState({ fuNote: same.name + ' already has this number — using that record.' }); if ((d.make || d.model || d.year) && !this.state.vehicles.some((v) => v.customer_id === same.id && (v.plate === (d.plate || '').toUpperCase() || (v.make || '').toLowerCase() === (d.make || '').toLowerCase() && (v.model || '').toLowerCase() === (d.model || '').toLowerCase()))) await this.addVehicle(same.id, d); return same; }
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
    const row = { customer_id, year: parseInt(d.year, 10) || null, make: (d.make || '').trim(), model: (d.model || '').trim(), plate: (d.plate || '').trim().toUpperCase(), odometer: parseInt(String(d.odometer || '').replace(/\D/g, ''), 10) || null, vin: (d.vin || '').trim().toUpperCase(), color: (d.color || '').trim(), trim: d.trim || '', engine: d.engine || '', body: d.body || '', drive: d.drive || '', fuel: d.fuel || '' };
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
    if (d.waitlist_id) await this.setWaitlist(d.waitlist_id, 'booked');
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
  // ---- import (migrating a shop) ----
  async previewImport(file) {
    const { buildImport, buildHistoryImport, looksLikeHistory, parseCsv } = await import('./importCsv.js');
    const text = await file.text();
    const headers = (parseCsv(text)[0] || []);
    if (looksLikeHistory(headers)) {   // a repair-order export: visits, invoices and declined work
      const { visits, map } = buildHistoryImport(text);
      const total = visits.reduce((t, v) => t + (parseFloat(v.total) || 0), 0), declined = visits.reduce((t, v) => t + v.declined.length, 0);
      this.setState({ importPreview: { kind: 'history', file: file.name, visits, count: visits.length, total, declined, withPhone: visits.filter((v) => v.phone).length, mapped: Object.keys(map), missing: ['name', 'total'].filter((k) => map[k] === undefined && !(k === 'name' && map.first !== undefined)), result: null, busy: false } });
      return;
    }
    const { customers, map } = buildImport(text);
    const vehicles = customers.reduce((n, c) => n + c.vehicles.length, 0);
    const missing = ['name', 'phone', 'make'].filter((k) => map[k] === undefined && !(k === 'name' && map.first !== undefined));
    this.setState({ importPreview: { kind: 'customers', file: file.name, customers, count: customers.length, vehicles, withPhone: customers.filter((c) => c.phone).length, mapped: Object.keys(map), missing, result: null, busy: false } });
  }
  async runImport() {
    const p = this.state.importPreview; if (!p || p.busy) return;
    this.setState({ importPreview: { ...p, busy: true } });
    const source = /tekmetric/i.test(p.file) ? 'tekmetric' : 'csv';
    if (p.kind === 'history') {
      if (!supabase) { this.setState({ importPreview: { ...p, busy: false, result: { visits: p.count, declined: p.declined, skipped: 0 } } }); return; }
      let totals = { visits: 0, declined: 0, skipped: 0 };
      for (let i = 0; i < p.visits.length; i += 100) {
        const { data, error } = await supabase.rpc('import_history', { p_rows: p.visits.slice(i, i + 100), p_source: source });
        if (error) { this.setState({ importPreview: { ...p, busy: false }, err: error.message }); return; }
        for (const k of Object.keys(totals)) totals[k] += (data && data[k]) || 0;
      }
      await this.reload();
      this.setState({ importPreview: { ...p, busy: false, result: totals } });
      return;
    }
    if (!supabase) { this.setState({ importPreview: { ...p, busy: false, result: { customers_new: p.count, customers_updated: 0, vehicles_new: p.vehicles, vehicles_updated: 0 } } }); return; }
    let totals = { customers_new: 0, customers_updated: 0, vehicles_new: 0, vehicles_updated: 0 };
    for (let i = 0; i < p.customers.length; i += 200) {  // batches keep each call small
      const { data, error } = await supabase.rpc('import_customers', { p_rows: p.customers.slice(i, i + 200), p_source: source });
      if (error) { this.setState({ importPreview: { ...p, busy: false }, err: error.message }); return; }
      for (const k of Object.keys(totals)) totals[k] += (data && data[k]) || 0;
    }
    await this.reload();
    this.setState({ importPreview: { ...p, busy: false, result: totals } });
  }
  // ---- duplicates ----
  async loadDuplicates() {
    if (!supabase) { const by = {}; for (const c of this.state.customers) if (c.phone) (by[c.phone] = by[c.phone] || []).push(c); this.setState({ dups: Object.keys(by).filter((k) => by[k].length > 1).map((k) => ({ key: k, kind: 'phone', rows: by[k].map((c) => ({ id: c.id, name: c.name, phone: c.phone, vehicles: this.state.vehicles.filter((v) => v.customer_id === c.id).length, visits: this.state.appointments.filter((a) => a.customer_id === c.id).length, created_at: c.created_at })) })) }); return; }
    const { data, error } = await supabase.rpc('duplicate_customers', { p_shop: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    this.setState({ dups: data || [] });
  }
  async mergeCustomers(keep, drop) {
    if (!supabase) { this.setState({ customers: this.state.customers.filter((c) => c.id !== drop), vehicles: this.state.vehicles.map((v) => (v.customer_id === drop ? { ...v, customer_id: keep } : v)), appointments: this.state.appointments.map((a) => (a.customer_id === drop ? { ...a, customer_id: keep } : a)) }); await this.loadDuplicates(); return; }
    const { error } = await supabase.rpc('merge_customers', { p_keep: keep, p_drop: drop });
    if (error) return this.setState({ err: error.message });
    await this.reload(); await this.loadDuplicates();
  }
  /** Who already has this number / plate / VIN? Used before creating a customer at the desk. */
  async findExisting(q) {
    const phone = (q.phone || '').replace(/\D/g, '');
    if (!supabase) { const hit = this.state.customers.filter((c) => (phone.length >= 7 && c.phone.endsWith(phone.slice(-7))) || (q.plate && this.state.vehicles.some((v) => v.customer_id === c.id && v.plate === q.plate.toUpperCase()))); return hit.map((c) => ({ id: c.id, name: c.name, phone: c.phone, vehicle: vehName(this.state.vehicles.find((v) => v.customer_id === c.id)) })); }
    if (phone.length < 7 && !q.plate && !(q.vin && q.vin.length >= 11)) return [];
    const { data } = await supabase.rpc('find_customer', { p_shop: SHOP_ID, p_phone: phone, p_plate: q.plate || '', p_vin: q.vin || '' });
    return data || [];
  }
  async markInvited(id) {
    this.setState({ customers: this.state.customers.map((c) => (c.id === id ? { ...c, invited_at: new Date().toISOString() } : c)) });
    if (supabase) await supabase.rpc('mark_invited', { p_customer: id });
  }

  // ---- repair orders (billing) ----
  async ensureRO(apptId) {
    const have = (this.state.ros || []).find((r) => r.appointment_id === apptId); if (have) return have.id;
    if (!supabase) { const r = { id: 'ro' + Date.now(), appointment_id: apptId, number: (this.state.ros || []).length + 1001, status: 'open', tax_rate_bp: 725, created_at: new Date().toISOString() }; this.setState({ ros: (this.state.ros || []).concat(r) }); return r.id; }
    const { data, error } = await supabase.rpc('ensure_ro', { p_appointment: apptId });
    if (error) { this.setState({ err: error.message }); return null; }
    await this.reloadRO(); return data;
  }
  async reloadRO() {
    if (!supabase) return;
    const [ro, rl] = await Promise.all([supabase.from('repair_orders').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -90)), supabase.from('ro_lines').select('*').eq('shop_id', SHOP_ID).gte('created_at', addDays(today(), -90)).order('sort').order('created_at')]);
    this.setState({ ros: Array.isArray(ro.data) ? ro.data : this.state.ros, roLines: Array.isArray(rl.data) ? rl.data : this.state.roLines });
  }
  async addLine(apptId, d) {
    const roId = await this.ensureRO(apptId); if (!roId) return;
    const row = { ro_id: roId, kind: d.kind || 'labor', description: (d.description || '').trim(), qty: Number(d.qty) || 1, unit_cents: Math.round((parseFloat(String(d.unit || '').replace(/[^0-9.]/g, '')) || 0) * 100), cost_cents: d.kind === 'part' ? Math.round((parseFloat(String(d.cost || '').replace(/[^0-9.]/g, '')) || 0) * 100) : 0, part_number: d.kind === 'part' ? (d.part_number || '').trim() : '', vendor: d.kind === 'part' ? (d.vendor || '').trim() : '', taxable: d.kind !== 'discount', sort: d.kind === 'labor' ? 100 : d.kind === 'part' ? 200 : 300, part_id: d.kind === 'part' ? d.part_id || null : null, status: d.kind === 'part' ? (d.part_id ? '' : 'need') : '', warranty: !!d.warranty };
    if (row.warranty) row.unit_cents = 0;
    if (!row.description) return;
    if (!supabase) { this.setState({ roLines: (this.state.roLines || []).concat({ id: 'l' + Date.now(), approved: true, created_at: new Date().toISOString(), ...row }), newLine: null }); return; }
    const { error } = await supabase.from('ro_lines').insert({ ...row, shop_id: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    this.setState({ newLine: null }); await this.reloadRO();
  }
  async setPO(roId, po) {
    this.setState({ ros: (this.state.ros || []).map((r) => (r.id === roId ? { ...r, po_number: po } : r)) });
    if (supabase) await supabase.from('repair_orders').update({ po_number: (po || '').trim() }).eq('id', roId);
  }
  async emailReceipt(roId, to) {
    if (!supabase) return this.setState({ payNote: 'Receipt would be emailed' + (to ? ' to ' + to : '') + '.' });
    const { error } = await supabase.rpc('email_receipt', { p_ro: roId, p_to: to || '' });
    this.setState({ payNote: error ? error.message : 'Receipt emailed' + (this.state.config && this.state.config.email ? '.' : ' — it waits in Settings · Integrations until email is connected.') });
    if (error) this.setState({ err: error.message });
  }
  async removeLine(id) {
    this.setState({ roLines: (this.state.roLines || []).filter((l) => l.id !== id) });
    if (supabase) await supabase.from('ro_lines').delete().eq('id', id);
  }
  // ---- inspections (the tech's checklist) ----
  static CHECKLIST = [
    ['tires', 'Tires', 'Tread 32nds', 'Inspect tread depth, wear pattern, sidewalls, pressure'],
    ['brakes', 'Brakes', 'Pad mm', 'Pads, rotors, lines, fluid'],
    ['battery', 'Battery', 'Volts / CCA', 'Terminals, hold-down, load test'],
    ['fluids', 'Fluids', 'Level', 'Oil, coolant, brake, power steering, washer'],
    ['filters', 'Filters', 'Condition', 'Engine air, cabin air'],
    ['belts', 'Belts & hoses', 'Condition', 'Cracks, glazing, leaks'],
    ['lights', 'Lights & wipers', 'Condition', 'All exterior lights, wiper blades'],
    ['suspension', 'Steering & suspension', 'Condition', 'Shocks, struts, tie rods, bushings'],
    ['exhaust', 'Exhaust & underbody', 'Condition', 'Leaks, hangers, rust'],
  ];
  inspectionFor(apptId) {
    const have = (this.state.inspections || []).find((i) => i.appointment_id === apptId);
    if (have) return have;
    const tpl = this.templateFor(apptId);
    const src = tpl ? tpl.items.map((it) => [it.key, it.label, it.measLabel, it.hint, it.now_job, it.monitor_job]) : ShopLogic.CHECKLIST;
    return { appointment_id: apptId, status: 'open', template_id: tpl ? tpl.id : null, items: src.map(([key, label, measLabel, hint, now_job, monitor_job]) => ({ key, label, measLabel, hint, now_job, monitor_job, status: '', meas: '', note: '', price: '', sent: false })) };
  }
  async saveInspection(apptId, patch) {
    const cur = this.inspectionFor(apptId); const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
    const list = (this.state.inspections || []).filter((i) => i.appointment_id !== apptId).concat(next);
    this.setState({ inspections: list });
    if (!supabase) return next;
    const row = { shop_id: SHOP_ID, appointment_id: apptId, tech_id: next.tech_id || null, items: next.items, status: next.status || 'open', sent_at: next.sent_at || null, updated_at: next.updated_at, template_id: next.template_id || null };
    const { data, error } = await supabase.from('inspections').upsert(row, { onConflict: 'appointment_id' }).select().single();
    if (error) { this.setState({ err: error.message }); return next; }
    this.setState({ inspections: this.state.inspections.map((i) => (i.appointment_id === apptId ? data : i)) });
    return data;
  }
  setInspectionItem(apptId, key, patch) {
    const cur = this.inspectionFor(apptId);
    const items = cur.items.map((it) => (it.key === key ? { ...it, ...patch } : it));
    clearTimeout(this._inspT); const list = (this.state.inspections || []).filter((i) => i.appointment_id !== apptId).concat({ ...cur, items });
    this.setState({ inspections: list });
    this._inspT = setTimeout(() => this.saveInspection(apptId, { items }), 600);  // debounce typing
  }
  async sendInspection(apptId, techId) {
    const cur = this.inspectionFor(apptId); const items = [];
    for (const it of cur.items) {
      if ((it.status === 'now' || it.status === 'monitor') && !it.sent) {
        const cj = (this.state.cannedJobs || []).find((j) => j.id === (it.status === 'now' ? it.now_job : it.monitor_job));
        if (cj && !it.price) await this.addJob(apptId, { name: it.name || cj.name, plain: it.note || cj.plain, tier: it.status === 'now' ? 'now' : 'monitor', tech: it.note || '', meas: it.meas || '', meas_label: it.meas ? it.measLabel : '', urgency: it.status === 'now' ? 'Recommended before you drive far.' : 'No rush. Worth watching.', lines: this.linesFrom(cj), canned_job_id: cj.id, source: 'tech' }, 'estimate');
        else await this.addFinding(apptId, { tier: it.status === 'now' ? 'now' : 'monitor', name: it.name || it.label, plain: it.note || '', tech: it.note || '', meas: it.meas || '', meas_label: it.meas ? it.measLabel : '', urgency: it.status === 'now' ? 'Recommended before you drive far.' : 'No rush. Worth watching.', price: it.price || '' });
        items.push({ ...it, sent: true });
      } else items.push(it);
    }
    await this.saveInspection(apptId, { items, status: 'sent', sent_at: new Date().toISOString(), tech_id: techId || cur.tech_id || null });
  }

  async clockOn(apptId, techId) {
    if (!techId) return;
    if (!supabase) { const now = new Date().toISOString(); this.setState({ timeEntries: (this.state.timeEntries || []).map((t) => (t.tech_id === techId && !t.ended_at ? { ...t, ended_at: now } : t)).concat({ id: 't' + Date.now(), appointment_id: apptId, tech_id: techId, started_at: now, ended_at: null }) }); return; }
    const { error } = await supabase.rpc('clock_on', { p_appointment: apptId, p_tech: techId });
    if (error) return this.setState({ err: error.message });
    await this.reload();
  }
  async clockOff(techId) {
    if (!supabase) { const now = new Date().toISOString(); this.setState({ timeEntries: (this.state.timeEntries || []).map((t) => (t.tech_id === techId && !t.ended_at ? { ...t, ended_at: now } : t)) }); return; }
    const { error } = await supabase.rpc('clock_off', { p_tech: techId });
    if (error) return this.setState({ err: error.message });
    await this.reload();
  }
  hoursOn(apptId) { return ((this.state.timeEntries || []).filter((t) => t.appointment_id === apptId).reduce((h, t) => h + (new Date(t.ended_at || Date.now()) - new Date(t.started_at)) / 36e5, 0)); }
  async setROStatus(roId, status, method) {
    if (!supabase) { this.setState({ ros: this.state.ros.map((r) => (r.id === roId ? { ...r, status, paid_method: method || r.paid_method, paid_at: status === 'paid' ? new Date().toISOString() : r.paid_at, invoiced_at: status === 'invoiced' ? new Date().toISOString() : r.invoiced_at } : r)) }); return; }
    const { error } = await supabase.rpc('ro_set_status', { p_ro: roId, p_status: status, p_method: method || '' });
    if (error) return this.setState({ err: error.message });
    await this.reloadRO();
  }
  roTotals(roId) {
    const r = (this.state.ros || []).find((x) => x.id === roId); const lines = (this.state.roLines || []).filter((l) => l.ro_id === roId);
    const cents = (l) => Math.round(Number(l.qty) * l.unit_cents), signed = (l) => (l.kind === 'discount' ? -cents(l) : cents(l));
    const ap = lines.filter((l) => l.approved !== false);
    const sum = (ls) => ls.reduce((t, l) => t + signed(l), 0);
    const supplies = Math.round(sum(ap.filter((l) => l.kind === 'labor')) * ((this.state.shop && this.state.shop.shop_supplies_bp) || 0) / 10000);
    const subtotal = sum(ap) + supplies, taxable = sum(ap.filter((l) => l.taxable !== false)) + supplies, tax = Math.round(taxable * ((r && r.tax_rate_bp) || 725) / 10000);
    const partsCost = ap.filter((l) => l.kind === 'part').reduce((t, l) => t + Math.round(Number(l.qty) * (l.cost_cents || 0)), 0), laborHours = ap.filter((l) => l.kind === 'labor').reduce((t, l) => t + Number(l.qty), 0);
    return { supplies, partsCost, partsMargin: sum(ap.filter((l) => l.kind === 'part')) - partsCost, laborHours, labor: sum(ap.filter((l) => l.kind === 'labor')), parts: sum(ap.filter((l) => l.kind === 'part')), fees: sum(ap.filter((l) => l.kind === 'fee')) + supplies, discount: -sum(ap.filter((l) => l.kind === 'discount')), subtotal, tax, total: subtotal + tax, pending: lines.filter((l) => l.approved === false).reduce((t, l) => t + cents(l), 0) };
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
    const row = { name: (d.name || '').trim(), role: (d.role || 'Technician').trim() || 'Technician', bays: (d.bays || []).map(Number).filter(Boolean), active: d.active !== false, user_id: d.user_id || null, pay_type: d.pay_type || 'hourly', pay_rate_cents: Math.round((parseFloat(String(d.pay_rate || '').replace(/[^0-9.]/g, '')) || 0) * 100), commission_pct: parseFloat(d.commission_pct) || 0 };
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
  async sendQuote(apptId, d) {
    const opts = d.opts.filter((o) => o.name.trim()).map((o) => ({ tier: o.tier, name: o.name.trim(), each_cents: Math.round(parseFloat(String(o.each).replace(/[^\d.]/g, '')) * 100) || 0, warranty: (o.warranty || '').trim(), stock: (o.stock || '').trim(), note: '' }));
    if (!opts.length) return;
    const row = { appointment_id: apptId, size: (d.size || '').trim(), tread: (d.tread || '').trim(), options: opts, recommended: opts.some((o) => o.tier === d.recommended) ? d.recommended : opts[0].tier, hazard_offered: !!d.hazard, fee_cents: Math.round(parseFloat(String(d.fee || '37')) * 100) || 3700 };
    if (!supabase) { this.setState({ quotes: [{ id: 'q' + Date.now(), status: 'sent', created_at: new Date().toISOString(), ...row }].concat(this.state.quotes), tqDraft: null }); return; }
    this.setState({ busy: true });
    const { data, error } = await supabase.from('tire_quotes').insert({ ...row, shop_id: SHOP_ID }).select().single();
    this.setState({ busy: false });
    if (error) return this.setState({ err: error.message });
    this.setState({ quotes: [data].concat(this.state.quotes), tqDraft: null });
  }
  photoUrl(p) { return p.local || (SUPABASE_URL + '/storage/v1/object/public/visit-photos/' + p.path); }

  /** Permission check mirroring public.can(): owners may do everything; advisors and techs by the matrix. */
  can(key) {
    const role = this.state.role || (supabase ? '' : 'owner'); if (role === 'owner') return true;
    const m = (this.state.shop && this.state.shop.permissions) || {};
    return !!(m[role] && m[role][key]);
  }
  async savePermissions(matrix) {
    this.setState({ shop: { ...(this.state.shop || {}), permissions: matrix } });
    if (!supabase) return;
    const { error } = await supabase.rpc('set_permissions', { p_shop: SHOP_ID, p_permissions: matrix });
    if (error) this.setState({ err: error.message });
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
      stats: (() => {
        const paidToday = (s.ros || []).filter((r) => r.status === 'paid' && r.paid_at && iso(new Date(r.paid_at)) === today());
        const sales = paidToday.reduce((t, r) => t + this.roTotals(r.id).total, 0) / 100;
        const openInv = (s.ros || []).filter((r) => r.status === 'invoiced').length;
        const waiting = s.findings.filter((f) => f.status === 'pending' && todays.some((a) => a.id === f.appointment_id)).length;
        const due = (s.reminders || []).length;
        return [{ n: String(todays.length), l: 'Appointments today' }, { n: String(todays.filter((a) => a.status === 'arrived' || a.status === 'in_progress').length), l: 'In the shop now' }, { n: '$' + Math.round(sales).toLocaleString('en-US'), l: 'Paid today' + (openInv ? ' · ' + openInv + ' open' : '') }, { n: String(waiting), l: 'Estimates waiting' }, { n: String(out.length), l: 'Loaners out' }, { n: String(due), l: 'Due for service' }];
      })(),
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
    const techs = s.techs.filter((t) => t.active !== false).map((t) => { const jobs = techJobs(t), mins = jobs.reduce((m, a) => m + (a.minutes || 60), 0), pct = Math.min(100, Math.round((mins / 480) * 100)); const rated = s.appointments.filter((a) => a.tech_id === t.id && a.rating), avg = rated.length ? (rated.reduce((x, a) => x + a.rating, 0) / rated.length).toFixed(1) : null; return { id: t.id, name: t.name, role: t.role + ((t.bays || []).length ? ' · Bay ' + t.bays.map((b) => '0' + b).join(', ') : '') + (avg ? ' · ' + avg + ' ★ (' + rated.length + ')' : ''), initials: t.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), hours: (mins / 60).toFixed(1).replace(/\.0$/, '') + ' h / 8 h', bar: 'height:100%;width:' + pct + '%;background:' + (pct > 85 ? YEL : ACC) + ';border-radius:2px', jobs: jobs.map((a) => { const st = STATUS[a.status] || STATUS.booked, v = this.vehOf(a.vehicle_id); return { t: (v ? (v.model || vehName(v)) : 'Vehicle') + ' · ' + (a.job || 'Service'), s: a.status === 'booked' ? fmtTime(a.starts_at) : st[0], c: st[1] }; }), edit: () => set({ editTech: { ...t, bays: t.bays || [], pay_rate: t.pay_rate_cents ? (t.pay_rate_cents / 100).toFixed(2) : '', commission_pct: String(t.commission_pct || 0) } }) }; });
    const techsSub = techs.length + (techs.length === 1 ? ' technician' : ' technicians') + ' · ' + todays.filter((a) => a.tech_id).length + ' of ' + todays.length + ' jobs today assigned';
    const techForm = s.editTech || s.newTech;
    const technicians = { techs, sub: techsSub, none: !s.loading && !techs.length, form: techForm, isNew: !!s.newTech && !s.editTech,
      openNew: () => set({ newTech: { name: '', role: 'Technician', bays: [], pay_type: 'hourly', pay_rate: '', commission_pct: '0' }, editTech: null }), setForm: (p) => set(s.editTech ? { editTech: { ...s.editTech, ...p } } : { newTech: { ...s.newTech, ...p } }), cancel: () => set({ newTech: null, editTech: null }),
      toggleBay: (b) => { const f = techForm; const bays = (f.bays || []).includes(b) ? f.bays.filter((x) => x !== b) : (f.bays || []).concat(b).sort(); set(s.editTech ? { editTech: { ...f, bays } } : { newTech: { ...f, bays } }); },
      logins: (s.team || []).filter((m) => m.role !== 'customer').map((m) => ({ id: m.user_id, label: (m.name || m.email || '') + (m.email && m.name ? ' · ' + m.email : '') })),
      save: () => techForm && this.saveTech(techForm), retire: s.editTech ? () => this.saveTech({ ...s.editTech, active: false }) : null };

    // Lobby board rows: today's bays, first name + initial, no prices
    const LPCT = { arrived: 8, in_progress: 55, done: 100 };
    const lobbyRows = [1, 2, 3, 4, 5].map((bay) => {
      const a = todays.find((x) => x.bay === bay && (x.status === 'arrived' || x.status === 'in_progress')) || todays.find((x) => x.bay === bay && x.status === 'done');
      if (!a) return { bay: 'Bay 0' + bay, who: 'Open', car: '', status: '', c: 'rgba(235,235,245,.3)', pctLabel: '', ruler: RULER(0, '#fff', 14), eta: '', etaSub: '', etaColor: DIM, bayPill: PILL_L('rgba(235,235,245,.3)') };
      const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id), pend = s.findings.some((f) => f.appointment_id === a.id && f.status === 'pending');
      const openTe = (s.timeEntries || []).find((te) => te.appointment_id === a.id && !te.ended_at);
      const st = pend ? ['Waiting for approval', YEL] : STATUS[a.status], pct = pend ? 35 : LPCT[a.status] || 0, t = s.techs.find((x) => x.id === (openTe ? openTe.tech_id : a.tech_id)), hrs = this.hoursOn(a.id);
      const who = c ? c.name.split(' ')[0] + (c.name.split(' ')[1] ? ' ' + c.name.split(' ')[1][0] + '.' : '') : 'Walk-in';
      return { bay: 'Bay 0' + bay, who, car: v ? [v.make, v.model].filter(Boolean).join(' ') : 'Vehicle', status: st[0], c: st[1], pctLabel: pct + '%', ruler: RULER(pct, st[1], 14), eta: a.status === 'done' ? (a.pickup === 'here' ? 'Here' : 'Ready') : hrs ? hrs.toFixed(1) + ' h' : '—', etaSub: a.status === 'done' ? (a.pickup === 'here' ? 'Guest is at the desk' : a.pickup === 'on_way' ? 'Guest on the way' : 'Pick up at the desk') : t ? t.name.split(' ')[0] + (openTe ? ' on it now' : ' assigned') : (a.job || 'Service'), etaColor: a.status === 'done' ? GRN : '#fff', bayPill: PILL_L(st[1]) };
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
      thread: thread ? { ...thread, msgs: thread.msgs.map((m) => ({ ...bubble(m), at: m.created_at, app: true })).concat((s.sms || []).filter((m) => m.customer_id === thread.id).map((m) => { const out = m.direction === 'out'; const st = { queued: 'Sending', scheduled: 'Scheduled', sent: 'Sent by text', delivered: 'Delivered by text', failed: 'Failed', received: 'Text', manual: 'Send from phone', cancelled: 'Cancelled' }[m.status] || m.status; return { text: m.body, time: fmtTime(m.created_at), at: m.created_at, sms: true, status: st, manual: m.status === 'manual', send: m.status === 'manual' ? () => { this.openMessages(m.phone, m.body); this.markTextSent(m.id); } : null, wrap: 'display:flex;flex-direction:column;align-items:' + (out ? 'flex-end' : 'flex-start') + ';max-width:70%;align-self:' + (out ? 'flex-end' : 'flex-start'), bubble: 'padding:10px 14px;border-radius:16px;font-size:13.5px;line-height:1.45;' + (out ? 'background:#30d158;color:#000;border-bottom-right-radius:5px' : 'background:rgba(48,209,88,.16);color:#fff;border-bottom-left-radius:5px'), timeStyle: 'font-size:10px;color:rgba(235,235,245,.3);margin:4px 10px 0' }; })).sort((x, y) => (x.at || '').localeCompare(y.at || '')), inApp: !!(this.custOf(thread.id) || {}).joined_at, phone: (this.custOf(thread.id) || {}).phone || '', optOut: !!(this.custOf(thread.id) || {}).sms_opt_out } : null, none: !s.loading && !threads.length && !(s.threadId && this.custOf(s.threadId)), goInboxFlag: !!s.goInbox, clearGoInbox: () => set({ goInbox: false }),
      reply: s.reply, onReply: (e) => set({ reply: e.target.value }), onReplyKey: (e) => { if (e.key === 'Enter' && thread) this.sendReply(thread.id, s.reply); }, send: () => thread && this.sendReply(thread.id, s.reply),
      sendSms: () => thread && s.reply.trim() && this.sendText(thread.id, s.reply.trim(), 'manual', null), via: s.replyVia || 'auto', setVia: (v) => set({ replyVia: v }),
      sendAuto: () => { if (!thread || !s.reply.trim()) return; const c = this.custOf(thread.id); const via = s.replyVia || 'auto'; if (via === 'text' || (via === 'auto' && c && !c.joined_at && c.phone)) this.sendText(thread.id, s.reply.trim(), 'manual', null); else this.sendReply(thread.id, s.reply); },
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
      dueSoon: (s.reminders || []).map((r) => { const d = r.due_at ? new Date(r.due_at + 'T12:00:00') : null; const days = d ? Math.round((d - new Date()) / 864e5) : null; return { customer: r.customer, vehicle: r.vehicle, label: r.label, last: r.last_at ? 'Last ' + new Date(r.last_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '', due: days === null ? '' : days < 0 ? Math.abs(days) + ' days overdue' : days === 0 ? 'Due today' : 'Due in ' + days + ' days', color: r.status === 'due' ? '#e0312b' : '#ffd60a', inApp: !!r.joined, text: r.phone && r.status === 'due' ? async () => { if (!supabase) return; const { data, error } = await supabase.rpc('text_due_reminders', { p_shop: SHOP_ID, p_vehicle: r.vehicle_id }); set({ fuNote: error ? error.message : data ? 'Text sent.' : 'Not sent — opted out or no number.' }); } : null, sms: r.phone ? 'sms:' + r.phone + '?&body=' + encodeURIComponent('Hi ' + (r.customer || '').split(' ')[0] + ', this is ' + ((s.shop && s.shop.name) || 'the shop') + '. Your ' + r.vehicle + ' is due for ' + (r.label || '').toLowerCase() + '. Book in the app or reply here and we will set a time.') : '', book: () => set({ custId: r.customer_id, newAppt: { customer_id: r.customer_id, vehicle_id: r.vehicle_id, name: '', phone: '', year: '', make: '', model: '', plate: '', job: r.label, day: s.day, time: '09:00', visit: 'dropoff' } }) }; }),
      textAllDue: (s.reminders || []).some((r) => r.status === 'due') ? async () => { if (!supabase) return set({ fuNote: 'Would text every customer whose service is due.' }); const { data, error } = await supabase.rpc('text_due_reminders', { p_shop: SHOP_ID }); set({ fuNote: error ? error.message : 'Texted ' + (data || 0) + (data === 1 ? ' customer' : ' customers') + ' whose service is due.' }); } : null,
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
    const rosLive = (s.ros || []).filter((r) => r.status === 'paid' || r.status === 'invoiced');
    const roTotal = (r) => this.roTotals(r.id);
    const useRO = rosLive.length > 0;
    const repData = useRO
      ? buckets.map((k) => rosLive.filter((r) => keyOf(r.paid_at || r.invoiced_at) === k).reduce((t, r) => t + roTotal(r).total, 0) / 100)
      : buckets.map((k) => approvedAll.filter((f) => keyOf(f.decided_at || f.created_at) === k).reduce((t, f) => t + f.price_cents, 0) / 100);
    const monthROs = rosLive.filter((r) => monthKey(r.paid_at || r.invoiced_at) === today().slice(0, 7));
    const monthSales = monthROs.reduce((t, r) => t + roTotal(r).total, 0) / 100;
    const monthParts = monthROs.reduce((t, r) => t + roTotal(r).parts, 0) / 100, monthPartsCost = monthROs.reduce((t, r) => t + roTotal(r).partsCost, 0) / 100;
    const monthLaborH = monthROs.reduce((t, r) => t + roTotal(r).laborHours, 0);
    const monthClockH = (s.timeEntries || []).filter((t) => monthKey(t.started_at) === today().slice(0, 7)).reduce((h, t) => h + (new Date(t.ended_at || Date.now()) - new Date(t.started_at)) / 36e5, 0);
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
    const techRows = s.techs.filter((t) => t.active !== false).map((t) => { const jobs = doneVisits.filter((a) => a.tech_id === t.id), fs = s.findings.filter((f) => jobs.some((a) => a.id === f.appointment_id) && f.status !== 'pending'), ok = fs.filter((f) => f.status === 'approved' || f.status === 'done'); const rated = jobs.filter((a) => a.rating); return { k: t.name, v: String(jobs.length) + (jobs.length === 1 ? ' visit' : ' visits'), s: fs.length ? Math.round((ok.length / fs.length) * 100) + '% approval · ' + fmt0(ok.reduce((x, f) => x + f.price_cents, 0) / 100) + ' approved' : 'No estimates yet', r: rated.length ? (rated.reduce((x, a) => x + a.rating, 0) / rated.length).toFixed(1) + ' ★' : '' }; });
    const ratedAll = doneVisits.filter((a) => a.rating);
    const reports = {
      repSub: (repRange === '12 months' ? new Date(buckets[0] + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : new Date(buckets[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })) + ' – ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' · no card payments are recorded in Revyn yet, so money figures are approved estimates',
      repTitle: useRO ? 'Sales' : 'Approved work', repRanges: ['7 days', '31 days', '12 months'].map((r) => ({ label: r, pick: () => set({ repRange: r }), style: 'padding:9px 14px;border-radius:9px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (repRange === r ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.7);') })),
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
        useRO ? { l: 'Sales this month', n: fmt0(monthSales), d: monthROs.length + (monthROs.length === 1 ? ' invoice' : ' invoices') + ' · ARO ' + fmt0(monthSales / Math.max(1, monthROs.length)), c: GRN }
              : { l: 'Approved work this month', n: fmt0(approvedAll.filter((f) => monthKey(f.decided_at || f.created_at) === today().slice(0, 7)).reduce((t, f) => t + f.price_cents, 0) / 100), d: 'from estimates in the app', c: GRN },
        { l: 'Parts margin', n: monthParts ? Math.round(((monthParts - monthPartsCost) / monthParts) * 100) + '%' : '—', d: monthParts ? fmt0(monthParts - monthPartsCost) + ' on ' + fmt0(monthParts) + ' this month' : 'Add cost on part lines', c: monthParts ? GRN : DIM },
        { l: 'Tech efficiency', n: monthClockH && monthLaborH ? Math.round((monthLaborH / monthClockH) * 100) + '%' : '—', d: monthClockH ? monthLaborH.toFixed(1) + ' h billed · ' + monthClockH.toFixed(1) + ' h on the clock' : 'Clock on from a visit', c: monthClockH && monthLaborH ? (monthLaborH / monthClockH >= 0.9 ? GRN : YEL) : DIM },
        { l: 'Approval rate', n: apprRate === null ? '—' : apprRate + '%', d: decided.length ? decided.length + ' decided' : 'No estimates decided yet', c: apprRate === null ? DIM : apprRate >= 70 ? GRN : YEL },
        { l: 'Average approval time', n: apprMins === null ? '—' : apprMins < 60 ? apprMins + ' min' : (apprMins / 60).toFixed(1) + ' h', d: 'from sent to tapped', c: DIM },
        { l: 'Declined value, open', n: fmt0(fuOpen.reduce((t, r) => t + r.value, 0) / 100), d: fuOpen.length + ' follow-ups', c: fuOpen.length ? YEL : DIM },
        { l: 'Customer rating', n: ratedAll.length ? (ratedAll.reduce((x, a) => x + a.rating, 0) / ratedAll.length).toFixed(1) : '—', d: ratedAll.length ? ratedAll.length + (ratedAll.length === 1 ? ' rating' : ' ratings') + ' from the app' : 'No ratings yet', c: ratedAll.length ? GRN : DIM },
        { l: 'Customers', n: String(s.customers.length), d: newCust + ' new this month', c: DIM },
        { l: 'Loaner days this month', n: String(loanerDays), d: out.length + ' out now', c: DIM },
      ],
    };

    // Tires: a quote per open visit; the customer picks on their phone
    const TIER_NAMES = [['good', 'Good'], ['better', 'Better'], ['best', 'Best']];
    const quoteVisits = s.appointments.filter((a) => a.status === 'arrived' || a.status === 'in_progress' || (a.status === 'booked' && iso(new Date(a.starts_at)) === today()));
    const tqVisit = quoteVisits.find((a) => a.id === s.tqVisit) || quoteVisits[0] || null;
    const existing = tqVisit ? s.quotes.find((x) => x.appointment_id === tqVisit.id) : null;
    const blankDraft = () => ({ size: '', tread: '', fee: '37', hazard: true, recommended: 'better', opts: TIER_NAMES.map(([tier]) => ({ tier, name: '', each: '', warranty: '', stock: '' })) });
    const draftSrc = existing ? { size: existing.size, tread: existing.tread, fee: (existing.fee_cents / 100).toFixed(0), hazard: existing.hazard_offered, recommended: existing.recommended, opts: TIER_NAMES.map(([tier]) => { const o = (existing.options || []).find((x) => x.tier === tier) || {}; return { tier, name: o.name || '', each: o.each_cents ? (o.each_cents / 100).toFixed(0) : '', warranty: o.warranty || '', stock: o.stock || '' }; }) } : (s.tqDraft && s.tqDraft.for === (tqVisit && tqVisit.id) ? s.tqDraft : { for: tqVisit && tqVisit.id, ...blankDraft() });
    const setDraft = (p) => set({ tqDraft: { ...draftSrc, for: tqVisit && tqVisit.id, ...p } });
    const calc = (o) => { const each = parseFloat(String(o.each).replace(/[^\d.]/g, '')) || 0, fee = parseFloat(String(draftSrc.fee)) || 0; const tires = each * 4, fees = fee * 4, haz = draftSrc.hazard ? Math.round(tires * 0.12) : 0; return tires + fees + haz; };
    const fmtD = (n) => '$' + Math.round(n).toLocaleString('en-US');
    const cQ = tqVisit && this.custOf(tqVisit.customer_id), vQ = tqVisit && this.vehOf(tqVisit.vehicle_id);
    const chipQ = (on) => 'padding:8px 14px;border-radius:999px;font-size:12.5px;font-weight:500;cursor:pointer;' + (on ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)');
    const recOpt = draftSrc.opts.find((o) => o.tier === draftSrc.recommended) || draftSrc.opts[0];
    const canSend = !existing && draftSrc.opts.some((o) => o.name.trim() && parseFloat(o.each) > 0);
    const tires = {
      head: s.quotes.filter((q) => q.status === 'sent').length + ' open · ' + s.quotes.filter((q) => q.status === 'accepted').length + ' accepted',
      visits: quoteVisits.map((a) => { const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id); return { id: a.id, label: (c ? c.name.split(' ')[0] : 'Walk-in') + ' · ' + (v ? v.model || vehName(v) : 'Vehicle') + ' · ' + (a.job || 'Service'), pick: () => set({ tqVisit: a.id }), style: chipQ(tqVisit && tqVisit.id === a.id) }; }),
      draft: tqVisit ? { who: cQ ? cQ.name : 'Walk-in', car: (vehName(vQ) || 'Vehicle') + (vQ && vQ.odometer ? ' · ' + vQ.odometer.toLocaleString('en-US') + ' mi' : '') + ' · ' + (tqVisit.job || 'Service'), size: draftSrc.size, tread: draftSrc.tread, fee: draftSrc.fee, locked: !!existing,
        pill: pill(existing ? (existing.status === 'accepted' ? GRN : existing.status === 'declined' ? DIM : YEL) : DIM), status: existing ? (existing.status === 'accepted' ? 'Accepted · ' + (existing.accepted_tier || '') : existing.status === 'declined' ? 'Declined' : 'Sent · waiting') : 'Draft',
        opts: draftSrc.opts.map((o, i) => ({ ...o, tier: o.tier, tierLabel: TIER_NAMES[i][1], on: draftSrc.recommended === o.tier, total: fmtD(calc(o)), pick: () => !existing && setDraft({ recommended: o.tier }) })),
        haz: [['Include', true], ['Offer as option', false]].map(([label, val]) => ({ label, pick: () => !existing && setDraft({ hazard: val }), style: chipQ(draftSrc.hazard === val) })),
        action: existing ? (existing.status === 'accepted' ? { t: 'Accepted · ' + ((existing.options || []).find((o) => o.tier === existing.accepted_tier) || {}).name, s: fmtD((existing.total_cents || 0) / 100) + ' installed · now an approved item on the visit.', cta: '' } : existing.status === 'declined' ? { t: 'Declined', s: 'The customer passed on this quote.', cta: '' } : { t: 'Sent to ' + (cQ ? cQ.name.split(' ')[0] : 'the customer') + ' at ' + fmtTime(existing.created_at), s: 'They see all three options with ' + existing.recommended + ' recommended.', cta: '' })
          : { t: 'Draft', s: recOpt && recOpt.name ? 'Recommend ' + recOpt.tier + ' · ' + recOpt.name + ' · ' + fmtD(calc(recOpt)) + ' installed' : 'Fill in at least one option with a price.', cta: 'Send quote to ' + (cQ ? cQ.name.split(' ')[0] : 'customer'), ok: canSend, go: () => this.sendQuote(tqVisit.id, draftSrc) },
      } : null,
      setDraft, setOpt: (i, p) => setDraft({ opts: draftSrc.opts.map((o, j) => (j === i ? { ...o, ...p } : o)) }),
      recent: s.quotes.slice(0, 8).map((q) => { const a = s.appointments.find((x) => x.id === q.appointment_id), c = a && this.custOf(a.customer_id); return { id: q.id, who: c ? c.name : 'Customer', state: q.status === 'accepted' ? 'Accepted' : q.status === 'declined' ? 'Declined' : 'Waiting', color: q.status === 'accepted' ? GRN : q.status === 'declined' ? DIM : YEL, meta: (q.size || 'Tires') + ' · ' + (q.options || []).length + ' options · ' + relDay(q.created_at), open: () => a && set({ tqVisit: a.id }) }; }),
    };

    const schedule = {
      sub: DAY_LABEL(s.day) + ' · 5 bays · ' + dayJobs.length + (dayJobs.length === 1 ? ' job' : ' jobs'),
      nowPill: pill(ACC), nowLabel: 'Now · ' + fmtH(nowH), showNow: s.day === today() && nowH >= H0 && nowH <= H1,
      hours: HOURS.map((hr) => ({ left: hl(hr), label: hr === 12 ? '12 PM' : hr > 12 ? (hr - 12) + ' PM' : hr + ' AM' })), nowLeft: 'calc(76px + (100% - 76px) * ' + ((nowH - H0) / SPAN).toFixed(4) + ')',
      rows: schedRows, msg: s.schedMsg || (dayJobs.length ? 'Drag a job to another time or bay. The customer\u2019s phone and Today update as soon as you let go.' : 'Nothing booked for this day yet.'),
      setMinutes: (id, m) => this.setAppt(id, { minutes: m }),
    };

    // ---- technician iPad (live) ----
    const tech = (() => {
      let meId = s.techMe; try { if (!meId) meId = localStorage.getItem('revyn.techMe') || ''; } catch (e) {}
      const uid = this.props && this.props.userId; const byLogin = uid ? s.techs.find((t) => t.user_id === uid) : null;
      const me = s.techs.find((t) => t.id === meId) || byLogin || null;
      const pick = (id) => { try { localStorage.setItem('revyn.techMe', id); } catch (e) {} set({ techMe: id }); };
      const live = s.appointments.filter((a) => iso(new Date(a.starts_at)) === today() && ['booked', 'arrived', 'in_progress'].includes(a.status)).sort((x, y) => (x.bay || 9) - (y.bay || 9) || (x.starts_at < y.starts_at ? -1 : 1));
      const jobRow = (a) => { const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id); return { id: a.id, who: (c && c.name) || a.customer_name || 'Customer', car: v ? vehName(v) : a.vehicle || 'Vehicle', job: a.job || 'Service', bay: a.bay ? 'Bay 0' + a.bay : '', time: new Date(a.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), status: STATUS[a.status][0], color: STATUS[a.status][1], mine: !!(me && a.tech_id === me.id), open: () => set({ techSel: a.id }), selected: s.techSel === a.id, clocked: !!(s.timeEntries || []).find((t) => t.appointment_id === a.id && !t.ended_at) }; };
      const sel = live.find((a) => a.id === s.techSel) || null;
      let job = null;
      if (sel) {
        const c = this.custOf(sel.customer_id), v = this.vehOf(sel.vehicle_id), insp = this.inspectionFor(sel.id);
        const open = (s.timeEntries || []).find((t) => t.appointment_id === sel.id && !t.ended_at);
        const fs = s.findings.filter((f) => f.appointment_id === sel.id);
        const photosOf = (key) => s.photos.filter((p) => p.appointment_id === sel.id && p.caption === key).map((p) => this.photoUrl(p));
        const flagged = insp.items.filter((it) => it.status === 'now' || it.status === 'monitor');
        job = {
          id: sel.id, who: (c && c.name) || 'Customer', phone: c ? fmtPhone(c.phone) : '', car: v ? vehName(v) : sel.vehicle || 'Vehicle', specs: v ? [v.trim, v.engine, v.drive, v.color, v.plate, v.odometer ? v.odometer.toLocaleString('en-US') + ' mi' : ''].filter(Boolean).join(' · ') : '', vin: v && v.vin ? v.vin : '',
          job: sel.job || 'Service', notes: sel.notes || '', bay: sel.bay ? 'Bay 0' + sel.bay : 'No bay', status: STATUS[sel.status][0], color: STATUS[sel.status][1], statusKey: sel.status,
          clockOn: !!open, clockSince: open ? new Date(open.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '', hours: this.hoursOn(sel.id) ? this.hoursOn(sel.id).toFixed(1) + ' h' : '',
          start: me ? () => this.clockOn(sel.id, me.id) : null, stop: open ? () => this.clockOff(open.tech_id) : null,
          arrive: sel.status === 'booked' ? () => this.setAppt(sel.id, { status: 'arrived' }) : null,
          finish: sel.status !== 'done' ? async () => { if (open) await this.clockOff(open.tech_id); await this.setAppt(sel.id, { status: 'done' }); set({ techSel: null }); } : null,
          inspStatus: insp.status, sentAt: insp.sent_at ? new Date(insp.sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
          items: insp.items.map((it) => ({ ...it, photos: photosOf(it.key), setStatus: (st) => this.setInspectionItem(sel.id, it.key, { status: it.status === st ? '' : st }), setMeas: (m) => this.setInspectionItem(sel.id, it.key, { meas: m }), setNote: (n) => this.setInspectionItem(sel.id, it.key, { note: n }), setName: (n) => this.setInspectionItem(sel.id, it.key, { name: n }), setPrice: (pr) => this.setInspectionItem(sel.id, it.key, { price: pr }), addPhoto: (file) => this.addVisitPhoto(sel.id, file, it.key, null) })),
          flaggedCount: flagged.filter((it) => !it.sent).length, goodCount: insp.items.filter((it) => it.status === 'good').length, total: insp.items.length,
          send: flagged.some((it) => !it.sent) ? () => this.sendInspection(sel.id, me && me.id) : null,
          findings: fs.filter((f) => f.source !== 'booked').map((f) => { const openJ = (s.timeEntries || []).find((t) => t.finding_id === f.id && !t.ended_at); const jh = this.jobHours(f.id); return { id: f.id, name: f.name, status: { pending: 'Waiting on customer', approved: 'Approved — go ahead', declined: 'Declined', done: 'Done' }[f.status], color: { pending: YEL, approved: GRN, declined: DIM, done: GRN }[f.status], price: f.price_cents ? '$' + (f.price_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '', markDone: f.status === 'approved' ? () => this.setFinding(f.id, { status: 'done', done_at: new Date().toISOString() }) : null,
            onJob: !!openJ, jobHours: jh ? jh.toFixed(1) + ' h' : '', startJob: f.status === 'approved' && me && !openJ ? () => this.clockOnJob(sel.id, me.id, f.id) : null, stopJob: openJ ? () => this.clockOff(openJ.tech_id) : null, included: (f.lines || []).map((l) => l.description + (Number(l.qty) !== 1 ? ' × ' + Number(l.qty) + (l.kind === 'labor' ? ' h' : '') : '')).join(', ') }; }),
          templates: (s.inspTemplates || []).filter((t) => !t.internal || true).map((t) => ({ id: t.id, name: t.name })), templateId: insp.template_id || '', useTemplate: insp.status !== 'sent' ? (id) => this.useTemplate(sel.id, id) : null,
          back: () => set({ techSel: null }),
        };
      }
      return { me, meName: me ? me.name : '', pick, techOpts: s.techs.filter((t) => t.active !== false).map((t) => ({ id: t.id, name: t.name })), jobs: live.map(jobRow), mine: live.filter((a) => me && a.tech_id === me.id).length, job, date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), loading: s.loading, err: s.err, dismissErr: () => set({ err: '' }) };
    })();

    // ---- jobs, parts, money, texting, calendar, inspections, reports (src/state/shop/*) ----
    const H = { vehName, fmtTime, relDay, fmtDay, STATUS };
    const { library, estimateFor, board } = jobVals(this, s, set, H);
    const partsPage = partVals(this, s, set, H);
    const register = moneyVals(this, s, set, H);
    const comms = commsVals(this, s, set, H);
    const calendar = calendarVals(this, s, set, H);
    const dvi = dviVals(this, s, set, H);
    const staffReports = reportVals(this, s, set, H);
    const fleet = fleetVals(this, s, set, H);
    const marketing = marketingVals(this, s, set, H);
    // Estimates page: every visit in the shop (or booked today) with its jobs; the writer builds and sends from here.
    const estVisits = s.appointments.filter((a) => ['arrived', 'in_progress'].includes(a.status) || (['booked', 'done'].includes(a.status) && iso(new Date(a.starts_at)) === today())).sort((x, y) => ({ arrived: 0, in_progress: 0, booked: 1, done: 2 }[x.status] - { arrived: 0, in_progress: 0, booked: 1, done: 2 }[y.status]) || x.starts_at.localeCompare(y.starts_at));
    const estSelA = estVisits.find((a) => a.id === s.estId) || estVisits.find((a) => s.findings.some((f) => f.appointment_id === a.id && f.status === 'pending')) || estVisits[0] || null;
    const estimates = {
      queue: estVisits.map((a) => { const c = this.custOf(a.customer_id), v = this.vehOf(a.vehicle_id), fs = s.findings.filter((f) => f.appointment_id === a.id && f.source !== 'booked'), pend = fs.filter((f) => f.status === 'pending'), appr = fs.filter((f) => f.status === 'approved' || f.status === 'done'); const sentAt = pend.length ? pend.reduce((t, f) => (t < f.created_at ? t : f.created_at), pend[0].created_at) : null; return { id: a.id, who: c ? c.name : 'Walk-in', car: (v ? v.model || vehName(v) : 'Vehicle') + ' · ' + (a.job || 'Service'), total: fs.length ? fmtC(fs.filter((f) => f.status !== 'declined').reduce((t, f) => t + f.price_cents, 0)) : '—', state: pend.length ? 'Waiting ' + ageOf(sentAt) : appr.length ? appr.length + ' approved' : a.status === 'booked' ? 'Booked · ' + fmtTime(a.starts_at) : 'No estimate yet', color: pend.length ? (Date.now() - new Date(sentAt) > 20 * 60000 ? ACC : YEL) : appr.length ? GRN : DIM, on: estSelA && estSelA.id === a.id, open: () => set({ estId: a.id, jobPick: null, jobDraft: null, jobEdit: null }) }; }),
      sel: estimateFor(estSelA), none: !s.loading && !estVisits.length, waiting: estVisits.filter((a) => s.findings.some((f) => f.appointment_id === a.id && f.status === 'pending')).length,
    };

    return {
      loading: s.loading, err: s.err, busy: s.busy, dismissErr: () => set({ err: '' }), overview, schedule, technicians, lobby, inbox, approvals, followups, reports, tires, tech,
      library, estimates, board, partsPage, register, comms, calendar, dvi, staffReports, fleet, marketing, config: s.config || {}, shop: s.shop,
      role: s.role || (supabase ? '' : 'owner'), can: (k) => this.can(k), isOwner: (s.role || (supabase ? '' : 'owner')) === 'owner',
      permissions: { matrix: (s.shop && s.shop.permissions) || { advisor: {}, tech: {} }, keys: [['payments', 'Take payments'], ['discount', 'Add discounts'], ['refund', 'Refund'], ['void', 'Void an invoice'], ['edit_paid', 'Change or reopen a paid invoice'], ['parts_cost', 'See parts cost and margin'], ['reports', 'See reports'], ['settings', 'Change settings, jobs and pricing'], ['delete_customer', 'Delete customers']], save: (m) => this.savePermissions(m) },
      activity: (s.activity || []).map((x) => ({ id: x.id, who: x.who, action: x.action, ref: x.ref, summary: x.summary, when: relDay(x.created_at) + ' · ' + fmtTime(x.created_at), kind: x.action.split('.')[0], color: /refund|void|deleted|removed|cancelled/.test(x.action) ? '#ff6b64' : /paid|approved|done|merged/.test(x.action) ? GRN : /declined|moved|priced|changed/.test(x.action) ? YEL : 'rgba(235,235,245,.6)' })),
      dups: s.dups || null, loadDuplicates: () => this.loadDuplicates(), mergeCustomers: (keep, drop) => this.mergeCustomers(keep, drop), findExisting: (q) => this.findExisting(q),
      goEstimatesFlag: !!s.goEstimates, clearGoEstimates: () => set({ goEstimates: false }),
      // Customers page
      customersSub: s.customers.length + (s.customers.length === 1 ? ' customer' : ' customers') + ' · ' + s.customers.filter((c) => c.joined_at).length + ' in the app · ' + activeToday.size + ' active today',
      importPreview: s.importPreview, previewImport: (f) => this.previewImport(f), runImport: () => this.runImport(), closeImport: () => set({ importPreview: null }),
      inviteText: (c) => 'Hi ' + (c.name || '').split(' ')[0] + ', this is ' + ((s.shop && s.shop.name) || 'the shop') + '. Your car, visits and estimates are now in the Revyn app. Sign in with this number: https://dealer-os-rosy.vercel.app/join',
      search: s.search, setSearch: (v) => set({ search: v }),
      customers: custRows.map((c) => ({ id: c.id, initials: initials(c.name), name: c.name, vehicles: String(s.vehicles.filter((v) => v.customer_id === c.id).length), visits: String(apptsOf(c.id).filter((a) => a.status === 'done').length), last: lastVisit(c), ltv: c.joined_at ? 'In the app' : c.invited_at ? 'Invited' : rentalsOf(c).length + (rentalsOf(c).length === 1 ? ' loaner' : ' loaners'), joined: !!c.joined_at, open: () => set({ custId: c.id, newCust: null }), style: 'display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;align-items:center;padding:14px 12px;margin:0 -12px;border-bottom:1px solid rgba(235,235,245,.07);font-size:13.5px;cursor:pointer;border-radius:10px;' + (c.id === custId ? 'background:rgba(235,235,245,.06)' : '') })),
      noCustomers: !s.loading && !s.customers.length, noMatches: !!q && !custRows.length && !!s.customers.length,
      cust: cust ? { id: cust.id, initials: initials(cust.name), name: cust.name, meta: [fmtPhone(cust.phone), cust.city, 'Since ' + new Date(cust.created_at).getFullYear()].filter(Boolean).join(' · '), phone: cust.phone, email: cust.email, city: cust.city, notes: cust.notes || '',
        cars: custCars.map((v) => ({ id: v.id, n: vehName(v) || 'Vehicle', s: [v.trim, v.engine, v.drive, v.color, v.plate, v.vin ? 'VIN ' + v.vin : '', v.odometer ? v.odometer.toLocaleString('en-US') + ' mi' : ''].filter(Boolean).join(' · ') })),
        visitsList: custAppts.slice(0, 6).map((a) => ({ t: (a.job || 'Service') + (a.status === 'done' ? '' : ' · ' + STATUS[a.status][0]), d: relDay(a.starts_at) })),
        loaners: custRentals.slice(0, 4).map((r) => ({ t: r.number + ' · ' + ({ draft: 'Draft', sent: 'Sent', signed: 'Signed', out: 'Out', returned: 'Returned', cancelled: 'Cancelled' }[r.status] || r.status), d: relDay(r.created_at) })),
        smsHref: cust.phone ? 'sms:' + cust.phone : '', telHref: cust.phone ? 'tel:' + cust.phone : '',
        appStatus: cust.joined_at ? 'In the app since ' + relDay(cust.joined_at) : cust.invited_at ? 'Invited ' + relDay(cust.invited_at) + ' · not signed in yet' : 'Not in the app yet',
        joined: !!cust.joined_at, invite: cust.phone && !cust.joined_at ? () => { const body = 'Hi ' + (cust.name || '').split(' ')[0] + ', this is ' + ((s.shop && s.shop.name) || 'the shop') + '. Your car, visits and estimates are now in the Revyn app. Sign in with this number: https://dealer-os-rosy.vercel.app/join'; this.markInvited(cust.id); window.location.href = 'sms:' + cust.phone + '?&body=' + encodeURIComponent(body); } : null,
        lastKnown: custCars.map((v) => v.last_service ? (vehName(v) || 'Vehicle') + ' · ' + v.last_service + (v.last_visit_at ? ' · ' + new Date(v.last_visit_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '') : '').filter(Boolean),
        book: () => set({ newAppt: { customer_id: cust.id, vehicle_id: (custCars[0] || {}).id || '', day: s.day, time: '09:00', visit: 'dropoff', job: '' } }),
        setNotes: (v) => this.updateCustomer(cust.id, { notes: v }), message: () => set({ threadId: cust.id, goInbox: true }),
        account: { charge: !!cust.charge_account, limit: cust.credit_limit_cents ? (cust.credit_limit_cents / 100).toFixed(0) : '', terms: String(cust.terms_days || 30), credit: this.creditOf(cust.id), creditLabel: this.creditOf(cust.id) ? fmtC(this.creditOf(cust.id)) + ' store credit' : '',
          owed: (() => { const open = (s.ros || []).filter((r) => r.status === 'invoiced' && (s.appointments.find((a) => a.id === r.appointment_id) || {}).customer_id === cust.id); const bal = open.reduce((t, r) => t + this.roBalance(r.id), 0); return bal ? fmtC(bal) + ' owed · ' + open.length + (open.length === 1 ? ' invoice' : ' invoices') : ''; })(),
          setCharge: (on, limit, terms) => this.setChargeAccount(cust.id, on, limit, terms), issueCredit: () => set({ creditEdit: { customer_id: cust.id, amount: '', kind: 'store_credit', note: '' } }),
          optOut: !!cust.sms_opt_out, setOptOut: (v) => this.setOptOut(cust.id, v), noMarket: !!cust.do_not_market, setNoMarket: (v) => this.setDoNotMarket(cust.id, v),
          fleetId: cust.fleet_id || '', fleets: (s.fleets || []).filter((f) => f.active !== false).map((f) => ({ id: f.id, name: f.name })), setFleet: (id) => this.setCustomerFleet(cust.id, id), email: cust.email || '', setEmail: (v) => this.updateCustomer(cust.id, { email: (v || '').trim().toLowerCase() }),
          tags: cust.tags || [], setTags: (tags) => this.updateCustomer(cust.id, { tags }), source: { tekmetric: 'From Tekmetric', csv: 'Imported', online: 'Booked online', app: 'Joined in the app' }[cust.source] || '' },
        creditEdit: s.creditEdit && s.creditEdit.customer_id === cust.id ? { ...s.creditEdit, set: (p) => set({ creditEdit: { ...s.creditEdit, ...p } }), save: () => this.issueCredit(cust.id, s.creditEdit.amount, s.creditEdit.kind, s.creditEdit.note), cancel: () => set({ creditEdit: null }) } : null,
      } : null,
      editVeh: s.editVeh, setEditVeh: (v) => set({ editVeh: v }), saveVeh: () => cust && s.editVeh && this.addVehicle(cust.id, s.editVeh),
      decodeVeh: async () => { const ev = s.editVeh || {}; set({ editVeh: { ...ev, decoding: true, decodeErr: '' } }); try { const { decodeVin } = await import('./vin.js'); const r = await decodeVin(ev.vin); if (!r) return set({ editVeh: { ...this.state.editVeh, decoding: false, decodeErr: 'VIN did not decode.' } }); set({ editVeh: { ...this.state.editVeh, decoding: false, year: String(r.year || ''), make: r.make, model: r.model, trim: r.trim, engine: r.engine, body: r.body, drive: r.drive, fuel: r.fuel, decoded: [r.year, r.make, r.model, r.trim].filter(Boolean).join(' ') + (r.engine ? ' · ' + r.engine : '') } }); } catch (e) { set({ editVeh: { ...this.state.editVeh, decoding: false, decodeErr: 'VIN service unreachable.' } }); } },
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
        confirmed: !!sel.confirmed_at, confirm: sel.status === 'booked' && !sel.confirmed_at ? () => this.confirmAppt(sel.id) : null, source: sel.source || 'desk',
        onlineCheckin: sel.online_checkin_at ? 'Checked in online ' + fmtTime(sel.online_checkin_at) : '', concern: sel.concern || '',
        signed: (s.authorizations || []).filter((z) => z.appointment_id === sel.id).map((z) => ({ kind: { checkin: 'Check-in authorization', estimate: 'Estimate approval', pickup: 'Pickup' }[z.kind] || z.kind, who: z.name, when: relDay(z.created_at) + ' ' + fmtTime(z.created_at), amount: z.amount_cents ? fmtC(z.amount_cents) : '' })),
        visitLink: sel.token ? ((s.shop && s.shop.public_url) || 'https://dealer-os-rosy.vercel.app') + '/visit/' + sel.token : '', copyVisitLink: sel.token ? () => { try { navigator.clipboard.writeText(((s.shop && s.shop.public_url) || 'https://dealer-os-rosy.vercel.app') + '/visit/' + sel.token); set({ payNote: 'Visit link copied.' }); } catch (e) {} } : null,
        textVisitLink: selCust && selCust.phone && sel.token ? () => this.sendText(selCust.id, 'Hi ' + selCust.name.split(' ')[0] + ', here is everything for your visit at ' + ((s.shop && s.shop.name) || 'the shop') + ' — confirm, check in, approve work and pay from this link: ' + ((s.shop && s.shop.public_url) || 'https://dealer-os-rosy.vercel.app') + '/visit/' + sel.token, 'manual', sel.id) : null,
        texts: selCust ? comms.quick(sel.id).map((t) => ({ ...t, send: () => this.sendText(selCust.id, t.body, t.key, sel.id) })) : [], textsSent: (s.sms || []).filter((m) => m.appointment_id === sel.id && m.direction === 'out').map((m) => ({ id: m.id, kind: m.kind, status: m.status, time: fmtTime(m.created_at) })),
        inspTemplates: dvi.options, inspTemplateId: (this.inspectionFor(sel.id) || {}).template_id || '', useTemplate: (id) => this.useTemplate(sel.id, id),
        clock: (() => { const open = (s.timeEntries || []).find((t) => t.appointment_id === sel.id && !t.ended_at); const tech = open && s.techs.find((t) => t.id === open.tech_id); const hrs = this.hoursOn(sel.id); return { on: !!open, who: tech ? tech.name.split(' ')[0] : '', since: open ? new Date(open.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '', hours: hrs ? hrs.toFixed(1) + ' h on the clock' : '', start: (techId) => this.clockOn(sel.id, techId || sel.tech_id), stop: () => open && this.clockOff(open.tech_id), entries: (s.timeEntries || []).filter((t) => t.appointment_id === sel.id).slice(-5).reverse().map((t) => { const te = s.techs.find((x) => x.id === t.tech_id); return (te ? te.name.split(' ')[0] : 'Tech') + ' · ' + new Date(t.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + (t.ended_at ? '–' + new Date(t.ended_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ' · now'); }) }; })(),
        rating: sel.rating ? '★'.repeat(sel.rating) + ' ' + (sel.rating_note || '') : '', ratingTags: (sel.rating_tags || []).join(' · '), techId: sel.tech_id || '', setTech: (id) => this.setAppt(sel.id, { tech_id: id || null }), techOpts: s.techs.filter((t) => t.active !== false).map((t) => ({ id: t.id, label: t.name + ((t.bays || []).length ? ' · Bay ' + t.bays.map((b) => '0' + b).join(', ') : '') })),
        findings: s.findings.filter((f) => f.appointment_id === sel.id).map((f) => ({ id: f.id, name: f.name, tier: { now: 'Recommended now', soon: 'Recommended soon', monitor: 'Monitor' }[f.tier] || f.tier, price: f.price_cents ? '$' + (f.price_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'No charge', status: { pending: 'Waiting for approval', approved: 'Approved', declined: 'Declined', done: 'Done' }[f.status], color: { pending: YEL, approved: GRN, declined: DIM, done: GRN }[f.status], plain: f.plain, meas: [f.meas_label, f.meas].filter(Boolean).join(' · '), remove: () => this.removeFinding(f.id), markDone: f.status === 'approved' ? () => this.setFinding(f.id, { status: 'done' }) : null, photos: s.photos.filter((p) => p.finding_id === f.id).map((p) => this.photoUrl(p)) })),
        photos: s.photos.filter((p) => p.appointment_id === sel.id).map((p) => ({ id: p.id, url: this.photoUrl(p), caption: p.caption })),
        addPhoto: (file, caption, findingId) => this.addVisitPhoto(sel.id, file, caption, findingId),
        newFinding: s.newFinding, openNewFinding: () => set({ newFinding: { tier: 'now', name: '', plain: '', meas: '', meas_label: '', urgency: '', price: '' } }), setNewFinding: (p) => set({ newFinding: { ...s.newFinding, ...p } }), cancelNewFinding: () => set({ newFinding: null }), saveNewFinding: () => s.newFinding && this.addFinding(sel.id, s.newFinding),
        pendingCount: s.findings.filter((f) => f.appointment_id === sel.id && f.status === 'pending').length,
        invoice: (() => {
          const ro = (s.ros || []).find((r) => r.appointment_id === sel.id);
          const $ = (c) => (c < 0 ? '-' : '') + '$' + (Math.abs(c) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
          const t = ro ? this.roTotals(ro.id) : null;
          const nl = s.newLine;
          const KIND = { labor: 'Labor', part: 'Part', fee: 'Fee', discount: 'Discount' };
          return {
            ro, number: ro ? 'RO ' + ro.number : null, status: ro ? { open: 'Open', invoiced: 'Invoiced', paid: 'Paid', void: 'Void' }[ro.status] : 'No RO yet',
            color: ro ? { open: '#fff', invoiced: YEL, paid: GRN, void: DIM }[ro.status] : DIM,
            lines: ro ? (s.roLines || []).filter((l) => l.ro_id === ro.id).map((l) => ({ id: l.id, kind: KIND[l.kind] || l.kind, description: l.description, qty: Number(l.qty) === 1 ? '' : Number(l.qty) + (l.kind === 'labor' ? ' h × ' : ' × ') + $(l.unit_cents), meta: l.kind === 'part' ? [l.part_number, l.vendor, l.cost_cents ? 'cost ' + $(l.cost_cents) : ''].filter(Boolean).join(' · ') : '', total: $((l.kind === 'discount' ? -1 : 1) * Math.round(Number(l.qty) * l.unit_cents)), pending: l.approved === false, fromFinding: !!l.finding_id, remove: l.finding_id ? null : () => this.removeLine(l.id), pstatus: l.kind === 'part' && l.status ? l.status : '', warranty: !!l.warranty })) : [],
            margin: t && t.parts && this.can('parts_cost') ? 'Parts cost ' + $(t.partsCost) + ' · margin ' + $(t.partsMargin) + ' (' + Math.round((t.partsMargin / Math.max(1, t.parts)) * 100) + '%)' : '',
            hours: (() => { const actual = this.hoursOn(sel.id), billed = t ? t.laborHours : 0; return actual || billed ? 'Labor billed ' + billed.toFixed(1) + ' h · on the clock ' + actual.toFixed(1) + ' h' + (billed && actual ? ' · ' + Math.round((billed / Math.max(0.05, actual)) * 100) + '% efficiency' : '') : ''; })(),
            rows: t ? [['Labor', $(t.labor)], ['Parts', $(t.parts)], t.supplies ? ['Shop supplies', $(t.supplies)] : null, t.fees - (t.supplies || 0) ? ['Fees', $(t.fees - (t.supplies || 0))] : null, t.discount ? ['Discount', '-' + $(t.discount)] : null, ['Subtotal', $(t.subtotal)], ['Tax · ' + ((ro.tax_rate_bp || 725) / 100).toFixed(2) + '%', $(t.tax)]].filter(Boolean) : [],
            total: t ? $(t.total) : '$0.00', pending: t && t.pending ? $(t.pending) + ' waiting on customer' : '',
            paid: ro && ro.status === 'paid' ? 'Paid ' + (ro.paid_method || '') + (ro.paid_at ? ' · ' + new Date(ro.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '') : '',
            start: !ro ? () => this.ensureRO(sel.id) : null,
            newLine: nl, openNewLine: () => this.setState({ newLine: { kind: 'labor', description: '', qty: '1', unit: s.shop && s.shop.labor_rate_cents ? (s.shop.labor_rate_cents / 100).toFixed(2) : '' } }),
            setNewLine: (p) => this.setState({ newLine: { ...(s.newLine || {}), ...p, ...(p.kind === 'labor' && s.shop && s.shop.labor_rate_cents && !(s.newLine && s.newLine.unit) ? { unit: (s.shop.labor_rate_cents / 100).toFixed(2) } : {}) } }),
            saveNewLine: () => this.addLine(sel.id, s.newLine || {}), cancelNewLine: () => this.setState({ newLine: null }),
            sendInvoice: ro && ro.status === 'open' ? () => this.setROStatus(ro.id, 'invoiced') : null,
            reopen: ro && ro.status !== 'open' && (ro.status !== 'paid' || this.can('edit_paid')) ? () => this.setROStatus(ro.id, 'open') : null,
            pay: this.can('payments') ? invoicePayVals(this, s, set, ro) : { ...invoicePayVals(this, s, set, ro), canTake: null, textToPay: null }, take: register.take,
            partStatus: { need: ['Needs ordering', YEL], ordered: ['Ordered', YEL], received: ['Received', GRN], installed: ['Installed', GRN] },
            stockOpts: partsPage.stockOpts, addFromStock: (partId, qty) => { const p = (s.parts || []).find((x) => x.id === partId); if (p) this.addPartLine(sel.id, p, qty); },
            addJob: () => set({ estId: sel.id, jobPick: sel.id, goEstimates: true }), jobs: estimateFor(sel),
            po: ro ? ro.po_number || '' : '', setPO: ro ? (v) => this.setPO(ro.id, v) : null, poRequired: !!(selCust && selCust.fleet_id && (s.fleets || []).some((f) => f.id === selCust.fleet_id && f.po_required)),
            emailReceipt: ro ? (to) => this.emailReceipt(ro.id, to) : null, email: selCust ? selCust.email || '' : '', printUrl: ro ? '/print/' + ro.id : '',
            warrantyTotal: ro ? (s.roLines || []).filter((l) => l.ro_id === ro.id && l.warranty).length : 0,
          };
        })(),
      } : null,
      newAppt: na, openNewAppt: () => set({ newAppt: { customer_id: '', vehicle_id: '', name: '', phone: '', year: '', make: '', model: '', plate: '', day: s.day, time: '09:00', visit: 'dropoff', job: '' } }),
      setNewAppt: (p) => set({ newAppt: { ...na, ...p, ...(p.customer_id !== undefined && p.customer_id !== na.customer_id ? { vehicle_id: '' } : {}) } }), cancelNewAppt: () => set({ newAppt: null }),
      saveNewAppt: () => this.addAppt(na), newApptOk: !!na && !!(na.customer_id || na.name.trim()) && !!na.day && !!na.time,
      custOpts, naCars: naCars.map((v) => ({ id: v.id, label: vehName(v) + (v.plate ? ' · ' + v.plate : '') })), times: TIMES.map((t) => ({ v: t, label: fmtTime('2000-01-01T' + t + ':00') })),
    };
  }
}

Object.assign(ShopLogic.prototype, jobMethods, partMethods, moneyMethods, commsMethods, calendarMethods, dviMethods, fleetMethods, marketingMethods, waitlistMethods);

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
