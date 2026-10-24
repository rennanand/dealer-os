import React from 'react';
import { LogicHost } from '../runtime/LogicHost.jsx';
import { AppLogic } from '../state/appLogic.js';
import { DEFAULT_OPTIONS } from '../state/options.js';
import { connectSync, broadcastTransport, supabaseTransport } from '../state/sync.js';
import { supabase, SHOP_ID } from '../state/supabase.js';
import { useAuth, signOut, STAFF } from '../state/auth.js';
import { SignIn, Blocked } from './SignIn.jsx';

const makeTransport = () => (supabase ? supabaseTransport(supabase, SHOP_ID) : broadcastTransport('dealeros-shop'));
import { Demo } from '../surfaces/Demo.jsx';
import { CustomerApp } from '../surfaces/customer/CustomerApp.jsx';
import { TechApp } from '../surfaces/tech/TechApp.jsx';
import { ShopApp } from '../surfaces/shop/ShopApp.jsx';
import { LobbyBoard } from '../surfaces/lobby/LobbyBoard.jsx';

/** Gate a surface behind sign-in. `roles` lists who may open it; omitted means any member. */
export function Require({ roles, title, children }) {
  const auth = useAuth();
  if (!supabase || import.meta.env.VITE_REQUIRE_SIGNIN !== '1') return children; // sign-in turns on with VITE_REQUIRE_SIGNIN=1 once the access migration is applied
  if (auth.loading) return <div style={{ position: 'fixed', inset: 0, background: '#000' }} />;
  if (!auth.session) return <SignIn title={title} />;
  if (!auth.member) return <Blocked message="This account is not part of RyGuys yet." onSignOut={signOut} />;
  if (roles && !roles.includes(auth.member.role)) return <Blocked message="This screen is for RyGuys staff." onSignOut={signOut} />;
  return children;
}

/** One view-model per open surface, linked to the others through the sync channel. */
function AppHost({ options, children }) {
  const sync = React.useRef(null);
  React.useEffect(() => () => sync.current && sync.current.close(), []);
  return (
    <LogicHost
      Logic={AppLogic}
      options={options}
      onReady={(host) => {
        sync.current = connectSync(() => host.logic.state, (patch) => host.applyRemote(patch), makeTransport());
      }}
      onState={(patch) => sync.current && sync.current.publish(patch)}
    >
      {children}
    </LogicHost>
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
  return <AppHost options={DEFAULT_OPTIONS}>{(vm) => <Demo vm={vm} />}</AppHost>;
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
  return (
    <AppHost options={{ ...DEFAULT_OPTIONS, defaultDevice: 'pad' }}>
      {(vm) => (
        <div className="surface surface-tech">
          <TechApp vm={vm} />
        </div>
      )}
    </AppHost>
  );
}

/** Shop desktop: fills the browser window. */
export function ShopRoute() {
  return (
    <AppHost options={{ ...DEFAULT_OPTIONS, defaultDevice: 'desk' }}>
      {(vm) => (
        <div className="surface surface-shop">
          <ShopApp vm={vm} />
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
  return (
    <AppHost options={{ ...DEFAULT_OPTIONS, defaultDevice: 'lobby' }}>
      {(vm) => (
        <div className="surface surface-lobby">
          <div style={{ width: 1360 * scale, height: 765 * scale }}>
            <LobbyBoard
              vm={{ ...vm, lobbyScaleStyle: 'transform:scale(' + scale.toFixed(4) + ');transform-origin:top left;border-radius:0;box-shadow:none;' }}
            />
          </div>
        </div>
      )}
    </AppHost>
  );
}
