import React from 'react';
import { LogicHost } from '../runtime/LogicHost.jsx';
import { AppLogic } from '../state/appLogic.js';
import { DEFAULT_OPTIONS } from '../state/options.js';
import { connectSync, broadcastTransport, supabaseTransport } from '../state/sync.js';
import { supabase, SHOP_ID, AUTH_ON } from '../state/supabase.js';
import { useAuth, signOut, STAFF } from '../state/auth.js';
import { SignIn, Blocked } from './SignIn.jsx';
import { MyLoaners } from './MyLoaners.jsx';
import { CustomerLiveRoute } from './CustomerLive.jsx';
import { ShopLogic } from '../state/shopLogic.js';
import { OfflineBar } from './Offline.jsx';
import { LAUNCH } from '../state/options.js';

const makeTransport = () => (supabase ? supabaseTransport(supabase, SHOP_ID) : broadcastTransport('dealeros-shop'));
import { CustomerApp } from '../surfaces/customer/CustomerApp.jsx';
// Staff surfaces load on demand so the customer app's first paint does not wait for them.
// A page left open across a deploy can ask for a chunk that no longer exists; reload once to pick up the new build.
const lazyOf = (load, name) => React.lazy(() => load().then((m) => ({ default: m[name] })).catch((e) => {
  const key = 'revyn.reloaded.' + name;
  if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); window.location.reload(); return new Promise(() => {}); }
  throw e;
}));
class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist, Helvetica, Arial, sans-serif', padding: 24, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong loading this page.</div>
          <div style={{ fontSize: 13, color: 'rgba(235,235,245,.55)', marginTop: 8, maxWidth: 420 }}>{String(this.state.err && this.state.err.message || this.state.err)}</div>
          <div onClick={() => { sessionStorage.clear(); window.location.reload(); }} style={{ marginTop: 20, display: 'inline-block', padding: '12px 22px', borderRadius: 12, background: '#fff', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reload</div>
        </div>
      </div>
    );
  }
}
const Demo = lazyOf(() => import('../surfaces/Demo.jsx'), 'Demo');
const TechApp = lazyOf(() => import('../surfaces/tech/TechApp.jsx'), 'TechApp');
const ShopApp = lazyOf(() => import('../surfaces/shop/ShopApp.jsx'), 'ShopApp');
const LobbyBoard = lazyOf(() => import('../surfaces/lobby/LobbyBoard.jsx'), 'LobbyBoard');
const LobbyIdle = lazyOf(() => import('../surfaces/lobby/LobbyIdle.jsx'), 'LobbyIdle');
const Lazy = ({ children }) => <Boundary><React.Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#000' }} />}>{children}</React.Suspense></Boundary>;

/** Gate a surface behind sign-in. `roles` lists who may open it; omitted means any member. */
export function Require({ roles, title, children, customerHome }) {
  const auth = useAuth();
  if (!AUTH_ON) return customerHome && LAUNCH ? <CustomerLiveRoute auth={{ session: { user: { id: 'demo' } }, member: { name: 'Rennan' } }} /> : <><OfflineBar />{children}</>; // no accounts yet
  if (auth.loading) return <div style={{ position: 'fixed', inset: 0, background: '#000' }} />;
  if (!auth.session) return <SignIn title={title} />;
  if (!auth.member) return <Blocked message="This account is not part of RyGuys yet." onSignOut={signOut} />;
  if (roles && !roles.includes(auth.member.role)) return <Blocked message="This screen is for RyGuys staff." onSignOut={signOut} />;
  if (customerHome && LAUNCH) return <><OfflineBar /><CustomerLiveRoute auth={auth} /></>; // loaner launch: customers see their rentals, not the demo
  return <><OfflineBar />{children}</>;
}

/** One view-model per open surface, linked to the others through the sync channel. */
/** Review switches in the URL: /?new shows a customer with no vehicle yet, /lobby?closed the after-hours board. */
const reviewState = () => {
  const q = new URLSearchParams(window.location.search);
  const st = {};
  if (q.has('new')) st.noVehicle = true;
  if (q.has('closed')) st.shopClosed = true;
  return st;
};

function AppHost({ options, children }) {
  const sync = React.useRef(null);
  React.useEffect(() => () => sync.current && sync.current.close(), []);
  return (
    <LogicHost
      Logic={AppLogic}
      options={options}
      onReady={(host) => {
        const st = reviewState();
        if (Object.keys(st).length) host.applyRemote(st);
        sync.current = connectSync(() => host.logic.state, (patch) => host.applyRemote(patch), makeTransport());
      }}
      onState={(patch) => sync.current && sync.current.publish(patch)}
    >
      {children}
    </LogicHost>
  );
}

/**
 * Keeps a surface's designed layout below the width it was designed for by scaling it to
 * fit, instead of reflowing it. Above `minFluid` the layout is fluid and untouched.
 */
