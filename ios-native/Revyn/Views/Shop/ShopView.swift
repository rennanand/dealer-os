import SwiftUI
import MapKit

/// The shop on a real Apple map, with hours, call and directions.
struct ShopView: View {
    @EnvironmentObject var model: AppModel
    @State private var position: MapCameraPosition = .automatic

    static func directionsURL(_ s: Shop) -> URL? {
        var c = URLComponents(string: "https://maps.apple.com/")
        c?.queryItems = [URLQueryItem(name: "q", value: s.name), URLQueryItem(name: "address", value: s.address ?? "")] + (s.lat != nil ? [URLQueryItem(name: "ll", value: "\(s.lat!),\(s.lng!)")] : [])
        return c?.url
    }

    private func isOpen(_ s: Shop) -> Bool {
        let cal = Calendar.current, now = Date()
        let wd = cal.component(.weekday, from: now) - 1
        guard (s.open_days ?? [1, 2, 3, 4, 5]).contains(wd) else { return false }
        func mins(_ t: String?, _ d: Int) -> Int { let p = (t ?? "").split(separator: ":").compactMap { Int($0) }; return p.count >= 2 ? p[0] * 60 + p[1] : d }
        let m = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        return m >= mins(s.open_from, 480) && m < mins(s.open_to, 1020)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    if let s = model.shop {
                        Map(position: $position) {
                            if let la = s.lat, let ln = s.lng {
                                Annotation(s.name, coordinate: CLLocationCoordinate2D(latitude: la, longitude: ln)) {
                                    ZStack { Circle().fill(Theme.red).frame(width: 16, height: 16); Circle().stroke(.white, lineWidth: 2).frame(width: 16, height: 16) }.shadow(radius: 6)
                                }
                            }
                        }
                        .mapStyle(.standard(elevation: .flat, pointsOfInterest: .excludingAll))
                        .mapControlVisibility(.hidden)
                        .frame(height: 260).clipShape(RoundedRectangle(cornerRadius: Theme.radius, style: .continuous))
                        .onAppear { if let la = s.lat, let ln = s.lng { position = .region(MKCoordinateRegion(center: .init(latitude: la, longitude: ln), span: .init(latitudeDelta: 0.012, longitudeDelta: 0.012))) } }

                        Card {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(alignment: .top) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(s.name).font(.system(size: 22, weight: .semibold)).tracking(-0.4)
                                        Text(s.address ?? "").font(.system(size: 14)).foregroundStyle(Theme.dim)
                                    }
                                    Spacer()
                                    Pill(text: isOpen(s) ? "Open" : "Closed", color: isOpen(s) ? Theme.green : Theme.dim)
                                }
                                if let h = s.hours { Text(h).font(.system(size: 13.5)).foregroundStyle(Theme.dim).padding(.top, 2) }
                                HStack(spacing: 10) {
                                    PrimaryButton(title: "Directions") { if let u = Self.directionsURL(s) { UIApplication.shared.open(u) } }
                                    if let p = s.phone { SecondaryButton(title: p.phoneFormatted) { if let u = URL(string: "tel:" + p.digits) { UIApplication.shared.open(u) } } }
                                }.padding(.top, 10)
                            }
                        }
                        VStack(spacing: 0) {
                            Button { model.tab = .service } label: { Row(icon: "bubble.left", title: "Message the shop", subtitle: "Questions go straight to the desk") }
                            Divider().overlay(Theme.line)
                            NavigationLink { BookView() } label: { Row(icon: "calendar", title: "Book a visit", subtitle: "On the shop’s calendar") }
                            Divider().overlay(Theme.line)
                            Row(icon: "shield", title: "What every visit includes", subtitle: "Tires, brakes, fluids and filters checked, with photos")
                        }.buttonStyle(.plain).foregroundStyle(.white).padding(.horizontal, 6)
                    } else {
                        ProgressView().tint(.white).padding(.top, 100)
                    }
                }.padding(16)
            }
            .background(Theme.bg)
            .navigationTitle("Shop")
            .toolbarTitleDisplayMode(.large)
        }
    }
}

