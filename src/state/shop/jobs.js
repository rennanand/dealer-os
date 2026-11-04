// Canned jobs, labor and parts matrices, estimates built from jobs, and the job board.
// Mixed into ShopLogic (see shopLogic.js). A job is a `findings` row carrying its own lines.
import { supabase, SHOP_ID } from '../supabase.js';

const ACC = '#e0312b', GRN = '#30d158', YEL = '#ffd60a', DIM = 'rgba(235,235,245,.5)';
const $ = (c) => (c < 0 ? '-' : '') + '$' + (Math.abs(c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cents = (v) => Math.round((parseFloat(String(v == null ? '' : v).replace(/[^0-9.-]/g, '')) || 0) * 100);
const num = (v) => parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')) || 0;
export const lineTotal = (l) => Math.round((Number(l.qty) || 0) * (Number(l.unit_cents) || 0)) * (l.kind === 'discount' ? -1 : 1);
export const jobTotal = (lines) => (lines || []).reduce((t, l) => t + lineTotal(l), 0);

/** Retail price for a part from its cost, by the shop's matrix (tiers of cost → markup %). */
export function matrixPrice(costCents, matrix) {
  const m = Array.isArray(matrix) && matrix.length ? matrix : [{ upto_cents: 0, markup_pct: 40 }];
  const tier = m.find((t) => !t.upto_cents || costCents <= t.upto_cents) || m[m.length - 1];
  return Math.round(costCents * (1 + (Number(tier.markup_pct) || 0) / 100));
}

export const jobMethods = {
  // ---- library ----
  async seedLibrary() {
    if (!supabase) return;
    const { error } = await supabase.rpc('seed_canned_jobs', { p_shop: SHOP_ID });
    if (error) return this.setState({ err: error.message });
    await this.reload();
  },
  async saveCanned(d) {
    const lines = (d.lines || []).filter((l) => (l.description || '').trim()).map((l) => ({ kind: l.kind || 'labor', description: l.description.trim(), qty: num(l.qty) || 1, unit_cents: cents(l.unit), cost_cents: l.kind === 'part' ? cents(l.cost) : 0, part_number: l.part_number || '', vendor: l.vendor || '', part_id: l.part_id || null }));
    const row = { name: (d.name || '').trim(), category: (d.category || 'General').trim() || 'General', plain: (d.plain || '').trim(), lines, hours: lines.filter((l) => l.kind === 'labor').reduce((t, l) => t + l.qty, 0), package_cents: cents(d.package), active: d.active !== false, sort: Number(d.sort) || 100 };
    if (!row.name) return;
    if (!supabase) { const list = this.state.cannedJobs || []; this.setState({ cannedJobs: d.id ? list.map((j) => (j.id === d.id ? { ...j, ...row } : j)) : list.concat({ id: 'cj' + Date.now(), uses: 0, ...row }), cannedEdit: null }); return; }
    const q = d.id ? supabase.from('canned_jobs').update(row).eq('id', d.id) : supabase.from('canned_jobs').insert({ ...row, shop_id: SHOP_ID });
    const { error } = await q;
    if (error) return this.setState({ err: error.message });
    this.setState({ cannedEdit: null }); await this.reload();
  },
  async removeCanned(id) {
    this.setState({ cannedJobs: (this.state.cannedJobs || []).filter((j) => j.id !== id), cannedEdit: null });
    if (supabase) await supabase.from('canned_jobs').update({ active: false }).eq('id', id);
  },
  async saveMatrix(p) {   // { labor_rates, parts_matrix, estimate_note }
    this.setState({ shop: { ...(this.state.shop || {}), ...p } });
    if (supabase) { const { error } = await supabase.from('shops').update(p).eq('shop_id', SHOP_ID); if (error) this.setState({ err: error.message }); }
  },

  // ---- jobs on a visit ----
  /** Build the lines for a job from a canned job: labor at the shop rate, parts priced by the matrix when no retail is set. */
  linesFrom(cj) {
    const sh = this.state.shop || {}; const rate = sh.labor_rate_cents || 12500;
    return (cj.lines || []).map((l) => {
      const out = { kind: l.kind || 'labor', description: l.description, qty: Number(l.qty) || 1, unit_cents: Number(l.unit_cents) || 0, cost_cents: Number(l.cost_cents) || 0, part_number: l.part_number || '', vendor: l.vendor || '', part_id: l.part_id || null };
      if (out.kind === 'labor' && !out.unit_cents) out.unit_cents = rate;
      if (out.kind === 'part' && !out.unit_cents && out.cost_cents) out.unit_cents = matrixPrice(out.cost_cents, sh.parts_matrix);
      return out;
    });
  },
  /** Add a job to a visit. mode 'estimate' sends it for approval; 'approved' puts it straight on the RO (the customer asked for it). */
  async addJob(apptId, job, mode) {
    const lines = (job.lines || []).map((l) => ({ kind: l.kind || 'labor', description: (l.description || '').trim(), qty: num(l.qty) || 1, unit_cents: l.unit_cents != null ? Number(l.unit_cents) : cents(l.unit), cost_cents: l.cost_cents != null ? Number(l.cost_cents) : cents(l.cost), part_number: l.part_number || '', vendor: l.vendor || '', part_id: l.part_id || null })).filter((l) => l.description);
    const row = { appointment_id: apptId, tier: job.tier || 'now', name: (job.name || '').trim(), plain: (job.plain || '').trim(), tech: (job.tech || '').trim(), meas: (job.meas || '').trim(), meas_label: (job.meas_label || '').trim(), urgency: (job.urgency || '').trim(), price_cents: job.package_cents || jobTotal(lines), lines, source: job.canned_job_id ? 'canned' : job.source || 'writer', canned_job_id: job.canned_job_id || null, status: mode === 'approved' ? 'approved' : 'pending', warranty: !!job.warranty };
    if (row.warranty) row.price_cents = 0;
    if (!row.name) return;
    if (!supabase) {
      const f = { id: 'f' + Date.now(), created_at: new Date().toISOString(), decided_at: mode === 'approved' ? new Date().toISOString() : null, token: 'demo' + Date.now(), ...row };
      let roLines = this.state.roLines || [];
      if (mode === 'approved') { const roId = await this.ensureRO(apptId); roLines = (this.state.roLines || []).concat(lines.map((l, i) => ({ id: 'l' + Date.now() + i, ro_id: roId, approved: true, finding_id: f.id, taxable: l.kind !== 'discount', sort: (l.kind === 'labor' ? 100 : l.kind === 'part' ? 200 : 300) + i, status: l.kind === 'part' && !l.part_id ? 'need' : '', created_at: new Date().toISOString(), ...l }))); }
      this.setState({ findings: this.state.findings.concat(f), roLines, jobPick: null, jobDraft: null }); return f;
    }
    if (mode === 'approved') await this.ensureRO(apptId);
    const { data, error } = await supabase.from('findings').insert({ ...row, shop_id: SHOP_ID }).select().single();
    if (error) return this.setState({ err: error.message });
    if (job.canned_job_id) supabase.from('canned_jobs').update({ uses: ((this.state.cannedJobs || []).find((j) => j.id === job.canned_job_id) || {}).uses + 1 || 1 }).eq('id', job.canned_job_id).then(() => {});
    this.setState({ jobPick: null, jobDraft: null }); await this.reload(); return data;
  },
  /** Edit a job's lines before (or after) it is sent; price follows. Approved jobs re-expand on the RO. */
  async saveJobLines(findingId, lines, patch) {
    const f = this.state.findings.find((x) => x.id === findingId); if (!f) return;
    const clean = lines.map((l) => ({ kind: l.kind || 'labor', description: (l.description || '').trim(), qty: num(l.qty) || 1, unit_cents: l.unit_cents != null ? Number(l.unit_cents) : cents(l.unit), cost_cents: l.cost_cents != null ? Number(l.cost_cents) : cents(l.cost), part_number: l.part_number || '', vendor: l.vendor || '', part_id: l.part_id || null })).filter((l) => l.description);
    const price = jobTotal(clean);
    this.setState({ findings: this.state.findings.map((x) => (x.id === findingId ? { ...x, ...patch, lines: clean, price_cents: price } : x)), jobEdit: null });
    if (!supabase) return;
    if (f.status === 'approved' || f.status === 'done') await supabase.from('ro_lines').delete().eq('finding_id', findingId);
    const { error } = await supabase.from('findings').update({ ...(patch || {}), lines: clean, price_cents: price }).eq('id', findingId);
    if (error) return this.setState({ err: error.message });
    if (f.status === 'approved' || f.status === 'done') await supabase.from('findings').update({ status: f.status }).eq('id', findingId);  // re-fires findings_to_ro
    await this.reload();
  },
  async decideJob(findingId, status) {   // the desk approves on the customer's say-so (phone, in person)
    await this.setFinding(findingId, { status, decided_at: new Date().toISOString() });
    if (supabase) await this.reloadRO();
  },
  estimateLink(apptId) {
    const f = this.state.findings.find((x) => x.appointment_id === apptId && x.token);
    return f ? (typeof location !== 'undefined' ? location.origin : 'https://dealer-os-rosy.vercel.app') + '/estimate/' + f.token : '';
  },
  async sendEstimate(apptId) {   // in-app message + text with the link
    const a = this.state.appointments.find((x) => x.id === apptId); if (!a) return;
    const link = this.estimateLink(apptId); const c = this.custOf(a.customer_id);
    const pend = this.state.findings.filter((f) => f.appointment_id === apptId && f.status === 'pending');
    if (!pend.length || !c) return;
    const body = 'Hi ' + c.name.split(' ')[0] + ', your estimate from ' + ((this.state.shop && this.state.shop.name) || 'the shop') + ' is ready: ' + pend.length + (pend.length === 1 ? ' item' : ' items') + ', ' + $(pend.reduce((t, f) => t + f.price_cents, 0)) + '. Review and approve here: ' + link;
    if (c.joined_at) await this.sendReply(c.id, 'Your estimate is ready — ' + pend.length + (pend.length === 1 ? ' item' : ' items') + ' to review in the app.');
    await this.sendText(c.id, body, 'estimate', apptId);
    this.setState({ estNote: 'Estimate sent to ' + c.name.split(' ')[0] + (c.joined_at ? ' in the app and by text.' : ' by text.') });
  },

  // ---- job board ----
  async assignJob(findingId, techIds) {
    this.setState({ findings: this.state.findings.map((f) => (f.id === findingId ? { ...f, techs: techIds } : f)) });
    if (supabase) await supabase.from('findings').update({ techs: techIds }).eq('id', findingId);
  },
  async clockOnJob(apptId, techId, findingId) {
    if (!techId) return;
    if (!supabase) { const now = new Date().toISOString(); this.setState({ timeEntries: (this.state.timeEntries || []).map((t) => (t.tech_id === techId && !t.ended_at ? { ...t, ended_at: now } : t)).concat({ id: 't' + Date.now(), appointment_id: apptId, tech_id: techId, finding_id: findingId || null, started_at: now, ended_at: null }), findings: this.state.findings.map((f) => (f.id === findingId ? { ...f, techs: (f.techs || []).includes(techId) ? f.techs : (f.techs || []).concat(techId), started_at: f.started_at || now } : f)) }); return; }
    const { error } = await supabase.rpc('clock_on', { p_appointment: apptId, p_tech: techId, p_job: findingId || null });
    if (error) return this.setState({ err: error.message });
    await this.reload();
  },
  jobHours(findingId) { return (this.state.timeEntries || []).filter((t) => t.finding_id === findingId).reduce((h, t) => h + (new Date(t.ended_at || Date.now()) - new Date(t.started_at)) / 36e5, 0); },
};

/** View-model pieces: the library picker, the estimate builder for a visit, the job board. */
export function jobVals(L, s, set, helpers) {
  const { vehName, fmtTime, relDay, STATUS } = helpers;
  const sh = s.shop || {};
  const lib = (s.cannedJobs || []).filter((j) => j.active !== false).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
  const q = (s.jobQ || '').trim().toLowerCase();
  const cats = Array.from(new Set(lib.map((j) => j.category))).sort();
  const libRows = lib.filter((j) => !q || j.name.toLowerCase().includes(q) || j.category.toLowerCase().includes(q)).map((j) => ({ id: j.id, name: j.name, category: j.category, hours: j.hours ? Number(j.hours).toFixed(1) + ' h' : '', total: $(j.package_cents || jobTotal(L.linesFrom(j))), uses: j.uses ? j.uses + '×' : '', edit: () => set({ cannedEdit: { ...j, package: j.package_cents ? (j.package_cents / 100).toFixed(2) : '', lines: (j.lines || []).map((l) => ({ ...l, unit: l.unit_cents ? (l.unit_cents / 100).toFixed(2) : '', cost: l.cost_cents ? (l.cost_cents / 100).toFixed(2) : '' })) } }) }));
  const ce = s.cannedEdit;
  const library = {
    rows: libRows, cats, q: s.jobQ || '', setQ: (v) => set({ jobQ: v }), empty: !s.loading && !lib.length, seed: () => L.seedLibrary(),
    openNew: () => set({ cannedEdit: { name: '', category: 'General', plain: '', package: '', lines: [{ kind: 'labor', description: '', qty: '1', unit: ((sh.labor_rate_cents || 12500) / 100).toFixed(2) }] } }),
    edit: ce ? { ...ce, set: (p) => set({ cannedEdit: { ...ce, ...p } }), setLine: (i, p) => set({ cannedEdit: { ...ce, lines: ce.lines.map((l, j) => (j === i ? { ...l, ...p, ...(p.cost !== undefined && l.kind === 'part' && !l.unit ? { unit: (matrixPrice(cents(p.cost), sh.parts_matrix) / 100).toFixed(2) } : {}) } : l)) } }),
      addLine: (kind) => set({ cannedEdit: { ...ce, lines: ce.lines.concat({ kind, description: '', qty: '1', unit: kind === 'labor' ? ((sh.labor_rate_cents || 12500) / 100).toFixed(2) : '', cost: '' }) } }), removeLine: (i) => set({ cannedEdit: { ...ce, lines: ce.lines.filter((_, j) => j !== i) } }),
      total: $(cents(ce.package) || jobTotal(ce.lines.map((l) => ({ kind: l.kind, qty: num(l.qty) || 1, unit_cents: cents(l.unit) })))), save: () => L.saveCanned(ce), cancel: () => set({ cannedEdit: null }), remove: ce.id ? () => L.removeCanned(ce.id) : null } : null,
    matrix: { labor_rates: Array.isArray(sh.labor_rates) ? sh.labor_rates : [], parts_matrix: Array.isArray(sh.parts_matrix) ? sh.parts_matrix : [], note: sh.estimate_note || '', save: (p) => L.saveMatrix(p) },
  };

  // The estimate for a visit: its jobs, with lines, and the picker to add more.
  const jobsFor = (apptId) => s.findings.filter((f) => f.appointment_id === apptId && f.source !== 'booked');
  const estimateFor = (a) => {
    if (!a) return null;
    const c = L.custOf(a.customer_id), v = L.vehOf(a.vehicle_id);
    const jobs = jobsFor(a.id);
    const pend = jobs.filter((f) => f.status === 'pending'), appr = jobs.filter((f) => f.status === 'approved' || f.status === 'done'), decl = jobs.filter((f) => f.status === 'declined');
    const je = s.jobEdit && s.jobEdit.id && jobs.some((f) => f.id === s.jobEdit.id) ? s.jobEdit : null;
    const jd = s.jobDraft && s.jobDraft.for === a.id ? s.jobDraft : null;
    const lineVm = (l) => ({ kind: l.kind, description: l.description, qty: Number(l.qty) === 1 ? '' : Number(l.qty) + (l.kind === 'labor' ? ' h' : ' ×'), unit: $(l.unit_cents), total: $(lineTotal(l)), meta: l.kind === 'part' ? [l.part_number, l.vendor, l.cost_cents ? 'cost ' + $(l.cost_cents) : ''].filter(Boolean).join(' · ') : '' });
    const jobVm = (f) => ({ id: f.id, name: f.name, plain: f.plain, tier: { now: 'Now', soon: 'Soon', monitor: 'Monitor' }[f.tier] || '', tierColor: { now: ACC, soon: YEL, monitor: GRN }[f.tier] || DIM, status: { pending: 'Waiting on customer', approved: 'Approved', declined: 'Declined', done: 'Done' }[f.status], color: { pending: YEL, approved: GRN, declined: DIM, done: GRN }[f.status],
      total: f.warranty ? 'Warranty' : $(f.price_cents), warranty: !!f.warranty, lines: (f.lines || []).map(lineVm), noLines: !(f.lines || []).length, source: f.source, when: relDay(f.decided_at || f.created_at),
      approve: f.status === 'pending' ? () => L.decideJob(f.id, 'approved') : null, decline: f.status === 'pending' ? () => L.decideJob(f.id, 'declined') : null, reopen: f.status === 'declined' ? () => L.decideJob(f.id, 'pending') : null,
      edit: f.status !== 'done' ? () => set({ jobEdit: { id: f.id, name: f.name, plain: f.plain, tier: f.tier, lines: (f.lines || []).map((l) => ({ ...l, unit: (l.unit_cents / 100).toFixed(2), cost: l.cost_cents ? (l.cost_cents / 100).toFixed(2) : '' })) } }) : null,
      remove: f.status === 'pending' || f.status === 'declined' ? () => L.removeFinding(f.id) : null, photos: s.photos.filter((p) => p.finding_id === f.id).map((p) => L.photoUrl(p)) });
    const editVm = je ? { ...je, set: (p) => set({ jobEdit: { ...je, ...p } }), setLine: (i, p) => set({ jobEdit: { ...je, lines: je.lines.map((l, j) => (j === i ? { ...l, ...p, ...(p.cost !== undefined && l.kind === 'part' && !l.unit ? { unit: (matrixPrice(cents(p.cost), sh.parts_matrix) / 100).toFixed(2) } : {}) } : l)) } }),
      addLine: (kind) => set({ jobEdit: { ...je, lines: je.lines.concat({ kind, description: '', qty: '1', unit: kind === 'labor' ? ((sh.labor_rate_cents || 12500) / 100).toFixed(2) : '', cost: '' }) } }), removeLine: (i) => set({ jobEdit: { ...je, lines: je.lines.filter((_, j) => j !== i) } }),
      total: $(jobTotal(je.lines.map((l) => ({ kind: l.kind, qty: num(l.qty) || 1, unit_cents: cents(l.unit) })))), save: () => L.saveJobLines(je.id, je.lines, { name: je.name.trim(), plain: je.plain, tier: je.tier }), cancel: () => set({ jobEdit: null }) } : null;
    const draftVm = jd ? { ...jd, set: (p) => set({ jobDraft: { ...jd, ...p } }), setLine: (i, p) => set({ jobDraft: { ...jd, lines: jd.lines.map((l, j) => (j === i ? { ...l, ...p, ...(p.cost !== undefined && l.kind === 'part' && !l.unit ? { unit: (matrixPrice(cents(p.cost), sh.parts_matrix) / 100).toFixed(2) } : {}) } : l)) } }),
      addLine: (kind) => set({ jobDraft: { ...jd, lines: jd.lines.concat({ kind, description: '', qty: '1', unit: kind === 'labor' ? ((sh.labor_rate_cents || 12500) / 100).toFixed(2) : '', cost: '' }) } }), removeLine: (i) => set({ jobDraft: { ...jd, lines: jd.lines.filter((_, j) => j !== i) } }),
      total: $(jobTotal(jd.lines.map((l) => ({ kind: l.kind, qty: num(l.qty) || 1, unit_cents: cents(l.unit) })))), ok: !!jd.name.trim() && jd.lines.some((l) => (l.description || '').trim()),
      send: () => L.addJob(a.id, { ...jd, canned_job_id: jd.canned_job_id || null }, 'estimate'), approve: () => L.addJob(a.id, { ...jd, canned_job_id: jd.canned_job_id || null }, 'approved'), cancel: () => set({ jobDraft: null }) } : null;
    const pickFrom = (cj) => set({ jobDraft: { for: a.id, name: cj.name, plain: cj.plain, tier: 'now', canned_job_id: cj.id, package_cents: cj.package_cents || 0, lines: L.linesFrom(cj).map((l) => ({ ...l, unit: (l.unit_cents / 100).toFixed(2), cost: l.cost_cents ? (l.cost_cents / 100).toFixed(2) : '' })) }, jobPick: null });
    const pq = (s.jobPickQ || '').trim().toLowerCase();
    const link = L.estimateLink(a.id);
    return {
      id: a.id, who: c ? c.name : 'Walk-in', phone: c ? c.phone : '', inApp: !!(c && c.joined_at), car: (vehName(v) || 'Vehicle') + (v && v.odometer ? ' · ' + v.odometer.toLocaleString('en-US') + ' mi' : ''), job: a.job || 'Service', when: fmtTime(a.starts_at), status: STATUS[a.status] ? STATUS[a.status][0] : '', color: STATUS[a.status] ? STATUS[a.status][1] : DIM,
      jobs: jobs.sort((x, y) => ({ pending: 0, approved: 1, done: 1, declined: 2 }[x.status] - { pending: 0, approved: 1, done: 1, declined: 2 }[y.status]) || x.created_at.localeCompare(y.created_at)).map(jobVm),
      pendTotal: $(pend.reduce((t, f) => t + f.price_cents, 0)), apprTotal: $(appr.reduce((t, f) => t + f.price_cents, 0)), declTotal: $(decl.reduce((t, f) => t + f.price_cents, 0)), pendCount: pend.length, apprCount: appr.length, declCount: decl.length,
      picking: !!s.jobPick && s.jobPick === a.id, openPick: () => set({ jobPick: a.id, jobPickQ: '' }), closePick: () => set({ jobPick: null }), pickQ: s.jobPickQ || '', setPickQ: (v) => set({ jobPickQ: v }),
      pickRows: lib.filter((j) => !pq || j.name.toLowerCase().includes(pq) || j.category.toLowerCase().includes(pq)).slice(0, 40).map((j) => ({ id: j.id, name: j.name, category: j.category, total: $(j.package_cents || jobTotal(L.linesFrom(j))), pick: () => pickFrom(j) })),
      custom: () => set({ jobDraft: { for: a.id, name: s.jobPickQ || '', plain: '', tier: 'now', lines: [{ kind: 'labor', description: s.jobPickQ || '', qty: '1', unit: ((sh.labor_rate_cents || 12500) / 100).toFixed(2) }] }, jobPick: null }),
      draft: draftVm, edit: editVm, link,
      send: pend.length && c ? () => L.sendEstimate(a.id) : null, sendLabel: pend.length ? 'Send estimate · ' + pend.length + (pend.length === 1 ? ' item' : ' items') : '', note: s.estNote || '', clearNote: () => set({ estNote: '' }),
      smsHref: c && c.phone && pend.length ? 'sms:' + c.phone + '?&body=' + encodeURIComponent('Hi ' + c.name.split(' ')[0] + ', your estimate from ' + (sh.name || 'the shop') + ' is ready. Review and approve here: ' + link) : '',
      copyLink: link ? () => { try { navigator.clipboard.writeText(link); set({ estNote: 'Link copied.' }); } catch (e) {} } : null,
    };
  };

  // Job board: today's visits, each job with its techs, clock and GP/hr
  const todayIso = new Date().toISOString().slice(0, 10);
  const boardVisits = s.appointments.filter((a) => ['arrived', 'in_progress', 'done'].includes(a.status) && (a.starts_at || '').slice(0, 10) === todayIso || ['arrived', 'in_progress'].includes(a.status));
  const techName = (id) => { const t = s.techs.find((x) => x.id === id); return t ? t.name.split(' ')[0] : ''; };
  const board = {
    techs: s.techs.filter((t) => t.active !== false).map((t) => { const open = (s.timeEntries || []).find((e) => e.tech_id === t.id && !e.ended_at); const onJob = open && s.findings.find((f) => f.id === open.finding_id); const onAppt = open && s.appointments.find((a) => a.id === open.appointment_id); return { id: t.id, name: t.name, initials: t.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), on: !!open, now: open ? (onJob ? onJob.name : onAppt ? onAppt.job || 'Service' : 'On a job') + ' · since ' + new Date(open.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Free', jobs: s.findings.filter((f) => (f.techs || []).includes(t.id) && f.status === 'approved').length, stop: open ? () => L.clockOff(t.id) : null }; }),
    visits: boardVisits.sort((x, y) => (x.bay || 9) - (y.bay || 9)).map((a) => {
      const c = L.custOf(a.customer_id), v = L.vehOf(a.vehicle_id), jobs = s.findings.filter((f) => f.appointment_id === a.id && (f.status === 'approved' || f.status === 'done'));
      const ro = (s.ros || []).find((r) => r.appointment_id === a.id); const t = ro ? L.roTotals(ro.id) : null; const hrs = L.hoursOn(a.id);
      const gp = t ? t.labor + t.partsMargin : 0;
      return { id: a.id, who: c ? c.name : 'Walk-in', car: vehName(v) || 'Vehicle', bay: a.bay ? 'Bay 0' + a.bay : 'No bay', status: STATUS[a.status][0], color: STATUS[a.status][1], booked: a.job || 'Service',
        gpHr: hrs && t ? '$' + Math.round(gp / 100 / hrs) + '/h' : '', hours: hrs ? hrs.toFixed(1) + ' h' : '', billed: t ? t.laborHours.toFixed(1) + ' h billed' : '',
        jobs: jobs.map((f) => { const open = (s.timeEntries || []).find((e) => e.finding_id === f.id && !e.ended_at); const jh = L.jobHours(f.id); const lh = (f.lines || []).filter((l) => l.kind === 'labor').reduce((x, l) => x + Number(l.qty), 0); return { id: f.id, name: f.name, total: $(f.price_cents), done: f.status === 'done', techs: (f.techs || []).map(techName).join(', '), on: !!open, onWho: open ? techName(open.tech_id) : '', hours: jh ? jh.toFixed(1) + ' h' + (lh ? ' of ' + lh.toFixed(1) : '') : lh ? lh.toFixed(1) + ' h booked' : '', eff: jh && lh ? Math.round((lh / jh) * 100) + '%' : '',
          start: (techId) => L.clockOnJob(a.id, techId, f.id), stop: open ? () => L.clockOff(open.tech_id) : null, markDone: f.status !== 'done' ? () => L.setFinding(f.id, { status: 'done', done_at: new Date().toISOString() }) : null, assign: (ids) => L.assignJob(f.id, ids), techIds: f.techs || [] }; }),
        open: () => set({ selId: a.id, day: (a.starts_at || '').slice(0, 10) }) };
    }),
    techOpts: s.techs.filter((t) => t.active !== false).map((t) => ({ id: t.id, name: t.name.split(' ')[0] })),
    empty: !s.loading && !boardVisits.length,
  };
  return { library, estimateFor, board };
}
