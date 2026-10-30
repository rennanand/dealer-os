import SwiftUI

struct ServiceView: View {
    @EnvironmentObject var model: AppModel
    @State private var showBook = false
    @State private var showRate = false

    var body: some View {
        NavigationStack {
            ScrollView {
                if let a = model.active { activeBody(a) } else { emptyBody }
            }
            .background(Theme.bg)
            .navigationTitle("Service")
            .toolbarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { NavigationLink { MessagesView() } label: { Text("Message").foregroundStyle(Theme.red) } } }
            .refreshable { await model.refresh() }
            .sheet(isPresented: $showBook) { BookView() }
            .sheet(isPresented: $showRate) { if let a = model.active ?? model.history.first { RateView(appointment: a) } }
        }
    }

    private var emptyBody: some View {
        VStack(spacing: 12) {
            CarView(paint: Theme.paint(for: model.vehicle), angle: .side, autoRotate: false).frame(height: 200).padding(.top, 20)
            Text("Nothing in the shop right now.").font(.system(size: 24, weight: .semibold)).tracking(-0.5)
            Text("Book a visit and follow it here, from check-in to pickup.").font(.system(size: 14.5)).foregroundStyle(Theme.dim).multilineTextAlignment(.center)
            PrimaryButton(title: "Book a visit") { showBook = true }.frame(maxWidth: 260).padding(.top, 8)
            if let last = model.history.first {
                Button { model.tab = .history } label: { Row(icon: "clock", title: "Last visit", subtitle: (last.job ?? "Service") + " · " + (last.done_at?.formatted(date: .abbreviated, time: .omitted) ?? "")) }.buttonStyle(.plain).foregroundStyle(.white).padding(.horizontal, 22).padding(.top, 20)
            }
        }.padding(.horizontal, 24)
    }

    private func activeBody(_ a: Appointment) -> some View {
        let st = HomeStatus.make(model)
        let cur = a.stage
        return VStack(alignment: .leading, spacing: 14) {
            VStack(spacing: 8) {
                CarView(paint: Theme.paint(for: model.activeVehicle), angle: cur >= 8 ? .front : cur >= 1 ? .rear : .orbit, autoRotate: cur < 1).frame(height: 210)
                Text(model.activeVehicle?.title ?? a.vehicle ?? "Your car").font(.system(size: 28, weight: .semibold)).tracking(-0.6)
                Pill(text: st.kicker, color: st.color)
                Text(model.activeVehicle?.subtitle ?? "").font(.system(size: 13.5)).foregroundStyle(Theme.dim)
            }.frame(maxWidth: .infinity).padding(.top, 4)

            if a.started {
                // Progress: three rings' worth of information, in one card.
                Card {
                    HStack(spacing: 20) {
                        StatusRing(progress: cur >= 8 ? 1 : cur >= 2 ? 0.66 : 0.33, color: cur >= 8 ? Theme.green : Theme.red, size: 92, label: cur >= 8 ? "3/3" : cur >= 2 ? "2/3" : "1/3")
                        VStack(alignment: .leading, spacing: 12) {
                            StageLine(dot: .white, name: "Check-in", sub: cur >= 1 ? "Arrived " + (a.arrived_at?.clock ?? "") : "At arrival", value: cur >= 1 ? "Done" : "—", color: .white)
                            StageLine(dot: Theme.red, name: "Service", sub: cur >= 8 ? "Done " + (a.done_at?.clock ?? "") : cur >= 2 ? "Since " + (a.started_at?.clock ?? "") : "After check-in", value: cur >= 8 ? "Done" : cur >= 2 ? "Now" : "—", color: Theme.red)
                            StageLine(dot: Theme.green, name: "Pickup", sub: cur >= 8 ? "Ready · pay at counter" : "We text you", value: cur >= 8 ? "Ready" : "—", color: Theme.green)
                        }
                    }
                }.padding(.horizontal, 16)
            } else {
                Card {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(a.job ?? "Service").font(.system(size: 19, weight: .semibold))
                        Text((a.starts_at?.dayAndTime ?? "") + " · " + a.visitLabel).font(.system(size: 14)).foregroundStyle(Theme.dim)
                        if let n = a.notes, !n.isEmpty { Text(n).font(.system(size: 13.5)).foregroundStyle(Theme.dimmer).padding(.top, 2) }
                        HStack(spacing: 10) {
                            SecondaryButton(title: "Directions") { if let s = model.shop, let u = ShopView.directionsURL(s) { UIApplication.shared.open(u) } }
                            Button(role: .destructive) { Task { await model.cancel(a) } } label: { Text("Cancel visit").font(.system(size: 15, weight: .medium)).frame(maxWidth: .infinity).frame(height: 52).background(Theme.card2, in: RoundedRectangle(cornerRadius: 14, style: .continuous)).foregroundStyle(Theme.red) }.buttonStyle(.plain)
                        }.padding(.top, 10)
                    }
                }.padding(.horizontal, 16)
            }

            if cur >= 8 {
                Card {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(a.pickup == "picked_up" || a.pickup == "here" ? (a.rating == nil ? "How did we do?" : "Thanks for visiting.") : "Ready for pickup.").font(.system(size: 19, weight: .semibold))
                        Text(a.pickup == "here" ? "The desk knows you’re here." : a.pickup == "on_way" ? "The desk knows you’re on your way. Pay at the counter." : a.pickup == "picked_up" ? "Your record is in History." : "Pay at the counter when you arrive. Tell us when you’re on your way and the car will be out front.").font(.system(size: 13.5)).foregroundStyle(Theme.dim)
                        if a.pickup == nil || a.pickup == "on_way" {
                            PrimaryButton(title: a.pickup == "on_way" ? "I’m here" : "I’m on my way") { Task { await model.setPickup(a, state: a.pickup == "on_way" ? "here" : "on_way") } }.padding(.top, 6)
                        } else if a.rating == nil {
                            PrimaryButton(title: "Rate your visit") { showRate = true }.padding(.top, 6)
                        }
                    }
                }.padding(.horizontal, 16)
            }

            // The cards: what is happening, what needs you, what was found.
            VStack(spacing: 10) {
                if !a.pendingFindings.isEmpty {
                    NavigationLink { FindingsView(appointment: a) } label: {
                        ServiceCard(icon: "doc.text.magnifyingglass", color: Theme.yellow, kicker: "Estimate ready", title: "We found \(a.pendingFindings.count == 1 ? "one thing" : "\(a.pendingFindings.count) things") to review.", sub: "Your approval is needed before extra work starts. Nothing is done without it.", action: "Review estimate")
                    }
                } else if a.started {
                    let approved = (a.findings ?? []).filter { $0.status == "approved" }
                    ServiceCard(icon: "checkmark.seal", color: Theme.green, kicker: "Inspection", title: approved.isEmpty ? (cur >= 8 ? "Nothing extra was needed." : "Inspection in progress.") : "\(approved.count) item\(approved.count == 1 ? "" : "s") approved.", sub: approved.isEmpty ? "Your technician checks tires, brakes, fluids and filters at every visit." : approved.map { $0.name ?? "" }.joined(separator: " · "), action: nil)
                }
                if let q = a.tire_quote {
                    NavigationLink { TiresView(appointment: a, quote: q) } label: {
                        ServiceCard(icon: "circle.circle", color: q.status == "accepted" ? Theme.green : Theme.yellow, kicker: q.status == "accepted" ? "Tires chosen" : "Tire quote", title: q.status == "accepted" ? (q.options?.first(where: { $0.tier == q.accepted_tier })?.name ?? "Tires") + " going on." : "Three options for your tires.", sub: q.status == "accepted" ? "Installed during this visit." : "Good, better, best — pick one and it becomes approved work.", action: q.status == "accepted" ? nil : "Choose tires")
                    }
                }
                if let photos = a.photos, !photos.isEmpty {
                    NavigationLink { PhotosView(photos: photos) } label: {
                        ServiceCard(icon: "camera", color: .white, kicker: "Photos", title: "\(photos.count) photo\(photos.count == 1 ? "" : "s") from your technician.", sub: photos.last?.caption ?? "Taken at your visit.", action: "See photos")
                    }
                }
                if a.visit == "loaner" {
                    ServiceCard(icon: "arrow.left.arrow.right", color: .white, kicker: "Loaner", title: "A loaner is part of this visit.", sub: "The desk hands over the keys at check-in. Mileage and fuel are recorded by staff at handoff and return.", action: nil)
                }
                NavigationLink { MessagesView() } label: {
                    ServiceCard(icon: "bubble.left", color: model.unread > 0 ? Theme.red : .white, kicker: model.unread > 0 ? "\(model.unread) new" : "Messages", title: model.messages.last?.text ?? "Message the shop.", sub: model.messages.isEmpty ? "Questions go straight to the desk." : (model.messages.last?.sender == "shop" ? "From the shop · " : "You · ") + (model.messages.last?.created_at?.clock ?? ""), action: "Open")
                }
            }.padding(.horizontal, 16).buttonStyle(.plain).foregroundStyle(.white)

            // Timeline
            VStack(alignment: .leading, spacing: 0) {
                SectionLabel(text: "Timeline").padding(.bottom, 6)
                TimelineRow(done: cur > 0, now: cur == 0, name: "Appointment booked", time: a.starts_at?.dayAndTime ?? "", detail: (a.job ?? "Service") + " at " + (model.shop?.name.split(separator: " ").prefix(2).joined(separator: " ") ?? "the shop") + ".")
                TimelineRow(done: cur > 1, now: cur == 1, name: "Vehicle checked in", time: a.arrived_at?.clock ?? "", detail: "Your vehicle has arrived at the shop.")
                TimelineRow(done: cur > 2, now: cur == 2, name: "Work started", time: a.started_at?.clock ?? "", detail: (a.tech.map { "\($0) is working on your vehicle." } ?? "A technician is working on your vehicle.") + ((a.notes?.isEmpty == false) ? " Note: \(a.notes!)" : ""))
                TimelineRow(done: cur >= 8, now: false, name: "Service complete", time: a.done_at?.clock ?? "", detail: "Your vehicle is ready. Pay at the counter when you arrive.", last: true)
                Text((a.bay.map { "Bay 0\($0) · " } ?? "") + "Status is updated by the shop as your car moves through the day.").font(.system(size: 12)).foregroundStyle(Theme.dimmer).padding(.top, 10)
            }.padding(.horizontal, 22).padding(.top, 10)
            Spacer(minLength: 30)
        }
    }
}