function useFit(designW, minFluid) {
  const calc = () => {
    const w = window.innerWidth, h = window.innerHeight;
    if (w >= minFluid) return null;
    const scale = w / designW;
    return { scale, width: designW, height: Math.round(h / scale) };
  };
  const [fit, setFit] = React.useState(calc);
  React.useEffect(() => {
    const on = () => setFit(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return fit;
}
function Fitted({ fit, children }) {
  if (!fit) return children;
  return (
    <div className="fit" style={{ width: fit.width, height: fit.height, transform: 'scale(' + fit.scale.toFixed(4) + ')', transformOrigin: 'top left', position: 'absolute', left: 0, top: 0 }}>
      {children}
    </div>
  );
}

function useBodyClass(name) {
  React.useEffect(() => {
    document.body.classList.add(name);
    return () => document.body.classList.remove(name);
  }, [name]);
}

/** The original four-up prototype view, with the device switcher and stage controls. */
export function DemoRoute() {
  useBodyClass('route-demo');
  return <AppHost options={DEFAULT_OPTIONS}>{(vm) => <Lazy><Demo vm={vm} /></Lazy>}</AppHost>;
}

/** Customer app: fills the phone; on a wider screen it stays a phone-width column. */
export function CustomerRoute() {
  return (
    <AppHost options={DEFAULT_OPTIONS}>
      {(vm) => (
        <div className="surface surface-customer">
          <div className="phone">
            <CustomerApp vm={vm} />
          </div>
        </div>
      )}
    </AppHost>
  );
}

/** Technician app: fills the iPad. */
export function TechRoute() {
  const fit = useFit(1060, 1000); // iPad portrait and smaller: scaled landscape layout
  return (
    <AppHost options={{ ...DEFAULT_OPTIONS, defaultDevice: 'pad' }}>
      {(vm) => (
        <div className="surface surface-tech">
          <Fitted fit={fit}>
            <Lazy><TechApp vm={vm} /></Lazy>
          </Fitted>
        </div>
      )}
    </AppHost>
  );
}

/** Shop desktop: fills the browser window. */
const ROLE_LABEL = { owner: 'Owner', advisor: 'Service advisor', tech: 'Technician', customer: 'Customer' };
export function ShopRoute() {
  const fit = useFit(1360, 1200); // small laptops and tablets: scaled desktop layout
  const auth = useAuth();
  const staff = auth.member ? { name: auth.member.name || (auth.session?.user?.email || '').split('@')[0], role: ROLE_LABEL[auth.member.role] || auth.member.role } : undefined;
  return (
    <AppHost options={{ ...DEFAULT_OPTIONS, defaultDevice: 'desk', staff, signOut: auth.session ? signOut : null }}>
      {(vm) => (
        <div className="surface surface-shop">
          <Fitted fit={fit}>
            <Lazy><ShopApp vm={vm} /></Lazy>
          </Fitted>
        </div>
      )}
    </AppHost>
  );
}

/** Lobby TV: the 1360×765 board scaled to fit whatever screen it is on. */
export function LobbyRoute() {
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1360, window.innerHeight / 765));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const scaleStyle = 'transform:scale(' + scale.toFixed(4) + ');transform-origin:top left;border-radius:0;box-shadow:none;';
  if (LAUNCH) {
    // The board on real records: today's bays and loaners, refreshed over realtime.
    return (
      <LogicHost Logic={ShopLogic}>
        {(sv) => {
          const lb = sv.lobby;
          const vm = { lobbyScaleStyle: scaleStyle, lobbyTime: lb.time, lobbyDate: lb.date, lobbyRows: lb.rows, lobbyLiveBay: lb.liveBay, lobbyLiveTitle: lb.liveTitle, lobbyLiveSub: lb.liveSub, lobbyScene: lb.scene, lobbyScenePhase: lb.phase, lobbyFoot: lb.foot };
          return (
            <div className="surface surface-lobby">
              <div style={{ width: 1360 * scale, height: 765 * scale }}><Lazy><LobbyBoard vm={vm} /></Lazy></div>
            </div>
          );
        }}
      </LogicHost>
    );
  }
  return (
    <AppHost options={{ ...DEFAULT_OPTIONS, defaultDevice: 'lobby' }}>
      {(vm) => (
        <div className="surface surface-lobby">
          <div style={{ width: 1360 * scale, height: 765 * scale }}>
            {vm.lobbyIdle ? (
              <Lazy><LobbyIdle vm={{ ...vm, lobbyScaleStyle: 'transform:scale(' + scale.toFixed(4) + ');transform-origin:top left;' }} /></Lazy>
            ) : (
              <Lazy><LobbyBoard vm={{ ...vm, lobbyScaleStyle: scaleStyle }} /></Lazy>
            )}
          </div>
        </div>
      )}
    </AppHost>
  );
}
