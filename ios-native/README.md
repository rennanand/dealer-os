# Revyn — native iOS app (SwiftUI)

The customer app, built natively. Same Supabase project as the website and the shop desktop, so every
record is shared; only the UI is native. Nothing here is a web view.

- Open `Revyn.xcodeproj` in Xcode 26 or later. Swift Package Manager fetches `supabase-swift` on first open.
- `Revyn/Core/Secrets.swift` (git-ignored) holds the Supabase URL and publishable key — copy
  `Secrets.example.swift` there and fill it from `.env.app`.
- Bundle id `orbitstudiocrm.com`, team DX89G3WGK7 — the same as the Capacitor shell, so signing, push
  and TestFlight carry over. Installing this build replaces the web-shell app on the device.
- `Revyn/Resources/hardtop.obj` is the 3D car, exported from `public/uploads/hardtop.glb.txt` grouped by
  material (paint, chrome, glass, rubber, headlamp, taillamp…). SceneKit renders it on Metal.

Structure: `Core/` models, Supabase client, `AppModel` (state + every action as an RPC); `Views/` one
folder per tab. The design is Tesla-flat: black canvas, charcoal cards, the system Liquid Glass tab bar.
