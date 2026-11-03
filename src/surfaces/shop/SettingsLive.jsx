import React from 'react';
import { css } from '../../runtime/tpl.js';
import { ShopSettingsLive } from './ShopSettingsLive.jsx';
import { Title, Err, Empty, LBL, INPUT, SELECT, CARD, DATA, Btn, Link, Field, Dot, Seg, LinesEditor, chip } from './ui.jsx';

const TABS = ['Shop', 'Jobs & pricing', 'Inspections', 'Texting', 'Booking & reminders', 'Integrations', 'Permissions', 'Activity'];

/** Settings for the live shop: the shop card plus the job library, pricing matrices, inspection templates,
 *  text templates, online booking and reminder rules, and integrations. */
export function SettingsLive({ vm }) {
  const canSettings = vm.can('settings'), owner = vm.isOwner;
  const tabs = TABS.filter((t) => (t === 'Permissions' ? owner : t === 'Activity' ? owner || vm.role === 'advisor' : canSettings));
  const [tab, setTab] = React.useState(tabs[0] || 'Activity');
  if (!tabs.length) return <div style={css('animation:sIn .28s ease')}><Title t="Settings" /><Empty>Settings are for the owner. Ask them if something needs changing.</Empty></div>;
  return (
    <div style={css('animation:sIn .28s ease')}>
      {tab !== 'Shop' ? <Title t="Settings" /> : null}
      <div style={css('display:flex;gap:6px;flex-wrap:wrap;' + (tab === 'Shop' ? 'margin-bottom:18px' : 'margin-top:18px'))}>{tabs.map((t) => <div key={t} onClick={() => setTab(t)} style={css(chip(tab === t))}>{t}</div>)}</div>
      <Err vm={vm} />
      {tab === 'Shop' ? <ShopSettingsLive /> : null}
      {tab === 'Jobs & pricing' ? <Jobs vm={vm} /> : null}
      {tab === 'Inspections' ? <Inspections vm={vm} /> : null}
      {tab === 'Texting' ? <Texting vm={vm} /> : null}
      {tab === 'Booking & reminders' ? <Booking vm={vm} /> : null}
      {tab === 'Integrations' ? <Integrations vm={vm} /> : null}
      {tab === 'Permissions' ? <Permissions vm={vm} /> : null}
      {tab === 'Activity' ? <Activity vm={vm} /> : null}
    </div>
  );
}

/** Who may do what. Owners can do everything; this is the advisor and technician matrix. */
function Permissions({ vm }) {
  const p = vm.permissions;
  const [m, setM] = React.useState(() => ({ advisor: { ...(p.matrix.advisor || {}) }, tech: { ...(p.matrix.tech || {}) } }));
  const [saved, setSaved] = React.useState('');
  const Cell = ({ role, k }) => { const on = !!m[role][k]; return <div onClick={() => { setM({ ...m, [role]: { ...m[role], [k]: !on } }); setSaved(''); }} style={css('width:34px;height:20px;border-radius:10px;background:' + (on ? '#30d158' : 'rgba(235,235,245,.15)') + ';position:relative;cursor:pointer;margin:0 auto')}><div style={css('position:absolute;top:2px;left:' + (on ? '16px' : '2px') + ';width:16px;height:16px;border-radius:8px;background:#fff;transition:left .18s ease')} /></div>; };
  return (
    <div style={css(CARD + ';margin-top:18px;max-width:760px')}>
      <div style={css('font-size:15px;font-weight:500')}>Permissions</div>
      <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.5')}>The owner can do everything. These are enforced by the database, not just hidden — a refund or void without the right is refused wherever it comes from.</div>
      <div style={css('display:grid;grid-template-columns:1fr 110px 110px;gap:0;margin-top:14px;font-size:13px')}>
        <div /><div style={css(LBL + ';text-align:center;padding-bottom:8px')}>Advisor</div><div style={css(LBL + ';text-align:center;padding-bottom:8px')}>Technician</div>
        {p.keys.map(([k, label]) => <React.Fragment key={k}><div style={css('padding:11px 0;border-top:1px solid rgba(235,235,245,.07)')}>{label}</div><div style={css('padding:11px 0;border-top:1px solid rgba(235,235,245,.07)')}><Cell role="advisor" k={k} /></div><div style={css('padding:11px 0;border-top:1px solid rgba(235,235,245,.07)')}><Cell role="tech" k={k} /></div></React.Fragment>)}
      </div>
      <div style={css('display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:16px')}><div style={css('font-size:12.5px;color:#30d158')}>{saved}</div><Btn on={() => { p.save(m); setSaved('Saved'); }}>Save</Btn></div>
    </div>
  );
}

