// The scheduler: a week at a glance, blocked time, capacity per slot, online booking settings,
// confirmations and reminders. The day timeline with drag between bays lives in shopLogic.
import { supabase, SHOP_ID } from '../supabase.js';

const GRN = '#30d158', YEL = '#ffd60a', ACC = '#e0312b', DIM = 'rgba(235,235,245,.5)';
const iso = (d) => { const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return t.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const calendarMethods = {
  async addBlock(d) {
    const row = { starts_at: new Date(d.day + 'T' + d.from + ':00').toISOString(), ends_at: new Date(d.day + 'T' + d.to + ':00').toISOString(), bay: d.bay ? Number(d.bay) : null, tech_id: d.tech_id || null, reason: (d.reason || 'Blocked').trim() || 'Blocked' };
    if (row.ends_at <= row.starts_at) return this.setState({ err: 'End must be after start.' });
    if (!supabase) { this.setState({ blocks: (this.state.blocks || []).concat({ id: 'b' + Date.now(), ...row }), blockEdit: null }); return; }
    const { error } = await supabase.from('blocked_time').insert({ ...row, shop_id: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    this.setState({ blockEdit: null }); await this.reload();
  },
  async removeBlock(id) {
    this.setState({ blocks: (this.state.blocks || []).filter((b) => b.id !== id) });
    if (supabase) await supabase.from('blocked_time').delete().eq('id', id);
  },
  async saveBooking(p) {   // { booking, reminders, open_days, open_from, open_to }
    this.setState({ shop: { ...(this.state.shop || {}), ...p } });
    if (supabase) { const { error } = await supabase.from('shops').update(p).eq('shop_id', SHOP_ID); if (error) this.setState({ err: error.message }); }
  },
  async confirmAppt(id) { await this.setAppt(id, { confirmed_at: new Date().toISOString() }); },
  async sendConfirmation(id) {
    const a = this.state.appointments.find((x) => x.id === id); if (!a || !a.customer_id) return;
    const body = this.fillFor('confirmation', id); if (!body) return;
    await this.sendText(a.customer_id, body, 'confirmation', id);
    await this.setAppt(id, { confirmation_sent_at: new Date().toISOString() });
  },
  async sendReminder(id) {
    const a = this.state.appointments.find((x) => x.id === id); if (!a || !a.customer_id) return;
    const body = this.fillFor('reminder', id); if (!body) return;
    await this.sendText(a.customer_id, body, 'reminder', id);
    await this.setAppt(id, { reminder_sent_at: new Date().toISOString() });
  },
};

export const waitlistMethods = {
  async addToWaitlist(d) {
    const row = { customer_id: d.customer_id || null, vehicle_id: d.vehicle_id || null, service: (d.service || '').trim(), earliest: d.earliest || null, notes: (d.notes || '').trim(), status: 'waiting' };
    if (!row.customer_id) return;
    if (!supabase) { this.setState({ waitlist: (this.state.waitlist || []).concat({ id: 'w' + Date.now(), created_at: new Date().toISOString(), ...row }), waitEdit: null }); return; }
    const { error } = await supabase.from('waitlist').insert({ ...row, shop_id: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    this.setState({ waitEdit: null }); await this.reload();
  },
  async setWaitlist(id, status) {
    this.setState({ waitlist: (this.state.waitlist || []).map((w) => (w.id === id ? { ...w, status, offered_at: status === 'offered' ? new Date().toISOString() : w.offered_at } : w)).filter((w) => w.status === 'waiting' || w.status === 'offered') });
    if (supabase) await supabase.from('waitlist').update({ status, ...(status === 'offered' ? { offered_at: new Date().toISOString() } : {}) }).eq('id', id);
  },
};

export function calendarVals(L, s, set, helpers) {
  const { vehName, fmtTime, STATUS } = helpers;
  const sh = s.shop || {};
  const booking = { slot_minutes: 30, lead_hours: 2, days_ahead: 30, max_per_slot: 2, bays: 5, online: true, services: [], ...(sh.booking || {}) };
  const rem = { confirm_on_book: true, remind_hours: 24, ready_text: true, thank_you: true, followup_days: 3, ...(sh.reminders || {}) };
  const start = s.weekStart || (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); })();
  const days = [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(start, n));
  const openDays = Array.isArray(sh.open_days) ? sh.open_days : [1, 2, 3, 4, 5];
  const blocks = s.blocks || [];
  const live = s.appointments.filter((a) => a.status !== 'cancelled' && a.status !== 'no_show');
  const cap = Math.max(1, Math.min(booking.bays || 5, 5)) * 8;   // bay-hours a day
  const dayVm = (d) => {
    const appts = live.filter((a) => (a.starts_at || '').slice(0, 10) === d).sort((x, y) => x.starts_at.localeCompare(y.starts_at));
    const hours = appts.reduce((t, a) => t + (a.minutes || 60) / 60, 0);
    const bl = blocks.filter((b) => iso(new Date(b.starts_at)) === d);
    const blockedH = bl.filter((b) => !b.bay && !b.tech_id).reduce((t, b) => t + (new Date(b.ends_at) - new Date(b.starts_at)) / 36e5, 0) * (booking.bays || 5) + bl.filter((b) => b.bay || b.tech_id).reduce((t, b) => t + (new Date(b.ends_at) - new Date(b.starts_at)) / 36e5, 0);
    const pct = Math.min(100, Math.round(((hours + blockedH) / cap) * 100));
    const dow = new Date(d + 'T12:00:00').getDay();
    return { d, label: DOW[dow], num: new Date(d + 'T12:00:00').getDate(), isToday: d === today(), closed: !openDays.includes(dow), pct, pctLabel: pct + '%', color: pct >= 90 ? ACC : pct >= 65 ? YEL : GRN, count: appts.length, unconfirmed: appts.filter((a) => a.status === 'booked' && !a.confirmed_at).length,
      appts: appts.map((a) => { const c = L.custOf(a.customer_id), v = L.vehOf(a.vehicle_id); return { id: a.id, time: fmtTime(a.starts_at), who: c ? c.name.split(' ')[0] + (c.name.split(' ')[1] ? ' ' + c.name.split(' ')[1][0] + '.' : '') : 'Walk-in', car: v ? v.model || vehName(v) : '', job: a.job || 'Service', color: STATUS[a.status] ? STATUS[a.status][1] : DIM, confirmed: !!a.confirmed_at, bay: a.bay ? 'B' + a.bay : '', open: () => set({ selId: a.id, day: d }) }; }),
      blocks: bl.map((b) => ({ id: b.id, label: b.reason + ' · ' + fmtTime(b.starts_at) + '–' + fmtTime(b.ends_at) + (b.bay ? ' · Bay 0' + b.bay : b.tech_id ? ' · ' + ((s.techs.find((t) => t.id === b.tech_id) || {}).name || '').split(' ')[0] : ''), remove: () => L.removeBlock(b.id) })),
      pick: () => set({ day: d }), block: () => set({ blockEdit: { day: d, from: '12:00', to: '13:00', bay: '', tech_id: '', reason: 'Blocked' } }) };
  };
  const week = days.map(dayVm);
  const be = s.blockEdit;
  const unconfirmed = live.filter((a) => a.status === 'booked' && !a.confirmed_at && a.starts_at > new Date().toISOString() && a.starts_at < addDays(today(), 3) + 'T23:59:59').map((a) => { const c = L.custOf(a.customer_id); return { id: a.id, who: c ? c.name : 'Walk-in', when: (iso(new Date(a.starts_at)) === today() ? 'Today' : iso(new Date(a.starts_at)) === addDays(today(), 1) ? 'Tomorrow' : new Date(a.starts_at).toLocaleDateString('en-US', { weekday: 'short' })) + ' · ' + fmtTime(a.starts_at), job: a.job || 'Service', sent: a.confirmation_sent_at ? 'Confirmation sent' : a.reminder_sent_at ? 'Reminder sent' : '', confirm: () => L.confirmAppt(a.id), remind: c && c.phone ? () => L.sendReminder(a.id) : null, open: () => set({ selId: a.id, day: iso(new Date(a.starts_at)) }) }; });
  const we = s.waitEdit;
  const waitlist = {
    rows: (s.waitlist || []).map((w) => { const c = L.custOf(w.customer_id), v = L.vehOf(w.vehicle_id); return { id: w.id, who: c ? c.name : 'Customer', car: v ? vehName(v) : '', service: w.service || 'Any', since: new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), earliest: w.earliest ? 'from ' + new Date(w.earliest + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '', offered: w.status === 'offered', notes: w.notes,
      book: () => { set({ newAppt: { customer_id: w.customer_id, vehicle_id: w.vehicle_id || '', name: '', phone: '', year: '', make: '', model: '', plate: '', job: w.service || '', day: s.day || today(), time: '09:00', visit: 'dropoff', waitlist_id: w.id } }); },
      text: c && c.phone ? () => { L.sendText(c.id, 'Hi ' + c.name.split(' ')[0] + ', ' + ((s.shop && s.shop.name) || 'the shop') + ' here — a spot opened up' + (w.service ? ' for ' + w.service.toLowerCase() : '') + '. Book it here: ' + ((s.shop && s.shop.public_url) || 'https://dealer-os-rosy.vercel.app') + '/book', 'manual', null); L.setWaitlist(w.id, 'offered'); } : null,
      close: () => L.setWaitlist(w.id, 'closed') }; }),
    count: (s.waitlist || []).length,
    openNew: (custId) => set({ waitEdit: { customer_id: custId || '', vehicle_id: '', service: '', earliest: '', notes: '' } }),
    edit: we ? { ...we, set: (p) => set({ waitEdit: { ...we, ...p } }), save: () => L.addToWaitlist(we), cancel: () => set({ waitEdit: null }), custOpts: s.customers.map((c) => ({ id: c.id, label: c.name + (c.phone ? ' · ' + c.phone : '') })), cars: we.customer_id ? s.vehicles.filter((v) => v.customer_id === we.customer_id).map((v) => ({ id: v.id, label: vehName(v) })) : [] } : null,
  };
  return {
    waitlist, weekLabel: new Date(days[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' + new Date(days[6] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    prev: () => set({ weekStart: addDays(start, -7) }), next: () => set({ weekStart: addDays(start, 7) }), thisWeek: () => set({ weekStart: null }),
    week, unconfirmed, view: s.schedView || 'day', setView: (v) => set({ schedView: v }),
    blockEdit: be ? { ...be, set: (p) => set({ blockEdit: { ...be, ...p } }), save: () => L.addBlock(be), cancel: () => set({ blockEdit: null }), techOpts: s.techs.filter((t) => t.active !== false).map((t) => ({ id: t.id, name: t.name })) } : null,
    openBlock: () => set({ blockEdit: { day: s.day || today(), from: '12:00', to: '13:00', bay: '', tech_id: '', reason: 'Blocked' } }),
    dayBlocks: blocks.filter((b) => iso(new Date(b.starts_at)) === (s.day || today())).map((b) => ({ id: b.id, bay: b.bay || 0, tech_id: b.tech_id, start: new Date(b.starts_at).getHours() + new Date(b.starts_at).getMinutes() / 60, end: new Date(b.ends_at).getHours() + new Date(b.ends_at).getMinutes() / 60, reason: b.reason, remove: () => L.removeBlock(b.id) })),
    settings: { booking, reminders: rem, openDays, openFrom: sh.open_from || '08:00', openTo: sh.open_to || '17:30', DOW,
      save: (p) => L.saveBooking(p), link: (typeof location !== 'undefined' ? location.origin : 'https://dealer-os-rosy.vercel.app') + '/book' },
  };
}
