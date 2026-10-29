import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Shop({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:calc(var(--sat) + 11px) 0 112px')}>
        <div style={css('padding:0 22px')}>
          <div style={css('font-size:30px;font-weight:600;letter-spacing:-.9px;line-height:1.1')}>Find your next car.</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>Vehicles available now.</div>
        </div>
        <div style={css('display:flex;gap:7px;overflow-x:auto;padding:18px 22px 0')} className="hidescroll">
          {L(vm.invFilters).map((f, _i) => (
            <React.Fragment key={_i}>
              <div onClick={f?.set} style={css(f?.style)}>
                {T(f?.label)}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:18px 18px 0;display:flex;flex-direction:column;gap:14px')}>
          {L(vm.invCards).map((v, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={v?.open}
                style={css('background:rgba(255,255,255,.065);backdrop-filter:blur(22px) saturate(170%);-webkit-backdrop-filter:blur(22px) saturate(170%);border-radius:20px;border:1px solid rgba(255,255,255,.11);box-shadow:inset 0 1px 0 rgba(255,255,255,.13);overflow:hidden;cursor:pointer')}
                className="px4"
              >
                <div style={css(`height:200px;position:relative;${v?.ph ?? ''}`)}>
                  {T(v?.shot)}
                  {'\n              '}
                  <div style={css(v?.badgeStyle)}>{T(v?.badge)}</div>
                </div>{' '}
                <div style={css('padding:14px 16px 16px')}>
                  <div style={css('font-size:16px;font-weight:500')}>{T(v?.name)}</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:4px')}>
                    {T(v?.trim)}
                    {' · '}
                    {T(v?.color)}
                    {' · '}
                    {T(v?.miles)}
                    {' miles'}
                  </div>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:12px')}>
                    <div style={css('font-size:18px;font-weight:500')}>{T(v?.price)}</div>
                    <div style={css('font-size:12px;color:#e0312b;font-weight:500')}>View vehicle</div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          onClick={vm.goTrade}
          style={css(
            'margin:20px 22px 0;padding:16px;border:1px solid rgba(235,235,245,.09);border-radius:14px;cursor:pointer;display:flex;align-items:center;gap:12px',
          )}
          className="px5"
        >
          <div style={css('flex:1')}>
            <div style={css('font-size:14px;font-weight:500')}>Trade in your vehicle</div>
            <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:4px')}>Get an estimate on Quicksilver in a minute.</div>
          </div>
          <div style={css('display:flex;color:rgba(235,235,245,.3)')}>
            <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
              <path
                d="M9 6l6 6-6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