/** Every change that matters, newest first: money, status, jobs, stock, settings — with who did it. */
function Activity({ vm }) {
  const [q, setQ] = React.useState('');
  const rows = vm.activity.filter((x) => !q || (x.who + ' ' + x.ref + ' ' + x.summary + ' ' + x.action).toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={css('margin-top:18px')}>
      <input value={q} placeholder="Search by name, RO, customer, action…" onChange={(e) => setQ(e.target.value)} style={css(INPUT + ';max-width:420px')} />
      <div style={css('margin-top:12px;border-top:1px solid rgba(235,235,245,.09)')}>
        {rows.map((x) => (
          <div key={x.id} style={css('display:grid;grid-template-columns:150px 130px 1fr 1.6fr;gap:14px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}>
            <div style={css('color:rgba(235,235,245,.5);font-size:12px')}>{x.when}</div>
            <div style={css('font-weight:500')}>{x.who}</div>
            <div><span style={css('font-family:var(--data-font,inherit);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:' + x.color)}>{x.action.replace('.', ' · ')}</span>{x.ref ? <span style={css('margin-left:10px;color:rgba(235,235,245,.7)')}>{x.ref}</span> : null}</div>
            <div style={css('color:rgba(235,235,245,.7)')}>{x.summary}</div>
          </div>
        ))}
        {!rows.length ? <Empty>{vm.activity.length ? 'No match.' : 'Nothing logged yet. Payments, refunds, status changes, estimate decisions, stock counts and settings changes appear here as they happen.'}</Empty> : null}
      </div>
    </div>
  );
}

function Jobs({ vm }) {
  const l = vm.library, e = l.edit;
  return (
    <div style={css('margin-top:18px;display:grid;grid-template-columns:1.5fr 1fr;gap:16px;align-items:start')}>
      <div style={css(CARD)}>
        <div style={css('display:flex;justify-content:space-between;align-items:center;gap:12px')}>
          <div><div style={css('font-size:15px;font-weight:500')}>Job library</div><div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{l.rows.length} canned jobs. A job carries its labor hours and parts, so the writer adds it in one tap.</div></div>
          <Btn on={l.openNew}>New job</Btn>
        </div>
        <input value={l.q} placeholder="Search…" onChange={(e) => l.setQ(e.target.value)} style={css(INPUT + ';margin-top:12px')} />
        {e ? (
          <div style={css('background:rgba(255,255,255,.04);border-radius:12px;padding:14px;margin-top:12px;display:flex;flex-direction:column;gap:10px')}>
            <div style={css('display:grid;grid-template-columns:2fr 1fr;gap:8px')}>
              <input value={e.name} autoFocus placeholder="Job name" onChange={(ev) => e.set({ name: ev.target.value })} style={css(INPUT)} />
              <input value={e.category} list="job-cats" placeholder="Category" onChange={(ev) => e.set({ category: ev.target.value })} style={css(INPUT)} />
              <datalist id="job-cats">{l.cats.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <textarea value={e.plain} rows={2} placeholder="What the customer reads" onChange={(ev) => e.set({ plain: ev.target.value })} style={css(INPUT + ';resize:vertical;line-height:1.45')} />
            <LinesEditor ed={e} />
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center')}>
              <input value={e.package} inputMode="decimal" placeholder="Package price · $ (blank = sum of lines)" onChange={(ev) => e.set({ package: ev.target.value })} style={css(INPUT + ';' + DATA)} />
              <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);line-height:1.4')}>Parts with a cost and no retail are priced by the matrix when the job is added.</div>
            </div>
            <div style={css('display:flex;gap:8px;align-items:center')}><Btn on={e.save} ok={!!e.name.trim()}>Save</Btn><Btn ghost on={e.cancel}>Cancel</Btn><div style={css('flex:1')} />{e.remove ? <Link on={e.remove}>Remove</Link> : null}</div>
          </div>
        ) : null}
        <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
          {l.rows.map((j) => (
            <div key={j.id} onClick={j.edit} style={css('display:grid;grid-template-columns:2fr 1fr .6fr .8fr .5fr;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;cursor:pointer')}>
              <div style={css('font-weight:500')}>{j.name}</div><div style={css('color:rgba(235,235,245,.5)')}>{j.category}</div><div style={css(DATA + ';color:rgba(235,235,245,.5)')}>{j.hours}</div><div style={css(DATA + ';text-align:right')}>{j.total}</div><div style={css(DATA + ';text-align:right;color:rgba(235,235,245,.4);font-size:12px')}>{j.uses}</div>
            </div>
          ))}
          {l.empty ? <Empty>The library is empty.<br /><span onClick={l.seed} style={css('color:#fff;cursor:pointer;text-decoration:underline')}>Load the starter library</span> — 28 common jobs with typical hours — and edit from there.</Empty> : null}
        </div>
      </div>
      <Matrix m={l.matrix} />
    </div>
  );
}

function Matrix({ m }) {
  const [rates, setRates] = React.useState(m.labor_rates.length ? m.labor_rates.map((r) => ({ name: r.name, rate: (r.cents / 100).toFixed(2) })) : [{ name: 'Standard', rate: '125.00' }]);
  const [tiers, setTiers] = React.useState(m.parts_matrix.length ? m.parts_matrix.map((t) => ({ upto: t.upto_cents ? (t.upto_cents / 100).toFixed(2) : '', pct: String(t.markup_pct) })) : [{ upto: '', pct: '40' }]);
  const [note, setNote] = React.useState(m.note);
  const [saved, setSaved] = React.useState('');
  const save = () => { m.save({ labor_rates: rates.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), cents: Math.round(parseFloat(r.rate || '0') * 100) || 0 })), parts_matrix: tiers.map((t) => ({ upto_cents: Math.round(parseFloat(t.upto || '0') * 100) || 0, markup_pct: parseFloat(t.pct) || 0 })), estimate_note: note.trim() }); setSaved('Saved'); };
  return (
    <div style={css(CARD)}>
      <div style={css('font-size:15px;font-weight:500')}>Pricing</div>
      <div style={css(LBL + ';margin-top:14px')}>Labor rates · $ per hour</div>
      {rates.map((r, i) => <div key={i} style={css('display:grid;grid-template-columns:1fr 110px 24px;gap:6px;margin-top:6px;align-items:center')}><input value={r.name} onChange={(e) => setRates(rates.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} style={css(INPUT + ';padding:9px 10px')} /><input value={r.rate} inputMode="decimal" onChange={(e) => setRates(rates.map((x, j) => (j === i ? { ...x, rate: e.target.value } : x)))} style={css(INPUT + ';padding:9px 10px;text-align:right;' + DATA)} /><div onClick={() => setRates(rates.filter((_, j) => j !== i))} style={css('color:rgba(235,235,245,.35);cursor:pointer;text-align:center')}>×</div></div>)}
      <div style={css('margin-top:6px')}><Link on={() => setRates(rates.concat({ name: '', rate: '' }))}>+ Rate</Link></div>
      <div style={css(LBL + ';margin-top:18px')}>Parts matrix · markup on cost</div>
      <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);margin-top:4px;line-height:1.4')}>Cost up to the amount on the left is marked up by the percentage on the right. The last tier with no limit covers the rest.</div>
      {tiers.map((t, i) => <div key={i} style={css('display:grid;grid-template-columns:1fr 90px 24px;gap:6px;margin-top:6px;align-items:center')}><input value={t.upto} inputMode="decimal" placeholder="Cost up to $ (blank = and above)" onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, upto: e.target.value } : x)))} style={css(INPUT + ';padding:9px 10px;' + DATA)} /><input value={t.pct} inputMode="decimal" placeholder="%" onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, pct: e.target.value } : x)))} style={css(INPUT + ';padding:9px 10px;text-align:right;' + DATA)} /><div onClick={() => setTiers(tiers.filter((_, j) => j !== i))} style={css('color:rgba(235,235,245,.35);cursor:pointer;text-align:center')}>×</div></div>)}
      <div style={css('margin-top:6px')}><Link on={() => setTiers(tiers.concat({ upto: '', pct: '' }))}>+ Tier</Link></div>
      <div style={css(LBL + ';margin-top:18px')}>Note on every estimate</div>
      <textarea value={note} rows={2} onChange={(e) => setNote(e.target.value)} style={css(INPUT + ';margin-top:6px;resize:vertical;line-height:1.45')} />
      <div style={css('display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:14px')}><div style={css('font-size:12.5px;color:#30d158')}>{saved}</div><Btn on={save}>Save</Btn></div>
    </div>
  );
}

