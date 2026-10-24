import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Photos({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;height:100%;display:flex;flex-direction:column')}>
        <div style={css('padding:calc(var(--sat) + 5px) 22px 12px;display:flex;align-items:center')}>
          <div
            onClick={vm.goBack}
            style={css('width:40px;display:flex;align-items:center;color:rgba(235,235,245,.85);cursor:pointer;margin-left:-7px')}
          >
            <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
          </div>
          <div style={css('flex:1;text-align:center;font-size:15px;font-weight:600')}>{T(vm.photoCount)}</div>
          <div style={css('width:40px')} />
        </div>
        <div
          onScroll={vm.onPhotoScroll}
          style={css('display:flex;overflow-x:auto;scroll-snap-type:x mandatory;flex:0 0 auto')}
          className="hidescroll"
        >
          {L(vm.photos).map((p, _i) => (
            <React.Fragment key={_i}>
              <div style={css('flex:0 0 100%;scroll-snap-align:start;padding:0 18px')}>
                <div style={css(`height:300px;border-radius:16px;position:relative;${p?.ph ?? ''}`)}>
                  <div
                    style={css(
                      'position:absolute;left:16px;bottom:14px;font-size:34px;font-weight:500;letter-spacing:-.6px;color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.6)',
                    )}
                  >
                    {T(p?.meas)}
                  </div>
                  {p?.marked ? (
                    <>
                      <div
                        style={css('position:absolute;left:38%;top:30%;width:84px;height:84px;border:3px solid #e0312b;border-radius:50%')}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('display:flex;justify-content:center;gap:6px;margin-top:12px')}>
          {L(vm.photoDots).map((d, _i) => (
            <React.Fragment key={_i}>
              <div style={css(d?.style)} />
            </React.Fragment>
          ))}
        </div>
        <div style={css('padding:22px 22px 0;animation:fadeIn .3s ease')}>
          <div style={css('display:flex;align-items:center;gap:9px')}>
            <div style={css(vm.photo?.dot)} />
            <div style={css('font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:rgba(235,235,245,.5)')}>
              {T(vm.photo?.cat)}
            </div>
          </div>
          <div style={css('font-size:22px;font-weight:600;letter-spacing:-.5px;margin-top:10px')}>{T(vm.photo?.rec)}</div>
          <div style={css('font-size:13.5px;line-height:1.55;color:rgba(235,235,245,.7);margin-top:10px')}>{T(vm.photo?.note)}</div>
          <div style={css('font-size:11px;color:rgba(235,235,245,.35);margin-top:14px')}>
            {'Photo by Marcus T. · 9:31 AM · '}
            {T(vm.photo?.shot)}
          </div>
        </div>
      </div>
    </>
  );
}
