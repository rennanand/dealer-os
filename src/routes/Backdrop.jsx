import React from 'react';
import { css } from '../runtime/tpl.js';

// Full-bleed photo behind the front door and sign-in. The content sits on a gradient at the
// bottom so the car stays the picture and the words stay readable in any light.
export function Backdrop({ children, mark = true }) {
  return (
    <div style={css("position:fixed;inset:0;background:#000;color:#fff;overflow:hidden;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif")}>
      <img src="/uploads/signin.jpg" alt="" style={css('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:62% 60%')} />
      <div style={css('position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,.05) 35%,rgba(0,0,0,.72) 68%,rgba(0,0,0,.94) 100%)')} />
      {mark ? (
        <img src="/uploads/revyn.png" alt="Revyn" style={css('position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 30%);transform:translate(-50%,-50%);height:30px;width:auto;max-width:72%;filter:drop-shadow(0 4px 24px rgba(0,0,0,.6))')} />
      ) : null}
      <div style={css('position:relative;height:100%;display:flex;justify-content:center')}>{children}</div>
    </div>
  );
}
