import UIKit
import Capacitor

// The app's one piece of glass, and it is the real thing: a floating capsule drawn with UIKit's
// Liquid Glass (UIGlassEffect, iOS 26) laid over the web view. On older systems it falls back to a dark
// system material. The web app tells it which tabs to show and listens for the selection.
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
    private var bar: UIVisualEffectView?
    private var stack: UIStackView?
    private var selection: UIVisualEffectView?
    private var buttons: [UIButton] = []
    private var ids: [String] = []
    private var selected = 0

    private func ensureBar() -> UIVisualEffectView? {
        if let b = bar { return b }
        guard let host = bridge?.viewController?.view else { return nil }
        let effect: UIVisualEffect
        if #available(iOS 26.0, *) {
            let g = UIGlassEffect(style: .regular)
            g.isInteractive = true
            effect = g
        } else {
            effect = UIBlurEffect(style: .systemThinMaterialDark)
        }
        host.overrideUserInterfaceStyle = .dark
        bridge?.viewController?.overrideUserInterfaceStyle = .dark
        let b = UIVisualEffectView(effect: effect)
        b.overrideUserInterfaceStyle = .dark
        b.translatesAutoresizingMaskIntoConstraints = false
        b.clipsToBounds = true
        if #available(iOS 26.0, *) {
            b.cornerConfiguration = .capsule()
        } else {
            b.layer.cornerRadius = 32
        }
        host.addSubview(b)
        NSLayoutConstraint.activate([
            b.leadingAnchor.constraint(equalTo: host.safeAreaLayoutGuide.leadingAnchor, constant: 16),
            b.trailingAnchor.constraint(equalTo: host.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            b.bottomAnchor.constraint(equalTo: host.safeAreaLayoutGuide.bottomAnchor, constant: -6),
            b.heightAnchor.constraint(equalToConstant: 64),
        ])
        // Selected pill: a second, tinted glass lens that slides under the active tab.
        let selEffect: UIVisualEffect
        if #available(iOS 26.0, *) {
            let g = UIGlassEffect(style: .regular)
            g.tintColor = UIColor.white.withAlphaComponent(0.14)
            selEffect = g
        } else {
            selEffect = UIBlurEffect(style: .systemThickMaterialDark)
        }
        let sel = UIVisualEffectView(effect: selEffect)
        sel.translatesAutoresizingMaskIntoConstraints = false
        sel.isUserInteractionEnabled = false
        if #available(iOS 26.0, *) { sel.cornerConfiguration = .capsule() } else { sel.layer.cornerRadius = 26; sel.clipsToBounds = true }
        b.contentView.addSubview(sel)
        selection = sel
        let st = UIStackView()
        st.axis = .horizontal
        st.distribution = .fillEqually
        st.translatesAutoresizingMaskIntoConstraints = false
        b.contentView.addSubview(st)
        NSLayoutConstraint.activate([
            st.leadingAnchor.constraint(equalTo: b.contentView.leadingAnchor, constant: 6),
            st.trailingAnchor.constraint(equalTo: b.contentView.trailingAnchor, constant: -6),
            st.topAnchor.constraint(equalTo: b.contentView.topAnchor, constant: 6),
            st.bottomAnchor.constraint(equalTo: b.contentView.bottomAnchor, constant: -6),
        ])
        stack = st
        bar = b
        return b
    }

    private func makeButton(label: String, symbol: String, tag: Int) -> UIButton {
        var cfg = UIButton.Configuration.plain()
        cfg.image = UIImage(systemName: symbol, withConfiguration: UIImage.SymbolConfiguration(pointSize: 19, weight: .regular))
        cfg.imagePlacement = .top
        cfg.imagePadding = 4
        cfg.contentInsets = NSDirectionalEdgeInsets(top: 4, leading: 0, bottom: 2, trailing: 0)
        var attr = AttributedString(label)
        attr.font = UIFont.systemFont(ofSize: 10.5, weight: .medium)
        cfg.attributedTitle = attr
        let btn = UIButton(configuration: cfg)
        btn.tag = tag
        btn.addTarget(self, action: #selector(tapped(_:)), for: .touchUpInside)
        return btn
    }

    private func applySelection(animated: Bool) {
        guard let sel = selection, selected < buttons.count else { return }
        let target = buttons[selected]
        for (i, b) in buttons.enumerated() { b.tintColor = i == selected ? .white : UIColor.white.withAlphaComponent(0.5) }
        let move = { sel.frame = target.frame }
        target.superview?.layoutIfNeeded()
        if animated { UIView.animate(withDuration: 0.38, delay: 0, usingSpringWithDamping: 0.82, initialSpringVelocity: 0.4, options: [.allowUserInteraction], animations: move) } else { move() }
    }

    @objc private func tapped(_ sender: UIButton) {
        guard sender.tag < ids.count else { return }
        selected = sender.tag
        applySelection(animated: true)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        notifyListeners("select", data: ["id": ids[sender.tag]])
    }

    @objc func available(_ call: CAPPluginCall) {
        if #available(iOS 26.0, *) { call.resolve(["ok": true, "glass": true]) } else { call.resolve(["ok": true, "glass": false]) }
    }

    @objc func setTabs(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let b = self.ensureBar(), let st = self.stack else { call.reject("no view"); return }
            let tabs = call.getArray("tabs") as? [[String: Any]] ?? []
            let newIds = tabs.map { $0["id"] as? String ?? "" }
            if newIds != self.ids {
                self.ids = newIds
                self.buttons.forEach { $0.removeFromSuperview() }
                self.buttons = tabs.enumerated().map { i, t in self.makeButton(label: t["label"] as? String ?? "", symbol: t["symbol"] as? String ?? "circle", tag: i) }
                self.buttons.forEach { st.addArrangedSubview($0) }
            }
            // Badge: a small red dot on the tab's image.
            for (i, t) in tabs.enumerated() where i < self.buttons.count {
                let badge = (t["badge"] as? Bool) ?? false
                self.buttons[i].viewWithTag(900)?.removeFromSuperview()
                if badge {
                    let dot = UIView(frame: CGRect(x: 0, y: 0, width: 7, height: 7)); dot.tag = 900
                    dot.backgroundColor = UIColor(red: 0.88, green: 0.19, blue: 0.17, alpha: 1); dot.layer.cornerRadius = 3.5
                    dot.translatesAutoresizingMaskIntoConstraints = false
                    self.buttons[i].addSubview(dot)
                    NSLayoutConstraint.activate([dot.widthAnchor.constraint(equalToConstant: 7), dot.heightAnchor.constraint(equalToConstant: 7), dot.topAnchor.constraint(equalTo: self.buttons[i].topAnchor, constant: 8), dot.centerXAnchor.constraint(equalTo: self.buttons[i].centerXAnchor, constant: 12)])
                }
            }
            if let sel = call.getString("selected"), let i = self.ids.firstIndex(of: sel) { self.selected = i }
            b.isHidden = false
            b.layoutIfNeeded()
            self.applySelection(animated: false)
            call.resolve()
        }
    }

    @objc func select(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let id = call.getString("id"), let i = self.ids.firstIndex(of: id) { self.selected = i; self.applySelection(animated: true) }
            call.resolve()
        }
    }

    @objc func setVisible(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let on = call.getBool("visible") ?? true
            if on { _ = self.ensureBar() }
            UIView.animate(withDuration: 0.22) { self.bar?.alpha = on ? 1 : 0; self.bar?.transform = on ? .identity : CGAffineTransform(translationX: 0, y: 12) }
            self.bar?.isUserInteractionEnabled = on
            call.resolve(["height": on ? 64 : 0])
        }
    }
}

// Registers the plugin with the bridge; Main.storyboard points at this class.
class BridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GlassTabsPlugin())
    }
}
