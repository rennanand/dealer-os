// Texting: templates, sends, scheduled sends, opt-out, and the thread view that merges texts with
// in-app messages. Without Twilio configured, a send is queued as "manual" and the desk opens the
// phone's Messages app with the text ready, so nothing is lost before the number is registered.
import { supabase, SHOP_ID } from '../supabase.js';

const GRN = '#30d158', YEL = '#ffd60a', ACC = '#e0312b', DIM = 'rgba(235,235,245,.5)';
const ORIGIN = () => (typeof location !== 'undefined' ? location.origin : 'https://dealer-os-rosy.vercel.app');

export function fillTemplate(body, ctx) {
  return String(body || '').replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? ctx[k] : ''));
}

export const commsMethods = {
  smsConnected() { return !!(this.state.config && this.state.config.sms); },
  async sendText(custId, body, kind, apptId, scheduledFor) {
    const c = this.custOf(custId); if (!c || !body) return null;
    if (!c.phone) return this.setState({ err: 'No mobile number on file for ' + c.name + '.' });
    if (c.sms_opt_out) return this.setState({ err: c.name + ' opted out of texts.' });
    const connected = this.smsConnected();
    const row = { customer_id: custId, appointment_id: apptId || null, phone: c.phone, direction: 'out', body, kind: kind || 'manual', status: scheduledFor ? 'scheduled' : connected ? 'queued' : 'manual', scheduled_for: scheduledFor || null, created_at: new Date().toISOString() };
    if (!supabase) { const m = { id: 'sms' + Date.now(), ...row }; this.setState({ sms: (this.state.sms || []).concat(m), reply: '' }); if (!connected && !scheduledFor) this.openMessages(c.phone, body); return m; }
    const { data, error } = await supabase.rpc('send_sms', { p_customer: custId, p_body: body, p_kind: kind || 'manual', p_appointment: apptId || null, p_scheduled_for: scheduledFor || null });
    if (error) return this.setState({ err: error.message });
    this.setState({ sms: (this.state.sms || []).concat({ id: data, ...row }), reply: '' });
    if (!connected && !scheduledFor) this.openMessages(c.phone, body);
    return data;
  },
  openMessages(phone, body) { try { window.location.href = 'sms:' + phone + '?&body=' + encodeURIComponent(body); } catch (e) {} },
  async cancelText(id) {
    this.setState({ sms: (this.state.sms || []).map((m) => (m.id === id ? { ...m, status: 'cancelled' } : m)) });
    if (supabase) await supabase.from('sms_messages').update({ status: 'cancelled' }).eq('id', id).in('status', ['scheduled', 'queued', 'manual']);
  },
  async markTextSent(id) {   // the desk sent it from the phone
    this.setState({ sms: (this.state.sms || []).map((m) => (m.id === id ? { ...m, status: 'sent', sent_at: new Date().toISOString() } : m)) });
    if (supabase) await supabase.from('sms_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id);
  },
  async saveTemplate(t) {
    const row = { key: (t.key || t.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'), name: (t.name || '').trim(), body: (t.body || '').trim(), sort: Number(t.sort) || 100 };
    if (!row.name || !row.body) return;
    if (!supabase) { const list = this.state.smsTemplates || []; this.setState({ smsTemplates: t.id ? list.map((x) => (x.id === t.id ? { ...x, ...row } : x)) : list.concat({ id: 'tp' + Date.now(), ...row }), tplEdit: null }); return; }
    const { error } = t.id ? await supabase.from('sms_templates').update(row).eq('id', t.id) : await supabase.from('sms_templates').insert({ ...row, shop_id: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    this.setState({ tplEdit: null }); await this.reload();
  },
  async removeTemplate(id) {
    this.setState({ smsTemplates: (this.state.smsTemplates || []).filter((x) => x.id !== id), tplEdit: null });
    if (supabase) await supabase.from('sms_templates').delete().eq('id', id);
  },
  async setOptOut(custId, on) { await this.updateCustomer(custId, { sms_opt_out: !!on }); },
  async setDoNotMarket(custId, on) { await this.updateCustomer(custId, { do_not_market: !!on }); },
  /** Fill a template for an appointment on the desk side (the DB does the same in sms_fill). */
  fillFor(key, apptId, extra) {
    const t = (this.state.smsTemplates || []).find((x) => x.key === key); if (!t) return '';
    const a = this.state.appointments.find((x) => x.id === apptId) || {}; const c = this.custOf(a.customer_id) || {}; const v = this.vehOf(a.vehicle_id); const sh = this.state.shop || {};
    const ro = (this.state.ros || []).find((r) => r.appointment_id === apptId);
    const ctx = { first: (c.name || '').split(' ')[0], shop: sh.name || 'the shop', phone: sh.phone || '', service: a.job || 'service', vehicle: v ? [v.year, v.make, v.model].filter(Boolean).join(' ') : 'your vehicle',
      when: a.starts_at ? new Date(a.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + new Date(a.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '', time: a.starts_at ? new Date(a.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
      total: ro ? '$' + (this.roBalance(ro.id) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '', link: '', item: '', ...(extra || {}) };
    return fillTemplate(t.body, ctx);
  },
};

export function commsVals(L, s, set, helpers) {
  const { fmtTime, relDay } = helpers;
  const connected = L.smsConnected();
  const sms = s.sms || [];
  const tpls = (s.smsTemplates || []).slice().sort((a, b) => a.sort - b.sort);
  const te = s.tplEdit;
  const scheduled = sms.filter((m) => m.status === 'scheduled').sort((a, b) => (a.scheduled_for || '').localeCompare(b.scheduled_for || ''));
  const manual = sms.filter((m) => m.status === 'manual' && m.direction === 'out');
  const STATUS = { queued: ['Sending', YEL], scheduled: ['Scheduled', YEL], sent: ['Sent', GRN], delivered: ['Delivered', GRN], failed: ['Failed', ACC], received: ['Received', '#fff'], manual: ['Send from phone', YEL], cancelled: ['Cancelled', DIM] };
  const bubbleOf = (m) => ({ id: m.id, text: m.body, time: fmtTime(m.created_at), out: m.direction === 'out', sms: true, status: STATUS[m.status] ? STATUS[m.status][0] : m.status, color: STATUS[m.status] ? STATUS[m.status][1] : DIM, manual: m.status === 'manual', send: m.status === 'manual' ? () => { L.openMessages(m.phone, m.body); L.markTextSent(m.id); } : null, cancel: ['scheduled', 'manual', 'queued'].includes(m.status) ? () => L.cancelText(m.id) : null, when: m.scheduled_for ? 'for ' + relDay(m.scheduled_for) + ' ' + fmtTime(m.scheduled_for) : '' });
  return {
    connected, setupNote: connected ? 'Texts send from the shop number.' : 'Texts open in Messages on this device until the shop number is connected (Settings · Texting).',
    textsFor: (custId) => sms.filter((m) => m.customer_id === custId).map(bubbleOf),
    scheduled: scheduled.map((m) => { const c = L.custOf(m.customer_id); return { ...bubbleOf(m), who: c ? c.name : m.phone, kind: m.kind }; }),
    manual: manual.map((m) => { const c = L.custOf(m.customer_id); return { ...bubbleOf(m), who: c ? c.name : m.phone, kind: m.kind }; }),
    templates: tpls.map((t) => ({ id: t.id, key: t.key, name: t.name, body: t.body, edit: () => set({ tplEdit: { ...t } }) })),
    openNewTemplate: () => set({ tplEdit: { name: '', body: '', sort: 100 } }),
    tplEdit: te ? { ...te, set: (p) => set({ tplEdit: { ...te, ...p } }), save: () => L.saveTemplate(te), cancel: () => set({ tplEdit: null }), remove: te.id ? () => L.removeTemplate(te.id) : null, fields: ['{first}', '{shop}', '{phone}', '{service}', '{vehicle}', '{when}', '{time}', '{total}', '{link}', '{item}'] } : null,
    quick: (apptId) => tpls.filter((t) => ['confirmation', 'reminder', 'ready', 'thank_you', 'pay'].includes(t.key)).map((t) => ({ key: t.key, name: t.name, body: L.fillFor(t.key, apptId, t.key === 'pay' ? { link: '' } : {}) })),
    sendTo: (custId, body, kind, apptId, when) => L.sendText(custId, body, kind, apptId, when),
    stats: { sent: sms.filter((m) => m.direction === 'out' && ['sent', 'delivered'].includes(m.status)).length, received: sms.filter((m) => m.direction === 'in').length, scheduled: scheduled.length, manual: manual.length, failed: sms.filter((m) => m.status === 'failed').length },
    optOut: (c) => !!(c && c.sms_opt_out), setOptOut: (id, on) => L.setOptOut(id, on), setDoNotMarket: (id, on) => L.setDoNotMarket(id, on),
  };
}
