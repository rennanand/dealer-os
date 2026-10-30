// Settings the prototype exposed as tweakable props. `startStage` is where the sample
// work order begins (0 = booked … 10 = picked up).
export const DEFAULT_OPTIONS = {
  defaultDevice: 'phone',
  startStage: 6,
  typeface: 'Geist',
  dataFont: 'Geist Mono',
  iconWeight: 1.6,
  loanerRate: 65,
};

/** Launch mode: which modules run on real records. 'loaners' puts Loaners first on the shop desktop
 *  and marks the rest as preview. Set VITE_LAUNCH=loaners. */
export const LAUNCH = import.meta.env.VITE_LAUNCH || '';

/** Native app build (Capacitor): opens straight on the customer app. VITE_TARGET=app */
export const IS_APP = import.meta.env.VITE_TARGET === 'app';

/** Bisect switches for the native app: VITE_SAFE="three,push,tabs" turns those parts off in a build. */
const SAFE_LIST = String(import.meta.env.VITE_SAFE || '').split(',').map((x) => x.trim()).filter(Boolean);
export const SAFE = { three: SAFE_LIST.includes('three'), push: SAFE_LIST.includes('push'), tabs: SAFE_LIST.includes('tabs'), list: SAFE_LIST };
