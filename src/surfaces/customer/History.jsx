import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function History({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:calc(var(--sat) + 11px) 0 112px')}>
        <div style={css('padding:0 22px 14px')}><img src="/uploads/revyn.png" alt="Revyn" style={css('height:11px;width:auto;display:block;opacity:.92')} /></div>
        <div style={css('padding:0 22px')}>
          <div style={css('font-size:30px;font-weight:600;letter-spacing:-.9px')}>{vm.svcCarName || 'Quicksilver'}</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:6px')}>
            {(vm.svcCarSub || '2022 Tesla Model Y') + ' · '}
            {T(vm.odoLabel)}
          </div>
        </div>
        <div
          style={css(
            'padding:26px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
          )}
        >
          Service history
        </div>
        <div style={css('padding:10px 18px 0;display:flex;flex-direction:column;gap:10px')}>
          {L(vm.histItems).map((h, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={h?.open}
                style={css('background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:15px 16px;cursor:pointer')}
                className="px4"
              >
                <div
                  style={css(
                    'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                  )}
                >
                  {T(h?.date)}
                </div>
                <div style={css('display:flex;justify-content:space-between;align-items:baseline;margin-top:6px')}>
                  <div style={css('font-size:15px;font-weight:500')}>{T(h?.title)}</div>
                  <div style={css('font-size:14px')}>{T(h?.total)}</div>
                </div>
                <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:10px')}>
                  <div style={css('font-size:11.5px;color:rgba(235,235,245,.42)')}>
                    {T(h?.miles)}
                    {' miles · '}
                    {T(h?.tech)}
                  </div>
                  <div style={css('font-size:12px;color:#e0312b;font-weight:500')}>View report</div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
