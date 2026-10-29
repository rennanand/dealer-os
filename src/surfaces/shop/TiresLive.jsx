import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';

const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const INPUT = "width:100%;background:rgba(255,255,255,.06);border:0;outline:0;border-radius:10px;padding:10px 12px;font-size:13px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const BTN = 'padding:12px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap';
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px';
const radio = (on) => 'width:18px;height:18px;border-radius:9px;flex:0 0 auto;transition:all .2s ease;' + (on ? 'background:#fff;box-shadow:inset 0 0 0 5px #000,0 0 0 1px #fff' : 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.3)');

/** Tire quotes on real visits: the design's quote card with editable Good / Better / Best, sent to the customer's phone. */
export function TiresLive({ vm }) {
  const t = vm.tires, q = t.draft;
  return (
    <div style={css('animation:sIn .28s ease')}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:20px')}>
        <div>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Tires</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>Quotes go to the customer’s phone as three options; the one they pick becomes approved work.</div>
        </div>
        <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(t.head)}</div>
      </div>
      {vm.err ? <div onClick={vm.dismissErr} style={css('margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(224,49,43,.14);color:#ff6b64;font-size:12.5px;cursor:pointer')}>{vm.err}</div> : null}
      <div style={css('display:grid;grid-template-columns:minmax(0,1.25fr) 380px;gap:24px;margin-top:26px;align-items:start')}>
        <div>
          <div style={css('display:flex;justify-content:space-between;align-items:center;gap:12px')}>
            <div style={css(LBL)}>Tire quote</div>
            <div style={css('display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end')}>
              {L(t.visits).map((v) => <div key={v.id} onClick={v.pick} style={css(v.style)}>{T(v.label)}</div>)}
            </div>
          </div>
          {q ? (
            <div style={css(CARD + ';margin-top:12px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:16px')}>
                <div style={css('flex:1;min-width:0')}>
                  <div style={css('font-size:20px;font-weight:600;letter-spacing:-.4px')}>{T(q.who)}</div>
                  <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:4px')}>{T(q.car)}</div>
                  <div style={css('display:grid;grid-template-columns:1fr 1.6fr;gap:8px;margin-top:12px')}>
                    <input value={q.size} placeholder="Size · 265/70R17" disabled={q.locked} onChange={(e) => t.setDraft({ size: e.target.value })} style={css(INPUT + ';font-family:var(--data-font,inherit)')} />
                    <input value={q.tread} placeholder="Tread · 3/32″ all four, measured today" disabled={q.locked} onChange={(e) => t.setDraft({ tread: e.target.value })} style={css(INPUT)} />
                  </div>
                </div>
                <div style={css(q.pill)}>{T(q.status)}</div>
              </div>
              <div style={css('margin-top:18px;border-top:1px solid rgba(235,235,245,.09)')}>
                {q.opts.map((o, i) => (
                  <div key={o.tier} style={css('padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:14px')}>
                    <div onClick={o.pick} style={css(radio(o.on) + ';cursor:pointer')} title="Recommended" />
                    <div style={css('flex:1;min-width:0;display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:8px')}>
                      <input value={o.name} placeholder={o.tierLabel + ' · tire name'} disabled={q.locked} onChange={(e) => t.setOpt(i, { name: e.target.value })} style={css(INPUT + ';font-weight:600')} />
                      <input value={o.warranty} placeholder="Warranty" disabled={q.locked} onChange={(e) => t.setOpt(i, { warranty: e.target.value })} style={css(INPUT)} />
                      <input value={o.stock} placeholder="In stock · 8" disabled={q.locked} onChange={(e) => t.setOpt(i, { stock: e.target.value })} style={css(INPUT)} />
                    </div>
                    <div style={css('text-align:right;min-width:150px;display:flex;flex-direction:column;align-items:flex-end;gap:4px')}>
                      <div style={css('display:flex;align-items:center;gap:6px')}>
                        <span style={css('font-size:11px;color:rgba(235,235,245,.4)')}>$</span>
                        <input value={o.each} inputMode="decimal" placeholder="each" disabled={q.locked} onChange={(e) => t.setOpt(i, { each: e.target.value })} style={css(INPUT + ';width:84px;text-align:right;font-family:var(--data-font,inherit)')} />
                      </div>
                      <div style={css('font-family:var(--data-font,inherit);font-size:12px;color:rgba(235,235,245,.5)')}>{T(o.total)} installed</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={css('display:flex;gap:28px;margin-top:16px')}>
                <div>
                  <div style={css(LBL)}>Road hazard</div>
                  <div style={css('display:flex;gap:6px;margin-top:8px')}>{q.haz.map((x) => <div key={x.label} onClick={x.pick} style={css(x.style)}>{T(x.label)}</div>)}</div>
                </div>
                <div>
                  <div style={css(LBL)}>Per tire fee</div>
                  <div style={css('display:flex;align-items:center;gap:6px;margin-top:8px')}><span style={css('font-size:11px;color:rgba(235,235,245,.4)')}>$</span><input value={q.fee} inputMode="decimal" disabled={q.locked} onChange={(e) => t.setDraft({ fee: e.target.value })} style={css(INPUT + ';width:72px;font-family:var(--data-font,inherit)')} /><span style={css('font-size:11px;color:rgba(235,235,245,.4)')}>mount, balance, TPMS, disposal</span></div>
                </div>
                <div style={css('flex:1')}>
                  <div style={css(LBL)}>Recommended</div>
                  <div style={css('font-size:13px;margin-top:10px')}>Radio sets the default on the customer’s phone. They can still pick any option. Tax is settled at the counter.</div>
                </div>
              </div>
              <div style={css('margin-top:18px;padding-top:16px;border-top:1px solid rgba(235,235,245,.09);display:flex;align-items:center;gap:16px')}>
                <div style={css('flex:1')}>
                  <div style={css('font-size:14px;font-weight:500')}>{T(q.action.t)}</div>
                  <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(q.action.s)}</div>
                </div>
                {q.action.cta ? <div onClick={q.action.ok ? q.action.go : null} style={css(BTN + (q.action.ok ? '' : ';opacity:.4;cursor:default'))}>{vm.busy ? 'Sending…' : T(q.action.cta)}</div> : null}
              </div>
            </div>
          ) : (
            <div style={css(CARD + ';margin-top:12px;text-align:center;color:rgba(235,235,245,.45);font-size:13px;padding:40px 20px;line-height:1.6')}>{t.visits.length ? 'Pick a visit above to quote tires for it.' : 'No cars checked in right now. Tire quotes attach to a visit, so check the customer in first.'}</div>
          )}
        </div>
        <div style={css('display:flex;flex-direction:column;gap:14px')}>
          <div style={css(CARD + ';padding:18px 20px')}>
            <div style={css('font-size:15px;font-weight:600')}>Open quotes</div>
            <div style={css('margin-top:6px')}>
              {L(t.recent).map((r) => (
                <div key={r.id} onClick={r.open} style={css('padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);cursor:pointer')}>
                  <div style={css('display:flex;justify-content:space-between;gap:10px;font-size:13px')}><div style={css('font-weight:500')}>{T(r.who)}</div><div style={css('font-size:12px;font-weight:500;color:' + r.color)}>{T(r.state)}</div></div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(r.meta)}</div>
                </div>
              ))}
              {!t.recent.length ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);padding:10px 0')}>Nothing sent yet.</div> : null}
            </div>
          </div>
          <div style={css(CARD + ';padding:18px 20px')}>
            <div style={css('font-size:15px;font-weight:600')}>Stock and storage</div>
            <div style={css('font-size:12.5px;color:rgba(235,235,245,.45);margin-top:6px;line-height:1.5')}>Stock by size and seasonal storage are not tracked in Revyn yet. Type what is on the shelf in each option’s stock field for now.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