function Inspections({ vm }) {
  const d = vm.dvi, e = d.edit;
  return (
    <div style={css('margin-top:18px;display:grid;grid-template-columns:1fr 1.5fr;gap:16px;align-items:start')}>
      <div style={css(CARD)}>
        <div style={css('display:flex;justify-content:space-between;align-items:center')}><div style={css('font-size:15px;font-weight:500')}>Inspection templates</div><Btn on={d.openNew}>New</Btn></div>
        <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.5')}>The technician picks a template on the iPad. The default opens on every visit.</div>
        <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
          {d.templates.map((t) => <div key={t.id} onClick={t.edit} style={css('display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;cursor:pointer')}><div style={css('font-weight:500')}>{t.name}{t.isDefault ? <span style={css('font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-left:8px;font-family:var(--data-font,inherit)')}>default</span> : null}{t.internal ? <span style={css('font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-left:8px;font-family:var(--data-font,inherit)')}>internal</span> : null}</div><div style={css('color:rgba(235,235,245,.5)')}>{t.count}</div></div>)}
        </div>
      </div>
      {e ? (
        <div style={css(CARD)}>
          <div style={css('display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center')}>
            <input value={e.name} autoFocus placeholder="Template name" onChange={(ev) => e.set({ name: ev.target.value })} style={css(INPUT)} />
            <div onClick={() => e.set({ is_default: !e.is_default })} style={css(chip(e.is_default))}>Default</div>
            <div onClick={() => e.set({ internal: !e.internal })} style={css(chip(e.internal))}>Internal only</div>
          </div>
          <div style={css(LBL + ';margin:16px 0 8px')}>Items · what the technician checks</div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {e.items.map((it, i) => (
              <div key={i} style={css('display:grid;grid-template-columns:1.4fr .8fr 1.6fr 1fr 1fr auto;gap:6px;align-items:center')}>
                <input value={it.label} placeholder="Item" onChange={(ev) => e.setItem(i, { label: ev.target.value })} style={css(INPUT + ';padding:9px 10px')} />
                <input value={it.measLabel} placeholder="Measure" onChange={(ev) => e.setItem(i, { measLabel: ev.target.value })} style={css(INPUT + ';padding:9px 10px')} />
                <input value={it.hint || ''} placeholder="What to look at" onChange={(ev) => e.setItem(i, { hint: ev.target.value })} style={css(INPUT + ';padding:9px 10px')} />
                <select value={it.now_job || ''} onChange={(ev) => e.setItem(i, { now_job: ev.target.value || null })} style={css(SELECT + ';padding:9px 8px;font-size:12px')}><option value="">If "now": quote…</option>{e.jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}</select>
                <select value={it.monitor_job || ''} onChange={(ev) => e.setItem(i, { monitor_job: ev.target.value || null })} style={css(SELECT + ';padding:9px 8px;font-size:12px')}><option value="">If "monitor": quote…</option>{e.jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}</select>
                <div style={css('display:flex;gap:6px;color:rgba(235,235,245,.35);font-size:14px')}><span onClick={() => e.move(i, -1)} style={css('cursor:pointer')}>↑</span><span onClick={() => e.move(i, 1)} style={css('cursor:pointer')}>↓</span><span onClick={() => e.removeItem(i)} style={css('cursor:pointer')}>×</span></div>
              </div>
            ))}
          </div>
          <div style={css('margin-top:8px')}><Link on={e.addItem}>+ Item</Link></div>
          <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);margin-top:10px;line-height:1.5')}>When an item is flagged and has a job set, that job's lines are quoted to the customer automatically — the technician only confirms.</div>
          <div style={css('display:flex;gap:8px;align-items:center;margin-top:14px')}><Btn on={e.save} ok={!!e.name.trim()}>Save</Btn><Btn ghost on={e.cancel}>Cancel</Btn><div style={css('flex:1')} />{e.remove ? <Link on={e.remove}>Delete template</Link> : null}</div>
        </div>
      ) : <Empty>Select a template to edit it.</Empty>}
    </div>
  );
}

