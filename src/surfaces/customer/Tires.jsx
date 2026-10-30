import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Tires({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:linear-gradient(180deg,rgba(10,10,14,.72),rgba(10,10,14,.42));backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 -1px 0 rgba(255,255,255,.06);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goBack}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:1.8px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Tires</div>
          <div style={css('width:30px')} />
        </div>
        <div className="sc-host-x" style={css('height:170px')}>
          <service-scene scene={'tire'} phase={vm.tqScene} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css(vm.tqPill)}>{T(vm.tqStatus)}</div>{' '}
          <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15;margin-top:12px')}>{T(vm.tqTitle)}</div>
          <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>{T(vm.tqSub)}</div>
        </div>
        <div style={css('padding:24px 22px 0;display:flex;justify-content:space-between;align-items:baseline')}>
          <div
            style={css(
              'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
            )}
          >
            Options
          </div>
          <div style={css('font-family:var(--data-font,inherit);font-size:11px;color:rgba(235,235,245,.4)')}>{vm.tqSize || '255/45R19'}</div>
        </div>
        <div style={css('margin:8px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.tqOpts).map((o, _i) => (
            <React.Fragment key={_i}>
              <div
                onClick={o?.pick}
                style={css('padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;gap:14px;cursor:pointer')}
              >
                <div style={css(o?.radio)} />
                <div style={css('flex:1;min-width:0')}>
                  <div style={css('display:flex;justify-content:space-between;gap:12px;align-items:baseline')}>
                    <div style={css('font-size:14px;font-weight:600')}>{T(o?.name)}</div>
                    <div style={css('font-family:var(--data-font,inherit);font-size:14px')}>{T(o?.total)}</div>
                  </div>
                  <div style={css('display:flex;justify-content:space-between;gap:12px;margin-top:4px')}>
                    <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>
                      {T(o?.tier)}
                      {' · '}
                      {T(o?.warranty)}
                    </div>
                    <div style={css(`font-size:11px;color:${o?.stockColor ?? ''}`)}>{T(o?.stock)}</div>
                  </div>
                  <div style={css('font-size:12px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:6px')}>{T(o?.note)}</div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          onClick={vm.tqToggleHazard}
          style={css(
            'margin:14px 18px 0;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);padding:14px 16px;display:flex;align-items:center;gap:13px;cursor:pointer',
          )}
        >
          <div style={css('flex:1')}>
            <div style={css('font-size:14px;font-weight:500')}>{vm.tqHazLabel || 'Road hazard protection'}</div>
            <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:3px;line-height:1.45')}>
              {'Free repair or prorated replacement for 3 years. '}
              {T(vm.tqHazardPrice)}
            </div>
          </div>
          <div style={css(vm.tqHazTrack)}>
            <div style={css(vm.tqHazKnob)} />
          </div>
        </div>
        <div style={css('margin:22px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
          {L(vm.tqRows).map((r, _i) => (
            <React.Fragment key={_i}>
              <div
                style={css(
                  'padding:12px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:12px',
                )}
              >
                <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>{T(r?.k)}</span>
                <span style={css('font-family:var(--data-font,inherit);font-size:13px')}>{T(r?.v)}</span>
              </div>
            </React.Fragment>
          ))}
          <div style={css('padding:14px 0;display:flex;justify-content:space-between;align-items:baseline')}>
            <span style={css('font-size:14px;font-weight:500')}>Total installed</span>
            <span style={css('font-family:var(--data-font,inherit);font-size:24px;font-weight:600;letter-spacing:-.6px')}>
              {T(vm.tqTotal)}
            </span>
          </div>
        </div>
        <div style={css('padding:0 22px;font-size:11px;line-height:1.6;color:rgba(235,235,245,.32)')}>
          Tread depths are measured by hand at your visits. Quotes include mounting, balancing, TPMS service and disposal.
        </div>
      </div>
      <div
        style={css(
          'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
        )}
      >
        <div onClick={vm.tqAccept} style={css(vm.tqCtaStyle)}>
          {T(vm.tqCta)}
        </div>
      </div>
    </>
  );
}
