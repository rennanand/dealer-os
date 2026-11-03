// Turns a customer export (Tekmetric, Shop-Ware, Mitchell, or any spreadsheet) into rows for
// `import_customers`. Columns are matched by name, loosely; one customer row may carry one vehicle,
// and repeated customers (same phone) are merged with all their vehicles.

const ALIASES = {
  first: ['first name', 'firstname', 'first', 'customer first name'],
  last: ['last name', 'lastname', 'last', 'customer last name'],
  name: ['name', 'customer', 'customer name', 'full name', 'contact'],
  phone: ['phone', 'mobile', 'cell', 'mobile phone', 'cell phone', 'phone number', 'primary phone', 'customer phone', 'phone 1', 'home phone'],
  email: ['email', 'e-mail', 'email address', 'customer email'],
  city: ['city', 'customer city'],
  external_id: ['customer id', 'id', 'customer #', 'cust id', 'customer number', 'account'],
  last_visit: ['last visit', 'last visit date', 'last service date', 'last ro date', 'last in', 'last seen'],
  year: ['year', 'vehicle year', 'yr', 'model year'],
  make: ['make', 'vehicle make'],
  model: ['model', 'vehicle model'],
  plate: ['plate', 'license', 'license plate', 'lic plate', 'tag', 'plate number', 'license #'],
  vin: ['vin', 'vin #', 'vin number'],
  odometer: ['odometer', 'mileage', 'miles', 'last mileage', 'last odometer', 'odometer in', 'current mileage'],
  color: ['color', 'colour', 'vehicle color'],
  last_service: ['last service', 'last job', 'last work', 'services', 'last ro', 'description'],
};

