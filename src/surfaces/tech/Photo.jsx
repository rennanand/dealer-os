import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Photo({ vm }) {
  return (
    <>
      <div style={css('animation:fadeIn .25s ease;height:100%;display:flex;flex-direction:column;background:#050505')}>
        <div style={css('padding:22px 30px;display:flex;align-items:center;gap:14px')}>
          <div onClick={vm.tgoInspect} style={css('font-size:13px;color:#fff;cursor:pointer;opacity:.8')}>
            Cancel
          </div>
          <div style={css('flex:1;text-align:center;font-size:14px;color:rgba(235,235,245,.6)')}>
            {T(vm.catName)}
            {' · '}
            {T(vm.posName)}
          </div>
          <div style={css('display:flex;background:#1c1c1e;border-radius:9px;padding:3px')}>
            {L(vm.photoModes).map((m, _i) => (
              <React.Fragment key={_i}>
                <div onClick={m?.pick} style={css(m?.style)}>
                  {T(m?.label)}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div
          onClick={vm.addMark}
          style={css(`flex:1;margin:0 30px;border-radius:18px;position:relative;cursor:crosshair;overflow:hidden;${vm.ph ?? ''}`)}
        >
          {'Viewfinder — front left brake, caliper and rotor face\n        '}
          {L(vm.marks).map((k, _i) => (
            <React.Fragment key={_i}>
              <div style={css(k?.style)}>{T(k?.glyph)}</div>
            </React.Fragment>
          ))}{' '}
          <div
            style={css(
              'position:absolute;top:14px;left:14px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);border-radius:7px;padding:6px 10px;font-size:11px;color:rgba(255,255,255,.75)',
            )}
          >
            {T(vm.markHint)}
          </div>
        </div>
        <div style={css('padding:20px 30px 26px;display:flex;align-items:center;gap:12px')}>
          {L(vm.tools).map((t, _i) => (
            <React.Fragment key={_i}>
              <div onClick={t?.pick} style={css(t?.style)}>
                {T(t?.label)}
              </div>
            </React.Fragment>
          ))}
          <div
            onClick={vm.clearMarks}
            style={css('padding:13px 16px;border-radius:12px;background:#1c1c1e;font-size:13px;color:rgba(235,235,245,.6);cursor:pointer')}
          >
            Clear
          </div>
          <div style={css('flex:1')} />
          <div
            onClick={vm.addToReport}
            style={css('padding:15px 26px;border-radius:12px;background:#fff;color:#000;font-size:14px;font-weight:500;cursor:pointer')}
          >
            Add to customer report
          </div>
        </div>
      </div>
    </>
  );
}
