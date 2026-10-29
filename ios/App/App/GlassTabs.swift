import UIKit
import Capacitor

// A native tab bar under the web view. On iOS 26 UIKit draws it as Liquid Glass (floating, blurred,
// minimizing on scroll); on older systems it is the standard translucent bar. The web app tells it
// which tabs to show and listens for the selection.
@objc(GlassTabsPlugin)
public class GlassTabsPlugin: CAPPlugin, CAPBridgedPlugin, UITabBarDelegate {
    public let identifier = "GlassTabsPlugin"
    public let jsName = "GlassTabs"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setTabs", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "select", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setVisible", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
    ]
    private var bar: UITabBar?
    private var ids: [String] = []

    private func ensureBar() -> UITabBar? {
        if let b = bar { return b }
        guard let host = bridge?.viewController?.view else { return nil }
        let b = UITabBar()
        b.delegate = self
        b.translatesAutoresizingMaskIntoConstraints = false
        b.tintColor = .white
        b.unselectedItemTintColor = UIColor.white.withAlphaComponent(0.45)
        let ap = UITabBarAppearance()
        ap.configureWithDefaultBackground()
        b.standardAppearance = ap
        b.scrollEdgeAppearance = ap
        host.addSubview(b)
        NSLayoutConstraint.activate([
            b.leadingAnchor.constraint(equalTo: host.leadingAnchor),
            b.trailingAnchor.constraint(equalTo: host.trailingAnchor),
            b.bottomAnchor.constraint(equalTo: host.bottomAnchor),
        ])
        bar = b
        return b
    }

    @objc func available(_ call: CAPPluginCall) {
        if #available(iOS 26.0, *) { call.resolve(["ok": true, "glass": true]) } else { call.resolve(["ok": true, "glass": false]) }
    }

    @objc func setTabs(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let b = self.ensureBar() else { call.reject("no view"); return }
            let tabs = call.getArray("tabs") as? [[String: Any]] ?? []
            self.ids = tabs.map { $0["id"] as? String ?? "" }
            b.items = tabs.enumerated().map { i, t in
                let item = UITabBarItem(title: t["label"] as? String ?? "", image: UIImage(systemName: t["symbol"] as? String ?? "circle"), tag: i)
                if let badge = t["badge"] as? Bool, badge { item.badgeValue = "" }
                return item
            }
            if let sel = call.getString("selected"), let i = self.ids.firstIndex(of: sel) { b.selectedItem = b.items?[i] }
            b.isHidden = false
            call.resolve()
        }
    }

    @objc func select(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let b = self.bar, let id = call.getString("id"), let i = self.ids.firstIndex(of: id) { b.selectedItem = b.items?[i] }
            call.resolve()
        }
    }

    @objc func setVisible(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let on = call.getBool("visible") ?? true
            if on { _ = self.ensureBar() }
            UIView.animate(withDuration: 0.22) { self.bar?.alpha = on ? 1 : 0 }
            self.bar?.isUserInteractionEnabled = on
            call.resolve(["height": on ? (self.bar?.bounds.height ?? 49) : 0])
        }
    }

    public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        guard item.tag < ids.count else { return }
        notifyListeners("select", data: ["id": ids[item.tag]])
    }
}

// Registers the plugin with the bridge; Main.storyboard points at this class.
class BridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GlassTabsPlugin())
    }
}
