// The customer app (3D car, status cards, Service page, booking) on real records.
// It runs the prototype's view-model and replaces the values that the demo invented
// with the customer's vehicles, appointments and loaners from Supabase.
import { AppLogic, ICONS as I } from './appLogic.js';
import { supabase } from './supabase.js';
import { dayLabel } from './agreement.js';

const ACC = '#e0312b', GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';
const pill = (c) => 'display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border:1px solid ' + c + ';border-radius:4px;font-family:var(--data-font,inherit);font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;line-height:1.3;color:' + c;
const PAINTS = [['white', '#e9eaeb'], ['pearl', '#e9eaeb'], ['black', '#17181b'], ['silver', '#b9bdc3'], ['gray', '#8d908f'], ['grey', '#8d908f'], ['red', '#b3141a'], ['blue', '#2f4f7a'], ['green', '#2f4f3a'], ['tan', '#b8a98a'], ['orange', '#d2541f'], ['yellow', '#d8b52a'], ['brown', '#5a4634'], ['burgundy', '#5b1b26'], ['teal', '#3f7f8b']];
const paintOf = (v) => { const t = ((v.color || '') + ' ' + (v.model || '')).toLowerCase(); const hit = PAINTS.find(([k]) => t.includes(k)); return hit ? hit[1] : '#b9bdc3'; };
const vehName = (v) => (v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : '');
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
const DEMO_SHOP = { shop_id: 'ryguys', name: 'RyGuys Tire & Auto Sales', address: '204 N Main St, Manti, UT 84642', city: 'Manti, UT', phone: '4358354869', hours: 'Mon, Tue, Thu, Fri · 8:00 AM – 5:30 PM', lat: 39.2686964, lng: -111.636588, open_days: [1, 2, 4, 5], open_from: '08:00', open_to: '17:30' };
const slotsFor = (shop) => { const [fh, fm] = (shop.open_from || '08:00').split(':').map(Number), [th, tm] = (shop.open_to || '17:00').split(':').map(Number); const out = []; for (let t = fh * 60 + fm; t <= th * 60 + tm - 60; t += 30) out.push(t); return out; };
const minLabel = (m) => { const h = Math.floor(m / 60), mm = m % 60; return ((h + 11) % 12) + 1 + ':' + (mm < 10 ? '0' : '') + mm + (h >= 12 ? ' PM' : ' AM'); };

export class CustomerLive extends AppLogic {
  constructor(props) {
    super(props);
    this.state = { ...this.state, stage: 0, loaner: 'none', readStage: 99, live: { profile: props.profile || null, vehicles: [], appointments: [], rentals: [], shops: [DEMO_SHOP], loaded: !supabase }, addVeh: null };
  }
  componentDidMount() {
    super.componentDidMount();
    if (!supabase) window.__revyn = this; // review builds only: lets a script stage a visit
    this.loadLive();
    this._poll = setInterval(() => this.loadLive(), 15000);
  }
  componentWillUnmount() { super.componentWillUnmount(); clearInterval(this._poll); }

