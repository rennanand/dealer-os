import SwiftUI

/// Book a visit: what, which car, when (on the shop's calendar), how. Same RPC as the website.
struct BookView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss
    static let needs = ["Maintenance", "Tires", "Brakes", "Inspection", "Something feels wrong", "Other"]
    static let jobOf = ["Other": "Service"]
    @State private var need = "Maintenance"
    @State private var vehicleIndex = 0
    @State private var day: Date = Date()
    @State private var minutes: Int? = nil
    @State private var visit = "dropoff"
    @State private var notes = ""
    @State private var done = false

    private var shop: Shop? { model.shop }
    private var openDays: [Int] { shop?.open_days ?? [1, 2, 3, 4, 5] }
    private var days: [Date] {
        let cal = Calendar.current
        return (0..<21).compactMap { cal.date(byAdding: .day, value: $0, to: cal.startOfDay(for: Date())) }.filter { openDays.contains(cal.component(.weekday, from: $0) - 1) }.prefix(10).map { $0 }
    }
    private var slots: [Int] {
        func mins(_ s: String?, _ d: String) -> Int { let p = (s ?? d).split(separator: ":").compactMap { Int($0) }; return (p.first ?? 8) * 60 + (p.count > 1 ? p[1] : 0) }
        let from = mins(shop?.open_from, "08:00"), to = mins(shop?.open_to, "17:00")
        return stride(from: from, through: to - 60, by: 30).filter { m in slotDate(m) > Date() }
    }
    private func slotDate(_ m: Int) -> Date { Calendar.current.date(byAdding: .minute, value: m, to: Calendar.current.startOfDay(for: day)) ?? day }
    private func label(_ m: Int) -> String { slotDate(m).clock }

    var body: some View {
        NavigationStack {
            ScrollView {
                if done { confirmation } else { form }
            }
            .background(Theme.bg)
            .navigationTitle(done ? "" : "Book a visit")
            .toolbarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(done ? "Done" : "Cancel") { dismiss() } } }
            .onAppear { if let d = days.first { day = d }; vehicleIndex = model.selectedVehicleIndex }
        }
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: 26) {
            section("What does the car need?") {
                FlowChips(items: Self.needs, selected: $need)
            }
            if !model.vehicles.isEmpty {
                section("Which car?") {
                    VStack(spacing: 8) {
                        ForEach(Array(model.vehicles.enumerated()), id: \.element.id) { i, v in
                            Button { vehicleIndex = i } label: {
                                HStack { Text(v.title).font(.system(size: 16, weight: .medium)); Spacer(); if vehicleIndex == i { Image(systemName: "checkmark").font(.system(size: 14, weight: .semibold)) } }
                                    .padding(16).background(vehicleIndex == i ? Theme.control : Theme.card, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                            }.buttonStyle(.plain).foregroundStyle(.white)
                        }
                    }
                }
            }
            section("When?") {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(days, id: \.self) { d in
                            let on = Calendar.current.isDate(d, inSameDayAs: day)
                            Button { day = d; minutes = nil } label: {
                                VStack(spacing: 4) {
                                    Text(d.formatted(.dateTime.weekday(.abbreviated))).font(.system(size: 11)).foregroundStyle(on ? .black.opacity(0.6) : Theme.dim)
                                    Text(d.formatted(.dateTime.day())).font(.system(size: 18, weight: .semibold))
                                }.frame(width: 58, height: 62).background(on ? Color.white : Theme.card, in: RoundedRectangle(cornerRadius: 14, style: .continuous)).foregroundStyle(on ? .black : .white)
                            }.buttonStyle(.plain)
                        }
                    }
                }
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                    ForEach(slots, id: \.self) { m in
                        Button { minutes = m } label: {
                            Text(label(m)).font(.system(size: 14, weight: .medium)).frame(maxWidth: .infinity).frame(height: 44)
                                .background(minutes == m ? Color.white : Theme.card, in: RoundedRectangle(cornerRadius: 12, style: .continuous)).foregroundStyle(minutes == m ? .black : .white)
                        }.buttonStyle(.plain)
                    }
                }.padding(.top, 10)
                if slots.isEmpty { Text("No more times today. Pick another day.").font(.system(size: 13.5)).foregroundStyle(Theme.dim) }
            }
            section("How?") {
                FlowChips(items: ["dropoff", "wait", "loaner"], labels: ["dropoff": "Drop off", "wait": "Wait at the shop", "loaner": "Loaner car"], selected: $visit)
            }
            section("Anything we should know?") {
                TextField("A noise, a light, a date you need it back…", text: $notes, axis: .vertical).lineLimit(3...6).padding(14).background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            PrimaryButton(title: minutes == nil ? "Pick a time" : "Book " + (minutes.map(label) ?? ""), enabled: minutes != nil, busy: model.busy) {
                guard let m = minutes else { return }
                let v = model.vehicles.isEmpty ? nil : model.vehicles[min(vehicleIndex, model.vehicles.count - 1)]
                Task { if await model.book(startsAt: slotDate(m), job: Self.jobOf[need] ?? need, visit: visit, vehicle: v, notes: notes) { done = true } }
            }
        }.padding(20)
    }

    private var confirmation: some View {
        VStack(spacing: 14) {
            Image(systemName: "checkmark.circle.fill").font(.system(size: 54)).foregroundStyle(Theme.green).padding(.top, 60)
            Text("You’re booked.").font(.system(size: 28, weight: .semibold)).tracking(-0.6)
            Text((minutes.map { slotDate($0).dayAndTime } ?? "") + "\n" + (shop?.name ?? "")).font(.system(size: 15)).foregroundStyle(Theme.dim).multilineTextAlignment(.center)
            Text("We text you when the car is checked in, when work starts, and the moment it is ready.").font(.system(size: 13.5)).foregroundStyle(Theme.dimmer).multilineTextAlignment(.center).padding(.horizontal, 30)
            PrimaryButton(title: "Done") { dismiss() }.padding(.top, 20).frame(maxWidth: 260)
        }.padding(20).frame(maxWidth: .infinity)
    }

    @ViewBuilder private func section<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 12) { Text(title).font(.system(size: 17, weight: .semibold)); content() }
    }
}

struct FlowChips: View {
    var items: [String]
    var labels: [String: String] = [:]
    @Binding var selected: String
    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 120), spacing: 8)], alignment: .leading, spacing: 8) {
            ForEach(items, id: \.self) { it in
                Button { selected = it } label: {
                    Text(labels[it] ?? it).font(.system(size: 14, weight: .medium)).lineLimit(1).frame(maxWidth: .infinity).frame(height: 44)
                        .background(selected == it ? Color.white : Theme.card, in: RoundedRectangle(cornerRadius: 12, style: .continuous)).foregroundStyle(selected == it ? .black : .white)
                }.buttonStyle(.plain)
            }
        }
    }
}
