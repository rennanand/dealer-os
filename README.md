# DealerOS (RyGuys pilot)

Customer app, technician iPad, shop desktop and lobby TV for RyGuys Tire & Auto, ported from the Claude Design prototype (v5) into a React codebase.

## Run it

```
npm install
npm run dev
```

Then open:

| URL | Surface | Sized for |
| --- | --- | --- |
| `/` | Customer app | iPhone |
| `/tech` | Technician | iPad, landscape |
| `/shop` | Shop desktop | Laptop / desktop browser |
| `/lobby` | Lobby board | 16:9 TV |
| `/demo` | The prototype as designed: device switcher, service-state stepper | Desktop |

Open two or more in separate windows. They share one shop state, so advancing a job on `/tech` moves the customer's phone and the lobby board.

## What is real and what is not

- Real: every screen, flow and interaction from the prototype, on its own route, at device size.
- Real: live state between surfaces across devices, through Supabase (`supabase/migrations`). Without a `.env.local` it falls back to linking tabs on one machine.
- Not yet: sign-in, and more than the one sample customer and work order. The sample data lives at the top of `src/state/appLogic.js`; the shared state is saved as one JSON row per shop until the normalized tables land.

## Backend setup

1. Run `supabase/migrations/0001_shop_state.sql` in the Supabase SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the publishable key.
3. On Vercel, add the same three variables under Project Settings → Environment Variables.

## Layout

```
src/
  surfaces/customer|tech|shop|lobby   screens, one file each
  surfaces/Demo.jsx                   the four-up prototype view
  state/appLogic.js                   view-model + sample data
  state/sync.js                       shared state between surfaces
  runtime/                            small render helpers and the view-model host
  components/                         3D car, 3D service scenes, iPhone frame
public/uploads/                       logo, car model
tools/                                the one-time converter and the prototype source it read
```

## How the port was checked

The original prototype and this app were driven side by side in a headless browser and their rendered DOM compared: all 65 screens at all 11 service stages (715 states), plus about 3,000 steps of identical random clicking and typing. No differences.
