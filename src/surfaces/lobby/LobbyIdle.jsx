import React from 'react';
import { css } from '../../runtime/tpl.js';

// The lobby board outside opening hours: time, next opening, and the practical lines.

function useClock() {
  const [now, set] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => set(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  return now;
}
const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).replace(/,/g, ' ·').toUpperCase();

export function LobbyIdle({ vm }) {
  const now = useClock();
  const MONO = 'font-family:var(--data-font,inherit)';
  return (
    <div style={css('width:1360px;height:765px;background:#000;color:#fff;padding:44px 56px 40px;display:flex;flex-direction:column;' + (vm.lobbyScaleStyle || '') + ";font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif")}>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-start')}>
        <div style={css('display:flex;align-items:center;gap:18px')}>
          <img src="/uploads/revyn.png" alt="Revyn" style={css('height:14px;width:auto;display:block')} />
          <div style={css(MONO + ';font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:rgba(235,235,245,.45)')}>Service status · Manti</div>
        </div>
        <div style={css('text-align:right')}>
          <div style={css(MONO + ';font-size:44px;font-weight:300;letter-spacing:-1.2px;line-height:1')}>{fmtTime(now)}</div>
          <div style={css(MONO + ';font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:rgba(235,235,245,.45);margin-top:8px')}>{fmtDate(now)}</div>
        </div>
      </div>
      <div style={css('flex:1;display:flex;flex-direction:column;justify-content:center;align-items:flex-start')}>
        <div style={css('font-size:64px;font-weight:600;letter-spacing:-2.2px;line-height:1.02')}>{vm.idleTitle || 'Closed for the day.'}</div>
        <div style={css('font-size:22px;color:rgba(235,235,245,.55);margin-top:18px')}>{vm.idleSub || 'Opens Monday at 8:00 AM.'}</div>
      </div>
      <div style={css('display:flex;justify-content:space-between;align-items:flex-end;gap:24px')}>
        <div style={css('display:flex;gap:36px')}>
          {(vm.lobbyFoot || []).map((f, i) => (
            <div key={i}>
              <div style={css(MONO + ';font-size:10.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:rgba(235,235,245,.4)')}>{f.k}</div>
              <div style={css('font-size:15px;margin-top:6px')}>{f.v}</div>
            </div>
          ))}
        </div>
        <div style={css('font-size:12.5px;color:rgba(235,235,245,.4);text-align:right;line-height:1.5')}>Book, approve and pay in the RyGuys app.</div>
      </div>
    </div>
  );
}