struct StageLine: View {
    var dot: Color; var name: String; var sub: String; var value: String; var color: Color
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Circle().fill(dot).frame(width: 8, height: 8).padding(.top, 5)
            VStack(alignment: .leading, spacing: 2) { Text(name).font(.system(size: 15, weight: .medium)); Text(sub.uppercased()).font(.system(size: 10.5, design: .monospaced)).tracking(0.8).foregroundStyle(Theme.dim).lineLimit(1) }
            Spacer()
            Text(value).font(.system(size: 14, weight: .semibold)).foregroundStyle(value == "—" ? Theme.dimmer : color)
        }
    }
}

struct ServiceCard: View {
    var icon: String; var color: Color; var kicker: String; var title: String; var sub: String; var action: String?
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                HStack { Image(systemName: icon).font(.system(size: 18)).foregroundStyle(color); Spacer(); Pill(text: kicker, color: color) }
                Text(title).font(.system(size: 18, weight: .semibold)).tracking(-0.3).multilineTextAlignment(.leading).padding(.top, 6)
                Text(sub).font(.system(size: 13.5)).foregroundStyle(Theme.dim).multilineTextAlignment(.leading).lineLimit(3)
                if let a = action { HStack(spacing: 6) { Text(a); Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)) }.font(.system(size: 14, weight: .medium)).foregroundStyle(color == .white ? Theme.dim : color).padding(.top, 4) }
            }
        }
    }
}