function Texting({ vm }) {
  const c = vm.comms, e = c.tplEdit;
  return (
    <div style={css('margin-top:18px;display:grid;grid-template-columns:1.4fr 1fr;gap:16px;align-items:start')}>
      <div style={css(CARD)}>
        <div style={css('display:flex;justify-content:space-between;align-items:center')}><div style={css('font-size:15px;font-weight:500')}>Templates</div><Btn on={c.openNewTemplate}>New</Btn></div>
        <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.5')}>Confirmation, reminder, estimate, ready, thank-you and follow-up texts. Fields in braces fill in per customer.</div>
        {e ? (
          <div style={css('background:rgba(255,255,255,.04);border-radius:12px;padding:14px;margin-top:12px;display:flex;flex-direction:column;gap:8px')}>
            <input value={e.name} autoFocus placeholder="Name" onChange={(ev) => e.set({ name: ev.target.value })} style={css(INPUT)} />
            <textarea value={e.body} rows={3} placeholder="Message" onChange={(ev) => e.set({ body: ev.target.value })} style={css(INPUT + ';resize:vertical;line-height:1.45')} />
            <div style={css('display:flex;gap:6px;flex-wrap:wrap')}>{e.fields.map((f) => <div key={f} onClick={() => e.set({ body: (e.body || '') + ' ' + f })} style={css('padding:4px 9px;border-radius:7px;background:rgba(235,235,245,.08);font-size:11.5px;cursor:pointer;' + DATA)}>{f}</div>)}</div>
            <div style={css('display:flex;gap:8px;align-items:center')}><Btn on={e.save} ok={!!(e.name || '').trim() && !!(e.body || '').trim()}>Save</Btn><Btn ghost on={e.cancel}>Cancel</Btn><div style={css('flex:1')} />{e.remove ? <Link on={e.remove}>Delete</Link> : null}</div>
          </div>
        ) : null}
        <div style={css('margin-top:10px;border-top:1px solid rgba(235,235,245,.09)')}>
          {c.templates.map((t) => <div key={t.id} onClick={t.edit} style={css('padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer')}><div style={css('font-size:13px;font-weight:500')}>{t.name}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px;line-height:1.45')}>{t.body}</div></div>)}
        </div>
      </div>
      <div style={css('display:flex;flex-direction:column;gap:16px')}>
        <div style={css(CARD)}>
          <div style={css('display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500')}><Dot c={c.connected ? '#30d158' : '#ffd60a'} />{c.connected ? 'Shop number connected' : 'Shop number not connected'}</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:6px;line-height:1.5')}>{c.connected ? 'Texts send from the shop’s number. Replies land in the Inbox; "C" confirms a visit, STOP opts out.' : 'Until the shop’s 10DLC number is registered, every text opens in Messages on this device with the words ready — nothing is lost. See Integrations for the setup.'}</div>
          <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px')}>{[['Sent', c.stats.sent], ['Received', c.stats.received], ['Scheduled', c.stats.scheduled], ['From phone', c.stats.manual]].map(([k, v]) => <div key={k}><div style={css(DATA + ';font-size:18px;font-weight:600')}>{v}</div><div style={css('font-size:11px;color:rgba(235,235,245,.45)')}>{k}</div></div>)}</div>
        </div>
        {c.scheduled.length ? <div style={css(CARD)}><div style={css(LBL)}>Scheduled</div>{c.scheduled.map((m) => <div key={m.id} style={css('display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:12.5px')}><div><div style={css('font-weight:500')}>{m.who} · {m.when}</div><div style={css('color:rgba(235,235,245,.5);margin-top:2px')}>{m.text}</div></div>{m.cancel ? <Link on={m.cancel}>Cancel</Link> : null}</div>)}</div> : null}
        {c.manual.length ? <div style={css(CARD)}><div style={css(LBL)}>Waiting to be sent from the phone</div>{c.manual.map((m) => <div key={m.id} style={css('display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:12.5px')}><div><div style={css('font-weight:500')}>{m.who}</div><div style={css('color:rgba(235,235,245,.5);margin-top:2px')}>{m.text}</div></div><div style={css('display:flex;gap:10px')}><Link on={m.send} color="#fff">Send</Link><Link on={m.cancel}>Drop</Link></div></div>)}</div> : null}
      </div>
    </div>
  );
}

function Booking({ vm }) {
  const st = vm.calendar.settings;
  const [b, setB] = React.useState({ ...st.booking, services: (st.booking.services || []).map((x) => ({ ...x })) });
  const [r, setR] = React.useState({ ...st.reminders });
  const [days, setDays] = React.useState(st.openDays);
  const [from, setFrom] = React.useState(st.openFrom);
  const [to, setTo] = React.useState(st.openTo);
  const [saved, setSaved] = React.useState('');
  const save = () => { st.save({ booking: { ...b, slot_minutes: Number(b.slot_minutes) || 30, lead_hours: Number(b.lead_hours) || 0, days_ahead: Number(b.days_ahead) || 30, max_per_slot: Number(b.max_per_slot) || 1, bays: Number(b.bays) || 5, services: b.services.filter((x) => (x.name || '').trim()).map((x) => ({ name: x.name.trim(), minutes: Number(x.minutes) || 60 })) }, reminders: { ...r, remind_hours: Number(r.remind_hours) || 24, followup_days: Number(r.followup_days) || 3 }, open_days: days, open_from: from, open_to: to }); setSaved('Saved'); };
  const Toggle = ({ on, set, label, sub }) => (<div onClick={() => set(!on)} style={css('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer')}><div><div style={css('font-size:13px;font-weight:500')}>{label}</div>{sub ? <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{sub}</div> : null}</div><div style={css('width:40px;height:24px;border-radius:12px;background:' + (on ? '#30d158' : 'rgba(235,235,245,.15)') + ';position:relative;flex:0 0 auto')}><div style={css('position:absolute;top:2px;left:' + (on ? '18px' : '2px') + ';width:20px;height:20px;border-radius:10px;background:#fff;transition:left .18s ease')} /></div></div>);
  return (
    <div style={css('margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start')}>
      <div style={css(CARD)}>
        <div style={css('font-size:15px;font-weight:500')}>Online booking</div>
        <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.5')}>Customers book in the app and at <span style={css(DATA + ';color:#fff')}>{st.link}</span>. Slots come from these hours, the bays, and what is already booked.</div>
        <Toggle on={b.online} set={(v) => setB({ ...b, online: v })} label="Accept online bookings" />
        <div style={css(LBL + ';margin-top:14px')}>Open days</div>
        <div style={css('display:flex;gap:6px;margin-top:6px')}>{st.DOW.map((d, i) => <div key={d} onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : days.concat(i).sort())} style={css(chip(days.includes(i)) + ';padding:7px 0;flex:1;text-align:center')}>{d}</div>)}</div>
        <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:12px')}>
          <Field label="Open"><input value={from} onChange={(e) => setFrom(e.target.value)} style={css(INPUT + ';' + DATA)} /></Field>
          <Field label="Close"><input value={to} onChange={(e) => setTo(e.target.value)} style={css(INPUT + ';' + DATA)} /></Field>
          <Field label="Slot · min"><input value={b.slot_minutes} inputMode="numeric" onChange={(e) => setB({ ...b, slot_minutes: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
          <Field label="Per slot"><input value={b.max_per_slot} inputMode="numeric" onChange={(e) => setB({ ...b, max_per_slot: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
          <Field label="Lead time · h"><input value={b.lead_hours} inputMode="numeric" onChange={(e) => setB({ ...b, lead_hours: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
          <Field label="Days ahead"><input value={b.days_ahead} inputMode="numeric" onChange={(e) => setB({ ...b, days_ahead: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
          <Field label="Bays"><input value={b.bays} inputMode="numeric" onChange={(e) => setB({ ...b, bays: e.target.value })} style={css(INPUT + ';' + DATA)} /></Field>
        </div>
        <div style={css(LBL + ';margin-top:16px')}>Services customers can pick · minutes</div>
        {b.services.map((s, i) => <div key={i} style={css('display:grid;grid-template-columns:1fr 80px 24px;gap:6px;margin-top:6px;align-items:center')}><input value={s.name} onChange={(e) => setB({ ...b, services: b.services.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} style={css(INPUT + ';padding:9px 10px')} /><input value={s.minutes} inputMode="numeric" onChange={(e) => setB({ ...b, services: b.services.map((x, j) => (j === i ? { ...x, minutes: e.target.value } : x)) })} style={css(INPUT + ';padding:9px 10px;text-align:right;' + DATA)} /><div onClick={() => setB({ ...b, services: b.services.filter((_, j) => j !== i) })} style={css('color:rgba(235,235,245,.35);cursor:pointer;text-align:center')}>×</div></div>)}
        <div style={css('margin-top:6px')}><Link on={() => setB({ ...b, services: b.services.concat({ name: '', minutes: 60 }) })}>+ Service</Link></div>
      </div>
      <div style={css(CARD)}>
        <div style={css('font-size:15px;font-weight:500')}>Confirmations & reminders</div>
        <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.5')}>Sent as texts from the shop number once it is connected; as in-app notifications for customers in the app.</div>
        <Toggle on={r.confirm_on_book} set={(v) => setR({ ...r, confirm_on_book: v })} label="Confirmation when booked" sub="The customer replies C to confirm." />
        <div style={css('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}><div><div style={css('font-size:13px;font-weight:500')}>Reminder before the visit</div><div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>Hours before the appointment</div></div><input value={r.remind_hours} inputMode="numeric" onChange={(e) => setR({ ...r, remind_hours: e.target.value })} style={css(INPUT + ';width:80px;text-align:right;' + DATA)} /></div>
        <Toggle on={r.ready_text} set={(v) => setR({ ...r, ready_text: v })} label="Text when the vehicle is ready" sub="With the total and a pay link." />
        <Toggle on={r.thank_you} set={(v) => setR({ ...r, thank_you: v })} label="Thank-you after pickup" />
        <div style={css('display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0')}><div><div style={css('font-size:13px;font-weight:500')}>Follow up on declined work</div><div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>Days after the visit, from Follow-ups</div></div><input value={r.followup_days} inputMode="numeric" onChange={(e) => setR({ ...r, followup_days: e.target.value })} style={css(INPUT + ';width:80px;text-align:right;' + DATA)} /></div>
        <div style={css('display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:14px')}><div style={css('font-size:12.5px;color:#30d158')}>{saved}</div><Btn on={save}>Save</Btn></div>
      </div>
    </div>
  );
}

function Integrations({ vm }) {
  const c = vm.config || {};
  const cards = [
    { name: 'Texting · Twilio', on: !!c.sms, what: 'Two-way texts from the shop’s own number: confirmations, reminders, estimates, pay links, replies into the Inbox.', how: ['Create a Twilio account and buy a local number (or port the shop line).', 'Register the brand and campaign for 10DLC — Twilio’s Trust Hub walks through it; approval takes a few days.', 'Deploy the `sms` and `sms-inbound` functions with TWILIO_SID, TWILIO_TOKEN and TWILIO_FROM as secrets.', 'Set the number’s "A message comes in" webhook to the sms-inbound function URL.', 'In the database, app_config: sms_url = the sms function URL, sms_number = the shop number.'] },
    { name: 'Card payments · Stripe', on: !!c.stripe, what: 'Text-to-pay links and in-app payment with a card. Counter card payments are recorded from the shop’s own terminal either way.', how: ['Create a Stripe account for the shop.', 'Deploy the `pay` and `pay-webhook` functions with STRIPE_SECRET and STRIPE_WEBHOOK_SECRET.', 'Add a Stripe webhook for checkout.session.completed pointing at pay-webhook.', 'In app_config: stripe_pk = the publishable key.'] },
    { name: 'Parts · PartsTech', on: !!c.partstech, what: 'Live pricing and ordering across the shop’s suppliers from the To-order list.', how: ['Sign up at partstech.com with the shop’s supplier accounts (NAPA, O’Reilly, WorldPac…).', 'Request API access from PartsTech (free for shops) and get the partner and user keys.', 'In app_config: partstech_key. Until then, "Open PartsTech" works as a punch-out.'] },
    { name: 'Push · Apple', on: !!c.push, what: 'Notifications and the Live Activity on the customer’s iPhone.', how: ['Create an APNs key (.p8) in the Apple Developer account.', 'Deploy the `push` function with APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID.', 'In app_config: push_url = the push function URL.'] },
    { name: 'Accounting · QuickBooks', on: false, what: 'Paid invoices and payments into QuickBooks Online.', how: ['Today: download the CSV from Payments · Export and import it.', 'Direct sync arrives with an Intuit developer app for Revyn; nothing to set up on the shop side yet.'] },
  ];
  return (
    <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px;margin-top:18px')}>
      {cards.map((k) => (
        <div key={k.name} style={css(CARD)}>
          <div style={css('display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500')}><Dot c={k.on ? '#30d158' : 'rgba(235,235,245,.3)'} />{k.name}<div style={css('flex:1')} /><div style={css('font-size:11.5px;color:' + (k.on ? '#30d158' : 'rgba(235,235,245,.4)'))}>{k.on ? 'Connected' : 'Not connected'}</div></div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.6);margin-top:6px;line-height:1.5')}>{k.what}</div>
          {!k.on ? <ol style={css('margin:10px 0 0;padding-left:18px;font-size:12px;color:rgba(235,235,245,.45);line-height:1.6')}>{k.how.map((h, i) => <li key={i}>{h}</li>)}</ol> : null}
        </div>
      ))}
    </div>
  );
}
