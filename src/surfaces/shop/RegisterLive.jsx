import React from 'react';
import { css } from '../../runtime/tpl.js';
import { Title, Err, Empty, Tabs, LBL, INPUT, SELECT, CARD, DATA, Btn, Link, Field, Dot, KV, Stat, Seg } from './ui.jsx';

/** Payments: the day's money, the drawer, open invoices (A/R), store credit, sales tax, and exports. */
export function RegisterLive({ vm }) {
  const r = vm.register;
  return (
    <div style={css('animation:sIn .28s ease')}>
      <Title t="Payments" sub={r.dayLabel + (r.note ? ' · ' + r.note : '')} right={<>
        <input type="date" value={r.day} onChange={(e) => e.target.value && r.setDay(e.target.value)} style={css('background:rgba(235,235,245,.08);border:0;outline:0;border-radius:999px;padding:8px 14px;font-size:12.5px;color:rgba(235,235,245,.7);color-scheme:dark;font-family:inherit')} />
      </>} />
      <Err vm={vm} />
      <Tabs tabs={r.tabs} />
      {r.take ? <TakePayment t={r.take} /> : null}
      {r.refund ? <Refund f={r.refund} /> : null}

      {r.tab === 'Day' ? (
        <>
          <div style={css('display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:18px')}>{r.stats.map((s) => <Stat key={s.l} n={s.n} l={s.l} />)}</div>
          <div style={css('display:grid;grid-template-columns:1.5fr 1fr;gap:16px;margin-top:16px')}>
            <div style={css(CARD)}>
              <div style={css(LBL)}>Payments</div>
              {r.payments.map((p) => (
                <div key={p.id} style={css('display:grid;grid-template-columns:70px 1.4fr 80px 1fr 1fr auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}>
                  <div style={css('color:rgba(235,235,245,.5)')}>{p.time}</div><div style={css('font-weight:500')}>{p.who}</div><div style={css(DATA + ';color:rgba(235,235,245,.6)')}>{p.ro}</div><div>{p.method}{p.reference ? <span style={css('color:rgba(235,235,245,.4);margin-left:6px;font-size:12px')}>{p.reference}</span> : null}</div>
                  <div style={css(DATA + ';text-align:right;color:' + (p.refund ? '#ff6b64' : '#fff'))}>{p.amount}</div>
                  <div>{p.canRefund ? <Link on={p.canRefund}>Refund</Link> : null}</div>
                </div>
              ))}
              {r.noPayments ? <Empty>No payments taken {r.isToday ? 'yet today' : 'that day'}.</Empty> : null}
            </div>
            <div style={css('display:flex;flex-direction:column;gap:16px')}>
              <div style={css(CARD)}>
                <div style={css(LBL)}>By method</div>
                {r.methods.map((m) => <KV key={m.k} k={m.k + ' · ' + m.s} v={m.v} />)}
                {!r.methods.length ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:10px 0')}>—</div> : null}
                <div style={css(LBL + ';margin-top:18px')}>Sales breakdown</div>
                {r.breakdown.map(([k, v]) => <KV key={k} k={k} v={v} />)}
              </div>
              <Drawer r={r} />
            </div>
          </div>
        </>
      ) : null}

      {r.tab === 'Open invoices' ? (
        <div style={css('margin-top:18px')}>
          <div style={css('display:flex;gap:18px;font-size:13px;color:rgba(235,235,245,.55);margin-bottom:10px')}><div>Owed <span style={css(DATA + ';color:#fff')}>{r.arTotal}</span></div>{r.arOverdue ? <div style={css('color:#ffd60a')}>{r.arOverdue} past terms</div> : null}</div>
          <div style={css('border-top:1px solid rgba(235,235,245,.09)')}>
            {r.ar.map((a) => (
              <div key={a.id} style={css('display:grid;grid-template-columns:80px 1.4fr 1.4fr 1fr .8fr auto;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}>
                <div style={css(DATA + ';font-weight:600')}>{a.number}</div>
                <div><div style={css('font-weight:500')}>{a.who}{a.charge ? <span style={css('font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-left:8px;font-family:var(--data-font,inherit)')}>account</span> : null}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{a.car} · {a.job}</div></div>
                <div style={css('font-size:12px;color:' + (a.overdue ? '#ffd60a' : 'rgba(235,235,245,.5)'))}>Invoiced {a.since} · {a.days} {a.days === 1 ? 'day' : 'days'}{a.overdue ? ' · past terms' : ''}</div>
                <div style={css(DATA + ';font-size:14px;font-weight:600;text-align:right')}>{a.balance}</div>
                <div style={css('display:flex;gap:12px;justify-content:flex-end')}><Link on={a.take} color="#fff">Take payment</Link><Link on={a.link}>Text to pay</Link></div>
                <Link on={a.open}>Visit</Link>
              </div>
            ))}
            {!r.ar.length ? <Empty>Every invoice is paid.</Empty> : null}
          </div>
        </div>
      ) : null}

      {r.tab === 'Store credit' ? (
        <div style={css('margin-top:18px')}>
          <div style={css('display:flex;justify-content:flex-end;margin-bottom:12px')}><Btn on={r.openCredit}>Issue credit</Btn></div>
          {r.creditEdit ? <CreditForm f={r.creditEdit} /> : null}
          <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px')}>
            {r.credits.map((c) => (
              <div key={c.id} style={css(CARD)}>
                <div style={css('display:flex;justify-content:space-between;align-items:baseline')}><div style={css('font-size:15px;font-weight:500')}>{c.who}</div><div style={css(DATA + ';font-size:16px;font-weight:600;color:#30d158')}>{c.balance}</div></div>
                {c.history.map((h, i) => <div key={i} style={css('display:flex;justify-content:space-between;gap:10px;font-size:12px;color:rgba(235,235,245,.5);margin-top:6px')}><div>{h.t}</div><div>{h.d}</div></div>)}
              </div>
            ))}
            {!r.credits.length ? <Empty>No store credit outstanding. Refunds can be issued as credit; goodwill and trade credit are issued here.</Empty> : null}
          </div>
        </div>
      ) : null}

      {r.tab === 'Sales tax' ? (
        <div style={css(CARD + ';margin-top:18px;max-width:820px')}>
          <div style={css('display:flex;gap:10px;align-items:flex-end')}>
            <Field label="From"><input type="date" value={r.tax.from} onChange={(e) => r.tax.setFrom(e.target.value)} style={css(INPUT + ';color-scheme:dark')} /></Field>
            <Field label="To"><input type="date" value={r.tax.to} onChange={(e) => r.tax.setTo(e.target.value)} style={css(INPUT + ';color-scheme:dark')} /></Field>
            <Btn on={r.tax.run}>Run</Btn>
            <div style={css('flex:1')} />
            {r.tax.download ? <Btn ghost on={r.tax.download}>Download CSV</Btn> : null}
          </div>
          <div style={css('margin-top:16px')}>
            <div style={css('display:grid;grid-template-columns:1.4fr .6fr 1fr 1fr 1fr 1fr;gap:12px;padding:8px 0;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);font-family:var(--data-font,inherit);border-bottom:1px solid rgba(235,235,245,.09)')}><div>Month</div><div>Invoices</div><div style={css('text-align:right')}>Sales</div><div style={css('text-align:right')}>Taxable</div><div style={css('text-align:right')}>Tax at {r.tax.rate}</div><div style={css('text-align:right')}>Total</div></div>
            {r.tax.months.map((m) => <div key={m.month} style={css('display:grid;grid-template-columns:1.4fr .6fr 1fr 1fr 1fr 1fr;gap:12px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}><div>{m.month}</div><div>{m.invoices}</div><div style={css(DATA + ';text-align:right')}>{m.subtotal}</div><div style={css(DATA + ';text-align:right')}>{m.taxable}</div><div style={css(DATA + ';text-align:right;font-weight:600')}>{m.tax}</div><div style={css(DATA + ';text-align:right')}>{m.total}</div></div>)}
            {r.tax.total ? <div style={css('display:flex;justify-content:space-between;font-size:15px;font-weight:600;padding:12px 0 0')}><div>Tax collected</div><div style={css(DATA)}>{r.tax.total}</div></div> : <Empty>Pick the filing period and run.</Empty>}
          </div>
        </div>
      ) : null}

      {r.tab === 'Export' ? (
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px;max-width:900px')}>
          <div style={css(CARD)}>
            <div style={css('font-size:15px;font-weight:500')}>QuickBooks</div>
            <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.5')}>Paid invoices with every line, tax and the payments against them, as a CSV QuickBooks Online imports. {r.quickbooks.count} {r.quickbooks.count === 1 ? 'invoice' : 'invoices'} in the range.</div>
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px')}>
              <Field label="From"><input type="date" value={r.quickbooks.from} onChange={(e) => r.quickbooks.setFrom(e.target.value)} style={css(INPUT + ';color-scheme:dark')} /></Field>
              <Field label="To"><input type="date" value={r.quickbooks.to} onChange={(e) => r.quickbooks.setTo(e.target.value)} style={css(INPUT + ';color-scheme:dark')} /></Field>
            </div>
            <div style={css('display:flex;gap:8px;margin-top:14px')}><Btn on={r.quickbooks.download}>Invoices & payments CSV</Btn><Btn ghost on={r.quickbooks.downloadPayments}>Payments only</Btn></div>
            <div style={css('font-size:11.5px;color:rgba(235,235,245,.35);margin-top:10px;line-height:1.5')}>A direct QuickBooks Online sync (OAuth) comes once the shop’s Intuit developer app is approved; the CSV covers the books until then.</div>
          </div>
          <div style={css(CARD)}>
            <div style={css('font-size:15px;font-weight:500')}>End of day</div>
            <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.5')}>Everything on the Day tab, printable for the file: sales, by method, drawer count, what is still owed.</div>
            <div style={css('display:flex;gap:8px;margin-top:14px')}><Btn ghost on={() => { try { window.print(); } catch (e) {} }}>Print today</Btn></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Drawer({ r }) {
  const [opening, setOpening] = React.useState('200');
  const [counted, setCounted] = React.useState('');
  const d = r.drawer;
  return (
    <div style={css(CARD)}>
      <div style={css(LBL)}>Cash drawer</div>
      {d ? (
        <>
          <KV k={'Open since ' + d.since} v={d.opening + ' opening'} />
          <KV k="Cash taken" v={d.cash} />
          <KV k="Expected in drawer" v={d.expected} strong />
          <div style={css('display:flex;gap:8px;margin-top:12px;align-items:center')}>
            <input value={counted} inputMode="decimal" placeholder="$ counted" onChange={(e) => setCounted(e.target.value)} style={css(INPUT + ';' + DATA)} />
            <Btn on={() => { d.close(counted, ''); setCounted(''); }} ok={!!counted}>Close drawer</Btn>
          </div>
        </>
      ) : (
        <div style={css('display:flex;gap:8px;margin-top:10px;align-items:center')}>
          <input value={opening} inputMode="decimal" placeholder="$ opening float" onChange={(e) => setOpening(e.target.value)} style={css(INPUT + ';' + DATA)} />
          <Btn ghost on={() => r.openDrawer(opening)}>Open drawer</Btn>
        </div>
      )}
      {r.lastDrawer ? <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:12px')}>Last close {r.lastDrawer.when} · expected {r.lastDrawer.expected}, counted {r.lastDrawer.counted} · <span style={css('color:' + r.lastDrawer.color)}>{r.lastDrawer.diff}</span></div> : null}
    </div>
  );
}

/** Take a payment on an RO. Rendered on the Payments page and inside the appointment's invoice. */
export function TakePayment({ t, compact }) {
  return (
    <div style={css(CARD + ';margin-top:' + (compact ? '10px' : '18px') + ';max-width:' + (compact ? '100%' : '620px') + ';background:#1c1c1e')}>
      <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
        <div style={css('font-size:15px;font-weight:500')}>Take payment · {t.ro}</div>
        <div style={css('font-size:12.5px;color:rgba(235,235,245,.5)')}>{t.who} · {t.balance} due of {t.total}</div>
      </div>
      <div style={css('display:flex;gap:6px;flex-wrap:wrap;margin-top:12px')}>
        {t.methods.map((m) => <div key={m.k} onClick={m.pick} style={css('padding:8px 12px;border-radius:10px;font-size:12.5px;font-weight:500;cursor:pointer;' + (m.on ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)'))}>{m.label}{m.k === 'store_credit' ? ' · ' + t.credit : ''}</div>)}
      </div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px')}>
        <input value={t.amount} inputMode="decimal" placeholder="$ amount" onChange={(e) => t.set({ amount: e.target.value })} style={css(INPUT + ';' + DATA + ';font-size:15px')} autoFocus />
        <input value={t.reference} placeholder={t.method === 'check' ? 'Check #' : t.method === 'card' ? 'Last four / auth' : 'Reference'} onChange={(e) => t.set({ reference: e.target.value })} style={css(INPUT)} />
        <input value={t.note} placeholder="Note" onChange={(e) => t.set({ note: e.target.value })} style={css(INPUT)} />
      </div>
      {t.method === 'card' ? <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);margin-top:8px;line-height:1.5')}>Run the card on the shop terminal and record it here, or send a text-to-pay link and it records itself when paid.</div> : null}
      {t.method === 'charge' ? <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);margin-top:8px;line-height:1.5')}>Puts the balance on the customer’s account. It shows under Open invoices until paid.</div> : null}
      <div style={css('display:flex;gap:8px;margin-top:12px;align-items:center')}>
        <Btn on={t.save} ok={t.ok}>Record {t.amount ? '$' + t.amount : ''}</Btn>
        <Btn ghost on={t.link}>Text to pay</Btn>
        <div style={css('flex:1')} />
        <Link on={t.cancel}>Cancel</Link>
      </div>
    </div>
  );
}

function Refund({ f }) {
  return (
    <div style={css(CARD + ';margin-top:18px;max-width:620px;background:#1c1c1e')}>
      <div style={css('font-size:15px;font-weight:500')}>Refund</div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px')}>
        <input value={f.amount} inputMode="decimal" placeholder="$ amount" onChange={(e) => f.set({ amount: e.target.value })} style={css(INPUT + ';' + DATA)} autoFocus />
        <input value={f.note} placeholder="Reason" onChange={(e) => f.set({ note: e.target.value })} style={css(INPUT)} />
      </div>
      <div style={css('margin-top:10px')}><Seg small opts={[[false, 'Back to the original method'], [true, 'As store credit']]} value={f.asCredit} pick={(k) => f.set({ asCredit: k })} /></div>
      <div style={css('display:flex;gap:8px;margin-top:12px')}><Btn on={f.save}>Refund</Btn><Btn ghost on={f.cancel}>Cancel</Btn></div>
    </div>
  );
}

function CreditForm({ f }) {
  return (
    <div style={css(CARD + ';margin-bottom:16px;max-width:720px;background:#1c1c1e')}>
      <div style={css('display:grid;grid-template-columns:1.4fr .8fr 1fr 1.4fr;gap:8px')}>
        <select value={f.customer_id} onChange={(e) => f.set({ customer_id: e.target.value })} style={css(SELECT)}><option value="">Customer…</option>{f.custOpts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <input value={f.amount} inputMode="decimal" placeholder="$ amount" onChange={(e) => f.set({ amount: e.target.value })} style={css(INPUT + ';' + DATA)} />
        <select value={f.kind} onChange={(e) => f.set({ kind: e.target.value })} style={css(SELECT)}><option value="store_credit">Store credit</option><option value="goodwill">Goodwill</option><option value="trade">Trade credit</option></select>
        <input value={f.note} placeholder="Why" onChange={(e) => f.set({ note: e.target.value })} style={css(INPUT)} />
      </div>
      <div style={css('display:flex;gap:8px;margin-top:12px')}><Btn on={f.save} ok={f.ok}>Issue</Btn><Btn ghost on={f.cancel}>Cancel</Btn></div>
    </div>
  );
}
