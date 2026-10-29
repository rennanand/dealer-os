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
                    HStack(alignment: .top, spacing: 64) {
                        bays(b.bays ?? [])
                        side(b)
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
                Text("SERVICE STATUS · \(model.board?.shop?.name.uppercased() ?? "")").font(.system(size: 20, weight: .medium, design: .monospaced)).kerning(3).foregroundColor(dim)
                Text("Updated live from the shop floor.").font(.system(size: 28)).foregroundColor(.white.opacity(0.7))
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 10) {
                Text(model.now, format: .dateTime.hour().minute()).font(.system(size: 84, weight: .light, design: .monospaced)).foregroundColor(.white)
                Text(model.now.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day().year()).uppercased()).font(.system(size: 20, weight: .medium, design: .monospaced)).kerning(3).foregroundColor(dim)
            }
        }
    }

    // Five bays, always. Guests by first name and initial; status moves with the technician.
    func bays(_ bs: [Board.Bay]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                label("Bay").frame(width: 170, alignment: .leading)
                label("Guest").frame(width: 300, alignment: .leading)
                label("Vehicle").frame(width: 380, alignment: .leading)
                label("Progress").frame(maxWidth: .infinity, alignment: .leading)
                label("Ready").frame(width: 200, alignment: .trailing)
            }
            .padding(.bottom, 18).overlay(Rectangle().frame(height: 1).foregroundColor(.white.opacity(0.16)), alignment: .bottom)
            ForEach(1...5, id: \.self) { n in
                let b = bs.first { $0.bay == n && ($0.status == "arrived" || $0.status == "in_progress") } ?? bs.first { $0.bay == n }
                let c: Color = b == nil ? .white.opacity(0.3) : b!.pending > 0 ? yellow : b!.status == "done" ? green : b!.status == "in_progress" ? yellow : red
                let st = b == nil ? "" : b!.pending > 0 ? "Waiting for approval" : b!.status == "done" ? "Ready for pickup" : b!.status == "in_progress" ? "In service" : "Checked in"
                let pct: Double = b == nil ? 0 : b!.pending > 0 ? 0.35 : b!.status == "done" ? 1 : b!.status == "in_progress" ? 0.55 : 0.08
                HStack(alignment: .center) {
                    Text(String(format: "BAY %02d", n)).font(.system(size: 20, weight: .medium, design: .monospaced)).kerning(2).foregroundColor(c)
                        .padding(.horizontal, 14).padding(.vertical, 8).overlay(RoundedRectangle(cornerRadius: 6).stroke(c, lineWidth: 1.5)).frame(width: 170, alignment: .leading)
                    Text(b?.who ?? "Open").font(.system(size: 40, weight: .medium)).foregroundColor(b == nil ? .white.opacity(0.85) : .white).frame(width: 300, alignment: .leading)
                    Text(b?.vehicle ?? "").font(.system(size: 30)).foregroundColor(.white.opacity(0.75)).frame(width: 380, alignment: .leading)
                    VStack(alignment: .leading, spacing: 10) {
                        if let b = b {
                            HStack { Text(st).font(.system(size: 26, weight: .medium)).foregroundColor(c); Spacer(); Text("\(Int(pct * 100))%").font(.system(size: 22, design: .monospaced)).foregroundColor(.white.opacity(0.5)) }
                            Text(b.tech.map { "\($0) on it" } ?? b.job).font(.system(size: 22)).foregroundColor(.white.opacity(0.45))
                        }
                        GeometryReader { g in
                            ZStack(alignment: .leading) {
                                Rectangle().fill(Color.white.opacity(0.12)).frame(height: 4)
                                Rectangle().fill(c).frame(width: g.size.width * pct, height: 4)
                            }
                        }.frame(height: 4)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                    Text(b?.status == "done" ? "Ready" : (b == nil ? "" : "—")).font(.system(size: 40, weight: .light, design: .monospaced)).foregroundColor(b?.status == "done" ? green : .white).frame(width: 200, alignment: .trailing)
                }
                .padding(.vertical, 26).overlay(Rectangle().frame(height: 1).foregroundColor(.white.opacity(0.08)), alignment: .bottom)
            }
        }
    }

    func side(_ b: Board) -> some View {
        VStack(alignment: .leading, spacing: 22) {
            label("Loaners")
            if b.rentals.isEmpty {
                Text("None out.").font(.system(size: 26)).foregroundColor(dim)
            }
            ForEach(b.rentals) { r in
                let out = r.status == "out"; let due = isToday(r.end_date)
                HStack(spacing: 14) {
                    Circle().fill(Color(hex: r.paint ?? "#b9bdc3")).frame(width: 16, height: 16)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(r.who) · \(r.vehicle ?? "Loaner")").font(.system(size: 26, weight: .medium)).foregroundColor(.white).lineLimit(1)
                        Text(out ? (due ? "Due back today" : "Back \(dayLabel(r.end_date))") : "Keys at the desk").font(.system(size: 20)).foregroundColor(out ? (due ? yellow : red) : green)
                    }
                }
            }
            Spacer().frame(height: 10)
            label("Fleet")
            ForEach(b.fleet) { v in
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
        .frame(width: 440, alignment: .leading)
        .padding(.leading, 56).overlay(Rectangle().frame(width: 1).foregroundColor(.white.opacity(0.12)), alignment: .leading)
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
            Text("Guests are listed by first name. Estimates and approvals are in the Revyn app.").font(.system(size: 22)).foregroundColor(dim).multilineTextAlignment(.trailing)
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