  async loadLive() {
    if (!supabase) return;
    const [v, a, r, sh] = await Promise.all([supabase.rpc('my_vehicles'), supabase.rpc('my_appointments'), supabase.rpc('my_rentals'), supabase.rpc('shops_public')]);
    const live = { ...this.state.live, vehicles: v.data || [], appointments: a.data || [], rentals: r.data || [], shops: Array.isArray(sh.data) && sh.data.length ? sh.data : [DEMO_SHOP], loaded: true };
    const act = this.active(live.appointments);
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
    const cars = live.vehicles.map((v) => ({ id: v.id, name: v.model || vehName(v) || 'Your car', sub: [v.year ? v.year + ' ' + v.make : v.make, v.odometer ? v.odometer.toLocaleString('en-US') + ' mi · entered by you' : 'Add your mileage', v.plate].filter(Boolean).join(' · '), paint: paintOf(v), ph: '' }));
    const vIdx = Math.min(s.vIdx || 0, Math.max(0, cars.length - 1)), car0 = cars[vIdx] || { name: 'Your car', sub: '', paint: '#b9bdc3' };
    Object.assign(V, {
      greeting: first ? (hour < 12 ? 'Good morning, ' : hour < 17 ? 'Good afternoon, ' : 'Good evening, ') + first + '.' : 'Welcome.',
      initials, hasUnread: false, myCars: cars, car0, multiCar: cars.length > 1, dots: cars.map((_, i) => ({ style: 'width:6px;height:6px;border-radius:3px;transition:background .2s ease;background:' + (i === vIdx ? '#fff' : 'rgba(235,235,245,.25)') })),
      heroPaint: view === 'home' || view === 'garage' ? car0.paint : V.heroPaint,
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
    else if (act.status === 'in_progress') { kick((act.bay ? 'Bay 0' + act.bay + ' · ' : '') + 'In service', ACC, act.job || 'Service', 'Work started at ' + fmtT(act.started_at) + '. We text you the moment it is ready.', 'View Service', goService); V.homeRings = true; }
    else kick('Ready for pickup', GRN, (actVeh ? actVeh.model || 'Your car' : 'Your car') + ' is ready.', (act.bay ? 'Bay 0' + act.bay + ' · ' : '') + 'Pay at the counter when you arrive.', 'Directions', openUrl(maps));
    const sc = act ? sceneFor(act.job, act.status) : { scene: '', phase: '' };
    if (act && (act.status === 'arrived' || act.status === 'in_progress')) { V.homeScene = sc.scene; V.homeScenePhase = sc.phase; }

    // ---- Service page
    const stages = act ? [
      { name: 'Appointment booked', t: when(act.starts_at), d: (act.job || 'Service') + ' at ' + shop.name.split(' ').slice(0, 2).join(' ') + '.' , at: 0 },
      { name: 'Vehicle checked in', t: fmtT(act.arrived_at), d: 'Your vehicle has arrived at the shop.', at: 1 },
      { name: 'Work started', t: fmtT(act.started_at), d: act.notes ? 'Technician note: ' + act.notes : 'A technician is working on your vehicle.', at: 2 },
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
    const loanerCard = openRental ? { d: I.swap, iconStyle: icon(openRental.status === 'out' ? ACC : openRental.status === 'signed' ? GRN : YEL, 'rgba(235,235,245,.1)'), k: 'Your loaner', kColor: openRental.status === 'out' ? ACC : openRental.status === 'signed' ? GRN : YEL, t: openRental.vehicle || 'Loaner', sub: openRental.status === 'out' ? 'Due back ' + dayLabel(openRental.end_date) + '.' : openRental.status === 'signed' ? 'Signed · keys at the desk.' : 'Agreement ready to review and sign.', cta: openRental.status === 'sent' ? 'Review and sign' : 'Open', go: () => { window.location.href = '/rental/' + openRental.token; } }
      : act && act.visit === 'loaner' && cur < 8 ? { d: I.swap, iconStyle: icon('#fff', 'rgba(235,235,245,.12)'), k: 'Loaner', kColor: DIM, t: 'Loaner requested', sub: 'The shop confirms a loaner at check-in; the agreement arrives here to sign.', cta: 'Call the shop', go: openUrl(tel) }
      : act && cur < 8 ? { d: I.swap, iconStyle: icon('#fff', 'rgba(235,235,245,.12)'), k: 'Loaner', kColor: DIM, t: 'Need a ride?', sub: 'Ask at check-in. The agreement comes to this app to sign, no paperwork at the desk.', cta: 'Call the shop', go: openUrl(tel) } : null;
    const svcCards = act ? [
      { scene: started && cur < 8 ? sc.scene : '', phase: sc.phase, d: cur >= 8 ? I.check : cur === 0 ? I.clock : I.wrench, iconStyle: icon(cur >= 8 ? GRN : ACC, cur >= 8 ? 'rgba(48,209,88,.14)' : 'rgba(224,49,43,.16)'), k: cur >= 8 ? 'Ready for pickup' : cur >= 2 ? 'In service' : cur >= 1 ? 'Checked in' : 'Appointment', kColor: cur >= 8 ? GRN : ACC,
        t: act.job || 'Service', sub: cur >= 8 ? (act.bay ? 'Bay 0' + act.bay + ' · ' : '') + 'Pay at the counter when you arrive.' : cur >= 1 ? (act.bay ? 'Bay 0' + act.bay + ' · ' : '') + 'Status is updated by the shop as your car moves through the day.' : when(act.starts_at) + ' · ' + (VISIT[act.visit] || 'Drop off'), cta: cur === 0 ? 'Cancel visit' : cur >= 8 ? 'Directions' : 'Call the shop', go: cur === 0 ? () => supabase && supabase.rpc('cancel_my_appointment', { p_id: act.id }).then(() => { this.loadLive(); this.setState({ view: 'home' }); }) : cur >= 8 ? openUrl(maps) : openUrl(tel) },
      { d: I.doc, iconStyle: icon(started ? '#fff' : DIM, 'rgba(235,235,245,.12)'), k: 'Inspection', kColor: DIM, t: started ? 'Findings arrive here.' : 'After check-in', sub: started ? 'If the technician finds anything beyond ' + (act.job || 'the booked service').toLowerCase() + ', the shop calls before any extra work starts.' : 'A technician looks the car over at the start of the visit and the shop calls about anything extra before work starts.', cta: '', go: null },
      { d: I.camera, iconStyle: icon(DIM, 'rgba(235,235,245,.1)'), k: 'Photos', kColor: DIM, t: 'Photos from your technician', sub: started ? 'Added by the shop during the visit when there is something to show you.' : 'Taken during the visit when there is something to show you.', cta: '', go: null },
      { d: I.dollar, iconStyle: icon(cur >= 8 ? GRN : '#fff', cur >= 8 ? 'rgba(48,209,88,.14)' : 'rgba(235,235,245,.12)'), k: cur >= 8 ? 'Payment due' : 'Payment', kColor: cur >= 8 ? GRN : DIM, t: cur >= 8 ? 'Pay at the counter' : 'Nothing charged yet', sub: cur >= 8 ? 'Card or cash at pickup. Your receipt is on paper for now.' : 'You approve any work beyond the booked service before it starts. Pay at the counter at pickup.', cta: '', go: null },
      loanerCard,
      { txt: shop.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), iconStyle: icon('#fff', 'rgba(235,235,245,.12)').replace('font-size:20px', 'font-size:14px;letter-spacing:.4px'), k: 'Shop', kColor: DIM, t: shop.name, sub: shop.address + (shop.hours ? ' · ' + shop.hours : ''), cta: 'Text the shop', go: openUrl(shop.phone ? 'sms:' + shop.phone : '') },
    ].filter(Boolean).map((c) => Object.assign(c, { noScene: !c.scene })) : [];
    const cardIdx = Math.min(s.cardIdx, Math.max(0, svcCards.length - 1));
    const arrow = (on) => 'width:30px;height:30px;border-radius:15px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:300;cursor:pointer;transition:opacity .2s ease;color:rgba(235,235,245,.8);opacity:' + (on ? 1 : 0.25);
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
    });

    // ---- booking on the shop's real calendar
    const b = s.book, openDays = shop.open_days || [1, 2, 3, 4, 5], slots = slotsFor(shop);
    const days = []; for (let i = 0; i < 21 && days.length < 10; i++) { const t = new Date(); t.setDate(t.getDate() + i); if (openDays.includes(t.getDay())) days.push(t); }
    const bDay = b.dayIso || iso(days[0] || new Date()), bDate = new Date(bDay + 'T00:00:00');
    const setB = (p) => this.setState({ book: { ...b, ...p } });
    const veh = live.vehicles[b.vIdx || 0];
    Object.assign(V, {
      bookDays: days.map((t) => ({ label: fmtDay(t) === 'Today' || fmtDay(t) === 'Tomorrow' ? fmtDay(t) : DOWS[t.getDay()] + ' ' + t.getDate(), pick: () => setB({ dayIso: iso(t), minutes: 0, time: '', err: '' }), style: this.chip(iso(t) === bDay) })),
      bookSlots: slots.filter((m) => { const d = new Date(bDate); d.setMinutes(m); return d > new Date(); }).map((m) => ({ label: minLabel(m), pick: () => setB({ dayIso: bDay, minutes: m, time: minLabel(m), err: '' }), style: 'padding:14px 0;border-radius:11px;text-align:center;font-size:12.5px;cursor:pointer;transition:all .2s ease;' + (b.minutes === m && b.time ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.85);') })),
      bookSub: ['Pick the closest thing. Not sure is fine too.', 'We will have its history ready.', 'In your own words. The technician reads this before you arrive.', 'Open ' + openDays.map((n) => DOWS[n]).join(', ') + '.', 'How you would like to handle the visit.', 'Nothing is charged now. Pay at the counter.'][b.step] || '',
      bookWhen: fmtDay(bDate) + ' · ' + (b.time || '—'),
      visitTypes: [['Drop off', 'Leave it with us, we text when it is ready'], ['Wait', 'Lounge with Wi-Fi, most visits under an hour'], ['Loaner', 'Ask for a loaner; the shop confirms at check-in']].map((v) => ({ name: v[0], sub: v[1], pick: () => setB({ visit: v[0], err: '' }), style: V.visitTypes[0].style.replace(/background:[^;]+;/, b.visit === v[0] ? 'background:#1c1c1e;' : 'background:transparent;'), radio: (V.visitTypes.find((x) => x.name === v[0]) || V.visitTypes[0]).radio })),
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

    // ---- pages the pilot does not run yet fall back to their empty states; account stays
    if (!live.loaded) Object.assign(V, { pHome: false, pHomeEmpty: false });
    else if (!cars.length) Object.assign(V, { pHome: false, pHomeEmpty: view === 'home', initials, addVehicle: () => this.setState({ addVeh: { year: '', make: '', model: '', plate: '', odometer: '' }, view: 'addVehicle' }), goBook, heroStyle: 'position:absolute;left:0;right:0;z-index:4;top:0;height:240px;opacity:0;pointer-events:none' });
    else Object.assign(V, { pHome: view === 'home', pHomeEmpty: false });
    Object.assign(V, {
      pGarage: false, pGarageEmpty: view === 'garage' && !cars.length, pGarageLive: view === 'garage' && !!cars.length,
      pHealth: false, pHealthEmpty: view === 'health', pHistory: false, pHistoryEmpty: view === 'history', pMessages: false, pMessagesEmpty: view === 'messages',
      pAddVehicle: view === 'addVehicle', addVeh: s.addVeh, setAddVeh: (p) => this.setState({ addVeh: { ...s.addVeh, ...p } }), saveAddVeh: () => s.addVeh && (s.addVeh.make || s.addVeh.model) && this.addVehicle(s.addVeh), cancelAddVeh: () => this.setState({ addVeh: null, view: s.addVeh && s.addVeh.back === 'book' ? 'book' : 'home' }),
      addVehicle: () => this.setState({ addVeh: { year: '', make: '', model: '', plate: '', odometer: '' }, view: 'addVehicle' }),
      startMessage: openUrl(shop.phone ? 'sms:' + shop.phone : ''),
      garageCars: cars.map((c, i) => ({ ...c, pick: () => this.setState({ vIdx: i, view: 'home' }), visits: (live.vehicles[i] || {}).visits || 0 })),
      tabs: (V.tabs || []).map((t) => Object.assign({}, t, { badge: false })),
      pShop: false, pShopLive: view === 'shop', goShop: this.go('shop'),
      showTabs: ['home', 'garage', 'service', 'shop', 'history', 'account'].indexOf(view) >= 0,
      signOut: this.props.signOut || null, shopInfo: shop, myLoaners: live.rentals,
    });
    return V;
  }
}
