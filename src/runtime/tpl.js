// Small helpers the surface components render with. They reproduce the behaviour of the
// Claude Design prototype runtime so the port looks and behaves the same.
import React from 'react';

/** Text binding: empty for null/undefined/boolean, otherwise an inline span. */
export function T(v) {
  if (v === undefined || v === null || typeof v === 'boolean') return null;
  if (React.isValidElement(v) || Array.isArray(v)) return v;
  return React.createElement('span', { className: 'sc-interp' }, String(v));
}

/** List binding: anything that is not an array renders as an empty list. */
export const L = (x) => (Array.isArray(x) ? x : []);

/** Input binding: undefined becomes '' (or false for checkboxes) so inputs stay controlled. */
export const val = (x, fallback = '') => (x === undefined ? fallback : x);

const kebabToCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const cache = new Map();

/** 'display:flex;gap:8px' → { display: 'flex', gap: '8px' }. Cached per string. */
export function css(str) {
  if (typeof str !== 'string') return str;
  let o = cache.get(str);
  if (o) return o;
  o = {};
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
  }
  if (cache.size > 20000) cache.clear();
  cache.set(str, o);
  return o;
}
