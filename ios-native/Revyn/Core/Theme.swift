import SwiftUI

// Tesla-flat: a black canvas, charcoal cards, white type, one accent per state. No gradients or
// hand-drawn glass; the system's Liquid Glass tab bar is the only glass.
enum Theme {
    static let bg = Color.black
    static let card = Color(red: 0x14 / 255, green: 0x14 / 255, blue: 0x16 / 255)
    static let card2 = Color(red: 0x1f / 255, green: 0x1f / 255, blue: 0x22 / 255)
    static let control = Color(red: 0x2a / 255, green: 0x2a / 255, blue: 0x2e / 255)
    static let red = Color(red: 0xe0 / 255, green: 0x31 / 255, blue: 0x2b / 255)
    static let green = Color(red: 0x30 / 255, green: 0xd1 / 255, blue: 0x58 / 255)
    static let yellow = Color(red: 1, green: 0xd6 / 255, blue: 0x0a / 255)
    static let blue = Color(red: 0x3d / 255, green: 0x8b / 255, blue: 0xfd / 255)
    static let dim = Color.white.opacity(0.55)
    static let dimmer = Color.white.opacity(0.35)
    static let line = Color.white.opacity(0.07)
    static let radius: CGFloat = 16

    /// Paint for the 3D car from whatever the customer typed ("Red", "Midnight Silver Metallic", "dark grey").
    /// The longest matching word wins, so "silver" beats "metallic" and "midnight" beats "blue" in "midnight blue".
    static func paint(for v: Vehicle?) -> Color { paint(named: (v?.color ?? "") + " " + (v?.model ?? "")) }
    static func paint(named raw: String) -> Color {
        let t = raw.lowercased()
        let table: [(String, UInt32)] = [
            ("pearl", 0xeceff3), ("white", 0xeef0f2), ("ivory", 0xe9e4d4), ("cream", 0xe6dfc8), ("champagne", 0xd8c8a4),
            ("black", 0x0f1013), ("onyx", 0x0f1013), ("jet", 0x0f1013), ("obsidian", 0x111216), ("midnight", 0x121622), ("ebony", 0x0f1013),
            ("silver", 0xc3c8ce), ("titanium", 0x9ea3ab), ("platinum", 0xd2d5da), ("steel", 0x7b8189), ("gunmetal", 0x4a4f57), ("graphite", 0x3a3d42), ("charcoal", 0x3a3d42), ("slate", 0x5a6270), ("gray", 0x8a8f95), ("grey", 0x8a8f95), ("magnetic", 0x4f535a),
            ("maroon", 0x6a0f1a), ("burgundy", 0x6a0f1a), ("wine", 0x5a1020), ("crimson", 0xb0101e), ("scarlet", 0xd0141c), ("cherry", 0xb8121f), ("ruby", 0xa81224), ("red", 0xc8101a), ("rapid", 0xc8101a), ("race", 0xc8101a),
            ("navy", 0x15284f), ("cobalt", 0x1f3f9a), ("royal", 0x2449a8), ("sapphire", 0x1b3f8f), ("sky", 0x5f9ad8), ("teal", 0x2f8a96), ("turquoise", 0x3fb0b8), ("blue", 0x1f4fa0),
            ("forest", 0x1f4a32), ("emerald", 0x1f6e4a), ("olive", 0x5e6a33), ("lime", 0x8fc43f), ("green", 0x1f5a3a),
            ("tan", 0xc2b08c), ("beige", 0xc2b08c), ("sand", 0xcdb892), ("khaki", 0xb8a77a), ("gold", 0xb8923a), ("copper", 0xb0623a), ("bronze", 0x8a6a3a), ("mocha", 0x5b4334), ("chocolate", 0x4a3226), ("brown", 0x5a4030),
            ("orange", 0xe0561a), ("yellow", 0xe3bd1f), ("pink", 0xd9789a), ("magenta", 0xb0307a), ("purple", 0x5a2a7a), ("violet", 0x6a3a9a), ("plum", 0x5a2a4a),
        ]
        var best: (Int, UInt32)? = nil
        for (name, hex) in table where t.range(of: name) != nil {
            if best == nil || name.count > best!.0 { best = (name.count, hex) }
        }
        return Color(hex: best?.1 ?? 0x868a93)
    }
}

