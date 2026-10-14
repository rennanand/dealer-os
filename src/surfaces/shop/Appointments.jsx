import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Appointments({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end')}>
          <div>
            <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Appointments</div>
            <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>{T(vm.apptSub)}</div>
          </div>
        </div>
        <div style={css('display:flex;gap:6px;margin-top:22px')}>
          {L(vm.apptDays).map((d, _i) => (
            <React.Fragment key={_i}>
              <div onClick={d?.pick} style={css(d?.style)}>
                {T(d?.label)}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('margin-top:14px;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.appts).map((a, _i) => (
            <React.Fragment key={_i}>
              <div style={css('display:flex;align-items:center;gap:18px;padding:16px 0;border-bottom:1px solid rgba(235,235,245,.07)')}>
                <div style={css('width:84px;font-size:14px;font-weight:500')}>{T(a?.time)}</div>
                <div style={css(`width:62px;height:42px;border-radius:8px;${a?.ph ?? ''}`)} />
                <div style={css('flex:1')}>
                  <div style={css('font-size:14px;font-weight:500')}>{T(a?.who)}</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px')}>
                    {T(a?.car)}
                    {' · '}
                    {T(a?.job)}
                  </div>
                </div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{T(a?.visit)}</div>
                <div style={css(`min-width:150px;text-align:right;font-size:12.5px;font-weight:500;color:${a?.color ?? ''}`)}>
                  {T(a?.status)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        {vm.noAppts ? (
          <>
            <div style={css('padding:40px;text-align:center;font-size:13px;color:rgba(235,235,245,.45)')}>
              Nothing booked. Appointments made in the customer app land here instantly.
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
