// Marketing: segments of customers and campaigns by text or email, with results per campaign.
import { supabase, SHOP_ID } from '../supabase.js';

const $ = (c) => '$' + ((c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';
export const SEGMENT_PRESETS = [
  ['Everyone', {}],
  ['Due for service', { due: true }],
  ['Lapsed · no visit in 6 months', { lapsed_months: 6 }],
  ['Lapsed · no visit in 12 months', { lapsed_months: 12 }],
  ['Declined work waiting', { declined: true }],
  ['New in the last 30 days', { joined_days: 30 }],
  ['Regulars · 3+ visits', { min_visits: 3 }],
];
const TEMPLATES = {
  text: 'Hi {first}, {shop} here. {offer} Book here: {link}. Reply STOP to opt out.',
  email: 'Hi {first},\n\n{offer}\n\nBook online any time: {link}\n\n{shop}',
};

export const marketingMethods = {
  async previewSegment(segment, channel) {
    if (!supabase) { const n = this.state.customers.filter((c) => !c.do_not_market && (channel === 'text' ? c.phone && !c.sms_opt_out : c.email)); this.setState({ segPreview: { count: n.length, sample: n.slice(0, 5).map((c) => c.name), key: JSON.stringify(segment) + channel } }); return; }
    const { data, error } = await supabase.rpc('segment_customers', { p_shop: SHOP_ID, p_segment: segment, p_channel: channel });
    if (error) return this.setState({ err: error.message });
    this.setState({ segPreview: { count: (data || []).length, sample: (data || []).slice(0, 5).map((c) => c.name), key: JSON.stringify(segment) + channel } });
  },
  async saveCampaign(d) {
    const row = { name: (d.name || '').trim(), channel: d.channel || 'text', segment: d.segment || {}, subject: (d.subject || '').trim(), body: (d.body || '').trim() };
    if (!row.name || !row.body) return null;
    if (!supabase) { const id = d.id || 'cp' + Date.now(); this.setState({ campaigns: (this.state.campaigns || []).filter((c) => c.id !== id).concat({ id, status: 'draft', sent_count: 0, created_at: new Date().toISOString(), ...row }), campaignEdit: null }); return id; }
    if (d.id) { const { error } = await supabase.from('campaigns').update(row).eq('id', d.id); if (error) { this.setState({ err: error.message }); return null; } await this.reload(); this.setState({ campaignEdit: null }); return d.id; }
    const { data, error } = await supabase.from('campaigns').insert({ ...row, shop_id: SHOP_ID }).select().single();
    if (error) { this.setState({ err: error.message }); return null; }
    await this.reload(); this.setState({ campaignEdit: null }); return data.id;
  },
  async sendCampaign(d, when) {
    const id = await this.saveCampaign(d); if (!id) return;
    if (!supabase) { this.setState({ campaigns: this.state.campaigns.map((c) => (c.id === id ? { ...c, status: when ? 'scheduled' : 'sent', scheduled_for: when || null, sent_at: when ? null : new Date().toISOString(), sent_count: when ? 0 : (this.state.segPreview || {}).count || 0 } : c)), campaignEdit: null, payNote: when ? 'Scheduled.' : 'Sent.' }); return; }
    const { data, error } = await supabase.rpc('send_campaign', { p_campaign: id, p_when: when || null });
    if (error) return this.setState({ err: error.message });
    this.setState({ payNote: when ? 'Scheduled for ' + new Date(when).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '.' : 'Sent to ' + data + (data === 1 ? ' customer' : ' customers') + (this.smsConnected() ? '.' : ' · texts wait in Settings · Texting until the shop number is connected.') });
    await this.reload();
  },
  async cancelCampaign(id) {
    this.setState({ campaigns: (this.state.campaigns || []).map((c) => (c.id === id ? { ...c, status: 'cancelled' } : c)) });
    if (supabase) await supabase.from('campaigns').update({ status: 'cancelled' }).eq('id', id).in('status', ['draft', 'scheduled']);
  },
  async loadResults(id) {
    if (!supabase) return;
    const { data } = await supabase.rpc('campaign_results', { p_campaign: id });
    this.setState({ results: { ...(this.state.results || {}), [id]: data } });
  },
};

export function marketingVals(L, s, set, helpers) {
  const { relDay, fmtTime } = helpers;
  const list = (s.campaigns || []).slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const ce = s.campaignEdit;
  const segLabel = (seg) => { const p = SEGMENT_PRESETS.find(([, v]) => JSON.stringify(v) === JSON.stringify(seg || {})); if (p) return p[0]; const parts = []; if (seg.due) parts.push('due'); if (seg.declined) parts.push('declined work'); if (seg.lapsed_months) parts.push('no visit ' + seg.lapsed_months + ' mo'); if (seg.active_months) parts.push('visited within ' + seg.active_months + ' mo'); if (seg.min_visits) parts.push(seg.min_visits + '+ visits'); if (seg.joined_days) parts.push('new ' + seg.joined_days + ' d'); if (seg.min_spent_cents) parts.push('spent ' + $(seg.min_spent_cents) + '+'); if ((seg.tags || []).length) parts.push('tags ' + seg.tags.join('/')); if ((seg.makes || []).length) parts.push(seg.makes.join('/')); return parts.join(' · ') || 'Everyone'; };
  const preview = ce && s.segPreview && s.segPreview.key === JSON.stringify(ce.segment) + ce.channel ? s.segPreview : null;
  const STATUS = { draft: ['Draft', DIM], scheduled: ['Scheduled', YEL], sending: ['Sending', YEL], sent: ['Sent', GRN], cancelled: ['Cancelled', DIM] };
  const makes = Array.from(new Set(s.vehicles.map((v) => (v.make || '').trim()).filter(Boolean))).sort();
  return {
    campaigns: list.map((c) => { const r = (s.results || {})[c.id]; return { id: c.id, name: c.name, channel: c.channel === 'email' ? 'Email' : 'Text', segment: segLabel(c.segment), status: STATUS[c.status][0], color: STATUS[c.status][1], when: c.sent_at ? relDay(c.sent_at) + ' ' + fmtTime(c.sent_at) : c.scheduled_for ? 'for ' + relDay(c.scheduled_for) + ' ' + fmtTime(c.scheduled_for) : relDay(c.created_at), count: c.sent_count, results: r ? { sent: r.sent, delivered: r.delivered, failed: r.failed, replied: r.replied, booked: r.booked, revenue: $(r.revenue) } : null, loadResults: c.status === 'sent' ? () => L.loadResults(c.id) : null,
      edit: c.status === 'draft' || c.status === 'scheduled' ? () => set({ campaignEdit: { ...c, segment: c.segment || {} } }) : null, duplicate: () => set({ campaignEdit: { name: c.name + ' (copy)', channel: c.channel, segment: c.segment || {}, subject: c.subject, body: c.body } }), cancel: c.status === 'draft' || c.status === 'scheduled' ? () => L.cancelCampaign(c.id) : null }; }),
    empty: !s.loading && !list.length,
    openNew: () => set({ campaignEdit: { name: '', channel: 'text', segment: { due: true }, subject: '', body: TEMPLATES.text.replace('{offer}', 'Your vehicle is due for service.'), offer: '' }, segPreview: null }),
    edit: ce ? { ...ce, set: (p) => set({ campaignEdit: { ...ce, ...p } }), setSeg: (p) => set({ campaignEdit: { ...ce, segment: { ...ce.segment, ...p } } }), presets: SEGMENT_PRESETS.map(([label, seg]) => ({ label, on: JSON.stringify(seg) === JSON.stringify(ce.segment), pick: () => set({ campaignEdit: { ...ce, segment: seg } }) })),
      setChannel: (ch) => set({ campaignEdit: { ...ce, channel: ch, body: ce.body === TEMPLATES[ce.channel].replace('{offer}', 'Your vehicle is due for service.') ? TEMPLATES[ch].replace('{offer}', 'Your vehicle is due for service.') : ce.body } }),
      makes, tags: ['VIP', 'Fleet', 'Family', 'Price sensitive', 'Needs loaner', 'Warranty'], fields: ['{first}', '{shop}', '{link}', '{phone}', '{review}'],
      preview, previewLoad: () => L.previewSegment(ce.segment, ce.channel), segLabel: segLabel(ce.segment),
      ok: !!ce.name.trim() && !!ce.body.trim() && (ce.channel === 'text' || !!ce.subject.trim()), chars: ce.body.length, segments: Math.max(1, Math.ceil(ce.body.length / 160)),
      save: () => L.saveCampaign(ce), send: () => L.sendCampaign(ce), schedule: (when) => L.sendCampaign(ce, when), cancel: () => set({ campaignEdit: null }) } : null,
    note: s.payNote || '', clearNote: () => set({ payNote: '' }), smsConnected: L.smsConnected(), emailConnected: !!(s.config && s.config.email),
    stats: { sent: list.filter((c) => c.status === 'sent').length, reach: list.filter((c) => c.status === 'sent').reduce((t, c) => t + (c.sent_count || 0), 0), optedOut: s.customers.filter((c) => c.sms_opt_out).length, noMarket: s.customers.filter((c) => c.do_not_market).length },
  };
}