extension Color {
    init(hex: UInt32) { self.init(red: Double((hex >> 16) & 0xff) / 255, green: Double((hex >> 8) & 0xff) / 255, blue: Double(hex & 0xff) / 255) }
}

// MARK: building blocks

struct Card<Content: View>: View {
    var padding: CGFloat = 18
    @ViewBuilder var content: () -> Content
    var body: some View {
        content().padding(padding).frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.radius, style: .continuous))
    }
}

/// Tesla's list row: icon, title, optional subtitle, chevron.
struct Row: View {
    var icon: String
    var title: String
    var subtitle: String? = nil
    var value: String? = nil
    var valueColor: Color = Theme.dim
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon).font(.system(size: 20, weight: .regular)).foregroundStyle(.white.opacity(0.85)).frame(width: 26)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.system(size: 19, weight: .semibold))
                if let s = subtitle, !s.isEmpty { Text(s).font(.system(size: 13.5)).foregroundStyle(Theme.dim) }
            }
            Spacer(minLength: 8)
            if let v = value { Text(v).font(.system(size: 14, weight: .medium)).foregroundStyle(valueColor) }
            Image(systemName: "chevron.right").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.dimmer)
        }
        .padding(.vertical, 16)
        .contentShape(Rectangle())
    }
}

struct PrimaryButton: View {
    var title: String
    var enabled = true
    var busy = false
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            ZStack {
                Text(title).font(.system(size: 16, weight: .semibold)).opacity(busy ? 0 : 1)
                if busy { ProgressView().tint(.black) }
            }
            .frame(maxWidth: .infinity).frame(height: 52)
            .background(enabled ? Color.white : Color.white.opacity(0.14), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .foregroundStyle(enabled ? .black : Theme.dim)
        }
        .disabled(!enabled || busy)
        .buttonStyle(.plain)
    }
}

struct SecondaryButton: View {
    var title: String
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title).font(.system(size: 16, weight: .medium)).frame(maxWidth: .infinity).frame(height: 52)
                .background(Theme.control, in: RoundedRectangle(cornerRadius: 14, style: .continuous)).foregroundStyle(.white)
        }.buttonStyle(.plain)
    }
}

struct Pill: View {
    var text: String
    var color: Color
    var body: some View {
        Text(text.uppercased()).font(.system(size: 10.5, weight: .medium, design: .monospaced)).tracking(1.2)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .overlay(RoundedRectangle(cornerRadius: 4).stroke(color, lineWidth: 1)).foregroundStyle(color)
    }
}

struct StatusRing: View {
    var progress: Double
    var color: Color
    var size: CGFloat = 52
    var label: String
    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.12), lineWidth: 5)
            Circle().trim(from: 0, to: progress).stroke(color, style: StrokeStyle(lineWidth: 5, lineCap: .round)).rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.6), value: progress)
            Text(label).font(.system(size: 11, weight: .medium, design: .monospaced))
        }.frame(width: size, height: size)
    }
}

struct FieldStyle: ViewModifier {
    func body(content: Content) -> some View {
        content.padding(.horizontal, 14).frame(height: 52)
            .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .foregroundStyle(.white).font(.system(size: 17))
    }
}
extension View { func field() -> some View { modifier(FieldStyle()) } }

struct Pulse: ViewModifier {
    @State private var on = false
    func body(content: Content) -> some View {
        content.opacity(on ? 0.3 : 1).onAppear { withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) { on = true } }
    }
}
extension View { func pulsing() -> some View { modifier(Pulse()) } }

struct SectionLabel: View {
    var text: String
    var body: some View { Text(text).font(.system(size: 13)).foregroundStyle(Theme.dimmer).frame(maxWidth: .infinity, alignment: .leading) }
}

enum Haptic {
    static func tap() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    static func warning() { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
}
