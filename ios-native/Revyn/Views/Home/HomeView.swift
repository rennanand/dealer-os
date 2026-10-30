import SwiftUI

/// What the home card says for the current visit. Same rules as the web app.
struct HomeStatus {
    var kicker: String; var color: Color; var title: String; var sub: String; var cta: String?; var live = false; var progress: Double = 0
    var angle: CarView.Angle = .orbit; var destination: AppModel.Tab = .service

    static func make(_ m: AppModel) -> HomeStatus {
        guard let a = m.active else {
            return m.vehicles.isEmpty
                ? HomeStatus(kicker: "Your car", color: Theme.green, title: "Add your vehicle.", sub: "Then book a visit and follow it here, from check-in to pickup.", cta: "Add a vehicle", destination: .vehicles)
                : HomeStatus(kicker: "Nothing scheduled", color: Theme.green, title: "Nothing scheduled.", sub: "Book a visit and follow it here, from check-in to pickup.", cta: "Book a visit", destination: .service)
        }
        let bay = a.bay.map { "Bay 0\($0) · " } ?? ""
        switch a.status {
        case "booked":
            return HomeStatus(kicker: "Upcoming appointment", color: Theme.blue, title: a.job ?? "Service", sub: (a.starts_at?.dayAndTime ?? "") + " · " + a.visitLabel, cta: "View appointment")
        case "arrived":
            return HomeStatus(kicker: bay + "Checked in", color: Theme.red, title: a.job ?? "Service", sub: "Checked in at \(a.arrived_at?.clock ?? a.starts_at?.clock ?? ""). We will let you know when work begins.", cta: "View service", live: true, progress: 0.33, angle: .side)
        case "in_progress":
            if !a.pendingFindings.isEmpty {
                let n = a.pendingFindings.count
                return HomeStatus(kicker: "Estimate ready", color: Theme.yellow, title: "We found \(n == 1 ? "one thing" : "\(n) things") to review.", sub: "Your approval is needed before any extra work starts.", cta: "Review estimate", live: true, progress: 0.5, angle: .rear)
            }
            let who = a.tech.map { "\($0) started at " } ?? "Work started at "
            return HomeStatus(kicker: bay + "In service", color: Theme.red, title: a.job ?? "Service", sub: who + (a.started_at?.clock ?? "") + ". We text you the moment it is ready.", cta: "View service", live: true, progress: 0.5, angle: .rear)
        default:
            if a.pickup == "here" || a.pickup == "picked_up" {
                return a.rating != nil
                    ? HomeStatus(kicker: "Thanks for visiting", color: Theme.green, title: "See you next time.", sub: "Your rating went to the team.", cta: "View record", progress: 1, destination: .history)
                    : HomeStatus(kicker: "Picked up", color: Theme.green, title: "How did we do?", sub: "Rate your visit; it goes straight to the crew.", cta: "Rate your visit", progress: 1)
            }
            return HomeStatus(kicker: "Ready for pickup", color: Theme.green, title: (m.activeVehicle?.title ?? "Your car") + " is ready.", sub: bay + (a.pickup == "on_way" ? "The desk knows you are on your way." : "Pay at the counter when you arrive."), cta: a.pickup == "on_way" ? "I’m here" : "I’m on my way", progress: 1, angle: .front)
        }
    }
}

struct HomeView: View {
    @EnvironmentObject var model: AppModel
    @State private var showBook = false
    @State private var showAdd = false
    @State private var showOdo = false
    @State private var odo = ""

