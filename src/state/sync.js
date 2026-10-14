// Keeps every open surface (customer, technician, shop, lobby) on the same shop state.
//
// Today this runs over a BroadcastChannel, so it links tabs and windows on one machine.
// It is the seam for the backend: swap `transport` for a realtime channel plus a saved
// row per work order and the surfaces stay in step across devices with no other changes.

// State that belongs to one screen, not to the shop: where that device has navigated,
// half-typed text, measurements of its own window.
const LOCAL_KEYS = new Set([
  'device', 'view', 'tView', 'dView', 'wrapW', 'ringsIn', 'cardIdx', 'vIdx',
  'draft', 'askDraft', 'dReply', 'odoDraft', 'sigDraw', 'sigW', 'drag',
]);

export const sharedPart = (state) => {
  const out = {};
  for (const k in state) if (!LOCAL_KEYS.has(k)) out[k] = state[k];
  return out;
};

function broadcastTransport(name) {
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
 * Connects one view-model to the shared channel.
 *   const sync = connectSync(logic, apply)   // apply(patch) writes into the view-model without re-sending
 *   sync.publish(patch)                      // call after every local state change
 */
export function connectSync(getState, apply, transport = broadcastTransport('ryguys-shop')) {
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
      if (Object.keys(shared).length) transport.send({ type: 'patch', patch: shared });
    },
    close: () => transport.close(),
  };
}