struct TimelineRow: View {
    var done: Bool; var now: Bool; var name: String; var time: String; var detail: String; var last = false
    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 0) {
                Circle().fill(done || now ? Color.white : Color.white.opacity(0.18)).frame(width: 10, height: 10).overlay(Circle().stroke(now ? Theme.red : .clear, lineWidth: 2).frame(width: 16, height: 16))
                if !last { Rectangle().fill(done ? Color.white.opacity(0.5) : Color.white.opacity(0.1)).frame(width: 1).frame(maxHeight: .infinity) }
            }.frame(width: 16)
            VStack(alignment: .leading, spacing: 3) {
                HStack { Text(name).font(.system(size: 15, weight: done || now ? .semibold : .medium)).foregroundStyle(done || now ? .white : Theme.dim); Spacer(); Text(time).font(.system(size: 12.5, design: .monospaced)).foregroundStyle(Theme.dim) }
                if done || now { Text(detail).font(.system(size: 13)).foregroundStyle(Theme.dim) }
            }.padding(.bottom, last ? 0 : 18)
        }.fixedSize(horizontal: false, vertical: true)
    }
}

struct PhotosView: View {
    var photos: [VisitPhoto]
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                ForEach(photos) { p in
                    VStack(alignment: .leading, spacing: 8) {
                        AsyncImage(url: URL(string: Secrets.supabaseURL + "/storage/v1/object/public/visit-photos/" + (p.path ?? ""))) { img in img.resizable().scaledToFill() } placeholder: { Rectangle().fill(Theme.card) }
                            .frame(height: 240).clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        HStack { Text(p.caption ?? "").font(.system(size: 14, weight: .medium)); Spacer(); if let m = p.meas { Text(m).font(.system(size: 13, design: .monospaced)).foregroundStyle(Theme.dim) } }
                        Text("Taken by your technician" + (p.created_at.map { " · " + $0.clock } ?? "")).font(.system(size: 12)).foregroundStyle(Theme.dimmer)
                    }
                }
            }.padding(16)
        }.background(Theme.bg).navigationTitle("Photos").toolbarTitleDisplayMode(.inline)
    }
}
