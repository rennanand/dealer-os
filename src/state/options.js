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
