import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Approvals({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
        <div style={css('flex:1;min-width:0')}>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Approvals</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>Estimates sent to customers, waiting on a tap.</div>
          <div style={css('margin-top:22px;display:flex;flex-direction:column;gap:10px')}>
            {L(vm.queueFull).map((q, _i) => (
              <React.Fragment key={_i}>
                <div onClick={q?.open} style={css(q?.style)}>
                  <div style={css(`font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:${q?.kColor ?? ''}`)}>
                    {T(q?.kicker)}
                  </div>{' '}
                  <div style={css('display:flex;justify-content:space-between;align-items:baseline;margin-top:10px')}>
                    <div style={css('font-size:17px;font-weight:500')}>{T(q?.who)}</div>
                    <div style={css('font-size:17px')}>{T(q?.total)}</div>
                  </div>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:6px')}>
                    <div style={css('font-size:12.5px;color:rgba(235,235,245,.5)')}>{T(q?.car)}</div>
                    <div style={css(`font-size:12.5px;font-weight:500;color:${q?.waitColor ?? ''}`)}>{T(q?.wait)}</div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div
          style={css(
            'width:380px;flex:0 0 380px;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:24px;display:flex;flex-direction:column',
          )}
        >
          <div style={css('font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:rgba(235,235,245,.5)')}>
            {'Estimate · '}
            {T(vm.estSel?.wo)}
          </div>
          <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px;margin-top:8px')}>{T(vm.estSel?.who)}</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.estSel?.car)}</div>
          <div style={css('margin-top:18px')}>
            {L(vm.estSel?.lines).map((l, _i) => (
              <React.Fragment key={_i}>
                <div style={css('display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                  <div style={css('display:flex;align-items:center;gap:9px')}>
                    <div style={css(l?.dot)} />
                    <div style={css('font-size:13px')}>{T(l?.k)}</div>
                  </div>
                  <div style={css('font-size:13px')}>{T(l?.v)}</div>
                </div>
              </React.Fragment>
            ))}
            <div style={css('display:flex;justify-content:space-between;padding:14px 0 0')}>
              <div style={css('font-size:14px;font-weight:500')}>{vm.estSel?.totalLabel || 'Total with tax'}</div>
              <div style={css('font-size:20px;font-weight:500;letter-spacing:-.3px')}>{T(vm.estSel?.total)}</div>
            </div>
          </div>
          <div style={css('flex:1')} />
          <div style={css('font-size:12px;line-height:1.55;color:rgba(235,235,245,.45)')}>{T(vm.estSel?.note)}</div>
          {vm.estSel?.canRemind ? (
            <>
              <div
                onClick={vm.sendReminder}
                style={css(
                  'margin-top:14px;text-align:center;padding:13px 0;border-radius:11px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                {T(vm.estSel?.cta)}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
