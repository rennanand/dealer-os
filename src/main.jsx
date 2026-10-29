import React from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={LAUNCH && !IS_APP ? <Landing /> : <Require title="Your loaner, in your pocket." customerHome><CustomerRoute /></Require>} />
      <Route path="/app" element={<Require title="Your loaner, in your pocket." customerHome><CustomerRoute /></Require>} />
      <Route path="/app/demo" element={<CustomerRoute />} />
      <Route path="/tech" element={<Require roles={STAFF} title="Welcome back."><TechRoute /></Require>} />
      <Route path="/shop" element={<Require roles={STAFF} title="Welcome back."><ShopRoute /></Require>} />
      <Route path="/lobby" element={<Require roles={STAFF} title="Lobby board." note="Sign in once on the TV; it stays signed in."><LobbyRoute /></Require>} />
      <Route path="/rental/:token" element={<RentalRoute />} />
      <Route path="/reset" element={<ResetRoute />} />
      <Route path="/demo" element={<DemoRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>,
);
