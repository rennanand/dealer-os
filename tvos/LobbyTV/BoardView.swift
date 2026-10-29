import SwiftUI

// The board itself. Same language as the web lobby: black, white type, mono labels,
// red / yellow / green for out / due today / available.
struct BoardView: View {
    @StateObject private var model = BoardModel()
    private let red = Color(red: 0.88, green: 0.19, blue: 0.17)
    private let yellow = Color(red: 1, green: 0.84, blue: 0.04)
    private let green = Color(red: 0.19, green: 0.82, blue: 0.35)
    private let dim = Color.white.opacity(0.5)

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 0) {
                header
                Spacer().frame(height: 48)
                if let b = model.board {
                    if b.rentals.isEmpty {
                        idle(b)
                    } else {
                        HStack(alignment: .top, spacing: 64) {
                            rentals(b.rentals)
                            fleet(b.fleet)
                        }
                    }
                } else if let e = model.error {
                    Text(e).font(.system(size: 36, weight: .semibold)).foregroundColor(.white)
                }
                Spacer()
                footer
            }
            .padding(.horizontal, 90).padding(.vertical, 70)
        }
        .onAppear { model.start() }
    }

    var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 10) {
                Text("LOANERS · \(model.board?.shop?.name.uppercased() ?? "")").font(.system(size: 20, weight: .medium, design: .monospaced)).kerning(3).foregroundColor(dim)
                Text("Updated live from the front desk.").font(.system(size: 28)).foregroundColor(.white.opacity(0.7))
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 10) {
                Text(model.now, format: .dateTime.hour().minute()).font(.system(size: 84, weight: .light, design: .monospaced)).foregroundColor(.white)
                Text(model.now.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day().year()).uppercased()).font(.system(size: 20, weight: .medium, design: .monospaced)).kerning(3).foregroundColor(dim)
            }
        }
    }

    func rentals(_ rs: [Board.Rental]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                label("Guest").frame(width: 360, alignment: .leading)
                label("Vehicle").frame(width: 520, alignment: .leading)
                label("Status").frame(maxWidth: .infinity, alignment: .leading)
                label("Due back").frame(width: 260, alignment: .trailing)
            }
            .padding(.bottom, 18).overlay(Rectangle().frame(height: 1).foregroundColor(.white.opacity(0.16)), alignment: .bottom)
            ForEach(rs) { r in
                let out = r.status == "out"
                let due = isToday(r.end_date)
                HStack {
                    Text(r.who).font(.system(size: 40, weight: .medium)).foregroundColor(.white).frame(width: 360, alignment: .leading)
                    HStack(spacing: 14) {
                        Circle().fill(Color(hex: r.paint ?? "#b9bdc3")).frame(width: 18, height: 18)
                        Text(r.vehicle ?? "—").font(.system(size: 30)).foregroundColor(.white.opacity(0.75))
                    }.frame(width: 520, alignment: .leading)
                    Text(out ? (due ? "Due back today" : "Out with guest") : "Signed · keys at the desk")
                        .font(.system(size: 28, weight: .medium)).foregroundColor(out ? (due ? yellow : red) : green)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(due ? "Today" : dayLabel(r.end_date)).font(.system(size: 40, weight: .light, design: .monospaced)).foregroundColor(.white).frame(width: 260, alignment: .trailing)
                }
                .padding(.vertical, 30).overlay(Rectangle().frame(height: 1).foregroundColor(.white.opacity(0.08)), alignment: .bottom)
            }
        }
    }

    func fleet(_ fs: [Board.Vehicle]) -> some View {
        VStack(alignment: .leading, spacing: 22) {
            label("Fleet")
            ForEach(fs) { v in
                HStack(spacing: 14) {
                    Circle().fill(Color(hex: v.paint)).frame(width: 16, height: 16)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(v.vehicle).font(.system(size: 26, weight: .medium)).foregroundColor(.white)
                        Text(v.status == "available" ? "Available" : v.status == "out" ? "Out" : "In for service")
                            .font(.system(size: 20)).foregroundColor(v.status == "available" ? green : v.status == "out" ? red : dim)
                    }
                }
            }
        }
        .frame(width: 420, alignment: .leading)
        .padding(.leading, 56).overlay(Rectangle().frame(width: 1).foregroundColor(.white.opacity(0.12)), alignment: .leading)
    }

    func idle(_ b: Board) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Spacer()
            Text("No loaners out.").font(.system(size: 110, weight: .semibold)).foregroundColor(.white).kerning(-3)
            Text("\(b.fleet.filter { $0.status == "available" }.count) available at the front desk.").font(.system(size: 36)).foregroundColor(dim)
            Spacer()
        }
    }

    var footer: some View {
        HStack(alignment: .bottom) {
            if let s = model.board?.shop {
                HStack(spacing: 60) {
                    if !s.hours.isEmpty { kv("Hours", s.hours) }
                    if !s.phone.isEmpty { kv("Front desk", s.phone) }
                }
            }
            Spacer()
            Text("Agreements, handoff and return are in the RyGuys app.").font(.system(size: 22)).foregroundColor(dim).multilineTextAlignment(.trailing)
        }
    }
    func label(_ t: String) -> some View { Text(t.uppercased()).font(.system(size: 18, weight: .medium, design: .monospaced)).kerning(3).foregroundColor(.white.opacity(0.4)) }
    func kv(_ k: String, _ v: String) -> some View { VStack(alignment: .leading, spacing: 8) { label(k); Text(v).font(.system(size: 26)).foregroundColor(.white) } }
}

extension Color {
    init(hex: String) {
        var h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        if h.count == 3 { h = h.map { "\($0)\($0)" }.joined() }
        let v = UInt64(h, radix: 16) ?? 0xb9bdc3
        self.init(red: Double((v >> 16) & 0xff) / 255, green: Double((v >> 8) & 0xff) / 255, blue: Double(v & 0xff) / 255)
    }
}
