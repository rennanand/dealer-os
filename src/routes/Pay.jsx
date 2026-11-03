import React from 'react';
import { useParams } from 'react-router-dom';
import { css } from '../runtime/tpl.js';
import { supabase, SUPABASE_URL } from '../state/supabase.js';

// Text-to-pay: /pay/<token>. The invoice as the customer sees it, with a card button when the shop
// has Stripe connected, and "pay at the counter" otherwise.

const FONT = "font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const PAGE = 'min-height:100%;background:#000;color:#fff;' + FONT;
const WRAP = 'max-width:430px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 22px calc(env(safe-area-inset-bottom,0px) + 40px)';
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px';
const DATA = 'font-family:var(--data-font,inherit)';
const $ = (c) => '$' + ((c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DEMO = { number: 1042, status: 'invoiced', link_status: 'open', customer: 'Sarah', vehicle: '2021 Toyota 4Runner', job: 'Brakes', card: false, paid: 0, shop: { name: 'RyGuys Tire & Auto Sales', phone: '4358354869', address: '204 N Main St, Manti, UT 84642' },
  totals: { labor: 22500, parts: 24985, fees: 0, discount: 0, subtotal: 47485, tax: 3443, total: 50928 }, lines: [{ kind: 'labor', description: 'Front brake pads & rotors', qty: 1.8, unit_cents: 12500, cents: 22500 }, { kind: 'part', description: 'Front brake pads · ceramic', qty: 1, unit_cents: 8995, cents: 8995 }, { kind: 'part', description: 'Front rotors', qty: 2, unit_cents: 7995, cents: 15990 }] };

export function PayRoute() {
  const { token } = useParams();
  const [st, set] = React.useState({ loading: true, inv: null, err: '' });
  const [busy, setBusy] = React.useState(false);
  const justPaid = /[?&]paid=1/.test(window.location.search);
  const load = React.useCallback(async () => {
    if (!supabase) return set({ loading: false, inv: DEMO, err: '' });
    const { data, error } = await supabase.rpc('invoice_by_token', { p_token: token });
    if (error || !data) return set({ loading: false, inv: null, err: 'This link is not valid.' });
    set({ loading: false, inv: data, err: '' });
  }, [token]);
  React.useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  const inv = st.inv;
  if (st.loading) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center;color:rgba(235,235,245,.45);font-size:13px')}>Loading…</div></div>;
  if (!inv) return <div style={css(PAGE)}><div style={css(WRAP + ';padding-top:120px;text-align:center')}><div style={css('font-size:20px;font-weight:600')}>{st.err}</div></div></div>;
  const due = (inv.totals.total || 0) - (inv.paid || 0);
  const paid = due <= 0 || inv.status === 'paid';
  const pay = async () => {
    if (busy || !supabase) return; setBusy(true);
    try {
      const r = await fetch(SUPABASE_URL + '/functions/v1/pay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
      const j = await r.json();
      if (j.url) window.location.href = j.url; else set({ ...st, err: j.error || 'Could not start the payment.' });
    } catch (e) { set({ ...st, err: 'Could not reach the payment service.' }); }
    setBusy(false);
  };
  const KIND = { labor: 'Labor', part: 'Part', fee: 'Fee', discount: 'Discount' };
  return (
    <div style={css(PAGE)}>
      <div style={css(WRAP)}>
        <div style={css(LBL)}>{inv.shop.name} · Invoice {inv.number}</div>
        <div style={css('font-size:26px;font-weight:600;letter-spacing:-.6px;margin-top:6px;line-height:1.15')}>{paid ? 'Paid. Thank you, ' + inv.customer + '.' : (justPaid ? 'Payment received.' : 'Your invoice, ' + inv.customer + '.')}</div>
        <div style={css('font-size:13px;color:rgba(235,235,245,.55);margin-top:6px;line-height:1.5')}>{inv.vehicle}{inv.job ? ' · ' + inv.job : ''}</div>
        {st.err ? <div style={css('margin-top:12px;font-size:12.5px;color:#ff6b64')}>{st.err}</div> : null}
        <div style={css(CARD + ';margin-top:22px')}>
          {inv.lines.map((l, i) => <div key={i} style={css('display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px')}><div><span style={css('font-family:var(--data-font,inherit);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.35);margin-right:8px')}>{KIND[l.kind] || l.kind}</span>{l.description}{Number(l.qty) !== 1 ? <span style={css('color:rgba(235,235,245,.4);margin-left:6px;font-size:12px')}>{Number(l.qty)}{l.kind === 'labor' ? ' h' : ' ×'}</span> : null}</div><div style={css(DATA + ';white-space:nowrap')}>{$(l.cents)}</div></div>)}
          <div style={css('margin-top:10px')}>
            {[['Subtotal', inv.totals.subtotal], ['Tax', inv.totals.tax]].map(([k, v]) => <div key={k} style={css('display:flex;justify-content:space-between;font-size:12.5px;color:rgba(235,235,245,.55);padding:3px 0')}><span>{k}</span><span style={css(DATA)}>{$(v)}</span></div>)}
            <div style={css('display:flex;justify-content:space-between;font-size:17px;font-weight:600;padding:10px 0 0;margin-top:6px;border-top:1px solid rgba(235,235,245,.12)')}><span>Total</span><span style={css(DATA)}>{$(inv.totals.total)}</span></div>
            {inv.paid ? <div style={css('display:flex;justify-content:space-between;font-size:12.5px;color:#30d158;padding:6px 0 0')}><span>Paid</span><span style={css(DATA)}>{$(inv.paid)}</span></div> : null}
            {!paid && inv.paid ? <div style={css('display:flex;justify-content:space-between;font-size:14px;font-weight:600;padding:4px 0 0')}><span>Due</span><span style={css(DATA)}>{$(due)}</span></div> : null}
          </div>
        </div>
        {!paid ? (
          inv.card ? (
            <>
              <div onClick={pay} style={css('margin-top:18px;text-align:center;padding:15px 0;border-radius:12px;font-size:14px;font-weight:600;background:#fff;color:#000;cursor:pointer;' + (busy ? 'opacity:.6' : ''))}>{busy ? 'One moment…' : 'Pay ' + $(due) + ' by card'}</div>
              <div style={css('text-align:center;font-size:11.5px;color:rgba(235,235,245,.4);margin-top:10px')}>Secure checkout. Or pay at the counter when you pick up.</div>
            </>
          ) : (
            <div style={css(CARD + ';margin-top:18px;text-align:center')}><div style={css('font-size:14px;font-weight:600')}>Pay at the counter</div><div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:4px;line-height:1.5')}>Card, cash or check when you pick up. Show this page or give your name.</div></div>
          )
        ) : null}
        <div style={css('font-size:11.5px;color:rgba(235,235,245,.35);margin-top:18px;line-height:1.5;text-align:center')}>{inv.shop.address}{inv.shop.phone ? ' · ' + inv.shop.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : ''}</div>
      </div>
    </div>
  );
}
