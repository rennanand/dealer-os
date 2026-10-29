import React from 'react';
import { css } from '../runtime/tpl.js';

/** Thin bar at the top while the device has no connection; changes keep working locally and sync when it returns. */
export function OfflineBar() {
  const [off, setOff] = React.useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  React.useEffect(() => {
    const on = () => setOff(false), offf = () => setOff(true);
    window.addEventListener('online', on); window.addEventListener('offline', offf);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', offf); };
  }, []);
  if (!off) return null;
  return (
    <div style={css('position:fixed;left:0;right:0;top:0;z-index:9999;padding:calc(env(safe-area-inset-top,0px) + 8px) 14px 8px;background:#e0312b;color:#fff;font-size:12.5px;font-weight:600;text-align:center;letter-spacing:.1px')}>
      No connection. You can keep working; changes will sync when the connection is back.
    </div>
  );
}
