import UIKit
import UserNotifications
import Supabase

/// APNs registration. The token lands in `device_tokens`; the database triggers (migration 0016)
/// decide when to notify, and the `push` edge function sends through Apple.
final class PushDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    static weak var model: AppModel?
    private static var pendingToken: String?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    /// Ask once the customer is signed in and has a phone on file; never on the sign-in screen.
    static func requestIfNeeded() {
        UNUserNotificationCenter.current().getNotificationSettings { s in
            switch s.authorizationStatus {
            case .notDetermined:
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { ok, _ in
                    if ok { DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() } }
                }
            case .authorized, .provisional, .ephemeral:
                DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
            default: break
            }
        }
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        Self.pendingToken = token
        Task { await Self.store(token) }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("push registration failed:", error.localizedDescription)
    }

    struct TokenRow: Encodable { let token: String; let user_id: UUID; let platform: String; let updated_at: Date }
    @MainActor static func store(_ token: String? = nil) async {
        guard let t = token ?? pendingToken, let uid = model?.session?.user.id else { return }
        do {
            try await Supa.client.from("device_tokens").upsert(TokenRow(token: t, user_id: uid, platform: "ios", updated_at: Date())).execute()
        } catch { print("device token:", error.localizedDescription) }
    }

    // Show banners while the app is open, and refresh the data behind them.
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        await Self.model?.refresh()
        return [.banner, .sound, .badge]
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        let data = response.notification.request.content.userInfo
        await MainActor.run {
            guard let m = Self.model else { return }
            switch data["view"] as? String {
            case "tires", "findings", "service", "messages": m.tab = .service
            case "history": m.tab = .history
            default: m.tab = .home
            }
        }
        await Self.model?.refresh()
    }
}
