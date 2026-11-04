// Browser smoke for CI: every shop page, the tech page, the customer app and the public links render
// in the demo build with no page errors. Run after the demo build is served on 8803 (see .github/workflows/ci.yml).
import { chromium } from 'playwright-core';
const b = await chromium.launch();
const errs = [];
const page = async (w, h) => { const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', (e) => errs.push('PAGEERROR ' + p.url() + ' ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon|manifest|net::ERR|WebGL|GPU/.test(m.text())) errs.push('CONSOLE ' + p.url() + ' ' + m.text().slice(0, 160)); }); return p; };
let p = await page(1440, 900);
await p.goto('http://127.0.0.1:8803/shop'); await p.waitForTimeout(2500);
for (const l of ['Overview', 'Schedule', 'Appointments', 'Estimates', 'Job board', 'Follow-ups', 'Customers', 'Fleet', 'Inbox', 'Parts', 'Payments', 'Marketing', 'Tires', 'Loaners', 'Technicians', 'Reports', 'Team', 'Settings']) {
  await p.locator('div', { hasText: new RegExp('^' + l + '$') }).last().click().catch((e) => errs.push('NAV ' + l + ' ' + e.message)); await p.waitForTimeout(400);
}
await p.close();
p = await page(1024, 768); await p.goto('http://127.0.0.1:8803/tech'); await p.waitForTimeout(1500); await p.close();
p = await page(390, 844);
for (const u of ['/app', '/visit/demo', '/visit/live', '/estimate/demo', '/pay/demo', '/book', '/rental/demo']) { await p.goto('http://127.0.0.1:8803' + u); await p.waitForTimeout(1200); }
await p.close(); await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('browser smoke: ok');
