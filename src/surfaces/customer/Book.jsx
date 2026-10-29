import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Book({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(8,8,10,.52);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
          )}
        >
          <div
            onClick={vm.bookBack}
            style={css('width:30px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Book service</div>
          <div style={css('width:30px;text-align:right;font-size:11px;color:rgba(235,235,245,.4)')}>{T(vm.bookStepLabel)}</div>
        </div>
        {vm.bookDone ? (
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
              <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;margin-top:22px')}>Appointment booked</div>
              <div style={css('font-size:15px;margin-top:10px')}>{T(vm.bookWhen)}</div>
              <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:4px')}>
                {(vm.bookCar || 'Quicksilver') + ' · '}
                {T(vm.bookNeed)}
                {' · '}
                {T(vm.bookVisit)}
              </div>{' '}
              <div
                onClick={vm.goHome}
                style={css(
                  'margin-top:28px;display:inline-block;padding:13px 26px;border-radius:11px;background:rgba(255,255,255,.09);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09);font-size:13px;font-weight:500;cursor:pointer',
                )}
              >
                Done
              </div>
            </div>
          </>
        ) : null}
        {vm.bookActive ? (
          <>
            <div style={css('padding:0 22px')}>
              <div style={css('display:flex;gap:5px')}>
                {L(vm.bookBars).map((b, _i) => (
                  <React.Fragment key={_i}>
                    <div style={css(b?.style)} />
                  </React.Fragment>
                ))}
              </div>
              <div style={css('font-size:25px;font-weight:500;letter-spacing:-.4px;margin-top:20px;line-height:1.15')}>
                {T(vm.bookTitle)}
              </div>
              <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.48);margin-top:8px')}>{T(vm.bookSub)}</div>
            </div>
            {vm.bk0 ? (
              <>
                <div style={css('padding:20px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:9px')}>
                  {L(vm.needs).map((n, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={n?.pick} style={css(n?.style)}>
                        {T(n?.label)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {vm.bk1 && vm.bookVehicles ? (
              <div style={css('padding:20px 18px 0;display:flex;flex-direction:column;gap:10px')}>
                {vm.bookVehicles.map((v, i) => (
                  <div key={i} onClick={v.pick} style={css('background:rgba(255,255,255,.065);backdrop-filter:blur(22px) saturate(170%);-webkit-backdrop-filter:blur(22px) saturate(170%);border-radius:20px;border:1px solid rgba(255,255,255,.11);box-shadow:inset 0 1px 0 rgba(255,255,255,.13);padding:15px 16px;display:flex;align-items:center;gap:13px;cursor:pointer;' + (v.on ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)' : ''))}>
                    <div style={css('width:22px;height:22px;border-radius:11px;display:flex;align-items:center;justify-content:center;' + (v.on ? 'background:#fff;color:#000' : 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)'))}>
                      {v.on ? <svg viewBox="0 0 24 24" style={css('width:12px;height:12px;display:block')}><path d="M5 12.5l4.5 4.5L19 7" style={css('fill:none;stroke:currentColor;stroke-width:2.6px;stroke-linecap:round;stroke-linejoin:round')} /></svg> : null}
                    </div>
                    <div style={css('flex:1')}>
                      <div style={css('font-size:14.5px;font-weight:500')}>{v.label}</div>
                      {v.sub ? <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:3px')}>{v.sub}</div> : null}
                    </div>
                  </div>
                ))}
                {!vm.bookVehicles.length ? <div style={css('font-size:13px;color:rgba(235,235,245,.5);padding:6px 4px;line-height:1.5')}>No vehicle on file yet. Continue to add one.</div> : null}
              </div>
            ) : null}
            {vm.bk1 && !vm.bookVehicles ? (
              <>
                <div style={css('padding:20px 18px 0')}>
                  <div
                    style={css(
                      'background:rgba(255,255,255,.065);backdrop-filter:blur(22px) saturate(170%);-webkit-backdrop-filter:blur(22px) saturate(170%);border-radius:20px;border:1px solid rgba(255,255,255,.11);box-shadow:inset 0 1px 0 rgba(255,255,255,.13);padding:15px 16px;display:flex;align-items:center;gap:13px',
                    )}
                  >
                    <div
                      style={css(
                        'width:22px;height:22px;border-radius:11px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center',
                      )}
                    >
                      <svg viewBox="0 0 24 24" style={css('width:12px;height:12px;display:block;flex:0 0 auto')}>
                        <path
                          d="M5 12.5l4.5 4.5L19 7"
                          style={css('fill:none;stroke:currentColor;stroke-width:2.6px;stroke-linecap:round;stroke-linejoin:round')}
                        />
                      </svg>
                    </div>
                    <div style={css('flex:1')}>
                      <div style={css('font-size:14.5px;font-weight:500')}>Quicksilver</div>
                      <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:3px')}>
                        {'2022 Tesla Model Y · '}
                        {T(vm.odoFmt)}
                        {' mi'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
            {vm.bk2 ? (
              <>
                <div style={css('padding:20px 22px 0')}>
                  <textarea
                    value={val(vm.bookDesc)}
                    onChange={vm.onBookDesc}
                    placeholder="Car shakes when I brake."
                    style={css(
                      'width:100%;min-height:110px;resize:none;background:rgba(255,255,255,.09);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.09);border:none;border-radius:12px;padding:14px;color:#fff;font-size:14px;line-height:1.5;outline:none;font-family:inherit',
                    )}
                  />{' '}
                  <div
                    style={css(
                      'margin-top:12px;border:1px dashed rgba(235,235,245,.16);border-radius:12px;padding:14px;text-align:center;font-size:12.5px;color:rgba(235,235,245,.5);cursor:pointer',
                    )}
                  >
                    + Add a photo or video (optional)
                  </div>
                </div>
              </>
            ) : null}
            {vm.bk3 ? (
              <>
                <div style={css('display:flex;gap:8px;overflow-x:auto;padding:20px 22px 0')} className="hidescroll">
                  {L(vm.bookDays).map((d, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={d?.pick} style={css(d?.style)}>
                        {T(d?.label)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div style={css('padding:18px 22px 0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px')}>
                  {L(vm.bookSlots).map((t, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={t?.pick} style={css(t?.style)}>
                        {T(t?.label)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {vm.bk4 ? (
              <>
                <div style={css('padding:20px 18px 0;display:flex;flex-direction:column;gap:9px')}>
                  {L(vm.visitTypes).map((v, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={v?.pick} style={css(v?.style)}>
                        <div style={css('flex:1')}>
                          <div style={css('font-size:14.5px;font-weight:500')}>{T(v?.name)}</div>
                          <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:3px')}>{T(v?.sub)}</div>
                        </div>{' '}
                        <div style={css(v?.radio)} />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {vm.bk5 ? (
              <>
                <div style={css('margin:20px 22px 0;border-top:1px solid rgba(235,235,245,.09)')}>
                  {L(vm.bookSummary).map((r, _i) => (
                    <React.Fragment key={_i}>
                      <div
                        style={css(
                          'padding:14px 0;border-bottom:1px solid rgba(235,235,245,.07);display:flex;justify-content:space-between;gap:14px',
                        )}
                      >
                        <span style={css('font-size:13px;color:rgba(235,235,245,.5)')}>{T(r?.k)}</span>
                        <span style={css('font-size:13px;text-align:right;line-height:1.4')}>{T(r?.v)}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div style={css('padding:14px 24px 0;font-size:11px;line-height:1.6;color:rgba(235,235,245,.35)')}>
                  Inspections are free. You approve any work before it starts.
                </div>
              </>
            ) : null}
            {vm.bookErr ? (
              <>
                <div
                  style={css(
                    'margin:18px 18px 0;background:rgba(255,69,58,.14);border-radius:12px;padding:12px 14px;font-size:12px;line-height:1.45;color:#ff8a80;animation:sIn .25s ease',
                  )}
                >
                  {T(vm.bookErr)}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>
      {vm.bookActive ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);z-index:6',
            )}
          >
            <div
              onClick={vm.bookNext}
              style={css(
                'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
              )}
            >
              {T(vm.bookCta)}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
