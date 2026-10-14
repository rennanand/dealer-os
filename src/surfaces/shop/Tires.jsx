import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Tires({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:20px')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Tires</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>Quotes, seasonal storage, stock by size.</div>
          </div>
          <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>{T(vm.storageHead)}</div>
        </div>
        <div style={css('display:grid;grid-template-columns:minmax(0,1.25fr) 380px;gap:24px;margin-top:26px;align-items:start')}>
          <div>
            <div style={css('display:flex;justify-content:space-between;align-items:center')}>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                Tire quote
              </div>
              <div style={css('display:flex;gap:6px')}>
                {L(vm.tqVehs).map((v, _i) => (
                  <React.Fragment key={_i}>
                    <div onClick={v?.pick} style={css(v?.style)}>
                      {T(v?.label)}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div
              style={css('margin-top:12px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}
            >
              <div style={css('display:flex;justify-content:space-between;align-items:flex-start;gap:16px')}>
                <div>
                  <div style={css('font-size:20px;font-weight:600;letter-spacing:-.4px')}>{T(vm.dtq?.who)}</div>
                  <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:4px')}>
                    {T(vm.dtq?.car)}
                    {' · '}
                    <span style={css('font-family:var(--data-font,inherit)')}>{T(vm.dtq?.size)}</span>
                    {' · door placard '}
                    {T(vm.dtq?.placard)}
                    {' psi'}
                  </div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:3px')}>{T(vm.dtq?.tread)}</div>
                </div>
                <div style={css(vm.dtq?.pill)}>{T(vm.dtq?.status)}</div>
              </div>
              <div style={css('margin-top:18px;border-top:1px solid rgba(235,235,245,.09)')}>
                {L(vm.dtqOpts).map((o, _i) => (
                  <React.Fragment key={_i}>
                    <div
                      onClick={o?.pick}
                      style={css(
                        'padding:13px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:14px;cursor:pointer',
                      )}
                    >
                      <div style={css(o?.radio)} />
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css('font-size:14px;font-weight:600')}>{T(o?.name)}</div>
                        <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>
                          {T(o?.tier)}
                          {' · '}
                          {T(o?.warranty)}
                        </div>
                      </div>
                      <div style={css(`font-size:12px;color:${o?.stockColor ?? ''};min-width:120px`)}>{T(o?.stock)}</div>
                      <div style={css('text-align:right;min-width:100px')}>
                        <div style={css('font-family:var(--data-font,inherit);font-size:14px')}>{T(o?.total)}</div>
                        <div style={css('font-size:11px;color:rgba(235,235,245,.4);margin-top:2px')}>
                          {T(o?.each)}
                          {' each'}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div style={css('display:flex;gap:28px;margin-top:16px')}>
                <div>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                    )}
                  >
                    Road hazard
                  </div>
                  <div style={css('display:flex;gap:6px;margin-top:8px')}>
                    {L(vm.dtqHaz).map((x, _i) => (
                      <React.Fragment key={_i}>
                        <div onClick={x?.pick} style={css(x?.style)}>
                          {T(x?.label)}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div style={css('flex:1')}>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                    )}
                  >
                    Recommended
                  </div>
                  <div style={css('font-size:13px;margin-top:10px')}>
                    Radio sets the default on the customer’s phone. They can still pick any option.
                  </div>
                </div>
              </div>
              <div
                style={css(
                  'margin-top:18px;padding-top:16px;border-top:1px solid rgba(235,235,245,.09);display:flex;align-items:center;gap:16px',
                )}
              >
                <div style={css('flex:1')}>
                  <div style={css('font-size:14px;font-weight:500')}>{T(vm.dtqAction?.t)}</div>
                  <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.dtqAction?.s)}</div>
                </div>
                {vm.dtqAction?.cta ? (
                  <>
                    <div
                      onClick={vm.dtqAction?.go}
                      style={css(
                        'padding:12px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap',
                      )}
                    >
                      {T(vm.dtqAction?.cta)}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:14px')}>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
                <div style={css('font-size:15px;font-weight:600')}>Seasonal storage</div>
                <div style={css('font-size:11.5px;color:rgba(235,235,245,.45)')}>Swap season · Oct – Nov</div>
              </div>
              <div style={css('margin-top:6px')}>
                {L(vm.storageRows).map((x, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css('padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                      <div style={css('display:flex;justify-content:space-between;gap:12px')}>
                        <div style={css('font-size:13px;font-weight:500')}>{T(x?.who)}</div>
                        <div style={css(`font-size:11.5px;font-weight:500;text-align:right;color:${x?.color ?? ''}`)}>{T(x?.state)}</div>
                      </div>
                      <div style={css('font-size:12px;color:rgba(235,235,245,.55);margin-top:3px')}>{T(x?.set)}</div>
                      <div style={css('font-size:11px;color:rgba(235,235,245,.35);margin-top:2px')}>{T(x?.meta)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px')}>
              <div style={css('display:flex;justify-content:space-between;align-items:baseline')}>
                <div style={css('font-size:15px;font-weight:600')}>Stock by size</div>
                <div style={css('font-size:11.5px;color:rgba(235,235,245,.45)')}>Reorder at 6</div>
              </div>
              <div style={css('margin-top:6px')}>
                {L(vm.tireStock).map((x, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css('padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                      <div style={css('display:flex;justify-content:space-between;gap:12px;align-items:baseline')}>
                        <div style={css('font-family:var(--data-font,inherit);font-size:13px')}>{T(x?.size)}</div>
                        <div style={css(`font-family:var(--data-font,inherit);font-size:13px;color:${x?.c ?? ''}`)}>{T(x?.n)}</div>
                      </div>
                      <div style={css('display:flex;justify-content:space-between;gap:12px;margin-top:3px')}>
                        <div style={css('font-size:11px;color:rgba(235,235,245,.4)')}>{T(x?.fits)}</div>
                      </div>
                      <div style={css('margin-top:7px;height:2px;border-radius:1px;background:rgba(235,235,245,.08);overflow:hidden')}>
                        <div style={css(x?.bar)} />
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
