import React from 'react';
import { createRoot } from 'react-dom/client';
import { markBoot } from './state/safeMode.js';
markBoot();
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@fontsource/geist/300.css';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import '@fontsource/geist/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/geist-mono/600.css';
import './styles/global.css';
import './styles/hover.css';
import { CustomerRoute, TechRoute, ShopRoute, LobbyRoute, DemoRoute, Require } from './routes/Surface.jsx';
import { STAFF } from './state/auth.js';
import { RentalRoute } from './routes/Rental.jsx';
import { Landing } from './routes/Landing.jsx';
import { ResetRoute } from './routes/Reset.jsx';
import { LAUNCH, IS_APP } from './state/options.js';

class RootBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist, Helvetica, Arial, sans-serif', padding: 24, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong.</div>
          <div style={{ fontSize: 13, color: 'rgba(235,235,245,.55)', marginTop: 8, maxWidth: 420 }}>{String((this.state.err && this.state.err.message) || this.state.err)}</div>
          <div onClick={() => { try { sessionStorage.clear(); } catch (e) {} window.location.href = '/'; }} style={{ marginTop: 20, display: 'inline-block', padding: '12px 22px', borderRadius: 12, background: '#fff', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reload</div>
        </div>
      </div>
    );
  }
}
createRoot(document.getElementById('root')).render(
  <RootBoundary><BrowserRouter>
    <Routes>
      <Route path="/" element={LAUNCH && !IS_APP ? <Landing /> : <Require title="Your car. Taken care of." customerHome><CustomerRoute /></Require>} />
      <Route path="/app" element={<Require title="Your car. Taken care of." customerHome><CustomerRoute /></Require>} />
      <Route path="/app/demo" element={<CustomerRoute />} />
      <Route path="/tech" element={<Require roles={STAFF} title="Welcome back."><TechRoute /></Require>} />
      <Route path="/shop" element={<Require roles={STAFF} title="Welcome back."><ShopRoute /></Require>} />
      <Route path="/lobby" element={<Require roles={STAFF} title="Lobby board." note="Sign in once on the TV; it stays signed in."><LobbyRoute /></Require>} />
      <Route path="/rental/:token" element={<RentalRoute />} />
      <Route path="/reset" element={<ResetRoute />} />
      <Route path="/demo" element={<DemoRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter></RootBoundary>,
);
