import React from 'react';
import { css } from '../../runtime/tpl.js';
import { supabase, SHOP_ID } from '../../state/supabase.js';

// Who can use the shop desktop, the iPad and the lobby board. The owner adds an email with a role:
// an existing account takes the role now; a new one takes it the moment it is created.
const LBL = 'font-family:var(--data-font,inherit);font-size:10.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,235,245,.4)';
const INPUT = "background:#1c1c1e;border:0;outline:0;border-radius:10px;padding:12px 14px;font-size:13.5px;color:#fff;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif";
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:20px;max-width:720px';
const ROLE = { owner: 'Owner', advisor: 'Service advisor', tech: 'Technician' };
const chip = (on) => 'padding:9px 12px;border-radius:9px;font-size:12.5px;font-weight:500;cursor:pointer;' + (on ? 'background:#fff;color:#000;' : 'background:rgba(255,255,255,.06);color:rgba(235,235,245,.75);');

export function TeamLive({ vm }) {
  const t = vm.team;
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('advisor');
  const [displays, setDisplays] = React.useState([]);
  const [dErr, setDErr] = React.useState('');
  const loadDisplays = React.useCallback(async () => {
    if (!supabase) return;
    const d = await supabase.from('display_tokens').select('*').eq('shop_id', SHOP_ID).order('created_at');
    if (d.error) return setDErr(d.error.message);
    setDisplays(d.data || []);
  }, []);
  React.useEffect(() => { loadDisplays(); }, [loadDisplays]);
  const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const invite = () => { if (!ok) return; t.invite(email, role); setEmail(''); };
  const addDisplay = async () => { if (!supabase) return; const name = window.prompt ? (window.prompt('Name for this screen', 'Lobby TV') || 'Lobby TV') : 'Lobby TV'; const { error } = await supabase.from('display_tokens').insert({ shop_id: SHOP_ID, name }); if (error) return setDErr(error.message); loadDisplays(); };
  const removeDisplay = async (token) => { if (supabase) await supabase.from('display_tokens').delete().eq('token', token); loadDisplays(); };
  return (
    <div style={css('animation:sIn .28s ease')}>
      <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Team</div>
      <div style={css('font-size:13px;color:rgba(235,235,245,.5);margin-top:5px')}>Who can open the desk, the iPad and the lobby board.</div>
      <div style={css(CARD + ';margin-top:22px')}>
        <div style={css(LBL)}>Add someone</div>
        <div style={css('display:flex;gap:8px;margin-top:10px;flex-wrap:wrap')}>
          <input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invite()} style={css(INPUT + ';flex:1;min-width:220px')} />
          {[['advisor', 'Front desk'], ['tech', 'Technician'], ['owner', 'Owner']].map(([r, l]) => <div key={r} onClick={() => setRole(r)} style={css(chip(role === r))}>{l}</div>)}
          <div onClick={invite} style={css('padding:11px 16px;border-radius:10px;font-size:13px;font-weight:600;' + (ok ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);'))}>Add</div>
        </div>
        <div onClick={t.clearNote} style={css('font-size:12px;margin-top:10px;line-height:1.5;color:' + (t.note ? '#30d158' : 'rgba(235,235,245,.45)'))}>{t.note || 'If they already have a Revyn account under that email, the role applies now. Otherwise they open the site, tap Staff sign in, then "First time here? Create your account" with this email, and land with the role you chose.'}</div>
      </div>
      {t.pending.length ? (
        <div style={css(CARD + ';margin-top:14px')}>
          <div style={css(LBL)}>Invited · not signed up yet</div>
          {t.pending.map((i) => (
            <div key={i.email} style={css('display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13.5px')}>
              <div style={css('flex:1')}>{i.email}</div>
              <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{i.role}</div>
              <div onClick={i.cancel} style={css('font-size:12px;color:rgba(235,235,245,.4);cursor:pointer')}>Remove</div>
            </div>
          ))}
        </div>
      ) : null}
      <div style={css(CARD + ';margin-top:14px')}>
        <div style={css(LBL)}>Team</div>
        {t.rows.map((m) => (
          <div key={m.id} style={css('display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13.5px')}>
            <div style={css('width:30px;height:30px;border-radius:15px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:11px')}>{(m.name || m.email || '?').slice(0, 2).toUpperCase()}</div>
            <div style={css('flex:1;min-width:0')}><div style={css('font-weight:500')}>{m.name}{m.me ? <span style={css('font-size:11px;color:rgba(235,235,245,.4);margin-left:8px')}>you</span> : null}</div><div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>{m.email}</div></div>
            {m.me ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.6);padding:8px 10px')}>{ROLE[m.raw]}</div> : (
              <select value={m.raw} onChange={(e) => m.setRole(e.target.value)} style={css(INPUT + ';padding:8px 10px;font-size:12.5px')}>
                {['advisor', 'tech', 'owner'].map((r) => <option key={r} value={r}>{ROLE[r]}</option>)}
              </select>
            )}
            {m.remove ? <div onClick={m.remove} style={css('font-size:12px;color:rgba(235,235,245,.4);cursor:pointer')}>Remove</div> : null}
          </div>
        ))}
        {!t.rows.length ? <div style={css('font-size:12.5px;color:rgba(235,235,245,.45);padding:14px 0')}>Only you so far.</div> : null}
        <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:10px;line-height:1.5')}>Technicians sign in on the iPad with the same email and pick their name once. What advisors and technicians may do is under Settings · Permissions.</div>
      </div>
      <div style={css(CARD + ';margin-top:14px')}>
        <div style={css('display:flex;justify-content:space-between;align-items:center')}>
          <div style={css(LBL)}>Displays · lobby screens</div>
          <div onClick={addDisplay} style={css('font-size:12px;font-weight:500;color:rgba(235,235,245,.7);cursor:pointer')}>+ New display</div>
        </div>
        {displays.map((d) => (
          <div key={d.token} style={css('display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13.5px')}>
            <div style={css('flex:1;min-width:0')}><div style={css('font-weight:500')}>{d.name}</div><div style={css('font-family:var(--data-font,inherit);font-size:12px;color:rgba(235,235,245,.5);word-break:break-all')}>{d.token}</div></div>
            <div onClick={() => navigator.clipboard && navigator.clipboard.writeText(d.token)} style={css('font-size:12px;color:rgba(235,235,245,.6);cursor:pointer')}>Copy</div>
            <div onClick={() => removeDisplay(d.token)} style={css('font-size:12px;color:rgba(235,235,245,.4);cursor:pointer')}>Remove</div>
          </div>
        ))}
        {dErr ? <div style={css('font-size:12.5px;color:#e0312b;margin-top:10px')}>{dErr}</div> : null}
        <div style={css('font-size:12px;color:rgba(235,235,245,.45);margin-top:10px;line-height:1.5')}>Each screen gets its own token, pasted into the Apple TV app once. Remove it to switch that screen off.</div>
      </div>
    </div>
  );
}
