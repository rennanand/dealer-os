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
import { CustomerRoute, TechRoute, ShopRoute, LobbyRoute, DemoRoute } from './routes/Surface.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<CustomerRoute />} />
      <Route path="/tech" element={<TechRoute />} />
      <Route path="/shop" element={<ShopRoute />} />
      <Route path="/lobby" element={<LobbyRoute />} />
      <Route path="/demo" element={<DemoRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>,
);
