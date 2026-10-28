// Loaner agreement clauses. The same text renders on the shop desktop preview and on the
// customer's phone. Draft template: have it reviewed before customers sign real agreements.
export const CLAUSES = [
  { id: 'driver', t: 'Driver eligibility', text: () => 'Only the Driver named above may operate the vehicle. The Driver must hold a valid driver’s license, be at least 21 years old, and present the license at handoff.' },
  { id: 'insurance', t: 'Insurance', text: () => 'The Driver’s personal auto insurance is primary for any loss or liability arising from use of the vehicle. RyGuys’ coverage applies only after the Driver’s policy limits are exhausted.' },
  { id: 'mileage', t: 'Mileage', text: (r) => r.mile_cap === 'Unlimited' ? 'There is no mileage limit during the rental period.' : r.mile_cap + ' is included. Additional miles are billed at $0.35 per mile at return.' },
  { id: 'charge', t: 'Fuel and charging', text: (r) => (r.ev ? 'The vehicle is delivered at 80% charge or higher. ' : 'The vehicle is delivered with the fuel level recorded at handoff. ') + (r.charge_min === 'No minimum' ? 'There is no minimum level at return.' : 'Return it with at least ' + r.charge_min + (r.ev ? ' charge' : ' fuel') + ', or a $25 refill fee applies.') + (r.ev ? ' Supercharging during the rental is billed to RyGuys.' : '') },
  { id: 'use', t: 'Permitted use', text: () => 'The vehicle may be driven on public roads within Utah for personal use. No smoking, towing, off-road driving, ride-share or delivery use, or pets without a carrier.' },
  { id: 'damage', t: 'Damage and loss', text: (r) => 'The Driver is responsible for damage, loss, or theft during the rental, up to ' + r.deductible + ' per incident, except normal wear and mechanical failure not caused by the Driver. Condition is documented with photos at handoff and return.' },
  { id: 'tolls', t: 'Tolls, tickets and fees', text: () => 'Parking tickets, traffic citations, tolls, and impound fees incurred during the rental are the Driver’s responsibility and may be charged to the card on file.' },
  { id: 'late', t: 'Return and late return', text: () => 'The vehicle is due back when the Driver’s own vehicle is released or at the end of the rental period, whichever is later. Each additional day is billed at the daily rate. RyGuys covers extra days caused by delays on its side.' },
];
export const CLAUSE_OPTS = { mileage: ['Unlimited', '100 mi/day', '150 mi/day'], charge: ['No minimum', '50%', '80%'], damage: ['$500', '$1,000', '$2,500'] };
export const CLAUSE_KEY = { mileage: 'mile_cap', charge: 'charge_min', damage: 'deductible' };

export const SHOP = { name: 'RyGuys Tire & Auto Sales', address: '145 S Main St, Manti UT' };

export const fmt0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
export const vehicleName = (v) => (v ? v.year + ' ' + v.make + ' ' + v.model : 'No vehicle yet');
export const dayLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
export const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000));
export const clausesFor = (r) => CLAUSES.filter((c) => (r.clauses || {})[c.id] !== false).map((c, i) => ({ id: c.id, title: i + 1 + '. ' + c.t, text: c.text({ ...r, ev: r.vehicle && r.vehicle.powertrain === 'ev' }) }));
export const previewMeta = (r) => {
  const v = r.vehicle;
  return 'Between ' + SHOP.name + ', ' + SHOP.address + ' (“RyGuys”) and ' + (r.customer_name || 'the customer') + ' (“Driver”). ' + (v ? vehicleName(v) + ', ' + v.color + ', VIN ending ' + v.vin_last4 + '. ' : '') + dayLabel(r.start_date) + ' to ' + dayLabel(r.end_date) + '. ' + (r.shop_pays ? 'No charge to the Driver.' : fmt0(r.rate_cents / 100) + ' per day, charged at return.');
};
