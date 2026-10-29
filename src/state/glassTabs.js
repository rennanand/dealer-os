// Bridge to the native tab bar (Liquid Glass on iOS 26). Falls back to the web tab bar elsewhere.
import { registerPlugin } from '@capacitor/core';
import { IS_APP } from './options.js';

const SYMBOLS = { home: 'house', garage: 'car', service: 'wrench.and.screwdriver', shop: 'mappin.and.ellipse', history: 'clock', messages: 'bubble.left', account: 'person.crop.circle' };
let plugin = null, ready = null;

export function nativeTabs() {
  if (!IS_APP || typeof window === 'undefined' || !window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) return null;
  if (!plugin) { try { plugin = registerPlugin('GlassTabs'); } catch (e) { return null; } }
  return plugin;
}
export async function syncNativeTabs(tabs, selectedId, visible, onSelect) {
  const p = nativeTabs(); if (!p) return false;
  try {
    if (!ready) { ready = p.addListener('select', ({ id }) => onSelect && onSelect(id)); await p.available(); }
    await p.setTabs({ tabs: tabs.map((t) => ({ id: t.id, label: t.label, symbol: SYMBOLS[t.id] || 'circle', badge: !!t.badge })), selected: selectedId });
    await p.setVisible({ visible: !!visible });
    return true;
  } catch (e) { return false; }
}
