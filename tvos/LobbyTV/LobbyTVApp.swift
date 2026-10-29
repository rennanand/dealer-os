import SwiftUI

// DealerOS Lobby board for Apple TV. Reads the loaner board through a display token every 20 s.
// Set BOARD_TOKEN below (Shop desktop → Team → Displays, or the token Rennan gave you).
let SUPABASE_URL = "https://jallgarfyrqpfgrbdcau.supabase.co"
let SUPABASE_KEY = "sb_publishable_aPt1pgHQnvHOGR_ydaXo5Q_g2ZdE3NG"
let BOARD_TOKEN = "REPLACE_WITH_DISPLAY_TOKEN"

@main
struct LobbyTVApp: App {
    var body: some Scene { WindowGroup { BoardView() } }
}
