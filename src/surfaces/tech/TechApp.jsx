import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import { Inspect } from './Inspect.jsx';
import { Job } from './Job.jsx';
import { Oil } from './Oil.jsx';
import { Photo } from './Photo.jsx';
import { QC } from './QC.jsx';
import { Report } from './Report.jsx';
import { Today } from './Today.jsx';

export function TechApp({ vm }) {
  return (
    <>
      <div
        style={css(
          "position:relative;height:760px;background:#000;border-radius:18px;overflow:hidden;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif;display:flex",
        )}
      >
        <div
          style={css(
            'width:84px;flex:0 0 84px;border-right:1px solid rgba(235,235,245,.07);display:flex;flex-direction:column;align-items:center;padding:22px 0;gap:6px',
          )}
        >
          <div
            style={css(
              'width:40px;height:40px;border-radius:9px;background:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:14px',
            )}
          >
            <img src="/uploads/ryguys-logo-trim.png" alt="" style={css('height:14px;width:auto')} />
          </div>
          {L(vm.padNav).map((n, _i) => (
            <React.Fragment key={_i}>
              <div onClick={n?.go} style={css(n?.style)}>
                <svg viewBox="0 0 24 24" style={css('width:20px;height:20px;display:block;margin:0 auto')}>
                  <path
                    d={n?.d}
                    style={css('fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round')}
                  />
                </svg>
                <div style={css('font-size:9.5px;margin-top:6px;font-weight:500')}>{T(n?.label)}</div>
              </div>
            </React.Fragment>
          ))}
          <div style={css('flex:1')} />
          <div
            style={css(
              'width:40px;height:40px;border-radius:20px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:12px;letter-spacing:.4px',
            )}
          >
            MT
          </div>
        </div>
        <div style={css('flex:1;min-width:0;position:relative')}>
          {vm.tToday ? <Today vm={vm} /> : null}
          {vm.tJob ? <Job vm={vm} /> : null}
          {vm.tOil ? <Oil vm={vm} /> : null}
          {vm.tInspect ? <Inspect vm={vm} /> : null}
          {vm.tPhoto ? <Photo vm={vm} /> : null}
          {vm.tQC ? <QC vm={vm} /> : null}
          {vm.tReport ? <Report vm={vm} /> : null}
        </div>
      </div>
    </>
  );
}
