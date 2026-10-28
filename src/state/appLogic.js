// The app's view-model, ported as-is from the Claude Design prototype.
// Everything a screen shows comes out of renderVals(); the sample data at the top is what the
// backend will replace, one constant at a time.
import React from 'react';
import { DCLogic } from '../runtime/logic.js';
import { LAUNCH } from './options.js';

const ACC = '#e0312b', GRN = '#30d158', YEL = '#ffd60a', RED = '#e0312b';
const pill = c => 'display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border:1px solid ' + c + ';border-radius:4px;font-family:var(--data-font,inherit);font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;line-height:1.3;text-align:center;color:' + c;
const I = { tire: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 3v3M12 18v3M3 12h3M18 12h3', brake: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM17.5 7.5l-2 2M6.5 16.5l2-2', battery: 'M3 8h15a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM22 11v2M6 11v2M9 11v2', drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z', filter: 'M4 6h16M4 12h16M4 18h16M8 4v4M14 10v4M10 16v4', align: 'M12 3v18M3 12h18M12 7l-3 3M12 7l3 3M7 12l3-3M7 12l3 3M17 12l-3-3M17 12l-3 3', users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z', chart: 'M18 20V10M12 20V4M6 20v-6', sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6', checkc: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3', credit: 'M1 4h22v16H1zM1 10h22', folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z', eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', light: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z', steer: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3.3 10.5l6.7 1.5M20.7 10.5L14 12M12 14v7', spring: 'M12 2v3M12 19v3M7 5h10l-10 3.5h10L7 12h10l-10 3.5h10', home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z', car: 'M3 13l2.2-5.5A1 1 0 0 1 6.1 7h11.8a1 1 0 0 1 .9.6L21 13M3 13h18v4H3zM6 17v2M18 17v2M7 14.5h.01M17 14.5h.01', wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', tag: 'M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2zM7 7h.01', clock: 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', plus: 'M12 5v14M5 12h14', activity: 'M22 12h-4l-3 9L9 3l-3 9H2', grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', chevR: 'M9 6l6 6-6 6', chevL: 'M15 6l-6 6 6 6', check: 'M5 12.5l4.5 4.5L19 7', x: 'M6 6l12 12M18 6L6 18', up: 'M12 19V5M5 12l7-7 7 7', swap: 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4', dollar: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z', shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7l8.7 5 8.7-5M12 22V12', key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15 7m0 0l3 3m-3-3l2-2 3 3', phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2z' };
const CARD = 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06)';
const DIM = 'rgba(235,235,245,.5)', DIM3 = 'rgba(235,235,245,.3)';
const PH = 'background:radial-gradient(ellipse at 50% 62%,#2b2b30 0%,#151517 58%,#0b0b0c 100%);display:flex;align-items:center;justify-content:center;color:rgba(235,235,245,.3);font-size:11px;letter-spacing:.04em;text-align:center;padding:12px;';
const fmt = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = n => '$' + n.toLocaleString('en-US');
const dotOf = c => 'width:8px;height:8px;border-radius:4px;background:' + c;

const STAGES = [
  { name: 'Appointment booked', t: 'Tomorrow · 9:30 AM', d: 'Brake inspection at RyGuys, Manti.' },
  { name: 'Vehicle checked in', t: '9:02 AM', d: 'Your vehicle has arrived at the shop.' },
  { name: 'Inspection started', t: '9:14 AM', d: 'A technician is looking over your vehicle.' },
  { name: 'Inspection complete', t: '9:37 AM', d: 'Your technician found 3 items to review.' },
  { name: 'Estimate ready', t: '9:41 AM', d: 'Your service advisor prepared an estimate.' },
  { name: 'Approval received', t: '9:49 AM', d: 'You approved $489.32.' },
  { name: 'Repair started', t: '10:05 AM', d: 'Front brake pads and rotors are being replaced.' },
  { name: 'Quality check', t: '2:31 PM', d: 'A second technician is verifying the work.' },
  { name: 'Service complete', t: '2:48 PM', d: 'Your vehicle is ready.' },
  { name: 'Payment received', t: '2:52 PM', d: 'Receipt saved to your vehicle history.' },
  { name: 'Picked up', t: '3:20 PM', d: 'Thanks, Rennan. See you at the next rotation.' }
];
const NOTIF = ['Your appointment is booked for tomorrow at 9:30 AM.', 'Your vehicle has been checked in.', 'Your inspection has started.', 'Your inspection is complete.', 'Your estimate is ready to review.', 'Your repair was approved. Parts have arrived.', 'Your vehicle is being serviced.', 'Quality check in progress.', 'Your vehicle is ready for pickup.', 'Payment received. You\u2019re all set.', 'Thanks for visiting RyGuys.'];
const BAY1 = ['Arriving 9:30', 'Checked in', 'Inspection in progress', 'Inspection complete', 'Waiting for approval', 'Approved · parts available', 'Repair in progress', 'Quality check', 'Ready for pickup', 'Paid · awaiting pickup', 'Picked up'];

const FINDINGS = [
  { id: 'brakes', tier: 'Recommended now', color: RED, name: 'Front brake pads + rotors', price: 489.32, meas: '3 mm', measLabel: 'Pad thickness',
    plain: 'Your front brake pads are wearing down and the rotors are worn. We recommend replacing both now.',
    tech: 'Your front brake pads are below our recommended service threshold and the rotors show significant wear.',
    urgency: 'Safe to drive today. Schedule within a few weeks.', wait: 'Pads wear into the rotors and the repair roughly doubles in cost.', photos: 2 },
  { id: 'rotation', tier: 'Recommended soon', color: YEL, name: 'Tire rotation', price: 0, meas: '4/32"', measLabel: 'Tread depth',
    plain: 'Your tires are wearing evenly but are due to be rotated.', tech: 'Front right at 4/32". Even wear pattern, approaching replacement range.',
    urgency: 'Within about 1,200 miles.', wait: 'Uneven wear shortens tire life.', photos: 1 },
  { id: 'filter', tier: 'Monitor', color: GRN, name: 'Cabin air filter', price: 65, meas: 'Dirty', measLabel: 'Condition',
    plain: 'The cabin filter is getting dirty. It affects the air you breathe, not safety.', tech: 'Visible debris, moderate discoloration.',
    urgency: 'No rush. Next visit is fine.', wait: 'Reduced airflow and a musty smell from the vents.', photos: 1 }
];
const PHOTOS = [
  { cat: 'Front brakes', meas: '3mm', rec: 'Recommended replacement', color: RED, note: 'Pad material is below our service threshold. Rotor shows scoring across the face.', shot: 'Technician photo — front left brake' },
  { cat: 'Front right tire', meas: '4/32" tread', rec: 'Monitor', color: YEL, note: 'Tire is wearing evenly but is approaching replacement range.', shot: 'Technician photo — tread gauge on front right' },
  { cat: 'Cabin air filter', meas: 'Dirty', rec: 'Monitor', color: GRN, note: 'Debris and discoloration. Fine to wait until your next visit.', shot: 'Technician photo — cabin filter' }
];

const INVENTORY = [
  { id: 'my24', name: '2024 Tesla Model Y', trim: 'Long Range AWD', short: 'Model Y', color: 'White', interior: 'Black', miles: 18204, price: 38995, drive: 'AWD', body: 'Electric', vin: '•••••••••••• 4821', fullVin: '7SAYGDEE8RF104821', servicedHere: 18, owners: 2, accidents: 'No reported accidents' },
  { id: 'bronco', name: '2023 Ford Bronco', trim: 'Outer Banks 4-Door', short: 'Bronco', color: 'Area 51', interior: 'Navy Pier', miles: 24891, price: 34500, drive: '4WD', body: 'SUV', vin: '•••••••••••• 7730', fullVin: '1FMEE5DP3PLA17730', servicedHere: 0, owners: 1, accidents: 'No reported accidents' },
  { id: '4runner', name: '2022 Toyota 4Runner', trim: 'TRD Pro', short: '4Runner', color: 'Black', interior: 'Black', miles: 31204, price: 41995, drive: '4WD', body: 'SUV', vin: '•••••••••••• 2219', fullVin: 'JTELU5JR2N6002219', servicedHere: 6, owners: 1, accidents: 'No reported accidents' },
  { id: 'tacoma', name: '2021 Toyota Tacoma', trim: 'TRD Off-Road', short: 'Tacoma', color: 'Cement Gray', interior: 'Black', miles: 52100, price: 37450, drive: '4WD', body: 'Truck', vin: '•••••••••••• 9046', fullVin: '3TMCZ5AN4MM409046', servicedHere: 11, owners: 2, accidents: 'No reported accidents' }
];
const PAINT = { White: '#e9eaeb', 'Area 51': '#5c7f8b', Black: '#17181b', 'Cement Gray': '#8d908f' };
const GALLERY = ['Exterior front', 'Exterior rear', 'Side profile', 'Interior', 'Dashboard', 'Seats', 'Wheels', 'Trunk', 'Condition — small curb mark, rear right wheel'];

const HISTORY = [
  { id: 'h1', date: 'May 12, 2026', title: 'Tire rotation', total: 0, miles: '48,902', tech: 'Marcus T.', pay: 'No charge', lines: [{ k: 'Tire rotation', v: '$0.00' }], parts: [], photos: ['Tread gauge — 6/32"'], recs: ['Front brake pads approaching 5mm — monitor'], notes: 'Rotated front to rear. Tread 6/32" all around, wearing evenly.' },
  { id: 'h2', date: 'January 4, 2026', title: 'Inspection', total: 0, miles: '44,110', tech: 'Marcus T.', pay: 'No charge', lines: [{ k: 'Multi-point inspection', v: '$0.00' }], parts: [], photos: ['Underbody', '12V battery terminals'], recs: ['Cabin air filter — monitor'], notes: 'Pre-winter check. All fluids at level. Wiper blades replaced at no charge.' },
  { id: 'h3', date: 'September 20, 2025', title: 'Cabin filter + 12V battery', total: 184.5, miles: '39,870', tech: 'Dana R.', pay: 'Visa ·· 4417', lines: [{ k: 'Cabin air filter', v: '$65.00' }, { k: '12V battery', v: '$98.00' }, { k: 'Shop supplies', v: '$6.00' }, { k: 'Tax', v: '$15.50' }], parts: ['Cabin air filter', '12V AGM battery'], photos: ['Old filter', 'Battery test printout'], recs: [], notes: 'Low-voltage warning on dash. Battery tested at 9.8V under load, replaced.' }
];
const CURRENT_HIST = { id: 'h0', date: 'October 5, 2026', title: 'Front brake service', total: 545.23, miles: '52,431', tech: 'Marcus T.', pay: 'Apple Pay · 2:52 PM', lines: [{ k: 'Front brake pads + rotors', v: '$489.32' }, { k: 'Shop supplies', v: '$12.00' }, { k: 'Tax', v: '$43.91' }], parts: ['Brake pads (front)', 'Rotors (front, pair)'], photos: ['Front left brake — 3mm', 'Rotor scoring', 'New pads installed'], recs: ['Tire rotation within 1,200 miles', 'Cabin air filter — monitor'], notes: 'Customer reported grinding on braking. Pads at 3mm, rotors scored. Replaced both, bed-in drive complete.' };

const CATS = [
  { n: 'Tires', unit: '/32"', pos: ['Front left', 'Front right', 'Rear left', 'Rear right'], def: { m: 6, cond: 'Good', note: '' } },
  { n: 'Brakes', unit: 'mm', pos: ['Front left', 'Front right', 'Rear left', 'Rear right'], rotor: true, def: { m: 3, cond: 'Replace', rotor: 'Replace', note: 'Pad is below recommended thickness.' } },
  { n: 'Suspension', pos: ['Vehicle'], def: { cond: 'Good', note: '' } },
  { n: 'Steering', pos: ['Vehicle'], def: { cond: 'Good', note: '' } },
  { n: 'Fluids', pos: ['Vehicle'], def: { cond: 'Good', note: '' } },
  { n: 'Battery', pos: ['Vehicle'], def: { cond: 'Good', note: '' } },
  { n: 'Lights', pos: ['Vehicle'], def: { cond: 'Good', note: '' } }
];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LOANER_FLEET = [
  { id: 'm3', car: '2027 Tesla Model 3', short: 'Model 3', color: 'Quicksilver', vin: '1190', miles: '22,870', milesIn: '22,908', paint: '#b9bdc3' },
  { id: 'my', car: '2024 Tesla Model Y', short: 'Model Y', color: 'Pearl White', vin: '4821', miles: '18,204', milesIn: '18,242', paint: '#e9eaeb' },
  { id: 'rav4', car: '2023 Toyota RAV4', short: 'RAV4', color: 'Lunar Rock', vin: '6633', miles: '41,210', milesIn: '41,210', paint: '#7d8a80', out: 'Out · Priya Nair' },
  { id: 'f150', car: '2022 Ford F-150', short: 'F-150', color: 'Oxford White', vin: '0287', miles: '58,440', milesIn: '58,440', paint: '#e4e4e2', out: 'In for service' }
];
const CLAUSES = [
  { id: 'driver', t: 'Driver eligibility', text: 'Only the Driver named above may operate the vehicle. The Driver must hold a valid driver\u2019s license, be at least 21 years old, and present the license at handoff.' },
  { id: 'insurance', t: 'Insurance', text: 'The Driver\u2019s personal auto insurance is primary for any loss or liability arising from use of the vehicle. RyGuys\u2019 coverage applies only after the Driver\u2019s policy limits are exhausted.' },
  { id: 'mileage', t: 'Mileage', text: cap => cap === 'Unlimited' ? 'There is no mileage limit during the rental period.' : cap + ' is included. Additional miles are billed at $0.35 per mile at return.' },
  { id: 'charge', t: 'Charging', text: min => 'The vehicle is delivered at 80% charge or higher. ' + (min === 'No minimum' ? 'There is no minimum charge level at return.' : 'Return it with at least ' + min + ' charge, or a $25 recharge fee applies.') + ' Supercharging during the rental is billed to RyGuys.' },
  { id: 'use', t: 'Permitted use', text: 'The vehicle may be driven on public roads within Utah for personal use. No smoking, towing, off-road driving, ride-share or delivery use, or pets without a carrier.' },
  { id: 'damage', t: 'Damage and loss', text: ded => 'The Driver is responsible for damage, loss, or theft during the rental, up to ' + ded + ' per incident, except normal wear and mechanical failure not caused by the Driver. Condition is documented with photos at handoff and return.' },
  { id: 'tolls', t: 'Tolls, tickets and fees', text: 'Parking tickets, traffic citations, tolls, and impound fees incurred during the rental are the Driver\u2019s responsibility and may be charged to the card on file.' },
  { id: 'late', t: 'Return and late return', text: 'The vehicle is due back when the Driver\u2019s own vehicle is released or at the end of the rental period, whichever is later. Each additional day is billed at the daily rate. RyGuys covers extra days caused by delays on its side.' }
];
const CLAUSE_OPTS = { mileage: ['Unlimited', '100 mi/day', '150 mi/day'], charge: ['No minimum', '50%', '80%'], damage: ['$500', '$1,000', '$2,500'] };
const CLAUSE_KEY = { mileage: 'mileCap', charge: 'chargeMin', damage: 'deductible' };
const TIERS = [
  { id: 'essential', name: 'Essential', m: 19, y: 199, perks: ['Two tire rotations a year', 'Annual multi-point inspection', '10% off labor', 'Priority loaner booking'] },
  { id: 'plus', name: 'Plus', m: 39, y: 399, perks: ['Everything in Essential', 'Cabin filter and wiper blades yearly', 'Brake fluid every two years', 'Three loaner days a year', 'Pickup and delivery within 15 miles'] }
];
const REDEEMS = [{ id: 'ten', v: '$10 off', cost: 1000 }, { id: 'rot', v: 'Free rotation', cost: 800 }, { id: 'wash', v: 'Hand wash', cost: 400 }, { id: 'tf', v: '$25 off', cost: 2500 }];
const STAR_LABELS = ['Tap a star', 'Not great', 'Could be better', 'Good', 'Great', 'Outstanding'];
const GUIDE = [
  { id: 'key', k: 'Unlock and start', view: 'side', t: 'Your phone is the key.', d: 'Walk up with your phone and the doors unlock. There is no start button: sit down, press the brake, and the car is on. A backup key card is in the center console. Tap it on the door pillar if your phone dies.' },
  { id: 'drive', k: 'Drive', view: 'quarter', t: 'Shift on the screen.', d: 'Hold the brake, then swipe up on the left edge of the touchscreen for Drive, or down for Reverse. When you stop and open the door, it shifts into Park on its own.' },
  { id: 'regen', k: 'One-pedal driving', view: 'front', t: 'Lift off, and it slows.', d: 'Easing off the accelerator slows the car all the way to a stop, so you will rarely touch the brake. It feels strong for the first mile. Leave a little extra room until it clicks.' },
  { id: 'controls', k: 'Signals and wipers', view: 'quarter', t: 'Buttons, not stalks.', d: 'Turn signals are the two buttons on the left side of the wheel. Wipers and headlights are automatic. For a single wipe, press the left scroll wheel.' },
  { id: 'charge', k: 'Charging', view: 'rear', t: 'Return it at 50% or more.', d: 'The charge port is on the rear driver side. Press the small door to open it. Supercharging is billed to RyGuys, so there is nothing to pay at the stall. It leaves us at 88%.' },
  { id: 'return', k: 'Returning', view: 'top', t: 'Bring it back when Quicksilver is ready.', d: 'Pull into Bay 4, take four quick photos in the app, and leave the key card on the seat. We check mileage and charge and close out the rental from there.' }
];
const SUPPLIERS = [
  { id: 'wp', name: 'WorldPac SLC', eta: 'Today · 1:30 PM courier', price: '$212 + $40 courier', delay: null },
  { id: 'tesla', name: 'Tesla Parts', eta: 'Tomorrow · 8:00 AM', price: '$248', delay: { arrive: 'tomorrow 8 AM', est: 'Tomorrow · 11:00 AM', estShort: 'tomorrow 11 AM', supplier: 'Tesla Parts', extraDays: 1 } },
  { id: 'napa', name: 'NAPA Manti', eta: 'Thursday · 9:00 AM', price: '$189', delay: { arrive: 'Thursday 9 AM', est: 'Thursday · 12:00 PM', estShort: 'Thursday noon', supplier: 'NAPA Manti', extraDays: 3 } }
];
const SCHED0 = () => [
  { id: 'dale', who: 'Dale Christensen', car: 'Ford F-150', job: 'Plugs + coils', bay: 4, start: 8, dur: 3, status: 'Complete', c: GRN },
  { id: 'priya', who: 'Priya Nair', car: 'Subaru Outback', job: 'CVT cooler', bay: 5, start: 9, dur: 4, status: 'Waiting parts · Thu', c: YEL },
  { id: 'rennan', who: 'Rennan Anderson', car: 'Tesla Model Y', job: 'Brake inspection + service', bay: 1, start: 9.5, dur: 6 },
  { id: 'sarah', who: 'Sarah Mitchell', car: 'Toyota 4Runner', job: 'Tire replacement', bay: 2, start: 10.5, dur: 2.5, status: 'Waiting approval', c: YEL },
  { id: 'tom', who: 'Tom Hadley', car: 'Toyota 4Runner', job: 'Pre-purchase inspection', bay: 3, start: 12, dur: 1, status: 'Booked', c: 'rgba(235,235,245,.6)' },
  { id: 'james', who: 'James Lee', car: 'Honda CR-V', job: 'Inspection', bay: 3, start: 15, dur: 1.5, status: 'Arriving', c: 'rgba(235,235,245,.6)' },
  { id: 'tacoma', who: 'Rennan Anderson', car: 'Toyota Tacoma', job: 'Oil change', bay: 4, start: 13.5, dur: 0.75 }
];
const BAY_TECH = ['', 'Marcus T.', 'Dana R.', 'Marcus T.', 'Dana R.', 'Luis A.'];
const TIRES = {
  rennan: { who: 'Rennan Anderson', car: '2022 Tesla Model Y', size: '255/45R19', placard: 42, tread: 'Tread 4/32" front right, measured Oct 5 by Marcus T.', opts: [
    { id: 'good', tier: 'Good', name: 'General Altimax RT45', each: 168, warranty: '65,000 mi', stock: 'In stock · 8', note: 'Quiet all-season. Pair it with your stored winter set.' },
    { id: 'better', tier: 'Better', name: 'Michelin CrossClimate2', each: 231, warranty: '60,000 mi', stock: 'In stock · 4', note: 'Severe-snow rated. You could skip the seasonal swap.' },
    { id: 'best', tier: 'Best', name: 'Pirelli P Zero AS Plus Elect', each: 289, warranty: '50,000 mi', stock: 'Tire Rack · Thursday', note: 'OE-spec for Model Y. Quietest, best range.' } ] },
  sarah: { who: 'Sarah Mitchell', car: '2021 Toyota 4Runner', size: '265/70R17', placard: 32, tread: 'Tread 3/32" all four, measured today by Dana R.', opts: [
    { id: 'good', tier: 'Good', name: 'Falken Wildpeak A/T4W', each: 214, warranty: '65,000 mi', stock: 'In stock · 12', note: 'All-terrain, severe-snow rated.' },
    { id: 'better', tier: 'Better', name: 'Michelin Defender LTX M/S2', each: 274, warranty: '70,000 mi', stock: 'In stock · 4', note: 'Quietest highway ride, longest warranty.' },
    { id: 'best', tier: 'Best', name: 'BFGoodrich KO3', each: 312, warranty: '50,000 mi', stock: 'ATD · Wednesday', note: 'Off-road durability. Louder on pavement.' } ] }
};
const TIRE_FEES = 25 + 8 + 4;
const STORAGE = [
  { who: 'Rennan Anderson', set: '4× Michelin X-Ice Snow · 255/45R19', rack: 'B-14', since: 'Apr 14, 2026', tread: '8/32"', mine: true },
  { who: 'Dale Christensen', set: '4× Bridgestone Blizzak DM-V2 · 275/55R20', rack: 'B-02', since: 'Apr 3, 2026', tread: '9/32"', swap: 'Booked · Oct 10' },
  { who: 'Priya Nair', set: '4× Continental TrueContact · 225/65R17 · summer', rack: 'A-07', since: 'Oct 2, 2026', tread: '7/32"', swap: 'Stored for winter' },
  { who: 'Tom Hadley', set: '4× Nokian Hakkapeliitta R5 · 265/70R17', rack: 'B-09', since: 'Apr 20, 2026', tread: '10/32"', swap: 'Not booked' }
];
const TIRE_STOCK = [['255/45R19', 12, 'Model Y, Model 3'], ['265/70R17', 16, '4Runner, Tacoma'], ['225/65R17', 20, 'RAV4, CR-V, Outback'], ['275/55R20', 6, 'F-150, Silverado'], ['235/55R19', 3, 'Bronco Sport, Escape']];
const QC_ITEMS = [
  { id: 'torque', name: 'Wheel torque', spec: 'All 20 lug nuts, star pattern, calibrated wrench', value: '129', unit: 'lb-ft' },
  { id: 'caliper', name: 'Caliper bolts', spec: 'Bracket and guide pins to spec, threadlocker', value: '63', unit: 'lb-ft' },
  { id: 'pedal', name: 'Pedal feel', spec: 'Firm at rest, no sink over 30 s, no ABS fault', value: 'Firm', unit: '' },
  { id: 'bedin', name: 'Bed-in', spec: '10 moderate stops 60 → 10 mph, cool-down lap', value: '10', unit: 'stops' },
  { id: 'road', name: 'Road test', spec: 'Hwy 89 loop · no pull, no noise, regen blend normal', value: '3.4', unit: 'mi' },
  { id: 'batt', name: '12V battery', spec: 'Load test after the road test, lights on 30 s', value: '12.4', unit: 'V' },
  { id: 'fluid', name: 'Fluid and leaks', spec: 'Reservoir between marks, lines dry after road test', value: 'Dry', unit: '' }
];
const EST_LINES = [
  { id: 'brakes', parts: 249.32, hrs: 2, optional: false },
  { id: 'rotation', parts: 0, hrs: 0.5, optional: false, comp: true },
  { id: 'filter', parts: 29, hrs: 0.3, optional: true }
];
const REV31 = [1480, 1720, 0, 2210, 1960, 1540, 1880, 2040, 1210, 0, 2460, 1790, 1630, 2120, 1870, 940, 0, 2580, 1960, 1740, 2310, 1420, 1180, 0, 2690, 1850, 1920, 2240, 1610, 1330, 1310];
const RENTAL0 = () => ({ veh: 'm3', start: 5, end: 6, pay: 'customer', sent: false, sentAt: '', signed: false, signedAt: '', outAt: '', clauses: { driver: true, insurance: true, mileage: true, charge: true, use: true, damage: true, tolls: true, late: true }, mileCap: '100 mi/day', chargeMin: '50%', deductible: '$1,000' });
const BACK = { tires: 'home', storage: 'garage', odometer: 'home', valet: 'home', healthDetail: 'health', rate: 'home', care: 'home', rewards: 'home', loanerAgree: 'loaner', loanerGuide: 'service', health: 'garage', service: 'home', findings: 'service', photos: 'findings', approve: 'findings', messages: 'service', pay: 'service', pickup: 'service', checkin: 'home', loaner: 'checkin', loanerCheckout: 'loaner', loanerReturn: 'service', history: 'home', histDetail: 'history', vehicle: 'shop', reserve: 'vehicle', reservation: 'garage', testdrive: 'vehicle', ask: 'vehicle', trade: 'vehicle', updates: 'home', account: 'home', book: 'home', docs: 'account', notifs: 'account' };

// Luce-style tick scale: hairline ticks with taller majors; the filled span takes the status color.
const ruler = (pct, c, h) => ({
  base: 'position:relative;height:' + (h || 10) + 'px;background-image:repeating-linear-gradient(90deg,rgba(235,235,245,.16) 0 1px,transparent 1px 5px),repeating-linear-gradient(90deg,rgba(235,235,245,.3) 0 1px,transparent 1px 25px);background-size:100% 55%,100% 100%;background-position:left bottom,left bottom;background-repeat:no-repeat',
  fill: 'position:absolute;left:0;top:0;bottom:0;width:' + Math.max(0, Math.min(100, pct)) + '%;background-image:repeating-linear-gradient(90deg,' + c + ' 0 1px,transparent 1px 5px),repeating-linear-gradient(90deg,' + c + ' 0 1px,transparent 1px 25px);background-size:100% 55%,100% 100%;background-position:left bottom,left bottom;background-repeat:no-repeat;transition:width .6s cubic-bezier(.3,.9,.3,1)'
});
const pillL = c => pill(c).replace('font-size:10px', 'font-size:12px').replace('padding:4px 8px', 'padding:6px 10px');
const smoothPath = pts => pts.map((p, i) => { if (!i) return 'M' + p[0] + ' ' + p[1]; const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || p; const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6], c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6]; return 'C' + [c1, c2, p].map(q => q.map(n => n.toFixed(1)).join(' ')).join(' '); }).join(' ');
const LOAD = [1, 3, 4, 5, 5, 5, 5, 5, 4, 3, 1];
const I_FU = 'M3 12a9 9 0 1 0 2.6-6.4L3 8M3 3v5h5';
const I_FLEET = 'M1 4h14v12H1zM15 9h4l4 4v3h-8zM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z';
const FOLLOWUPS = [
  { id: 'ren-filter', cust: 'Rennan Anderson', car: '2022 Tesla Model Y', item: 'Cabin air filter', price: 65, declined: 'Today · 9:49 AM', age: 'today', wo: 'WO-8842', reason: 'Left unchecked in the service plan', tier: 'Monitor', color: GRN, live: true },
  { id: 'priya-fluid', cust: 'Priya Nair', car: '2019 Subaru Outback', item: 'Brake fluid exchange', price: 119, declined: 'Mar 3 · in app', age: '31 wk', wo: 'WO-8130', reason: '“Next time, budget this month”', tier: 'Recommended now', color: RED },
  { id: 'sarah-align', cust: 'Sarah Mitchell', car: '2021 Toyota 4Runner', item: 'Four-wheel alignment', price: 129, declined: 'Jun 14 · in app', age: '16 wk', wo: 'WO-8611', reason: '“Just had one at the dealer”', tier: 'Recommended soon', color: YEL },
  { id: 'dale-shocks', cust: 'Dale Christensen', car: '2018 Ford F-150', item: 'Rear shocks', price: 412, declined: 'Aug 22 · by phone', age: '6 wk', wo: 'WO-8502', reason: 'Wanted to wait until fall', tier: 'Recommended soon', color: YEL },
  { id: 'james-wipers', cust: 'James Lee', car: '2020 Honda CR-V', item: 'Wiper blades', price: 38, declined: 'Apr 9 · in app', age: '26 wk', wo: 'WO-8244', reason: 'No reason given', tier: 'Monitor', color: GRN }
];
const FLEETS = [
  { id: 'manti', code: 'FLT-104', name: 'Manti City Public Works', first: 'Gary', contact: 'Gary Olsen · Fleet lead · (435) 835-0190', terms: ['Net 30', 'PO required'], po: 'PO 2026-118', mtd: 1840, units: [
    { k: 'm14', unit: '14', veh: '2019 Ford F-250', plate: 'EX 4471', odo: '88,210 mi', odoAt: 'Sep 28', due: 'Oil + rotation', dueIn: 'Due now', pct: 100, c: RED, book: true },
    { k: 'm22', unit: '22', veh: '2017 Ford F-150', plate: 'EX 3390', odo: '132,400 mi', odoAt: 'Aug 30', due: 'Transmission service', dueIn: '~400 mi', pct: 92, c: YEL, book: true },
    { k: 'm09', unit: '09', veh: '2016 Ford F-350 plow', plate: 'EX 2207', odo: '96,050 mi', odoAt: 'Apr 2', due: 'Pre-season plow check', dueIn: 'Before Nov 1', pct: 70, c: YEL, book: true },
    { k: 'm07', unit: '07', veh: '2021 Chevrolet Silverado 2500', plate: 'EX 5102', odo: '41,880 mi', odoAt: 'Sep 12', due: 'Brake inspection', dueIn: '~1,200 mi', pct: 78, c: YEL },
    { k: 'm31', unit: '31', veh: '2023 Ford Transit', plate: 'EX 6618', odo: '19,730 mi', odoAt: 'Sep 30', due: 'Tire rotation', dueIn: '~3,100 mi', pct: 38, c: GRN } ] },
  { id: 'skyline', code: 'FLT-112', name: 'Skyline Plumbing & Heating', first: 'Trish', contact: 'Trish Bailey · Owner · (435) 835-2211', terms: ['Net 15', 'Card on file'], mtd: 612, units: [
    { k: 's3', unit: 'V3', veh: '2018 Chevrolet Express', plate: 'C21 8KF', odo: '104,200 mi', odoAt: 'Aug 14', due: 'Front brakes', dueIn: 'In shop Thu', pct: 96, c: RED, state: 'Booked · Thu · Bay 05' },
    { k: 's2', unit: 'V2', veh: '2020 Ford Transit Connect', plate: 'C21 8KE', odo: '67,300 mi', odoAt: 'Oct 1', due: 'Rear tires', dueIn: '4/32" measured', pct: 88, c: YEL, book: true },
    { k: 's1', unit: 'V1', veh: '2022 Ram ProMaster', plate: 'C21 8KD', odo: '38,900 mi', odoAt: 'Sep 19', due: 'Oil + filter', dueIn: '~1,100 mi', pct: 80, c: YEL } ] },
  { id: 'svh', code: 'FLT-120', name: 'Sanpete Valley Hospital', first: 'Dana', contact: 'Dana Whitlock · Transport · (435) 835-3300', terms: ['Net 30'], mtd: 2210, units: [
    { k: 'h1', unit: 'S-1', veh: '2023 Ford Transit 350 shuttle', plate: 'EX 9020', odo: '44,700 mi', odoAt: 'Oct 3', due: 'Winter tire set', dueIn: 'Oct – Nov', pct: 84, c: YEL, book: true },
    { k: 'h2', unit: 'S-2', veh: '2023 Ford Transit 350 shuttle', plate: 'EX 9021', odo: '41,200 mi', odoAt: 'Oct 3', due: 'Winter tire set', dueIn: 'Oct – Nov', pct: 84, c: YEL, book: true } ] },
  { id: 'snow', code: 'FLT-131', name: 'Snow College Grounds', first: 'Hector', contact: 'Hector Ruiz · Facilities · (435) 283-7040', terms: ['Net 30', 'PO required'], po: 'PO SC-4471', mtd: 0, units: [
    { k: 'c1', unit: 'G-2', veh: '2021 Toyota Tacoma', plate: 'EX 7781', odo: '29,400 mi', odoAt: 'Jul 22', due: 'Oil + rotation', dueIn: '~600 mi', pct: 86, c: YEL, book: true },
    { k: 'c2', unit: 'G-5', veh: '2019 Ford F-150', plate: 'EX 7784', odo: '58,100 mi', odoAt: 'Jul 22', due: 'Brake inspection', dueIn: '~2,900 mi', pct: 42, c: GRN } ] }
];
const OIL_HIST = o => ({ id: 'h-oil', date: 'October 5, 2026', title: 'Oil change · Dusty', total: 89.95, miles: '61,840', tech: 'Marcus T.', pay: 'Due at pickup', lines: [{ k: 'Full synthetic oil change', v: '$89.95' }], parts: ['Toyota ' + o.filter + ' oil filter', o.qts.toFixed(1) + ' qt ' + o.type.toLowerCase() + ' ' + o.visc, 'Drain plug crush washer'], photos: ['Drain plug torqued · ' + o.torque + ' lb-ft'], recs: ['Engine air filter at the next change', 'Next oil change at 66,840 mi or April 2027'], notes: 'Drained, new filter, filled to spec. Mileage 61,840 as entered by the customer; maintenance light reset.' });
const OIL0 = () => ({ step: 0, visc: '0W-20', qts: 6.2, filter: '90915-YZZD3', torque: 30, type: 'Full synthetic', reorder: false });
const OIL_STATUS = ['Arriving 1:30 PM', 'Draining old oil', 'Installing filter', 'Filling', 'Oil change complete'];
const OIL_TIMES = ['1:34 PM', '1:41 PM', '1:47 PM', '1:52 PM'];
const TANKS = [['0W-20', 'Toyota, Honda, Subaru', 62, 55], ['5W-30', 'GM, older Ford', 28, 55], ['5W-20', 'Ford, Chrysler', 74, 55], ['15W-40', 'Diesel · F-250, F-350', 41, 30]];
const OIL_FILTERS = [['90915-YZZD3', 'Toyota 4-cyl, V6', 14], ['PH7317', 'Honda, Nissan', 9], ['FL-500S', 'Ford 2.7 / 3.5', 11], ['PF48E', 'GM V8', 5]];
// Sample recall result for the prototype. Production queries the NHTSA recalls API by VIN.
const RECALLS = { rennan: [{ id: '24V-000', t: 'Rearview camera image may be delayed on startup', d: 'A software condition can delay the backup camera image for several seconds after shifting into reverse. Remedy is an over-the-air software update. No parts, no charge.', m: 'Sample result · remedy available · about 20 minutes in the bay' }] };

