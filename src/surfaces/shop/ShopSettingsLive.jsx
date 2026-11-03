import React from 'react';
import { css } from '../../runtime/tpl.js';
import { supabase, SHOP_ID } from '../../state/supabase.js';

// Shop details the owner keeps current. They print on every agreement and on the customer's link.
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);margin-bottom:8px';
const INPUT = "width:100%;background:#1c1c1e;border:0;outline:0;border-radius:10px;padding:13px 14px;font-size:13.5px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px;max-width:720px';

export function ShopSettingsLive() {
  const [shop, setShop] = React.useState(null);
  const [saved, setSaved] = React.useState('');
  const [err, setErr] = React.useState('');
  React.useEffect(() => {
    if (!supabase) return setShop({ name: 'RyGuys Tire & Auto Sales', address: '', phone: '', default_rate_cents: 6500, hours: '' });
    supabase.from('shops').select('*').eq('shop_id', SHOP_ID).maybeSingle().then(({ data, error }) => (error ? setErr(error.message) : setShop(data || { name: '', address: '', phone: '', default_rate_cents: 6500, hours: '' })));
  }, []);
  if (!shop) return <div style={css('animation:sIn .28s ease')}><div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Settings</div>{err ? <div style={css('color:#e0312b;margin-top:12px')}>{err}</div> : null}</div>;
  const set = (k) => (e) => { setShop({ ...shop, [k]: e.target.value }); setSaved(''); };
  const save = async () => {
    setErr('');
    const num = (v) => Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')) || 0;
    const body = { name: shop.name.trim(), address: shop.address.trim(), phone: shop.phone.trim(), hours: shop.hours.trim(), default_rate_cents: Math.round(num(shop.default_rate_cents)),
      tax_rate_bp: Math.round(num(shop.tax_rate_pct != null ? shop.tax_rate_pct : (shop.tax_rate_bp || 725) / 100) * 100), labor_rate_cents: Math.round(num(shop.labor_rate != null ? shop.labor_rate : (shop.labor_rate_cents || 12500) / 100) * 100), shop_supplies_bp: Math.round(num(shop.supplies_pct != null ? shop.supplies_pct : (shop.shop_supplies_bp || 0) / 100) * 100) };
    if (!supabase) return setSaved('Saved');
    const { error } = await supabase.from('shops').update(body).eq('shop_id', SHOP_ID);
    if (error) return setErr(error.message === 'new row violates row-level security policy for table "shops"' ? 'Only the owner can change shop details.' : error.message);
    setSaved('Saved');
  };
  return (
    <div style={css('animation:sIn .28s ease')}>
      <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Settings</div>
      <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>Shop details. They print on every loaner agreement.</div>
      <div style={css(CARD + ';margin-top:22px')}>
        <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px')}>
          <div style={css('grid-column:1 / -1')}><div style={css(LBL)}>Shop name</div><input value={shop.name} onChange={set('name')} style={css(INPUT)} /></div>
          <div style={css('grid-column:1 / -1')}><div style={css(LBL)}>Address</div><input placeholder="Street, City ST" value={shop.address} onChange={set('address')} style={css(INPUT)} /></div>
          <div><div style={css(LBL)}>Phone</div><input placeholder="(435) 555-0100" value={shop.phone} onChange={set('phone')} style={css(INPUT)} /></div>
          <div><div style={css(LBL)}>Loaner rate · $ per day</div><input inputMode="decimal" value={typeof shop.default_rate_cents === 'number' ? (shop.default_rate_cents / 100).toString() : shop.default_rate_cents} onChange={(e) => { setShop({ ...shop, default_rate_cents: e.target.value }); setSaved(''); }} onBlur={() => setShop({ ...shop, default_rate_cents: Math.round(Number(String(shop.default_rate_cents).replace(/[^\d.]/g, '')) * 100) || 0 })} style={css(INPUT + ';font-family:var(--data-font,inherit)')} /></div>
          <div style={css('grid-column:1 / -1')}><div style={css(LBL)}>Hours</div><input placeholder="Mon–Fri 8–6, Sat 9–2" value={shop.hours} onChange={set('hours')} style={css(INPUT)} /></div>
        </div>
        <div style={css(LBL + ';margin-top:22px')}>Billing · used on every repair order</div>
        <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:10px')}>
          <div><div style={css(LBL)}>Sales tax · %</div><input inputMode="decimal" value={shop.tax_rate_pct != null ? shop.tax_rate_pct : ((shop.tax_rate_bp || 725) / 100).toString()} onChange={(e) => { setShop({ ...shop, tax_rate_pct: e.target.value }); setSaved(''); }} style={css(INPUT)} /></div>
          <div><div style={css(LBL)}>Labor rate · $ per hour</div><input inputMode="decimal" value={shop.labor_rate != null ? shop.labor_rate : ((shop.labor_rate_cents || 12500) / 100).toString()} onChange={(e) => { setShop({ ...shop, labor_rate: e.target.value }); setSaved(''); }} style={css(INPUT)} /></div>
          <div><div style={css(LBL)}>Shop supplies · % of labor</div><input inputMode="decimal" value={shop.supplies_pct != null ? shop.supplies_pct : ((shop.shop_supplies_bp || 0) / 100).toString()} onChange={(e) => { setShop({ ...shop, supplies_pct: e.target.value }); setSaved(''); }} style={css(INPUT)} /></div>
        </div>
        <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:8px;line-height:1.5')}>Tax applies to taxable lines (everything but discounts). Labor rate pre-fills labor lines. Supplies, if set, are added as a fee line when an RO is started.</div>
        {err ? <div style={css('font-size:12.5px;color:#e0312b;margin-top:14px')}>{err}</div> : null}
        <div style={css('display:flex;justify-content:flex-end;align-items:center;gap:14px;margin-top:18px')}>
          <div style={css('font-size:12.5px;color:#30d158')}>{saved}</div>
          <div onClick={save} style={css('padding:12px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer')}>Save</div>
        </div>
      </div>
    </div>
  );
}
