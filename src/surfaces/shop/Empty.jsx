import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Empty({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>{T(vm.dEmptyTitle)}</div>
        <div style={css('margin-top:80px;text-align:center')}>
          <div style={css('font-size:18px;font-weight:500')}>Not in this prototype</div>
          <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:8px;line-height:1.5')}>
            {T(vm.dEmptyTitle)}
            {' would live here, built on the same work-order records the other screens use.'}
          </div>
        </div>
      </div>
    </>
  );
}
