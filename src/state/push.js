// Push registration for the native app. The token is stored per signed-in user; the database
// triggers in migration 0016 decide when to notify. On the web this is a no-op.
import { supabase } from './supabase.js';
import { IS_APP } from './options.js';

let Push = null;
export async function setupPush(userId, onOpen) {
  if (!IS_APP || !supabase || !userId) return;
  try {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) return;
    Push = Push || (await import('@capacitor/push-notifications')).PushNotifications;
    const perm = await Push.checkPermissions();
    let state = perm.receive;
    if (state === 'prompt' || state === 'prompt-with-rationale') state = (await Push.requestPermissions()).receive;
    if (state !== 'granted') return;
    await Push.removeAllListeners();
    Push.addListener('registration', async ({ value }) => {
      await supabase.from('device_tokens').upsert({ token: value, user_id: userId, platform: 'ios', updated_at: new Date().toISOString() });
    });
    Push.addListener('registrationError', (e) => console.warn('push registration failed', e));
    Push.addListener('pushNotificationActionPerformed', (n) => { const d = (n.notification && n.notification.data) || {}; if (onOpen) onOpen(d); });
    Push.addListener('pushNotificationReceived', () => { if (onOpen) onOpen({ refresh: true }); });
    await Push.register();
  } catch (e) { console.warn('push setup', e); }
}