    var body: some View {
        let st = HomeStatus.make(model)
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header(st)
                    CarView(paint: Theme.paint(for: model.activeVehicle), angle: st.angle, autoRotate: true)
                        .frame(height: 250).padding(.top, 2)
                        .opacity(model.vehicles.isEmpty ? 0.35 : 1)
                    shortcuts
                    statusCard(st).padding(.horizontal, 16).padding(.top, 18)
                    rows.padding(.horizontal, 22).padding(.top, 10)
                    nextDue.padding(.horizontal, 22).padding(.top, 8)
                    Spacer(minLength: 40)
                }
            }
            .background(Theme.bg)
            .refreshable { await model.refresh() }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showBook) { BookView() }
            .sheet(isPresented: $showAdd) { AddVehicleView() }
            .alert("Current mileage", isPresented: $showOdo) {
                TextField("61,220", text: $odo).keyboardType(.numberPad)
                Button("Save") { if let v = model.vehicle, let n = Int(odo.digits) { Task { await model.updateOdometer(v, miles: n) } } }
                Button("Cancel", role: .cancel) {}
            } message: { Text("Entered by you. The shop records it again at check-in.") }
        }
    }

    private func header(_ st: HomeStatus) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 8) {
                Menu {
                    ForEach(Array(model.vehicles.enumerated()), id: \.element.id) { i, v in Button(v.title) { withAnimation { model.selectedVehicleIndex = i } } }
                    Button { showAdd = true } label: { Label("Add a vehicle", systemImage: "plus") }
                } label: {
                    HStack(spacing: 8) {
                        Text(model.vehicle?.title ?? "Your car").font(.system(size: 28, weight: .semibold)).tracking(-0.6).lineLimit(1)
                        if model.vehicles.count > 1 { Image(systemName: "chevron.down").font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.dim) }
                    }.foregroundStyle(.white)
                }
                Text(model.vehicle?.subtitle ?? "Add your vehicle to get started").font(.system(size: 14)).foregroundStyle(Theme.dim)
                HStack(spacing: 8) {
                    if st.live { Circle().fill(st.color).frame(width: 8, height: 8) }
                    Text(st.kicker).font(.system(size: 15, weight: .medium))
                }.foregroundStyle(st.color).modifier(ConditionalPulse(on: st.live))
            }
            Spacer()
            HStack(spacing: 2) {
                Button { model.tab = .service } label: {
                    Image(systemName: "bell").font(.system(size: 17)).frame(width: 38, height: 36)
                        .overlay(alignment: .topTrailing) { if model.unread > 0 { Circle().fill(Theme.red).frame(width: 7, height: 7).offset(x: -9, y: 7) } }
                }
                NavigationLink { AccountView() } label: {
                    Text(model.initials).font(.system(size: 12, weight: .semibold)).frame(width: 36, height: 36).background(Theme.control, in: Circle())
                }
            }
            .foregroundStyle(.white).padding(4).background(Theme.card, in: Capsule())
        }
        .padding(.horizontal, 22).padding(.top, 8)
    }

    private var shortcuts: some View {
        HStack(spacing: 0) {
            Shortcut(icon: "plus", label: "Book") { showBook = true }
            Shortcut(icon: "wrench.and.screwdriver", label: "Service") { model.tab = .service }
            Shortcut(icon: "phone", label: "Call") { if let p = model.shop?.phone, let u = URL(string: "tel:" + p.digits) { UIApplication.shared.open(u) } }
            Shortcut(icon: "car", label: "Directions") { if let s = model.shop, let u = ShopView.directionsURL(s) { UIApplication.shared.open(u) } }
        }.padding(.horizontal, 22).padding(.top, 10)
    }

    private func statusCard(_ st: HomeStatus) -> some View {
        VStack(spacing: 0) {
            Button { go(st) } label: {
                HStack(spacing: 16) {
                    if st.live { StatusRing(progress: st.progress, color: st.color, label: "\(Int(st.progress * 100))%") }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(st.title).font(.system(size: 19, weight: .semibold)).tracking(-0.3).multilineTextAlignment(.leading)
                        Text(st.sub).font(.system(size: 13.5)).foregroundStyle(Theme.dim).multilineTextAlignment(.leading)
                    }
                    Spacer(minLength: 4)
                    Image(systemName: "chevron.right").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.dimmer)
                }.padding(18).contentShape(Rectangle())
            }.buttonStyle(.plain)
            if let c = st.cta {
                Divider().overlay(Theme.line)
                Button { go(st) } label: { Text(c).font(.system(size: 15, weight: .medium)).foregroundStyle(st.color).frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 18).padding(.vertical, 15) }.buttonStyle(.plain)
            }
        }
        .foregroundStyle(.white)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.radius, style: .continuous))
    }

    private func go(_ st: HomeStatus) {
        if model.vehicles.isEmpty { showAdd = true; return }
        if model.active == nil { showBook = true; return }
        if let a = model.active, a.status == "done", a.pickup != "here", a.pickup != "picked_up" {
            Task { await model.setPickup(a, state: a.pickup == "on_way" ? "here" : "on_way") }; return
        }
        model.tab = st.destination
    }

    private var rows: some View {
        VStack(spacing: 0) {
            Button { model.tab = .vehicles } label: { Row(icon: "car", title: "Vehicles", subtitle: model.vehicles.count > 1 ? "\(model.vehicles.count) cars" : nil) }
            Divider().overlay(Theme.line)
            Button { model.tab = .service } label: { Row(icon: "wrench.and.screwdriver", title: "Service", subtitle: model.active.map { ($0.job ?? "Service") + " · " + ($0.status == "booked" ? ($0.starts_at?.dayAndTime ?? "") : HomeStatus.make(model).kicker) }, value: model.unread > 0 ? "\(model.unread) new" : nil, valueColor: Theme.red) }
            Divider().overlay(Theme.line)
            Button { model.tab = .shop } label: { Row(icon: "tag", title: "Shop", subtitle: model.shop?.name) }
            Divider().overlay(Theme.line)
            Button { model.tab = .history } label: { Row(icon: "clock", title: "History", subtitle: model.history.isEmpty ? nil : "\(model.history.count) visits") }
        }.buttonStyle(.plain).foregroundStyle(.white)
    }

    private var nextDue: some View {
        VStack(spacing: 0) {
            HStack {
                SectionLabel(text: "Next due")
                Button { odo = model.vehicle?.odometer.map(String.init) ?? ""; showOdo = true } label: { Text((model.vehicle?.odometer.map { $0.formatted() + " mi" } ?? "Add mileage") + " · Update").font(.system(size: 13)).foregroundStyle(Theme.blue) }
            }.padding(.vertical, 10)
            if model.history.isEmpty {
                HStack { Text("Reminders").font(.system(size: 15, weight: .medium)); Spacer(); Text("After your first visit").font(.system(size: 13.5)).foregroundStyle(Theme.dim) }
                    .padding(.vertical, 14).overlay(alignment: .top) { Divider().overlay(Theme.line) }
            } else {
                DueRow(name: "Oil & filter", due: "Est. every 5,000 mi", pct: 0.4, color: Theme.green)
                DueRow(name: "Tire rotation", due: "Est. every 6,000 mi", pct: 0.55, color: Theme.yellow)
                Text("Estimated from your last visit and the mileage you entered. Not read from the car.").font(.system(size: 11.5)).foregroundStyle(Theme.dimmer).padding(.top, 8)
            }
        }
    }
}

struct Shortcut: View {
    var icon: String; var label: String; var action: () -> Void
    var body: some View {
        Button(action: action) {
            VStack(spacing: 9) {
                Image(systemName: icon).font(.system(size: 24, weight: .regular)).frame(height: 28)
                Text(label).font(.system(size: 11)).foregroundStyle(Theme.dim)
            }.frame(maxWidth: .infinity).padding(.vertical, 10).foregroundStyle(.white)
        }.buttonStyle(.plain)
    }
}

struct DueRow: View {
    var name: String; var due: String; var pct: Double; var color: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack { Text(name).font(.system(size: 15, weight: .medium)); Spacer(); Text(due).font(.system(size: 13)).foregroundStyle(Theme.dim) }
            GeometryReader { g in ZStack(alignment: .leading) { Capsule().fill(Color.white.opacity(0.08)); Capsule().fill(color).frame(width: g.size.width * pct) } }.frame(height: 3)
        }.padding(.vertical, 14).overlay(alignment: .top) { Divider().overlay(Theme.line) }
    }
}

struct ConditionalPulse: ViewModifier {
    var on: Bool
    @ViewBuilder func body(content: Content) -> some View { if on { content.pulsing() } else { content } }
}
