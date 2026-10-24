// Keeps every open surface (customer, technician, shop, lobby) on the same shop state.
//
// With Supabase configured (VITE_SUPABASE_URL + key) changes travel between devices over a
// realtime channel and the merged state is saved to the shop_state row, so a reload or a
// late-opening screen picks up where things are. Without it, a BroadcastChannel links the
// tabs on one machine, which is all the local demo needs.

// State that belongs to one screen, not to the shop: where that device has navigated,
// half-typed text, measurements of its own window.
const LOCAL_KEYS = new Set([
  'device', 'view', 'tView', 'dView', 'wrapW', 'ringsIn', 'cardIdx', 'vIdx',
  'draft', 'askDraft', 'dReply', 'odoDraft', 'sigDraw', 'sigW', 'drag',
  'noVehicle', 'shopClosed', // review switches, never shared
]);

// Shared live but never saved: a notification shown now should not greet a screen that opens tomorrow.
const TRANSIENT_KEYS = new Set(['toast']);

export const sharedPart = (state, { forSave = false } = {}) => {
  const out = {};
  for (const k in state) if (!LOCAL_KEYS.has(k) && !(forSave && TRANSIENT_KEYS.has(k)) && state[k] !== undefined) out[k] = state[k];
  return out;
};

export function broadcastTransport(name) {
  if (typeof BroadcastChannel === 'undefined') return null;
  const ch = new BroadcastChannel(name);
  return {
    send: (msg) => {
      try {
        ch.postMessage(msg);
      } catch (e) {
        console.warn('[sync] could not send', e);
      }
    },
    listen: (fn) => {
      ch.onmessage = (e) => fn(e.data);
    },
    close: () => ch.close(),
  };
}

/**
 * Supabase transport: patches go out on a realtime broadcast channel; the full shared
 * state is saved to shop_state (debounced) and read back when a surface opens.
 */
export function supabaseTransport(client, shopId, { saveDelay = 800 } = {}) {
  const channel = client.channel('shop:' + shopId, { config: { broadcast: { self: false } } });
  let onMsg = () => {};
  let saveTimer = null;
  let pendingState = null;
  const flush = async () => {
    saveTimer = null;
    const state = pendingState;
    pendingState = null;
    if (!state) return;
    const { error } = await client.from('shop_state').update({ state }).eq('shop_id', shopId);
    if (error) console.warn('[sync] save failed', error.message);
  };
  channel.on('broadcast', { event: 'patch' }, ({ payload }) => onMsg({ type: 'patch', patch: payload }));
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      client.from('shop_state').select('state').eq('shop_id', shopId).single().then(({ data, error }) => {
        if (error) console.warn('[sync] load failed', error.message);
        else if (data && data.state && Object.keys(data.state).length) onMsg({ type: 'snapshot', state: data.state });
      });
    }
  });
  return {
    send: (msg) => {
      if (msg.type === 'patch') channel.send({ type: 'broadcast', event: 'patch', payload: msg.patch });
      else if (msg.type === 'save') {
        pendingState = msg.state;
        if (!saveTimer) saveTimer = setTimeout(flush, saveDelay);
      }
    },
    listen: (fn) => {
      onMsg = fn;
    },
    close: () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        flush();
      }
      client.removeChannel(channel);
    },
  };
}

/**
 * Connects one view-model to the shared channel.
 *   const sync = connectSync(getState, apply, transport)   // apply(patch) writes into the view-model without re-sending
 *   sync.publish(patch)                                     // call after every local state change
 */
export function connectSync(getState, apply, transport) {
  if (!transport) return { publish() {}, close() {} };
  let gotSnapshot = false;
  transport.listen((msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'patch') apply(msg.patch);
    else if (msg.type === 'hello') transport.send({ type: 'snapshot', state: sharedPart(getState()) });
    else if (msg.type === 'snapshot' && !gotSnapshot) {
      gotSnapshot = true;
      apply(msg.state);
    }
  });
  transport.send({ type: 'hello' }); // a surface that opens late asks the others where things stand
  return {
    publish(patch) {
      const shared = sharedPart(patch);
      if (!Object.keys(shared).length) return;
      transport.send({ type: 'patch', patch: shared });
      transport.send({ type: 'save', state: sharedPart(getState(), { forSave: true }) });
    },
    close: () => transport.close(),
  };
}
