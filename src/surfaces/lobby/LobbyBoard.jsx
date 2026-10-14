import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/service-scene.js';

export function LobbyBoard({ vm }) {
  return (
    <>
      <div
        data-screen-label="Lobby board"
        style={css(
          `width:1360px;height:765px;flex:0 0 auto;transform-origin:top center;background:#000;border-radius:10px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.08);color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif;padding:44px 56px 40px;display:flex;flex-direction:column;${vm.lobbyScaleStyle ?? ''}`,
        )}
      >
        <div style={css('display:flex;justify-content:space-between;align-items:flex-start')}>
          <div style={css('display:flex;align-items:center;gap:18px')}>
            <div style={css('background:#fff;border-radius:7px;padding:7px 10px')}>
              <img src="/uploads/ryguys-logo-trim.png" alt="RyGuys" style={css('height:18px;width:auto;display:block')} />
            </div>
            <div>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:rgba(235,235,245,.45)',
                )}
              >
                Service status · Manti
              </div>
              <div style={css('font-size:15px;color:rgba(235,235,245,.7);margin-top:5px')}>Updated live from the shop floor.</div>
            </div>
          </div>
          <div style={css('display:flex;gap:28px;align-items:flex-start')}>
            <div style={css('text-align:right')}>
              <div style={css('font-family:var(--data-font,inherit);font-size:44px;font-weight:300;letter-spacing:-1.2px;line-height:1')}>
                {T(vm.lobbyTime)}
              </div>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:rgba(235,235,245,.45);margin-top:8px',
                )}
              >
                {T(vm.lobbyDate)}
              </div>
            </div>
          </div>
        </div>
        <div style={css('margin-top:36px;flex:1;min-height:0;display:flex;gap:44px')}>
          <div style={css('flex:1;min-width:0')}>
            <div
              style={css(
                'display:grid;grid-template-columns:100px 1.2fr 1.1fr minmax(0,1.7fr) 150px;gap:24px;padding-bottom:12px;border-bottom:1px solid rgba(235,235,245,.16);font-family:var(--data-font,inherit);font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              <div>Bay</div>
              <div>Guest</div>
              <div>Vehicle</div>
              <div>Progress</div>
              <div style={css('text-align:right')}>Ready</div>
            </div>
            {L(vm.lobbyRows).map((r, _i) => (
              <React.Fragment key={_i}>
                <div
                  style={css(
                    'display:grid;grid-template-columns:100px 1.2fr 1.1fr minmax(0,1.7fr) 150px;gap:24px;align-items:center;padding:20px 0;border-bottom:1px solid rgba(235,235,245,.08)',
                  )}
                >
                  <div>
                    <div style={css(r?.bayPill)}>{T(r?.bay)}</div>
                  </div>
                  <div style={css('font-size:22px;font-weight:500;letter-spacing:-.4px')}>{T(r?.who)}</div>
                  <div style={css('font-size:15px;color:rgba(235,235,245,.6)')}>{T(r?.car)}</div>
                  <div>
                    <div style={css('display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px')}>
                      <div style={css(`font-size:13.5px;font-weight:500;color:${r?.c ?? ''}`)}>{T(r?.status)}</div>
                      <div style={css('font-family:var(--data-font,inherit);font-size:12px;color:rgba(235,235,245,.45)')}>
                        {T(r?.pctLabel)}
                      </div>
                    </div>
                    <div style={css(r?.ruler?.base)}>
                      <div style={css(r?.ruler?.fill)} />
                    </div>
                  </div>
                  <div style={css('text-align:right')}>
                    <div
                      style={css(
                        `font-family:var(--data-font,inherit);font-size:22px;font-weight:300;letter-spacing:-.6px;line-height:1;color:${r?.etaColor ?? ''}`,
                      )}
                    >
                      {T(r?.eta)}
                    </div>
                    <div style={css('font-size:11.5px;color:rgba(235,235,245,.45);margin-top:6px')}>{T(r?.etaSub)}</div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div
            style={css(
              'width:330px;flex:0 0 330px;border-left:1px solid rgba(235,235,245,.12);padding-left:40px;display:flex;flex-direction:column',
            )}
          >
            <div style={css('display:flex;align-items:center;gap:8px')}>
              <div style={css('width:8px;height:8px;border-radius:4px;background:#e0312b;box-shadow:0 0 0 4px rgba(224,49,43,.22)')} />
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:rgba(235,235,245,.5)',
                )}
              >
                {T(vm.lobbyLiveBay)}
              </div>
            </div>
            <div className="sc-host-x" style={css('height:230px')}>
              <service-scene scene={vm.lobbyScene} phase={vm.lobbyScenePhase} />
            </div>
            <div style={css('font-size:24px;font-weight:500;letter-spacing:-.5px;line-height:1.2')}>{T(vm.lobbyLiveTitle)}</div>
            <div style={css('font-size:14px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>{T(vm.lobbyLiveSub)}</div>
          </div>
        </div>
        <div style={css('flex:1')} />
        <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:24px')}>
          <div style={css('display:flex;gap:36px')}>
            {L(vm.lobbyFoot).map((f, _i) => (
              <React.Fragment key={_i}>
                <div>
                  <div
                    style={css(
                      'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                    )}
                  >
                    {T(f?.k)}
                  </div>
                  <div style={css('font-size:15px;margin-top:6px')}>{T(f?.v)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);text-align:right;line-height:1.5')}>
            Guests are listed by first name.
            <br />
            Estimates and payment are in the RyGuys app.
          </div>
        </div>
      </div>
    </>
  );
}
