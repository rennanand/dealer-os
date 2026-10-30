import SwiftUI

/// The tire quote: three options from the shop, one recommended. Picking one makes it approved work.
struct TiresView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss
    var appointment: Appointment
    var quote: TireQuote
    @State private var tier: String = ""
    @State private var hazard = false

    private var options: [TireOption] { quote.options ?? [] }
    private var chosen: TireOption? { options.first { $0.tier == tier } }
    private func money(_ c: Int) -> String { (Double(c) / 100).formatted(.currency(code: "USD").precision(.fractionLength(0))) }
    private var total: Int { let tires = (chosen?.each_cents ?? 0) * 4; return tires + (quote.fee_cents ?? 0) * 4 + (hazard ? Int((Double(tires) * 0.12).rounded()) : 0) }
    private var accepted: Bool { quote.status == "accepted" }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Card {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack { Text("Tires").font(.system(size: 22, weight: .semibold)).tracking(-0.4); Spacer(); Pill(text: accepted ? "Chosen" : "Quote", color: accepted ? Theme.green : Theme.yellow) }
                        if let s = quote.size { Text("Size " + s).font(.system(size: 14, design: .monospaced)).foregroundStyle(Theme.dim) }
                        if let t = quote.tread, !t.isEmpty { Text(t).font(.system(size: 13.5)).foregroundStyle(Theme.dim) }
                    }
                }
                ForEach(options, id: \.tier) { o in
                    let on = (accepted ? quote.accepted_tier : tier) == o.tier
                    Button { if !accepted { withAnimation { tier = o.tier ?? "" } } } label: {
                        Card {
                            HStack(alignment: .top, spacing: 14) {
                                Circle().stroke(on ? Color.white : Color.white.opacity(0.3), lineWidth: on ? 6 : 1).frame(width: 18, height: 18).padding(.top, 3)
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack(spacing: 8) { Text((o.tier ?? "").capitalized).font(.system(size: 11, weight: .medium, design: .monospaced)).tracking(1).foregroundStyle(Theme.dim); if quote.recommended == o.tier { Pill(text: "Recommended", color: Theme.green) } }
                                    Text(o.name ?? "Tire").font(.system(size: 18, weight: .semibold))
                                    Text([o.warranty, o.stock].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")).font(.system(size: 13)).foregroundStyle(Theme.dim)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text(money(o.each_cents ?? 0)).font(.system(size: 18, weight: .semibold, design: .monospaced))
                                    Text("each").font(.system(size: 11)).foregroundStyle(Theme.dimmer)
                                    Text(money(((o.each_cents ?? 0) + (quote.fee_cents ?? 0)) * 4) + " installed").font(.system(size: 12, design: .monospaced)).foregroundStyle(Theme.dim).padding(.top, 4)
                                }
                            }
                        }
                    }.buttonStyle(.plain).foregroundStyle(.white)
                }
                if quote.hazard_offered == true {
                    Card {
                        Toggle(isOn: $hazard) {
                            VStack(alignment: .leading, spacing: 3) { Text("Road hazard protection").font(.system(size: 16, weight: .medium)); Text("12% of the tires · replaces one ruined by a pothole or nail.").font(.system(size: 13)).foregroundStyle(Theme.dim) }
                        }.tint(Theme.green).disabled(accepted)
                    }.onAppear { hazard = accepted ? (quote.accepted_hazard ?? false) : (quote.hazard_offered ?? false) }
                }
                Card {
                    HStack {
                        VStack(alignment: .leading, spacing: 3) { Text("Four tires, installed").font(.system(size: 15, weight: .medium)); Text("Mount, balance, TPMS and disposal included. Tax at the counter.").font(.system(size: 12.5)).foregroundStyle(Theme.dim) }
                        Spacer()
                        Text(money(accepted ? (quote.total_cents ?? total) : total)).font(.system(size: 24, weight: .semibold, design: .monospaced))
                    }
                }
                if !accepted {
                    PrimaryButton(title: chosen == nil ? "Pick an option" : "Choose " + (chosen?.name ?? ""), enabled: chosen != nil, busy: model.busy) {
                        Task { if await model.acceptQuote(quote, tier: tier, hazard: hazard) { dismiss() } }
                    }
                } else {
                    Text("Chosen. These go on during this visit.").font(.system(size: 14)).foregroundStyle(Theme.green).frame(maxWidth: .infinity)
                }
            }.padding(16)
        }
        .background(Theme.bg)
        .navigationTitle("Tire quote")
        .toolbarTitleDisplayMode(.inline)
        .onAppear { if tier.isEmpty { tier = quote.recommended ?? options.first?.tier ?? "" } }
    }
}
