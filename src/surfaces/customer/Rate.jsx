import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Rate({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(8,8,10,.52);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goHome}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Rate your visit</div>
          <div style={css('width:30px')} />
        </div>
        {vm.rateSent ? (
          <>
            <div style={css('padding:calc(var(--sat) + 23px) 30px 0;text-align:center;animation:pop .5s cubic-bezier(.2,.8,.2,1)')}>
              <div
                style={css(
                  'width:72px;height:72px;border-radius:36px;background:#fff;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#000',
                )}
              >
                <svg viewBox="0 0 24 24" style={css('width:32px;height:32px;display:block;flex:0 0 auto')}>
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    style={css('fill:none;stroke:currentColor;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
              </div>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;margin-top:22px')}>Thank you.</div>
              <div style={css('font-size:13.5px;line-height:1.5;color:rgba(235,235,245,.55);margin-top:8px;text-wrap:pretty')}>
                {T(vm.rateThanks)}
              </div>{' '}
              <div
                onClick={vm.goHome}
                style={css(
                  'margin-top:28px;display:inline-block;padding:13px 26px;border-radius:12px;background:rgba(255,255,255,.09);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09);font-size:13px;font-weight:600;cursor:pointer',
                )}
              >
                Done
              </div>
            </div>
          </>
        ) : null}
        {vm.rateOpen ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15')}>How did we do?</div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
                {vm.rateSub || 'Front brake service · Marcus T. · October 5'}
              </div>
            </div>
            <div style={css('padding:30px 22px 0;display:flex;justify-content:center;gap:12px')}>
              {L(vm.stars).map((x, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={x?.pick} style={css(x?.style)}>
                    <svg viewBox="0 0 24 24" style={css('width:36px;height:36px;display:block')}>
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        style={css(x?.path)}
                      />
                    </svg>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('text-align:center;font-size:13px;color:rgba(235,235,245,.5);margin-top:14px;min-height:18px')}>
              {T(vm.starLabel)}
            </div>
            <div
              style={css(
                'padding:30px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              What stood out
            </div>
            <div style={css('padding:10px 22px 0;display:flex;flex-wrap:wrap;gap:8px')}>
              {L(vm.rateTags).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={t?.pick} style={css(t?.style)}>
                    {T(t?.label)}
                  </div>
                </React.Fragment>
              ))}
            </div>
            {vm.tips && vm.tips.length ? (<>
            <div style={css('padding:28px 22px 0;display:flex;justify-content:space-between;align-items:baseline')}>
              <div
                style={css(
                  'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                )}
              >
                Tip Marcus
              </div>
              <div style={css('font-size:11px;color:rgba(235,235,245,.35)')}>100% goes to your technician</div>
            </div>
            <div style={css('padding:10px 18px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px')}>
              {L(vm.tips).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={t?.pick} style={css(t?.style)}>
                    {T(t?.label)}
                  </div>
                </React.Fragment>
              ))}
            </div>
            </>) : null}
            <div style={css('padding:22px 22px 0')}>
              <textarea
                value={val(vm.rateNote)}
                onChange={vm.onRateNote}
                placeholder={vm.ratePlaceholder || 'Anything else? Marcus reads these.'}
                style={css(
                  'width:100%;min-height:88px;resize:none;background:rgba(255,255,255,.09);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09);border:none;border-radius:12px;padding:14px;color:#fff;font-size:14px;line-height:1.5;outline:none;font-family:inherit',
                )}
              />
            </div>
          </>
        ) : null}
      </div>
      {vm.rateOpen ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
            )}
          >
            <div onClick={vm.sendRating} style={css(vm.rateCtaStyle)}>
              {T(vm.rateCta)}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
