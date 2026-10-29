# Revyn Lobby TV (Apple TV)

A small SwiftUI app that shows the loaner board on an Apple TV. It reads the same database
as the website through a display token, so nothing on the TV needs a login.

## Build it (about 10 minutes, needs Xcode)

1. Xcode → File → New → Project → **tvOS → App**. Product name `LobbyTV`, interface SwiftUI,
   language Swift. Save it anywhere (not inside this repo).
2. Delete the generated `ContentView.swift` and `LobbyTVApp.swift`.
3. Drag the three files in `tvos/LobbyTV/` into the project (tick "Copy items if needed").
4. In `LobbyTVApp.swift` set `BOARD_TOKEN` to the display token.
5. Signing & Capabilities → pick your team. Run on the Apple TV simulator, then on the real
   Apple TV (Window → Devices and Simulators → pair the TV by code).

## Display tokens

One per screen, created from the shop desktop (Team → Displays) or by SQL:
`insert into public.display_tokens (name) values ('Lobby TV') returning token;`
Delete the row to switch a screen off.
