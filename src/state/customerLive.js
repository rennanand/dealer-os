// The customer app (3D car, status cards, Service page, booking) on real records.
// It runs the prototype's view-model and replaces the values that the demo invented
// with the customer's vehicles, appointments and loaners from Supabase.
import { AppLogic, ICONS as I } from './appLogic.js';
import { supabase, SUPABASE_URL } from './supabase.js';
import { dayLabel } from './agreement.js';
import { setupPush } from './push.js';
import { SAFE } from './options.js';
import { syncNativeTabs, nativeTabs } from './glassTabs.js';

const ACC = '#e0312b', RED = '#e0312b', GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';
const pill = (c) => 'display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border:1px solid ' + c + ';border-radius:4px;font-family:var(--data-font,inherit);font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;line-height:1.3;color:' + c;
const PAINTS = [['white', '#eef0f2'], ['pearl', '#eceff3'], ['black', '#0f1013'], ['silver', '#c3c8ce'], ['gray', '#8a8f95'], ['grey', '#8a8f95'], ['charcoal', '#3a3d42'], ['red', '#c8101a'], ['maroon', '#6a0f1a'], ['burgundy', '#6a0f1a'], ['blue', '#1f4fa0'], ['navy', '#15284f'], ['green', '#1f5a3a'], ['tan', '#c2b08c'], ['beige', '#c2b08c'], ['gold', '#b8923a'], ['orange', '#e0561a'], ['yellow', '#e3bd1f'], ['brown', '#5a4030'], ['bronze', '#8a6a3a'], ['teal', '#2f8a96'], ['purple', '#5a2a7a']];
const paintOf = (v) => { const t = ((v.color || '') + ' ' + (v.model || '')).toLowerCase(); const hit = PAINTS.find(([k]) => t.includes(k)); return hit ? hit[1] : '#b9bdc3'; };
const cap = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).map((w) => (/^\d/.test(w) || /[A-Z]/.test(w.slice(1)) ? w : w[0].toUpperCase() + w.slice(1))).join(' ');
const vehName = (v) => (v ? [v.year, cap(v.make), cap(v.model)].filter(Boolean).join(' ') : '');
const vehTitle = (v) => cap(v.nickname) || [cap(v.make), cap(v.model)].filter(Boolean).join(' ') || 'Your car';
const iso = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const fmtT = (ts) => (ts ? new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '');
const fmtDay = (ts) => { const d = new Date(ts), t = new Date(); const same = (a, b) => a.toDateString() === b.toDateString(); const tm = new Date(t.getTime() + 864e5); return same(d, t) ? 'Today' : same(d, tm) ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };
const when = (ts) => fmtDay(ts) + ' · ' + fmtT(ts);
const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STAGE_OF = { booked: 0, arrived: 1, in_progress: 2, done: 8 };
const VISIT = { dropoff: 'Drop off', wait: 'Wait', loaner: 'Loaner' };
const JOB_OF = { Maintenance: 'Maintenance', Tires: 'Tires', Brakes: 'Brakes', 'Something feels wrong': 'Something feels wrong', Inspection: 'Inspection', Other: 'Service' };
// Line-art 3D scene for the job once work has started; nothing is shown before check-in.
const sceneFor = (job, status) => {
  const j = (job || '').toLowerCase(), started = status === 'arrived' || status === 'in_progress' || status === 'done';
  if (!started) return { scene: '', phase: '' };
  const i = status === 'arrived' ? 0 : status === 'in_progress' ? 1 : 2;
  if (/oil|maint/.test(j)) return { scene: 'oil', phase: ['idle', 'filter', 'done'][i] };
  if (/tire|wheel|align/.test(j)) return { scene: 'tire', phase: ['on', 'off', 'new'][i] };
  if (/batter|electr|start/.test(j)) return { scene: 'battery', phase: ['rest', 'load', 'pass'][i] };
  return { scene: 'brake', phase: ['worn', 'remove', 'new'][i] };
};
const unreadCount = (live) => (live.messages || []).filter((m) => m.sender === 'advisor' && !m.read).length;
const DEMO_SHOP = { shop_id: 'ryguys', name: 'RyGuys Tire & Auto Sales', address: '204 N Main St, Manti, UT 84642', city: 'Manti, UT', phone: '4358354869', hours: 'Mon, Tue, Thu, Fri · 8:00 AM – 5:30 PM', lat: 39.2686964, lng: -111.636588, open_days: [1, 2, 4, 5], open_from: '08:00', open_to: '17:30' };
const slotsFor = (shop) => { const [fh, fm] = (shop.open_from || '08:00').split(':').map(Number), [th, tm] = (shop.open_to || '17:00').split(':').map(Number); const out = []; for (let t = fh * 60 + fm; t <= th * 60 + tm - 60; t += 30) out.push(t); return out; };
const minLabel = (m) => { const h = Math.floor(m / 60), mm = m % 60; return ((h + 11) % 12) + 1 + ':' + (mm < 10 ? '0' : '') + mm + (h >= 12 ? ' PM' : ' AM'); };

export class CustomerLive extends AppLogic {
  constructor(props) {
    super(props);
    let cached = null; try { cached = JSON.parse(localStorage.getItem('revyn.live.' + (props.userId || 'demo')) || 'null'); } catch (e) {}
    const live = cached ? { ...cached, profile: props.profile || cached.profile || null, loaded: true } : { profile: props.profile || null, vehicles: [], appointments: [], rentals: [], shops: [DEMO_SHOP], messages: [], loaded: !supabase };
    const act = cached ? this.active(live.appointments) : null;
    this.state = { ...this.state, stage: act ? STAGE_OF[act.status] || 0 : 0, loaner: 'none', readStage: 99, live, addVeh: null, noVehicle: cached ? !live.vehicles.length : false };
  }
  componentDidMount() {
    super.componentDidMount();
    if (!supabase) window.__revyn = this; // review builds only: lets a script stage a visit
    this.loadLive();
    if (!SAFE.push) setupPush(this.props.userId, (d) => { this.loadLive(); if (d && d.view) this.setState({ view: d.view }); });
    this._poll = setInterval(() => this.loadLive(), 15000);
  }
  componentDidUpdate(prev) {
    super.componentDidUpdate(prev);
    this.syncTabs();
    if (this.state.view === 'messages' && this._lastMsgView !== 'messages' && supabase && this.state.live.messages.some((m) => m.sender === 'advisor' && !m.read)) supabase.rpc('mark_my_messages_read').then(() => this.loadLive());
    this._lastMsgView = this.state.view;
  }
  syncTabs() {
    const t = this._tabsForNative; if (!t) return;
    const key = JSON.stringify([t.ids, t.selected, t.visible, t.badges]);
    if (key === this._tabsKey) return;
    this._tabsKey = key;
    syncNativeTabs(t.tabs, t.selected, t.visible, (id) => this.setState({ view: id }));
  }
  componentWillUnmount() { super.componentWillUnmount(); clearInterval(this._poll); }

  async loadLive() {
    if (!supabase) return;
    const [v, a, r, sh, m] = await Promise.all([supabase.rpc('my_vehicles'), supabase.rpc('my_appointments'), supabase.rpc('my_rentals'), supabase.rpc('shops_public'), supabase.rpc('my_messages')]);
    const live = { ...this.state.live, vehicles: v.data || [], appointments: a.data || [], rentals: r.data || [], shops: Array.isArray(sh.data) && sh.data.length ? sh.data : [DEMO_SHOP], messages: m.data || [], loaded: true };
    const act = this.active(live.appointments);
    try { localStorage.setItem('revyn.live.' + (this.props.userId || 'demo'), JSON.stringify({ vehicles: live.vehicles, appointments: live.appointments, rentals: live.rentals, shops: live.shops, messages: live.messages })); } catch (e) {}
    this.setState({ live, stage: act ? STAGE_OF[act.status] || 0 : 0, noVehicle: !live.vehicles.length });
  }
  // The visit the home card and Service page are about: the one in progress, else the next booked, else today's finished one.
  active(list) {
    const l = list || this.state.live.appointments, now = Date.now();
    return l.find((a) => a.status === 'arrived' || a.status === 'in_progress') || l.filter((a) => a.status === 'booked').sort((x, y) => x.starts_at.localeCompare(y.starts_at))[0] || l.find((a) => a.status === 'done' && now - new Date(a.done_at || a.starts_at) < 36 * 3600e3) || null;
  }

