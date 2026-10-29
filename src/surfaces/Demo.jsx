import React from 'react';
import { T, L, css, val } from '../runtime/tpl.js';
import { IOSDevice } from '../components/IOSFrame.jsx';
import { CustomerApp } from './customer/CustomerApp.jsx';
import { LobbyBoard } from './lobby/LobbyBoard.jsx';
import { ShopApp } from './shop/ShopApp.jsx';
import { TechApp } from './tech/TechApp.jsx';

export function Demo({ vm }) {
  return (
    <>
      <div
        style={css(
          "min-height:100vh;background:#0a0a0a;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif;color:#fff;padding:20px 24px 64px",
        )}
      >
        <div
          style={css(
            'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;max-width:1360px;margin:0 auto',
          )}
        >
          <div style={css('display:flex;align-items:center;gap:12px')}>
            <img src="/uploads/revyn.png" alt="Revyn" style={css('height:12px;width:auto;display:block')} />
            <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>Revyn · prototype</div>
          </div>
          <div style={css('display:flex;background:#1c1c1e;border-radius:10px;padding:3px;gap:2px')}>
            {L(vm.devices).map((d, _i) => (
              <React.Fragment key={_i}>
                <div onClick={d?.pick} style={css(d?.style)}>
                  {T(d?.label)}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('display:flex;align-items:center;gap:8px;font-size:12px')}>
            <div style={css('color:rgba(235,235,245,.45)')}>Service state</div>
            <div style={css('background:#1c1c1e;border-radius:8px;padding:7px 11px;font-weight:500')}>{T(vm.stageName)}</div>
            <div
              onClick={vm.demoBack}
              style={css('background:#1c1c1e;border-radius:8px;padding:7px 8px;cursor:pointer;color:rgba(235,235,245,.7);display:flex')}
              className="px0"
            >
              <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                <path
                  d="M15 6l-6 6 6 6"
                  style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
                />
              </svg>
            </div>
            <div
              onClick={vm.demoNext}
              style={css('background:#1c1c1e;border-radius:8px;padding:7px 8px;cursor:pointer;color:rgba(235,235,245,.7);display:flex')}
              className="px0"
            >
              <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                <path
                  d="M9 6l6 6-6 6"
                  style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
                />
              </svg>
            </div>
            <div
              onClick={vm.demoReset}
              style={css('background:#1c1c1e;border-radius:8px;padding:7px 11px;cursor:pointer;color:rgba(235,235,245,.7)')}
              className="px0"
            >
              Reset
            </div>
            <div
              onClick={vm.startOnboard}
              style={css(
                'border:1px solid rgba(235,235,245,.14);border-radius:8px;padding:6px 11px;cursor:pointer;color:rgba(235,235,245,.7)',
              )}
              className="px1"
            >
              New user
            </div>
          </div>
        </div>
        <div ref={vm.wrapRef} style={css('display:flex;justify-content:center;margin-top:26px;width:100%')}>
          {vm.isPhone ? (
            <>
              <div className="sc-host-x" style={{ display: 'contents' }}>
                <IOSDevice dark={true}>
                  {' '}
                  <CustomerApp vm={vm} />{' '}
                </IOSDevice>
              </div>
            </>
          ) : null}
          {vm.isPad ? (
            <>
              <div style={css(vm.padWrapStyle)}>
                <div
                  style={css(
                    `width:1060px;flex:0 0 auto;transform-origin:top center;background:#141416;border-radius:34px;padding:20px;box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.06);${vm.padScaleStyle ?? ''}`,
                  )}
                >
                  <TechApp vm={vm} />
                </div>
              </div>
            </>
          ) : null}
          {vm.isDesk ? (
            <>
              <div style={css(vm.deskWrapStyle)}>
                <div
                  style={css(
                    `width:1360px;flex:0 0 auto;transform-origin:top center;background:#0d0d0e;border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.07);color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif;${vm.deskScaleStyle ?? ''}`,
                  )}
                >
                  <div
                    style={css(
                      'height:42px;display:flex;align-items:center;padding:0 16px;gap:8px;border-bottom:1px solid rgba(235,235,245,.07)',
                    )}
                  >
                    <div style={css('width:11px;height:11px;border-radius:6px;background:#3a3a3d')} />
                    <div style={css('width:11px;height:11px;border-radius:6px;background:#3a3a3d')} />
                    <div style={css('width:11px;height:11px;border-radius:6px;background:#3a3a3d')} />
                    <div
                      style={css(
                        'flex:1;text-align:center;font-family:var(--data-font,inherit);font-size:11.5px;color:rgba(235,235,245,.4)',
                      )}
                    >
                      ryguys.app/shop
                    </div>
                    <div style={css('width:57px')} />
                  </div>
                  <ShopApp vm={vm} />
                </div>
              </div>
            </>
          ) : null}
          {vm.isLobby ? (
            <>
              <div style={css(vm.lobbyWrapStyle)}>
                <LobbyBoard vm={vm} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
