# Revyn — project notes

- Product name: Revyn (logo in public/uploads/revyn.png, titanium variant revyn-titanium.png, vector in brand/revyn.svg). RyGuys Tire & Auto Sales is the pilot shop; its name appears only where the shop is meant (agreements, shop settings).

- The app has NO connection to the vehicle. It cannot read mileage, charge, fluid levels, tire pressure, or any sensor.
- All vehicle data is either (a) measured by a technician at a visit, (b) entered by the customer (odometer, concern), or (c) estimated from timelines/intervals since the last visit.
- Copy must reflect this: "recorded at check-in", "measured at your visit", "estimated", "entered by you". Never imply live telemetry.
- Loaner charge/mileage figures are recorded by shop staff at handoff and return.

## Codebase

- React 18 + Vite. `npm install`, then `npm run dev`.
- Routes: `/` customer, `/tech` technician iPad, `/shop` shop desktop, `/lobby` lobby TV, `/demo` the original four-up prototype view.
- `src/surfaces/**` are the screens, ported one-to-one from the Claude Design prototype. Keep markup and inline styles as they are unless a change is asked for; the design is the spec.
- `src/state/appLogic.js` is the single view-model. Every value a screen shows comes from `renderVals()`. The constants at the top are sample data standing in for the backend.
- `src/state/sync.js` shares state between open surfaces: over Supabase realtime + the `shop_state` row when configured, else a BroadcastChannel. `LOCAL_KEYS` lists what stays per-device.
- Screens bind with the helpers in `src/runtime/tpl.js`: `css('…')` for style strings, `T()` for text, `L()` for lists.

## iOS app (Capacitor) — every build must also work on iPhone Duo

iPhone Duo is Apple's foldable: a 5.4" outer display, a 7.6" inner display, and a partly folded pose, in both orientations. The app is a web view, so the rules are:
- Never size anything from a fixed device size (`UIScreen`, hardcoded 390/430 widths as the only layout). Read the window at layout time and again on every `resize` — folding and unfolding changes the size while the app is open.
- Customer screens are a single centered column on phone widths and two columns from 700px (`useWide()` in `src/routes/MyLoaners.jsx`); shop/tech surfaces scale to fit (`useFit` in `src/routes/Surface.jsx`). Follow those patterns for new screens.
- Keep `viewport-fit=cover` and `env(safe-area-inset-*)` padding; the inner camera and the fold are reported as safe-area / reserved regions.
- All orientations stay enabled in `ios/App/App/Info.plist`, and `UIRequiresFullScreen` stays off so Split View works on the inner display.
- Build with Xcode 27.1 or later so content extends beneath the status bar and camera areas.
- The MapKit JS token (`VITE_MAPKIT_TOKEN`) lives in `.env.app.local` on the build machine and in Vercel's env — never in a committed file.
- State lives in the sync store, never in a component that remounts on resize, so a fold/unfold never loses a half-filled form.

## Push notifications

- Database triggers (migration 0016) call the `push` edge function through pg_net whenever a visit changes status, a finding is sent, or the shop replies. `public.app_config` holds `push_url` and `push_secret`.
- The edge function (`supabase/functions/push`) signs an APNs JWT with the Apple key in the function secrets: `APNS_KEY` (the .p8 contents), `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `APNS_SANDBOX` ("1" for Xcode/TestFlight-debug builds, unset for App Store), `PUSH_SECRET`.
- The app registers in `src/state/push.js` and stores the token in `device_tokens`. `ios/App/App/App.entitlements` carries `aps-environment`; the Xcode target needs the Push Notifications capability (it is in the entitlements already).
