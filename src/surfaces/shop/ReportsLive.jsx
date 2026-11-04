import React from 'react';
import { css } from '../../runtime/tpl.js';
import { Analytics } from './Analytics.jsx';
import { LBL, INPUT, CARD, DATA, Btn, Field, Empty } from './ui.jsx';

/** Reports: the sales charts, then the people and parts numbers for a date range, with exports. */
export function ReportsLive({ vm }) {
  const r = vm.staffReports;
  React.useEffect(() => { if (r.stale) r.run(); }, []);
  const Head = ({ cols }) => <div style={css('display:grid;grid-template-columns:' + cols + ';gap:12px;padding:8px 0;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);font-family:var(--data-font,inherit);border-bottom:1px solid rgba(235,235,245,.09)')} />;
  const row = (cols) => 'display:grid;grid-template-columns:' + cols + ';gap:12px;padding:10px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;align-items:center';
  return (
    <div>
      <Analytics vm={vm.reports} />
      <div style={css('margin-top:36px;display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap')}>
        <div style={css('font-size:20px;font-weight:600;letter-spacing:-.4px;margin-right:8px')}>People, parts & exports</div>
        <Field label="From"><input type="date" value={r.from} onChange={(e) => r.setFrom(e.target.value)} style={css(INPUT + ';color-scheme:dark')} /></Field>
        <Field label="To"><input type="date" value={r.to} onChange={(e) => r.setTo(e.target.value)} style={css(INPUT + ';color-scheme:dark')} /></Field>
        <Btn on={r.run}>Run</Btn>
      </div>
      <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px')}>
        <div style={css(CARD)}>
          <div style={css('display:flex;justify-content:space-between;align-items:center')}><div style={css('font-size:15px;font-weight:500')}>Technicians</div><Btn ghost on={r.downloadTechs} style="padding:8px 12px;font-size:12px">CSV</Btn></div>
          <div style={css('margin-top:8px')}>
            <div style={css('display:grid;grid-template-columns:1.3fr .6fr 1fr 1fr .8fr .8fr;gap:12px;padding:8px 0;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);font-family:var(--data-font,inherit);border-bottom:1px solid rgba(235,235,245,.09)')}><div>Name</div><div>Visits</div><div style={css('text-align:right')}>Sales</div><div style={css('text-align:right')}>GP · GP/h</div><div style={css('text-align:right')}>Eff.</div><div style={css('text-align:right')}>Approval</div></div>
            {r.techs.map((t) => <div key={t.name} style={css(row('1.3fr .6fr 1fr 1fr .8fr .8fr'))}><div>{t.name}<div style={css('font-size:11px;color:rgba(235,235,245,.4)')}>{t.hours}</div></div><div style={css(DATA)}>{t.visits}</div><div style={css(DATA + ';text-align:right')}>{t.sales}</div><div style={css(DATA + ';text-align:right')}>{t.gp}<div style={css('font-size:11px;color:#30d158')}>{t.gpHr}</div></div><div style={css(DATA + ';text-align:right')}>{t.eff}</div><div style={css(DATA + ';text-align:right;font-size:12px')}>{t.approval}</div></div>)}
            {!r.techs.length ? <Empty>No paid visits in the range.</Empty> : null}
          </div>
          {r.writers.length ? <><div style={css(LBL + ';margin-top:18px')}>Service writers</div>{r.writers.map((w) => <div key={w.name} style={css(row('1.3fr .6fr 1fr 1fr'))}><div>{w.name}</div><div style={css(DATA)}>{w.invoices}</div><div style={css(DATA + ';text-align:right')}>{w.sales}</div><div style={css(DATA + ';text-align:right')}>ARO {w.aro}</div></div>)}</> : null}
        </div>
        <div style={css('display:flex;flex-direction:column;gap:16px')}>
          <div style={css(CARD)}>
            <div style={css('display:flex;justify-content:space-between;align-items:center')}><div style={css('font-size:15px;font-weight:500')}>Payroll · {r.payrollTotal}</div><Btn ghost on={r.downloadPayroll} style="padding:8px 12px;font-size:12px">CSV</Btn></div>
            <div style={css('margin-top:8px')}>
              <div style={css('display:grid;grid-template-columns:1.2fr 1fr .7fr .7fr .9fr .9fr;gap:12px;padding:8px 0;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);font-family:var(--data-font,inherit);border-bottom:1px solid rgba(235,235,245,.09)')}><div>Name</div><div>Pay</div><div style={css('text-align:right')}>Clock</div><div style={css('text-align:right')}>Billed</div><div style={css('text-align:right')}>Labor</div><div style={css('text-align:right')}>Pay</div></div>
              {r.payroll.map((p) => <div key={p.name} style={css(row('1.2fr 1fr .7fr .7fr .9fr .9fr'))}><div>{p.name}</div><div style={css('font-size:12px;color:rgba(235,235,245,.6)')}>{p.type} · {p.rate}</div><div style={css(DATA + ';text-align:right')}>{p.clock}</div><div style={css(DATA + ';text-align:right')}>{p.billed}</div><div style={css(DATA + ';text-align:right')}>{p.labor}</div><div style={css(DATA + ';text-align:right;font-weight:600')}>{p.pay}</div></div>)}
              {!r.payroll.length ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:10px 0')}>Set each technician's pay type under Technicians.</div> : null}
            </div>
          </div>
          <div style={css(CARD)}>
            <div style={css('display:flex;justify-content:space-between;align-items:center')}><div style={css('font-size:15px;font-weight:500')}>Parts used</div><Btn ghost on={r.downloadUsage} style="padding:8px 12px;font-size:12px">CSV</Btn></div>
            {r.usage.slice(0, 12).map((u) => <div key={u.number + u.name} style={css(row('1.6fr 1fr .5fr .8fr'))}><div>{u.name}<div style={css('font-size:11px;color:rgba(235,235,245,.4);' + DATA)}>{u.number}</div></div><div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{u.vendor}</div><div style={css(DATA + ';text-align:right')}>{u.qty}</div><div style={css(DATA + ';text-align:right')}>{u.cost}</div></div>)}
            {r.noUsage ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:10px 0')}>Parts leave the shelf when an invoice with a stocked part is paid.</div> : null}
          </div>
          <div style={css(CARD + ';display:flex;justify-content:space-between;align-items:center;gap:16px')}>
            <div><div style={css('font-size:15px;font-weight:500')}>Carfax service history</div><div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px;line-height:1.5')}>{r.carfaxCount} paid visits with a VIN in the range. Upload the file to the Carfax Service Network each month so your work shows on vehicle history reports.</div></div>
            <Btn ghost on={r.downloadCarfax} ok={r.carfaxCount > 0}>Download</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