struct HistoryView: View {
    @EnvironmentObject var model: AppModel
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 10) {
                    if model.history.isEmpty {
                        VStack(spacing: 8) {
                            Text("Every visit, kept.").font(.system(size: 24, weight: .semibold)).tracking(-0.5)
                            Text("Estimates, photos, what was done and what was measured — here after your first visit.").font(.system(size: 14.5)).foregroundStyle(Theme.dim).multilineTextAlignment(.center)
                        }.padding(.top, 120).padding(.horizontal, 30)
                    }
                    ForEach(model.history) { a in
                        NavigationLink { VisitDetailView(appointment: a) } label: {
                            Card {
                                HStack(spacing: 14) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(a.job ?? "Service").font(.system(size: 18, weight: .semibold))
                                        Text([a.vehicle, a.done_at?.formatted(date: .abbreviated, time: .omitted) ?? a.starts_at?.formatted(date: .abbreviated, time: .omitted)].compactMap { $0 }.joined(separator: " · ")).font(.system(size: 13.5)).foregroundStyle(Theme.dim)
                                    }
                                    Spacer()
                                    if a.status == "cancelled" { Pill(text: "Cancelled", color: Theme.dim) }
                                    else if let r = a.rating { HStack(spacing: 2) { Image(systemName: "star.fill").font(.system(size: 11)); Text("\(r)").font(.system(size: 13, weight: .medium)) }.foregroundStyle(Theme.yellow) }
                                    Image(systemName: "chevron.right").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.dimmer)
                                }
                            }
                        }.buttonStyle(.plain).foregroundStyle(.white)
                    }
                }.padding(16)
            }
            .background(Theme.bg)
            .navigationTitle("History")
            .toolbarTitleDisplayMode(.large)
            .refreshable { await model.refresh() }
        }
    }
}

struct VisitDetailView: View {
    @EnvironmentObject var model: AppModel
    var appointment: Appointment
    private func money(_ c: Int) -> String { (Double(c) / 100).formatted(.currency(code: "USD").precision(.fractionLength(0))) }
    var body: some View {
        let a = appointment
        let approved = (a.findings ?? []).filter { $0.status == "approved" }
        let declined = (a.findings ?? []).filter { $0.status == "declined" }
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Card {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(a.job ?? "Service").font(.system(size: 24, weight: .semibold)).tracking(-0.5)
                        Text([a.vehicle, a.done_at?.formatted(date: .long, time: .shortened)].compactMap { $0 }.joined(separator: " · ")).font(.system(size: 14)).foregroundStyle(Theme.dim)
                        if let t = a.tech { Text("Technician: " + t).font(.system(size: 13)).foregroundStyle(Theme.dimmer) }
                    }
                }
                if !approved.isEmpty {
                    Card {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Work done").font(.system(size: 15, weight: .medium))
                            ForEach(approved) { f in HStack { Text(f.name ?? ""); Spacer(); Text(f.price).font(.system(design: .monospaced)) }.font(.system(size: 14.5)) }
                            Divider().overlay(Theme.line)
                            HStack { Text("Approved total").foregroundStyle(Theme.dim); Spacer(); Text(money(approved.reduce(0) { $0 + ($1.price_cents ?? 0) })).font(.system(size: 17, weight: .semibold, design: .monospaced)) }
                        }
                    }
                }
                if !declined.isEmpty {
                    Card { VStack(alignment: .leading, spacing: 8) { Text("Noted for later").font(.system(size: 15, weight: .medium)); ForEach(declined) { f in Text((f.name ?? "") + (f.meas.map { " · " + $0 } ?? "")).font(.system(size: 14)).foregroundStyle(Theme.dim) } } }
                }
                if let ph = a.photos, !ph.isEmpty { NavigationLink { PhotosView(photos: ph) } label: { Card { HStack { Image(systemName: "camera"); Text("\(ph.count) photo\(ph.count == 1 ? "" : "s") from this visit"); Spacer(); Image(systemName: "chevron.right").foregroundStyle(Theme.dimmer) }.font(.system(size: 15, weight: .medium)) } }.buttonStyle(.plain).foregroundStyle(.white) }
                if let n = a.notes, !n.isEmpty { Card { VStack(alignment: .leading, spacing: 6) { Text("Your note").font(.system(size: 15, weight: .medium)); Text(n).font(.system(size: 14)).foregroundStyle(Theme.dim) } } }
                Text("Measurements were taken by the technician at this visit. Mileage was entered by you.").font(.system(size: 12)).foregroundStyle(Theme.dimmer).padding(.horizontal, 4)
            }.padding(16)
        }
        .background(Theme.bg)
        .navigationTitle(a.done_at?.formatted(date: .abbreviated, time: .omitted) ?? "Visit")
        .toolbarTitleDisplayMode(.inline)
    }
}
