import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Onboard({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;height:100%;display:flex;flex-direction:column;padding-bottom:calc(var(--sab) + 17px)')}>
        {vm.ob0 ? (
          <>
            <div style={css('flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding:0 26px 8px')}>
              <img src="/uploads/revyn.png" alt="Revyn" style={css('height:16px;width:auto;display:block')} />
              <div style={css('font-size:34px;font-weight:600;letter-spacing:-1.2px;line-height:1.05;margin-top:22px;text-wrap:pretty')}>
                Your car, in your pocket.
              </div>
              <div style={css('font-size:14px;line-height:1.55;color:rgba(235,235,245,.55);margin-top:12px;text-wrap:pretty')}>
                Live service updates, photos from your technician, approvals with a tap, and every record in one place.
              </div>
            </div>
            <div style={css('padding:18px 18px 0')}>
              <div
                onClick={vm.obNext}
                style={css(
                  'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                Get started
              </div>
              <div style={css('text-align:center;font-size:12px;color:rgba(235,235,245,.4);margin-top:14px')}>
                {'Already have an account? '}
                <span style={css('color:#fff;font-weight:500')}>Sign in</span>
              </div>
            </div>
          </>
        ) : null}
        {vm.ob1 ? (
          <>
            <div style={css('padding:calc(var(--sat) + 13px) 22px 0;flex:1')}>
              <div style={css('display:flex;gap:5px')}>
                {L(vm.obDots).map((d, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css(d?.style)} />
                  </React.Fragment>
                ))}
              </div>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15;margin-top:22px')}>
                What’s your number?
              </div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                We’ll text you a code. No passwords.
              </div>
              <div
                style={css(
                  'margin-top:28px;display:flex;align-items:center;gap:10px;padding:16px 18px;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);border-radius:14px',
                )}
              >
                <div style={css('font-size:20px;color:rgba(235,235,245,.5)')}>+1</div>
                <input
                  value={val(vm.obPhone)}
                  onChange={vm.onObPhone}
                  inputMode="tel"
                  placeholder="(435) 555-0100"
                  style={css(
                    'flex:1;min-width:0;background:none;border:none;color:#fff;font-size:22px;font-weight:500;letter-spacing:.3px;outline:none;font-family:inherit',
                  )}
                />
              </div>
              <div style={css('font-size:11px;line-height:1.6;color:rgba(235,235,245,.35);margin-top:14px')}>
                By continuing you agree to receive texts from RyGuys about your vehicle. Message rates may apply.
              </div>
            </div>
            <div style={css('padding:0 18px')}>
              <div onClick={vm.obNext} style={css(vm.obCtaStyle)}>
                Send code
              </div>
            </div>
          </>
        ) : null}
        {vm.ob2 ? (
          <>
            <div style={css('padding:calc(var(--sat) + 13px) 22px 0;flex:1')}>
              <div style={css('display:flex;gap:5px')}>
                {L(vm.obDots).map((d, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css(d?.style)} />
                  </React.Fragment>
                ))}
              </div>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15;margin-top:22px')}>Enter the code</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                {'Sent to +1 '}
                {T(vm.obPhoneLabel)}
              </div>
              <div style={css('margin-top:28px;position:relative')}>
                <div style={css('display:grid;grid-template-columns:repeat(6,1fr);gap:8px')}>
                  {L(vm.obCodeBoxes).map((c, _i) => (
                    <React.Fragment key={_i}>
                      <div style={css(c?.style)}>{T(c?.v)}</div>
                    </React.Fragment>
                  ))}
                </div>{' '}
                <input
                  value={val(vm.obCode)}
                  onChange={vm.onObCode}
                  inputMode="numeric"
                  style={css('position:absolute;inset:0;opacity:0;width:100%;font-size:22px;outline:none')}
                />
              </div>{' '}
              <div
                onClick={vm.obAutofill}
                style={css(
                  'margin-top:18px;display:inline-flex;align-items:center;gap:9px;padding:10px 14px;border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.07));border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.25),0 8px 20px -8px rgba(0,0,0,.55);font-size:12.5px;color:rgba(235,235,245,.8);cursor:pointer',
                )}
              >
                <svg viewBox="0 0 24 24" style={css('width:15px;height:15px;display:block;flex:0 0 auto')}>
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
                {'From Messages · '}
                <span style={css('font-weight:600;color:#fff;letter-spacing:.08em')}>428316</span>
              </div>{' '}
              <div style={css('font-size:12px;color:rgba(235,235,245,.4);margin-top:16px')}>
                {'Didn’t get it? '}
                <span style={css('color:#fff;font-weight:500')}>Resend</span>
              </div>
            </div>
            <div style={css('padding:0 18px')}>
              <div onClick={vm.obNext} style={css(vm.obCtaStyle)}>
                Continue
              </div>
            </div>
          </>
        ) : null}
        {vm.ob3 ? (
          <>
            <div style={css('padding:calc(var(--sat) + 13px) 22px 0;flex:1;overflow-y:auto')} className="hidescroll">
              <div style={css('display:flex;gap:5px')}>
                {L(vm.obDots).map((d, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css(d?.style)} />
                  </React.Fragment>
                ))}
              </div>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15;margin-top:22px')}>
                Add your vehicle
              </div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                Plate or VIN. We’ll pull the rest.
              </div>
              <div style={css('margin-top:24px;display:flex;gap:8px')}>
                <input
                  value={val(vm.obPlate)}
                  onChange={vm.onObPlate}
                  placeholder="RYG 8A42"
                  style={css(
                    'flex:1;min-width:0;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);border-radius:14px;border:none;padding:16px 18px;color:#fff;font-size:18px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;outline:none;font-family:inherit',
                  )}
                />
                <div
                  onClick={vm.obLookup}
                  style={css(
                    'padding:0 18px;border-radius:14px;background:#fff;color:#000;font-size:13px;font-weight:600;display:flex;align-items:center;cursor:pointer',
                  )}
                >
                  Look up
                </div>
              </div>
              {vm.obSearching ? (
                <>
                  <div style={css('margin-top:20px;font-size:13px;color:rgba(235,235,245,.5);animation:fadeIn .3s ease')}>
                    {'Looking up '}
                    {T(vm.obPlateLabel)}
                    {' with Utah DMV…'}
                  </div>
                </>
              ) : null}
              {vm.obFound ? (
                <>
                  <div style={css('animation:sIn .3s ease')}>
                    <div style={css('height:176px')} />
                    <div style={css('text-align:center')}>
                      <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px')}>2022 Tesla Model Y</div>
                      <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:5px')}>
                        Long Range AWD · Quicksilver · VIN ···· 8A42
                      </div>
                    </div>
                    <div
                      style={css(
                        'margin-top:22px;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                      )}
                    >
                      Name it (optional)
                    </div>{' '}
                    <input
                      value={val(vm.obName)}
                      onChange={vm.onObName}
                      placeholder="Quicksilver"
                      style={css(
                        'margin-top:8px;width:100%;background:linear-gradient(152deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.085) 40%,rgba(255,255,255,.05) 100%);border-radius:22px;border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.32),inset 1px 0 0 rgba(255,255,255,.07),0 20px 44px -14px rgba(0,0,0,.65);border-radius:14px;border:none;padding:14px 16px;color:#fff;font-size:15px;outline:none;font-family:inherit',
                      )}
                    />{' '}
                    <div style={css('margin-top:14px;display:flex;gap:8px;align-items:center;font-size:12.5px;color:rgba(235,235,245,.6)')}>
                      <span style={css('color:#30d158;display:inline-flex')}>
                        <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                          <path
                            d="M5 12.5l4.5 4.5L19 7"
                            style={css('fill:none;stroke:currentColor;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')}
                          />
                        </svg>
                      </span>
                      3 service records at RyGuys found and attached
                    </div>
                  </div>
                </>
              ) : null}
            </div>
            <div style={css('padding:14px 18px 0')}>
              <div onClick={vm.obNext} style={css(vm.obCtaStyle)}>
                {T(vm.ob3Cta)}
              </div>
              <div
                onClick={vm.obSkip}
                style={css('text-align:center;font-size:12.5px;color:rgba(235,235,245,.45);margin-top:14px;cursor:pointer')}
              >
                Skip for now
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
