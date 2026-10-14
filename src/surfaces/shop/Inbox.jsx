import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Inbox({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .28s ease;display:flex;gap:24px;height:100%')}>
        <div style={css('width:340px;flex:0 0 340px;display:flex;flex-direction:column;gap:18px')}>
          <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Inbox</div>
          {L(vm.inboxSections).map((sec, _i) => (
            <React.Fragment key={_i}>
              <div>
                <div
                  style={css(
                    'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4);padding:0 4px',
                  )}
                >
                  {T(sec?.title)}
                </div>
                <div style={css('margin-top:8px;display:flex;flex-direction:column;gap:6px')}>
                  {L(sec?.items).map((m, _i1) => (
                    <React.Fragment key={_i1}>
                      <div onClick={m?.open} style={css(m?.style)}>
                        <div style={css(m?.dot)} />
                        <div style={css('flex:1;min-width:0')}>
                          <div style={css('display:flex;justify-content:space-between')}>
                            <div style={css('font-size:13.5px;font-weight:500')}>{T(m?.who)}</div>
                            <div style={css('font-size:11px;color:rgba(235,235,245,.35)')}>{T(m?.time)}</div>
                          </div>
                          <div
                            style={css(
                              'font-size:12px;color:rgba(235,235,245,.5);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
                            )}
                          >
                            {T(m?.preview)}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div
          style={css(
            'flex:1;min-width:0;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;overflow:hidden',
          )}
        >
          <div style={css('padding:18px 22px;border-bottom:1px solid rgba(235,235,245,.07);display:flex;align-items:center;gap:14px')}>
            <div
              style={css(
                'width:38px;height:38px;border-radius:19px;background:rgba(235,235,245,.1);display:flex;align-items:center;justify-content:center;font-size:12px',
              )}
            >
              {T(vm.dThread?.initials)}
            </div>
            <div style={css('flex:1;min-width:0')}>
              <div style={css('font-size:15px;font-weight:500')}>{T(vm.dThread?.who)}</div>
              <div
                style={css(
                  'font-size:12px;color:rgba(235,235,245,.5);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
                )}
              >
                {T(vm.dThread?.context)}
              </div>
            </div>
            <div style={css(`font-size:12px;font-weight:500;white-space:nowrap;flex:0 0 auto;color:${vm.dThread?.stateColor ?? ''}`)}>
              {T(vm.dThread?.state)}
            </div>
          </div>
          <div style={css('flex:1;overflow-y:auto;padding:18px 22px;display:flex;flex-direction:column;gap:8px')} className="hidescroll">
            {L(vm.dThread?.msgs).map((m, _i) => (
              <React.Fragment key={_i}>
                <div style={css(m?.wrap)}>
                  <div style={css(m?.bubble)}>{T(m?.text)}</div>
                  <div style={css(m?.timeStyle)}>{T(m?.time)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={css('padding:14px 18px 18px;display:flex;gap:8px;border-top:1px solid rgba(235,235,245,.07)')}>
            <input
              value={val(vm.dReply)}
              onChange={vm.onDReply}
              onKeyDown={vm.onDReplyKey}
              placeholder={vm.dThread?.placeholder}
              style={css(
                'flex:1;background:#0b0b0c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);border:none;border-radius:10px;padding:12px 14px;color:#fff;font-size:13px;outline:none;font-family:inherit',
              )}
            />
            <div
              onClick={vm.sendDReply}
              style={css('padding:12px 18px;border-radius:10px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer')}
            >
              Send
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