export class AppLogic extends DCLogic {
  state = {
    device: this.props.defaultDevice || 'phone', stage: typeof this.props.startStage === 'number' ? this.props.startStage : 6, toast: '',
    view: 'home', vIdx: 0, exp: 'brakes', photoIdx: 0, inclMonitor: false, approveAnim: false,
    thread: [], draft: '', salesThread: [], askDraft: '',
    payMethod: 'apple', payErr: '', payAnim: false, cardTried: false, histPaid: false,
    pickup: 0,
    book: { step: 0, need: '', desc: '', day: 'Tomorrow', time: '', visit: '', err: '' }, booked: null,
    checkin: { step: 0, visit: '' },
    loaner: 'none', loanerStep: 0, returnStep: 0, guideStep: 0, sig: [], sigDraw: false, sigW: 0, rental: RENTAL0(), cardIdx: 0, ringsIn: false,
    histId: null,
    filter: 'All', selId: 'my24', resStep: 0, resPay: 'apple', reserved: false, resStatus: 1, vinShown: false,
    td: { day: 'Saturday', time: '11:30 AM', driver: 'Rennan Anderson', done: false },
    trade: { cond: 'Good', miles: '52,431', photos: 0, result: false },
    readStage: -1,
    tView: 'today', cat: null, pos: 0, form: null, saved: {}, inspDone: {}, marks: [], tool: 'circle', photoMode: 'photo', photoAdded: false,
    dView: LAUNCH === 'loaners' ? 'loaners' : 'overview', dSel: 'rennan', dReply: '', addOpen: false, salesTab: 'Inventory', estOpen: false,
    partsEta: null, orderOpen: false, partsOrdered: null, sched: SCHED0(), drag: null, schedMsg: '',
    valet: null, qc: {}, est: null, estNotes: null, repRange: '31 days', odo: null, odoDraft: '', tq: null, swap: false,
    noVehicle: false, shopClosed: false, walkins: [], ci: null,
    fu: {}, fuTab: 'Open', fleetSel: 'manti', fleetBooked: {}, fleetStmt: {}, recall: null, recallAdded: false, oil: OIL0(), oilPaid: false, odoTac: null, payFor: null
  };

