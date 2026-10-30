// Safe mode for the 3D car. If the app (or the phone) died while this app was in the foreground, the
// next launch runs without WebGL so the customer can still use everything else. A switch in Account
// turns the 3D car off or back on by hand.
const K_NO3D = 'revyn.no3d', K_BOOT = 'revyn.boot', K_CRASH = 'revyn.crashes';
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } };

export const threeEnabled = () => get(K_NO3D) !== '1';
export const threeAuto = () => get(K_NO3D + '.auto') === '1';
export function setThree(on) { set(K_NO3D, on ? '0' : '1'); set(K_NO3D + '.auto', '0'); if (!on) set(K_CRASH, '0'); }

export function markBoot() {
  if (get(K_BOOT) === 'dirty') {
    const n = (parseInt(get(K_CRASH) || '0', 10) || 0) + 1; set(K_CRASH, String(n));
    if (n >= 2 && get(K_NO3D) !== '0') { set(K_NO3D, '1'); set(K_NO3D + '.auto', '1'); } // twice in a row: a force-quit alone never counts
  } else {
    set(K_CRASH, '0');
  }
  set(K_BOOT, 'dirty');
  const clean = () => set(K_BOOT, 'clean');
  window.addEventListener('pagehide', clean);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clean(); else set(K_BOOT, 'dirty'); });
}
