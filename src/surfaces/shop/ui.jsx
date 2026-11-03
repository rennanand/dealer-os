import React from 'react';
import { css } from '../../runtime/tpl.js';

// Shared pieces for the live shop pages. Same tokens as AppointmentsLive so every page reads as one app.
export const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
export const INPUT = "width:100%;background:rgba(255,255,255,.06);border:0;outline:0;border-radius:10px;padding:11px 12px;font-size:13px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif;box-sizing:border-box";
export const SELECT = INPUT + ';appearance:none;-webkit-appearance:none;cursor:pointer';
export const BTN = 'padding:11px 16px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;text-align:center';
export const GHOST = 'padding:11px 16px;border-radius:10px;background:#1c1c1e;color:rgba(235,235,245,.85);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;text-align:center';
export const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px';
export const DATA = 'font-family:var(--data-font,inherit)';
export const DIMC = 'rgba(235,235,245,.5)';
export const chip = (on) => 'padding:8px 14px;border-radius:999px;font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;' + (on ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)');

export const Title = ({ t, sub, right }) => (
  <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:16px')}>
    <div>
      <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>{t}</div>
      {sub ? <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{sub}</div> : null}
    </div>
    {right ? <div style={css('display:flex;gap:8px;align-items:center')}>{right}</div> : null}
  </div>
);
export const Field = ({ label, children, span }) => (<div style={css(span ? 'grid-column:1 / -1' : '')}><div style={css(LBL + ';margin-bottom:6px')}>{label}</div>{children}</div>);
export const Btn = ({ on, children, ok = true, ghost, style }) => (<div onClick={ok ? on : null} style={css((ghost ? GHOST : BTN) + ';' + (ok ? '' : 'opacity:.4;cursor:default;') + (style || ''))}>{children}</div>);
export const Tabs = ({ tabs }) => (<div style={css('display:flex;gap:6px;margin-top:18px;flex-wrap:wrap')}>{tabs.map((t) => <div key={t.label} onClick={t.pick} style={css(chip(t.on))}>{t.label}</div>)}</div>);
export const Err = ({ vm }) => (vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null);
export const Empty = ({ children }) => (<div style={css('padding:40px 20px;text-align:center;font-size:13px;color:rgba(235,235,245,.45);line-height:1.6')}>{children}</div>);
export const KV = ({ k, v, strong }) => (<div style={css('display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:' + (strong ? '15px;font-weight:600' : '13px'))}><div style={css(strong ? '' : 'color:rgba(235,235,245,.5)')}>{k}</div><div style={css(DATA + ';text-align:right;white-space:nowrap')}>{v}</div></div>);
export const Stat = ({ n, l, c }) => (<div style={css(CARD + ';padding:16px 18px;min-width:0')}><div style={css(DATA + ';font-size:22px;font-weight:600;letter-spacing:-.5px;color:' + (c || '#fff'))}>{n}</div><div style={css('font-size:11.5px;color:rgba(235,235,245,.5);margin-top:4px')}>{l}</div></div>);
export const Dot = ({ c }) => (<div style={css('width:7px;height:7px;border-radius:4px;flex:0 0 auto;background:' + c)} />);
export const Money = ({ v }) => (<span style={css(DATA)}>{v}</span>);
export const Seg = ({ opts, value, pick, small }) => (<div style={css('display:flex;gap:6px')}>{opts.map(([k, l]) => <div key={k} onClick={() => pick(k)} style={css('flex:1;text-align:center;padding:' + (small ? '8px 0' : '9px 0') + ';border-radius:10px;font-size:12px;font-weight:500;cursor:pointer;' + (value === k ? 'background:#fff;color:#000' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7)'))}>{l}</div>)}</div>);
export const Link = ({ on, children, color }) => (<div onClick={on} style={css('font-size:12px;color:' + (color || 'rgba(235,235,245,.6)') + ';cursor:pointer;white-space:nowrap')}>{children}</div>);

/** A job's lines editor, shared by the library, the estimate builder and the invoice. */
export function LinesEditor({ ed, compact }) {
  const KINDS = [['labor', 'Labor'], ['part', 'Part'], ['fee', 'Fee']];
  return (
    <div style={css('display:flex;flex-direction:column;gap:8px')}>
      {ed.lines.map((l, i) => (
        <div key={i} style={css('display:grid;grid-template-columns:72px 1fr 64px 86px ' + (l.kind === 'part' ? '86px ' : '') + '24px;gap:6px;align-items:center')}>
          <select value={l.kind} onChange={(e) => ed.setLine(i, { kind: e.target.value })} style={css(SELECT + ';padding:9px 8px;font-size:12px')}>{KINDS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
          <div>
            <input value={l.description} placeholder={l.kind === 'labor' ? 'What is done' : l.kind === 'part' ? 'Part · brand, name' : 'Fee'} onChange={(e) => ed.setLine(i, { description: e.target.value })} style={css(INPUT + ';padding:9px 10px')} />
            {l.kind === 'part' && !compact ? <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px')}><input value={l.part_number || ''} placeholder="Part #" onChange={(e) => ed.setLine(i, { part_number: e.target.value })} style={css(INPUT + ';padding:8px 10px;font-size:12px')} /><input value={l.vendor || ''} placeholder="Vendor" onChange={(e) => ed.setLine(i, { vendor: e.target.value })} style={css(INPUT + ';padding:8px 10px;font-size:12px')} /></div> : null}
          </div>
          <input value={l.qty} inputMode="decimal" placeholder={l.kind === 'labor' ? 'Hrs' : 'Qty'} onChange={(e) => ed.setLine(i, { qty: e.target.value })} style={css(INPUT + ';padding:9px 8px;text-align:right;' + DATA)} />
          {l.kind === 'part' ? <input value={l.cost || ''} inputMode="decimal" placeholder="$ cost" onChange={(e) => ed.setLine(i, { cost: e.target.value })} style={css(INPUT + ';padding:9px 8px;text-align:right;' + DATA)} /> : null}
          <input value={l.unit} inputMode="decimal" placeholder={l.kind === 'labor' ? '$/hr' : '$ each'} onChange={(e) => ed.setLine(i, { unit: e.target.value })} style={css(INPUT + ';padding:9px 8px;text-align:right;' + DATA)} />
          <div onClick={() => ed.removeLine(i)} style={css('color:rgba(235,235,245,.35);cursor:pointer;text-align:center;font-size:16px')}>×</div>
        </div>
      ))}
      <div style={css('display:flex;gap:12px;align-items:center')}>
        <Link on={() => ed.addLine('labor')}>+ Labor</Link><Link on={() => ed.addLine('part')}>+ Part</Link><Link on={() => ed.addLine('fee')}>+ Fee</Link>
        <div style={css('flex:1')} />
        <div style={css('font-size:13px;font-weight:600;' + DATA)}>{ed.total}</div>
      </div>
    </div>
  );
}
