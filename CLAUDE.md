# RyGuys Dealership App — project notes

- The app has NO connection to the vehicle. It cannot read mileage, charge, fluid levels, tire pressure, or any sensor.
- All vehicle data is either (a) measured by a technician at a visit, (b) entered by the customer (odometer, concern), or (c) estimated from timelines/intervals since the last visit.
- Copy must reflect this: "recorded at check-in", "measured at your visit", "estimated", "entered by you". Never imply live telemetry.
- Loaner charge/mileage figures are recorded by shop staff at handoff and return.

## Codebase

- React 18 + Vite. `npm install`, then `npm run dev`.
- Routes: `/` customer, `/tech` technician iPad, `/shop` shop desktop, `/lobby` lobby TV, `/demo` the original four-up prototype view.
- `src/surfaces/**` are the screens, ported one-to-one from the Claude Design prototype. Keep markup and inline styles as they are unless a change is asked for; the design is the spec.
- `src/state/appLogic.js` is the single view-model. Every value a screen shows comes from `renderVals()`. The constants at the top are sample data standing in for the backend.
- `src/state/sync.js` shares state between open surfaces. `LOCAL_KEYS` lists what stays per-device.
- Screens bind with the helpers in `src/runtime/tpl.js`: `css('…')` for style strings, `T()` for text, `L()` for lists.