/** Split a CSV (handles quotes, commas inside quotes, CRLF). Returns array of arrays. */
export function parseCsv(text) {
  const rows = []; let row = [], field = '', q = false;
  const t = text.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

const norm = (h) => String(h || '').toLowerCase().replace(/[_\-.]/g, ' ').replace(/\s+/g, ' ').trim();

/** Which column index holds each field. */
export function mapColumns(headers) {
  const hs = headers.map(norm), map = {};
  for (const key of Object.keys(ALIASES)) {
    let idx = -1;
    for (const a of ALIASES[key]) { idx = hs.indexOf(a); if (idx >= 0) break; }
    if (idx < 0) idx = hs.findIndex((h) => ALIASES[key].some((a) => h.includes(a) && (key !== 'name' || !h.includes('first') && !h.includes('last'))));
    if (idx >= 0 && !Object.values(map).includes(idx)) map[key] = idx;
  }
  return map;
}

const digits = (s) => String(s || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
const toDate = (s) => { const d = new Date(String(s || '').trim()); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };

/** Rows for the RPC, merged by phone (or by name when there is no phone). */
export function buildImport(csvText) {
  const rows = parseCsv(csvText); if (rows.length < 2) return { customers: [], map: {}, headers: [] };
  const headers = rows[0], map = mapColumns(headers), get = (r, k) => (map[k] === undefined ? '' : String(r[map[k]] || '').trim());
  const byKey = new Map();
  for (const r of rows.slice(1)) {
    const name = get(r, 'name') || [get(r, 'first'), get(r, 'last')].filter(Boolean).join(' ');
    const phone = digits(get(r, 'phone'));
    if (!name && !phone) continue;
    const key = phone || ('n:' + name.toLowerCase());
    let c = byKey.get(key);
    if (!c) { c = { name, phone, email: get(r, 'email'), city: get(r, 'city'), external_id: get(r, 'external_id'), last_visit: toDate(get(r, 'last_visit')), vehicles: [] }; byKey.set(key, c); }
    else { if (!c.email) c.email = get(r, 'email'); if (!c.last_visit) c.last_visit = toDate(get(r, 'last_visit')); }
    const v = { year: get(r, 'year').replace(/\D/g, '').slice(0, 4), make: get(r, 'make'), model: get(r, 'model'), plate: get(r, 'plate').toUpperCase(), vin: get(r, 'vin').toUpperCase(), odometer: digits(get(r, 'odometer')), color: get(r, 'color'), last_visit: toDate(get(r, 'last_visit')), last_service: get(r, 'last_service').slice(0, 120) };
    if (v.make || v.model || v.vin) {
      const dup = c.vehicles.find((x) => (v.vin && x.vin === v.vin) || (v.plate && x.plate === v.plate) || (x.make.toLowerCase() === v.make.toLowerCase() && x.model.toLowerCase() === v.model.toLowerCase() && x.year === v.year));
      if (!dup) c.vehicles.push(v); else { if (!dup.odometer || Number(v.odometer) > Number(dup.odometer)) dup.odometer = v.odometer || dup.odometer; if (!dup.last_visit || v.last_visit > dup.last_visit) { dup.last_visit = v.last_visit; if (v.last_service) dup.last_service = v.last_service; } }
    }
  }
  return { customers: [...byKey.values()], map, headers };
}

// ---- repair-order history (Tekmetric "Repair Orders" export, or any invoice list) ----
const HIST = {
  external_id: ['ro #', 'ro number', 'ro', 'repair order', 'repair order #', 'invoice #', 'invoice number', 'invoice', 'ro id', 'order #', 'ticket', 'ticket #'],
  date: ['date', 'closed', 'closed date', 'completed', 'completed date', 'invoice date', 'ro date', 'posted', 'posted date', 'created', 'created date', 'service date'],
  total: ['total', 'invoice total', 'grand total', 'amount', 'ro total', 'total amount', 'total sales', 'sale'],
  job: ['jobs', 'job', 'services', 'service', 'description', 'work performed', 'title', 'concern', 'ro title', 'work'],
  declined: ['declined', 'declined jobs', 'declined work', 'declined services', 'recommendations', 'recommended'],
  odometer: ['mileage', 'odometer', 'miles', 'mileage in', 'odometer in', 'mileage out'],
  name: ['customer', 'customer name', 'name', 'full name'],
  first: ['first name', 'customer first name', 'first'],
  last: ['last name', 'customer last name', 'last'],
  phone: ['phone', 'mobile', 'cell', 'customer phone', 'mobile phone', 'phone number'],
  year: ['year', 'vehicle year', 'model year'],
  make: ['make', 'vehicle make'],
  model: ['model', 'vehicle model'],
  vehicle: ['vehicle', 'vehicle name', 'year make model', 'car'],
  plate: ['plate', 'license', 'license plate', 'tag'],
  vin: ['vin', 'vin #'],
  notes: ['notes', 'note', 'comments', 'internal notes'],
};
/** Does this CSV look like repair orders rather than a customer list? Needs a date and a total (or an RO number). */
export function looksLikeHistory(headers) {
  const hs = headers.map(norm);
  const has = (key) => HIST[key].some((a) => hs.includes(a));
  return has('date') && (has('total') || has('external_id'));
}
function mapHistory(headers) {
  const hs = headers.map(norm), map = {};
  for (const key of Object.keys(HIST)) {
    let idx = -1;
    for (const a of HIST[key]) { idx = hs.indexOf(a); if (idx >= 0) break; }
    if (idx < 0) idx = hs.findIndex((h) => HIST[key].some((a) => h.includes(a)) && !Object.values(map).includes(hs.indexOf(h)));
    if (idx >= 0 && !Object.values(map).includes(idx)) map[key] = idx;
  }
  return map;
}
/** Rows for `import_history`: one per repair order, with declined work split on ; or | or newline ("Cabin filter $65"). */
export function buildHistoryImport(csvText) {
  const rows = parseCsv(csvText); if (rows.length < 2) return { visits: [], map: {}, headers: [] };
  const headers = rows[0], map = mapHistory(headers), get = (r, k) => (map[k] === undefined ? '' : String(r[map[k]] || '').trim());
  const visits = [];
  for (const r of rows.slice(1)) {
    const date = toDate(get(r, 'date')); if (!date) continue;
    const name = get(r, 'name') || [get(r, 'first'), get(r, 'last')].filter(Boolean).join(' ');
    let year = get(r, 'year').replace(/\D/g, '').slice(0, 4), make = get(r, 'make'), model = get(r, 'model');
    if (!make && get(r, 'vehicle')) { const parts = get(r, 'vehicle').split(/\s+/); if (/^\d{4}$/.test(parts[0])) { year = parts.shift(); } make = parts.shift() || ''; model = parts.join(' '); }
    const declined = get(r, 'declined').split(/[;|\n]+/).map((s) => s.trim()).filter(Boolean).map((s) => { const m = s.match(/^(.*?)\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\s*$/); return m && /\d/.test(m[2]) && m[1].trim() ? { name: m[1].trim().replace(/[-–:]\s*$/, ''), price: m[2].replace(/,/g, '') } : { name: s, price: '' }; });
    visits.push({ external_id: get(r, 'external_id'), date, name, phone: digits(get(r, 'phone')), year, make, model, plate: get(r, 'plate').toUpperCase(), vin: get(r, 'vin').toUpperCase(), odometer: digits(get(r, 'odometer')), job: get(r, 'job').slice(0, 200), total: get(r, 'total').replace(/[^0-9.\-]/g, ''), notes: get(r, 'notes').slice(0, 500), declined });
  }
  return { visits, map, headers };
}
