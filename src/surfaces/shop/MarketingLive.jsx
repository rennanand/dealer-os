import React from 'react';
import { css } from '../../runtime/tpl.js';
import { Title, Err, Empty, LBL, INPUT, SELECT, CARD, DATA, Btn, Link, Field, Dot, Seg, Stat, chip } from './ui.jsx';

/** Marketing: pick who, write the message, send now or schedule; see what each campaign did. */
export function MarketingLive({ vm }) {
  const m = vm.marketing, e = m.edit;
  return (
    <div style={css('animation:sIn .28s ease')}>
      <Title t="Marketing" sub={m.stats.sent + (m.stats.sent === 1 ? ' campaign sent' : ' campaigns sent') + ' · ' + m.stats.reach + ' reached · ' + m.stats.optedOut + ' opted out of texts · ' + m.stats.noMarket + ' do-not-market'} right={!e ? <Btn on={m.openNew}>New campaign</Btn> : null} />
      <Err vm={vm} />
      {m.note ? <div onClick={m.clearNote} style={css('margin-top:12px;font-size:12.5px;color:#30d158;cursor:pointer')}>{m.note}</div> : null}
      {!m.smsConnected ? <div style={css('margin-top:12px;font-size:12.5px;color:rgba(235,235,245,.5)')}>Texts wait under Settings · Texting until the shop number is connected; emails wait under Integrations until email is connected. Nothing is lost.</div> : null}
      {e ? <Editor e={e} /> : null}
      <div style={css('margin-top:18px;display:flex;flex-direction:column;gap:10px')}>
        {m.campaigns.map((c) => <Campaign key={c.id} c={c} />)}
        {m.empty && !e ? <Empty>No campaigns yet. Start with "Due for service" — the customers whose intervals say it's time.</Empty> : null}
      </div>
    </div>
  );
}

function Editor({ e }) {
  const [when, setWhen] = React.useState('');
  React.useEffect(() => { e.previewLoad(); }, [JSON.stringify(e.segment), e.channel]);
  const seg = e.segment;
  return (
    <div style={css(CARD + ';margin-top:18px;display:grid;grid-template-columns:1fr 1.2fr;gap:20px')}>
      <div>
        <div style={css(LBL)}>Who</div>
        <div style={css('display:flex;gap:6px;flex-wrap:wrap;margin-top:8px')}>{e.presets.map((p) => <div key={p.label} onClick={p.pick} style={css(chip(p.on) + ';font-size:12px;padding:7px 11px')}>{p.label}</div>)}</div>
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px')}>
          <Field label="No visit in · months"><input value={seg.lapsed_months || ''} inputMode="numeric" onChange={(ev) => e.setSeg({ lapsed_months: parseInt(ev.target.value, 10) || 0 })} style={css(INPUT + ';padding:9px 10px;' + DATA)} /></Field>
          <Field label="Visited within · months"><input value={seg.active_months || ''} inputMode="numeric" onChange={(ev) => e.setSeg({ active_months: parseInt(ev.target.value, 10) || 0 })} style={css(INPUT + ';padding:9px 10px;' + DATA)} /></Field>
          <Field label="At least · visits"><input value={seg.min_visits || ''} inputMode="numeric" onChange={(ev) => e.setSeg({ min_visits: parseInt(ev.target.value, 10) || 0 })} style={css(INPUT + ';padding:9px 10px;' + DATA)} /></Field>
          <Field label="Spent at least · $"><input value={seg.min_spent_cents ? seg.min_spent_cents / 100 : ''} inputMode="numeric" onChange={(ev) => e.setSeg({ min_spent_cents: Math.round((parseFloat(ev.target.value) || 0) * 100) })} style={css(INPUT + ';padding:9px 10px;' + DATA)} /></Field>
        </div>
        <div style={css('display:flex;gap:6px;flex-wrap:wrap;margin-top:12px')}>
          <div onClick={() => e.setSeg({ due: !seg.due })} style={css(chip(!!seg.due) + ';font-size:12px;padding:7px 11px')}>Due for service</div>
          <div onClick={() => e.setSeg({ declined: !seg.declined })} style={css(chip(!!seg.declined) + ';font-size:12px;padding:7px 11px')}>Declined work waiting</div>
          {e.tags.map((t) => { const on = (seg.tags || []).includes(t); return <div key={t} onClick={() => e.setSeg({ tags: on ? seg.tags.filter((x) => x !== t) : (seg.tags || []).concat(t) })} style={css(chip(on) + ';font-size:12px;padding:7px 11px')}>{t}</div>; })}
        </div>
        {e.makes.length ? <div style={css('display:flex;gap:6px;flex-wrap:wrap;margin-top:8px')}>{e.makes.slice(0, 12).map((mk) => { const on = (seg.makes || []).includes(mk); return <div key={mk} onClick={() => e.setSeg({ makes: on ? seg.makes.filter((x) => x !== mk) : (seg.makes || []).concat(mk) })} style={css(chip(on) + ';font-size:12px;padding:7px 11px')}>{mk}</div>; })}</div> : null}
        <div style={css('margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.04);font-size:13px')}>
          <div style={css('font-weight:600')}>{e.preview ? e.preview.count + (e.preview.count === 1 ? ' customer' : ' customers') : 'Counting…'} <span style={css('font-weight:400;color:rgba(235,235,245,.5)')}>· {e.segLabel} · by {e.channel}</span></div>
          {e.preview && e.preview.sample.length ? <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:4px')}>{e.preview.sample.join(', ')}{e.preview.count > e.preview.sample.length ? '…' : ''}</div> : null}
          <div style={css('font-size:11.5px;color:rgba(235,235,245,.35);margin-top:6px')}>Skips anyone marked do-not-market, opted out of texts, or without a number / email.</div>
        </div>
      </div>
      <div>
        <div style={css('display:grid;grid-template-columns:1fr 160px;gap:8px')}>
          <Field label="Campaign name"><input value={e.name} autoFocus placeholder="Winter tires · November" onChange={(ev) => e.set({ name: ev.target.value })} style={css(INPUT)} /></Field>
          <Field label="Channel"><Seg small opts={[['text', 'Text'], ['email', 'Email']]} value={e.channel} pick={e.setChannel} /></Field>
        </div>
        {e.channel === 'email' ? <div style={css('margin-top:8px')}><Field label="Subject"><input value={e.subject} onChange={(ev) => e.set({ subject: ev.target.value })} style={css(INPUT)} /></Field></div> : null}
        <div style={css('margin-top:8px')}>
          <Field label={'Message' + (e.channel === 'text' ? ' · ' + e.chars + ' characters · ' + e.segments + (e.segments === 1 ? ' text' : ' texts') : '')}>
            <textarea value={e.body} rows={e.channel === 'email' ? 8 : 4} onChange={(ev) => e.set({ body: ev.target.value })} style={css(INPUT + ';resize:vertical;line-height:1.5')} />
          </Field>
          <div style={css('display:flex;gap:6px;flex-wrap:wrap;margin-top:6px')}>{e.fields.map((f) => <div key={f} onClick={() => e.set({ body: e.body + ' ' + f })} style={css('padding:4px 9px;border-radius:7px;background:rgba(235,235,245,.08);font-size:11.5px;cursor:pointer;' + DATA)}>{f}</div>)}</div>
        </div>
        <div style={css('display:flex;gap:8px;align-items:center;margin-top:16px;flex-wrap:wrap')}>
          <Btn on={e.send} ok={e.ok && !!(e.preview && e.preview.count)}>Send now</Btn>
          <input type="datetime-local" value={when} onChange={(ev) => setWhen(ev.target.value)} style={css(INPUT + ';width:auto;color-scheme:dark;padding:9px 10px')} />
          <Btn ghost on={() => when && e.schedule(new Date(when).toISOString())} ok={e.ok && !!when}>Schedule</Btn>
          <Btn ghost on={e.save} ok={e.ok}>Save draft</Btn>
          <div style={css('flex:1')} />
          <Link on={e.cancel}>Cancel</Link>
        </div>
      </div>
    </div>
  );
}

function Campaign({ c }) {
  React.useEffect(() => { if (c.loadResults && !c.results) c.loadResults(); }, [c.id]);
  const r = c.results;
  return (
    <div style={css(CARD + ';padding:16px 18px')}>
      <div style={css('display:grid;grid-template-columns:1.4fr 1fr 1.2fr 1fr auto;gap:14px;align-items:center;font-size:13px')}>
        <div><div style={css('font-size:15px;font-weight:500')}>{c.name}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{c.channel} · {c.segment}</div></div>
        <div style={css('display:flex;align-items:center;gap:7px;color:' + c.color)}><Dot c={c.color} />{c.status}</div>
        <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{c.when}{c.count ? ' · ' + c.count + ' sent' : ''}</div>
        <div style={css('font-size:12px;color:rgba(235,235,245,.6);' + DATA)}>{r ? (r.delivered + ' delivered · ' + r.replied + ' replied · ' + r.booked + ' booked · ' + r.revenue) : ''}</div>
        <div style={css('display:flex;gap:12px')}>{c.edit ? <Link on={c.edit}>Edit</Link> : null}<Link on={c.duplicate}>Duplicate</Link>{c.cancel ? <Link on={c.cancel}>Cancel</Link> : null}</div>
      </div>
    </div>
  );
}
