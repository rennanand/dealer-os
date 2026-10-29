// View-model for the Loaners module on real records (Supabase). Without a backend it runs on
// a small in-memory fleet so the screens can be reviewed.
import React from 'react';
import { DCLogic } from '../runtime/logic.js';
import { supabase, SHOP_ID } from './supabase.js';
import { CLAUSES, CLAUSE_OPTS, CLAUSE_KEY, fmt0, vehicleName, dayLabel, daysBetween, clausesFor, previewMeta } from './agreement.js';

const ACC = '#e0312b', GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';
const pill = (c) => 'display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border:1px solid ' + c + ';border-radius:4px;font-family:var(--data-font,inherit);font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;line-height:1.3;color:' + c;
const iso = (d) => d.toISOString().slice(0, 10);
const today = () => iso(new Date(Date.now() - new Date().getTimezoneOffset() * 60000));
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const fmtTime = (ts) => (ts ? new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');

const DEMO_FLEET = [
  { id: 'v1', year: 2027, make: 'Tesla', model: 'Model 3', color: 'Quicksilver', paint: '#b9bdc3', plate: 'UT 1190', vin_last4: '1190', powertrain: 'ev', odometer: 22870, level: 88, status: 'available' },
  { id: 'v2', year: 2024, make: 'Tesla', model: 'Model Y', color: 'Pearl White', paint: '#e9eaeb', plate: 'UT 4821', vin_last4: '4821', powertrain: 'ev', odometer: 18204, level: 92, status: 'available' },
  { id: 'v3', year: 2023, make: 'Toyota', model: 'RAV4', color: 'Lunar Rock', paint: '#7d8a80', plate: 'UT 6633', vin_last4: '6633', powertrain: 'gas', odometer: 41210, level: 75, status: 'out' },
];

export class LoanersLogic extends DCLogic {
  state = { fleet: [], rentals: [], selId: null, loading: !!supabase, err: '', copied: false, newOpen: false, draft: null, record: null, month: today().slice(0, 7), photos: {}, busy: false, fleetOpen: false, fv: null, shop: null, filter: 'open', search: '' };

  async componentDidMount() {
    if (!supabase) { this.setState({ fleet: DEMO_FLEET, rentals: [], loading: false }); return; }
    await this.reload();
    this.chan = supabase.channel('loaners:' + SHOP_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals' }, () => this.reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loaner_vehicles' }, () => this.reload())
      .subscribe();
  }
  componentWillUnmount() { if (this.chan) supabase.removeChannel(this.chan); clearTimeout(this._saveT); }

  async reload() {
    const [sh, f, r] = await Promise.all([
      supabase.from('shops').select('*').eq('shop_id', SHOP_ID).maybeSingle().then((x) => x.data).catch(() => null),
      supabase.from('loaner_vehicles').select('*').eq('shop_id', SHOP_ID).neq('status', 'retired').order('year', { ascending: false }),
      supabase.from('rentals').select('*').eq('shop_id', SHOP_ID).order('created_at', { ascending: false }).limit(300),
    ]);
    if (f.error || r.error) return this.setState({ loading: false, err: (f.error || r.error).message });
    const selId = this.state.selId && r.data.some((x) => x.id === this.state.selId) ? this.state.selId : (r.data.find((x) => x.status !== 'returned' && x.status !== 'cancelled') || r.data[0] || {}).id || null;
    this.setState({ fleet: f.data, rentals: r.data, loading: false, selId, err: '', shop: sh || null });
  }

  sel() { return this.state.rentals.find((r) => r.id === this.state.selId) || null; }
  vehicleOf(r) { return r && this.state.fleet.find((v) => v.id === r.vehicle_id); }

  // Edits apply locally at once and save shortly after; the customer's link always reads the saved row.
  patch(p) {
    const r = this.sel(); if (!r) return;
    this.setState({ rentals: this.state.rentals.map((x) => (x.id === r.id ? { ...x, ...p } : x)) });
    if (!supabase) return;
    this._pending = { ...(this._pending || {}), ...p };
    clearTimeout(this._saveT);
    this._saveT = setTimeout(async () => {
      const body = this._pending; this._pending = null;
      const { error } = await supabase.from('rentals').update(body).eq('id', r.id);
      if (error) this.setState({ err: error.message });
    }, 500);
  }

  async createRental(d) {
    const base = { rate_cents: (this.state.shop && this.state.shop.default_rate_cents) || 6500, number: 'LN-' + (3100 + this.state.rentals.length), customer_name: d.name.trim(), customer_phone: d.phone.trim(), customer_plate: d.plate.trim().toUpperCase(), work_ref: d.work.trim(), start_date: today(), end_date: addDays(today(), 1), status: 'draft' };
    if (!supabase) { const r = { id: 'r' + Date.now(), token: 'demo', clauses: {}, mile_cap: '100 mi/day', charge_min: '50%', deductible: '$1,000', rate_cents: 6500, shop_pays: false, extra_cents: 0, ...base }; this.setState({ rentals: [r, ...this.state.rentals], selId: r.id, newOpen: false, draft: null }); return; }
    this.setState({ busy: true });
    const { data: num } = await supabase.rpc('next_rental_number', { p_shop: SHOP_ID });
    const { data, error } = await supabase.from('rentals').insert({ ...base, number: num || base.number, shop_id: SHOP_ID }).select().single();
    this.setState({ busy: false });
    if (error) return this.setState({ err: error.message });
    this.setState({ rentals: [data, ...this.state.rentals], selId: data.id, newOpen: false, draft: null });
  }

  async setStatus(p) {
    const r = this.sel(); if (!r) return;
    this.setState({ rentals: this.state.rentals.map((x) => (x.id === r.id ? { ...x, ...p } : x)), record: null });
    if (!supabase) return;
    const { error } = await supabase.from('rentals').update(p).eq('id', r.id);
    if (error) return this.setState({ err: error.message });
    // keep the fleet record in step
    if (p.status === 'out') await supabase.from('loaner_vehicles').update({ status: 'out', odometer: p.out_odometer, level: p.out_level }).eq('id', r.vehicle_id);
    if (p.status === 'returned') await supabase.from('loaner_vehicles').update({ status: 'available', odometer: p.in_odometer, level: p.in_level }).eq('id', r.vehicle_id);
  }

  async addPhoto(file, phase) {
    const r = this.sel(); if (!r || !file) return;
    const key = r.id + '/' + phase;
    const local = URL.createObjectURL(file);
    this.setState({ photos: { ...this.state.photos, [key]: (this.state.photos[key] || []).concat(local) } });
    if (!supabase) return;
    const path = r.id + '/' + phase + '/' + Date.now() + '.jpg';
    const up = await supabase.storage.from('rental-photos').upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (up.error) return this.setState({ err: up.error.message });
    await supabase.from('rental_photos').insert({ rental_id: r.id, phase, path });
  }

  async saveVehicle(fv) {
    const row = { shop_id: SHOP_ID, year: Number(fv.year), make: fv.make.trim(), model: fv.model.trim(), color: fv.color.trim(), paint: fv.paint || '#b9bdc3', plate: fv.plate.trim().toUpperCase(), vin_last4: fv.vin.trim().slice(-4), powertrain: fv.ev ? 'ev' : 'gas', odometer: Number(fv.odometer || 0), level: Number(fv.level || 100), status: 'available' };
    if (!supabase) { this.setState({ fleet: this.state.fleet.concat({ id: 'v' + Date.now(), ...row }), fleetOpen: false, fv: null }); return; }
    this.setState({ busy: true });
    const { error } = await supabase.from('loaner_vehicles').insert(row);
    this.setState({ busy: false });
    if (error) return this.setState({ err: error.message });
    this.setState({ fleetOpen: false, fv: null });
    this.reload();
  }
  async setVehicleStatus(id, status) {
    this.setState({ fleet: this.state.fleet.map((v) => (v.id === id ? { ...v, status } : v)) });
    if (supabase) { const { error } = await supabase.from('loaner_vehicles').update({ status }).eq('id', id); if (error) this.setState({ err: error.message }); }
  }
  link(r) { return window.location.origin + '/rental/' + r.token; }

  renderVals() {
    const s = this.state, r = this.sel(), v = this.vehicleOf(r);
    const out = {
      loading: s.loading, err: s.err,
      fleetSub: s.fleet.length + (s.fleet.length === 1 ? ' vehicle' : ' vehicles') + ' · ' + s.fleet.filter((f) => f.status === 'out').length + ' out · ' + s.rentals.filter((x) => ['sent', 'signed'].includes(x.status)).length + ' waiting',
      loanerFleet: s.fleet.map((f) => {
        const open = s.rentals.find((x) => x.vehicle_id === f.id && ['out', 'signed', 'sent'].includes(x.status));
        const sc = f.status === 'service' ? ['In for service', DIM] : open ? [(open.status === 'out' ? 'Out · ' : 'Reserved · ') + open.customer_name, open.status === 'out' ? ACC : YEL] : ['Available', GRN];
        return { car: vehicleName(f), color: f.color, vin: f.vin_last4, miles: f.odometer.toLocaleString('en-US'), state: sc[0], stateColor: sc[1], canToggle: !open, toggleLabel: f.status === 'service' ? 'Back in rotation' : 'Mark in service', toggle: () => this.setVehicleStatus(f.id, f.status === 'service' ? 'available' : 'service'), retire: () => { if (!open && window.confirm('Remove ' + vehicleName(f) + ' from the loaner fleet?')) this.setVehicleStatus(f.id, 'retired'); }, dot: 'width:12px;height:12px;border-radius:6px;flex:0 0 auto;background:' + f.paint + ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)' };
      }),
      rFilters: [['open', 'Open'], ['all', 'All']].map(([k, l]) => ({ label: l, pick: () => this.setState({ filter: k }), style: 'padding:5px 10px;border-radius:7px;font-size:11.5px;font-weight:500;cursor:pointer;' + (s.filter === k ? 'background:rgba(235,235,245,.9);color:#000;' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7);') })),
      rSearch: s.search, onRSearch: (e) => this.setState({ search: e.target.value }),
      rentalList: s.rentals.filter((x) => x.status !== 'cancelled').filter((x) => s.filter === 'all' || !['returned'].includes(x.status)).filter((x) => { const q = s.search.trim().toLowerCase(); if (!q) return true; const vv = this.vehicleOf(x); return (x.customer_name + ' ' + x.number + ' ' + x.customer_phone + ' ' + (vv ? vehicleName(vv) : '')).toLowerCase().includes(q); }).slice(0, 40).map((x) => {
        const st = STATUS[x.status];
        return { who: x.customer_name || 'New rental', sub: x.number + ' · ' + (this.vehicleOf(x) ? this.vehicleOf(x).model : 'no vehicle') + ' · ' + dayLabel(x.start_date).slice(5) + ' → ' + dayLabel(x.end_date).slice(5), state: st[0], color: st[1], pick: () => this.setState({ selId: x.id, record: null }), style: 'display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer;' + (x.id === s.selId ? '' : 'opacity:.7;') };
      }),
      hasSel: !!r, newOpen: s.newOpen, busy: s.busy,
      fleetOpen: s.fleetOpen, openFleet: () => this.setState({ fleetOpen: true, fv: { year: '', make: '', model: '', color: '', plate: '', vin: '', ev: false, odometer: '', level: '100', paint: '#b9bdc3' } }), closeFleet: () => this.setState({ fleetOpen: false, fv: null }),
      openNew: () => this.setState({ newOpen: true, draft: { name: '', phone: '', plate: '', work: '' } }), closeNew: () => this.setState({ newOpen: false, draft: null }),
    };
    const d = s.draft || { name: '', phone: '', plate: '', work: '' };
    const setD = (p) => this.setState({ draft: { ...d, ...p } });
    const dOk = d.name.trim().length > 1;
    Object.assign(out, {
      dName: d.name, onDName: (e) => setD({ name: e.target.value }), dPhone: d.phone, onDPhone: (e) => setD({ phone: e.target.value.replace(/[^\d() +-]/g, '').slice(0, 16) }),
      dPlate: d.plate, onDPlate: (e) => setD({ plate: e.target.value.toUpperCase().slice(0, 10) }), dWork: d.work, onDWork: (e) => setD({ work: e.target.value }),
      dCta: s.busy ? 'Creating…' : 'Create rental', dCtaStyle: 'padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap;' + (dOk && !s.busy ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      dSubmit: () => { if (dOk && !s.busy) this.createRental(d); },
    });
    const fv = s.fv || {};
    const setF = (p) => this.setState({ fv: { ...fv, ...p } });
    const fOk = /^(19|20)\d\d$/.test(fv.year || '') && (fv.make || '').trim() && (fv.model || '').trim();
    Object.assign(out, {
      fv, onF: (k) => (e) => setF({ [k]: e.target.value }), setFEv: (ev) => setF({ ev }), setFPaint: (paint) => setF({ paint }),
      fPaints: ['#e9eaeb', '#b9bdc3', '#17181b', '#7d8a80', '#5c7f8b', '#8d908f', '#a8130c', '#1f3a8a'].map((c) => ({ c, pick: () => setF({ paint: c }), style: 'width:22px;height:22px;border-radius:11px;cursor:pointer;background:' + c + ';box-shadow:' + (fv.paint === c ? '0 0 0 2px #000,0 0 0 4px #fff' : 'inset 0 0 0 1px rgba(255,255,255,.18)') })),
      fCta: s.busy ? 'Saving…' : 'Add to fleet', fCtaStyle: 'padding:11px 16px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap;' + (fOk && !s.busy ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      fSubmit: () => { if (fOk && !s.busy) this.saveVehicle(fv); },
    });
    if (!r) return out;

    const locked = !['draft', 'sent'].includes(r.status);
    const days = daysBetween(r.start_date, r.end_date), total = r.shop_pays ? 0 : (days * r.rate_cents) / 100;
    const st = STATUS[r.status];
    const rv = { ...r, vehicle: v };
    const setClause = (id, on) => this.patch({ clauses: { ...(r.clauses || {}), [id]: on } });
    // calendar for the month being viewed
    const [my, mm] = s.month.split('-').map(Number);
    const first = new Date(my, mm - 1, 1), nDays = new Date(my, mm, 0).getDate(), lead = first.getDay();
    const cells = Array.from({ length: Math.ceil((lead + nDays) / 7) * 7 }, (_, i) => {
      const dn = i - lead + 1, inM = dn >= 1 && dn <= nDays, dIso = inM ? s.month + '-' + String(dn).padStart(2, '0') : '';
      const past = inM && dIso < today(), inR = inM && dIso >= r.start_date && dIso <= r.end_date, edge = dIso === r.start_date || dIso === r.end_date;
      return { label: inM ? String(dn) : '', pick: () => { if (!inM || past || locked) return; const next = r.start_date !== r.end_date || dIso < r.start_date ? { start_date: dIso, end_date: dIso } : { start_date: r.start_date, end_date: dIso }; this.patch(next); },
        style: 'height:34px;display:flex;align-items:center;justify-content:center;font-size:12.5px;border-radius:8px;transition:all .15s ease;cursor:' + (inM && !past && !locked ? 'pointer' : 'default') + ';' + (!inM ? '' : past ? 'color:rgba(235,235,245,.2);' : edge ? 'background:#fff;color:#000;font-weight:600;' : inR ? 'background:rgba(235,235,245,.14);color:#fff;' : 'color:rgba(235,235,245,.8);') };
    });
    const rec = s.record;
    Object.assign(out, {
      rental: { no: r.number, who: r.customer_name, car: v ? vehicleName(v) + ' · ' + v.color : 'Choose a vehicle', work: r.work_ref || (r.customer_plate ? 'Customer car · ' + r.customer_plate : 'Walk-in'), status: st[0], statusStyle: 'flex:0 0 auto;' + pill(st[1]) },
      rName: r.customer_name, onRName: (e) => this.patch({ customer_name: e.target.value }), rPhone: r.customer_phone, onRPhone: (e) => this.patch({ customer_phone: e.target.value }),
      rPlate: r.customer_plate, onRPlate: (e) => this.patch({ customer_plate: e.target.value.toUpperCase() }), rWork: r.work_ref, onRWork: (e) => this.patch({ work_ref: e.target.value }), rLocked: locked,
      rVehicles: s.fleet.map((f) => {
        const busy = f.status !== 'available' && f.id !== r.vehicle_id;
        return { car: vehicleName(f), sub: f.id === r.vehicle_id ? 'Selected' : f.status === 'out' ? 'Out' : f.status === 'service' ? 'In for service' : 'Available', dot: 'width:10px;height:10px;border-radius:5px;flex:0 0 auto;background:' + f.paint + ';box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)', pick: () => { if (!busy && !locked) this.patch({ vehicle_id: f.id }); }, style: 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;transition:all .18s ease;cursor:' + (busy || locked ? 'default' : 'pointer') + ';opacity:' + (busy ? 0.4 : 1) + ';' + (f.id === r.vehicle_id ? 'background:#fff;color:#000;' : 'background:rgba(255,255,255,.06);color:rgba(235,235,245,.8);') };
      }),
      rPay: [[false, fmt0(r.rate_cents / 100) + ' / day'], [true, 'Covered by RyGuys']].map((p) => ({ label: p[1], pick: () => { if (!locked) this.patch({ shop_pays: p[0] }); }, style: 'flex:1;text-align:center;padding:11px 10px;border-radius:10px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (r.shop_pays === p[0] ? 'background:#fff;color:#000;' : 'background:rgba(255,255,255,.06);color:rgba(235,235,245,.75);') })),
      rSummary: [{ k: 'Pick up', v: dayLabel(r.start_date), c: '#fff' }, { k: 'Return', v: dayLabel(r.end_date), c: '#fff' }, { k: 'Days', v: days + (days === 1 ? ' day' : ' days'), c: '#fff' }, { k: 'Customer total', v: r.shop_pays ? '$0 · covered' : fmt0(total) + (r.extra_cents ? ' + ' + fmt0(r.extra_cents / 100) + ' extras' : ''), c: r.shop_pays ? GRN : '#fff' }],
      calHead: ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((t) => ({ t })), calCells: cells,
      calMonth: first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), calPrev: () => this.setState({ month: iso(new Date(my, mm - 2, 15)).slice(0, 7) }), calNext: () => this.setState({ month: iso(new Date(my, mm, 15)).slice(0, 7) }),
      calNote: locked ? 'Dates are locked once signed. Extend the return from the handoff record if the job runs long.' : 'Dates show in the agreement as you change them.',
      rClauseHint: locked ? 'Signed · locked' : 'Locked once signed', rClauseWrap: 'margin-top:8px;' + (locked ? 'opacity:.55;pointer-events:none;' : ''),
      rClauses: CLAUSES.map((c) => { const on = (r.clauses || {})[c.id] !== false; return { t: c.t, hasOpts: !!CLAUSE_OPTS[c.id], rowStyle: 'padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);transition:opacity .2s ease;opacity:' + (on ? 1 : 0.5), boxStyle: 'width:18px;height:18px;border-radius:5px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .18s ease;' + (on ? 'background:#fff;color:#000;' : 'border:1px solid rgba(235,235,245,.3);color:transparent;'), toggle: () => setClause(c.id, !on), opts: (CLAUSE_OPTS[c.id] || []).map((o) => ({ label: o, pick: () => this.patch({ [CLAUSE_KEY[c.id]]: o }), style: 'padding:5px 9px;border-radius:7px;font-size:11.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (r[CLAUSE_KEY[c.id]] === o ? 'background:rgba(235,235,245,.9);color:#000;' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7);') })) }; }),
      rPreviewMeta: previewMeta({ ...rv, shop: s.shop }), agreeClauses: clausesFor(rv),
      rSigned: !!r.signature_svg, sigPath: r.signature_svg || '', rSigBox: '0 0 300 120',
      rLink: this.link(r), copied: s.copied,
      copyLink: () => { navigator.clipboard.writeText(this.link(r)).then(() => { this.setState({ copied: true }); setTimeout(() => this.setState({ copied: false }), 1800); }); },
      smsHref: 'sms:' + (r.customer_phone || '').replace(/\D/g, '') + '?&body=' + encodeURIComponent('Hi ' + (r.customer_name.split(' ')[0] || '') + ', your loaner agreement from RyGuys Tire & Auto is ready to review and sign: ' + this.link(r)),
      rAction: r.status === 'returned' ? { t: 'Returned ' + fmtTime(r.returned_at), s: (r.in_odometer - r.out_odometer) + ' mi · ' + r.in_level + '% at return' + (r.shop_pays ? ' · no charge' : ' · ' + fmt0(total + r.extra_cents / 100) + ' due'), cta: '' }
        : r.status === 'out' ? { t: 'Out since ' + fmtTime(r.out_at), s: 'Due back ' + dayLabel(r.end_date) + ' · ' + r.out_odometer.toLocaleString('en-US') + ' mi · ' + r.out_level + '% at handoff', cta: 'Record return', go: () => this.setState({ record: { phase: 'in', odometer: '', level: '' } }) }
        : r.status === 'signed' && !v ? { t: 'Signed, but no vehicle attached', s: 'Attach a vehicle in a new rental; this one cannot be handed off.', cta: '' }
        : r.status === 'signed' ? { t: 'Signed ' + fmtTime(r.signed_at) + (r.signed_name ? ' by ' + r.signed_name : ''), s: 'Waiting for handoff', cta: 'Record handoff', go: () => this.setState({ record: { phase: 'out', odometer: v ? String(v.odometer) : '', level: v ? String(v.level) : '' } }) }
        : r.status === 'sent' ? { t: 'Sent ' + fmtTime(r.sent_at), s: 'Waiting for ' + (r.customer_name.split(' ')[0] || 'the customer') + ' to sign. Resend the link if needed.', cta: 'Mark as sent again', go: () => this.patch({ sent_at: new Date().toISOString() }) }
        : { t: 'Draft', s: v ? 'Send the link and the customer signs on their phone.' : 'Choose a vehicle first.', cta: v ? 'Mark as sent' : '', go: () => this.patch({ status: 'sent', sent_at: new Date().toISOString() }) },
      cancelRental: () => { if (['draft', 'sent'].includes(r.status) && window.confirm('Cancel ' + r.number + '?')) this.setStatus({ status: 'cancelled' }); },
      canCancel: ['draft', 'sent'].includes(r.status),
    });
    if (rec) {
      const ok = /^\d{1,7}$/.test(rec.odometer) && /^\d{1,3}$/.test(rec.level) && Number(rec.level) <= 100;
      const key = r.id + '/' + rec.phase;
      const extra = rec.phase === 'in' && ok ? this.extras(r, Number(rec.odometer), Number(rec.level)) : null;
      Object.assign(out, {
        record: { phase: rec.phase, title: rec.phase === 'out' ? 'Handoff' : 'Return', sub: rec.phase === 'out' ? 'Record what the customer leaves with. Four photos: front, back, both sides.' : 'Record what came back. Same four angles.', levelLabel: v && v.powertrain === 'ev' ? 'Charge %' : 'Fuel %' },
        recOdo: rec.odometer, onRecOdo: (e) => this.setState({ record: { ...rec, odometer: e.target.value.replace(/\D/g, '').slice(0, 7) } }),
        recLevel: rec.level, onRecLevel: (e) => this.setState({ record: { ...rec, level: e.target.value.replace(/\D/g, '').slice(0, 3) } }),
        recLicense: s.photos[r.id + '/license'] || [], onRecLicense: (e) => { for (const f of e.target.files || []) this.addPhoto(f, 'license'); e.target.value = ''; },
        recPhotos: s.photos[key] || [], onRecPhoto: (e) => { for (const f of e.target.files || []) this.addPhoto(f, rec.phase); e.target.value = ''; },
        recExtras: extra ? extra.lines : [], recExtraTotal: extra ? extra.total : 0,
        recCtaStyle: 'padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap;' + (ok ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
        recCta: rec.phase === 'out' ? 'Hand over the keys' : 'Close out rental',
        recSubmit: () => { if (!ok) return; rec.phase === 'out' ? this.setStatus({ status: 'out', out_at: new Date().toISOString(), out_odometer: Number(rec.odometer), out_level: Number(rec.level) }) : this.setStatus({ status: 'returned', returned_at: new Date().toISOString(), in_odometer: Number(rec.odometer), in_level: Number(rec.level), extra_cents: extra ? extra.total * 100 : 0 }); },
        recClose: () => this.setState({ record: null }),
      });
    }
    return out;
  }

  // Extra charges at return, from the agreement's own terms.
  extras(r, inOdo, inLevel) {
    const lines = []; let total = 0;
    const days = daysBetween(r.start_date, r.end_date), driven = Math.max(0, inOdo - (r.out_odometer || inOdo));
    const cap = r.mile_cap === 'Unlimited' ? Infinity : parseInt(r.mile_cap, 10) * days;
    if ((r.clauses || {}).mileage !== false && driven > cap) { const over = driven - cap; lines.push({ k: over + ' mi over ' + r.mile_cap, v: fmt0(over * 0.35) }); total += over * 0.35; }
    const min = r.charge_min === 'No minimum' ? 0 : parseInt(r.charge_min, 10);
    if ((r.clauses || {}).charge !== false && inLevel < min) { lines.push({ k: 'Returned at ' + inLevel + '%, below ' + r.charge_min, v: '$25' }); total += 25; }
    const late = Math.max(0, daysBetween(r.start_date, today()) - days);
    if (!r.shop_pays && late > 0) { lines.push({ k: late + (late === 1 ? ' extra day' : ' extra days'), v: fmt0((late * r.rate_cents) / 100) }); total += (late * r.rate_cents) / 100; }
    return { lines, total: Math.round(total) };
  }
}

const STATUS = { draft: ['Draft', DIM], sent: ['Sent · waiting to sign', YEL], signed: ['Signed · awaiting handoff', GRN], out: ['Out with customer', ACC], returned: ['Returned', GRN], cancelled: ['Cancelled', DIM] };