  async book(b) {
    const live = this.state.live, shop = live.shops[0] || DEMO_SHOP, v = live.vehicles[b.vIdx || 0];
    const d = new Date(b.dayIso + 'T00:00:00'); d.setMinutes(b.minutes);
    if (!supabase) { this.setState({ book: { ...b, step: 6, err: '' }, live: { ...live, appointments: live.appointments.concat({ id: 'a' + Date.now(), starts_at: d.toISOString(), job: JOB_OF[b.need] || b.need || 'Service', visit: { 'Drop off': 'dropoff', Wait: 'wait', Loaner: 'loaner' }[b.visit] || 'dropoff', status: 'booked', vehicle_id: v && v.id, notes: b.desc || '' }) } }); return; }
    const { error } = await supabase.rpc('book_appointment', { p_starts_at: d.toISOString(), p_job: JOB_OF[b.need] || b.need || 'Service', p_visit: { 'Drop off': 'dropoff', Wait: 'wait', Loaner: 'loaner' }[b.visit] || 'dropoff', p_vehicle: v ? vehName(v) : '', p_plate: v ? v.plate || '' : '', p_notes: b.desc || '', p_vehicle_id: v ? v.id : null });
    if (error) return this.setState({ book: { ...b, err: error.message } });
    this.setState({ book: { ...b, step: 6, err: '' }, toast: 'Booked for ' + fmtDay(d) + ' at ' + fmtT(d) + '. ' + shop.name.split(' ')[0] + ' sees it now.' });
    clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast: '' }), 3400);
    this.loadLive();
  }
  async decide(approve, decline) {
    const live = this.state.live;
    const mark = (f) => (approve.includes(f.id) ? { ...f, status: 'approved' } : decline.includes(f.id) ? { ...f, status: 'declined' } : f);
    const total = live.appointments.flatMap((a) => a.findings || []).filter((f) => approve.includes(f.id)).reduce((t, f) => t + f.price_cents, 0);
    this.setState({ approvedTotalCents: total, live: { ...live, appointments: live.appointments.map((a) => ({ ...a, findings: (a.findings || []).map(mark) })) }, approveAnim: true });
    if (supabase) { const { error } = await supabase.rpc('decide_findings', { p_approve: approve, p_decline: decline }); if (error) this.setState({ toast: error.message }); }
    setTimeout(() => this.setState({ approveAnim: false, approvedJust: true }), 450);
    this.loadLive();
  }
  async sendLiveMsg(text) {
    const t = (text || '').trim(); if (!t) return;
    const live = this.state.live, local = { id: 'm' + Date.now(), sender: 'customer', text: t, created_at: new Date().toISOString(), read: true };
    this.setState({ live: { ...live, messages: live.messages.concat(local) }, draft: '' });
    if (supabase) { const { error } = await supabase.rpc('send_my_message', { p_text: t }); if (error) this.setState({ toast: error.message }); else this.loadLive(); }
  }
  async setPickup(id, state) {
    const live = this.state.live;
    this.setState({ live: { ...live, appointments: live.appointments.map((a) => (a.id === id ? { ...a, pickup: state } : a)) }, pickup: state === 'on_way' ? 1 : 2 });
    if (supabase) await supabase.rpc('set_my_pickup', { p_id: id, p_state: state });
  }
  async rate(id, rt) {
    const live = this.state.live;
    this.setState({ live: { ...live, appointments: live.appointments.map((a) => (a.id === id ? { ...a, rating: rt.stars } : a)) }, rating: { ...rt, sent: true }, toast: 'Thanks' + (this.first() ? ', ' + this.first() : '') + '. Your rating went to the team.' });
    clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast: '' }), 3400);
    if (supabase) await supabase.rpc('rate_my_visit', { p_id: id, p_stars: rt.stars, p_tags: rt.tags || [], p_note: rt.note || '' });
  }
  first() { const n = (this.state.live.profile && this.state.live.profile.name) || (this.props.member && this.props.member.name) || ''; return n.split(' ')[0] || ''; }
  async acceptQuote(q, tier, hazard) {
    if (!supabase) { const live = this.state.live; this.setState({ live: { ...live, appointments: live.appointments.map((a) => (a.tire_quote && a.tire_quote.id === q.id ? { ...a, tire_quote: { ...q, status: 'accepted', accepted_tier: tier, accepted_hazard: hazard } } : a)) }, view: 'service', toast: 'Tires accepted. They go on during this visit.' }); return; }
    this.setState({ busy: true });
    const { error } = await supabase.rpc('accept_tire_quote', { p_id: q.id, p_tier: tier, p_hazard: hazard });
    this.setState({ busy: false });
    if (error) return this.setState({ toast: error.message });
    this.setState({ view: 'service', toast: 'Tires accepted. The shop has been told which set.' });
    clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast: '' }), 3400);
    this.loadLive();
  }
  async addVehicle(d) {
    if (!supabase) { const live = this.state.live; this.setState({ live: { ...live, vehicles: live.vehicles.concat({ id: 'v' + Date.now(), ...d }) }, noVehicle: false, addVeh: null, view: 'home' }); return; }
    const { error } = await supabase.rpc('add_my_vehicle', { p_year: parseInt(d.year, 10) || null, p_make: d.make, p_model: d.model, p_plate: d.plate || '', p_odometer: parseInt(String(d.odometer || '').replace(/\D/g, ''), 10) || null });
    if (error) return this.setState({ addVeh: { ...d, err: error.message } });
    this.setState({ addVeh: null, view: 'home' });
    await this.loadLive();
  }

  renderVals() {
    const V = super.renderVals();
    const s = this.state, live = s.live, view = s.view, shop = live.shops[0] || DEMO_SHOP;
    const name = (live.profile && live.profile.name) || (this.props.member && this.props.member.name) || '';
    const first = name.split(' ')[0] || '';
    const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '—';
    const hour = new Date().getHours();
    const act = this.active(), st = act ? STAGE_OF[act.status] || 0 : -1;
    const actVeh = act && live.vehicles.find((v) => v.id === act.vehicle_id);
    const openRental = live.rentals.find((r) => r.status === 'out') || live.rentals.find((r) => r.status === 'signed' || r.status === 'sent');
    const tel = shop.phone ? 'tel:' + shop.phone : '', maps = 'https://maps.apple.com/?q=' + encodeURIComponent(shop.name) + (shop.lat ? '&ll=' + shop.lat + ',' + shop.lng : '');
    const openUrl = (u) => () => { if (u) window.open(u, '_blank'); };
    const goService = this.go('service'), goBook = () => this.setState({ view: 'book', book: { ...s.book, step: 0, err: '', vIdx: 0, dayIso: '', minutes: 0, time: '' } });

    // ---- "Next due": estimates from past visits and the mileage the customer entered; never read from the car.
    const doneFor = (re) => live.appointments.filter((a) => a.status === 'done' && re.test((a.job || '').toLowerCase())).sort((x, y) => (y.done_at || y.starts_at).localeCompare(x.done_at || x.starts_at))[0];
    const lastOil = doneFor(/oil|maint/), lastTire = doneFor(/tire|rotat/);
    const bar = (pct, c) => 'height:2px;border-radius:1px;width:' + Math.round(pct) + '%;background:' + c;
    const monthsSince = (ts) => (Date.now() - new Date(ts)) / (30.4 * 864e5);
    const nextDue = [];
    if (lastOil) { const m = monthsSince(lastOil.done_at || lastOil.starts_at), pct = Math.min(100, (m / 6) * 100); nextDue.push({ name: 'Oil change', due: pct >= 100 ? 'Due now · estimated' : 'In about ' + Math.max(1, Math.round(6 - m)) + ' months · estimated', c: pct >= 100 ? YEL : DIM, bar: bar(pct, pct >= 100 ? YEL : '#fff'), go: () => this.setState({ view: 'book', book: { ...s.book, step: 0, need: 'Maintenance', err: '' } }) }); }
    if (lastTire) { const m = monthsSince(lastTire.done_at || lastTire.starts_at), pct = Math.min(100, (m / 6) * 100); nextDue.push({ name: 'Tire rotation', due: pct >= 100 ? 'Due now · estimated' : 'In about ' + Math.max(1, Math.round(6 - m)) + ' months · estimated', c: pct >= 100 ? YEL : DIM, bar: bar(pct, pct >= 100 ? YEL : '#fff'), go: () => this.setState({ view: 'book', book: { ...s.book, step: 0, need: 'Tires', err: '' } }) }); }
    if (!nextDue.length) nextDue.push({ name: 'Reminders', due: 'After your first visit', c: DIM, bar: bar(0, '#fff'), go: () => this.setState({ view: 'book', book: { ...s.book, step: 0, err: '' } }) });

    // ---- vehicles and the 3D hero
    const cars = live.vehicles.map((v) => ({ id: v.id, name: vehTitle(v), sub: [v.year, v.odometer ? v.odometer.toLocaleString('en-US') + ' mi' : 'Add your mileage', v.plate].filter(Boolean).join(' · '), paint: paintOf(v), ph: '' }));
    const vIdx = Math.min(s.vIdx || 0, Math.max(0, cars.length - 1)), car0 = cars[vIdx] || { name: 'Your car', sub: '', paint: '#b9bdc3' };
    Object.assign(V, {
      greeting: first ? (hour < 12 ? 'Good morning, ' : hour < 17 ? 'Good afternoon, ' : 'Good evening, ') + first + '.' : 'Welcome.',
      initials, hasUnread: false, myCars: cars, car0, multiCar: cars.length > 1, dots: cars.map((_, i) => ({ style: 'width:6px;height:6px;border-radius:3px;transition:background .2s ease;background:' + (i === vIdx ? '#fff' : 'rgba(235,235,245,.25)') })),
      heroPaint: cars.length ? car0.paint : V.heroPaint,
      heroStyle: view === 'home' && cars.length ? V.heroStyle.replace(/translateY\([-\d.]+px\)/, 'translateY(calc(var(--sat) + 88px))') : V.heroStyle,
      odoLabel: live.vehicles[vIdx] && live.vehicles[vIdx].odometer ? live.vehicles[vIdx].odometer.toLocaleString('en-US') + ' mi' : 'Mileage',
      goOdometer: () => { const v = live.vehicles[vIdx]; if (!v) return; const val = window.prompt('Current mileage for your ' + (v.model || 'car') + ':', v.odometer || ''); const n = parseInt(String(val || '').replace(/\D/g, ''), 10); if (n && supabase) supabase.rpc('update_my_odometer', { p_vehicle: v.id, p_odometer: n }).then(() => this.loadLive()); },
      nextDue: nextDue, showExtras: true, showPlans: false,
      shortcuts: [{ label: 'Book', d: I.plus, go: goBook }, { label: 'Service', d: I.wrench, go: goService }, { label: 'Call', d: I.phone, go: openUrl(tel) }, { label: 'Directions', d: I.car, go: openUrl(maps) }],
      goCare: null, goRewards: null, goShop: openUrl(maps), goUpdates: goService, goAccount: this.go('account'),
    });

    // ---- home card
    const kick = (k, c, t, sub, cta, go) => Object.assign(V, { homeKicker: k, homeKickerStyle: pill(c), homeTitle: t, homeSub: sub, homeCta: cta, homeGo: go, homeRings: false, homeScene: '' });
    if (!act) kick('Your car', GRN, cars.length ? 'Nothing scheduled.' : 'Add your vehicle.', cars.length ? 'Book a visit and follow it here, from check-in to pickup.' : 'Then book a visit and follow it here, from check-in to pickup.', cars.length ? 'Book a visit' : 'Add a vehicle', cars.length ? goBook : () => this.setState({ addVeh: { year: '', make: '', model: '', plate: '', odometer: '' }, view: 'addVehicle' }));
    else if (act.status === 'booked') kick('Upcoming appointment', ACC, act.job || 'Service', when(act.starts_at) + ' · ' + (VISIT[act.visit] || 'Drop off'), 'View appointment', goService);
    else if (act.status === 'arrived') { kick((act.bay ? 'Bay 0' + act.bay + ' · ' : '') + 'Checked in', ACC, act.job || 'Service', 'Checked in at ' + fmtT(act.arrived_at || act.starts_at) + '. We will let you know when work begins.', 'View Service', goService); V.homeRings = true; }
    else if (act.status === 'in_progress' && (act.findings || []).some((f) => f.status === 'pending')) { kick('Estimate ready', YEL, (() => { const n = (act.findings || []).filter((f) => f.status === 'pending').length; return 'We found ' + (n === 1 ? 'one thing' : n + ' things') + ' to review.'; })(), 'Your approval is needed before any extra work starts.', 'Review estimate', this.go('findings')); V.homeRings = true; }
    else if (act.status === 'in_progress') { kick((act.bay ? 'Bay 0' + act.bay + ' · ' : '') + 'In service', ACC, act.job || 'Service', (act.tech ? act.tech + ' started at ' : 'Work started at ') + fmtT(act.started_at) + '. We text you the moment it is ready.', 'View Service', goService); V.homeRings = true; }
    else if (act.pickup === 'here' || act.pickup === 'picked_up') kick(act.rating ? 'Thanks for visiting' : 'Picked up', GRN, act.rating ? 'See you next time.' : 'How did we do?', act.rating ? 'Your rating went to the team.' : 'Rate your visit; it goes straight to the crew.', act.rating ? 'View record' : 'Rate your visit', act.rating ? this.go('history') : () => this.setState({ view: 'rate', rating: { stars: 0, tags: [], tip: 0, note: '', sent: false } }));
    else kick('Ready for pickup', GRN, (actVeh ? actVeh.model || 'Your car' : 'Your car') + ' is ready.', (act.bay ? 'Bay 0' + act.bay + ' · ' : '') + (act.pickup === 'on_way' ? 'The desk knows you are on your way.' : 'Pay at the counter when you arrive.'), act.pickup === 'on_way' ? 'I\u2019m here' : 'I\u2019m on my way', () => this.setState({ view: 'pickup' }));
    const sc = act ? sceneFor(act.job, act.status) : { scene: '', phase: '' };
    if (act && (act.status === 'arrived' || act.status === 'in_progress')) { V.homeScene = sc.scene; V.homeScenePhase = sc.phase; }

    // ---- Service page
    const stages = act ? [
      { name: 'Appointment booked', t: when(act.starts_at), d: (act.job || 'Service') + ' at ' + shop.name.split(' ').slice(0, 2).join(' ') + '.' , at: 0 },
      { name: 'Vehicle checked in', t: fmtT(act.arrived_at), d: 'Your vehicle has arrived at the shop.', at: 1 },
      { name: 'Work started', t: fmtT(act.started_at), d: (act.tech ? act.tech + ' is working on your vehicle.' : 'A technician is working on your vehicle.') + (act.notes ? ' Note: ' + act.notes : ''), at: 2 },
      { name: 'Service complete', t: fmtT(act.done_at), d: 'Your vehicle is ready. Pay at the counter when you arrive.', at: 8 },
    ] : [];
    const cur = act ? STAGE_OF[act.status] : -1;
    const rings = act ? [
      { name: 'Check-in', r: 52, color: '#fff', pct: cur >= 1 ? 1 : 0, sub: cur >= 1 ? 'Arrived ' + fmtT(act.arrived_at) : 'At arrival' },
      { name: 'Service', r: 40, color: '#ff9f0a', pct: cur >= 8 ? 1 : cur >= 2 ? 0.5 : 0, sub: cur >= 8 ? 'Done ' + fmtT(act.done_at) : cur >= 2 ? 'Since ' + fmtT(act.started_at) : 'After check-in' },
      { name: 'Pickup', r: 28, color: GRN, pct: cur >= 8 ? 1 : 0, sub: cur >= 8 ? 'Ready · pay at counter' : 'We text you' },
    ] : [];
    const mkRing = (d, mini) => { const circ = 2 * Math.PI * d.r, shown = mini || s.ringsIn ? d.pct : 0; return { r: d.r, name: d.name, sub: d.sub, color: d.color, pctLabel: Math.round(d.pct * 100) + '%', dot: 'width:' + (mini ? 7 : 8) + 'px;height:' + (mini ? 7 : 8) + 'px;border-radius:4px;flex:0 0 auto;background:' + d.color, track: 'fill:none;stroke:rgba(235,235,245,.08);stroke-width:8', bar: 'fill:none;stroke:' + d.color + ';stroke-width:8;stroke-linecap:round;stroke-dasharray:' + circ + ';stroke-dashoffset:' + (circ * (1 - shown)) + ';transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)' }; };
    const icon = (fg, bg) => 'width:52px;height:52px;border-radius:26px;background:' + bg + ';color:' + fg + ';display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:500';
    const started = !!act && cur >= 1;
    const tq = act && act.tire_quote;
    const findings = (act && act.findings) || [], photos = (act && act.photos) || [];
    const pending = findings.filter((f) => f.status === 'pending'), approved = findings.filter((f) => f.status === 'approved' || f.status === 'done');
    const photoUrl = (p) => p.local || (SUPABASE_URL + '/storage/v1/object/public/visit-photos/' + p.path);
    const phStyle = (p) => (p ? 'background:#151517 url(' + photoUrl(p) + ') center/cover' : 'background:radial-gradient(ellipse at 50% 62%,#2b2b30 0%,#151517 58%,#0b0b0c 100%)');
    const fmtC = (c) => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const TIER = { now: 'Recommended now', soon: 'Recommended soon', monitor: 'Monitor' }, TCOL = { now: RED, soon: YEL, monitor: GRN };
    const needsApproval = pending.length > 0;
    const sel = s.planSel || {};
    const planOn = (f) => (sel[f.id] === undefined ? f.tier !== 'monitor' : sel[f.id]);
    const planTotal = pending.filter(planOn).reduce((a, f) => a + f.price_cents, 0);
    const loanerCard = openRental ? { d: I.swap, iconStyle: icon(openRental.status === 'out' ? ACC : openRental.status === 'signed' ? GRN : YEL, 'rgba(235,235,245,.1)'), k: 'Your loaner', kColor: openRental.status === 'out' ? ACC : openRental.status === 'signed' ? GRN : YEL, t: openRental.vehicle || 'Loaner', sub: openRental.status === 'out' ? 'Due back ' + dayLabel(openRental.end_date) + '.' : openRental.status === 'signed' ? 'Signed · keys at the desk.' : 'Agreement ready to review and sign.', cta: openRental.status === 'sent' ? 'Review and sign' : 'Open', go: () => { window.location.assign('/rental/' + openRental.token + '?app=1'); } }
      : act && act.visit === 'loaner' && cur < 8 ? { d: I.swap, iconStyle: icon('#fff', 'rgba(235,235,245,.12)'), k: 'Loaner', kColor: DIM, t: 'Loaner requested', sub: 'The shop confirms a loaner at check-in; the agreement arrives here to sign.', cta: 'Call the shop', go: openUrl(tel) }
      : act && cur < 8 ? { d: I.swap, iconStyle: icon('#fff', 'rgba(235,235,245,.12)'), k: 'Loaner', kColor: DIM, t: 'Need a ride?', sub: 'Ask at check-in. The agreement comes to this app to sign, no paperwork at the desk.', cta: 'Call the shop', go: openUrl(tel) } : null;
    const svcCards = act ? [
      { scene: started && cur < 8 ? sc.scene : '', phase: sc.phase, d: cur >= 8 ? I.check : cur === 0 ? I.clock : I.wrench, iconStyle: icon(cur >= 8 ? GRN : ACC, cur >= 8 ? 'rgba(48,209,88,.14)' : 'rgba(224,49,43,.16)'), k: cur >= 8 ? 'Ready for pickup' : cur >= 2 ? 'In service' : cur >= 1 ? 'Checked in' : 'Appointment', kColor: cur >= 8 ? GRN : ACC,
        t: act.job || 'Service', sub: cur >= 8 ? (act.bay ? 'Bay 0' + act.bay + ' · ' : '') + 'Pay at the counter when you arrive.' : cur >= 1 ? (act.bay ? 'Bay 0' + act.bay + ' · ' : '') + 'Status is updated by the shop as your car moves through the day.' : when(act.starts_at) + ' · ' + (VISIT[act.visit] || 'Drop off'), cta: cur === 0 ? 'Cancel visit' : cur >= 8 ? 'Directions' : 'Call the shop', go: cur === 0 ? () => supabase && supabase.rpc('cancel_my_appointment', { p_id: act.id }).then(() => { this.loadLive(); this.setState({ view: 'home' }); }) : cur >= 8 ? openUrl(maps) : openUrl(tel) },
      findings.length ? { d: I.doc, iconStyle: icon(needsApproval ? YEL : '#fff', needsApproval ? 'rgba(255,214,10,.14)' : 'rgba(235,235,245,.12)'), k: needsApproval ? 'Estimate ready' : 'Inspection', kColor: needsApproval ? YEL : DIM, t: needsApproval ? 'We found ' + (pending.length === 1 ? 'one thing' : pending.length + ' things') + ' to review.' : findings.length + (findings.length === 1 ? ' finding' : ' findings') + ' on this visit.', sub: needsApproval ? 'Your approval is needed before any extra work starts.' : approved.length ? approved.length + ' approved · ' + fmtC(approved.reduce((a, f) => a + f.price_cents, 0)) + ' due at the counter.' : 'Nothing approved beyond the booked service.', cta: needsApproval ? 'Review estimate' : 'Inspection report', go: this.go('findings') }
        : { d: I.doc, iconStyle: icon(started ? '#fff' : DIM, 'rgba(235,235,245,.12)'), k: 'Inspection', kColor: DIM, t: started ? 'Nothing extra so far.' : 'After check-in', sub: started ? 'If the technician finds anything beyond ' + (act.job || 'the booked service').toLowerCase() + ', it shows up here with a price for you to approve.' : 'A technician looks the car over at the start of the visit; anything extra shows up here with a price for you to approve.', cta: '', go: null },
      photos.length ? { d: I.camera, iconStyle: icon('#fff', 'rgba(235,235,245,.12)'), k: 'Photos', kColor: DIM, t: photos.length + (photos.length === 1 ? ' photo' : ' photos') + ' from your technician', sub: photos[photos.length - 1].caption || 'Taken at the visit.', cta: 'See photos', go: this.go('photos') }
        : { d: I.camera, iconStyle: icon(DIM, 'rgba(235,235,245,.1)'), k: 'Photos', kColor: DIM, t: 'Photos from your technician', sub: started ? 'Added by the shop during the visit when there is something to show you.' : 'Taken during the visit when there is something to show you.', cta: '', go: null },
      { d: I.dollar, iconStyle: icon(cur >= 8 ? GRN : '#fff', cur >= 8 ? 'rgba(48,209,88,.14)' : 'rgba(235,235,245,.12)'), k: cur >= 8 ? 'Payment due' : 'Payment', kColor: cur >= 8 ? GRN : DIM, t: cur >= 8 ? 'Pay at the counter' : approved.length ? fmtC(approved.reduce((a, f) => a + f.price_cents, 0)) + ' approved' : 'Nothing charged yet', sub: cur >= 8 ? (approved.length ? fmtC(approved.reduce((a, f) => a + f.price_cents, 0)) + ' in approved work, plus the booked service. ' : '') + 'Card or cash at pickup.' : approved.length ? 'Plus the booked service. Pay at the counter at pickup.' : 'You approve any work beyond the booked service before it starts. Pay at the counter at pickup.', cta: '', go: null },
      tq ? { d: I.tire, iconStyle: icon(tq.status === 'accepted' ? GRN : YEL, tq.status === 'accepted' ? 'rgba(48,209,88,.14)' : 'rgba(255,214,10,.14)'), k: 'Tires', kColor: tq.status === 'accepted' ? GRN : YEL, t: tq.status === 'accepted' ? '4\u00d7 ' + ((tq.options || []).find((o) => o.tier === tq.accepted_tier) || {}).name : 'Tire quote ready', sub: tq.status === 'accepted' ? 'Added to this visit · ' + fmtC(tq.total_cents || 0) + ' installed, settled at the counter.' : (tq.options || []).length + ' options' + (tq.size ? ' · ' + tq.size : '') + '. Pick the set you want.', cta: tq.status === 'accepted' ? 'View' : 'See quote', go: this.go('tires') } : null,
      loanerCard,
      { txt: shop.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), iconStyle: icon('#fff', 'rgba(235,235,245,.12)').replace('font-size:20px', 'font-size:14px;letter-spacing:.4px'), k: 'Shop', kColor: DIM, t: shop.name, sub: shop.address + (shop.hours ? ' · ' + shop.hours : ''), cta: 'Text the shop', go: openUrl(shop.phone ? 'sms:' + shop.phone : '') },
    ].filter(Boolean).map((c) => Object.assign(c, { noScene: !c.scene })) : [];
    const cardIdx = Math.min(s.cardIdx, Math.max(0, svcCards.length - 1));
    const arrow = (on) => 'width:30px;height:30px;border-radius:15px;background:rgba(255,255,255,.09);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:300;cursor:pointer;transition:opacity .2s ease;color:rgba(235,235,245,.8);opacity:' + (on ? 1 : 0.25);
    Object.assign(V, {
      svcCarName: actVeh ? actVeh.model || vehName(actVeh) : car0.name, svcCarSub: actVeh ? [actVeh.year, actVeh.make].filter(Boolean).join(' ') : (live.vehicles[vIdx] ? [live.vehicles[vIdx].year, live.vehicles[vIdx].make].filter(Boolean).join(' ') : ''),
      noService: !act, hasService: !!act, pService: view === 'service' && !!act, pServiceEmpty: view === 'service' && !act, showRings: started,
      svcKicker: !act ? '' : cur === 0 ? 'Appointment ' + when(act.starts_at) : cur >= 8 ? 'Ready for pickup' : cur >= 2 ? 'Service in progress' : 'Checked in',
      svcKickerStyle: 'margin-top:10px;' + pill(cur >= 8 ? GRN : cur >= 1 ? ACC : '#fff'),
      svcAction: '', svcActionTitle: '', svcActionSub: '', svcActionGo: null,
      rings: rings.map((d) => mkRing(d, false)), ringsMini: rings.map((d) => mkRing(d, true)), statusPct: act ? Math.round((rings.reduce((a, r) => a + r.pct, 0) / 3) * 100) : 0, ringCenter: !act ? '—' : cur >= 8 ? 'Done' : cur >= 2 ? '2/3' : cur >= 1 ? '1/3' : '—',
      svcCards, cardCounter: svcCards.length ? (cardIdx + 1) + ' of ' + svcCards.length : '', cardPrevStyle: arrow(cardIdx > 0), cardNextStyle: arrow(cardIdx < svcCards.length - 1),
      timeline: stages.map((x, i) => { const done = cur > x.at, now = cur === x.at; return { name: x.name, time: done || now ? x.t : '', desc: done || now ? x.d : '', color: now ? '#fff' : done ? 'rgba(235,235,245,.7)' : 'rgba(235,235,245,.3)', dotStyle: now ? 'width:11px;height:11px;border-radius:6px;background:' + ACC + ';box-shadow:0 0 0 4px rgba(224,49,43,.22);transition:all .3s ease' : 'width:7px;height:7px;border-radius:4px;margin:2px;transition:all .3s ease;background:' + (done ? 'rgba(235,235,245,.5)' : 'rgba(235,235,245,.2)'), lineStyle: i === stages.length - 1 ? 'display:none' : 'flex:1;width:1px;margin-top:6px;min-height:22px;background:' + (done ? 'rgba(235,235,245,.22)' : 'rgba(235,235,245,.09)') }; }),
      loanerRow: false, goMessages: openUrl(shop.phone ? 'sms:' + shop.phone : ''),
      pFindings: view === 'findings', pPhotos: view === 'photos', pApprove: view === 'approve',
      needsApproval, goApprove: this.go('approve'), goPhotos: this.go('photos'), findingsSub: 'What your technician noted on ' + (actVeh ? actVeh.model || 'your car' : 'your car') + (pending.length ? '. Tap an item for the details, then review the plan.' : '.'),
      findingGroups: ['now', 'soon', 'monitor'].map((t) => ({ tier: TIER[t], items: findings.filter((f) => f.tier === t).map((f) => { const ph = photos.find((p) => p.finding_id === f.id); return { name: f.name, price: f.price_cents ? fmtC(f.price_cents) : 'No charge', plain: f.plain || '', tech: f.tech || '', meas: f.meas || '—', measLabel: f.meas_label || 'Measured at the visit', urgency: f.urgency || '', wait: f.wait_text || '', photos: ph ? '1 photo' : '', ph: phStyle(ph), open: s.exp === f.id, toggle: () => this.setState({ exp: s.exp === f.id ? '' : f.id }), dot: 'width:8px;height:8px;border-radius:4px;flex:0 0 auto;background:' + TCOL[t], chev: 'display:flex;color:rgba(235,235,245,.3);transition:transform .25s ease;transform:rotate(' + (s.exp === f.id ? '90deg' : '0') + ')', status: f.status }; }) })).filter((g) => g.items.length),
      photoThumbs: photos.slice(0, 6).map((p) => ({ meas: p.meas || p.caption || '', ph: phStyle(p) })),
      photos: photos.map((p) => ({ meas: p.meas || '', ph: phStyle(p), marked: false })),
      photo: photos.length ? (() => { const p = photos[Math.min(s.photoIdx, photos.length - 1)], f = findings.find((x) => x.id === p.finding_id); return { cat: f ? f.name : p.caption || 'Technician photo', meas: p.meas || '', rec: f ? TIER[f.tier] : '', note: p.caption || (f ? f.plain : ''), shot: 'Technician photo · ' + new Date(p.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }), dot: 'width:8px;height:8px;border-radius:4px;flex:0 0 auto;background:' + (f ? TCOL[f.tier] : DIM) }; })() : { cat: 'No photos yet', meas: '', rec: '', note: '', shot: '', dot: '' },
      photoCount: photos.length ? Math.min(s.photoIdx + 1, photos.length) + ' of ' + photos.length : '',
      photoDots: photos.map((p, i) => ({ style: 'width:' + (i === s.photoIdx ? '16px' : '5px') + ';height:5px;border-radius:3px;transition:all .25s ease;background:' + (i === s.photoIdx ? 'rgba(235,235,245,.85)' : 'rgba(235,235,245,.25)') })),
      planItems: pending.map((f) => { const on = planOn(f); return { tier: TIER[f.tier], name: f.name, price: f.price_cents ? fmtC(f.price_cents) : 'No charge', on, toggle: () => this.setState({ planSel: { ...sel, [f.id]: !on } }), style: 'background:rgba(255,255,255,.065);backdrop-filter:blur(22px) saturate(170%);-webkit-backdrop-filter:blur(22px) saturate(170%);border-radius:20px;border:1px solid rgba(255,255,255,.11);box-shadow:inset 0 1px 0 rgba(255,255,255,.13);padding:15px 16px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:background .2s ease;' + (on ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);' : ''), box: 'width:22px;height:22px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;transition:all .2s ease;' + (on ? 'background:' + ACC + ';color:#fff;' : 'border:1px solid rgba(235,235,245,.25);color:transparent;') }; }),
      approveTotal: fmtC(s.approvedJust || s.approveAnim ? s.approvedTotalCents || 0 : planTotal), approveTax: 'the counter', approvedSub: 'The shop has been told which items to go ahead with. Anything you left unchecked is skipped.',
      notApproved: !s.approveAnim && !s.approvedJust && pending.length > 0, approvedNow: s.approveAnim || s.approvedJust || (!pending.length && approved.length > 0),
      approve: () => this.decide(pending.filter(planOn).map((f) => f.id), pending.filter((f) => !planOn(f)).map((f) => f.id)),
      goService: () => this.setState({ view: 'service', approvedJust: false, planSel: {} }),
    });

    // ---- booking on the shop's real calendar
    const b = s.book, openDays = shop.open_days || [1, 2, 3, 4, 5], slots = slotsFor(shop);
    const days = []; for (let i = 0; i < 21 && days.length < 10; i++) { const t = new Date(); t.setDate(t.getDate() + i); if (openDays.includes(t.getDay())) days.push(t); }
    const bDay = b.dayIso || iso(days[0] || new Date()), bDate = new Date(bDay + 'T00:00:00');
    const setB = (p) => this.setState({ book: { ...b, ...p } });
    const veh = live.vehicles[b.vIdx || 0];
    Object.assign(V, {
      bookDays: days.map((t) => ({ label: fmtDay(t) === 'Today' || fmtDay(t) === 'Tomorrow' ? fmtDay(t) : DOWS[t.getDay()] + ' ' + t.getDate(), pick: () => setB({ dayIso: iso(t), minutes: 0, time: '', err: '' }), style: this.chip(iso(t) === bDay) })),
      bookSlots: slots.filter((m) => { const d = new Date(bDate); d.setMinutes(m); return d > new Date(); }).map((m) => ({ label: minLabel(m), pick: () => setB({ dayIso: bDay, minutes: m, time: minLabel(m), err: '' }), style: 'padding:14px 0;border-radius:11px;text-align:center;font-size:12.5px;cursor:pointer;transition:all .2s ease;' + (b.minutes === m && b.time ? 'background:#fff;color:#000;' : 'background:rgba(255,255,255,.09);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09);color:rgba(235,235,245,.85);') })),
      bookSub: ['Pick the closest thing. Not sure is fine too.', 'We will have its history ready.', 'In your own words. The technician reads this before you arrive.', 'Open ' + openDays.map((n) => DOWS[n]).join(', ') + '.', 'How you would like to handle the visit.', 'Nothing is charged now. Pay at the counter.'][b.step] || '',
      bookWhen: fmtDay(bDate) + ' · ' + (b.time || '—'),
      visitTypes: [['Drop off', 'Leave it with us, we text when it is ready'], ['Wait', 'Lounge with Wi-Fi, most visits under an hour'], ['Loaner', 'Ask for a loaner; the shop confirms at check-in']].map((v) => ({ name: v[0], sub: v[1], pick: () => setB({ visit: v[0], err: '' }), style: V.visitTypes[0].style.replace(/background:[^;]+;/, b.visit === v[0] ? 'background:rgba(255,255,255,.09);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09);' : 'background:transparent;'), radio: (V.visitTypes.find((x) => x.name === v[0]) || V.visitTypes[0]).radio })),
      bookSummary: [{ k: 'When', v: fmtDay(bDate) + ' · ' + (b.time || '—') }, { k: 'Vehicle', v: veh ? vehName(veh) : 'Add a vehicle' }, { k: 'Service', v: JOB_OF[b.need] || b.need || 'Service' }, { k: 'Concern', v: b.desc || '—' }, { k: 'Visit', v: b.visit || '—' }],
      bookVehicles: live.vehicles.map((v, i) => ({ label: vehName(v), sub: v.plate || '', pick: () => setB({ vIdx: i }), on: (b.vIdx || 0) === i })),
      bookNext: () => {
        if (b.step === 0 && !b.need) return setB({ err: 'Pick what your vehicle needs. "Something feels wrong" is fine.' });
        if (b.step === 1 && !veh) return this.setState({ addVeh: { year: '', make: '', model: '', plate: '', odometer: '', back: 'book' }, view: 'addVehicle' });
        if (b.step === 3 && !b.time) return setB({ err: 'Choose a time.' });
        if (b.step === 4 && !b.visit) return setB({ err: 'Choose how you would like to handle the visit.' });
        if (b.step === 5) { this.book({ ...b, dayIso: bDay }); return; }
        setB({ step: b.step + 1, err: '' });
      },
      bookCar: veh ? vehName(veh) : '', bookDoneTitle: 'You are booked.', bookDoneSub: 'We text you the day before. Your visit is on the home screen whenever you want to check on it.',
    });

    // ---- tire quote on the active visit
    const tqSel = s.tqSel || {};
    const tqTier = tq ? (tq.status === 'accepted' ? tq.accepted_tier : tqSel.tier || tq.recommended) : '';
    const tqHaz = tq ? (tq.status === 'accepted' ? !!tq.accepted_hazard : tqSel.hazard === undefined ? !!tq.hazard_offered : tqSel.hazard) : false;
    const tqOpt = tq ? (tq.options || []).find((o) => o.tier === tqTier) || (tq.options || [])[0] : null;
    const tqCalc = (o) => { const tires = (o.each_cents || 0) * 4, fees = (tq.fee_cents || 0) * 4, haz = tqHaz ? Math.round(tires * 0.12) : 0; return { tires, fees, haz, total: tires + fees + haz }; };
    const tqC = tqOpt ? tqCalc(tqOpt) : { tires: 0, fees: 0, haz: 0, total: 0 };
    const tqLocked = !tq || tq.status !== 'sent';
    const TIERL = { good: 'Good', better: 'Better', best: 'Best' };
    const radioS = (on) => 'width:18px;height:18px;border-radius:9px;transition:all .2s ease;' + (on ? 'background:#fff;box-shadow:inset 0 0 0 5px #000,0 0 0 1px #fff' : 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.3)');
    Object.assign(V, {
      pTires: view === 'tires' && !!tq, goTires: this.go('tires'), tqSize: tq ? tq.size || '' : '',
      tqPill: pill(tq && tq.status === 'accepted' ? GRN : YEL), tqStatus: tq ? (tq.status === 'accepted' ? 'Accepted' : 'Quote from ' + shop.name.split(' ')[0]) : '',
      tqTitle: tq ? (tq.status === 'accepted' ? 'New tires are on the way.' : (tq.options || []).length + ' options for ' + (actVeh ? actVeh.model || 'your car' : 'your car') + '.') : '',
      tqSub: tq ? (tq.status === 'accepted' ? '4\u00d7 ' + (tqOpt ? tqOpt.name : '') + ', installed during this visit. Nothing is charged until they are on the car.' : (tq.tread ? tq.tread + '. ' : '') + (tq.size ? 'Size ' + tq.size + '. ' : '') + 'Pick a set; mounting, balancing, TPMS and disposal are included. Tax at the counter.') : '',
      tqOpts: tq ? (tq.options || []).map((o) => { const on = o.tier === tqTier, c = tqCalc(o); return { name: o.name, tier: TIERL[o.tier] || o.tier, warranty: o.warranty || '', stock: o.stock || '', note: o.note || '', total: '$' + Math.round(c.total / 100).toLocaleString('en-US'), stockColor: /in stock/i.test(o.stock || '') ? GRN : YEL, radio: radioS(on) + ';flex:0 0 auto;margin-top:1px', pick: () => { if (!tqLocked) this.setState({ tqSel: { ...tqSel, tier: o.tier } }); } }; }) : [],
      tqHazardPrice: tqOpt ? '$' + Math.round(((tqOpt.each_cents || 0) * 4 * 0.12) / 100).toLocaleString('en-US') + ' for the set.' : '',
      tqToggleHazard: () => { if (!tqLocked) this.setState({ tqSel: { ...tqSel, hazard: !tqHaz } }); },
      tqHazTrack: 'width:44px;height:26px;border-radius:13px;padding:2px;flex:0 0 auto;transition:background .2s ease;background:' + (tqHaz ? GRN : 'rgba(235,235,245,.18)'), tqHazKnob: 'width:22px;height:22px;border-radius:11px;background:#fff;transition:transform .2s ease;transform:translateX(' + (tqHaz ? 18 : 0) + 'px)',
      tqRows: tqOpt ? [{ k: '4 tires · $' + Math.round((tqOpt.each_cents || 0) / 100) + ' each', v: '$' + Math.round(tqC.tires / 100).toLocaleString('en-US') }, { k: 'Mount, balance, TPMS, disposal', v: '$' + Math.round(tqC.fees / 100).toLocaleString('en-US') }].concat(tqHaz ? [{ k: 'Road hazard', v: '$' + Math.round(tqC.haz / 100).toLocaleString('en-US') }] : []).concat([{ k: 'Tax', v: 'At the counter' }]) : [],
      tqScene: tq && tq.status === 'accepted' ? (cur >= 8 ? 'new' : 'off') : 'on',
      tqTotal: fmtC(tqC.total), tqCta: !tq ? '' : tq.status === 'accepted' ? 'Accepted · ' + fmtC(tqC.total) : s.busy ? 'Sending\u2026' : 'Accept · ' + fmtC(tqC.total),
      tqCtaStyle: 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (tqLocked ? 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;' : 'background:#fff;color:#000;cursor:pointer;'),
      tqAccept: () => { if (!tqLocked && tqOpt) this.acceptQuote(tq, tqOpt.tier, tqHaz); },
    });
    if (tq && tq.status === 'sent' && act.status !== 'done') kick('Tire quote ready', YEL, (tq.options || []).length + ' options for ' + (actVeh ? actVeh.model || 'your car' : 'your car') + '.', 'From ' + shop.name.split(' ')[0] + (tq.size ? ' · ' + tq.size : '') + ' · ' + (TIERL[tq.recommended] || '') + ' recommended', 'See quote', this.go('tires'));

    // ---- pickup and rating for the finished visit
    const doneAct = act && act.status === 'done' ? act : null;
    const pk = doneAct ? (doneAct.pickup === 'here' || doneAct.pickup === 'picked_up' ? 2 : doneAct.pickup === 'on_way' ? 1 : 0) : 0;
    const rt = s.rating || { stars: 0, tags: [], tip: 0, note: '', sent: false };
    const setRt = (p) => this.setState({ rating: { ...rt, ...p } });
    const STAR_LABELS = ['Tap a star', 'Not great', 'Could be better', 'Good', 'Great', 'Outstanding'];
    Object.assign(V, {
      pPickup: view === 'pickup' && !!doneAct, pickup0: pk === 0, pickup1: pk === 1, pickup2: pk === 2, pickupDone: false, pickupLoaner: !!openRental && openRental.status === 'out',
      pickupTitle: doneAct ? (actVeh ? actVeh.model || 'Your car' : 'Your car') + ' is ready.' : '', pickupSub: doneAct ? (doneAct.bay ? 'Parked by Bay 0' + doneAct.bay + '. ' : '') + 'Pay at the counter. Let us know when you are on your way.' : '',
      pickupBayLabel: doneAct ? 'Ready for pickup' + (doneAct.bay ? ' · Bay 0' + doneAct.bay : '') : '', pickupBay: doneAct && doneAct.bay ? 'Bay 0' + doneAct.bay : 'Front lot', pickupHours: shop.hours || '', pickupPay: approved.length ? fmtC(approved.reduce((t, f) => t + f.price_cents, 0)) + ' + service · at the counter' : 'At the counter',
      pickupHereSub: 'The desk has been told you are here. Head inside and they will bring the keys.',
      onMyWay: () => doneAct && this.setPickup(doneAct.id, 'on_way'), imHere: () => doneAct && this.setPickup(doneAct.id, 'here'), goLoanerReturn: openRental ? () => { window.location.assign('/rental/' + openRental.token + '?app=1'); } : null,
      goRate: () => this.setState({ view: 'rate', rating: { stars: 0, tags: [], tip: 0, note: '', sent: false } }),
      pRate: view === 'rate' && !!doneAct, rateSent: rt.sent, rateOpen: !rt.sent,
      rateSub: doneAct ? (doneAct.job || 'Service') + (doneAct.tech ? ' · ' + doneAct.tech : '') + ' · ' + fmtDay(doneAct.done_at || doneAct.starts_at) : '', ratePlaceholder: 'Anything else? The team reads these.',
      stars: [1, 2, 3, 4, 5].map((i) => ({ pick: () => setRt({ stars: i }), style: 'cursor:pointer;transition:transform .15s ease;transform:scale(' + (i <= rt.stars ? 1.1 : 1) + ')', path: i <= rt.stars ? 'fill:#ffd60a;stroke:#ffd60a;stroke-width:1.2px;stroke-linejoin:round' : 'fill:none;stroke:rgba(235,235,245,.3);stroke-width:1.4px;stroke-linejoin:round' })),
      starLabel: STAR_LABELS[rt.stars], rateTags: ['Clear photos', 'Fair price', 'Fast', 'Kept me updated', 'Clean car', 'Loaner was easy'].map((t) => { const on = rt.tags.indexOf(t) >= 0; return { label: t, pick: () => setRt({ tags: on ? rt.tags.filter((x) => x !== t) : rt.tags.concat(t) }), style: this.chip(on) }; }),
      tips: [], rateNote: rt.note, onRateNote: (e) => setRt({ note: e.target.value }), rateCta: 'Send rating', rateCtaStyle: 'margin-top:20px;text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (rt.stars ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      sendRating: () => { if (rt.stars && doneAct) this.rate(doneAct.id, rt); }, rateThanks: 'Your ' + rt.stars + '-star rating went to ' + (doneAct && doneAct.tech ? doneAct.tech + ' and the team.' : 'the team.'),
      // Account
      toastFrom: shop.name.split(' ')[0], accountFoot1: 'Revyn · ' + shop.address, accountFoot2: shop.hours || '', accountName: name || 'Your account', accountSub: [live.profile && live.profile.phone ? '(' + live.profile.phone.slice(0, 3) + ') ' + live.profile.phone.slice(3, 6) + '-' + live.profile.phone.slice(6) : '', shop.city || ''].filter(Boolean).join(' · '),
      accountRows: [{ t: 'Vehicles', d: I.car, v: String(cars.length), go: this.go('garage') }, { t: 'Service history', d: I.clock, v: live.appointments.filter((a) => a.status === 'done').length + ' visits', go: this.go('history') }, { t: 'Messages', d: I.message, v: unreadCount(live) ? unreadCount(live) + ' unread' : '', go: this.go('messages') }, { t: 'Mobile number', d: I.phone, v: live.profile && live.profile.phone ? '(' + live.profile.phone.slice(0, 3) + ') ' + live.profile.phone.slice(3, 6) + '-' + live.profile.phone.slice(6) : 'Add', go: () => { if (window.confirm('Change the mobile number on this account? You will be asked for the new one.')) { if (supabase) supabase.from('customer_profiles').update({ phone: '' }).eq('user_id', this.props.userId).then(() => window.location.reload()); } } }, { t: 'Shop', d: I.home, v: shop.name, go: this.go('shop') }], signOutNow: () => { if (window.confirm('Sign out of Revyn on this phone?')) this.props.signOut && this.props.signOut(); },
    });

    // ---- messages with the shop
    const msgs = live.messages || [], unread = msgs.filter((m) => m.sender === 'advisor' && !m.read).length;
    const fmtMsgTime = (ts) => { const d = new Date(ts); return (d.toDateString() === new Date().toDateString() ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ') + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); };
    Object.assign(V, {
      hasUnread: unread > 0, goUpdates: this.go('messages'),
      msgs: msgs.map((m, i) => { const me = m.sender === 'customer'; return { text: m.text, time: fmtMsgTime(m.created_at), who: !me && (i === 0 || msgs[i - 1].sender === 'customer') ? shop.name.split(' ')[0] + ' · Service desk' : '', wrap: 'display:flex;flex-direction:column;align-items:' + (me ? 'flex-end' : 'flex-start') + ';max-width:84%;align-self:' + (me ? 'flex-end' : 'flex-start'), bubble: 'padding:10px 14px;border-radius:18px;font-size:13.5px;line-height:1.45;' + (me ? 'background:#fff;color:#000;border-bottom-right-radius:5px' : 'background:rgba(255,255,255,.09);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09);color:#fff;border-bottom-left-radius:5px'), timeStyle: 'font-size:10px;color:rgba(235,235,245,.3);margin:4px 10px 0' }; }),
      quickReplies: msgs.length ? [] : [{ text: 'When will my car be ready?', send: () => this.sendLiveMsg('When will my car be ready?') }, { text: 'Can I get a loaner?', send: () => this.sendLiveMsg('Can I get a loaner for this visit?') }],
      draft: s.draft || '', onDraft: (e) => this.setState({ draft: e.target.value }), onDraftKey: (e) => { if (e.key === 'Enter') this.sendLiveMsg(s.draft); }, sendDraft: () => this.sendLiveMsg(s.draft),
      msgsSub: (actVeh ? (actVeh.model || 'Your car') + ' · ' : '') + shop.name.split(' ')[0] + ' service desk', goMessages: this.go('messages'), msgPlaceholder: 'Message ' + shop.name.split(' ')[0],
    });

    // ---- history: finished visits, with what was approved and the photos
    const histSrc = live.appointments.filter((a) => a.status === 'done').sort((x, y) => (y.done_at || y.starts_at).localeCompare(x.done_at || x.starts_at));
    const histOf = (a) => { const v = live.vehicles.find((x) => x.id === a.vehicle_id), fs = a.findings || [], appr = fs.filter((f) => f.status === 'approved' || f.status === 'done'), total = appr.reduce((t, f) => t + f.price_cents, 0); return { id: a.id, date: new Date(a.done_at || a.starts_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), title: a.job || 'Service', total: total / 100, miles: v && v.odometer ? v.odometer.toLocaleString('en-US') : '—', tech: a.tech ? a.tech : '—', pay: 'Paid at the counter', lines: [{ k: a.job || 'Service', v: 'At the counter' }].concat(appr.map((f) => ({ k: f.name, v: f.price_cents ? fmtC(f.price_cents) : 'No charge' }))), parts: [], photos: (a.photos || []).map((p) => ({ t: p.caption || p.meas || 'Technician photo', ph: phStyle(p) })), recs: fs.filter((f) => f.status === 'declined' || f.status === 'pending').map((f) => ({ t: f.name + (f.urgency ? ' — ' + f.urgency : '') })), notes: a.notes || fs.map((f) => f.tech).filter(Boolean).join(' ') || 'No notes from the technician on this visit.' }; };
    const hdSrc = histSrc.find((a) => a.id === s.histId) || histSrc[0];
    const hd = hdSrc ? histOf(hdSrc) : null;
    Object.assign(V, {
      pHistory: view === 'history' && histSrc.length > 0, pHistoryEmpty: view === 'history' && !histSrc.length, pHistDetail: view === 'histDetail' && !!hd,
      histItems: histSrc.map((a) => { const h = histOf(a); return { date: h.date, title: h.title, total: h.total ? fmtC(h.total * 100) + ' extra' : 'At the counter', miles: h.miles, tech: h.tech, open: () => this.setState({ histId: a.id, view: 'histDetail' }) }; }),
      hd: hd ? { ...hd, totalLabel: hd.total ? fmtC(hd.total * 100) + ' in approved work' : 'Paid at the counter', hasPhotos: hd.photos.length > 0, hasParts: false, hasRecs: hd.recs.length > 0 } : null,
    });

    // ---- health: from inspection findings on record for the selected vehicle; never from sensors
    const myVeh = live.vehicles[vIdx];
    const vehAppts = myVeh ? live.appointments.filter((a) => a.vehicle_id === myVeh.id) : [];
    const allF = vehAppts.flatMap((a) => (a.findings || []).map((f) => ({ ...f, when: a.done_at || a.starts_at })));
    const CATS = [['Tires', /tire|tread|rotat|wheel/i, I.tire], ['Brakes', /brake|pad|rotor/i, I.brake], ['Battery', /batter|alternat|electr/i, I.battery], ['Fluids', /oil|fluid|coolant|transmission|brake fluid/i, I.drop], ['Filters', /filter/i, I.filter], ['Alignment', /align|suspens|shock|strut/i, I.align]];
    const lastDone = vehAppts.filter((a) => a.status === 'done').sort((x, y) => (y.done_at || y.starts_at).localeCompare(x.done_at || x.starts_at))[0];
    const healthRows = CATS.map(([name, re, d]) => {
      const fs = allF.filter((f) => re.test(f.name + ' ' + (f.plain || ''))).sort((x, y) => y.when.localeCompare(x.when));
      const open = fs.find((f) => f.status === 'pending' || f.status === 'declined'), fixed = fs.find((f) => f.status === 'done' || f.status === 'approved');
      const status = open ? (open.tier === 'monitor' ? 'Monitor' : 'Service recommended') : fixed ? 'Serviced ' + new Date(fixed.when).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : lastDone ? 'No concerns noted' : 'Not measured yet';
      const c = open ? (open.tier === 'monitor' ? YEL : open.tier === 'now' ? ACC : YEL) : fixed ? GRN : lastDone ? GRN : 'rgba(235,235,245,.3)';
      return { name, status, dot: 'width:8px;height:8px;border-radius:4px;flex:0 0 auto;background:' + c, d, go: open ? this.go(open.status === 'pending' ? 'findings' : 'history') : fixed ? this.go('history') : goBook };
    });
    const attention = healthRows.filter((h) => /recommended|Monitor/.test(h.status)).length;
    const callouts = allF.filter((f) => f.meas).slice(0, 4).map((f, i) => ({ k: f.name, v: (f.meas_label ? f.meas_label + ' ' : '') + f.meas, c: f.status === 'done' || f.status === 'approved' ? GRN : f.tier === 'now' ? ACC : YEL, style: 'position:absolute;top:' + (i < 2 ? 0 : 170) + 'px;' + (i % 2 === 0 ? 'left:22px;text-align:left' : 'right:22px;text-align:right') + ';padding-bottom:7px;border-bottom:1px solid ' + (f.status === 'done' || f.status === 'approved' ? GRN : f.tier === 'now' ? ACC : YEL) + ';pointer-events:none' }));
    Object.assign(V, {
      pHealth: view === 'health' && !!myVeh, pHealthEmpty: view === 'health' && !myVeh, pHealthDetail: false,
      health: healthRows, healthCallouts: callouts, healthHeadline: !lastDone ? 'No inspection on record yet.' : attention ? (attention === 1 ? 'One thing to keep an eye on.' : 'A couple of things to keep an eye on.') : 'Everything looked good last time.',
      healthFoot: lastDone ? 'From the inspection at your ' + new Date(lastDone.done_at || lastDone.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' visit' + (myVeh.odometer ? ' · ' + myVeh.odometer.toLocaleString('en-US') + ' mi entered by you' : '') + '. The app is not connected to the car.' : 'Book a visit and the technician\u2019s inspection fills this in. The app is not connected to the car.',
    });

    // ---- pages the pilot does not run yet fall back to their empty states; account stays
    if (!live.loaded) Object.assign(V, { pHome: false, pHomeEmpty: false });
    else if (!cars.length) Object.assign(V, { pHome: false, pHomeEmpty: view === 'home', initials, addVehicle: () => this.setState({ addVeh: { year: '', make: '', model: '', plate: '', odometer: '' }, view: 'addVehicle' }), goBook, heroStyle: 'position:absolute;left:0;right:0;z-index:4;top:0;height:240px;opacity:0;pointer-events:none' });
    else Object.assign(V, { pHome: view === 'home', pHomeEmpty: false });
    Object.assign(V, {
      pGarage: false, pGarageEmpty: view === 'garage' && !cars.length, pGarageLive: view === 'garage' && !!cars.length,
      pMessages: view === 'messages', pMessagesEmpty: false,
      pAddVehicle: view === 'addVehicle', addVeh: s.addVeh, setAddVeh: (p) => this.setState({ addVeh: { ...s.addVeh, ...p } }), saveAddVeh: () => s.addVeh && (s.addVeh.make || s.addVeh.model) && this.addVehicle(s.addVeh), cancelAddVeh: () => this.setState({ addVeh: null, view: s.addVeh && s.addVeh.back === 'book' ? 'book' : 'home' }),
      addVehicle: () => this.setState({ addVeh: { year: '', make: '', model: '', plate: '', odometer: '' }, view: 'addVehicle' }),
      startMessage: openUrl(shop.phone ? 'sms:' + shop.phone : ''),
      garageCars: cars.map((c, i) => ({ ...c, pick: () => this.setState({ vIdx: i, view: 'home' }), visits: (live.vehicles[i] || {}).visits || 0 })),
      tabs: (V.tabs || []).map((t) => { const on = /color:#fff/.test(t.glyphStyle); return Object.assign({}, t, { badge: false, itemStyle: 'flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 0 7px;cursor:pointer;position:relative;border-radius:24px;transition:background .25s ease;' + (on ? 'background:rgba(255,255,255,.1)' : '') }); }),
      pShop: false, pShopLive: view === 'shop', goShop: this.go('shop'),
      showTabs: !nativeTabs() && ['home', 'garage', 'service', 'shop', 'history', 'account'].indexOf(view) >= 0,
      nativeTabs: !!nativeTabs(),
      signOut: this.props.signOut || null, shopInfo: shop, myLoaners: live.rentals,
    });
    const TAB_IDS = ['home', 'garage', 'service', 'shop', 'history'], TAB_LABELS = { home: 'Home', garage: 'Vehicles', service: 'Service', shop: 'Shop', history: 'History' };
    const tabSel = view === 'histDetail' ? 'history' : view === 'addVehicle' ? 'garage' : ['findings', 'photos', 'approve', 'pickup', 'rate', 'messages'].includes(view) ? 'service' : TAB_IDS.includes(view) ? view : 'home';
    this._tabsForNative = { tabs: TAB_IDS.map((id) => ({ id, label: TAB_LABELS[id], badge: id === 'service' && unreadCount(live) > 0 })), ids: TAB_IDS, selected: tabSel, visible: ['home', 'garage', 'service', 'shop', 'history', 'account', 'histDetail', 'health'].includes(view), badges: unreadCount(live) > 0 };
    if (nativeTabs()) setTimeout(() => this.syncTabs(), 0);
    return V;
  }
}
