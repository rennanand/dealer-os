import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Testdrive({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:52px 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.goBack}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Test drive</div>
          <div style={css('width:30px')} />
        </div>
        {vm.tdDone ? (
          <>
            <div style={css('padding:70px 30px 0;text-align:center;animation:pop .5s cubic-bezier(.2,.8,.2,1)')}>
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
              <div
                style={css(
                  'font-size:12px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:rgba(235,235,245,.5);margin-top:24px',
                )}
              >
                Test drive appointment
              </div>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;margin-top:8px')}>
                {T(vm.td?.day)}
                {' · '}
                {T(vm.td?.time)}
              </div>
              <div style={css('font-size:13.5px;color:rgba(235,235,245,.55);margin-top:6px')}>
                {T(vm.sel?.name)}
                {' · '}
                {T(vm.td?.driver)}
              </div>{' '}
              <div
                onClick={vm.goBack}
                style={css(
                  'margin-top:28px;display:inline-block;padding:13px 26px;border-radius:11px;background:#1c1c1e;font-size:13px;font-weight:500;cursor:pointer',
                )}
              >
                Done
              </div>
            </div>
          </>
        ) : null}
        {vm.tdActive ? (
          <>
            <div style={css('padding:6px 22px 0')}>
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px')}>Schedule a test drive</div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px')}>
                {T(vm.sel?.name)}
                {' · about 30 minutes'}
              </div>
            </div>
            <div style={css('display:flex;gap:8px;overflow-x:auto;padding:20px 22px 0')} className="hidescroll">
              {L(vm.tdDays).map((d, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={d?.pick} style={css(d?.style)}>
                    {T(d?.label)}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={css('padding:16px 22px 0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px')}>
              {L(vm.tdTimes).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={t?.pick} style={css(t?.style)}>
                    {T(t?.label)}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div
              style={css(
                'padding:24px 22px 0;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
              )}
            >
              Who will be driving?
            </div>
            <div style={css('padding:10px 22px 0')}>
              <input
                value={val(vm.td?.driver)}
                onChange={vm.onTdDriver}
                style={css(
                  'width:100%;background:#1c1c1e;border:none;border-radius:12px;padding:14px;color:#fff;font-size:14px;outline:none;font-family:inherit',
                )}
              />{' '}
              <div style={css('font-size:11px;color:rgba(235,235,245,.35);margin-top:8px')}>
                Bring a valid driver's license. Insurance is covered by RyGuys during the drive.
              </div>
            </div>
          </>
        ) : null}
      </div>
      {vm.tdActive ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px 30px;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
            )}
          >
            <div
              onClick={vm.bookTd}
              style={css(
                'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
              )}
            >
              Confirm test drive
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