  wrapRef = React.createRef();
  heroInnerRef = React.createRef();
  scrollRef = React.createRef();
  // The car is anchored to the page: it slides with the content scroller instead of floating over it.
  onContentScroll = e => { const el = this.heroInnerRef.current; if (el) el.style.transform = 'translateY(' + (-e.currentTarget.scrollTop) + 'px)'; };
  componentDidUpdate() {
    this.applyType();
    if (this._lastView !== this.state.view) {
      this._lastView = this.state.view;
      if (this.scrollRef.current) this.scrollRef.current.scrollTop = 0;
      if (this.heroInnerRef.current) this.heroInnerRef.current.style.transform = 'translateY(0px)';
      this.armRings();
    }
  }
  // Rings mount empty and fill ~80ms later so the stroke transition plays every time Service opens.
  armRings() {
    clearTimeout(this._rt);
    if (this.state.view === 'service') { this.setState({ ringsIn: false, cardIdx: 0 }); this._rt = setTimeout(() => this.setState({ ringsIn: true }), 80); }
    else if (this.state.ringsIn) this.setState({ ringsIn: false });
  }
  typeCode(code) { clearTimeout(this._ct); this.setState({ onboard: Object.assign({}, this.state.onboard, { code: code.slice(0, 3) }) }); this._ct = setTimeout(() => this.setState({ onboard: Object.assign({}, this.state.onboard, { code }) }), 160); }
  finishOnboard(name) { this.setState({ view: 'home', onboard: null, noVehicle: !name }); if (name) this.notify(name + ' added to your garage. Welcome, Rennan.'); }
  valetGo(step) {
    clearTimeout(this._vt);
    const v = Object.assign({}, this.state.valet || { keys: 'Hand to driver', shots: 0 }, { step });
    this.setState({ valet: v });
    if (step === 1) { this.notify('Luis is on his way. About 12 minutes.'); this._vt = setTimeout(() => { if ((this.state.valet || {}).step === 1) this.valetGo(2); }, 3200); }
    if (step === 2) this.notify('Luis has arrived at 145 Oak Ridge Dr.');
  }
  cardsRef = React.createRef();
  scrollCards = dir => { const el = this.cardsRef.current; if (!el) return; const n = this.state.cardIdx + dir; el.scrollTo({ left: Math.max(0, n) * 310, behavior: 'smooth' }); };
  applyType() {
    const rs = document.documentElement.style, ui = this.props.typeface || 'Geist', df = this.props.dataFont || 'Geist Mono';
    rs.setProperty('--ui-font', "'" + ui + "'");
    rs.setProperty('--data-font', df === 'Same as UI' ? 'inherit' : "'" + df + "'");
    rs.setProperty('--icon-w', String(typeof this.props.iconWeight === 'number' ? this.props.iconWeight : 1.6) + 'px');
  }
  componentDidMount() {
    this.applyType();
    this._lastView = this.state.view;
    this.armRings();
    // Width is read from the viewport (never from content height) and quantized, so scrollbar toggling can't feed back into a re-render loop.
    const measure = () => {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        const w = Math.round((document.documentElement.clientWidth - 48) / 40) * 40;
        if (Math.abs(w - (this.state.wrapW || 0)) >= 40) this.setState({ wrapW: w });
      });
    };
    const w0 = Math.round((document.documentElement.clientWidth - 48) / 40) * 40;
    if (Math.abs(w0 - (this.state.wrapW || 0)) >= 40) this.setState({ wrapW: w0 }); // first measure synchronously so background tabs scale correctly
    window.addEventListener('resize', measure);
    this._measure = measure;
  }
  componentWillUnmount() { if (this._measure) window.removeEventListener('resize', this._measure); if (this._raf) cancelAnimationFrame(this._raf); clearTimeout(this._tt); clearTimeout(this._payT); clearTimeout(this._rt); clearTimeout(this._vt); clearTimeout(this._rcT); }
  frameFit(w, h) {
    const avail = this.state.wrapW || w;
    const sc = Math.min(1, avail / w);
    return { wrap: 'display:flex;justify-content:center;width:100%;height:' + Math.round(h * sc) + 'px;overflow:visible', scale: 'transform:scale(' + sc.toFixed(4) + ');' };
  }

  go = v => () => this.setState(v === 'pay' ? { view: v, payFor: null } : { view: v });
  tgo = v => () => this.setState({ tView: v });
  dgo = v => () => this.setState({ dView: v });

  setStage = n => {
    n = Math.max(0, Math.min(10, n));
    clearTimeout(this._tt);
    this.setState({ stage: n, toast: NOTIF[n] });
    this._tt = setTimeout(() => this.setState({ toast: '' }), 3400);
  };
  resetDemo = () => this.setState({ stage: 0, toast: '', view: 'home', tView: 'today', thread: [], pickup: 0, payErr: '', payAnim: false, cardTried: false, loaner: 'none', loanerStep: 0, returnStep: 0, guideStep: 0, sig: [], rental: RENTAL0(), checkin: { step: 0, visit: '' }, saved: {}, inspDone: {}, marks: [], photoAdded: false, approveAnim: false, inclMonitor: false, readStage: -1, partsDelayed: false, needInfo: false, job: 'rennan', rating: null, rewards: null, care: null, onboard: null, partsEta: null, orderOpen: false, partsOrdered: null, sched: SCHED0(), drag: null, schedMsg: '', valet: null, qc: {}, est: null, estNotes: null, tq: null, swap: false, fu: {}, fleetBooked: {}, fleetStmt: {}, recall: null, recallAdded: false, oil: OIL0(), oilPaid: false, odoTac: null, payFor: null });

  onHeroScroll = e => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (i !== this.state.vIdx) this.setState({ vIdx: i });
  };

  sendMsg = (text, reply) => {
    text = (text || '').trim();
    if (!text) return;
    const now = () => { const d = new Date(); let h = d.getHours(), m = d.getMinutes(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap; };
    this.setState({ thread: this.state.thread.concat({ from: 'customer', text, time: now(), pending: !reply }), draft: '', needInfo: false });
    if (reply) setTimeout(() => this.setState({ thread: this.state.thread.concat({ from: 'advisor', text: reply, time: now() }) }), 1400);
  };
  sendAsk = (text, reply) => {
    text = (text || '').trim();
    if (!text) return;
    const sel = INVENTORY.find(v => v.id === this.state.selId) || INVENTORY[0];
    this.setState({ salesThread: this.state.salesThread.concat({ from: 'customer', text, time: 'Now', vehicle: sel.name, pending: !reply }), askDraft: '' });
    if (reply) setTimeout(() => this.setState({ salesThread: this.state.salesThread.concat({ from: 'advisor', text: reply, time: 'Now' }) }), 1400);
  };
  advisorReply = text => {
    text = (text || '').trim();
    if (!text) return;
    this.setState({ thread: this.state.thread.map(m => Object.assign({}, m, { pending: false })).concat({ from: 'advisor', text, time: 'Just now' }), dReply: '' });
  };

  togglePartsDelay = () => { this.setParts(this.state.partsDelayed ? SUPPLIERS[0] : Object.assign({}, SUPPLIERS[1], { delay: Object.assign({}, SUPPLIERS[1].delay, { supplier: 'WorldPac SLC' }) }), this.state.partsDelayed); };
  // One source of truth for the parts ETA: the technician's supplier choice ripples into the customer's rings, timeline, loaner dates and the shop's parts page.
  setParts = (sup, received) => {
    clearTimeout(this._tt);
    if (received || !sup.delay) this.setState({ partsDelayed: false, partsEta: null, orderOpen: false, partsOrdered: received ? 'received' : sup.id, toast: received ? 'Rotors received. Repair is back on schedule.' : 'Rotors on the courier from ' + sup.name + '. Repair stays on schedule.' });
    else this.setState({ partsDelayed: true, partsEta: sup.delay, orderOpen: false, partsOrdered: sup.id, toast: 'Rotors ordered from ' + sup.name + '. They arrive ' + sup.delay.arrive + ' \u2014 your estimate moved to ' + sup.delay.estShort + '.' });
    this._tt = setTimeout(() => this.setState({ toast: '' }), 3400);
  };
  notify(msg) { clearTimeout(this._tt); this.setState({ toast: msg }); this._tt = setTimeout(() => this.setState({ toast: '' }), 3400); }
  // Declined-work follow-ups. Rennan's reminder lands on his phone as a message and a push; the others go out by text.
  fuSet(f, stt) {
    this.setState({ fu: Object.assign({}, this.state.fu, { [f.id]: stt }) });
    if (stt === 'reminded' && f.live) {
      this.setState({ thread: this.state.thread.concat({ from: 'advisor', who: 'Tyler · Service advisor', text: 'One thing from today’s inspection: the cabin air filter is still due. It’s $65 and about ten minutes. Add it before pickup, or at your next visit — your call.', time: 'Just now' }) });
      this.notify('Tyler: the cabin air filter on Quicksilver is still due. $65, about ten minutes.');
    }
  }
  checkRecall() { if (this.state.recall === 'checking') return; this.setState({ recall: 'checking' }); clearTimeout(this._rcT); this._rcT = setTimeout(() => this.setState({ recall: 'done' }), 1400); }
  setOil(p) { this.setState({ oil: Object.assign({}, this.state.oil || OIL0(), p) }); }
  oilNext() {
    const o = this.state.oil || OIL0(); if (o.step >= 4) return;
    this.setOil({ step: o.step + 1 });
    const msg = ['', 'Dusty is in Bay 04. Marcus pulled the drain plug and the old oil is out.', 'New filter is on Dusty. Drain plug torqued to ' + o.torque + ' lb-ft.', 'Filling Dusty with ' + o.qts.toFixed(1) + ' qt of ' + o.visc + '.', 'Dusty is ready. Oil change recorded on WO-8851.'][o.step + 1];
    if (msg) this.notify(msg);
  }
  sigPt(e) { const el = e.currentTarget, b = el.getBoundingClientRect(), k = el.offsetWidth / (b.width || 1); return [Math.round((e.clientX - b.left) * k * 10) / 10, Math.round((e.clientY - b.top) * k * 10) / 10]; }
  pickDay = d => {
    const rn = this.state.rental;
    const next = rn.start !== rn.end || d < rn.start ? { start: d, end: d } : { start: rn.start, end: d };
    this.setState({ rental: Object.assign({}, rn, next) });
  };
  sendRental = () => {
    const rn = this.state.rental, lv = LOANER_FLEET.find(f => f.id === rn.veh) || LOANER_FLEET[0];
    this.setState({ rental: Object.assign({}, rn, { sent: true, sentAt: '9:06 AM' }), thread: this.state.thread.concat({ from: 'advisor', who: 'Tyler · Service advisor', text: 'Your loaner agreement for the ' + lv.car + ' is ready. Review and sign it under Service \u2192 Loaner and the keys will be waiting at check-in.', time: 'Just now' }) });
    this.notify('Your loaner agreement is ready to review and sign.');
  };
  askCustomer = text => {
    clearTimeout(this._tt);
    this.setState({ needInfo: true, thread: this.state.thread.concat({ from: 'advisor', who: 'Marcus T. · Technician', text, time: 'Just now' }), toast: 'Your technician has a question about Quicksilver.' });
    this._tt = setTimeout(() => this.setState({ toast: '' }), 3400);
  };
  dSend = id => {
    const text = (this.state.dReply || '').trim();
    if (!text) return;
    if (id === 'rennan') return this.advisorReply(text);
    if (id === 'sales') return this.setState({ salesThread: this.state.salesThread.map(m => Object.assign({}, m, { pending: false })).concat({ from: 'advisor', text, time: 'Now' }), dReply: '' });
    this.setState({ dReply: '' });
  };

  autoCond(cat, m, cur) {
    if (cat.n === 'Brakes') return m <= 3 ? 'Replace' : m <= 5 ? 'Monitor' : 'Good';
    if (cat.n === 'Tires') return m <= 3 ? 'Replace' : m <= 5 ? 'Monitor' : 'Good';
    return cur;
  }

  chip(active) {
    return 'flex:0 0 auto;padding:9px 14px;border-radius:10px;cursor:pointer;font-size:12px;font-weight:500;transition:all .18s ease;' + (active ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.7);');
  }

  renderVals() {
    const s = this.state, st = s.stage, view = s.view;
    const inShop = st >= 1 && st <= 8;
    const pct = Math.round((st / 8) * 100);
    const sel = INVENTORY.find(v => v.id === s.selId) || INVENTORY[0];
    const myPaint = '#b9bdc3';
    const rn = s.rental, RATE = typeof this.props.loanerRate === 'number' ? this.props.loanerRate : 65;
    const care = s.care || null, carePlus = !!(care && care.tier === 'plus'), shopPays = rn.pay === 'shop' || carePlus;
    const careTier = care ? TIERS.find(t => t.id === care.tier) : null;
    const rt = s.rating || { stars: 0, tags: [], tip: 0, note: '', sent: false };
    const RW = s.rewards || { redeemed: {}, shared: 0 };
    const pointsEarned = 1240 + (s.histPaid ? 545 : 0) + (rt.sent ? 100 : 0) + (st >= 5 ? 200 : 0);
    const points = pointsEarned - REDEEMS.filter(r => RW.redeemed[r.id]).reduce((a, r) => a + r.cost, 0);
    const rewardsTier = points >= 2000 ? 'Gold' : 'Silver';
    const lv = LOANER_FLEET.find(f => f.id === rn.veh) || LOANER_FLEET[0];
    const PETA = s.partsEta || { arrive: 'tomorrow 8 AM', est: 'Tomorrow · 11:00 AM', estShort: 'tomorrow 11 AM', supplier: 'WorldPac SLC', extraDays: 1 };
    const sched = s.sched || SCHED0(), rBay = (sched.find(x => x.id === 'rennan') || { bay: 1 }).bay;
    const delayDay = s.partsDelayed && st >= 5 && st <= 6;
    const rEnd = delayDay ? rn.end + PETA.extraDays : rn.end;
    const rDays = Math.max(1, rEnd - rn.start), rBill = shopPays ? 0 : Math.max(1, rn.end - rn.start), rTotal = rBill * RATE;
    const dayLabel = d => DOW[(d + 3) % 7] + ', Oct ' + d;
    const chargeMin = rn.clauses.charge ? rn.chargeMin : 'No minimum', mileCap = rn.clauses.mileage ? rn.mileCap : 'Unlimited';
    const clauseOpt = { mileage: rn.mileCap, charge: rn.chargeMin, damage: rn.deductible };
    const clauses = CLAUSES.filter(c => rn.clauses[c.id]).map((c, i) => ({ id: c.id, title: (i + 1) + '. ' + c.t, text: typeof c.text === 'function' ? c.text(clauseOpt[c.id]) : c.text }));
    const sigPath = s.sig.map(k => k.length === 1 ? 'M' + k[0][0] + ' ' + k[0][1] + ' l.6 0' : k.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ')).join(' ');
    const rStatus = s.loaner === 'returned' ? ['Returned', GRN] : s.loaner === 'active' ? ['Out with customer', ACC] : s.loaner === 'reserved' ? ['Signed · awaiting handoff', GRN] : rn.sent ? ['Sent · awaiting signature', YEL] : ['Draft', 'rgba(235,235,245,.6)'];
    const guideCards = GUIDE.map(g => g.id !== 'charge' ? g : Object.assign({}, g, chargeMin === 'No minimum' ? { t: 'Charging is on us.', d: 'The charge port is on the rear driver side. Press the small door to open it. Supercharging is billed to RyGuys, so there is nothing to pay at the stall, and there is no minimum charge at return.' } : { t: 'Return it at ' + chargeMin + ' or more.' }));
    const guide = guideCards[s.guideStep % guideCards.length];
    const odoUser = parseInt(String(s.odo || '').replace(/\D/g, ''), 10) || 0;
    const odoNow = odoUser > 52431 ? odoUser : 52431;
    const odoFmt = odoNow.toLocaleString('en-US');
    const odoSrc = odoUser > 52431 ? 'entered by you' : st >= 1 ? 'recorded at check-in' : 'at your last visit';
    const odoLabel = odoFmt + ' mi · ' + odoSrc;
    const dueMi = (target, interval) => { const left = target - odoNow; return { due: left <= 0 ? 'Due now' : 'in ' + left.toLocaleString('en-US') + ' mi', pct: Math.max(2, Math.min(100, Math.round((1 - left / interval) * 100))) }; };
    const rotDue = dueMi(53631, 6000), fluidDue = dueMi(61031, 24000);
    const tq = s.tq || { veh: 'rennan', tier: 'better', hazard: true, requested: false, sent: false, accepted: false };
    const tqCalc = o => { const tires = o.each * 4, fees = TIRE_FEES * 4, haz = tq.hazard ? Math.round(tires * 0.12) : 0, sub = tires + fees + haz, tax = Math.round(sub * 0.08974 * 100) / 100; return { tires, fees, haz, sub, tax, total: Math.round((sub + tax) * 100) / 100 }; };
    const tqOptR = TIRES.rennan.opts.find(o => o.id === tq.tier) || TIRES.rennan.opts[1], tqCR = tqCalc(tqOptR);
    const inStockR = tqOptR.stock.indexOf('In stock') === 0, swapBooked = !!s.swap;
    const myCars = [{ name: 'Quicksilver', sub: '2022 Tesla Model Y · ' + odoFmt + ' mi', shot: 'Quicksilver — 2022 Tesla Model Y', ph: PH, paint: myPaint }, { name: 'Dusty', sub: '2019 Toyota Tacoma · ' + Math.max(61840, parseInt(String(s.odoTac || '').replace(/\D/g, ''), 10) || 0).toLocaleString('en-US') + ' mi · entered by you', shot: 'Dusty — 2019 Toyota Tacoma', ph: PH, paint: '#8d908f', tac: true }];
    if (s.reserved) myCars.push({ name: 'Reserved', sub: sel.name + ' · ' + sel.trim, shot: sel.name + ' — reserved for you', ph: PH, paint: PAINT[sel.color] || '#e9eaeb' });
    if (s.loaner === 'active') myCars.push({ name: 'Loaner', sub: lv.car + ' · 88% at handoff', shot: 'Loaner ' + lv.short + ' · ' + lv.color, ph: PH, paint: lv.paint });
    const car0 = myCars[Math.min(s.vIdx, myCars.length - 1)];
    // Dusty, Rennan's Tacoma: oil life is estimated from the mileage he entered; the iPad fill record drives the status and the 3D oil scene.
    const isTac = !!car0.tac, oil = s.oil || OIL0(), oilLive = oil.step >= 1, oilDone = oil.step >= 4, oilPaid = !!s.oilPaid;
    const odoTacUser = parseInt(String(s.odoTac || '').replace(/\D/g, ''), 10) || 0, tacOdo = Math.max(61840, odoTacUser), tacOdoFmt = tacOdo.toLocaleString('en-US');
    const oilSince = tacOdo - 57740, oilLifePct = Math.max(0, Math.round((1 - oilSince / 5000) * 100));
    const oilSub = 89.95 + 4, oilTax = Math.round(oilSub * 0.08974 * 100) / 100, oilTotal = Math.round((oilSub + oilTax) * 100) / 100;
    const oilStatus = oil.step === 4 && oilPaid ? 'Paid · awaiting pickup' : OIL_STATUS[oil.step], oilColor = oil.step === 0 ? 'rgba(235,235,245,.5)' : oilDone ? GRN : ACC, oilPhase = ['idle', 'drain', 'filter', 'fill', 'done'][oil.step];
    const oilBooked = s.booked && s.booked.need === 'Oil change';
    const bookOil = () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 3, need: 'Oil change', desc: 'Full synthetic ' + oil.visc + ' · $89.95 · about 35 minutes', err: '' }) });
    const oilSpec = oil.qts.toFixed(1) + ' qt ' + oil.type.toLowerCase() + ' ' + oil.visc;
    const homeTac = oil.step === 0 ? { k: 'Oil life · estimated', c: oilLifePct <= 20 ? YEL : GRN, t: oilLifePct <= 0 ? 'Oil change is overdue.' : 'About ' + oilLifePct + '% oil life left.', sub: oilSince.toLocaleString('en-US') + ' mi since your last change on Apr 12, based on the mileage you entered. We can’t read it from the truck.', cta: oilBooked ? 'Booked · ' + s.booked.day + ' ' + s.booked.time : 'Book oil change · $89.95', go: oilBooked ? 'service' : 'bookOil' }
      : oil.step === 1 ? { k: 'Bay 04 · in progress', c: ACC, t: 'Old oil is draining.', sub: 'Marcus pulled the drain plug at 1:34 PM. About 20 minutes to go.', cta: 'Message Marcus', go: 'messages' }
      : oil.step === 2 ? { k: 'Bay 04 · in progress', c: ACC, t: 'New filter going on.', sub: 'Toyota ' + oil.filter + ' · drain plug torqued to ' + oil.torque + ' lb-ft with a new washer.', cta: 'Message Marcus', go: 'messages' }
      : oil.step === 3 ? { k: 'Bay 04 · in progress', c: ACC, t: 'Filling ' + oil.qts.toFixed(1) + ' qt of ' + oil.visc + '.', sub: oil.type + ', from our bulk tank. Almost done.', cta: 'Message Marcus', go: 'messages' }
      : oilPaid ? { k: 'Paid · ready for pickup', c: GRN, t: 'Dusty is out front.', sub: fmt(oilTotal) + ' paid. ' + oilSpec + ' · new filter. Next change at ' + (tacOdo + 5000).toLocaleString('en-US') + ' mi or April 2027.', cta: 'View record', go: 'history' }
      : { k: 'Oil change complete', c: GRN, t: 'Dusty is ready.', sub: oilSpec + ' · new filter · plug torqued ' + oil.torque + ' lb-ft. ' + fmt(oilTotal) + ' due; pay here and skip the counter.', cta: 'Pay ' + fmt(oilTotal), go: 'payOil' };
    const nextDueTac = [{ name: 'Oil change', due: oilDone ? 'Done today · ' + tacOdoFmt + ' mi' : oilBooked ? 'Booked · ' + s.booked.day : oilLifePct <= 0 ? 'Overdue' : 'Due now · ' + oilLifePct + '% est.', pct: oilDone ? 2 : 100, booked: oilDone || !!oilBooked, go: oilDone ? this.go('history') : bookOil }, { name: 'Tire rotation', due: 'With oil change', pct: 88, go: bookOil }, { name: 'Engine air filter', due: 'About ' + Math.max(200, 63840 - tacOdo).toLocaleString('en-US') + ' mi', pct: Math.min(100, Math.round((tacOdo - 53840) / 10000 * 100)), go: bookOil }, { name: 'Coolant', due: 'About ' + Math.max(200, 70840 - tacOdo).toLocaleString('en-US') + ' mi', pct: Math.min(100, Math.round((tacOdo - 40840) / 30000 * 100)), go: bookOil }];
    const brakePhase = st <= 4 ? 'worn' : st === 5 ? 'remove' : st === 6 ? 'install' : 'new', tirePhase = st <= 5 ? 'on' : st === 6 ? 'off' : 'new';
    const tankPct = t => t[2] - (t[0] === '0W-20' && oil.step >= 3 ? 3 : 0);

    const homeQS = s.needInfo && st >= 1 && st <= 7 ? { k: 'Question from your technician', c: YEL, t: 'Marcus needs a quick answer.', sub: 'Reply in Service to keep things moving.', cta: 'Reply', go: 'messages' }
      : tq.sent && !tq.accepted ? { k: 'Tire quote ready', c: YEL, t: 'Three options for Quicksilver.', sub: 'From Tyler · 255/45R19 · ' + tqOptR.tier + ' recommended at ' + fmt0(Math.round(tqCR.total)) + ' installed', cta: 'See quote', go: 'tires' }
      : s.partsDelayed && st >= 5 && st <= 6 ? { k: 'Waiting for parts', c: YEL, t: 'Front brake service', sub: 'Rotors arrive ' + PETA.arrive + ' · New estimate: ' + PETA.estShort, cta: 'View Service', go: 'service' }
      : st === 0 ? { k: 'Upcoming appointment', c: ACC, t: 'Brake inspection', sub: 'Tomorrow · 9:30 AM · ' + (s.checkin.visit || 'Drop off'), cta: s.checkin.step >= 2 ? (s.checkin.visit === 'Pickup & delivery' ? ((s.valet || {}).step >= 1 ? 'Track your driver' : 'Confirm pickup') : 'View appointment') : 'Check in', go: s.checkin.step >= 2 ? (s.checkin.visit === 'Pickup & delivery' ? 'valet' : 'service') : 'checkin' }
      : st === 4 ? { k: 'Estimate ready', c: YEL, t: 'We found 3 things to review.', sub: 'Your approval is needed before repair starts.', cta: 'Review estimate', go: 'findings' }
      : st <= 3 ? { k: 'Service in progress', c: ACC, t: 'Front brake inspection', sub: 'Estimated completion · Today · 3:30 PM', cta: 'View Service', go: 'service' }
      : st <= 7 ? { k: 'Service in progress', c: ACC, t: 'Front brake service', sub: 'Estimated completion · Today · 3:30 PM', cta: 'View Service', go: 'service' }
      : st === 8 ? { k: 'Ready for pickup', c: GRN, t: 'Quicksilver is ready.', sub: 'Bay 4 · $545.23 due', cta: 'Pay $545.23', go: 'pay' }
      : st === 9 ? { k: 'Ready for pickup', c: GRN, t: 'Quicksilver is ready.', sub: 'Paid · Bay 4', cta: 'I\u2019m on my way', go: 'pickup' }
      : st === 10 && !rt.sent ? { k: 'Picked up today', c: GRN, t: 'How did we do?', sub: 'Rate your visit and tip Marcus if he earned it.', cta: 'Rate your visit', go: 'rate' }
      : { k: 'Vehicle Health', c: GRN, t: 'Everything looks good.', sub: 'Serviced today at 52,431 mi. Reminders are estimates until you update your mileage.', cta: 'View health', go: 'health' };
    const home = isTac ? homeTac : homeQS;

    // One persistent 3D car; each screen picks its camera angle, paint and frame. Camera flies between them (Tesla-style).
    const selPaint = PAINT[sel.color] || '#b9bdc3';
    const HERO = {
      home: { view: 'orbit', top: 104, h: 236, paint: car0.paint, auto: true },
      garage: { view: 'side', top: 108, h: 190, paint: car0.paint, auto: false },
      service: { view: 'quarter', top: 82, h: 196, paint: myPaint, auto: false },
      health: { view: 'top', top: 106, h: 230, paint: myPaint, auto: false, zoom: .6 },
      pickup: { view: 'rear', top: 178, h: 190, paint: myPaint, auto: false },
      loaner: { view: 'side', top: 148, h: 206, paint: lv.paint, auto: true },
      loanerGuide: { view: guide.view, top: 112, h: 232, paint: lv.paint, auto: false },
      vehicle: { view: 'quarter', top: 82, h: 236, paint: selPaint, auto: true },
      reserve: { view: 'front', top: 205, h: 170, paint: selPaint, auto: true, hide: s.resStep !== 2 },
      valet: s.valet && s.valet.step === 3 ? { view: 'quarter', top: 150, h: 190, paint: myPaint, auto: false } : null,
      onboard: s.onboard && s.onboard.step === 0 ? { view: 'quarter', top: 150, h: 260, paint: myPaint, auto: true } : s.onboard && s.onboard.step === 3 ? { view: 'side', top: 262, h: 176, paint: myPaint, auto: false, hide: !s.onboard.found } : null
    };
    const h0 = HERO[view];
    const heroShown = !!h0 && !h0.hide;
    const hero = Object.assign({ view: 'orbit', paint: myPaint, auto: false }, h0 || {}, {
      // Fixed-size canvas moved with transform only: resizing the WebGL buffer mid-flight is what caused the stutter.
      style: 'position:absolute;left:0;right:0;z-index:4;top:0;height:240px;transition:opacity .35s ease,transform .6s cubic-bezier(.2,.8,.2,1);opacity:' + (heroShown ? 1 : 0) + ';transform:translateY(' + Math.round((h0 ? h0.top + h0.h / 2 : 220) - 120 + (heroShown ? 0 : -24)) + 'px)' + (heroShown ? '' : ' scale(.96)') + ';pointer-events:' + (heroShown ? 'auto' : 'none'),
      zoom: h0 ? (h0.h / 240).toFixed(3) : '1'
    });
    const brakesGood = st >= 8;
    const health = [
      { name: 'Tires', status: 'Good', c: GRN }, { name: 'Brakes', status: brakesGood ? 'Good' : 'Service recommended', c: brakesGood ? GRN : YEL },
      { name: 'Battery', status: 'Good', c: GRN }, { name: 'Fluids', status: 'Good', c: GRN }, { name: 'Filters', status: 'Monitor', c: YEL }, { name: 'Alignment', status: 'Good', c: GRN }
    ].map(h => ({ name: h.name, status: h.status, dot: dotOf(h.c), d: { Tires: I.tire, Brakes: I.brake, Battery: I.battery, Fluids: I.drop, Filters: I.filter, Alignment: I.align }[h.name], go: () => this.setState({ view: 'healthDetail', healthId: h.name }) }));
    const attention = health.filter(h => h.status !== 'Good').length;
    const fuRem = (s.fu || {})['ren-filter'] === 'reminded';
    const padNew = st >= 8, padV = padNew ? '12 mm' : '3 mm', padC = padNew ? GRN : RED;
    const healthCallouts = [['Front left', '6/32" · pad ' + padV, padNew ? GRN : RED, 'left', 0], ['Front right', '4/32" · pad ' + padV, padNew ? YEL : RED, 'right', 0], ['Rear left', '7/32" · pad 7 mm', GRN, 'left', 170], ['Rear right', '7/32" · pad 7 mm', GRN, 'right', 170]].map(k => ({
      k: k[0], v: k[1], c: k[2],
      style: 'position:absolute;top:' + k[4] + 'px;' + (k[3] === 'left' ? 'left:22px;text-align:left' : 'right:22px;text-align:right') + ';padding-bottom:7px;border-bottom:1px solid ' + k[2] + ';pointer-events:none'
    }));

    const V = {
      devices: [['phone', 'Customer · iPhone'], ['pad', 'Technician · iPad'], ['desk', 'Shop · Desktop'], ['lobby', 'Lobby · TV']].map(d => ({
        label: d[1], pick: () => this.setState({ device: d[0] }),
        style: 'padding:7px 13px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (s.device === d[0] ? 'background:#fff;color:#000;' : 'color:rgba(235,235,245,.6);')
      })),
      isPhone: s.device === 'phone', isPad: s.device === 'pad', isDesk: s.device === 'desk', isLobby: s.device === 'lobby', lobbyWrapStyle: this.frameFit(1360, 765).wrap, lobbyScaleStyle: this.frameFit(1360, 765).scale, healthCallouts,
      wrapRef: this.wrapRef, heroInnerRef: this.heroInnerRef, scrollRef: this.scrollRef, onContentScroll: this.onContentScroll, padWrapStyle: this.frameFit(1060, 800).wrap, padScaleStyle: this.frameFit(1060, 800).scale, deskWrapStyle: this.frameFit(1360, 843).wrap, deskScaleStyle: this.frameFit(1360, 843).scale,
      stageName: STAGES[st].name, demoNext: () => this.setStage(st + 1), demoBack: () => this.setStage(st - 1), demoReset: this.resetDemo, startOnboard: () => this.setState({ device: 'phone', view: 'onboard', onboard: { step: 0, phone: '', code: '', plate: '', name: '', found: false, searching: false } }),
      toast: s.toast,
      pHome: view === 'home', pGarage: view === 'garage', pHealth: view === 'health',
      goBack: () => this.setState({ view: BACK[view] || 'home' }),
      goUpdates: this.go('updates'), goAccount: this.go('account'), goShop: this.go('shop'), goHome: this.go('home'), goService: this.go('service'),
      hasUnread: s.readStage < st,
      myCars, car0, myPaint, multiCar: myCars.length > 1, onHeroScroll: this.onHeroScroll,
      heroStyle: hero.style, heroView: hero.view, heroPaint: hero.paint, heroAuto: hero.auto ? 'true' : 'false', heroZoom: hero.zoom,
      dots: myCars.map((c, i) => ({ style: 'width:' + (i === s.vIdx ? '16px' : '5px') + ';height:5px;border-radius:3px;transition:all .25s ease;background:' + (i === s.vIdx ? 'rgba(235,235,245,.85)' : 'rgba(235,235,245,.25)') })),
      inShop, statusPct: pct, statusBarStyle: 'height:100%;width:' + pct + '%;background:' + ACC + ';transition:width .5s cubic-bezier(.3,.9,.3,1)',
      homeKicker: home.k, homeKickerStyle: pill(home.c),
      homeTitle: home.t, homeSub: home.sub, homeCta: home.cta, homeGo: home.go === 'bookOil' ? bookOil : home.go === 'payOil' ? () => this.setState({ view: 'pay', payFor: 'oil', payErr: '' }) : this.go(home.go),
      homeRings: inShop && !isTac, homeScene: isTac ? (oilLive && !oilDone ? 'oil' : '') : (inShop && st >= 5 && st <= 8 ? 'brake' : ''), homeScenePhase: isTac ? oilPhase : brakePhase,
      shortcuts: [{ label: 'Book', d: I.plus, go: () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 0, err: '' }) }) }, { label: 'Health', d: I.activity, go: this.go('health') }, { label: 'Care', d: I.shield, go: this.go('care') }, { label: 'Rewards', d: I.gift, go: this.go('rewards') }],
      nextDue: (isTac ? nextDueTac : (s.recallAdded ? [{ name: 'Open recall · 24V-000', due: 'Added to next visit', pct: 100, booked: true, go: this.go('health') }] : []).concat([
        { name: 'Tire rotation', due: rotDue.due, pct: rotDue.pct, go: () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 0, need: 'Tires', err: '' }) }) },
        { name: 'Winter tire swap', due: swapBooked ? 'Sat, Oct 17' : 'Oct – Nov', pct: 86, booked: swapBooked, go: this.go('storage') },
        { name: 'Cabin air filter', due: st >= 9 && s.inclMonitor ? 'Replaced today' : fuRem ? 'Reminder from Tyler · $65' : 'Next visit', pct: st >= 9 && s.inclMonitor ? 2 : 92, reminded: fuRem && !(st >= 9 && s.inclMonitor), go: () => this.setState({ view: 'findings', exp: 'filter' }) },
        { name: 'Brake fluid', due: fluidDue.due, pct: fluidDue.pct, go: () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 0, need: 'Maintenance', err: '' }) }) },
        { name: 'Annual inspection', due: 'Jan 2027', pct: 70, go: () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 0, need: 'Inspection', err: '' }) }) }
      ])).map(r => ({ name: r.name, due: r.due, go: r.go, c: r.booked ? GRN : r.reminded ? ACC : r.due === 'Due now' ? RED : r.pct >= 80 ? YEL : 'rgba(235,235,245,.5)', bar: 'height:100%;width:' + r.pct + '%;border-radius:1px;transition:width .5s ease;background:' + (r.booked ? GRN : r.reminded ? ACC : r.pct >= 80 ? YEL : 'rgba(235,235,245,.45)') })),
      goCare: this.go('care'), goRewards: this.go('rewards'),
      careTag: care ? 'Member' : 'New', careTagStyle: pill(care ? GRN : 'rgba(235,235,245,.45)'), careSub: care ? careTier.name + ' · renews ' + (care.bill === 'month' ? 'Nov 5' : 'Oct 2027') : 'From $19/mo. Rotations, inspections, 10% off labor.',
      rewardsTier, rewardsTagStyle: pill(rewardsTier === 'Gold' ? YEL : 'rgba(235,235,245,.45)'), pointsLabel: points.toLocaleString('en-US') + ' pts', rewardsSub: rewardsTier === 'Gold' ? 'Gold member. $25 off is yours to use.' : (2000 - points).toLocaleString('en-US') + ' to Gold. Earn on every visit.',
      reminders: [{ name: 'Tire rotation', when: rotDue.due === 'Due now' ? 'Due now' : 'Estimated ' + rotDue.due + ', based on your typical driving', cta: 'Schedule', go: () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 0, need: 'Tires', err: '' }) }) }, { name: 'Cabin filter', when: 'Recommended soon', cta: 'Learn more', go: () => this.setState({ view: 'findings', exp: 'filter' }) }],
      promoKicker: s.reserved ? 'Your reservation' : 'Thinking about something new?', promoTitle: s.reserved ? sel.name + ' · ' + (['Reserved', 'Vehicle preparation', 'Purchase documents', 'Payment / financing', 'Pickup'][s.resStatus] || 'Reserved') : 'Explore our current inventory.',
      garageSub: myCars.length + (myCars.length === 1 ? ' vehicle' : ' vehicles') + ' · Manti, UT',
      garageCars: myCars.map((c, i) => ({
        name: c.name, sub: c.sub, shot: c.shot, ph: PH, paint: c.paint, tag: i === 0 ? (attention ? attention + ' to review' : 'Healthy') : c.tac ? (oilDone ? 'Oil changed today' : oilLive ? 'In Bay 04' : oilBooked ? 'Oil change booked' : 'Oil due') : c.name === 'Reserved' ? 'RES-20481' : 'In use',
        tagStyle: 'font-size:11px;font-weight:500;padding:6px 10px;border-radius:8px;background:rgba(235,235,245,.08);color:' + (i === 0 && attention ? YEL : c.tac && !oilDone && !oilBooked && !oilLive ? YEL : 'rgba(235,235,245,.7)'),
        go: i === 0 ? this.go('health') : c.tac ? (oilLive ? () => this.setState({ view: 'home', vIdx: 1 }) : bookOil) : c.name === 'Reserved' ? this.go('reservation') : this.go('loanerReturn')
      })),
      garageRows: [{ t: 'Vehicle Health', v: attention ? attention + ' items' : 'All good', go: this.go('health') }, { t: 'Mileage', v: odoFmt + ' mi', go: this.go('odometer') }, { t: 'Tires & storage', v: tq.accepted ? 'New set accepted' : swapBooked ? 'Swap Oct 17' : 'Winter set stored', go: this.go('storage') }, { t: 'Service history', v: (HISTORY.length + (s.histPaid ? 1 : 0)) + ' visits', go: this.go('history') }, { t: 'Trade-in estimate', v: '$27,400+', go: this.go('trade') }],
      healthHeadline: attention ? 'A couple of things to keep an eye on.' : 'Everything looks good.', health,
      pOdometer: view === 'odometer', goOdometer: this.go('odometer'), odoLabel: isTac ? tacOdoFmt + ' mi · entered by you' : odoLabel, odoFmt, odoDraft: s.odoDraft, odoPlaceholder: isTac ? tacOdoFmt : odoFmt,
      onOdoDraft: e => this.setState({ odoDraft: e.target.value.replace(/[^\d,]/g, '') }),
      odoRows: isTac ? [{ k: 'Last recorded by RyGuys', v: '57,740 mi · Apr 12, 2026 · oil change' }, { k: 'Typical driving', v: 'About 820 mi / month' }, { k: 'Your estimate today', v: odoTacUser > 61840 ? tacOdoFmt + ' mi' : 'Not entered' }, { k: 'Oil life at this mileage', v: oilLifePct + '% · estimated' }] : [{ k: 'Last recorded by RyGuys', v: '52,431 mi · Oct 5, 2026' }, { k: 'Typical driving', v: 'About 1,050 mi / month' }, { k: 'Your estimate today', v: odoUser > 52431 ? odoFmt + ' mi' : 'Not entered' }],
      odoCtaStyle: 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (parseInt(String(s.odoDraft).replace(/\D/g, ''), 10) >= (isTac ? 61840 : 52431) ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      saveOdo: () => { const n = parseInt(String(s.odoDraft).replace(/\D/g, ''), 10); if (isTac) { if (!(n >= 61840)) return; this.setState({ odoTac: String(n), odoDraft: '', view: 'home' }); this.notify('Mileage saved. Dusty’s oil life is now estimated at ' + Math.max(0, Math.round((1 - (n - 57740) / 5000) * 100)) + '%.'); return; } if (!(n >= 52431)) return; this.setState({ odo: String(n), odoDraft: '', view: 'home', trade: Object.assign({}, s.trade, { miles: n.toLocaleString('en-US'), result: false }) }); this.notify('Mileage saved. Reminders updated.'); }
    };
    const baseThread = st >= 3 ? [
      { from: 'advisor', text: 'Your inspection is complete. I uploaded a few photos for you to review.', time: '9:38 AM' },
      { from: 'customer', text: 'Thanks. Is the brake issue urgent?', time: '9:39 AM' },
      { from: 'advisor', text: 'We\u2019d recommend taking care of it soon. You can safely drive it today, but we\u2019d schedule the repair within the next few weeks.', time: '9:40 AM' }
    ] : st >= 1 ? [{ from: 'advisor', text: 'Morning, Rennan. Quicksilver is checked in and Marcus is taking a look now.', time: '9:03 AM' }]
      : [{ from: 'advisor', text: 'Hi Rennan, this is Tyler at RyGuys. Your brake inspection is booked for tomorrow at 9:30. Reply here any time.', time: 'Yesterday' }];
    const allMsgs = baseThread.concat(s.thread);
    const needsApproval = st === 4;
    const estNotes = s.estNotes || {}, estSt = s.est || { on: { brakes: true, rotation: true, filter: true } }, estOffer = estSt.on.filter !== false;
    const planTotal = 489.32 + (s.inclMonitor ? 65 : 0);
    const planTax = Math.round(planTotal * 0.08974 * 100) / 100;
    const svc = st === 0 ? (s.checkin.step >= 2 ? null : { a: 'Check in', t: 'Before you arrive', sub: 'Confirm your visit in about 30 seconds.', go: 'checkin' })
      : st === 4 ? { a: 'Review', t: 'Estimate ready · $489.32', sub: '3 findings with photos from your technician.', go: 'findings' }
      : st >= 3 && st <= 7 ? { a: 'View', t: 'Inspection report', sub: '3 findings · 4 photos', go: 'findings' }
      : st === 8 ? { a: 'Pay', t: '$545.23 due', sub: 'Pay here and skip the counter.', go: 'pay' }
      : st === 9 ? { a: 'Pickup', t: 'Quicksilver is in Bay 4', sub: s.pickup === 0 ? 'Let us know when you\u2019re on your way.' : s.pickup === 1 ? 'The team knows you\u2019re coming.' : 'Waiting for the bay to release your vehicle.', go: 'pickup' }
      : st === 10 ? { a: 'Report', t: 'Front brake service · $545.23', sub: 'Saved to your vehicle history.', go: 'history' } : null;
    const timelineEnd = Math.max(9, st + 1);
    const delayedNow = s.partsDelayed && st >= 5 && st <= 6, estTime = delayedNow ? PETA.est : 'Today · 3:30 PM';
    const clamp01 = x => Math.max(0, Math.min(1, x));
    const ringDefs = [
      { name: 'Inspection', r: 52, color: '#fff', pct: clamp01(st / 3), sub: st < 1 ? 'Starts at check-in' : st < 3 ? 'Marcus is looking it over' : '3 findings · 4 photos' },
      { name: 'Repair', r: 40, color: delayedNow ? YEL : st === 4 ? YEL : '#ff9f0a', pct: clamp01((st - 3) / 4), sub: st < 4 ? 'After inspection' : st === 4 ? 'Your approval is needed' : delayedNow ? 'Waiting for parts' : st < 7 ? 'Front pads + rotors' : st === 7 ? 'Quality check' : 'Complete' },
      { name: 'Pickup', r: 28, color: GRN, pct: clamp01((st - 7) / 3), sub: st < 8 ? 'Est. ' + estTime : st === 8 ? 'Ready · payment due' : st === 9 ? 'Paid · Bay 4' : 'Picked up 3:20 PM' }
    ];
    const icon = (fg, bg) => 'width:52px;height:52px;border-radius:26px;background:' + bg + ';color:' + fg + ';display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:500';
    const ctaFor = { checkin: 'Check in', findings: st === 4 ? 'Review estimate' : 'Inspection report', pickup: s.pickup === 0 ? 'I\u2019m on my way' : 'Pickup details', history: 'View report' };
    const loanerPrice = shopPays ? (carePlus ? 'included with Care Plus' : 'covered by RyGuys') : fmt0(RATE) + '/day';
    const svcCards = [
      { scene: st >= 5 && st <= 8 ? 'brake' : '', phase: brakePhase, d: st >= 8 ? I.check : st === 0 ? I.clock : I.wrench, iconStyle: icon(st >= 8 ? GRN : st === 4 ? YEL : ACC, st >= 8 ? 'rgba(48,209,88,.14)' : st === 4 ? 'rgba(255,214,10,.14)' : 'rgba(224,49,43,.16)'), k: st === 0 ? 'Upcoming' : st >= 10 ? 'Complete' : 'Step ' + st + ' of 9', kColor: st >= 8 ? GRN : st === 4 ? YEL : ACC,
        t: st === 0 ? 'Brake inspection' : delayedNow ? 'Waiting for parts' : BAY1[st], sub: st === 0 ? 'Tomorrow · 9:30 AM · RyGuys, Manti' : st >= 10 ? 'Picked up at 3:20 PM. Thanks, Rennan.' : st >= 8 ? 'Washed and parked in Bay 4.' : 'Estimated completion · ' + estTime,
        cta: svc && svc.go !== 'pay' ? ctaFor[svc.go] || svc.a : '', go: this.go(svc ? svc.go : 'service') },
      st >= 9 ? { d: I.check, iconStyle: icon(GRN, 'rgba(48,209,88,.14)'), k: 'Payment', kColor: GRN, t: 'Paid · $545.23', sub: 'Apple Pay · 2:52 PM · Receipt saved to your history.', cta: 'View receipt', go: this.go('history') }
        : st === 8 ? { d: I.dollar, iconStyle: icon('#fff', 'rgba(235,235,245,.12)'), k: 'Payment due', kColor: GRN, t: '$545.23', sub: 'Front brake pads + rotors. Pay here and skip the counter.', cta: 'Pay now', go: this.go('pay') }
        : st >= 5 ? { d: I.dollar, iconStyle: icon('#fff', 'rgba(235,235,245,.12)'), k: 'Approved', kColor: 'rgba(235,235,245,.5)', t: '$489.32', sub: 'Payment opens when the work is complete.', cta: 'See estimate', go: this.go('findings') } : null,
      s.loaner === 'active' ? { d: I.swap, iconStyle: icon(ACC, 'rgba(224,49,43,.16)'), k: 'Your loaner', kColor: ACC, t: lv.car, sub: st >= 8 ? 'Return it when you arrive. Four quick photos and you are done.' : 'Due back ' + dayLabel(rEnd) + (delayDay ? ' \u00b7 extra day on us' : '') + ' \u00b7 88% at handoff.', cta: st >= 8 ? 'Return loaner' : 'Guide and return', go: this.go('loanerReturn') }
        : s.loaner === 'reserved' ? { d: I.swap, iconStyle: icon(GRN, 'rgba(48,209,88,.14)'), k: 'Loaner', kColor: GRN, t: 'Agreement signed', sub: lv.car + ' · pick up the keys at check-in.', cta: 'Pick up keys', go: this.go('loanerCheckout') }
        : s.loaner === 'returned' ? { d: I.check, iconStyle: icon('rgba(235,235,245,.6)', 'rgba(235,235,245,.1)'), k: 'Loaner', kColor: 'rgba(235,235,245,.5)', t: 'Returned', sub: '38 miles · 81% charge · ' + (shopPays ? 'no charges.' : fmt0(rTotal) + ' charged.'), cta: '', go: () => {} }
        : rn.sent ? { d: I.swap, iconStyle: icon(YEL, 'rgba(255,214,10,.14)'), k: 'Loaner', kColor: YEL, t: 'Agreement ready to sign', sub: lv.car + ' · ' + loanerPrice + '. Sign to hold the car.', cta: 'Review and sign', go: this.go('loaner') }
        : st <= 7 ? { d: I.swap, iconStyle: icon('#fff', 'rgba(235,235,245,.12)'), k: 'Loaner', kColor: 'rgba(235,235,245,.5)', t: 'Need a ride?', sub: lv.car + ' · ' + lv.color + ' · ' + loanerPrice + '.', cta: 'Reserve a loaner', go: this.go('loaner') } : null,
      tq.accepted && st <= 8 ? { scene: 'tire', phase: tirePhase, d: I.tire, iconStyle: icon(GRN, 'rgba(48,209,88,.14)'), k: 'Tires', kColor: GRN, t: '4× ' + tqOptR.name, sub: 'Added to this visit · ' + fmt(tqCR.total) + ' installed, charged with the rest.', cta: 'View quote', go: this.go('tires') } : null,
      { txt: 'TL', iconStyle: icon('#fff', 'rgba(235,235,245,.12)').replace('font-size:20px', 'font-size:14px;letter-spacing:.4px'), k: 'Service advisor', kColor: 'rgba(235,235,245,.5)', t: 'Tyler L.', sub: 'Replies in about 10 minutes.', cta: 'Message', go: this.go('messages') }
    ].filter(Boolean).map(c => Object.assign(c, { noScene: !c.scene }));
    const cardIdx = Math.min(s.cardIdx, svcCards.length - 1);
    const arrow = on => 'width:30px;height:30px;border-radius:15px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:300;cursor:pointer;transition:opacity .2s ease;color:rgba(235,235,245,.8);opacity:' + (on ? 1 : .3);
    Object.assign(V, {
      rings: ringDefs.map((d, i) => { const circ = 2 * Math.PI * d.r, shown = s.ringsIn ? d.pct : 0; return { r: d.r, name: d.name, sub: d.sub, color: d.color, pctLabel: Math.round(d.pct * 100) + '%', dot: 'width:8px;height:8px;border-radius:4px;flex:0 0 auto;background:' + d.color, track: 'fill:none;stroke:rgba(235,235,245,.08);stroke-width:8', bar: 'fill:none;stroke:' + d.color + ';stroke-width:8;stroke-linecap:round;stroke-dasharray:' + circ.toFixed(2) + ';stroke-dashoffset:' + (circ * (1 - shown)).toFixed(2) + ';opacity:' + (shown > 0 ? 1 : 0) + ';transition:stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1) ' + (i * 0.1).toFixed(1) + 's,stroke .4s ease,opacity .3s ease' }; }),
      ringsMini: ringDefs.map(d => { const circ = 2 * Math.PI * d.r; return { r: d.r, name: d.name, dot: 'width:7px;height:7px;border-radius:4px;flex:0 0 auto;background:' + d.color, track: 'fill:none;stroke:rgba(235,235,245,.08);stroke-width:8', bar: 'fill:none;stroke:' + d.color + ';stroke-width:8;stroke-linecap:round;stroke-dasharray:' + circ.toFixed(2) + ';stroke-dashoffset:' + (circ * (1 - d.pct)).toFixed(2) + ';opacity:' + (d.pct > 0 ? 1 : 0) + ';transition:stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1),stroke .4s ease' }; }),
      ringCenter: st >= 10 ? 'Done' : st === 0 ? '—' : st + '/9',
      svcCards, cardsRef: this.cardsRef, cardCounter: (cardIdx + 1) + ' of ' + svcCards.length,
      cardsPrev: () => this.scrollCards(-1), cardsNext: () => this.scrollCards(1), cardPrevStyle: arrow(cardIdx > 0), cardNextStyle: arrow(cardIdx < svcCards.length - 1),
      onCardsScroll: e => { const i = Math.round(e.currentTarget.scrollLeft / 310); if (i !== this.state.cardIdx) this.setState({ cardIdx: i }); }
    });
    Object.assign(V, {
      pService: view === 'service', pFindings: view === 'findings', pPhotos: view === 'photos', pApprove: view === 'approve', pMessages: view === 'messages',
      goMessages: this.go('messages'), goPhotos: this.go('photos'), goApprove: this.go('approve'), goBook: () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 0, err: '' }) }),
      noService: false, hasService: true,
      svcKicker: st === 0 ? 'Appointment tomorrow · 9:30 AM' : st >= 10 ? 'Service complete' : st >= 8 ? 'Ready for pickup' : 'Service in progress',
      svcKickerStyle: 'margin-top:10px;' + pill(st === 0 ? '#fff' : st >= 8 ? GRN : st === 4 ? YEL : '#fff'),
      svcAction: svc ? svc.a : '', svcActionTitle: svc ? svc.t : '', svcActionSub: svc ? svc.sub : '', svcActionGo: this.go(svc ? svc.go : 'service'),
      timeline: STAGES.slice(1, timelineEnd).map((x, j) => {
        const i = j + 1, done = i < st, cur = i === st;
        const delayed = s.partsDelayed && st >= 5 && st <= 6;
        return {
          name: x.name, time: done || cur ? x.t : i === 8 ? (delayed ? 'Est. ' + PETA.estShort : 'Est. 3:30 PM') : '',
          desc: cur && delayed ? x.d + ' Waiting for parts: the rotors arrive ' + PETA.arrive + ', so we\u2019ve moved your estimate to ' + PETA.estShort + '. Your loaner is covered for the extra ' + (PETA.extraDays > 1 ? 'days' : 'day') + '.' : done || cur ? x.d : '',
          color: cur ? '#fff' : done ? 'rgba(235,235,245,.7)' : 'rgba(235,235,245,.3)',
          dotStyle: cur ? 'width:11px;height:11px;border-radius:6px;background:' + ACC + ';box-shadow:0 0 0 4px rgba(224,49,43,.22);transition:all .3s ease'
            : 'width:7px;height:7px;border-radius:4px;margin:2px;transition:all .3s ease;background:' + (done ? 'rgba(235,235,245,.5)' : 'rgba(235,235,245,.2)'),
          lineStyle: i === timelineEnd - 1 ? 'display:none' : 'flex:1;width:1px;margin-top:6px;min-height:22px;background:' + (done ? 'rgba(235,235,245,.22)' : 'rgba(235,235,245,.09)')
        };
      }),
      loanerRow: s.loaner !== 'none' || rn.sent, loanerRowTitle: s.loaner === 'active' ? 'Your loaner · ' + lv.short : s.loaner === 'reserved' ? 'Loaner signed · ' + lv.short : s.loaner === 'returned' ? 'Loaner returned' : 'Loaner agreement ready · ' + lv.short,
      loanerRowSub: s.loaner === 'active' ? (st >= 8 ? 'Return when you arrive' : 'Due back ' + dayLabel(rEnd) + (delayDay ? ' · extra day on us' : '') + ' · 88% at handoff') : s.loaner === 'reserved' ? 'Pick up keys at check-in' : s.loaner === 'returned' ? 'Thanks for bringing it back' : 'Review and sign to hold the car',
      loanerRowGo: this.go(s.loaner === 'active' ? 'loanerReturn' : s.loaner === 'none' ? 'loaner' : 'loanerCheckout'),
      photoThumbs: PHOTOS.map(p => ({ meas: p.meas, ph: PH })),
      findingGroups: FINDINGS.filter(f => f.id !== 'filter' || estOffer).map(f => ({
        tier: f.tier, items: [{
          name: f.name, price: f.price ? fmt(f.price) : '$0', plain: estNotes[f.id] || f.plain, tech: f.tech, meas: f.meas, measLabel: f.measLabel, urgency: f.urgency, wait: f.wait, photos: f.photos + (f.photos > 1 ? ' photos' : ' photo'), ph: PH,
          open: s.exp === f.id, toggle: () => this.setState({ exp: s.exp === f.id ? '' : f.id }), dot: dotOf(f.color),
          chev: 'display:flex;color:rgba(235,235,245,.3);transition:transform .25s ease;transform:rotate(' + (s.exp === f.id ? '90deg' : '0') + ')'
        }]
      })),
      needsApproval, notApproved: !s.approveAnim && st < 5, approvedNow: s.approveAnim || st >= 5,
      photos: PHOTOS.map((p, i) => ({ meas: p.meas, ph: PH, marked: i === 0 && s.photoAdded })),
      photo: Object.assign({}, PHOTOS[Math.min(s.photoIdx, PHOTOS.length - 1)], { dot: dotOf(PHOTOS[Math.min(s.photoIdx, PHOTOS.length - 1)].color) }),
      photoCount: (s.photoIdx + 1) + ' of ' + PHOTOS.length,
      photoDots: PHOTOS.map((p, i) => ({ style: 'width:' + (i === s.photoIdx ? '16px' : '5px') + ';height:5px;border-radius:3px;transition:all .25s ease;background:' + (i === s.photoIdx ? 'rgba(235,235,245,.85)' : 'rgba(235,235,245,.25)') })),
      onPhotoScroll: e => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); if (i !== s.photoIdx) this.setState({ photoIdx: i }); },
      planItems: FINDINGS.filter(f => f.id !== 'filter' || estOffer).map(f => {
        const locked = f.id !== 'filter', on = locked || s.inclMonitor;
        return {
          tier: f.tier, name: f.name, price: f.price ? fmt(f.price) : '$0', on,
          toggle: () => { if (!locked) this.setState({ inclMonitor: !s.inclMonitor }); },
          style: 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:15px 16px;display:flex;align-items:center;gap:13px;cursor:' + (locked ? 'default' : 'pointer') + ';transition:background .2s ease;' + (on && !locked ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);' : ''),
          box: 'width:22px;height:22px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;transition:all .2s ease;' + (on ? 'background:' + (locked ? 'rgba(235,235,245,.25)' : ACC) + ';color:#fff;' : 'border:1px solid rgba(235,235,245,.25);color:transparent;')
        };
      }),
      approveTotal: fmt(planTotal), approveTax: fmt(planTax + 12),
      approveBtnStyle: 'flex:1;text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;transition:transform .15s ease;' + (s.approveAnim ? 'transform:scale(.96);' : ''),
      approve: () => { if (st !== 4) { this.setStage(5); } else { this.setState({ approveAnim: true }); setTimeout(() => { this.setStage(5); this.setState({ approveAnim: false }); }, 450); } },
      msgs: allMsgs.map((m, i) => {
        const me = m.from === 'customer';
        return {
          text: m.text, time: m.time, who: !me && (m.who || i === 0 || allMsgs[i - 1].from === 'customer' || (allMsgs[i - 1].who || '') !== (m.who || '')) ? (m.who || 'Tyler L. · Service advisor') : '',
          wrap: 'display:flex;flex-direction:column;align-items:' + (me ? 'flex-end' : 'flex-start') + ';max-width:84%;align-self:' + (me ? 'flex-end' : 'flex-start'),
          bubble: 'padding:10px 14px;border-radius:18px;font-size:13.5px;line-height:1.45;' + (me ? 'background:#fff;color:#000;border-bottom-right-radius:5px' : 'background:#1c1c1e;color:#fff;border-bottom-left-radius:5px'),
          timeStyle: 'font-size:10px;color:rgba(235,235,245,.3);margin:4px 10px 0'
        };
      }),
      quickReplies: (s.needInfo ? [{ text: 'Mostly when it\u2019s cold, first few stops.', reply: 'Got it, thanks. That matches what I\u2019m seeing on the rotors \u2014 carrying on.' }, { text: 'All the time, and worse at highway speed.', reply: 'Thanks. I\u2019ll road-test it after the pads to make sure nothing else is contributing.' }] : [])
        .concat(needsApproval ? [{ text: 'How long can I wait on the brakes?', reply: 'You\u2019re okay for now, but we\u2019d recommend doing them within the next few weeks.' }] : [])
        .concat(st <= 7 && s.loaner === 'none' ? [{ text: 'Can I get a loaner?', reply: 'Yes \u2014 the ' + lv.car + ' in our loaner fleet is ' + (shopPays ? 'covered by us for this visit' : fmt0(RATE) + ' a day') + '. Check in with the Loaner option and the agreement will be waiting for you.' }] : [])
        .concat(st >= 8 && st <= 9 ? [{ text: 'Where do I park the loaner?', reply: 'Pull it into Bay 4 next to Quicksilver and leave the key on the seat. We\u2019ll close it out.' }] : [])
        .map(q => ({ text: q.text, send: () => this.sendMsg(q.text, q.reply) })),
      draft: s.draft, onDraft: e => this.setState({ draft: e.target.value }), onDraftKey: e => { if (e.key === 'Enter') this.sendMsg(s.draft); },
      sendDraft: () => this.sendMsg(s.draft)
    });
    const b = s.book, ci = s.checkin;
    const radio = on => 'width:20px;height:20px;border-radius:10px;transition:all .2s ease;' + (on ? 'border:6px solid #fff;background:#000;' : 'border:1px solid rgba(235,235,245,.3);');
    const optRow = on => 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:15px 16px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:background .2s ease;' + (on ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);' : '');
    const VISITS = [['Drop off', 'Leave it with us, we text when it\u2019s ready'], ['Wait', 'Lounge with Wi-Fi, most inspections under an hour'], ['Loaner', (shopPays ? 'Covered by RyGuys' : fmt0(RATE) + '/day') + ' · ' + lv.car], ['Pickup & delivery', 'We come to you, within 15 miles of Manti']];
    const bookDays = ['Tomorrow', 'Wednesday', 'Thursday'];
    const bookSlots = ['9:30 AM', '11:00 AM', '2:30 PM'];
    const hist = (oilDone ? [Object.assign(OIL_HIST(oil), { pay: oilPaid ? 'Apple Pay · 2:55 PM' : 'Due at pickup', total: oilTotal })] : []).concat(s.histPaid ? [CURRENT_HIST] : []).concat(HISTORY);
    const hd = hist.find(h => h.id === s.histId) || hist[0];
    const invoiceSub = 489.32 + (s.inclMonitor ? 65 : 0);
    const invoiceTax = Math.round(invoiceSub * 0.08974 * 100) / 100;
    const invoiceTotal = Math.round((invoiceSub + 12 + invoiceTax) * 100) / 100;
    const payOil = s.payFor === 'oil';
    Object.assign(V, {
      ph: PH,
      pPay: view === 'pay', pPickup: view === 'pickup', pBook: view === 'book', pCheckin: view === 'checkin', pLoaner: view === 'loaner', pLoanerAgree: view === 'loanerAgree', pLoanerGuide: view === 'loanerGuide', pLoanerCheckout: view === 'loanerCheckout', pLoanerReturn: view === 'loanerReturn', pHistory: view === 'history', pHistDetail: view === 'histDetail',
      goPickup: this.go('pickup'), goLoanerReturn: this.go('loanerReturn'),
      paidNow: payOil ? oilPaid && !s.payAnim : st >= 9 && !s.payAnim, notPaid: payOil ? !oilPaid || s.payAnim : st < 9 || s.payAnim,
      payTitle: payOil ? 'Oil change complete' : 'Service complete', paySub: payOil ? 'Dusty · 2019 Toyota Tacoma · Bay 04' : 'Quicksilver · 2022 Tesla Model Y', payDoneCta: payOil ? 'Back to Home' : 'Pick up Quicksilver', payDoneGo: payOil ? this.go('home') : this.go('pickup'),
      invoice: payOil ? [{ k: 'Full synthetic oil change · ' + oil.qts.toFixed(1) + ' qt ' + oil.visc, v: '$89.95' }, { k: 'Oil filter · Toyota ' + oil.filter, v: 'Included' }, { k: 'Shop supplies', v: '$4.00' }, { k: 'Tax', v: fmt(oilTax) }] : [{ k: 'Front brake pads + rotors', v: '$489.32' }].concat(s.inclMonitor ? [{ k: 'Cabin air filter', v: '$65.00' }] : []).concat([{ k: 'Shop supplies', v: '$12.00' }, { k: 'Tax', v: fmt(invoiceTax) }]),
      invoiceTotal: fmt(payOil ? oilTotal : invoiceTotal),
      payMethods: [['apple', 'Apple Pay', 'Face ID'], ['saved', 'Saved card', 'Visa ·· 4417'], ['card', 'Card', 'Mastercard ·· 2210']].map(m => ({
        name: m[1], sub: m[2], pick: () => this.setState({ payMethod: m[0], payErr: '' }), style: optRow(s.payMethod === m[0]), radio: radio(s.payMethod === m[0])
      })),
      payErr: s.payErr, payLabel: s.payAnim ? 'Processing…' : 'Pay ' + fmt(payOil ? oilTotal : invoiceTotal),
      payBtnStyle: 'text-align:center;padding:15px 0;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s ease;' + (s.payAnim ? 'opacity:.6;transform:scale(.98);' : ''),
      pay: () => {
        const cur = this.state;
        if (cur.payAnim) return;
        if (cur.payMethod === 'card' && !cur.cardTried) return this.setState({ payErr: 'Your bank declined the Mastercard ending 2210. No money was taken. Try Apple Pay or your saved Visa, or contact your bank.', cardTried: true });
        this.setState({ payAnim: true, payErr: '' });
        clearTimeout(this._payT);
        this._payT = setTimeout(() => {
          clearTimeout(this._tt);
          if (payOil) this.setState({ oilPaid: true, payAnim: false, toast: 'Payment received for Dusty. It’s out front by Bay 04 whenever you’re ready.' });
          else this.setState({ stage: 9, toast: NOTIF[9], payAnim: false, histPaid: true });
          this._tt = setTimeout(() => this.setState({ toast: '' }), 3400);
        }, 1100);
      },
      pickupTitle: st >= 10 ? 'See you next time.' : 'Quicksilver is ready.', pickupSub: st >= 10 ? 'Released at 3:20 PM. Thanks, Rennan.' : 'Washed, parked in Bay 4, and paid for. Let us know when you\u2019re on your way.',
      pickupLoaner: s.loaner === 'active', pickup0: st < 10 && s.pickup === 0, pickup1: st < 10 && s.pickup === 1, pickup2: st < 10 && s.pickup === 2, pickupDone: st >= 10,
      onMyWay: () => this.setState({ pickup: 1 }),
      imHere: () => { this.setState({ pickup: 2 }); setTimeout(() => { if (this.state.stage === 9) this.setStage(10); }, 4000); },
      bookStepLabel: b.step >= 6 ? '' : (b.step + 1) + '/6', bookDone: b.step >= 6, bookActive: b.step < 6,
      bookWhen: b.day + ' · ' + b.time, bookNeed: b.need || 'Service', bookVisit: b.visit || 'Drop off',
      bookBars: [0, 1, 2, 3, 4, 5].map(i => ({ style: 'flex:1;height:3px;border-radius:2px;transition:background .3s ease;background:' + (i <= b.step ? ACC : 'rgba(235,235,245,.14)') })),
      bookTitle: ['What does your vehicle need?', 'Which vehicle?', 'What\u2019s happening?', 'Choose a time', 'Choose your visit type', 'Confirm'][b.step] || '',
      bookSub: ['Pick the closest thing. Not sure is fine too.', 'We\u2019ll have the right parts and history ready.', 'In your own words. A photo or video helps the technician.', 'Inspections take about an hour.', 'How you\u2019d like to handle the visit.', 'Nothing is charged now.'][b.step] || '',
      bk0: b.step === 0, bk1: b.step === 1, bk2: b.step === 2, bk3: b.step === 3, bk4: b.step === 4, bk5: b.step === 5,
      needs: ['Maintenance', 'Tires', 'Brakes', 'Something feels wrong', 'Inspection', 'Other'].map(n => ({
        label: n, pick: () => this.setState({ book: Object.assign({}, b, { need: n, err: '' }) }),
        style: 'padding:18px 14px;border-radius:14px;text-align:center;font-size:13.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (b.need === n ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.85);')
      })),
      bookDesc: b.desc, onBookDesc: e => this.setState({ book: Object.assign({}, b, { desc: e.target.value }) }),
      bookDays: bookDays.map(d => ({ label: d, pick: () => this.setState({ book: Object.assign({}, b, { day: d, time: '', err: '' }) }), style: this.chip(b.day === d) })),
      bookSlots: bookSlots.map(t => {
        const taken = b.day === 'Tomorrow' && t === '11:00 AM';
        return {
          label: t, pick: () => this.setState({ book: Object.assign({}, b, taken ? { err: 'That 11:00 AM slot was just taken by another customer. 9:30 and 2:30 are still open tomorrow, or try Wednesday.' } : { time: t, err: '' }) }),
          style: 'padding:14px 0;border-radius:11px;text-align:center;font-size:12.5px;cursor:pointer;transition:all .2s ease;' + (taken ? 'background:rgba(255,255,255,.03);color:rgba(235,235,245,.25);text-decoration:line-through;' : b.time === t ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.85);')
        };
      }),
      visitTypes: VISITS.map(v => ({ name: v[0], sub: v[1], pick: () => this.setState({ book: Object.assign({}, b, { visit: v[0], err: '' }) }), style: optRow(b.visit === v[0]), radio: radio(b.visit === v[0]) })),
      bookSummary: [{ k: 'When', v: b.day + ' · ' + b.time }, { k: 'Vehicle', v: b.need === 'Oil change' ? 'Toyota Tacoma · Dusty' : 'Tesla Model Y · Quicksilver' }, { k: 'Service', v: b.need === 'Oil change' ? 'Oil change · $89.95' : (b.need || 'Service') + ' inspection' }, { k: 'Concern', v: b.desc || '—' }, { k: 'Visit', v: b.visit || '—' }],
      bookErr: b.err, bookCta: b.step === 5 ? 'Book appointment' : 'Continue',
      bookBack: () => b.step === 0 || b.step >= 6 ? this.setState({ view: 'home' }) : this.setState({ book: Object.assign({}, b, { step: b.step - 1, err: '' }) }),
      bookNext: () => {
        if (b.step === 0 && !b.need) return this.setState({ book: Object.assign({}, b, { err: 'Pick what your vehicle needs. "Something feels wrong" is fine.' }) });
        if (b.step === 3 && !b.time) return this.setState({ book: Object.assign({}, b, { err: 'Choose a time for ' + b.day + '.' }) });
        if (b.step === 4 && !b.visit) return this.setState({ book: Object.assign({}, b, { err: 'Choose how you\u2019d like to handle the visit.' }) });
        if (b.step === 5) { this.setState({ book: Object.assign({}, b, { step: 6, err: '' }), booked: Object.assign({}, b), checkin: { step: 0, visit: b.visit } }); if (st >= 10) this.setStage(0); return; }
        this.setState({ book: Object.assign({}, b, { step: b.step + 1, err: '' }) });
      },
      ci0: ci.step === 0, ci1: ci.step === 1, ci2: ci.step >= 2, ciActive: ci.step < 2,
      ciVisits: VISITS.map(v => ({ name: v[0], sub: v[1], pick: () => this.setState({ checkin: { step: 1, visit: v[0] } }), style: optRow(ci.visit === v[0]), radio: radio(ci.visit === v[0]) })),
      ciCta: ci.step === 0 ? 'Looks right' : ci.visit === 'Loaner' ? 'Reserve loaner & check in' : 'Check in',
      ciNext: () => {
        if (ci.step === 0) return this.setState({ checkin: { step: 1, visit: ci.visit } });
        if (!ci.visit) return;
        if (ci.visit === 'Pickup & delivery') { this.setState({ checkin: { step: 2, visit: ci.visit }, view: 'valet', valet: { step: 0, keys: 'Hand to driver', shots: 0 } }); return; }
        this.setState({ checkin: { step: 2, visit: ci.visit } });
        this.setStage(1);
        if (ci.visit === 'Loaner') this.setState({ view: 'loaner' });
      },
      ciDoneSub: ci.visit === 'Loaner' ? 'Your loaner is waiting out front. Tyler has the keys.' : ci.visit === 'Pickup & delivery' ? 'Luis will pick up Quicksilver in the morning.' : 'Pull into the lane marked Service. Marcus will take it from there.',
      lv,
      loanerPrice: shopPays ? (carePlus ? 'Included with Care Plus' : 'Covered by RyGuys') : fmt0(RATE) + ' / day', loanerPriceColor: shopPays ? GRN : '#fff', loanerPriceSub: shopPays ? 'No charge for this visit' : 'Charged at return',
      loanerTerms: [{ k: 'Pick up', v: dayLabel(rn.start) + ' · after check-in' }, { k: 'Return', v: dayLabel(rEnd) + (delayDay ? ' · extended, on us' : ' · or when Quicksilver is ready') }, { k: 'Estimated total', v: shopPays ? '$0' : fmt0(rTotal) + ' · ' + rBill + (rBill === 1 ? ' day' : ' days') }],
      loanerIncl: [{ t: 'Supercharging' }, { t: mileCap === 'Unlimited' ? 'Unlimited miles' : mileCap }, { t: 'Phone key' }, { t: 'Insured under your policy' }],
      loanerSentNote: rn.sent && s.loaner === 'none' ? 'Tyler sent your agreement at ' + rn.sentAt + '. Review and sign it to hold the car.' : '',
      reviewAgreement: () => this.setState({ view: 'loanerAgree' }),
      agreeNo: 'Agreement LN-3107', agreeDate: 'October 5, 2026',
      agreeRows: [{ k: 'Vehicle', v: lv.car + ' · ' + lv.color + ' · VIN ···· ' + lv.vin }, { k: 'Mileage out', v: lv.miles + ' mi' }, { k: 'Period', v: dayLabel(rn.start) + ' → ' + dayLabel(rEnd) }, { k: 'Rate', v: shopPays ? 'Covered by RyGuys' : fmt0(RATE) + ' per day · ' + fmt0(rTotal) + ' estimated' }, { k: 'Payment', v: shopPays ? 'None due' : 'Card on file, at return' }],
      agreeClauses: clauses,
      sigPath, sigEmpty: s.sig.length === 0,
      sigDown: e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} const p = this.sigPt(e); this.setState({ sigDraw: true, sigW: e.currentTarget.offsetWidth, sig: this.state.sig.concat([[p]]) }); },
      sigMove: e => { if (!this.state.sigDraw) return; const p = this.sigPt(e), sig = this.state.sig.slice(), k = sig[sig.length - 1], q = k[k.length - 1]; if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 1.5) return; sig[sig.length - 1] = k.concat([p]); this.setState({ sig }); },
      sigUp: () => { if (this.state.sigDraw) this.setState({ sigDraw: false }); },
      sigClear: () => this.setState({ sig: [] }),
      signCtaStyle: 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:500;transition:all .2s ease;' + (s.sig.length ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      signAgreement: () => { if (!s.sig.length) return; this.notify('Agreement signed. Tyler has the keys ready out front.'); this.setState({ loaner: 'reserved', view: 'loanerCheckout', rental: Object.assign({}, rn, { signed: true, signedAt: '9:08 AM' }) }); },
      loanerAccepted: s.loaner === 'active' || s.loaner === 'returned', loanerPending: s.loaner === 'none' || s.loaner === 'reserved',
      loanerRows: [{ k: 'Vehicle', v: lv.car }, { k: 'Color', v: lv.color }, { k: 'VIN ending', v: lv.vin }, { k: 'Mileage', v: lv.miles }, { k: 'Charge', v: '88%' }, { k: 'Agreement', v: rn.signed ? 'Signed · ' + rn.signedAt : 'Not signed' }],
      loanerShots: ['Front', 'Driver side', 'Rear', 'Interior'].map(t => ({ t, ph: PH })),
      acceptLoaner: () => this.setState({ loaner: 'active', rental: Object.assign({}, rn, { outAt: '9:12 AM' }) }),
      handoffAt: rn.outAt || '9:12 AM',
      goGuide: () => this.setState({ view: 'loanerGuide', guideStep: 0 }),
      guideKicker: (s.guideStep + 1) + ' of ' + guideCards.length + ' · ' + guide.k, guideTitle: guide.t, guideBody: guide.d,
      guideDots: guideCards.map((g, i) => ({ go: () => this.setState({ guideStep: i }), style: 'height:5px;border-radius:3px;cursor:pointer;transition:all .25s ease;width:' + (i === s.guideStep ? '18px' : '5px') + ';background:' + (i === s.guideStep ? 'rgba(235,235,245,.85)' : 'rgba(235,235,245,.25)') })),
      guideHasPrev: s.guideStep > 0, guidePrev: () => this.setState({ guideStep: Math.max(0, s.guideStep - 1) }),
      guideCta: s.guideStep >= guideCards.length - 1 ? 'Start driving' : 'Next',
      guideNext: () => s.guideStep >= guideCards.length - 1 ? this.setState({ view: 'service', guideStep: 0 }) : this.setState({ guideStep: s.guideStep + 1 }),
      returnDone: s.loaner === 'returned', returnPending: s.loaner !== 'returned',
      returnDoneSub: '38 miles driven · 81% at return, recorded by the shop. ' + (shopPays ? 'No charges.' : fmt0(rTotal) + ' charged to your card on file.'),
      returnTitle: st >= 8 ? 'Your vehicle is ready.' : 'Return loaner', returnSub: st >= 8 ? 'Your loaner can be returned when you arrive. Snap four quick photos and you\u2019re done.' : 'Quicksilver isn\u2019t ready yet, but you can return the loaner any time.',
      returnShots: ['Front', 'Driver side', 'Rear', 'Interior'].map((t, i) => ({
        t: i < s.returnStep ? t + ' · saved' : '+ ' + t, take: () => this.setState({ returnStep: Math.max(s.returnStep, i + 1) }),
        style: 'height:84px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;transition:all .2s ease;' + (i < s.returnStep ? PH + 'color:#30d158;' : 'border:1px dashed rgba(235,235,245,.18);color:rgba(235,235,245,.5);')
      })),
      completeReturn: () => this.setState({ loaner: 'returned' }),
      histItems: hist.map(h => ({ date: h.date, title: h.title, total: h.total ? fmt(h.total) : '$0', miles: h.miles, tech: h.tech, open: () => this.setState({ histId: h.id, view: 'histDetail' }) })),
      hd: Object.assign({}, hd, { totalLabel: hd.total ? fmt(hd.total) : '$0.00', hasPhotos: hd.photos.length > 0, hasParts: hd.parts.length > 0, hasRecs: hd.recs.length > 0, photos: hd.photos.map(t => ({ t, ph: PH })), parts: hd.parts.map(t => ({ t })), recs: hd.recs.map(t => ({ t })) })
    });
    const avail = v => s.reserved && v.id === s.selId ? 'Reserved' : 'Available';
    const invHistRows = [{ d: 'Sep 2026', t: 'Tire rotation · 18,104 mi' }, { d: 'Jun 2026', t: '12V battery · 16,880 mi' }, { d: 'Feb 2026', t: 'Cabin filter, wipers · 14,200 mi' }];
    const RES_STEPS = ['Reservation placed', 'Vehicle preparation', 'Purchase documents', 'Payment / financing', 'Pickup'];
    const RES_STATE = ['October 5', 'In progress', 'Waiting', 'Not started', 'Not scheduled'];
    const t = s.td, tr = s.trade;
    const salesMsgs = s.salesThread;
    const updates = [];
    for (let i = st; i >= Math.max(0, st - 5); i--) updates.push({ kind: i === 4 ? 'Estimate' : i >= 8 ? 'Pickup' : 'Service', time: STAGES[i].t, title: NOTIF[i], unread: i > s.readStage, go: i === 4 ? 'findings' : i === 8 ? 'pay' : 'service' });
    if (oilLive) updates.unshift({ kind: 'Dusty', time: OIL_TIMES[Math.min(oil.step, 4) - 1], title: ['', 'Dusty is in Bay 04. The old oil is draining.', 'New filter is on Dusty. Drain plug torqued to ' + oil.torque + ' lb-ft.', 'Filling Dusty with ' + oil.qts.toFixed(1) + ' qt of ' + oil.visc + '.', oilPaid ? 'Dusty is paid and out front by Bay 04.' : 'Dusty is ready. ' + fmt(oilTotal) + ' due — pay in the app and skip the counter.'][oil.step], unread: true, go: 'home' });
    if (fuRem) updates.unshift({ kind: 'From Tyler', time: 'Just now', title: 'The cabin air filter on Quicksilver is still due. $65, about ten minutes.', unread: true, go: 'messages' });
    if (s.recallAdded) updates.unshift({ kind: 'Recall', time: 'Today', title: 'An open recall was found for Quicksilver and added to your next visit at no charge.', unread: true, go: 'health' });
    if (s.reserved) updates.unshift({ kind: 'Reservation', time: 'Today', title: 'Your reservation RES-20481 is confirmed. ' + sel.name + ' is being prepared.', unread: s.readStage < st, go: 'reservation' });
    if (t.done) updates.unshift({ kind: 'Test drive', time: 'Today', title: 'Test drive confirmed: ' + t.day + ' · ' + t.time + ' · ' + sel.name + '.', unread: s.readStage < st, go: 'vehicle' });
    const tabDefs = [
      { id: 'home', label: 'Home', d: I.home, match: ['home', 'book', 'checkin', 'updates', 'account', 'docs', 'notifs'] },
      { id: 'garage', label: 'Vehicles', d: I.car, match: ['garage', 'health', 'reservation', 'trade'] },
      { id: 'service', label: 'Service', d: I.wrench, match: ['service', 'findings', 'photos', 'approve', 'messages', 'pay', 'pickup', 'loaner', 'loanerCheckout', 'loanerReturn'], badge: st === 4 || st === 8 },
      { id: 'shop', label: 'Shop', d: I.tag, match: ['shop', 'vehicle', 'reserve', 'testdrive', 'ask'] },
      { id: 'history', label: 'History', d: I.clock, match: ['history', 'histDetail'] }
    ];
    Object.assign(V, {
      pShop: view === 'shop', pVehicle: view === 'vehicle', pReserve: view === 'reserve', pReservation: view === 'reservation', pTestdrive: view === 'testdrive', pAsk: view === 'ask', pTrade: view === 'trade', pUpdates: view === 'updates', pAccount: view === 'account',
      goTrade: this.go('trade'), goAsk: this.go('ask'), goTestdrive: this.go('testdrive'),
      invFilters: ['All', 'Electric', 'SUV', 'Truck'].map(f => ({ label: f, set: () => this.setState({ filter: f }), style: this.chip(s.filter === f) })),
      invCards: INVENTORY.filter(v => s.filter === 'All' || v.body === s.filter).map(v => ({
        name: v.name, trim: v.trim, color: v.color, miles: v.miles.toLocaleString('en-US'), price: fmt0(v.price), shot: v.name + ' — 3/4 front, studio', ph: PH, badge: avail(v),
        badgeStyle: 'position:absolute;top:12px;left:12px;background:rgba(0,0,0,.55);backdrop-filter:blur(10px);' + pill(avail(v) === 'Reserved' ? YEL : GRN),
        open: () => this.setState({ selId: v.id, view: 'vehicle', vinShown: false, invHistOpen: false })
      })),
      sel: { name: sel.name, short: sel.short, trim: sel.trim, paint: PAINT[sel.color] || '#b9bdc3', milesLabel: sel.miles.toLocaleString('en-US'), price: fmt0(sel.price), avail: avail(sel) === 'Reserved' ? 'Reserved by you' : 'Available now', availColor: avail(sel) === 'Reserved' ? YEL : GRN, servicedHere: sel.servicedHere },
      gallery: GALLERY.map(g => ({ t: sel.short + ' — ' + g, ph: PH })), galleryCount: GALLERY.length + 1, resShot: sel.name + ' — reserved for Rennan',
      toggleInvHist: () => this.setState({ invHistOpen: !s.invHistOpen }), invHistOpen: !!s.invHistOpen, invHistLabel: s.invHistOpen ? 'Hide' : 'See history', invHist: invHistRows,
      selSpecs: [{ k: 'Vehicle', v: sel.name }, { k: 'Mileage', v: sel.miles.toLocaleString('en-US') + ' miles' }, { k: 'Drivetrain', v: sel.drive }, { k: 'Exterior', v: sel.color }, { k: 'Interior', v: sel.interior }],
      toggleVin: () => this.setState({ vinShown: !s.vinShown }), vinLabel: s.vinShown ? sel.fullVin : sel.vin + '  Show', vinColor: s.vinShown ? '#fff' : ACC,
      selHistory: [{ k: 'Service history', v: sel.servicedHere ? sel.servicedHere + ' documented services' : 'Records from previous shop' }, { k: 'Previous ownership', v: sel.owners + (sel.owners === 1 ? ' owner' : ' owners') }, { k: 'Accident history', v: sel.accidents }],
      tdLabel: t.done ? t.day + ' · ' + t.time : '', reserveCta: s.reserved && s.selId === sel.id ? 'View reservation' : 'Reserve this vehicle',
      goReserve: () => s.reserved && s.selId === sel.id ? this.setState({ view: 'reservation' }) : this.setState({ view: 'reserve', resStep: 0 }),
      rs0: s.resStep === 0, rs1: s.resStep === 1, rs2: s.resStep === 2, resNavTitle: ['Reserve', 'Checkout', 'Reserved'][s.resStep],
      resBack: () => s.resStep === 0 || s.resStep === 2 ? this.setState({ view: 'vehicle' }) : this.setState({ resStep: s.resStep - 1 }),
      resPayMethods: [['apple', 'Apple Pay', 'Face ID'], ['card', 'Debit / Credit Card', 'Visa ·· 4417']].map(m => ({ name: m[1], sub: m[2], pick: () => this.setState({ resPay: m[0] }), style: optRow(s.resPay === m[0]), radio: radio(s.resPay === m[0]) })),
      resCta: ['Continue · $250 today', 'Place $250 deposit', 'View reservation'][s.resStep],
      resNext: () => s.resStep === 0 ? this.setState({ resStep: 1 }) : s.resStep === 1 ? this.setState({ resStep: 2, reserved: true, resStatus: 1 }) : this.setState({ view: 'reservation' }),
      nextSteps: [['Reservation confirmed', 'Your vehicle is being held according to the reservation terms.'], ['Purchase review', 'A member of our team will contact you to finalize the purchase.'], ['Finalize financing or payment', ''], ['Complete paperwork', ''], ['Pick up your vehicle', '']].map((n, i) => ({
        i: i + 1, t: n[0], d: n[1],
        num: 'width:22px;height:22px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;' + (i === 0 ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.6);'),
        line: i === 4 ? 'display:none' : 'flex:1;width:1px;min-height:14px;margin-top:4px;background:rgba(235,235,245,.12)'
      })),
      resStatusLabel: ['Reserved', 'Reserved · Vehicle preparation', 'Purchase in progress', 'Pending paperwork', 'Ready for pickup'][Math.min(s.resStatus, 4)],
      resTimeline: RES_STEPS.map((n, i) => {
        const done = i < s.resStatus, cur = i === s.resStatus;
        return {
          name: n, state: done ? (i === 0 ? RES_STATE[0] : 'Complete') : cur ? 'In progress' : RES_STATE[i], color: cur ? '#fff' : done ? 'rgba(235,235,245,.7)' : 'rgba(235,235,245,.3)',
          dotStyle: cur ? 'width:11px;height:11px;border-radius:6px;background:' + ACC + ';box-shadow:0 0 0 4px rgba(224,49,43,.22)' : 'width:7px;height:7px;border-radius:4px;margin:2px;background:' + (done ? 'rgba(235,235,245,.5)' : 'rgba(235,235,245,.2)'),
          lineStyle: i === 4 ? 'display:none' : 'flex:1;width:1px;margin-top:6px;min-height:22px;background:' + (done ? 'rgba(235,235,245,.22)' : 'rgba(235,235,245,.09)')
        };
      }),
      td: t, tdDone: t.done, tdActive: !t.done,
      tdDays: ['Friday', 'Saturday', 'Sunday'].map(d => ({ label: d, pick: () => this.setState({ td: Object.assign({}, t, { day: d }) }), style: this.chip(t.day === d) })),
      tdTimes: ['10:00 AM', '11:30 AM', '2:00 PM'].map(x => ({ label: x, pick: () => this.setState({ td: Object.assign({}, t, { time: x }) }), style: 'padding:14px 0;border-radius:11px;text-align:center;font-size:12.5px;cursor:pointer;transition:all .2s ease;' + (t.time === x ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.85);') })),
      onTdDriver: e => this.setState({ td: Object.assign({}, t, { driver: e.target.value }) }),
      bookTd: () => this.setState({ td: Object.assign({}, t, { done: true }) }),
      askMsgs: (salesMsgs.length ? salesMsgs : [{ from: 'advisor', text: 'Hi Rennan — Jordan from sales. Ask anything about the ' + sel.short + '; I can see its full history from here.', time: 'Now' }]).map(m => {
        const me = m.from === 'customer';
        return { text: m.text, time: m.time, wrap: 'display:flex;flex-direction:column;align-items:' + (me ? 'flex-end' : 'flex-start') + ';max-width:84%;align-self:' + (me ? 'flex-end' : 'flex-start'), bubble: 'padding:10px 14px;border-radius:18px;font-size:13.5px;line-height:1.45;' + (me ? 'background:#fff;color:#000;border-bottom-right-radius:5px' : 'background:#1c1c1e;color:#fff;border-bottom-left-radius:5px'), timeStyle: 'font-size:10px;color:rgba(235,235,245,.3);margin:4px 10px 0' };
      }),
      askChips: [['Does this have FSD?', 'No FSD on this one \u2014 it has Enhanced Autopilot. FSD can be added through Tesla as a subscription.'], ['Has the battery ever been replaced?', 'No. Original pack, 18 records here show it at 94% of original capacity on the last check.'], ['Can I trade in my current car?', 'Yes \u2014 Quicksilver is already in our system. Tap Trade-in for an estimate; a firm number takes 20 minutes on site.'], ['Can I finance this?', 'Yes. We work with three local credit unions. Pre-approval takes about 10 minutes and doesn\u2019t affect your credit.']].map(q => ({ text: q[0], send: () => this.sendAsk(q[0], q[1]) })),
      askDraft: s.askDraft, onAskDraft: e => this.setState({ askDraft: e.target.value }), onAskKey: e => { if (e.key === 'Enter') this.sendAsk(s.askDraft); }, sendAsk: () => this.sendAsk(s.askDraft),
      tradeConds: ['Excellent', 'Good', 'Fair', 'Needs work'].map(c => ({ label: c, pick: () => this.setState({ trade: Object.assign({}, tr, { cond: c, result: false }) }), style: 'padding:15px 0;border-radius:12px;text-align:center;font-size:13px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (tr.cond === c ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.85);') })),
      tradeMiles: tr.miles, onTradeMiles: e => this.setState({ trade: Object.assign({}, tr, { miles: e.target.value, result: false }) }),
      tradeShots: ['Front', 'Side', 'Interior'].map((x, i) => ({ t: i < tr.photos ? x + ' · saved' : '+ ' + x, take: () => this.setState({ trade: Object.assign({}, tr, { photos: Math.max(tr.photos, i + 1) }) }), style: 'height:76px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;transition:all .2s ease;' + (i < tr.photos ? PH + 'color:#30d158;' : 'border:1px dashed rgba(235,235,245,.18);color:rgba(235,235,245,.5);') })),
      tradeResult: tr.result, runTrade: () => this.setState({ trade: Object.assign({}, tr, { result: true }) }),
      tradeRange: (() => { const m = parseInt(String(tr.miles).replace(/\D/g, ''), 10) || 52431; const mult = { Excellent: 1.06, Good: 1, Fair: 0.91, 'Needs work': 0.8 }[tr.cond] || 1; const mid = Math.round((31800 - Math.floor(m / 1000) * 58) * mult / 100) * 100; return fmt0(Math.round(mid * 0.96 / 100) * 100) + ' – ' + fmt0(Math.round(mid * 1.04 / 100) * 100); })(),
      updates: updates.map(u => ({ kind: u.kind, time: u.time, title: u.title, open: () => this.setState({ view: u.go, readStage: st }), style: 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:15px 16px;cursor:pointer;transition:background .2s ease;' + (u.unread ? 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);' : ''), dotStyle: 'width:6px;height:6px;border-radius:4px;background:' + (u.unread ? ACC : 'transparent') })),
      noUpdates: updates.length === 0, markRead: () => this.setState({ readStage: st }),
      accountRows: [{ t: 'Vehicles', d: I.car, v: String(myCars.length), go: this.go('garage') }, { t: 'Service history', d: I.clock, v: hist.length + ' visits', go: this.go('history') }, { t: 'Payment methods', d: I.credit, v: 'Apple Pay, Visa ·· 4417', go: this.go('pay') }, { t: 'Notifications', d: I.bell, v: ['push', 'text', 'email'].filter(k => (s.channels || { push: true, text: true })[k]).map(k => k[0].toUpperCase() + k.slice(1)).join(' + ') || 'Off', go: this.go('notifs') }, { t: 'Documents', d: I.folder, v: (3 + hist.length) + ' files', go: this.go('docs') }],
      pDocs: view === 'docs', pNotifs: view === 'notifs',
      docGroups: [
        { title: 'Quicksilver', items: [{ t: 'Title', m: 'Utah DMV · 2022', ext: 'PDF', go: () => {} }, { t: 'Insurance card', m: 'Bear River Mutual · exp. Mar 2027', ext: 'PDF', go: () => {} }, { t: 'Warranty', m: 'Tesla basic · through 50,000 mi (expired)', ext: 'PDF', go: () => {} }] },
        { title: 'Invoices & reports', items: hist.map(h => ({ t: h.title, m: h.date + ' · ' + (h.total ? fmt(h.total) : 'No charge'), ext: 'PDF', go: () => this.setState({ histId: h.id, view: 'histDetail' }) })) }
      ].concat(s.reserved ? [{ title: 'Reservation', items: [{ t: 'Reservation receipt · RES-20481', m: '$250 deposit · ' + sel.name, ext: 'PDF', go: this.go('reservation') }] }] : []),
      channels: [['push', 'Push notifications', 'Status changes, estimates, pickup'], ['text', 'Text messages', 'Backup when push is off or unread'], ['email', 'Email', 'Receipts and reports only']].map(c => {
        const ch = s.channels || { push: true, text: true, email: false }, on = !!ch[c[0]];
        return { t: c[1], m: c[2], toggle: () => this.setState({ channels: Object.assign({}, ch, { [c[0]]: !on }) }), track: 'width:44px;height:26px;border-radius:13px;padding:2px;transition:background .2s ease;background:' + (on ? GRN : 'rgba(235,235,245,.18)'), knob: 'width:22px;height:22px;border-radius:11px;background:#fff;transition:transform .2s ease;transform:translateX(' + (on ? 18 : 0) + 'px)' };
      }),
      showTabs: ['home', 'garage', 'service', 'shop', 'history', 'health', 'updates', 'account', 'reservation', 'docs', 'notifs', 'rewards'].indexOf(view) >= 0,
      tabs: tabDefs.map(tb => {
        const on = tb.match.indexOf(view) >= 0;
        return { label: tb.label, d: tb.d, badge: !!tb.badge, go: this.go(tb.id), glyphStyle: 'display:flex;transition:color .2s ease;color:' + (on ? '#fff' : 'rgba(235,235,245,.35)'), labelStyle: 'font-size:10px;transition:color .2s ease;color:' + (on ? '#fff' : 'rgba(235,235,245,.35)') };
      })
    });
    // ---- tires: quote + seasonal storage
    const tqLocked = tq.accepted || (tq.requested && !tq.sent);
    Object.assign(V, {
      pTires: view === 'tires', pStorage: view === 'storage', goTires: this.go('tires'), goStorage: this.go('storage'),
      tqPill: pill(tq.accepted ? GRN : tq.sent ? YEL : 'rgba(235,235,245,.45)'), tqStatus: tq.accepted ? 'Accepted · ' + tq.acceptedAt : tq.sent ? 'Quote from Tyler' : tq.requested ? 'Quote requested' : 'Estimated prices',
      tqTitle: tq.accepted ? 'New tires are on the way.' : tq.sent ? 'Three options for Quicksilver.' : 'Time to think about tires.',
      tqSub: tq.accepted ? '4× ' + tqOptR.name + ', installed ' + (inShop ? 'during today\u2019s visit.' : 'at your next visit.') + ' Nothing is charged until they\u2019re on the car.' : 'Front right tread measured 4/32" on Oct 5. ' + (tq.sent ? 'Tyler\u2019s quote is good for 30 days.' : 'Prices below are typical for your size; ask for a firm quote.'),
      tqLinkLabel: tq.accepted ? 'Accepted' : tq.sent ? 'See quote' : 'Get a quote',
      tqOpts: TIRES.rennan.opts.map(o => { const on = o.id === tq.tier, c = tqCalc(o); return { name: o.name, tier: o.tier, warranty: o.warranty, stock: o.stock, note: o.note, total: fmt0(Math.round(c.total)), stockColor: o.stock.indexOf('In stock') === 0 ? GRN : YEL, radio: radio(on) + 'flex:0 0 auto;margin-top:1px', pick: () => { if (!tq.accepted) this.setState({ tq: Object.assign({}, tq, { tier: o.id }) }); } }; }),
      tqToggleHazard: () => { if (!tq.accepted) this.setState({ tq: Object.assign({}, tq, { hazard: !tq.hazard }) }); },
      tqHazardPrice: fmt0(Math.round(tqOptR.each * 4 * 0.12)) + ' for the set.',
      tqHazTrack: 'width:44px;height:26px;border-radius:13px;padding:2px;flex:0 0 auto;transition:background .2s ease;background:' + (tq.hazard ? GRN : 'rgba(235,235,245,.18)'), tqHazKnob: 'width:22px;height:22px;border-radius:11px;background:#fff;transition:transform .2s ease;transform:translateX(' + (tq.hazard ? 18 : 0) + 'px)',
      tqRows: [{ k: '4 tires · ' + fmt0(tqOptR.each) + ' each', v: fmt0(tqCR.tires) }, { k: 'Mount, balance, TPMS, disposal', v: fmt0(tqCR.fees) }].concat(tq.hazard ? [{ k: 'Road hazard', v: fmt0(tqCR.haz) }] : []).concat([{ k: 'Tax', v: fmt(tqCR.tax) }]),
      tqScene: tq.accepted && st >= 7 ? 'new' : tq.accepted && st === 6 ? 'off' : 'on',
      tqTotal: fmt(tqCR.total),
      tqCta: tq.accepted ? 'Accepted · ' + fmt(tqCR.total) : tq.sent ? (inShop ? 'Add to today\u2019s visit · ' + fmt(tqCR.total) : 'Accept · ' + fmt(tqCR.total)) : tq.requested ? 'Quote requested · Tyler will reply' : 'Request a quote from RyGuys',
      tqCtaStyle: 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (tqLocked ? 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;' : 'background:#fff;color:#000;cursor:pointer;'),
      tqAccept: () => { if (tqLocked) return; if (tq.sent) { this.setState({ tq: Object.assign({}, tq, { accepted: true, acceptedAt: '9:52 AM' }), view: 'service' }); this.notify('Tires accepted. ' + (inShop ? 'Marcus will install them today.' : 'They\u2019ll be ready for your visit.')); } else { this.setState({ tq: Object.assign({}, tq, { requested: true }) }); this.notify('Quote requested. Tyler usually replies within the hour.'); } },
      swapPill: pill(swapBooked ? GRN : YEL), swapStatus: swapBooked ? 'Swap booked' : 'Swap season',
      storageRowsP: [{ k: 'Stored since', v: 'Apr 14, 2026' }, { k: 'Tread when stored', v: '8/32" · measured by Dana R.' }, { k: 'Size', v: '255/45R19' }, { k: 'Storage', v: '$12 / mo · paid through October' }, { k: 'Swap', v: swapBooked ? 'Sat, Oct 17 · 10:00 AM' : 'Not booked' }],
      swapCta: swapBooked ? 'Swap booked · Sat, Oct 17 · 10:00 AM' : 'Schedule winter swap',
      swapCtaStyle: 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (swapBooked ? 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;' : 'background:#fff;color:#000;cursor:pointer;'),
      bookSwap: () => { if (swapBooked) return; this.setState({ swap: true }); this.notify('Winter swap booked for Sat, Oct 17 at 10:00 AM. About 45 minutes.'); }
    });
    // ---- valet pickup & delivery
    const vl = s.valet || { step: 0, keys: 'Hand to driver', shots: 0 };
    const vlOk = vl.step !== 3 || vl.shots >= 4;
    Object.assign(V, {
      pValet: view === 'valet', vl0: vl.step === 0, vl12: vl.step === 1 || vl.step === 2, vl3: vl.step === 3,
      valetRows: [{ k: 'Pickup', v: 'Tomorrow · 8:30 – 9:00 AM' }, { k: 'Address', v: '145 Oak Ridge Dr, Manti UT' }, { k: 'Return', v: 'Same day, when the work is done' }, { k: 'Driver', v: 'Luis A. · RyGuys' }],
      valetKeys: ['Hand to driver', 'Leave in lockbox'].map(k => ({ label: k, pick: () => this.setState({ valet: Object.assign({}, vl, { keys: k }) }), style: 'padding:15px 0;border-radius:12px;text-align:center;font-size:13px;font-weight:600;cursor:pointer;transition:all .18s ease;' + (vl.keys === k ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.85);') })),
      valetKeyLabel: vl.keys, valetPill: pill(vl.step === 2 ? GRN : '#fff'), valetKicker: vl.step === 2 ? 'Driver arrived' : 'Driver on the way',
      valetTitle: vl.step === 2 ? 'Luis is outside.' : 'Luis is 12 minutes out.', valetSub: vl.step === 2 ? 'Meet him at the car for a quick handoff. It takes about two minutes.' : 'He’ll text when he turns onto Oak Ridge. You don’t need to wait outside.',
      valetEta: vl.step === 2 ? 'Arrived' : '12 min', valetMapPill: pill(vl.step === 2 ? GRN : '#fff'),
      valetCarStyle: 'position:absolute;width:10px;height:10px;border-radius:5px;background:#e0312b;box-shadow:0 0 0 5px rgba(224,49,43,.22);transition:left 2.6s cubic-bezier(.4,0,.2,1),top 2.6s cubic-bezier(.4,0,.2,1);left:' + (vl.step === 2 ? 'calc(78% - 5px)' : '14%') + ';top:' + (vl.step === 2 ? 'calc(66% - 5px)' : '22%'),
      valetSteps: [['Driver assigned', '8:12 AM'], ['On the way', '8:19 AM'], ['Arrived', vl.step >= 2 ? '8:31 AM' : 'Est. 8:31 AM'], ['Picked up', '']].map((x, i) => { const done = i < vl.step, cur = i === vl.step; return { name: x[0], time: x[1], color: cur ? '#fff' : done ? 'rgba(235,235,245,.7)' : 'rgba(235,235,245,.3)', dotStyle: cur ? 'width:11px;height:11px;border-radius:6px;background:' + ACC + ';box-shadow:0 0 0 4px rgba(224,49,43,.22)' : 'width:7px;height:7px;border-radius:4px;margin:2px;background:' + (done ? 'rgba(235,235,245,.5)' : 'rgba(235,235,245,.2)'), lineStyle: i === 3 ? 'display:none' : 'flex:1;width:1px;margin-top:6px;min-height:14px;background:' + (done ? 'rgba(235,235,245,.22)' : 'rgba(235,235,245,.09)') }; }),
      valetShots: ['Front', 'Driver side', 'Rear', 'Interior'].map((t, i) => ({ t: i < vl.shots ? t + ' · saved' : '+ ' + t, take: () => this.setState({ valet: Object.assign({}, vl, { shots: Math.max(vl.shots, i + 1) }) }), style: 'height:84px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;transition:all .2s ease;' + (i < vl.shots ? PH + 'color:#30d158;' : 'border:1px dashed rgba(235,235,245,.18);color:rgba(235,235,245,.5);') })),
      valetCta: vl.step === 0 ? 'Confirm pickup' : vl.step === 1 ? 'Driver on the way…' : vl.step === 2 ? 'Start handoff' : 'Complete handoff',
      valetCtaStyle: 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (vl.step !== 1 && vlOk ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      valetNext: () => { if (vl.step === 0) return this.valetGo(1); if (vl.step === 2) return this.valetGo(3); if (vl.step === 3 && vlOk) { this.setState({ view: 'service', valet: Object.assign({}, vl, { step: 4 }) }); this.setStage(1); } }
    });
    // ---- onboarding, health detail, rating, Care, Rewards
    const ob = s.onboard || { step: 0, phone: '', code: '', plate: '', name: '', found: false, searching: false };
    const setOb = patch => this.setState({ onboard: Object.assign({}, ob, patch) });
    const obDigits = (ob.phone || '').replace(/\D/g, '');
    const fmtPhone = d => d.length <= 3 ? d : d.length <= 6 ? '(' + d.slice(0, 3) + ') ' + d.slice(3) : '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6, 10);
    const obOk = ob.step === 0 || ob.step === 3 || (ob.step === 1 && obDigits.length >= 10) || (ob.step === 2 && ob.code.length === 6);
    const obLookup = () => { const plate = ob.plate || 'RYG 8A42'; this.setState({ onboard: Object.assign({}, ob, { plate, searching: true, found: false }) }); clearTimeout(this._obT); this._obT = setTimeout(() => this.setState({ onboard: Object.assign({}, this.state.onboard, { found: true, searching: false }) }), 900); };
    const brakesNew = st >= 8;
    const HDATA = {
      Tires: { big: '4', unit: '/32"', bigLabel: 'Lowest tread · front right', color: YEL, pos: [['Front left', '6', '/32"', GRN], ['Front right', '4', '/32"', YEL], ['Rear left', '7', '/32"', GRN], ['Rear right', '7', '/32"', GRN]], scale: { min: 0, max: 10, val: 4, zones: [[0, 3, RED], [3, 5, YEL], [5, 10, GRN]] }, histLabel: 'Front right tread', histRange: 'Last 4 visits', hist: [['Sep \u201925', 9], ['Jan \u201926', 7], ['May \u201926', 6], ['Today', 4]], max: 10, base: 0, means: 'New tires start around 10/32" and we recommend replacing at 3/32". Your front right is wearing a little faster than the rest, which is normal for this drivetrain. Rotating now evens that out and buys another season.', foot: 'Measured with a digital tread gauge at today\u2019s inspection.', cta: 'Schedule rotation', go: () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 0, need: 'Tires', err: '' }) }) },
      Brakes: { big: brakesNew ? '12' : '3', unit: 'mm', bigLabel: brakesNew ? 'Front pads · replaced today' : 'Front pads · lowest', color: brakesNew ? GRN : RED, pos: [['Front left', brakesNew ? '12' : '3', 'mm', brakesNew ? GRN : RED], ['Front right', brakesNew ? '12' : '3', 'mm', brakesNew ? GRN : RED], ['Rear left', '7', 'mm', GRN], ['Rear right', '7', 'mm', GRN]], scale: { min: 0, max: 12, val: brakesNew ? 12 : 3, zones: [[0, 3, RED], [3, 5, YEL], [5, 12, GRN]] }, histLabel: 'Front pad thickness', histRange: 'Last 4 visits', hist: [['Sep \u201925', 7], ['Jan \u201926', 5], ['May \u201926', 5], ['Today', brakesNew ? 12 : 3]], max: 12, base: 0, means: brakesNew ? 'New pads and rotors went on today and were bedded in on a road test. Expect 40,000 miles or more before the fronts need attention again.' : 'Pads start at about 12 mm and we recommend replacing at 3 mm. At 3 mm the backing plate is close to the rotor, which is the grinding you heard. Safe to drive today, but not for long.', foot: 'Pad thickness is measured at the thinnest point with a caliper.', cta: brakesNew ? '' : st === 4 ? 'Review estimate' : st < 4 ? 'See inspection' : '', go: this.go('findings') },
      Battery: { big: '94', unit: '%', bigLabel: 'High-voltage pack · capacity', color: GRN, pos: [['HV pack', '94', '%', GRN], ['12V battery', '12.6', 'V', GRN], ['Range at 100%', '308', 'mi', GRN], ['Charge cycles', '412', '', GRN]], scale: { min: 80, max: 100, val: 94, zones: [[80, 86, RED], [86, 90, YEL], [90, 100, GRN]] }, histLabel: 'Pack capacity', histRange: 'Last 4 visits', hist: [['Sep \u201925', 97], ['Jan \u201926', 96], ['May \u201926', 95], ['Today', 94]], max: 100, base: 84, means: 'A Model Y pack typically loses one to two percent a year. Yours is right on the curve. The 12V battery was replaced in September 2025 and tested strong today.', foot: 'Capacity is read from the vehicle at check-in. The 12V battery gets a load test.', cta: '', go: () => {} },
      Fluids: { big: 'Full', unit: '', bigLabel: 'Brake fluid, coolant, washer', color: GRN, pos: [['Brake fluid', 'Clear', '', GRN], ['Moisture', '1.2', '%', GRN], ['Coolant', 'Full', '', GRN], ['Washer', 'Full', '', GRN]], hist: [], means: 'Brake fluid absorbs moisture over time; above 3% we recommend a flush. Yours tested at 1.2%, so it is good for another year or two.', foot: 'Checked at every visit. Brake fluid moisture is measured with a test strip.', cta: '', go: () => {} },
      Filters: { big: 'Dirty', unit: '', bigLabel: 'Cabin air filter', color: YEL, pos: [['Cabin filter', 'Dirty', '', YEL], ['HEPA filter', 'OK', '', GRN]], hist: [], means: 'The cabin filter is getting dirty. It affects the air you breathe, not safety. ' + (st >= 5 && s.inclMonitor ? 'It is being replaced on this visit.' : 'Easy to add to any visit; it takes about ten minutes.'), foot: 'Inspected visually. Tesla recommends replacing every two years.', cta: st >= 5 && s.inclMonitor ? '' : st === 4 ? 'Add to this visit' : 'Book replacement', go: st === 4 ? this.go('approve') : () => this.setState({ view: 'book', book: Object.assign({}, s.book, { step: 0, need: 'Maintenance', err: '' }) }) },
      Alignment: { big: '0.1°', unit: '', bigLabel: 'Front toe · within spec', color: GRN, pos: [['Front toe', '0.1°', '', GRN], ['Rear toe', '0.0°', '', GRN], ['Camber left', '\u22120.8°', '', GRN], ['Camber right', '\u22120.7°', '', GRN]], hist: [], means: 'All four measurements are inside Tesla\u2019s specification. Even tire wear across each axle confirms it.', foot: 'Last measured on the alignment rack in May 2026.', cta: '', go: () => {} }
    };
    const hdSrc = HDATA[s.healthId] || HDATA.Brakes;
    const hdSc = hdSrc.scale, scX = v => ((v - hdSc.min) / (hdSc.max - hdSc.min) * 100).toFixed(2) + '%';
    const setRt = p => this.setState({ rating: Object.assign({}, rt, p) });
    const careBill = s.careBill || 'month', careSel = s.careSel || 'plus', careSelTier = TIERS.find(t => t.id === careSel);
    Object.assign(V, {
      pOnboard: view === 'onboard', ob0: ob.step === 0, ob1: ob.step === 1, ob2: ob.step === 2, ob3: ob.step === 3,
      obDots: [1, 2, 3].map(i => ({ style: 'height:3px;flex:1;border-radius:2px;transition:background .3s ease;background:' + (i <= ob.step ? '#fff' : 'rgba(235,235,245,.14)') })),
      obPhone: fmtPhone(obDigits), onObPhone: e => setOb({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) }), obPhoneLabel: fmtPhone(obDigits),
      obCode: ob.code, onObCode: e => setOb({ code: e.target.value.replace(/\D/g, '').slice(0, 6) }),
      obCodeBoxes: [0, 1, 2, 3, 4, 5].map(i => ({ v: ob.code[i] || '', style: 'height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:var(--data-font,inherit);font-size:22px;font-weight:500;background:#141416;transition:box-shadow .15s ease;box-shadow:inset 0 0 0 1px ' + (i === ob.code.length ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.08)') })),
      obAutofill: () => this.typeCode('428316'),
      obPlate: ob.plate, onObPlate: e => setOb({ plate: e.target.value.toUpperCase().slice(0, 8), found: false, searching: false }), obPlateLabel: ob.plate || 'your plate', obLookup,
      obSearching: ob.searching && !ob.found, obFound: ob.found, obName: ob.name, onObName: e => setOb({ name: e.target.value }),
      ob3Cta: ob.found ? 'Add to my garage' : 'Look up vehicle',
      obCtaStyle: 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (obOk ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      obNext: () => { if (!obOk) return; if (ob.step < 3) return setOb({ step: ob.step + 1 }); if (!ob.found) return obLookup(); this.finishOnboard(ob.name || 'Quicksilver'); },
      obSkip: () => this.finishOnboard(''),
      pHealthDetail: view === 'healthDetail',
      hdt: { name: s.healthId || 'Brakes', big: hdSrc.big, unit: hdSrc.unit, bigLabel: hdSrc.bigLabel, color: hdSrc.color, pos: hdSrc.pos.map(p => ({ n: p[0], v: p[1], u: p[2], c: p[3] })), hasHist: hdSrc.hist.length > 0, histLabel: hdSrc.histLabel || '', histRange: hdSrc.histRange || '',
        hist: hdSrc.hist.map((b, i, arr) => ({ d: b[0], v: String(b[1]), style: 'width:100%;max-width:44px;border-radius:4px 4px 1px 1px;transition:height .5s ease;height:' + Math.max(4, Math.round((b[1] - (hdSrc.base || 0)) / (hdSrc.max - (hdSrc.base || 0)) * 86)) + 'px;background:' + (i === arr.length - 1 ? hdSrc.color : 'rgba(235,235,245,.2)') })),
        means: hdSrc.means, foot: hdSrc.foot, cta: hdSrc.cta, go: hdSrc.go, hasScale: !!hdSc,
        scene: { Brakes: 'brake', Tires: 'tire', Battery: 'battery' }[s.healthId || 'Brakes'] || '', phase: { Brakes: 'worn', Tires: tq.accepted && st >= 7 ? 'new' : 'on', Battery: 'pass' }[s.healthId || 'Brakes'] || '', params: (s.healthId || 'Brakes') === 'Brakes' ? '{"pad":' + (brakesNew ? 12 : 3) + '}' : '{}',
        zones: hdSc ? hdSc.zones.map(z => ({ style: 'flex:0 0 ' + ((z[1] - z[0]) / (hdSc.max - hdSc.min) * 100).toFixed(2) + '%;height:100%;background-image:repeating-linear-gradient(90deg,' + z[2] + ' 0 1px,transparent 1px 4px);opacity:.8' })) : [],
        needle: hdSc ? 'position:absolute;left:' + scX(hdSc.val) + ';top:-6px;bottom:-6px;width:2px;margin-left:-1px;background:#fff;border-radius:1px;box-shadow:0 0 0 2px #000;transition:left .6s cubic-bezier(.3,.9,.3,1)' : '',
        scaleLabels: hdSc ? [hdSc.min].concat(hdSc.zones.map(z => z[1])).map(v => ({ t: String(v), style: 'position:absolute;left:' + scX(v) + ';transform:translateX(-50%);font-family:var(--data-font,inherit);font-size:10.5px;color:rgba(235,235,245,.45)' })) : [] },
      pRate: view === 'rate', rateSent: rt.sent, rateOpen: !rt.sent, goRate: this.go('rate'),
      stars: [1, 2, 3, 4, 5].map(i => ({ pick: () => setRt({ stars: i }), style: 'cursor:pointer;transition:transform .15s ease;transform:scale(' + (i <= rt.stars ? 1.1 : 1) + ')', path: i <= rt.stars ? 'fill:#ffd60a;stroke:#ffd60a;stroke-width:1.2px;stroke-linejoin:round' : 'fill:none;stroke:rgba(235,235,245,.3);stroke-width:1.4px;stroke-linejoin:round' })),
      starLabel: STAR_LABELS[rt.stars],
      rateTags: ['Clear photos', 'Fair price', 'Fast', 'Kept me updated', 'Clean car', 'Loaner was easy'].map(t => { const on = rt.tags.indexOf(t) >= 0; return { label: t, pick: () => setRt({ tags: on ? rt.tags.filter(x => x !== t) : rt.tags.concat(t) }), style: this.chip(on) }; }),
      tips: [0, 5, 10, 20].map(v => ({ label: v ? '$' + v : 'No tip', pick: () => setRt({ tip: v }), style: 'padding:14px 0;border-radius:12px;text-align:center;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .18s ease;' + (rt.tip === v ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.85);') })),
      rateNote: rt.note, onRateNote: e => setRt({ note: e.target.value }),
      rateCta: rt.tip ? 'Send rating · $' + rt.tip + ' tip' : 'Send rating',
      rateCtaStyle: 'text-align:center;padding:15px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (rt.stars ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      sendRating: () => { if (!rt.stars) return; setRt({ sent: true }); this.notify(rt.tip ? 'Thanks, Rennan. $' + rt.tip + ' is on its way to Marcus.' : 'Thanks, Rennan. Your rating went to the team.'); },
      rateThanks: 'Your ' + rt.stars + '-star rating' + (rt.tip ? ' and $' + rt.tip + ' tip went straight to Marcus.' : ' went to Marcus and the team.') + ' 100 points were added to Rewards.',
      pCare: view === 'care', careJoined: !!care, careOpen: !care,
      careBills: [['month', 'Monthly'], ['year', 'Yearly · 2 months free']].map(b => ({ label: b[1], pick: () => this.setState({ careBill: b[0] }), style: 'padding:7px 13px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (careBill === b[0] ? 'background:#fff;color:#000;' : 'color:rgba(235,235,245,.6);') })),
      careTiers: TIERS.map(t => ({ name: t.name, price: '$' + (careBill === 'month' ? t.m : t.y), per: careBill === 'month' ? '/mo' : '/yr', perks: t.perks.map(p => ({ t: p })), pick: () => this.setState({ careSel: t.id }), style: CARD + ';padding:18px 18px 16px;cursor:pointer;transition:box-shadow .18s ease;' + (careSel === t.id ? 'box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.9);' : '') })),
      careCta: 'Join ' + careSelTier.name + ' · $' + (careBill === 'month' ? careSelTier.m + '/mo' : careSelTier.y + '/yr'),
      joinCare: () => { this.setState({ care: { tier: careSel, bill: careBill } }); this.notify('Welcome to RyGuys Care. Your first rotation is on us.'); },
      careTierName: careTier ? careTier.name : '', careDoneSub: careTier ? 'Billed $' + (care.bill === 'month' ? careTier.m + ' monthly' : careTier.y + ' yearly') + ' to Apple Pay. Your next rotation is already covered.' : '', carePerks: careTier ? careTier.perks.map(p => ({ t: p })) : [],
      pRewards: view === 'rewards', points: points.toLocaleString('en-US'), toNext: rewardsTier === 'Gold' ? 'Gold member' : (2000 - points).toLocaleString('en-US') + ' to Gold',
      tierBar: 'height:100%;width:' + Math.min(100, Math.round(points / 2000 * 100)) + '%;background:#fff;border-radius:2px;transition:width .5s ease',
      redeems: REDEEMS.map(r => { const on = !!RW.redeemed[r.id], can = points >= r.cost || on; return { v: r.v, cost: r.cost.toLocaleString('en-US') + ' pts', state: on ? 'Applied to next visit' : can ? 'Tap to apply' : (r.cost - points).toLocaleString('en-US') + ' more pts', sc: on ? GRN : can ? '#fff' : 'rgba(235,235,245,.35)', pick: () => { if (!can) return; const red = Object.assign({}, RW.redeemed); if (on) delete red[r.id]; else red[r.id] = true; this.setState({ rewards: Object.assign({}, RW, { redeemed: red }) }); }, style: CARD + ';padding:16px;transition:all .18s ease;cursor:' + (can ? 'pointer' : 'default') + ';opacity:' + (can ? 1 : .55) + ';' + (on ? 'box-shadow:inset 0 0 0 1.5px ' + GRN + ';' : '') }; }),
      shareRef: () => { this.setState({ rewards: Object.assign({}, RW, { shared: RW.shared + 1 }) }); this.notify('Referral link copied. Share it anywhere.'); }, shareLabel: RW.shared ? 'Copied' : 'Share',
      refCount: RW.shared > 0, refNote: 'Link copied. Points land when your friend checks in for their first visit.',
      earnRows: [['Service', '1 pt per $1'], ['Approve an estimate in the app', '+200'], ['Rate a visit', '+100'], ['Refer a friend', '+500']].map(r => ({ k: r[0], v: r[1] })),
      pointsLog: [st >= 9 && s.histPaid ? ['Front brake service', 'Today', '+545'] : null, rt.sent ? ['Rated your visit', 'Today', '+100'] : null, st >= 5 ? ['Approved estimate in the app', 'Today', '+200'] : null, ['Tire rotation', 'May 12', '+40'], ['Inspection', 'Jan 4', '+40'], ['Cabin filter + 12V battery', 'Sep 20, 2025', '+184'], ['Welcome bonus', 'Mar 2024', '+500']].filter(Boolean).map(r => ({ t: r[0], d: r[1], v: r[2] }))
    });
    const cat = CATS.find(c => c.n === s.cat) || CATS[1];
    const tf = s.form || Object.assign({}, cat.def);
    const jobId = s.job || 'rennan', live = jobId === 'rennan';
    const jk = c => (live ? '' : jobId + ':') + c.n;
    const inspAllDone = live ? (st >= 3 || CATS.every(c => s.inspDone[c.n])) : CATS.every(c => s.inspDone[jk(c)]);
    const catDone = c => live ? (st >= 3 || !!s.inspDone[c.n]) : !!s.inspDone[jk(c)];
    const doneCount = CATS.filter(catDone).length;
    const bay1Color = s.needInfo && st <= 7 ? YEL : s.partsDelayed && st >= 5 && st <= 6 ? YEL : st === 4 ? YEL : st >= 8 ? GRN : ACC;
    const bay1Text = s.needInfo && st <= 7 ? 'Waiting on customer reply' : s.partsDelayed && st >= 5 && st <= 6 ? 'Waiting for parts · ETA ' + PETA.arrive : BAY1[st];
    const JOBS = {
      rennan: { car: '2022 Tesla Model Y', who: 'Rennan Anderson', miles: '52,431', meta: 'VIN ···· 8A42 · Bay 0' + rBay + ' · WO-8842', concern: 'I\u2019m hearing a grinding noise when braking.', status: bay1Text, color: bay1Color, visit: s.checkin.visit || 'Drop off', loaner: s.loaner === 'active' ? 'Model Y out · VIN 4821' : s.loaner === 'reserved' ? 'Reserved' : s.loaner === 'returned' ? 'Returned' : 'None', paint: myPaint, live: true },
      sarah: { car: '2021 Toyota 4Runner', who: 'Sarah Mitchell', miles: '61,220', meta: 'VIN ···· 3K19 · Bay 02 · WO-8839', concern: 'Tires are loud and the steering wheel shakes above 60.', status: 'Waiting for approval', color: YEL, visit: 'Wait', loaner: 'None', paint: '#17181b', live: false, note: 'Estimate for four tires sent 2:20 PM · $1,248.20. Inspection is complete; you can still add findings.' },
      james: { car: '2020 Honda CR-V', who: 'James Lee', miles: '71,800', meta: 'VIN ···· 7P02 · Bay 03 · WO-8845', concern: 'Just want it looked over before a road trip.', status: 'Not started · arriving 3:00 PM', color: 'rgba(235,235,245,.5)', visit: 'Drop off', loaner: 'None', paint: '#8d908f', live: false, note: 'Vehicle hasn\u2019t arrived. You can pre-stage the checklist now.' }
    };
    const job = Object.assign({ dot: dotOf(JOBS[jobId].color) }, JOBS[jobId]);
    const bigBtn = (on, c) => 'padding:18px 0;border-radius:14px;text-align:center;font-size:15px;font-weight:500;cursor:pointer;transition:all .15s ease;' + (on ? 'background:' + c + ';color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.8);');
    const condColor = { Good: GRN, Monitor: YEL, Replace: RED, 'Needs attention': RED };
    const qc = s.qc || {}, qcDone = QC_ITEMS.filter(q => qc[q.id]).length, qcAll = qcDone === QC_ITEMS.length;
    const repair = st === 3 ? { t: 'Inspection complete', sub: 'Send the report so Tyler can build the estimate.', cta: '', dot: YEL }
      : st === 4 ? { t: 'Waiting for approval', sub: 'Estimate sent to Rennan at 9:41 AM · $489.32', cta: '', dot: YEL }
      : (st === 5 || st === 6) && s.partsDelayed ? { t: 'Waiting for parts', sub: 'Rotors from ' + PETA.supplier + ' · ETA ' + PETA.arrive + '. Rennan has been told and his loaner was extended.', cta: '', dot: YEL, parts: true }
      : st === 5 ? { t: 'Approved · $489.32', sub: 'Rennan approved at 9:49 AM. Parts pulled to Bay 01.', cta: 'Start repair', dot: GRN, parts: true }
      : st === 6 ? { t: 'Repair in progress', sub: 'Started 10:05 AM · Front brake pads + rotors', cta: 'Mark complete', dot: ACC, parts: true }
      : st === 7 ? { t: 'Quality check', sub: qcDone + ' of ' + QC_ITEMS.length + ' checks passed · Luis A. verifying', cta: 'Open quality check', dot: ACC }
      : st === 8 ? { t: 'Ready for pickup', sub: 'Rennan notified 2:48 PM. Park in Bay 4.', cta: '', dot: GRN }
      : st === 9 ? { t: 'Paid · awaiting pickup', sub: s.pickup === 2 ? 'Rennan is here.' : s.pickup === 1 ? 'Rennan is on the way.' : 'Paid $545.23 in the app.', cta: 'Release vehicle', dot: GRN }
      : { t: 'Picked up', sub: 'Released 3:20 PM. Work order closed.', cta: '', dot: 'rgba(235,235,245,.4)' };
    Object.assign(V, {
      padNav: [['today', 'Today', I.list], ['job', 'Bay 0' + rBay, I.wrench], ['report', 'Report', I.doc]].map(n => ({
        label: n[1], d: n[2], go: this.tgo(n[0]),
        style: 'width:60px;padding:10px 0;border-radius:12px;text-align:center;cursor:pointer;transition:all .18s ease;' + ((s.tView === n[0] || (n[0] === 'job' && (s.tView === 'inspect' || s.tView === 'photo' || s.tView === 'qc' || s.tView === 'oil'))) ? 'background:#1c1c1e;color:#fff;' : 'color:rgba(235,235,245,.4);')
      })),
      tOil: s.tView === 'oil', oilPhase, oilVisc: ['0W-20', '5W-20', '5W-30', '10W-30'].map(v => ({ label: v, pick: () => this.setOil({ visc: v }), style: this.chip(oil.visc === v) + 'flex:1;text-align:center;padding:13px 0;font-size:14px;' })),
      oilTypes: ['Full synthetic', 'Synthetic blend'].map(v => ({ label: v, pick: () => this.setOil({ type: v }), style: this.chip(oil.type === v) + 'flex:1;text-align:center;padding:13px 0;font-size:14px;' })),
      oilQts: oil.qts.toFixed(1), oilQtsDown: () => this.setOil({ qts: Math.max(0, +(oil.qts - .1).toFixed(1)) }), oilQtsUp: () => this.setOil({ qts: +(oil.qts + .1).toFixed(1) }),
      oilTorque: String(oil.torque), oilTorqueDown: () => this.setOil({ torque: Math.max(0, oil.torque - 1) }), oilTorqueUp: () => this.setOil({ torque: oil.torque + 1 }),
      oilTorqueColor: oil.torque === 30 ? GRN : Math.abs(oil.torque - 30) <= 2 ? YEL : RED, oilQtsColor: Math.abs(oil.qts - 6.2) < .05 ? GRN : Math.abs(oil.qts - 6.2) <= .3 ? YEL : RED,
      oilFilter: oil.filter, onOilFilter: e => this.setOil({ filter: e.target.value }),
      oilSteps: ['Drain', 'Filter', 'Fill', 'Record'].map((t, i) => ({ t: t + ' · ' + ['Pull plug, let it run dry, new crush washer', 'Spin off the old filter, oil the gasket, hand-tight plus ¾', 'Fill to spec, run 30 s, check level and leaks', 'Reset maintenance light, sticker, record'][i], time: oil.step > i ? OIL_TIMES[i] : '', c: oil.step > i ? GRN : oil.step === i ? '#fff' : 'rgba(235,235,245,.4)', dot: 'width:9px;height:9px;border-radius:5px;flex:0 0 auto;background:' + (oil.step > i ? GRN : oil.step === i ? ACC : 'rgba(235,235,245,.18)') + (oil.step === i ? ';box-shadow:0 0 0 4px rgba(224,49,43,.22)' : '') })),
      oilCta: ['Pull drain plug', 'Drained · install filter', 'Filter on · start fill', 'Filled · record on WO-8851', 'Recorded · Rennan notified'][oil.step], oilNext: () => this.oilNext(),
      oilCtaStyle: 'text-align:center;padding:17px 0;border-radius:14px;font-size:15px;font-weight:500;transition:all .2s ease;' + (oil.step < 4 ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(48,209,88,.16);color:#30d158;cursor:default;'),
      oilStatusLabel: oilStatus, oilStatusColor: oilColor,
      oilCustomerText: oil.step === 0 ? 'Nothing yet. The record fills in as you work.' : (oil.step >= 1 ? 'We drained the old oil' : '') + (oil.step >= 2 ? ', installed a new Toyota filter (' + oil.filter + ') and torqued the drain plug to ' + oil.torque + ' lb-ft with a new washer' : '') + (oil.step >= 3 ? ', then filled ' + oil.qts.toFixed(1) + ' quarts of ' + oil.type.toLowerCase() + ' ' + oil.visc : '') + '. ' + (oil.step >= 4 ? 'Next change: 66,840 mi or April 2027, whichever comes first.' : ''),
      tToday: s.tView === 'today', tJob: s.tView === 'job', tInspect: s.tView === 'inspect', tPhoto: s.tView === 'photo', tReport: s.tView === 'report', tQC: s.tView === 'qc',
      qcProgress: qcDone + '/' + QC_ITEMS.length,
      qcItems: QC_ITEMS.map(q => { const on = !!qc[q.id]; return { name: q.name, spec: q.spec, value: q.value, unit: q.unit, on, vc: on ? GRN : '#fff', toggle: () => this.setState(p => { const cur = p.qc || {}; return { qc: Object.assign({}, cur, { [q.id]: !cur[q.id] }) }; }), style: CARD + ';padding:18px 20px;cursor:pointer;transition:all .18s ease;' + (on ? 'border-color:rgba(48,209,88,.35);' : ''), box: 'width:28px;height:28px;border-radius:14px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;transition:all .2s ease;' + (on ? 'background:#30d158;color:#000;' : 'border:1px solid rgba(235,235,245,.25);') }; }),
      qcNote: qcAll ? 'All checks passed. Passing notifies Rennan that Quicksilver is ready and parks it in Bay 4.' : 'Tap each check as you complete it. Torque values are recorded on the work order.',
      qcPassStyle: 'padding:14px 22px;border-radius:12px;font-size:14px;font-weight:600;white-space:nowrap;transition:all .2s ease;' + (qcAll ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      qcPass: () => { if (!qcAll || st !== 7) return; this.setState({ tView: 'job' }); this.setStage(8); },
      qcFail: () => { this.setState({ tView: 'job', qc: {} }); if (st === 7) this.setStage(6); this.askCustomer('Quick note from the bay: QC caught a slight pull under hard braking, so Marcus is rechecking the caliper slides before we hand it back. Still on for today.'); },
      tgoToday: this.tgo('today'), tgoJob: this.tgo('job'), tgoReport: this.tgo('report'), tgoInspect: this.tgo('inspect'), tgoPhoto: this.tgo('photo'),
      padStats: [{ n: '4', l: 'Assigned' }, { n: st >= 3 ? '1' : '0', l: 'Inspected' }, { n: st === 4 ? '2' : '1', l: 'Waiting approval' }],
      bays: [
        { bay: 'Bay 01', car: '2022 Tesla Model Y', who: 'Rennan Anderson', job: 'Brake service', status: BAY1[st], color: bay1Color, live: true, shot: 'Quicksilver on the lift' },
        { bay: 'Bay 02', car: '2021 Toyota 4Runner', who: 'Sarah Mitchell', job: 'Tire replacement', status: 'Waiting for approval', color: YEL, shot: '4Runner, wheels off' },
        { bay: 'Bay 03', car: '2020 Honda CR-V', who: 'James Lee', job: 'Inspection', status: 'Not started', color: 'rgba(235,235,245,.4)', shot: 'CR-V, arriving' },
        { bay: 'Bay 04', car: '2019 Toyota Tacoma', who: 'Rennan Anderson', job: 'Oil change · 1:30 PM', status: oilStatus, color: oilColor, oil: true, live: oilLive && !oilDone, shot: 'Tacoma · oil change' }
      ].map((b, i) => ({
        bay: i === 0 ? 'Bay 0' + rBay : b.bay, car: b.car, who: b.who, job: b.job, status: i === 0 ? bay1Text : b.status, color: b.color, pill: pill(b.color) + ';max-width:55%', shot: b.shot, ph: PH, go: () => b.oil ? this.setState({ tView: 'oil' }) : this.setState({ job: ['rennan', 'sarah', 'james'][i], tView: 'job' }),
        scene: b.oil ? 'oil' : i === 0 && st >= 5 && st <= 8 ? 'brake' : '', phase: b.oil ? oilPhase : brakePhase, noScene: !(b.oil || (i === 0 && st >= 5 && st <= 8)),
        dot: 'width:9px;height:9px;border-radius:5px;background:' + b.color + (b.live && st >= 1 && st <= 7 ? ';box-shadow:0 0 0 4px rgba(224,49,43,.22)' : ''),
        style: 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px 20px;cursor:pointer;transition:background .2s ease;' + (b.live ? 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.1);' : '')
      })),
      releaseReady: st === 9 && s.pickup === 2, releaseVehicle: () => this.setStage(10),
      job, needInfo: s.needInfo, otherJobNote: live ? '' : job.note,
      askChipsTech: [['Does it happen cold?', 'Quick question from the bay: does the grinding happen mostly when the car is cold, or all the time?'], ['Any pull when braking?', 'Quick question from the bay: do you feel the car pull left or right when you brake hard?']].map(q => ({ text: q[0], send: () => this.askCustomer(q[1]) })),
      inspProgress: doneCount + ' of ' + CATS.length + ' complete',
      inspCats: CATS.map(c => {
        const done = catDone(c);
        const worst = c.n === 'Brakes' ? 'Replace' : c.n === 'Tires' ? 'Monitor' : 'Good';
        const saved = Object.keys(s.saved).filter(k => k.indexOf(jk(c) + ':') === 0).length;
        return {
          name: c.n, on: done, d: { Tires: I.tire, Brakes: I.brake, Suspension: I.spring, Steering: I.steer, Fluids: I.drop, Battery: I.battery, Lights: I.light }[c.n], sub: done ? (live ? worst : 'Good') : saved ? saved + ' of ' + c.pos.length + ' saved' : c.pos.length > 1 ? c.pos.length + ' positions' : 'Tap to inspect',
          subColor: done ? (live ? (condColor[worst] || GRN) : GRN) : 'rgba(235,235,245,.4)',
          go: () => { if (!live || st >= 1) this.setState({ cat: c.n, pos: saved < c.pos.length ? saved : 0, form: Object.assign({}, live ? c.def : { m: c.n === 'Tires' ? 7 : 8, cond: 'Good', rotor: 'Good', note: '' }), tView: 'inspect', photoAdded: s.photoAdded && live && c.n === 'Brakes' }); },
          style: 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px;min-height:96px;cursor:pointer;transition:all .18s ease;' + (done ? 'box-shadow:inset 0 0 0 1px rgba(48,209,88,.25);' : ''),
          box: 'width:26px;height:26px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .2s ease;' + (done ? 'background:#30d158;color:#000;' : 'border:1px solid rgba(235,235,245,.25);color:transparent;')
        };
      }),
      reportReady: live && inspAllDone && st <= 3 && st >= 2, reportSent: live && st >= 4, needsStartInsp: live && st === 1,
      startInspection: () => this.setStage(2),
      sendReport: () => { if (st < 4) this.setStage(4); },
      repairTitle: repair.t, repairSub: repair.sub, repairCta: repair.cta, showParts: !!repair.parts,
      partsPill: pill(s.partsDelayed ? YEL : GRN), partsPillText: s.partsDelayed ? 'Waiting · ' + PETA.arrive : 'In stock',
      partsList: [
        { name: 'Brake pads · front', sku: 'Tesla 1044621-00-D', status: 'Pulled to Bay 0' + rBay, c: GRN, cta: '', go: () => {} },
        { name: 'Rotors · front pair', sku: 'Tesla 1044641-00-B', status: s.partsDelayed ? 'Ordered · ' + PETA.supplier + ' · ' + PETA.arrive : s.partsOrdered === 'wp' ? 'Courier · today 1:30 PM' : s.partsOrdered === 'received' ? 'Received · Bay 0' + rBay : 'Pulled to Bay 0' + rBay, c: s.partsDelayed ? YEL : GRN, cta: st <= 6 ? (s.partsDelayed ? 'Mark received' : s.orderOpen ? 'Cancel' : 'Reorder') : '', go: () => s.partsDelayed ? this.setParts(SUPPLIERS[0], true) : this.setState({ orderOpen: !s.orderOpen }) }
      ].map(p => Object.assign(p, { dot: dotOf(p.c) })),
      orderOpen: !!s.orderOpen,
      suppliers: SUPPLIERS.map(x => ({ name: x.name, eta: x.eta, price: x.price, c: x.delay ? (x.delay.extraDays > 1 ? RED : YEL) : GRN, pick: () => this.setParts(x), style: CARD + ';padding:14px 16px;cursor:pointer;transition:background .18s ease' })),
      repairDot: 'width:10px;height:10px;border-radius:5px;background:' + repair.dot + ';box-shadow:0 0 0 4px ' + ({ [GRN]: 'rgba(48,209,88,.18)', [YEL]: 'rgba(255,214,10,.18)', [ACC]: 'rgba(224,49,43,.22)', [RED]: 'rgba(224,49,43,.22)' }[repair.dot] || 'rgba(235,235,245,.08)'),
      repairGo: () => { if (st === 5) this.setStage(6); else if (st === 6) this.setStage(7); else if (st === 7) this.setState({ tView: 'qc' }); else if (st === 9) this.setStage(10); },
      catName: cat.n, posName: cat.pos[Math.min(s.pos, cat.pos.length - 1)],
      posDots: cat.pos.map((p, i) => ({ l: p.split(' ').map(w => w[0]).join('').toUpperCase(), style: 'width:34px;height:34px;border-radius:17px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;transition:all .2s ease;' + (i === s.pos ? 'background:#fff;color:#000;' : s.saved[jk(cat) + ':' + i] ? 'background:rgba(48,209,88,.2);color:#30d158;' : 'background:#1c1c1e;color:rgba(235,235,245,.4);') })),
      hasPsi: cat.n === 'Tires', placard: 42, tfPsi: tf.psi == null ? 36 : tf.psi,
      decP: () => this.setState({ form: Object.assign({}, tf, { psi: Math.max(0, (tf.psi == null ? 36 : tf.psi) - 1), set: false }) }),
      incP: () => this.setState({ form: Object.assign({}, tf, { psi: (tf.psi == null ? 36 : tf.psi) + 1, set: false }) }),
      setPlacard: () => this.setState({ form: Object.assign({}, tf, { psi: 42, set: true }) }),
      placardLabel: tf.set ? 'Set at 42' : 'Set to 42',
      placardStyle: 'padding:0 18px;height:64px;border-radius:16px;display:flex;align-items:center;font-size:14px;font-weight:600;cursor:pointer;transition:all .18s ease;white-space:nowrap;' + (tf.set ? 'background:rgba(48,209,88,.16);color:#30d158;' : 'background:#fff;color:#000;'),
      tpms: ['OK', 'Low battery', 'Fault'].map(c => ({ label: c, pick: () => this.setState({ form: Object.assign({}, tf, { tpms: c }) }), style: bigBtn((tf.tpms || 'OK') === c, c === 'OK' ? GRN : c === 'Low battery' ? YEL : RED) })),
      tireJob: live && tq.accepted, tireJobName: '4× ' + tqOptR.name, tireJobSub: 'Accepted by Rennan at ' + tq.acceptedAt + ' · ' + fmt(tqCR.total) + ' installed' + (tq.hazard ? ' · road hazard' : ''), tireJobState: inStockR ? 'Pulled from stock' : tqOptR.stock, tireJobPill: pill(inStockR ? GRN : YEL),
      hasMeasure: !!cat.unit, measureLabel: cat.n === 'Brakes' ? 'Pad thickness' : 'Tread depth', unit: cat.unit || '', tfM: tf.m,
      inspScene: { Brakes: 'brake', Tires: 'tire', Battery: 'battery' }[cat.n] || '', inspPhase: cat.n === 'Battery' ? 'load' : cat.n === 'Tires' ? 'on' : 'worn', inspParams: cat.n === 'Brakes' ? '{"pad":' + (tf.m || 0) + '}' : '{}',
      qcScene: qc.batt ? 'pass' : 'load',
      decM: () => this.setState({ form: Object.assign({}, tf, { m: Math.max(0, (tf.m || 0) - 1), cond: this.autoCond(cat, Math.max(0, (tf.m || 0) - 1), tf.cond) }) }),
      incM: () => this.setState({ form: Object.assign({}, tf, { m: (tf.m || 0) + 1, cond: this.autoCond(cat, (tf.m || 0) + 1, tf.cond) }) }),
      conds: ['Good', 'Monitor', cat.unit ? 'Replace' : 'Needs attention'].map(c => ({ label: c, pick: () => this.setState({ form: Object.assign({}, tf, { cond: c }) }), style: bigBtn(tf.cond === c, condColor[c]) })),
      hasRotor: !!cat.rotor, rotors: ['Good', 'Resurface', 'Replace'].map(c => ({ label: c, pick: () => this.setState({ form: Object.assign({}, tf, { rotor: c }) }), style: bigBtn(tf.rotor === c, c === 'Good' ? GRN : c === 'Resurface' ? YEL : RED) })),
      tfNote: tf.note || '', onTfNote: e => this.setState({ form: Object.assign({}, tf, { note: e.target.value }) }),
      photoAdded: s.photoAdded && cat.n === 'Brakes', noPhoto: !(s.photoAdded && cat.n === 'Brakes'),
      photoTileStyle: 'margin-top:10px;height:200px;border-radius:16px;position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s ease;' + (s.photoAdded && cat.n === 'Brakes' ? PH : 'border:1px dashed rgba(235,235,245,.22);color:rgba(235,235,245,.8);'),
      savedHint: s.pos < cat.pos.length - 1 ? 'Saving advances to ' + cat.pos[s.pos + 1] + '.' : 'Saving completes ' + cat.n + ' and returns to the checklist.',
      saveLabel: s.pos < cat.pos.length - 1 ? 'Save · next ' + cat.pos[s.pos + 1].split(' ').map(w => w[0]).join('').toUpperCase() : 'Save · complete ' + cat.n,
      saveInsp: () => {
        const saved = Object.assign({}, s.saved, { [jk(cat) + ':' + s.pos]: tf });
        if (s.pos < cat.pos.length - 1) {
          const nextDef = live ? Object.assign({}, cat.def, cat.n === 'Brakes' && s.pos >= 1 ? { m: 7, cond: 'Good', rotor: 'Good', note: '' } : {}) : Object.assign({}, tf, { note: '' });
          this.setState({ saved, pos: s.pos + 1, form: nextDef });
        } else {
          const inspDone = Object.assign({}, s.inspDone, { [jk(cat)]: true });
          this.setState({ saved, inspDone, tView: 'job', form: null });
          if (live && CATS.every(c => inspDone[c.n]) && st === 2) setTimeout(() => this.setStage(3), 300);
        }
      },
      photoModes: [['photo', 'Photo'], ['video', 'Video']].map(m => ({ label: m[1], pick: () => this.setState({ photoMode: m[0] }), style: 'padding:6px 12px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;' + (s.photoMode === m[0] ? 'background:#fff;color:#000;' : 'color:rgba(235,235,245,.6);') })),
      marks: s.marks.map(k => ({ glyph: k.tool === 'arrow' ? '➜' : k.tool === 'note' ? 'Worn' : '', style: 'position:absolute;left:' + k.x + '%;top:' + k.y + '%;transform:translate(-50%,-50%);pointer-events:none;' + (k.tool === 'circle' ? 'width:84px;height:84px;border:3px solid #e0312b;border-radius:50%;' : k.tool === 'arrow' ? 'font-size:40px;color:#e0312b;transform:translate(-50%,-50%) rotate(-30deg);' : 'background:#e0312b;color:#fff;font-size:12px;font-weight:500;padding:5px 9px;border-radius:7px;') })),
      markHint: s.marks.length ? s.marks.length + (s.marks.length === 1 ? ' markup' : ' markups') + ' · tap to add more' : 'Tap anywhere to ' + (s.tool === 'circle' ? 'circle' : s.tool === 'arrow' ? 'point at' : 'label') + ' the wear',
      addMark: e => { const r = e.currentTarget.getBoundingClientRect(); this.setState({ marks: s.marks.concat({ x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100), tool: s.tool }) }); },
      tools: [['circle', '○ Circle'], ['arrow', '➜ Arrow'], ['note', 'Aa Note']].map(x => ({ label: x[1], pick: () => this.setState({ tool: x[0] }), style: 'padding:13px 16px;border-radius:12px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s ease;' + (s.tool === x[0] ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.8);') })),
      clearMarks: () => this.setState({ marks: [] }),
      addToReport: () => this.setState({ photoAdded: true, tView: 'inspect', marks: s.marks.length ? s.marks : [{ x: 44, y: 40, tool: 'circle' }] }),
      reportCards: FINDINGS.map(f => ({ tier: f.tier, name: f.name, price: f.price ? fmt(f.price) : '$0', plain: estNotes[f.id] || f.plain, tech: f.tech, meas: f.meas, shot: 'Technician photo', ph: PH, dot: dotOf(f.color) }))
    });
    const pendingSvc = s.thread.some(m => m.from === 'customer' && m.pending);
    const pendingSales = s.salesThread.some(m => m.from === 'customer' && m.pending);
    const approvalsCount = st === 4 ? 2 : 1;
    const rennanWait = st === 4 ? { who: 'Rennan Anderson', car: 'Tesla Model Y · WO-8842', total: '$545.23', wait: 'Waiting 8 min', waitColor: YEL, id: 'rennan', kicker: 'Waiting for approval', kColor: YEL } : st === 3 ? { who: 'Rennan Anderson', car: 'Tesla Model Y · WO-8842', total: '—', wait: 'Inspection done 9:37', waitColor: YEL, id: 'rennan', kicker: 'Build estimate', kColor: YEL } : null;
    const sarah = { who: 'Sarah Mitchell', car: 'Toyota 4Runner · WO-8839', total: '$1,248.20', wait: 'Waiting 21 min', waitColor: RED, id: 'sarah', kicker: 'Waiting for approval', kColor: YEL };
    const james = { who: 'James Lee', car: 'Honda CR-V · WO-8845', total: '$0.00', wait: 'Inspection not started', waitColor: 'rgba(235,235,245,.4)', id: 'james', kicker: 'Queued', kColor: 'rgba(235,235,245,.4)' };
    const queueAll = (rennanWait ? [rennanWait] : []).concat([sarah, james]);
    const estId = s.estOpen || (rennanWait ? 'rennan' : 'sarah');
    const EST = {
      rennan: { wo: 'WO-8842', who: 'Rennan Anderson', car: '2022 Tesla Model Y · Quicksilver · 52,431 mi', total: '$545.23', lines: [{ k: 'Front brake pads + rotors', v: '$489.32', c: RED }, { k: 'Tire rotation', v: '$0.00', c: YEL }, { k: 'Cabin air filter (declined by default)', v: '$65.00', c: GRN }, { k: 'Supplies + tax', v: '$55.91', c: 'rgba(235,235,245,.3)' }], note: st === 4 ? 'Sent 9:41 AM with 4 photos. Rennan opened it at 9:43.' : st >= 5 ? 'Approved by Rennan at 9:49 AM in the app. No phone call needed.' : 'Not sent yet. Inspection in progress in Bay 01.', cta: st === 3 ? 'Build estimate' : 'Send a gentle reminder', canRemind: st === 4 || st === 3 },
      sarah: { wo: 'WO-8839', who: 'Sarah Mitchell', car: '2021 Toyota 4Runner · 61,220 mi', total: '$1,248.20', lines: [{ k: 'Four tires · Michelin Defender LTX', v: '$1,096.00', c: RED }, { k: 'Mount, balance, TPMS', v: '$80.00', c: RED }, { k: 'Alignment check', v: '$0.00', c: YEL }, { k: 'Supplies + tax', v: '$72.20', c: 'rgba(235,235,245,.3)' }], note: 'Sent 2:20 PM. Opened twice, not approved yet.', cta: 'Send a gentle reminder', canRemind: false },
      james: { wo: 'WO-8845', who: 'James Lee', car: '2020 Honda CR-V · 71,800 mi', total: '—', lines: [{ k: 'Multi-point inspection', v: '$0.00', c: 'rgba(235,235,245,.3)' }], note: 'Vehicle arriving 3:00 PM. Estimate is built after the inspection.', cta: '', canRemind: false }
    };
    const inboxItems = [
      { id: 'rennan', who: 'Rennan Anderson', initials: 'RA', context: 'Quicksilver · 2022 Tesla Model Y · WO-8842', time: '9:40 AM', section: pendingSvc ? 'Needs response' : st === 4 ? 'Waiting for approval' : 'General', color: pendingSvc ? RED : st === 4 ? YEL : GRN, preview: pendingSvc ? s.thread.filter(m => m.pending).slice(-1)[0].text : allMsgs.length ? allMsgs[allMsgs.length - 1].text : '', msgs: allMsgs, state: BAY1[st], stateColor: bay1Color, placeholder: 'Reply to Rennan' },
      { id: 'sales', who: 'Rennan Anderson · Sales', initials: 'RA', context: 'Asking about: ' + sel.name + ' · ' + fmt0(sel.price), time: 'Now', section: pendingSales ? 'Needs response' : 'General', color: pendingSales ? RED : GRN, preview: s.salesThread.length ? s.salesThread[s.salesThread.length - 1].text : 'No questions yet', msgs: s.salesThread, state: s.reserved ? 'Reserved · RES-20481' : 'Browsing', stateColor: s.reserved ? ACC : 'rgba(235,235,245,.5)', placeholder: 'Reply about the ' + sel.short, hide: !s.salesThread.length },
      { id: 'sarah', who: 'Sarah Mitchell', initials: 'SM', context: '2021 Toyota 4Runner · WO-8839', time: '2:22 PM', section: 'Waiting for approval', color: YEL, preview: 'Estimate approval pending.', msgs: [{ from: 'advisor', text: 'Hi Sarah, your estimate for four tires is ready in the app \u2014 $1,248.20 with photos of the tread.', time: '2:20 PM' }, { from: 'customer', text: 'Thanks, looking now.', time: '2:22 PM' }], state: 'Waiting for approval', stateColor: YEL, placeholder: 'Reply to Sarah' },
      { id: 'james', who: 'James Lee', initials: 'JL', context: '2020 Honda CR-V · WO-8845', time: '1:05 PM', section: 'Completed', color: GRN, preview: 'Pickup confirmed.', msgs: [{ from: 'customer', text: 'I\u2019ll drop it at 3.', time: '1:04 PM' }, { from: 'advisor', text: 'Perfect, Bay 03 is yours. Pickup confirmed for 5:30.', time: '1:05 PM' }], state: 'Arriving 3:00 PM', stateColor: 'rgba(235,235,245,.5)', placeholder: 'Reply to James' }
    ].filter(x => !x.hide);
    const dThreadSrc = inboxItems.find(x => x.id === s.dSel) || inboxItems[0];
    const bubble = m => { const adv = m.from === 'advisor'; return { text: m.text, time: m.time, wrap: 'display:flex;flex-direction:column;align-items:' + (adv ? 'flex-end' : 'flex-start') + ';max-width:70%;align-self:' + (adv ? 'flex-end' : 'flex-start'), bubble: 'padding:10px 14px;border-radius:16px;font-size:13.5px;line-height:1.45;' + (adv ? 'background:#fff;color:#000;border-bottom-right-radius:5px' : 'background:rgba(255,255,255,.08);color:#fff;border-bottom-left-radius:5px'), timeStyle: 'font-size:10px;color:rgba(235,235,245,.3);margin:4px 10px 0' }; };
    const inboxEntry = x => ({ who: x.who, time: x.time, preview: x.preview, open: () => this.setState({ dSel: x.id }), dot: dotOf(x.color), style: 'display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:12px;cursor:pointer;transition:background .18s ease;' + (dThreadSrc.id === x.id ? 'background:#1c1c1e;' : 'background:transparent;') });
    const dSet = TIRES[tq.veh] || TIRES.rennan, dTier = tq.veh === 'rennan' ? tq.tier : (tq.tierS || 'better');
    const dStatus = tq.veh !== 'rennan' ? ['Draft', 'rgba(235,235,245,.5)'] : tq.accepted ? ['Accepted · ' + tqOptR.tier + ' · ' + tq.acceptedAt, GRN] : tq.sent ? ['Sent ' + tq.sentAt + ' · waiting', YEL] : tq.requested ? ['Requested by Rennan', YEL] : ['Draft', 'rgba(235,235,245,.5)'];
    const tqSend = () => { this.setState({ tq: Object.assign({}, tq, { veh: 'rennan', sent: true, sentAt: '9:46 AM', requested: true }) }); this.notify('Tyler sent you a tire quote for Quicksilver. Three options.'); };
    const dNavDefs = [['overview', 'Overview'], ['schedule', 'Schedule'], ['appointments', 'Appointments'], ['customers', 'Customers'], ['fleet', 'Fleet'], ['approvals', 'Approvals', approvalsCount], ['followups', 'Follow-ups', FOLLOWUPS.filter(f => (!f.live || (st >= 5 && !s.inclMonitor)) && !(s.fu || {})[f.id]).length], ['inbox', 'Inbox', inboxItems.filter(x => x.section === 'Needs response').length], ['technicians', 'Technicians'], ['parts', 'Parts'], ['oil', 'Oil', TANKS.some(t => tankPct(t) < 30 && !oil.reorder) ? 1 : 0], ['tires', 'Tires', tq.requested && !tq.sent ? 1 : 0], ['loaners', 'Loaners'], ['sales', 'Sales', s.reserved ? 1 : 0], ['analytics', 'Reports'], ['settings', 'Settings']];
    const built = ['overview', 'checkin', 'schedule', 'estimate', 'tires', 'approvals', 'inbox', 'sales', 'loaners', 'analytics', 'appointments', 'customers', 'customer', 'parts', 'technicians', 'settings', 'followups', 'fleet', 'oil'];
    const bay1Label = s.needInfo && st <= 7 ? 'Technician needs more information' : s.partsDelayed && st >= 5 && st <= 6 ? 'Waiting for parts' : BAY1[st];
    const POLICY = { applied: 'Your $250 reservation deposit is applied toward the purchase price of the vehicle when you complete the purchase, as specified in the final purchase agreement.', refundable: 'Your $250 reservation deposit is fully refundable for 3 days from the time it is placed. After that it is applied toward the purchase price, as specified in the final purchase agreement.', nonrefundable: 'Your $250 reservation deposit is non-refundable and holds the vehicle for 7 days. It is applied toward the purchase price when you complete the purchase, as specified in the final purchase agreement.' };
    const policyText = POLICY[s.policy] || 'Your $250 reservation deposit will be handled according to the dealership\u2019s published reservation policy. The deposit will be [applied toward the purchase price / refundable / non-refundable] as specified by the final purchase agreement.';
    const CUSTOMERS = [
      { id: 'rennan', name: 'Rennan Anderson', vehicles: myCars.length, visits: hist.length, last: 'Today', ltv: fmt0(184 + (s.histPaid ? 545 : 0)), meta: 'Member since 2024 · Manti, UT · ' + (s.reserved ? 'Reservation RES-20481' : 'Service customer'), cars: myCars.map(c => ({ n: c.sub.split(' · ')[0], s: c.name })), visitsList: hist.slice(0, 3).map(h => ({ t: h.title, d: h.date.replace(', 2026', '').replace(', 2025', ' ’25') })) },
      { id: 'sarah', name: 'Sarah Mitchell', vehicles: 1, visits: 6, last: 'Today', ltv: '$2,140', meta: 'Member since 2023 · Ephraim, UT', cars: [{ n: '2021 Toyota 4Runner', s: '61,220 mi' }], visitsList: [{ t: 'Tires (in progress)', d: 'Today' }, { t: 'Oil + rotation', d: 'Jun' }, { t: 'Brake inspection', d: 'Feb' }] },
      { id: 'james', name: 'James Lee', vehicles: 1, visits: 2, last: 'Today', ltv: '$0', meta: 'New this year · Manti, UT', cars: [{ n: '2020 Honda CR-V', s: '71,800 mi' }], visitsList: [{ t: 'Inspection', d: 'Today' }, { t: 'Inspection', d: 'Apr' }] },
      { id: 'dale', name: 'Dale Christensen', vehicles: 2, visits: 19, last: 'Today', ltv: '$6,810', meta: 'Member since 2019 · Gunnison, UT', cars: [{ n: '2018 Ford F-150', s: '142,300 mi' }, { n: '2015 Jeep Wrangler', s: '98,100 mi' }], visitsList: [{ t: 'Plugs + coils', d: 'Today' }, { t: 'Front hubs', d: 'Aug' }, { t: 'Oil', d: 'May' }] },
      { id: 'priya', name: 'Priya Nair', vehicles: 1, visits: 4, last: 'Today', ltv: '$1,320', meta: 'Member since 2024 · Manti, UT', cars: [{ n: '2019 Subaru Outback', s: '88,400 mi' }], visitsList: [{ t: 'CVT cooler (waiting parts)', d: 'Today' }, { t: 'Tires', d: 'Mar' }] },
      { id: 'elena', name: 'Elena Park', vehicles: 1, visits: 1, last: 'Sep 12', ltv: '$0', meta: 'Test drive booked · Sales lead', cars: [{ n: '2017 Subaru Forester', s: 'Trade-in' }], visitsList: [{ t: 'Trade-in estimate', d: 'Sep' }] }
    ];
    const cust = CUSTOMERS.find(c => c.id === s.dCust) || CUSTOMERS[0];
    const apptToday = [
      { time: '8:00 AM', who: 'Dale Christensen', car: 'Ford F-150', job: 'Plugs + coils', visit: 'Drop off', status: 'Complete', color: GRN },
      { time: '9:00 AM', who: 'Priya Nair', car: 'Subaru Outback', job: 'CVT cooler', visit: 'Loaner', status: 'Waiting parts · ETA Thu', color: YEL },
      { time: '9:30 AM', who: 'Rennan Anderson', car: 'Tesla Model Y', job: 'Brake inspection', visit: s.checkin.visit || 'Drop off', status: bay1Label, color: bay1Color },
      { time: '10:30 AM', who: 'Sarah Mitchell', car: 'Toyota 4Runner', job: 'Tire replacement', visit: 'Wait', status: 'Waiting for approval', color: YEL },
      { time: '1:30 PM', who: 'Rennan Anderson', car: 'Toyota Tacoma · Dusty', job: 'Oil change', visit: 'Wait', status: oilStatus, color: oilColor },
      { time: '3:00 PM', who: 'James Lee', car: 'Honda CR-V', job: 'Inspection', visit: 'Drop off', status: 'Arriving', color: 'rgba(235,235,245,.5)' }
    ];
    for (const w of (s.walkins || [])) apptToday.push({ time: w.time, who: w.who, car: w.car, job: w.job + ' · walk-in', visit: w.visit, status: 'Checked in · Bay 0' + w.bay, color: ACC });
    const apptFuture = s.booked ? [{ time: s.booked.time, who: 'Rennan Anderson', car: 'Tesla Model Y', job: (s.booked.need || 'Service') + ' · booked in app', visit: s.booked.visit || 'Drop off', status: 'Booked', color: ACC, day: s.booked.day }] : [];
    const apptDay = s.apptDay || 'Today';
    const fleetAppts = FLEETS.reduce((acc, a) => acc.concat(a.units.filter(u => (s.fleetBooked || {})[u.k]).map(u => ({ time: '8:00 AM', who: a.name + ' · Unit ' + u.unit, car: u.veh, job: u.due, visit: 'Fleet drop-off', status: 'Booked · fleet', color: ACC }))), []);
    const appts = (apptDay === 'Today' ? apptToday : apptFuture.filter(a => a.day === (apptDay === 'Tomorrow' ? 'Tomorrow' : apptDay))).concat(apptDay === 'Wednesday' ? [{ time: '8:00 AM', who: 'Tom Hadley', car: 'Toyota 4Runner', job: 'Pre-purchase inspection', visit: 'Wait', status: 'Booked', color: ACC }].concat(fleetAppts) : []);
    const resStatusLabel = ['Reserved', 'Vehicle preparation', 'Purchase review', 'Pending paperwork', 'Ready for pickup'][Math.min(s.resStatus, 4)];
    const repRange = s.repRange || '31 days', repData = repRange === '7 days' ? REV31.slice(-7) : repRange === '12 months' ? [38200, 41800, 36900, 44100, 47300, 45200, 49800, 52400, 50100, 53700, 51200, 51340] : REV31, repMax = Math.max.apply(null, repData) * 1.1;
    const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], hl = hr => ((hr - 8) / 10 * 100).toFixed(2) + '%', drag = s.drag;
    const fmtH = hr => { const h12 = ((Math.floor(hr) + 11) % 12) + 1, m = Math.round((hr % 1) * 60); return h12 + (m ? ':' + (m < 10 ? '0' : '') + m : '') + (hr >= 12 ? ' PM' : ' AM'); };
    const CAR_PAINT = { 'Toyota 4Runner': '#17181b', 'Honda CR-V': '#8d908f', 'Ford F-150': '#e4e4e2', 'Subaru Outback': '#5c7f8b', 'Subaru Forester': '#7d8a80', 'Jeep Wrangler': '#2f4f3a' };
    const isRen = cust.id === 'rennan', car0n = cust.cars[0].n, carKey = Object.keys(CAR_PAINT).find(k => car0n.indexOf(k) >= 0);
    const custCar = isRen ? { name: '2022 Tesla Model Y', sub: 'Quicksilver · 52,431 mi · VIN 7SAYGDEE0NF108A42', paint: myPaint,
        pills: [{ t: 'Serviced here · ' + hist.length + ' visits', style: pill(GRN) }].concat(inShop ? [{ t: bay1Label, style: pill(bay1Color) }] : []).concat(care ? [{ t: 'Care ' + careTier.name, style: pill(GRN) }] : []).concat(s.loaner === 'active' ? [{ t: 'Loaner out · ' + lv.short, style: pill('#fff') }] : []).concat(s.reserved ? [{ t: 'Reserved · ' + sel.short, style: pill(YEL) }] : []),
        specs: [['Trim', 'Long Range AWD'], ['Exterior', 'Quicksilver'], ['Interior', 'Black'], ['Battery', '94% capacity'], ['Tires', 'Michelin PS EV 255/45R19'], ['Front pads', st >= 8 ? '12 mm · new' : '3 mm'], ['Plate', 'UT · RYG 8A42'], ['Warranty', 'Battery through 2030'], ['Last visit', 'Today']].map(x => ({ k: x[0], v: x[1] })) }
      : { name: car0n, sub: cust.cars[0].s + (cust.cars[1] ? ' · also ' + cust.cars[1].n : ''), paint: CAR_PAINT[carKey] || '#8d908f', pills: [{ t: cust.visits > 2 ? 'Serviced here · ' + cust.visits + ' visits' : 'New customer', style: pill(cust.visits > 2 ? GRN : 'rgba(235,235,245,.5)') }].concat(cust.visitsList[0] && cust.visitsList[0].d === 'Today' ? [{ t: cust.visitsList[0].t, style: pill(YEL) }] : []), specs: [['Mileage', cust.cars[0].s], ['Vehicles', String(cust.vehicles)], ['Visits', String(cust.visits)], ['Lifetime', cust.ltv], ['Last visit', cust.last], ['Payment', 'Card on file']].map(x => ({ k: x[0], v: x[1] })) };
    const custHist = isRen ? hist.map(x => ({ date: x.date.replace(', 2026', ''), title: x.title, notes: x.notes, miles: x.miles + ' mi', total: x.total ? fmt(x.total) : 'No charge' })) : cust.visitsList.map(v => ({ date: v.d, title: v.t, notes: '', miles: '—', total: '—' }));
    const custHealth = isRen ? health : [['Tires', 'Good', GRN], ['Brakes', 'Good', GRN], ['Battery', 'Good', GRN], ['Fluids', 'Good', GRN], ['Filters', 'Monitor', YEL], ['Alignment', 'Not measured', 'rgba(235,235,245,.3)']].map(x => ({ name: x[0], status: x[1], dot: dotOf(x[2]) }));
    const custPrefs = (isRen ? [['Contact', 'Push + text · quiet 9 PM – 7 AM'], ['Loaner', 'Tesla preferred · phone key'], ['Approvals', 'In-app · averages 8 min'], ['Payment', 'Apple Pay · Visa ·· 4417'], ['Care plan', care ? careTier.name + ' · ' + (care.bill === 'month' ? 'monthly' : 'yearly') : 'None'], ['Rewards', rewardsTier + ' · ' + points.toLocaleString('en-US') + ' pts']] : [['Contact', 'Text'], ['Loaner', 'None on file'], ['Approvals', 'By phone'], ['Payment', 'Card on file']]).map(x => ({ k: x[0], v: x[1] }));
    const custDocs = isRen ? [{ t: 'Title', m: 'Utah DMV · 2022' }, { t: 'Insurance card', m: 'Bear River Mutual · exp. Mar 2027' }].concat(hist.map(x => ({ t: x.title + ' · invoice', m: x.date }))).concat(rn.signed ? [{ t: 'Loaner agreement LN-3107', m: 'Signed ' + rn.signedAt }] : []) : [{ t: 'Insurance card', m: 'On file' }, { t: 'Last invoice', m: cust.last }];
    // Follow-ups: declined or deferred work. Rennan's cabin filter appears once he approves without it.
    const fuAll = FOLLOWUPS.filter(f => !f.live || (st >= 5 && !s.inclMonitor)), fuS = s.fu || {}, fuTab = s.fuTab || 'Open';
    const fuRowsAll = fuAll.map(f => {
      const stt = fuS[f.id] || 'open';
      const status = stt === 'reminded' ? (f.live ? 'Reminded · in app' : 'Reminded · text') : stt === 'snoozed' ? 'Snoozed · Nov 4' : stt === 'done' ? 'Closed' : 'Open · ' + f.age;
      const sc = stt === 'reminded' ? YEL : stt === 'snoozed' ? 'rgba(235,235,245,.5)' : stt === 'done' ? GRN : f.color;
      return { cust: f.cust, car: f.car, item: f.item, wo: f.wo, tier: f.tier, declined: f.declined, reason: f.reason, price: fmt0(f.price), dot: dotOf(f.color), status, statusPill: pill(sc), stt, value: f.price,
        canRemind: stt === 'open' || stt === 'snoozed', canSnooze: stt === 'open', canDone: stt !== 'done',
        remind: () => this.fuSet(f, 'reminded'), snooze: () => this.fuSet(f, 'snoozed'), done: () => this.fuSet(f, 'done'),
        style: 'display:grid;grid-template-columns:1.25fr 1.5fr .9fr .55fr 1.35fr 1fr 196px;gap:14px;padding:16px 0;border-bottom:1px solid rgba(235,235,245,.07);font-size:13px;align-items:center;transition:opacity .2s ease;opacity:' + (stt === 'done' ? .45 : 1) };
    });
    const fuRows = fuRowsAll.filter(r => fuTab === 'All' || (fuTab === 'Open' ? r.stt === 'open' : r.stt === 'reminded'));
    const fuOpen = fuRowsAll.filter(r => r.stt === 'open');
    // Fleet accounts
    const fb = s.fleetBooked || {}, flSrc = FLEETS.find(a => a.id === s.fleetSel) || FLEETS[0];
    const flDue = a => a.units.filter(u => u.c === RED && !u.state && !fb[u.k]).length, flShop = a => a.units.filter(u => u.state).length;
    const flSent = (s.fleetStmt || {})[flSrc.id];
    // Recall check (sample data)
    const rc = s.recall, rcRows = rc === 'done' ? (RECALLS[cust.id] || []) : [], vinLabel = isRen ? 'VIN 7SAYGDEE0NF108A42' : 'VIN on file';
    // Bay progress shared by the Overview floor cards and the lobby board
    const renEta = st >= 10 ? ['Picked up', '3:20 PM', 'rgba(235,235,245,.5)'] : st >= 8 ? ['Ready now', 'Bay 0' + rBay + (st >= 9 ? ' · paid' : ' · pay in the app'), GRN] : st >= 5 ? [s.partsDelayed ? PETA.estShort.replace(/^\w/, ch => ch.toUpperCase()) : '3:00 PM', s.partsDelayed ? 'Parts arrive ' + PETA.arrive : 'Estimated', '#fff'] : st >= 3 ? ['—', 'After approval · about 5 h', '#fff'] : st >= 1 ? ['~3:00 PM', 'Estimated after inspection', '#fff'] : ['9:30 AM', 'Arriving', '#fff'];
    const PROG = { 'Bay 01': [st * 10, renEta[0]], 'Bay 02': [40, 'After approval'], 'Bay 03': [0, '5:30 PM'], 'Bay 04': oilLive ? [oil.step * 25, oilDone ? 'Ready now' : '1:55 PM'] : [100, 'Ready now'], 'Bay 05': [55, 'Thursday'] };
    Object.assign(V, {
      sideNav: (LAUNCH === 'loaners' ? [dNavDefs.find(n => n[0] === 'loaners')].concat(dNavDefs.filter(n => n[0] !== 'loaners')) : dNavDefs).map(n => ({ label: n[1], preview: LAUNCH === 'loaners' && n[0] !== 'loaners', divider: LAUNCH === 'loaners' && n[0] === 'overview', d: { overview: I.grid, tires: I.tire, schedule: I.clock, appointments: I.calendar, customers: I.users, approvals: I.checkc, inbox: I.inbox, technicians: I.wrench, parts: I.box, loaners: I.key, sales: I.tag, analytics: I.chart, settings: I.sliders, followups: I_FU, fleet: I_FLEET, oil: I.drop }[n[0]] || I.grid, count: n[2] ? String(n[2]) : '', go: this.dgo(n[0]), countStyle: 'font-size:11px;font-weight:500;padding:2px 7px;border-radius:7px;background:' + (n[0] === 'inbox' && n[2] ? RED : 'rgba(235,235,245,.12)') + ';color:#fff', style: 'display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;font-size:13px;cursor:pointer;transition:background .18s ease;' + (s.dView === n[0] ? 'background:#1c1c1e;color:#fff;font-weight:500;' : 'color:rgba(235,235,245,' + (built.indexOf(n[0]) >= 0 ? '.7' : '.4') + ');') })),
      dOverview: s.dView === 'overview', dApprovals: s.dView === 'approvals', dInbox: s.dView === 'inbox', dSales: s.dView === 'sales', dLoaners: s.dView === 'loaners', dAnalytics: s.dView === 'analytics', dEmpty: built.indexOf(s.dView) < 0,
      dCheckin: s.dView === 'checkin', dAppointments: s.dView === 'appointments', dCustomers: s.dView === 'customers', dParts: s.dView === 'parts', dTechs: s.dView === 'technicians', dSettings: s.dView === 'settings',
      dSchedule: s.dView === 'schedule', dCustomer: s.dView === 'customer', dEstimate: s.dView === 'estimate', dTires: s.dView === 'tires', dFollowups: s.dView === 'followups', dFleet: s.dView === 'fleet', dOil: s.dView === 'oil',
      bulkPhase: oil.step === 3 ? 'fill' : oil.step >= 4 ? 'full' : 'idle',
      tanks: TANKS.map(t => { const p = tankPct(t), c = p < 30 ? RED : p < 45 ? YEL : GRN; return { grade: t[0], use: t[1], pct: p + '%', c, gal: Math.round(p / 100 * t[3]) + ' of ' + t[3] + ' gal', note: p < 30 ? (oil.reorder && t[0] === '5W-30' ? 'Ordered · Thu' : 'Below reorder') : p < 45 ? 'Order this month' : 'OK', ruler: ruler(p, c, 10) }; }),
      oilToday: [{ who: 'Dale Christensen', car: '2018 Ford F-150', spec: '7.7 qt 5W-30', bay: 'Bay 04 · 8:40 AM', status: 'Complete', c: GRN }, { who: 'Rennan Anderson', car: '2019 Toyota Tacoma · Dusty', spec: oil.qts.toFixed(1) + ' qt ' + oil.visc, bay: 'Bay 04 · 1:30 PM', status: oilStatus, c: oilColor }, { who: 'Skyline Plumbing · V1', car: '2022 Ram ProMaster', spec: '6.0 qt 5W-20', bay: 'Wed · 8:00 AM', status: 'Booked · fleet', c: ACC }],
      oilFilters: OIL_FILTERS.map(f => ({ part: f[0], fits: f[1], n: String(f[2] - (f[0] === oil.filter && oil.step >= 2 ? 1 : 0)), c: f[2] <= 6 ? YEL : '#fff' })),
      reorderText: oil.reorder ? '5W-30 bulk · 55 gal ordered from Valvoline. Delivery Thursday morning.' : '5W-30 is at 28%, below the 30% reorder line. Valvoline delivers Thursday if ordered today.', reorderCta: oil.reorder ? 'Ordered · arrives Thu' : 'Order 5W-30 · 55 gal', reorderGo: () => { if (!oil.reorder) this.setOil({ reorder: true }); },
      reorderStyle: 'margin-top:14px;text-align:center;padding:12px 0;border-radius:10px;font-size:13px;font-weight:600;transition:all .2s ease;' + (oil.reorder ? 'background:rgba(48,209,88,.16);color:#30d158;cursor:default;' : 'background:#fff;color:#000;cursor:pointer;'),
      lobbyScene: oilLive && !oilDone ? 'oil' : 'brake', lobbyScenePhase: oilLive && !oilDone ? oilPhase : brakePhase, lobbyLiveBay: oilLive && !oilDone ? 'Live · Bay 04 · Rennan A.' : 'Live · Bay 01 · Rennan A.', lobbyLiveTitle: oilLive && !oilDone ? oilStatus : bay1Label, lobbyLiveSub: oilLive && !oilDone ? 'Oil change · ' + oilSpec + ' · ready about 1:55 PM' : 'Front brake pads and rotors · ' + (renEta[0] === '—' ? renEta[1] : renEta[0] + ' · ' + renEta[1]),
      loadPath: smoothPath(LOAD.map((v, i) => [i / 10 * 200, 38 - v / 5 * 34])), loadNow: 'M' + ((14.68 - 8) / 10 * 200).toFixed(1) + ' 0V40', baysNow: 'now ' + (st >= 10 ? '4' : '5') + ' / 5',
      fuTabs: ['Open', 'Reminded', 'All'].map(x => ({ label: x, pick: () => this.setState({ fuTab: x }), style: this.chip(fuTab === x) })),
      fuStats: [{ n: String(fuOpen.length), l: 'Open', c: '#fff' }, { n: fmt0(fuOpen.reduce((a, r) => a + r.value, 0)), l: 'Declined value, open', c: '#fff' }, { n: String(fuRowsAll.filter(r => r.stt === 'reminded').length), l: 'Reminded this week', c: fuRowsAll.some(r => r.stt === 'reminded') ? YEL : '#fff' }],
      fuRows, fuEmpty: fuRows.length === 0,
      fuNote: fuRem ? 'Rennan’s reminder went to his phone as a message from Tyler and a push. Cabin air filter now shows a reminder in his Next due list.' : 'Remind sends an in-app message when the customer uses the app, otherwise a text. Snooze hides the item for 30 days. Nothing is sent automatically.',
      fleets: FLEETS.map(a => ({ name: a.name, sub: a.units.length + ' units · ' + (a.mtd ? fmt0(a.mtd) + ' this month' : 'nothing billed yet'), flag: flDue(a) ? flDue(a) + ' due now' : flShop(a) ? 'In shop' : '', flagStyle: pill(flDue(a) ? RED : YEL), pick: () => this.setState({ fleetSel: a.id }), style: CARD + ';padding:14px 16px;cursor:pointer;transition:all .18s ease;' + (flSrc.id === a.id ? 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.2);' : '') })),
      fl: { code: flSrc.code, name: flSrc.name, contact: flSrc.contact, pills: flSrc.terms.map(t => ({ t, style: pill(t === 'PO required' ? YEL : 'rgba(235,235,245,.6)') })).concat(flSrc.po ? [{ t: flSrc.po, style: pill('rgba(235,235,245,.6)') }] : []),
        stats: [{ n: String(flSrc.units.length), l: 'Units', c: '#fff' }, { n: String(flDue(flSrc)), l: 'Due now', c: flDue(flSrc) ? RED : '#fff' }, { n: String(flShop(flSrc) + flSrc.units.filter(u => fb[u.k]).length), l: 'Booked or in shop', c: '#fff' }, { n: fmt0(flSrc.mtd), l: 'Billed · October', c: GRN }],
        units: flSrc.units.map(u => { const booked = !!fb[u.k], c = booked ? GRN : u.c; return { unit: u.unit, veh: u.veh, plate: 'UT · ' + u.plate, odo: u.odo, odoAt: u.odoAt, due: u.due, dueIn: booked ? 'Booked' : u.dueIn, c, unitPill: pill(c) + ';min-width:44px', ruler: ruler(u.pct, c, 10), cta: !booked && u.book && !u.state ? 'Schedule' : '', state: booked ? 'Booked · Wed 8:00 AM' : u.state || (u.book ? '' : 'On track'), sc: booked ? GRN : u.state ? YEL : 'rgba(235,235,245,.45)', go: () => this.setState({ fleetBooked: Object.assign({}, fb, { [u.k]: true }) }) }; }) },
      flAction: flSent ? { t: 'Statement sent to ' + flSrc.first + ' · 2:41 PM', s: 'October to date · ' + fmt0(flSrc.mtd) + ' · ' + flSrc.terms.join(' · '), cta: 'Resend', go: () => {} } : { t: 'October statement · ' + fmt0(flSrc.mtd) + ' to date', s: 'Itemized by unit and work order, emailed to ' + flSrc.first + '. ' + flSrc.terms.join(', ') + '.', cta: 'Send statement', go: () => this.setState({ fleetStmt: Object.assign({}, s.fleetStmt, { [flSrc.id]: true }) }) },
      recall: { sub: rc === 'done' ? vinLabel + ' · checked 2:41 PM today' : vinLabel + ' · not checked this visit', btn: rc === 'checking' ? 'Checking…' : rc === 'done' ? 'Check again' : 'Check NHTSA', go: () => this.checkRecall(),
        btnStyle: 'padding:10px 16px;border-radius:9px;font-size:12.5px;font-weight:600;white-space:nowrap;transition:all .2s ease;' + (rc === 'checking' ? 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.5);cursor:default;' : rc === 'done' ? 'background:rgba(235,235,245,.1);color:#fff;cursor:pointer;' : 'background:#fff;color:#000;cursor:pointer;'),
        checking: rc === 'checking', scanBase: ruler(0, '#fff', 10).base, scanFill: ruler(rc === 'checking' ? 100 : 0, 'rgba(235,235,245,.8)', 10).fill.replace('.6s cubic-bezier(.3,.9,.3,1)', '1.3s linear'),
        hasRows: rcRows.length > 0, none: rc === 'done' && rcRows.length === 0,
        rows: rcRows.map(r => ({ id: r.id, pill: pill(YEL) + ';flex:0 0 auto', t: r.t, d: r.d, m: r.m, cta: s.recallAdded ? '' : 'Add to next visit', state: s.recallAdded ? 'On Rennan’s next visit' : '', go: () => { this.setState({ recallAdded: true }); this.notify('RyGuys found an open recall for Quicksilver. It’s added to your next visit at no charge.'); } })),
        foot: 'Looked up by VIN against the NHTSA recall database. The campaign shown is sample data for this prototype; verify before contacting the customer.' },
      lobbyTime: '2:41 PM', lobbyDate: 'Mon · Oct 05 · 2026',
      lobbyRows: [{ bay: 'Bay 01', who: 'Rennan A.', car: 'Tesla Model Y', status: bay1Label, c: bay1Color, eta: renEta[0], etaSub: renEta[1], etaColor: renEta[2] }, { bay: 'Bay 02', who: 'Sarah M.', car: 'Toyota 4Runner', status: 'Waiting for approval', c: YEL, eta: '—', etaSub: 'After approval · about 2.5 h', etaColor: '#fff' }, { bay: 'Bay 03', who: 'James L.', car: 'Honda CR-V', status: 'Arriving 3:00 PM', c: 'rgba(235,235,245,.5)', eta: '5:30 PM', etaSub: 'Estimated', etaColor: '#fff' }, oilLive ? { bay: 'Bay 04', who: 'Rennan A.', car: 'Toyota Tacoma', status: oilStatus, c: oilColor, eta: oilDone ? 'Ready now' : '1:55 PM', etaSub: oilDone ? 'Oil change · pay in the app' : 'Estimated', etaColor: oilDone ? GRN : '#fff' } : { bay: 'Bay 04', who: 'Dale C.', car: 'Ford F-150', status: 'Complete', c: GRN, eta: 'Ready now', etaSub: 'Paid · keys at the front desk', etaColor: GRN }, { bay: 'Bay 05', who: 'Priya N.', car: 'Subaru Outback', status: 'Waiting for parts', c: YEL, eta: 'Thursday', etaSub: 'Parts arrive Thu 9 AM', etaColor: '#fff' }].map(r => Object.assign(r, { bayPill: pillL(r.c), pctLabel: PROG[r.bay][0] + '%', ruler: ruler(PROG[r.bay][0], r.c, 14) })),
      lobbyFoot: [{ k: 'Wi-Fi', v: 'RyGuys-Guest · no password' }, { k: 'Hours today', v: 'Until 6:00 PM' }, { k: 'Front desk', v: 'Tyler L.' }],
      tqVehs: ['rennan', 'sarah'].map(id => ({ label: TIRES[id].who.split(' ')[0] + ' · ' + TIRES[id].car.replace(/^\d{4} /, ''), pick: () => this.setState({ tq: Object.assign({}, tq, { veh: id }) }), style: this.chip(id === tq.veh) })),
      dtq: { who: dSet.who, car: dSet.car, size: dSet.size, placard: dSet.placard, tread: dSet.tread, pill: pill(dStatus[1]), status: dStatus[0] },
      dtqOpts: dSet.opts.map(o => { const on = o.id === dTier, c = tqCalc(o); return { name: o.name, tier: o.tier, warranty: o.warranty, stock: o.stock, stockColor: o.stock.indexOf('In stock') === 0 ? GRN : YEL, each: fmt0(o.each), total: fmt0(Math.round(c.total)), radio: radio(on) + 'flex:0 0 auto', pick: () => { if (tq.veh === 'rennan' && tq.accepted) return; this.setState({ tq: Object.assign({}, tq, tq.veh === 'rennan' ? { tier: o.id } : { tierS: o.id }) }); } }; }),
      dtqHaz: [['Include', true], ['Offer as option', false]].map(x => ({ label: x[0], pick: () => { if (!tq.accepted) this.setState({ tq: Object.assign({}, tq, { hazard: x[1] }) }); }, style: this.chip(tq.hazard === x[1]) })),
      dtqAction: tq.veh !== 'rennan' ? { t: 'Sarah already has a tire estimate open', s: 'Four Defender LTX in WO-8839 · $1,248.20 · waiting for approval', cta: '' }
        : tq.accepted ? { t: 'Accepted · ' + tqOptR.name, s: fmt(tqCR.total) + ' installed · ' + (inStockR ? 'pulled from stock to Bay 01' : 'ordered from ' + tqOptR.stock.split(' · ')[0]), cta: '' }
        : tq.sent ? { t: 'Sent to Rennan at ' + tq.sentAt, s: 'He sees all three options with ' + tqOptR.tier + ' recommended. Edits here update his phone.', cta: 'Resend', go: tqSend }
        : { t: tq.requested ? 'Rennan asked for a quote' : 'Draft', s: 'Recommend ' + tqOptR.tier + ' · ' + tqOptR.name + ' · ' + fmt(tqCR.total) + ' installed', cta: 'Send quote to Rennan', go: tqSend },
      storageRows: STORAGE.map(x => { const state = x.mine ? (swapBooked ? 'Booked · Oct 17' : 'Not booked') : x.swap; return { who: x.who, set: x.set, meta: 'Rack ' + x.rack + ' · since ' + x.since + ' · ' + x.tread + ' when stored', state, color: state.indexOf('Booked') === 0 ? GRN : state === 'Stored for winter' ? 'rgba(235,235,245,.5)' : YEL }; }),
      storageHead: '14 sets stored · ' + (swapBooked ? 7 : 6) + ' swaps booked',
      tireStock: TIRE_STOCK.map(x => { const n = x[1] - (tq.accepted && inStockR && x[0] === '255/45R19' ? 4 : 0); return { size: x[0], fits: x[2], n: String(n), c: n <= 6 ? YEL : '#fff', bar: 'height:100%;width:' + Math.round(n / 20 * 100) + '%;background:' + (n <= 6 ? YEL : 'rgba(235,235,245,.45)') + ';border-radius:1px' }; }),
      estPill: pill(st >= 5 ? GRN : st === 4 ? YEL : '#fff'), estPillText: st >= 5 ? 'Approved 9:49 AM' : st === 4 ? 'Sent 9:41 AM · waiting' : st === 3 ? 'Inspection complete · draft' : 'Inspection in progress',
      estLines: EST_LINES.map(l => { const f = FINDINGS.find(x => x.id === l.id), on = estSt.on[l.id] !== false, price = l.parts + l.hrs * 120; return { name: f.name, meta: f.meas + ' · ' + (l.comp ? 'complimentary · ' : 'parts ' + fmt(l.parts) + ' · ') + l.hrs + ' h labor', price: l.comp ? '$0' : fmt(price), on, optional: l.optional, tech: f.tech, plain: estNotes[l.id] || f.plain, dot: dotOf(f.color),
        onPlain: e => this.setState({ estNotes: Object.assign({}, estNotes, { [l.id]: e.target.value }) }),
        toggle: () => { if (st >= 4) return; this.setState({ est: { on: Object.assign({}, estSt.on, { [l.id]: !on }) } }); },
        box: 'width:22px;height:22px;border-radius:6px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;transition:all .18s ease;cursor:' + (st >= 4 ? 'default' : 'pointer') + ';' + (on ? 'background:#fff;color:#000;' : 'border:1px solid rgba(235,235,245,.3);'),
        style: CARD + ';padding:16px 18px;transition:opacity .2s ease;opacity:' + (on ? 1 : .55) }; }),
      estPreview: EST_LINES.filter(l => estSt.on[l.id] !== false).map(l => { const f = FINDINGS.find(x => x.id === l.id); return { name: f.name + (l.optional ? ' (optional)' : ''), price: l.comp ? '$0' : fmt(l.parts + l.hrs * 120), plain: estNotes[l.id] || f.plain, dot: dotOf(f.color) }; }),
      estTotal: fmt(EST_LINES.filter(l => estSt.on[l.id] !== false && !l.optional && !l.comp).reduce((a, l) => a + l.parts + l.hrs * 120, 0)), estTax: fmt(55.91),
      estSend: () => { if (st === 3) { this.setStage(4); this.setState({ dView: 'approvals', estOpen: 'rennan' }); } },
      estSendStyle: 'margin-top:18px;text-align:center;padding:14px 0;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;' + (st === 3 ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      estSendLabel: st >= 5 ? 'Approved by Rennan' : st === 4 ? 'Sent · waiting on Rennan' : st === 3 ? 'Send to Rennan' : 'Waiting on inspection',
      estFoot: st >= 4 ? 'Edits to the plain-language notes still update what Rennan sees in his Inspection report.' : 'Rennan gets a push and a text. He approves with Face ID; no phone call.', dgoCustomer: this.dgo('customer'), dgoCustomers: this.dgo('customers'),
      nowPill: pill(ACC), schedHours: HOURS.map(hr => ({ left: hl(hr), label: hr === 12 ? '12 PM' : hr > 12 ? (hr - 12) + ' PM' : hr + ' AM' })), nowLeft: 'calc(76px + (100% - 76px) * ' + ((14.68 - 8) / 10).toFixed(4) + ')',
      schedRows: [1, 2, 3, 4, 5].map(bay => ({ bay: 'Bay 0' + bay, tech: BAY_TECH[bay], blocks: sched.filter(b => b.bay === bay).map(b => {
        const live = b.id === 'rennan', status = live ? bay1Label : b.id === 'tacoma' ? oilStatus : b.status, c = live ? bay1Color : b.id === 'tacoma' ? oilColor : b.c, dragging = drag && drag.id === b.id;
        return {
          who: b.who, job: b.car + ' · ' + b.job, time: fmtH(b.start) + ' – ' + fmtH(b.start + b.dur), status, c,
          style: 'position:absolute;top:8px;bottom:8px;left:' + hl(b.start) + ';width:calc(' + (b.dur / 10 * 100).toFixed(2) + '% - 4px);padding:10px 12px;border-radius:10px;background:#141416;user-select:none;touch-action:none;overflow:hidden;' + (dragging ? 'transform:translate(' + drag.dx + 'px,' + drag.dy + 'px);z-index:5;cursor:grabbing;box-shadow:0 16px 44px rgba(0,0,0,.65),inset 0 0 0 1px rgba(255,255,255,.28),inset 3px 0 0 ' + c + ';' : 'cursor:grab;transition:left .25s ease,width .25s ease;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 3px 0 0 ' + c + ';'),
          down: e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} const lane = e.currentTarget.parentElement.getBoundingClientRect(); this.setState({ drag: { id: b.id, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, pxh: lane.width / 10, rowH: lane.height, scale: lane.height / 84 }, schedMsg: '' }); },
          move: e => { const d = this.state.drag; if (!d || d.id !== b.id) return; this.setState({ drag: Object.assign({}, d, { dx: (e.clientX - d.x0) / d.scale, dy: (e.clientY - d.y0) / d.scale }) }); },
          up: e => { const d = this.state.drag; if (!d || d.id !== b.id) return; let start = Math.max(8, Math.min(18 - b.dur, Math.round((b.start + (e.clientX - d.x0) / d.pxh) * 4) / 4)), nb = Math.max(1, Math.min(5, b.bay + Math.round((e.clientY - d.y0) / d.rowH))); const others = sched.filter(x => x.bay === nb && x.id !== b.id); let tries = 0; while (tries++ < 48 && others.some(o => start < o.start + o.dur && start + b.dur > o.start)) start = Math.min(18 - b.dur, start + 0.25); if (others.some(o => start < o.start + o.dur && start + b.dur > o.start)) { start = b.start; nb = b.bay; } const moved = start !== b.start || nb !== b.bay; this.setState({ drag: null, sched: moved ? sched.map(x => x.id === b.id ? Object.assign({}, x, { start, bay: nb }) : x) : sched, schedMsg: moved ? b.who.split(' ')[0] + (nb !== b.bay ? ' moved to Bay 0' + nb + ' (' + BAY_TECH[nb] + ')' : '') + (start !== b.start ? (nb !== b.bay ? ', ' : ' moved to ') + fmtH(start) : '') + (live ? '. The technician iPad and Rennan\u2019s phone updated.' : '.') : '' }); }
        };
      }) })),
      schedNote: drag ? 'Drop to reassign. Snaps to 15 minutes.' : s.schedMsg || 'Drag a job to another bay or time. Bay 0' + rBay + ' and the Tacoma oil change are live on the technician iPad.',
      custStats: [{ n: String(cust.visits), l: 'Visits' }, { n: cust.ltv, l: 'Lifetime' }, { n: cust.meta.indexOf('since') >= 0 ? cust.meta.split('since ')[1].slice(0, 4) : '2026', l: 'Member since' }, { n: cust.id === 'rennan' ? '8 min' : '—', l: 'Avg. approval' }, { n: cust.id === 'rennan' ? points.toLocaleString('en-US') : '—', l: 'Reward pts' }],
      custCar: custCar, custHistCount: custHist.length + (custHist.length === 1 ? ' visit' : ' visits'), custHist, custHealth, custPrefs, custDocs,
      apptSub: apptDay === 'Today' ? 'Monday, October 5 · ' + apptToday.length + ' vehicles' : apptDay + ' · ' + appts.length + (appts.length === 1 ? ' appointment' : ' appointments'),
      apptDays: ['Today', 'Tomorrow', 'Wednesday'].map(d => ({ label: d, pick: () => this.setState({ apptDay: d }), style: 'padding:9px 14px;border-radius:9px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (apptDay === d ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.7);') })),
      appts: appts.map(a => Object.assign({ ph: PH }, a)), noAppts: appts.length === 0,
      customers: CUSTOMERS.map(c => ({ name: c.name, initials: c.name.split(' ').map(w => w[0]).join(''), vehicles: String(c.vehicles), visits: String(c.visits), last: c.last, ltv: c.ltv, open: () => this.setState({ dCust: c.id, recall: null }), style: 'display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;padding:14px 0;font-size:13px;border-bottom:1px solid rgba(235,235,245,.07);align-items:center;cursor:pointer;transition:background .18s ease;' + (cust.id === c.id ? 'background:rgba(255,255,255,.04);' : '') })),
      cust: Object.assign({}, cust, { initials: cust.name.split(' ').map(w => w[0]).join('') }),
      partsOrders: (tq.accepted ? [{ part: tqOptR.name + ' 255/45R19 ×4', for: 'Rennan Anderson · Tesla Model Y · WO-8842', supplier: inStockR ? 'Shop stock' : tqOptR.stock.split(' · ')[0], status: inStockR ? 'Pulled to Bay 01' : 'Ordered · arrives ' + tqOptR.stock.split(' · ')[1], color: inStockR ? GRN : YEL, cta: '' }] : []).concat([
        { part: 'Front brake pads + rotors (pair)', for: 'Rennan Anderson · Tesla Model Y · WO-8842', supplier: s.partsDelayed ? PETA.supplier : 'WorldPac SLC', status: s.partsDelayed ? 'Ordered · ETA ' + PETA.arrive : st >= 5 ? 'Received · Bay 0' + rBay : 'Reserved, not pulled', color: s.partsDelayed ? RED : st >= 5 ? GRN : 'rgba(235,235,245,.5)', cta: st >= 5 && st <= 6 ? (s.partsDelayed ? 'Mark received' : 'Mark delayed') : '', go: () => this.togglePartsDelay() },
        { part: 'Michelin Defender LTX 265/70R17 ×4', for: 'Sarah Mitchell · Toyota 4Runner · WO-8839', supplier: 'Tire Rack', status: 'Awaiting customer approval', color: YEL, cta: '' },
        { part: 'CVT cooler + lines', for: 'Priya Nair · Subaru Outback · WO-8831', supplier: 'Subaru of Utah', status: 'Delayed · ETA Thursday', color: RED, cta: '' },
        { part: 'Spark plugs ×8, coil packs ×2', for: 'Dale Christensen · Ford F-150 · WO-8828', supplier: 'NAPA Manti', status: 'Installed', color: GRN, cta: '' }
      ]).map(p => Object.assign(p, { dot: dotOf(p.color) })),
      techs: [
        { name: 'Marcus T.', role: 'Master tech · Bays 01, 03', hours: '6.5 h / 8 h', pct: 81, jobs: [{ t: 'Model Y · brake service', s: bay1Label, c: bay1Color }, { t: 'CR-V · inspection', s: '3:00 PM', c: 'rgba(235,235,245,.5)' }].concat(rt.sent ? [{ t: 'Rating · Rennan', s: rt.stars + ' stars' + (rt.tip ? ' · $' + rt.tip + ' tip' : ''), c: GRN }] : []) },
        { name: 'Dana R.', role: 'Tech · Bays 02, 04', hours: '7 h / 8 h', pct: 88, jobs: [{ t: '4Runner · tires', s: 'Waiting approval', c: YEL }, { t: 'F-150 · plugs + coils', s: 'Complete', c: GRN }] },
        { name: 'Luis A.', role: 'Tech · Bay 05 · QC', hours: '4 h / 8 h', pct: 50, jobs: [{ t: 'Outback · CVT cooler', s: 'Waiting parts', c: YEL }, { t: 'Quality checks', s: st === 7 ? 'Model Y now' : '2 today', c: st === 7 ? ACC : 'rgba(235,235,245,.5)' }] }
      ].map(t => Object.assign(t, { initials: t.name.split(' ').map(w => w[0]).join(''), bar: 'height:100%;width:' + t.pct + '%;background:' + (t.pct > 85 ? YEL : ACC) + ';border-radius:2px' })),
      policies: [['applied', 'Applied to purchase'], ['refundable', 'Refundable 3 days'], ['nonrefundable', 'Non-refundable']].map(p => ({ label: p[1], pick: () => this.setState({ policy: s.policy === p[0] ? null : p[0] }), style: 'flex:1;text-align:center;padding:12px 10px;border-radius:10px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (s.policy === p[0] ? 'background:#fff;color:#000;' : 'background:rgba(255,255,255,.06);color:rgba(235,235,245,.75);') })),
      policyText,
      hours: [{ d: 'Mon – Fri', t: '8:00 AM – 6:00 PM' }, { d: 'Saturday', t: '9:00 AM – 2:00 PM' }, { d: 'Sunday', t: 'Closed' }],
      shopNotifs: [{ t: 'Checked in', s: 'Push + text' }, { t: 'Estimate ready', s: 'Push + text' }, { t: 'Ready for pickup', s: 'Push + text + call if no reply in 2 h' }, { t: 'Service reminders', s: 'Push, 30 days ahead' }],
      dEmptyTitle: (dNavDefs.find(n => n[0] === s.dView) || ['', 'Section'])[1],
      dgoApprovals: this.dgo('approvals'), dgoInbox: this.dgo('inbox'), approvalsBtn: approvalsCount + ' waiting for approval',
      overviewStats: [{ n: '38', l: 'Vehicles today' }, { n: st >= 1 && st <= 7 ? '12' : '11', l: 'In service' }, { n: String(5 + approvalsCount), l: 'Waiting for approval' }, { n: '5', l: 'Waiting for parts' }, { n: st >= 8 ? '15' : '14', l: 'Ready / completed' }],
      floor: [{ bay: 'Bay 01', car: 'Tesla Model Y', who: 'Rennan Anderson', status: bay1Label, color: bay1Color, live: true }, { bay: 'Bay 02', car: 'Toyota 4Runner', who: 'Sarah Mitchell', status: 'Waiting approval', color: YEL }, { bay: 'Bay 03', car: 'Honda CR-V', who: 'James Lee', status: 'Inspection', color: 'rgba(235,235,245,.5)' }, oilLive ? { bay: 'Bay 04', car: 'Toyota Tacoma', who: 'Rennan Anderson', status: oilStatus, color: oilColor, scene: oilDone ? '' : 'oil', phase: oilPhase } : { bay: 'Bay 04', car: 'Ford F-150', who: 'Dale Christensen', status: 'Complete', color: GRN }, { bay: 'Bay 05', car: 'Subaru Outback', who: 'Priya Nair', status: 'Waiting parts', color: YEL }].map(b => ({
        bay: b.bay, car: b.car, who: b.who, status: b.status, color: b.color, pill: pill(b.color), ph: PH, pctLabel: PROG[b.bay][0] + '%', eta: PROG[b.bay][1], ruler: ruler(PROG[b.bay][0], b.color, 10), scene: b.scene || (b.live && st >= 5 && st <= 8 ? 'brake' : ''), phase: b.phase || brakePhase, go: b.live ? this.dgo('approvals') : () => {}, dot: dotOf(b.color),
        style: 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:18px 20px;cursor:' + (b.live ? 'pointer' : 'default') + ';' + (b.live ? 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.1);' : '')
      })),
      queue: queueAll.slice(0, 2), inboxPreview: inboxItems.slice(0, 3).map(x => ({ who: x.who, time: x.time, preview: x.preview, dot: dotOf(x.color) })),
      queueFull: queueAll.map(q => Object.assign({}, q, { open: () => this.setState({ estOpen: q.id }), style: 'background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);padding:16px 18px;cursor:pointer;transition:all .18s ease;' + (estId === q.id ? 'box-shadow:inset 0 0 0 1px rgba(235,235,245,.2);' : '') })),
      estSel: Object.assign({}, EST[estId] || EST.sarah, { lines: (EST[estId] || EST.sarah).lines.map(l => ({ k: l.k, v: l.v, dot: dotOf(l.c) })) }),
      sendReminder: () => st === 3 ? this.setState({ dView: 'estimate' }) : this.advisorReply('Just checking in \u2014 your estimate is ready whenever you are. Happy to answer anything about the photos.'),
      inboxSections: ['Needs response', 'Waiting for approval', 'General', 'Completed'].map(title => ({ title, items: inboxItems.filter(x => x.section === title).map(inboxEntry) })).filter(sec => sec.items.length),
      dThread: Object.assign({}, dThreadSrc, { msgs: dThreadSrc.msgs.map(bubble) }),
      dReply: s.dReply, onDReply: e => this.setState({ dReply: e.target.value }),
      onDReplyKey: e => { if (e.key === 'Enter') this.dSend(dThreadSrc.id); }, sendDReply: () => this.dSend(dThreadSrc.id),
      toggleAdd: () => this.setState({ addOpen: !s.addOpen }), addOpen: s.addOpen, addLabel: s.addOpen ? 'Close' : '+ Add vehicle',
      salesStats: [{ n: s.reserved ? '11' : '12', l: 'Vehicles available' }, { n: s.reserved ? '5' : '4', l: 'Reserved' }, { n: t.done ? '8' : '7', l: 'Test drives this week' }, { n: '3', l: 'Pending purchases' }, { n: '$186,420', l: 'Inventory value' }],
      addFields: [['Year / make / model', '2024 Tesla Model Y'], ['VIN', '17 characters'], ['Mileage', '18,204'], ['Price', '$38,995'], ['Exterior', 'White'], ['Interior', 'Black'], ['Condition', 'Excellent'], ['Prep scheduled', 'Oct 7']].map(f => ({ l: f[0], p: f[1] })),
      salesTabs: ['Inventory', 'Reservations', 'Test drives', 'Trade-ins'].map(x => ({ label: x, pick: () => this.setState({ salesTab: x }), style: 'padding:9px 14px;border-radius:9px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (s.salesTab === x ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.7);') })),
      stInventory: s.salesTab === 'Inventory', stReservations: s.salesTab === 'Reservations', stTestdrives: s.salesTab === 'Test drives', stTradeins: s.salesTab === 'Trade-ins',
      invRows: INVENTORY.map(v => { const stt = s.reserved && v.id === s.selId ? 'Reserved' : v.id === 'tacoma' ? 'Purchase in progress' : 'Available'; return { name: v.name, trim: v.trim, color: v.color, vin: '···· ' + v.fullVin.slice(-4), miles: v.miles.toLocaleString('en-US'), price: fmt0(v.price), svc: v.servicedHere ? v.servicedHere + ' records' : '—', status: stt, ph: PH, statusStyle: pill(stt === 'Available' ? GRN : stt === 'Reserved' ? YEL : '#fff') }; }),
      reservations: (s.reserved ? [{ who: 'Rennan Anderson', car: sel.name, price: fmt0(sel.price), id: 'RES-20481', status: resStatusLabel, live: true, cta: s.resStatus >= 4 ? 'Mark delivered' : 'Next: ' + ['Reserved', 'Preparation', 'Purchase review', 'Paperwork', 'Pickup'][Math.min(s.resStatus + 1, 4)], advance: () => this.setState({ resStatus: Math.min(5, s.resStatus + 1) }), ph: PH }] : []).concat([{ who: 'Marcus Oliveira', car: '2021 Toyota Tacoma', price: '$37,450', id: 'RES-20477', status: 'Purchase in progress', live: false, cta: '', advance: () => {}, ph: PH }]),
      noReservations: false,
      testDrives: (t.done ? [{ when: t.day + ' · ' + t.time, who: t.driver || 'Rennan Anderson', car: sel.name, state: 'Confirmed', color: GRN }] : []).concat([{ when: 'Tue · 4:30 PM', who: 'Elena Park', car: '2023 Ford Bronco', state: 'Confirmed', color: GRN }, { when: 'Wed · 10:00 AM', who: 'Tom Hadley', car: '2022 Toyota 4Runner', state: 'Needs license photo', color: YEL }]),
      tradeIns: (tr.result ? [{ who: 'Rennan Anderson', car: '2022 Tesla Model Y · Quicksilver · ' + tr.cond, est: V.tradeRange, state: 'Estimate sent', color: ACC }] : []).concat([{ who: 'Elena Park', car: '2017 Subaru Forester · Good', est: '$9,800 – $10,600', state: 'Firm offer pending inspection', color: YEL }]),
      loanerFleet: LOANER_FLEET.map(f => { const mine = f.id === rn.veh && (s.loaner === 'active' || s.loaner === 'reserved'); const sc = f.out ? [f.out, f.out.indexOf('Out') === 0 ? ACC : 'rgba(235,235,245,.5)'] : mine ? (s.loaner === 'active' ? ['Out · Rennan Anderson', ACC] : ['Reserved · Rennan Anderson', YEL]) : ['Available', GRN]; return { car: f.car, color: f.color, vin: f.vin, miles: f.miles, state: sc[0], stateColor: sc[1], dot: 'width:12px;height:12px;border-radius:6px;flex:0 0 auto;background:' + f.paint + ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)' }; }),
      rentalList: [{ who: 'Rennan Anderson', sub: 'LN-3107 · ' + lv.short + ' · ' + dayLabel(rn.start).slice(5) + ' → ' + dayLabel(rEnd).slice(5), state: rStatus[0], color: rStatus[1] }, { who: 'Priya Nair', sub: 'LN-3102 · RAV4 · Oct 5 → Oct 8', state: 'Out with customer', color: ACC }],
      rental: { no: 'LN-3107', who: 'Rennan Anderson', car: lv.car + ' · ' + lv.color, status: rStatus[0], statusStyle: 'flex:0 0 auto;' + pill(rStatus[1]) },
      rVehicles: LOANER_FLEET.map(f => { const locked = !!f.out || s.loaner !== 'none'; return { car: f.car, sub: f.out || (rn.veh === f.id ? 'Selected' : 'Available'), dot: 'width:10px;height:10px;border-radius:5px;flex:0 0 auto;background:' + f.paint + ';box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)', pick: () => { if (!locked) this.setState({ rental: Object.assign({}, rn, { veh: f.id }) }); }, style: 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;transition:all .18s ease;cursor:' + (locked ? 'default' : 'pointer') + ';opacity:' + (f.out ? .4 : 1) + ';' + (rn.veh === f.id ? 'background:#fff;color:#000;' : 'background:rgba(255,255,255,.06);color:rgba(235,235,245,.8);') }; }),
      rPay: [['customer', fmt0(RATE) + ' / day'], ['shop', 'Covered by RyGuys']].map(p => ({ label: p[1], pick: () => this.setState({ rental: Object.assign({}, rn, { pay: p[0] }) }), style: 'flex:1;text-align:center;padding:11px 10px;border-radius:10px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (rn.pay === p[0] ? 'background:#fff;color:#000;' : 'background:rgba(255,255,255,.06);color:rgba(235,235,245,.75);') })),
      rSummary: [{ k: 'Pick up', v: dayLabel(rn.start), c: '#fff' }, { k: 'Return', v: dayLabel(rEnd) + (delayDay ? ' · +' + PETA.extraDays + (PETA.extraDays > 1 ? ' days' : ' day') + ', parts' : ''), c: delayDay ? YEL : '#fff' }, { k: 'Days', v: rDays + (rDays === 1 ? ' day' : ' days') + (delayDay ? ' · ' + PETA.extraDays + ' covered by shop' : ''), c: '#fff' }, { k: 'Customer total', v: shopPays ? '$0 · covered' : fmt0(rTotal), c: shopPays ? GRN : '#fff' }],
      calHead: ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(t => ({ t })),
      calCells: Array.from({ length: 35 }, (_, i) => { const d = i - 3, inM = d >= 1 && d <= 31, past = d < 5, inR = d >= rn.start && d <= rEnd, edge = d === rn.start || d === rEnd, ext = delayDay && d === rEnd; return { label: inM ? String(d) : '', pick: () => { if (inM && !past) this.pickDay(d); }, style: 'height:34px;display:flex;align-items:center;justify-content:center;font-size:12.5px;border-radius:8px;transition:all .15s ease;cursor:' + (inM && !past ? 'pointer' : 'default') + ';' + (!inM ? '' : past ? 'color:rgba(235,235,245,.2);' : edge ? (ext ? 'background:' + YEL + ';color:#000;font-weight:600;' : 'background:#fff;color:#000;font-weight:600;') : inR ? 'background:rgba(235,235,245,.14);color:#fff;' : 'color:rgba(235,235,245,.8);') }; }),
      calNote: delayDay ? 'Parts delay added a day, highlighted in yellow. It is covered by the shop and already reflected on Rennan\u2019s phone.' : s.loaner === 'none' ? 'Dates show on the customer\u2019s phone and in the agreement as you change them.' : 'Extend the return date here if the job runs long. The customer sees the change immediately.',
      rClauseHint: s.loaner === 'none' ? 'Locked once signed' : 'Signed · locked', rClauseWrap: 'margin-top:8px;' + (s.loaner !== 'none' ? 'opacity:.55;pointer-events:none;' : ''),
      rClauses: CLAUSES.map(c => ({ t: c.t, hasOpts: !!CLAUSE_OPTS[c.id], rowStyle: 'padding:11px 0;border-bottom:1px solid rgba(235,235,245,.07);transition:opacity .2s ease;opacity:' + (rn.clauses[c.id] ? 1 : .5), boxStyle: 'width:18px;height:18px;border-radius:5px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .18s ease;' + (rn.clauses[c.id] ? 'background:#fff;color:#000;' : 'border:1px solid rgba(235,235,245,.3);color:transparent;'), toggle: () => { const cl = Object.assign({}, rn.clauses); cl[c.id] = !cl[c.id]; this.setState({ rental: Object.assign({}, rn, { clauses: cl }) }); }, opts: (CLAUSE_OPTS[c.id] || []).map(o => ({ label: o, pick: () => { const patch = {}; patch[CLAUSE_KEY[c.id]] = o; this.setState({ rental: Object.assign({}, rn, patch) }); }, style: 'padding:5px 9px;border-radius:7px;font-size:11.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (clauseOpt[c.id] === o ? 'background:rgba(235,235,245,.9);color:#000;' : 'background:rgba(235,235,245,.08);color:rgba(235,235,245,.7);') })) })),
      rPreviewMeta: 'Between RyGuys Tire & Auto Sales, 145 S Main St, Manti UT (\u201cRyGuys\u201d) and Rennan Anderson (\u201cDriver\u201d). ' + lv.car + ', ' + lv.color + ', VIN ending ' + lv.vin + '. ' + dayLabel(rn.start) + ' to ' + dayLabel(rEnd) + '. ' + (shopPays ? 'No charge to the Driver.' : fmt0(RATE) + ' per day, charged to the card on file at return.'),
      rAction: s.loaner === 'returned' ? { t: 'Returned · 38 mi · 81% charge', s: shopPays ? 'No charges' : fmt0(rTotal) + ' charged to card on file', cta: '', go: () => {} }
        : s.loaner === 'active' ? { t: 'Out since ' + (rn.outAt || '9:12 AM'), s: 'Due back ' + dayLabel(rEnd), cta: 'Record return', go: () => this.setState({ loaner: 'returned' }) }
        : s.loaner === 'reserved' ? { t: 'Signed ' + rn.signedAt, s: 'Waiting for handoff at check-in', cta: 'Record handoff', go: () => this.setState({ loaner: 'active', rental: Object.assign({}, rn, { outAt: '9:12 AM' }) }) }
        : rn.sent ? { t: 'Sent ' + rn.sentAt, s: 'Waiting for Rennan to sign', cta: 'Resend', go: () => this.sendRental() }
        : { t: 'Draft', s: 'Not yet sent to the customer', cta: 'Send to Rennan', go: () => this.sendRental() },
      rSigned: rn.signed, rSigBox: '0 0 ' + (s.sigW || 366) + ' 140',
      repRanges: ['7 days', '31 days', '12 months'].map(r => ({ label: r, pick: () => this.setState({ repRange: r }), style: 'padding:9px 14px;border-radius:9px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .18s ease;' + (repRange === r ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.7);') })),
      repRangeLabel: 'last ' + repRange, repTotal: fmt0(repData.reduce((a, b) => a + b, 0)),
      repGrid: [0, .5, 1].map(f => ({ v: f === 0 ? '0' : fmt0(Math.round(repMax * f / 100) * 100).replace(',000', 'k').replace(/,(\d)00$/, '.$1k'), style: 'position:absolute;left:0;right:0;bottom:' + (f * 100) + '%;height:1px;background:rgba(235,235,245,' + (f === 0 ? '.18' : '.07') + ')' + (f === .5 ? ';background-image:linear-gradient(90deg,rgba(235,235,245,.2) 50%,transparent 50%);background-size:6px 1px;background-color:transparent' : ''), lbl: 'position:absolute;right:0;bottom:' + (f * 100) + '%;transform:translateY(50%);font-size:11px;color:rgba(235,235,245,.45)' })),
      repBars: repData.map((v, i) => ({ style: 'flex:1;border-radius:2px 2px 0 0;transition:height .5s ease;height:' + Math.max(v ? 2 : 0, Math.round(v / repMax * 100)) + '%;background:' + (i === repData.length - 1 ? '#30d158' : 'rgba(48,209,88,.72)') })),
      repTicks: (repRange === '12 months' ? ['Nov', 'Jan', 'Mar', 'May', 'Jul', 'Sep'].map((l, i) => ({ l, left: (i * 2 / 12 * 100).toFixed(1) + '%' })) : repRange === '7 days' ? ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'].map((l, i) => ({ l, left: (i / 7 * 100).toFixed(1) + '%' })) : [1, 8, 15, 22, 29].map(d => ({ l: String(d), left: ((d - 1) / 31 * 100).toFixed(1) + '%' }))),
      repLegend: [{ k: 'Service', v: '82%' }, { k: 'Sales', v: '18%' }, { k: 'Avg', v: fmt0(Math.round(repData.reduce((a, b) => a + b, 0) / repData.filter(Boolean).length)) + (repRange === '12 months' ? '/mo' : '/day') }],
      repTop: [['Oil changes', 15120], ['Brakes', 14210], ['Tires', 11880], ['Diagnostics', 6450], ['Battery and electrical', 4180]].map(t => ({ k: t[0], v: fmt0(t[1]), bar: 'height:100%;width:' + Math.round(t[1] / 15120 * 100) + '%;background:#30d158;border-radius:2px' })),
      repTechs: [['Marcus T.', 21480, '38 orders · 94% approval', '4.9 ★'], ['Dana R.', 17920, '31 orders · 81% approval', '4.8 ★'], ['Luis A.', 11940, '19 orders · 86% approval', '4.9 ★']].map(t => ({ k: t[0], v: fmt0(t[1]), s: t[2], r: t[3] })),
      metrics: [{ l: 'Today\u2019s revenue', n: '$8,421', d: '+12% vs. avg day', c: GRN }, { l: 'Repair orders', n: '38', d: '+3', c: GRN }, { l: 'Oil changes', n: '164', d: 'this month · 31% of orders', c: 'rgba(235,235,245,.5)' }, { l: 'Average repair order', n: '$221.61', d: '−$4.10', c: 'rgba(235,235,245,.5)' }, { l: 'Approval rate', n: '84%', d: '+6 pts since in-app estimates', c: GRN }, { l: 'Average approval time', n: '11 min', d: 'was 2.4 hrs by phone', c: GRN }, { l: 'Customer satisfaction', n: '4.9', d: '212 ratings', c: 'rgba(235,235,245,.5)' }, { l: 'Loaner utilization', n: '72%', d: '+8 pts', c: GRN }],
      bars: [['Tue', 6.2], ['Wed', 7.8], ['Thu', 5.9], ['Fri', 9.1], ['Sat', 6.4], ['Sun', 0], ['Mon', 8.4]].map(bv => ({ d: bv[0], v: bv[1] ? '$' + bv[1] + 'k' : '—', style: 'width:100%;max-width:56px;border-radius:6px 6px 2px 2px;height:' + Math.max(3, Math.round(bv[1] / 9.1 * 100)) + 'px;background:' + (bv[0] === 'Mon' ? '#fff' : 'rgba(235,235,245,.22)') }))
    });
    // ---- walk-in check-in (shop desktop)
    const WI0 = { name: '', phone: '', plate: '', car: '', odo: '', concern: '', service: 'Multi-point inspection', bay: 3, visit: 'Wait', found: null };
    const wi = s.wi || WI0;
    const setWi = patch => this.setState({ wi: Object.assign({}, wi, patch) });
    const ciCarLabel = wi.found ? wi.found.name : wi.car.trim();
    const ciOk = wi.name.trim().length > 1 && ciCarLabel.length > 2;
    const SERVICES = ['Oil change', 'Brake inspection', 'Tire rotation', 'Multi-point inspection', 'Check engine light', 'Tires', 'Other'];
    const busyBays = {}; for (const b of sched) if (b.start <= 14.7 && b.start + b.dur > 14.7) busyBays[b.bay] = b.who.split(' ')[0];
    const chipS = on => 'padding:10px 14px;border-radius:10px;cursor:pointer;font-size:12.5px;font-weight:500;transition:all .18s ease;' + (on ? 'background:#fff;color:#000;' : 'background:#1c1c1e;color:rgba(235,235,245,.75);');
    Object.assign(V, {
      goCheckin: () => this.setState({ dView: 'checkin', wi: null }), ciBack: this.dgo('overview'),
      ciSub: 'Walk-in · Monday, October 5 · 2:41 PM',
      ciName: wi.name, onCiName: e => setWi({ name: e.target.value }), ciPhone: wi.phone, onCiPhone: e => setWi({ phone: e.target.value.replace(/[^\d() -]/g, '').slice(0, 14) }),
      ciCustomerNote: wi.phone.replace(/\D/g, '').length >= 10 ? 'They get a text with a link to follow the visit, approve work and pay. No app download needed.' : 'Add a mobile number and they can follow the visit from their phone.',
      ciPlate: wi.plate, onCiPlate: e => setWi({ plate: e.target.value.toUpperCase().slice(0, 17), found: null }), onCiPlateKey: e => { if (e.key === 'Enter') V.ciLookup(); },
      ciLookup: () => { const p = wi.plate.trim(); if (!p) return; const hit = p.length > 10 ? { name: '2021 Toyota Tacoma', sub: 'TRD Off-Road · VIN ···' + p.slice(-4) + ' · serviced here 11 times', ph: PH } : { name: '2020 Honda CR-V', sub: 'EX-L · UT ' + p + ' · new to RyGuys', ph: PH }; setWi({ found: hit }); },
      ciFound: !!wi.found, ciFoundName: wi.found && wi.found.name, ciFoundSub: wi.found && wi.found.sub, ciFoundPh: wi.found && wi.found.ph,
      ciCar: wi.car, onCiCar: e => setWi({ car: e.target.value }), ciOdo: wi.odo, onCiOdo: e => setWi({ odo: e.target.value.replace(/\D/g, '').slice(0, 7) }),
      ciConcern: wi.concern, onCiConcern: e => setWi({ concern: e.target.value }),
      ciServices: SERVICES.map(x => ({ label: x, pick: () => setWi({ service: x }), style: chipS(wi.service === x) })),
      ciBays: [1, 2, 3, 4, 5].map(b => ({ label: 'Bay 0' + b, sub: busyBays[b] ? busyBays[b] + ' · in use' : BAY_TECH[b], pick: () => setWi({ bay: b }), style: chipS(wi.bay === b) + 'flex:1;text-align:center;padding:9px 6px;' + (busyBays[b] && wi.bay !== b ? 'opacity:.45;' : '') })),
      ciVisits: ['Wait', 'Drop off', 'Loaner'].map(x => ({ label: x, pick: () => setWi({ visit: x }), style: chipS(wi.visit === x) + 'flex:1;text-align:center;' })),
      ciFoot: ciOk ? ciCarLabel + ' · ' + wi.service + ' · Bay 0' + wi.bay + ' · ' + BAY_TECH[wi.bay].replace(/\.$/, '') + '. Goes to the technician iPad and the lobby board now.' : 'Name and vehicle are enough to check in. Everything else can be added from the work order.',
      ciCta: 'Check in', ciCtaStyle: 'padding:13px 24px;border-radius:12px;font-size:13px;font-weight:600;transition:all .2s ease;white-space:nowrap;' + (ciOk ? 'background:#fff;color:#000;cursor:pointer;' : 'background:rgba(235,235,245,.12);color:rgba(235,235,245,.4);cursor:default;'),
      ciSubmit: () => {
        if (!ciOk) return;
        const id = 'wi' + Date.now();
        const job = { id, who: wi.name.trim(), car: ciCarLabel.replace(/^\d{4} /, ''), job: wi.service, bay: wi.bay, start: 14.75, dur: wi.service === 'Oil change' ? 0.75 : wi.service === 'Tire rotation' ? 0.5 : 1.5, status: 'Checked in', c: ACC };
        this.setState({ sched: sched.concat(job), walkins: (s.walkins || []).concat({ id, who: wi.name.trim(), car: job.car, job: wi.service, bay: wi.bay, visit: wi.visit, time: '2:41 PM', concern: wi.concern }), wi: null, dView: 'schedule' });
        this.notify(wi.name.trim().split(' ')[0] + ' checked in · Bay 0' + wi.bay + ' · ' + BAY_TECH[wi.bay]);
      }
    });
    // walk-ins on the lobby board
    V.lobbyRows = (V.lobbyRows || []).concat((s.walkins || []).map(w => ({ bay: 'Bay 0' + w.bay, who: w.who.split(' ')[0] + ' ' + (w.who.split(' ')[1] || '').slice(0, 1) + '.', car: w.car, status: 'Checked in', c: ACC, pctLabel: '0%', ruler: ruler(0, ACC, 14), eta: '—', etaSub: 'Inspection first', etaColor: 'rgba(235,235,245,.5)', bayPill: pillL(ACC) })));
    // ---- empty states (customer with no vehicle on file) and the after-hours lobby board
    if (s.noVehicle) Object.assign(V, {
      pHome: false, pHomeEmpty: view === 'home', pGarage: false, pGarageEmpty: view === 'garage', pHealth: false, pHealthEmpty: view === 'health',
      pService: false, pServiceEmpty: view === 'service', pHistory: false, pHistoryEmpty: view === 'history', pMessages: false, pMessagesEmpty: view === 'messages',
      hasUnread: false, initials: 'RA',
      heroStyle: 'position:absolute;left:0;right:0;z-index:4;top:0;height:240px;opacity:0;pointer-events:none',
      addVehicle: () => this.setState({ view: 'onboard', onboard: { step: 3, phone: '', code: '', plate: '', name: '', found: false, searching: false } }),
      goBook: this.go('book'), goAccount: this.go('account'),
      startMessage: () => this.setState({ noVehicle: false, view: 'messages' }),
      tabs: (V.tabs || []).map(t => Object.assign({}, t, { badge: false }))
    });
    const staff = this.props.staff || { name: 'Tyler L.', role: 'Service advisor' };
    V.staffName = staff.name; V.staffRole = staff.role; V.staffInitials = staff.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    V.lobbyIdle = !!s.shopClosed;
    V.idleTitle = 'Closed for the day.'; V.idleSub = 'Opens tomorrow at 8:00 AM.';
    return V;
  }
}
