import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Parts({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Parts</div>
        <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>
          Orders tied to work orders. A delay here updates the customer's timeline automatically.
        </div>
        <div style={css('margin-top:22px;display:flex;flex-direction:column;gap:10px')}>
          {L(vm.partsOrders).map((p, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css(
                  'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 22px;display:flex;align-items:center;gap:20px',
                )}
              >
                <div style={css(p?.dot)} />
                <div style={css('flex:1')}>
                  <div style={css('font-size:15px;font-weight:500')}>{T(p?.part)}</div>
                  <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(p?.for)}</div>
                </div>
                <div style={css('min-width:120px')}>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                    )}
                  >
                    Supplier
                  </div>
                  <div style={css('font-size:13px;margin-top:3px')}>{T(p?.supplier)}</div>
                </div>
                <div style={css('min-width:170px')}>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                    )}
                  >
                    Status
                  </div>
                  <div style={css(`font-size:13px;font-weight:500;margin-top:3px;color:${p?.color ?? ''}`)}>{T(p?.status)}</div>
                </div>
                {p?.cta ? (
                  <>
                    <div
                      onClick={p?.go}
                      style={css(
                        'padding:11px 16px;border-radius:10px;background:rgba(235,235,245,.1);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap',
                      )}
                    >
                      {T(p?.cta)}
                    </div>
                  </>
                ) : null}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
