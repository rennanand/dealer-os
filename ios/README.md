# Revyn iOS app

The customer app as a native iOS app, built with Capacitor around the same code and database
as the website. Signed-in customers and staff use the same accounts.

## Build it (needs Xcode on a Mac)

```
git clone https://github.com/rennanand/dealer-os
cd dealer-os && npm install
npm run build:ios      # builds the app bundle and copies it into ios/
npm run ios            # opens ios/App/App.xcodeproj in Xcode
```

In Xcode: select the App target → Signing & Capabilities → your team. Run on a simulator or
your iPhone. For TestFlight: Product → Archive → Distribute → App Store Connect → upload, then
add internal testers in App Store Connect (no review needed for internal testing).

Every time the web code changes, run `npm run build:ios` again and archive a new build.
Config: `capacitor.config.json` (bundle id `com.revyn.app`), `.env.app` (backend).

## iPhone Duo

Every build is checked on the Duo simulator as well (folded, unfolded, and landscape): the layout is read from the window and re-read on resize, all orientations are enabled, and `UIRequiresFullScreen` stays off. Build with Xcode 27.1 or later. Run `npm run build:ios`, then in Xcode choose the iPhone Duo simulator and fold/unfold with Hardware ▸ Fold / Unfold while the app is open.
