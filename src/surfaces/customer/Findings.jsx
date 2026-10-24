import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Findings({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;padding:0 0 130px')}>
        <div
          style={css(
            'position:sticky;top:0;z-index:5;background:rgba(0,0,0,.86);backdrop-filter:blur(18px);padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center',
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
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>Inspection</div>
          <div style={css('width:30px')} />
        </div>
        <div style={css('padding:6px 22px 0')}>
          <div style={css('font-size:28px;font-weight:600;letter-spacing:-.8px;line-height:1.15')}>We found a few things.</div>
          <div style={css('font-size:13px;line-height:1.5;color:rgba(235,235,245,.5);margin-top:8px')}>
            Your technician completed a full inspection of Quicksilver.
          </div>
        </div>
        <div
          onClick={vm.goPhotos}
          style={css('display:flex;gap:8px;overflow-x:auto;padding:18px 22px 0;cursor:pointer')}
          className="hidescroll"
        >
          {L(vm.photoThumbs).map((p, _i) => (
            <React.Fragment key={_i}>
              <div style={css(`flex:0 0 132px;height:92px;border-radius:11px;position:relative;overflow:hidden;${p?.ph ?? ''}`)}>
                <div
                  style={css(
                    'position:absolute;left:8px;bottom:7px;font-size:12px;font-weight:500;color:#fff;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);padding:3px 7px;border-radius:5px',
                  )}
                >
                  {T(p?.meas)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:20px 18px 0;display:flex;flex-direction:column;gap:18px')}>
          {L(vm.findingGroups).map((grp, _i) => (
            <React.Fragment key={_i}>
              <div>
                <div
                  style={css(
                    'padding:0 4px;font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)',
                  )}
                >
                  {T(grp?.tier)}
                </div>
                {L(grp?.items).map((f, _i1) => (
                  <React.Fragment key={_i1}>
                    <div style={css('margin-top:9px;background:#1c1c1e;border-radius:14px;overflow:hidden')}>
                      <div onClick={f?.toggle} style={css('padding:15px 16px;display:flex;align-items:center;gap:12px;cursor:pointer')}>
                        <div style={css(f?.dot)} />
                        <div style={css('flex:1;font-size:14.5px;font-weight:500')}>{T(f?.name)}</div>
                        <div style={css('font-size:14px')}>{T(f?.price)}</div>
                        <div style={css(f?.chev)}>
                          <svg viewBox="0 0 24 24" style={css('width:14px;height:14px;display:block;flex:0 0 auto')}>
                            <path
                              d="M9 6l6 6-6 6"
                              style={css(
                                'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round',
                              )}
                            />
                          </svg>
                        </div>
                      </div>
                      {f?.open ? (
                        <>
                          <div style={css('padding:0 16px 16px;animation:fadeIn .25s ease')}>
                            <div style={css('font-size:13px;line-height:1.55;color:rgba(235,235,245,.85)')}>{T(f?.plain)}</div>{' '}
                            <div
                              onClick={vm.goPhotos}
                              style={css(`margin-top:12px;height:140px;border-radius:11px;position:relative;cursor:pointer;${f?.ph ?? ''}`)}
                            >
                              <div
                                style={css(
                                  'position:absolute;left:12px;bottom:10px;font-size:22px;font-weight:600;letter-spacing:-.5px;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.6)',
                                )}
                              >
                                {T(f?.meas)}
                              </div>
                              <div style={css('position:absolute;right:12px;bottom:12px;font-size:11px;color:rgba(255,255,255,.75)')}>
                                {T(f?.photos)}
                              </div>
                            </div>{' '}
                            <div style={css('margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px')}>
                              <div style={css('background:rgba(255,255,255,.05);border-radius:10px;padding:11px 12px')}>
                                <div style={css('font-size:10.5px;color:rgba(235,235,245,.4)')}>{T(f?.measLabel)}</div>
                                <div style={css('font-size:14px;font-weight:500;margin-top:4px')}>{T(f?.meas)}</div>
                              </div>
                              <div style={css('background:rgba(255,255,255,.05);border-radius:10px;padding:11px 12px')}>
                                <div style={css('font-size:10.5px;color:rgba(235,235,245,.4)')}>How urgent</div>
                                <div style={css('font-size:12.5px;line-height:1.35;margin-top:4px')}>{T(f?.urgency)}</div>
                              </div>
                            </div>
                            <div style={css('margin-top:12px;font-size:11px;color:rgba(235,235,245,.4)')}>If you wait</div>
                            <div style={css('font-size:12.5px;line-height:1.5;color:rgba(235,235,245,.7);margin-top:4px')}>
                              {T(f?.wait)}
                            </div>
                            <div style={css('margin-top:12px;font-size:11px;color:rgba(235,235,245,.4)')}>Technician note</div>
                            <div
                              style={css('font-size:12.5px;line-height:1.5;color:rgba(235,235,245,.7);margin-top:4px;font-style:italic')}
                            >
                              “{T(f?.tech)}”
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      {vm.needsApproval ? (
        <>
          <div
            style={css(
              'position:absolute;left:0;right:0;bottom:0;padding:14px 18px calc(var(--sab) + 13px);background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.95) 34%);display:flex;gap:10px;z-index:6',
            )}
          >
            <div
              onClick={vm.goMessages}
              style={css(
                'flex:0 0 42%;text-align:center;padding:15px 0;border-radius:12px;background:#1c1c1e;font-size:13px;font-weight:500;color:#fff;cursor:pointer',
              )}
            >
              Ask a question
            </div>
            <div
              onClick={vm.goApprove}
              style={css(
                'flex:1;text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer',
              )}
            >
              Review service plan
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
