import UIKit
import Capacitor

// The genuine iOS tab bar. The Capacitor web view is hosted inside a real UITabBarController, so on
// iOS 26 and later UIKit draws the system Liquid Glass tab bar itself: floating, lensing the content
// that scrolls beneath it, with Apple's own metrics and motion. The web app never switches view
// controllers; every tab shows the same web view, and the selection is reported back to it.
final class RevynTabController: UITabBarController, UITabBarControllerDelegate {
    let hosted: UIViewController
    private(set) var ids: [String] = []
    var onSelect: ((String) -> Void)?

    init(hosting: UIViewController) {
        hosted = hosting
        super.init(nibName: nil, bundle: nil)
        delegate = self
        overrideUserInterfaceStyle = .dark
        view.backgroundColor = .black
        tabBar.tintColor = .white
        tabBar.unselectedItemTintColor = UIColor.white.withAlphaComponent(0.55)
        configure(tabs: [("home", "Home", "house", false), ("garage", "Vehicles", "car", false), ("service", "Service", "wrench.and.screwdriver", false), ("shop", "Shop", "mappin.and.ellipse", false), ("history", "History", "clock", false)])
        setBarHidden(true, animated: false)
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

    func configure(tabs: [(id: String, label: String, symbol: String, badge: Bool)]) {
        let keep = selectedIndex
        if tabs.map({ $0.id }) != ids {
            ids = tabs.map { $0.id }
            viewControllers = tabs.enumerated().map { i, t in
                let vc = UIViewController()
                vc.view.backgroundColor = .black
                vc.tabBarItem = UITabBarItem(title: t.label, image: UIImage(systemName: t.symbol), tag: i)
                return vc
            }
            selectedIndex = min(keep, max(0, tabs.count - 1))
        }
        for (i, t) in tabs.enumerated() where i < (viewControllers?.count ?? 0) {
            viewControllers?[i].tabBarItem.badgeValue = t.badge ? "" : nil
        }
        attach(to: selectedIndex)
    }

    /// Moves the one web view into the selected tab's view controller.
    func attach(to index: Int) {
        guard let vcs = viewControllers, index >= 0, index < vcs.count else { return }
        let vc = vcs[index]
        if hosted.parent === vc { return }
        hosted.willMove(toParent: nil)
        hosted.view.removeFromSuperview()
        hosted.removeFromParent()
        vc.addChild(hosted)
        hosted.view.frame = vc.view.bounds
        hosted.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        vc.view.addSubview(hosted.view)
        hosted.didMove(toParent: vc)
    }

    func select(id: String) {
        guard let i = ids.firstIndex(of: id), i != selectedIndex else { return }
        attach(to: i)
        selectedIndex = i
    }

    func setBarHidden(_ hidden: Bool, animated: Bool) {
        if #available(iOS 18.0, *) { setTabBarHidden(hidden, animated: animated) } else { tabBar.isHidden = hidden }
    }

    // Attach before UIKit swaps views so the web view never blinks.
    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        if let i = viewControllers?.firstIndex(of: viewController) { attach(to: i) }
        return true
    }
    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        guard selectedIndex < ids.count else { return }
        UISelectionFeedbackGenerator().selectionChanged()
        onSelect?(ids[selectedIndex])
    }
}

@objc(GlassTabsPlugin)
public class GlassTabsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GlassTabsPlugin"
    public let jsName = "GlassTabs"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setTabs", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "select", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setVisible", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
    ]
    private var tabs: RevynTabController? {
        var vc: UIViewController? = bridge?.viewController
        while let v = vc { if let t = v as? RevynTabController { return t }; vc = v.parent }
        return bridge?.viewController?.view.window?.rootViewController as? RevynTabController
    }

    @objc func available(_ call: CAPPluginCall) {
        let glass: Bool
        if #available(iOS 26.0, *) { glass = true } else { glass = false }
        call.resolve(["ok": tabs != nil, "glass": glass])
    }

    @objc func setTabs(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let t = self.tabs else { call.reject("no tab controller"); return }
            t.onSelect = { [weak self] id in self?.notifyListeners("select", data: ["id": id]) }
            let raw = call.getArray("tabs") as? [[String: Any]] ?? []
            t.configure(tabs: raw.map { ($0["id"] as? String ?? "", $0["label"] as? String ?? "", $0["symbol"] as? String ?? "circle", ($0["badge"] as? Bool) ?? false) })
            if let sel = call.getString("selected") { t.select(id: sel) }
            call.resolve()
        }
    }

    @objc func select(_ call: CAPPluginCall) {
        DispatchQueue.main.async { if let id = call.getString("id") { self.tabs?.select(id: id) }; call.resolve() }
    }

    @objc func setVisible(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let on = call.getBool("visible") ?? true
            self.tabs?.setBarHidden(!on, animated: true)
            call.resolve(["height": on ? Double(self.tabs?.tabBar.bounds.height ?? 49) : 0])
        }
    }
}

// Registers the plugin with the bridge; Main.storyboard points at this class.
class BridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GlassTabsPlugin())
    }
}
