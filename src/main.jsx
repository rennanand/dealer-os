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

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Require title="Your car, in your pocket."><CustomerRoute /></Require>} />
      <Route path="/tech" element={<Require roles={STAFF} title="Technician sign-in"><TechRoute /></Require>} />
      <Route path="/shop" element={<Require roles={STAFF} title="Shop sign-in"><ShopRoute /></Require>} />
      <Route path="/lobby" element={<Require roles={STAFF} title="Lobby board sign-in" note="Sign in once on the TV; it stays signed in."><LobbyRoute /></Require>} />
      <Route path="/rental/:token" element={<RentalRoute />} />
      <Route path="/demo" element={<DemoRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>,
);
