import UIKit
import Capacitor

// Scene lifecycle, required by current iOS SDKs. The window and the Capacitor view controller
// come from Main.storyboard via UISceneStoryboardFile in Info.plist.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard scene is UIWindowScene else { return }
        // Wrap the Capacitor view controller in a real UITabBarController so iOS draws its own
        // Liquid Glass tab bar (iOS 26+). The web app drives it through the GlassTabs plugin.
        if let win = window, let bridge = win.rootViewController as? BridgeViewController, !(bridge.parent is RevynTabController) {
            win.rootViewController = RevynTabController(hosting: bridge)
        }
        if let url = connectionOptions.urlContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}
