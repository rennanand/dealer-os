import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Techs({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Technicians</div>
        <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>3 on shift · 5 bays</div>
        <div style={css('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px')}>
          {L(vm.techs).map((t, _i) => (
            <React.Fragment key={_i}>
              <div style={css('background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px 22px')}>
                <div style={css('display:flex;align-items:center;gap:12px')}>
                  <div
                    style={css(
                      'width:40px;height:40px;border-radius:20px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:12px',
                    )}
                  >
                    {T(t?.initials)}
                  </div>
                  <div>
                    <div style={css('font-size:16px;font-weight:500')}>{T(t?.name)}</div>
                    <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px')}>{T(t?.role)}</div>
                  </div>
                </div>
                <div style={css('margin-top:18px;display:flex;justify-content:space-between;font-size:12px;color:rgba(235,235,245,.5)')}>
                  <span>Booked today</span>
                  <span>{T(t?.hours)}</span>
                </div>
                <div style={css('margin-top:8px;height:4px;border-radius:2px;background:rgba(235,235,245,.12);overflow:hidden')}>
                  <div style={css(t?.bar)} />
                </div>
                <div style={css('margin-top:16px;display:flex;flex-direction:column;gap:8px')}>
                  {L(t?.jobs).map((j, _i1) => (
                    <React.Fragment key={_i1}>
                      <div style={css('display:flex;justify-content:space-between;gap:10px')}>
                        <div style={css('font-size:13px')}>{T(j?.t)}</div>
                        <div style={css(`font-size:12px;font-weight:500;color:${j?.c ?? ''}`)}>{T(j?.s)}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
