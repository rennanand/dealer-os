// VIN decode through NHTSA vPIC (public, no key). Returns the facts a shop cares about, or null.
export const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
export const cleanVin = (s) => String(s || '').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);
const cap = (t) => String(t || '').toLowerCase().split(/\s+/).map((w) => (w.length > 3 && !/\d/.test(w) ? w[0].toUpperCase() + w.slice(1) : w.toUpperCase())).join(' ');
const nice = { FORD: 'Ford', TOYOTA: 'Toyota', HONDA: 'Honda', CHEVROLET: 'Chevrolet', GMC: 'GMC', RAM: 'Ram', JEEP: 'Jeep', DODGE: 'Dodge', NISSAN: 'Nissan', SUBARU: 'Subaru', TESLA: 'Tesla', BMW: 'BMW', 'MERCEDES-BENZ': 'Mercedes-Benz', KIA: 'Kia', HYUNDAI: 'Hyundai', MAZDA: 'Mazda', LEXUS: 'Lexus', AUDI: 'Audi', VOLKSWAGEN: 'Volkswagen', ACURA: 'Acura', CADILLAC: 'Cadillac', BUICK: 'Buick', LINCOLN: 'Lincoln', CHRYSLER: 'Chrysler', VOLVO: 'Volvo', PORSCHE: 'Porsche', INFINITI: 'Infiniti', MITSUBISHI: 'Mitsubishi', RIVIAN: 'Rivian', GENESIS: 'Genesis', 'LAND ROVER': 'Land Rover', JAGUAR: 'Jaguar', MINI: 'MINI' };

export async function decodeVin(vin) {
  const v = cleanVin(vin); if (!VIN_RE.test(v)) return null;
  const r = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/' + v + '?format=json');
  if (!r.ok) return null;
  const d = ((await r.json()).Results || [])[0] || {};
  if (!d.Make && !d.Model) return null;
  const drive = (d.DriveType || '').replace(/\/.*$/, '').replace('4WD', '4WD').replace('All-Wheel Drive', 'AWD').replace('Front-Wheel Drive', 'FWD').replace('Rear-Wheel Drive', 'RWD').replace('4x2', '2WD');
  const engine = [d.DisplacementL ? Number(d.DisplacementL).toFixed(1) + 'L' : '', d.EngineCylinders ? (d.EngineConfiguration && /V/i.test(d.EngineConfiguration) ? 'V' : 'I') + d.EngineCylinders : '', d.EngineHP ? Math.round(Number(d.EngineHP)) + ' hp' : '', /electric/i.test(d.FuelTypePrimary || '') ? 'Electric' : ''].filter(Boolean).join(' ');
  return { vin: v, year: Number(d.ModelYear) || null, make: nice[(d.Make || '').toUpperCase()] || cap(d.Make), model: d.Model || '', trim: d.Trim || d.Series || '', engine, body: d.BodyClass || '', drive, fuel: d.FuelTypePrimary || '' };
}
