import React from 'react';
import { css } from '../../runtime/tpl.js';
import { Empty, LBL, Dot, chip } from './ui.jsx';

/** Inbox on real records: in-app messages and texts in one thread per customer. A reply goes to the
 *  app when the customer is in it, otherwise by text; the writer can force either. */
export function InboxLive({ vm }) {
  const ib = vm.inbox, t = ib.thread;
  const endRef = React.useRef(null);
  React.useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ block: 'end' }); }, [t && t.id, t && t.msgs.length]);
  return (
    <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
      <div style={css('width:340px;flex:0 0 340px;display:flex;flex-direction:column;gap:18px;overflow:auto')} className="hidescroll">
        <div>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Inbox</div>
          <div style={css('font-size:12.5px;color:rgba(235,235,245,.5);margin-top:5px;line-height:1.5')}>{ib.setupNote}</div>
        </div>
        {ib.sections.map((sec) => (
          <div key={sec.title}>
            <div style={css(LBL + ';padding:0 4px')}>{sec.title}</div>
            <div style={css('margin-top:8px;display:flex;flex-direction:column;gap:6px')}>
              {sec.items.map((m, i) => (
                <div key={i} onClick={m.open} style={css(m.style)}>
                  <div style={css(m.dot)} />
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css('display:flex;justify-content:space-between')}><div style={css('font-size:13.5px;font-weight:500')}>{m.who}</div><div style={css('font-size:11px;color:rgba(235,235,245,.35)')}>{m.time}</div></div>
                    <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{m.preview}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {ib.none ? <Empty>No messages yet.<br />Customers write from the app or by text; replies land on their phone.</Empty> : null}
      </div>
      <div style={css('flex:1;min-width:0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;overflow:hidden')}>
        {t ? (
          <>
            <div style={css('padding:18px 22px;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:14px')}>
              <div style={css('width:38px;height:38px;border-radius:19px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:12px')}>{t.initials}</div>
              <div style={css('flex:1;min-width:0')}>
                <div style={css('font-size:15px;font-weight:500')}>{t.who}</div>
                <div style={css('font-size:12px;color:rgba(235,235,245,.5);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{t.context}{t.inApp ? ' · in the app' : t.phone ? ' · by text' : ''}{t.optOut ? ' · opted out of texts' : ''}</div>
              </div>
              <div style={css('font-size:12px;font-weight:500;white-space:nowrap;color:' + t.stateColor)}>{t.state}</div>
            </div>
            <div style={css('flex:1;overflow-y:auto;padding:18px 22px;display:flex;flex-direction:column;gap:8px')} className="hidescroll">
              {t.msgs.map((m, i) => (
                <div key={i} style={css(m.wrap)}>
                  <div style={css(m.bubble)}>{m.text}</div>
                  <div style={css(m.timeStyle)}>{m.time}{m.sms ? ' · ' + m.status : ''}{m.manual && m.send ? <span onClick={m.send} style={css('color:#fff;cursor:pointer;margin-left:8px;text-decoration:underline')}>Send from this phone</span> : null}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div style={css('padding:14px 18px 18px;display:flex;flex-direction:column;gap:8px;border-top:1px solid rgba(235,235,245,.07)')}>
              <div style={css('display:flex;gap:8px')}>
                <input value={ib.reply} onChange={ib.onReply} onKeyDown={(e) => { if (e.key === 'Enter') ib.sendAuto(); }} placeholder={t.placeholder} style={css('flex:1;background:#0b0b0c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);border:none;border-radius:10px;padding:12px 14px;color:#fff;font-size:13px;outline:none;font-family:inherit')} />
                <div onClick={ib.sendAuto} style={css('padding:12px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer')}>Send</div>
              </div>
              <div style={css('display:flex;gap:6px;align-items:center')}>
                {[['auto', t.inApp ? 'App' : 'Text'], ['app', 'In app'], ['text', 'Text']].filter(([k]) => k !== 'auto').map(([k, l]) => <div key={k} onClick={() => ib.setVia(ib.via === k ? 'auto' : k)} style={css(chip(ib.via === k) + ';padding:5px 10px;font-size:11.5px')}>{l}</div>)}
                <div style={css('font-size:11.5px;color:rgba(235,235,245,.4);margin-left:6px')}>{ib.via === 'auto' ? (t.inApp ? 'Goes to the app · they get a push.' : t.phone ? 'Goes by text.' : 'No number on file.') : ib.via === 'app' ? 'Forced to the app.' : 'Forced to text.'}</div>
              </div>
            </div>
          </>
        ) : <Empty>Select a conversation.</Empty>}
      </div>
    </div>
  );
}
