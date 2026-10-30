import SwiftUI

/// The estimate: each finding in plain words, with the technician's measurement and price.
/// The customer approves or declines each one; nothing is done without that.
struct FindingsView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss
    var appointment: Appointment
    @State private var declined: Set<UUID> = []
    @State private var sent = false

    private var pending: [Finding] { appointment.pendingFindings.sorted { rank($0) < rank($1) } }
    private func rank(_ f: Finding) -> Int { switch f.tier { case "now": 0; case "soon": 1; default: 2 } }
    private func color(_ f: Finding) -> Color { switch f.tier { case "now": Theme.red; case "soon": Theme.yellow; default: Theme.dim } }
    private var approvedTotal: Int { pending.filter { !declined.contains($0.id) }.reduce(0) { $0 + ($1.price_cents ?? 0) } }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if sent {
                    VStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill").font(.system(size: 54)).foregroundStyle(Theme.green).padding(.top, 50)
                        Text("Sent to the shop.").font(.system(size: 26, weight: .semibold)).tracking(-0.5)
                        Text("The crew sees your decision right away and keeps going.").font(.system(size: 14.5)).foregroundStyle(Theme.dim).multilineTextAlignment(.center)
                        PrimaryButton(title: "Back to service") { dismiss() }.frame(maxWidth: 260).padding(.top, 14)
                    }.frame(maxWidth: .infinity)
                } else {
                    Text("Your technician found \(pending.count == 1 ? "one thing" : "\(pending.count) things") worth a look. Measured today, explained plainly. Approve what you want done.").font(.system(size: 14.5)).foregroundStyle(Theme.dim).padding(.horizontal, 20)
                    ForEach(pending) { f in
                        let off = declined.contains(f.id)
                        Card {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack { Pill(text: f.tierLabel, color: color(f)); Spacer(); Text(f.price).font(.system(size: 17, weight: .semibold, design: .monospaced)).foregroundStyle(off ? Theme.dimmer : .white) }
                                Text(f.name ?? "").font(.system(size: 19, weight: .semibold)).tracking(-0.3).strikethrough(off, color: Theme.dim).foregroundStyle(off ? Theme.dim : .white)
                                if let p = f.plain, !p.isEmpty { Text(p).font(.system(size: 14)).foregroundStyle(Theme.dim) }
                                if f.meas != nil || f.urgency != nil {
                                    HStack(spacing: 18) {
                                        if let m = f.meas { VStack(alignment: .leading, spacing: 2) { Text((f.meas_label ?? "Measured").uppercased()).font(.system(size: 10, design: .monospaced)).tracking(1).foregroundStyle(Theme.dimmer); Text(m).font(.system(size: 15, weight: .medium, design: .monospaced)) } }
                                        if let u = f.urgency { VStack(alignment: .leading, spacing: 2) { Text("TIMING").font(.system(size: 10, design: .monospaced)).tracking(1).foregroundStyle(Theme.dimmer); Text(u).font(.system(size: 13.5)) } }
                                    }.padding(.top, 4)
                                }
                                if let t = f.tech, !t.isEmpty { Text("Technician: " + t).font(.system(size: 12.5)).foregroundStyle(Theme.dimmer) }
                                HStack(spacing: 8) {
                                    Button { withAnimation { declined.remove(f.id) } } label: { Text("Approve").font(.system(size: 14, weight: .semibold)).frame(maxWidth: .infinity).frame(height: 42).background(off ? Theme.control : Color.white, in: RoundedRectangle(cornerRadius: 11, style: .continuous)).foregroundStyle(off ? .white : .black) }
                                    Button { withAnimation { declined.insert(f.id) } } label: { Text(f.wait_text?.isEmpty == false ? f.wait_text! : "Not now").font(.system(size: 14, weight: .medium)).frame(maxWidth: .infinity).frame(height: 42).background(off ? Color.white.opacity(0.14) : Theme.control, in: RoundedRectangle(cornerRadius: 11, style: .continuous)).foregroundStyle(.white) }
                                }.buttonStyle(.plain).padding(.top, 6)
                            }
                        }.padding(.horizontal, 16)
                    }
                    Card {
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Approved work").font(.system(size: 15, weight: .medium))
                                Text("Tax settled at the counter. Nothing else is added without asking.").font(.system(size: 12.5)).foregroundStyle(Theme.dim)
                            }
                            Spacer()
                            Text((Double(approvedTotal) / 100).formatted(.currency(code: "USD").precision(.fractionLength(0)))).font(.system(size: 22, weight: .semibold, design: .monospaced))
                        }
                    }.padding(.horizontal, 16)
                    PrimaryButton(title: approvedTotal > 0 ? "Approve \(pending.count - declined.count) item\(pending.count - declined.count == 1 ? "" : "s")" : "Send decision", busy: model.busy) {
                        Task { if await model.decide(approve: pending.filter { !declined.contains($0.id) }.map(\.id), decline: Array(declined)) { withAnimation { sent = true } } }
                    }.padding(.horizontal, 16).padding(.top, 4)
                }
            }.padding(.vertical, 10)
        }
        .background(Theme.bg)
        .navigationTitle("Estimate")
        .toolbarTitleDisplayMode(.inline)
    }
}
