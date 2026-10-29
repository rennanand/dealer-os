import React from 'react';
import { css } from '../runtime/tpl.js';

// Shops on Revyn, on an Apple map. MapKit JS needs a token from the developer account
// (VITE_MAPKIT_TOKEN); without one the section still shows the shop card and opens Apple Maps on tap.
const TOKEN = import.meta.env.VITE_MAPKIT_TOKEN || '';
const CARD = 'background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);backdrop-filter:blur(32px) saturate(200%);-webkit-backdrop-filter:blur(32px) saturate(200%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:16px 18px';
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const fmtPhone = (p) => { const d = (p || '').replace(/\D/g, ''); return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : p || ''; };
export const mapsHref = (s) => 'https://maps.apple.com/?q=' + encodeURIComponent(s.name) + (s.lat ? '&ll=' + s.lat + ',' + s.lng : '') + '&address=' + encodeURIComponent(s.address || '');

let loading = null;
const loadMapKit = () => loading || (loading = new Promise((res, rej) => {
  if (window.mapkit) return res(window.mapkit);
  const el = document.createElement('script');
  el.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js'; el.crossOrigin = 'anonymous'; el.async = true;
  el.onload = () => { window.mapkit.init({ authorizationCallback: (done) => done(TOKEN) }); res(window.mapkit); };
  el.onerror = rej; document.head.appendChild(el);
}));

function AppleMap({ shops, sel, onPick }) {
  const ref = React.useRef(null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let map; let dead = false;
    loadMapKit().then((mk) => {
      if (dead || !ref.current) return;
      map = new mk.Map(ref.current, { colorScheme: mk.Map.ColorSchemes.Dark, showsCompass: mk.FeatureVisibility.Hidden, showsMapTypeControl: false, showsZoomControl: false, isScrollEnabled: true, isZoomEnabled: true, showsPointsOfInterest: false });
      const anns = shops.filter((s) => s.lat).map((s) => { const a = new mk.MarkerAnnotation(new mk.Coordinate(s.lat, s.lng), { color: '#e0312b', title: s.name, glyphText: '' }); a.addEventListener('select', () => onPick(s.shop_id)); return a; });
      map.colorScheme = mk.Map.ColorSchemes.Dark;
      map.showItems(anns, { padding: new mk.Padding(40, 40, 40, 40) });
      if (anns.length === 1) map.region = new mk.CoordinateRegion(anns[0].coordinate, new mk.CoordinateSpan(0.02, 0.02));
    }).catch(() => setFailed(true));
    return () => { dead = true; if (map) map.destroy(); };
  }, [shops.length]);
  if (failed) return null;
  return <div ref={ref} style={css('height:220px;border-radius:16px;overflow:hidden;background:rgba(255,255,255,.06);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)')} />;
}

export function ShopsSection({ shops, wide }) {
  const [selId, setSel] = React.useState(null);
  if (!shops.length) return null;
  const s = shops.find((x) => x.shop_id === selId) || shops[0];
  return (
    <div style={css('margin-top:28px')}>
      <div style={css(LBL)}>Shops on Revyn</div>
      <div style={css((wide ? 'display:grid;grid-template-columns:1.2fr 1fr;gap:12px;' : 'display:flex;flex-direction:column;gap:10px;') + 'margin-top:12px')}>
        {TOKEN ? <AppleMap shops={shops} sel={s.shop_id} onPick={setSel} /> : (
          <a href={mapsHref(s)} target="_blank" rel="noreferrer" style={css('display:block;height:' + (wide ? '100%' : '150px') + ';min-height:150px;border-radius:16px;overflow:hidden;position:relative;background:radial-gradient(120% 90% at 50% 100%, #1d2027 0%, #121316 60%, #0d0e10 100%);text-decoration:none')}>
            <div style={css('position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);background-size:28px 28px')} />
            <div style={css('position:absolute;left:50%;top:50%;transform:translate(-50%,-62%);width:14px;height:14px;border-radius:50%;background:#e0312b;box-shadow:0 0 0 5px rgba(224,49,43,.25), 0 6px 18px rgba(0,0,0,.6)')} />
            <div style={css('position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:12px;color:rgba(235,235,245,.55)')}>Open in Apple Maps</div>
          </a>
        )}
        <div style={css('display:flex;flex-direction:column;gap:10px')}>
          {shops.map((x) => (
            <div key={x.shop_id} onClick={() => setSel(x.shop_id)} style={css(CARD + ';cursor:pointer;' + (shops.length > 1 && x.shop_id === s.shop_id ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)' : ''))}>
              <div style={css('font-size:15px;font-weight:500')}>{x.name}</div>
              <div style={css('font-size:12.5px;color:rgba(235,235,245,.55);margin-top:3px;line-height:1.5')}>{x.address}{x.hours ? <><br />{x.hours}</> : null}</div>
              <div style={css('display:flex;gap:8px;margin-top:12px')}>
                <a href={mapsHref(x)} target="_blank" rel="noreferrer" style={css('flex:1;text-align:center;padding:10px 0;border-radius:10px;background:#fff;color:#000;font-size:12.5px;font-weight:600;text-decoration:none')}>Directions</a>
                {x.phone ? <a href={'tel:' + x.phone} style={css('flex:1;text-align:center;padding:10px 0;border-radius:10px;background:rgba(235,235,245,.1);color:#fff;font-size:12.5px;font-weight:500;text-decoration:none')}>{fmtPhone(x.phone)}</a> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
