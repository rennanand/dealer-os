import Foundation
import SwiftUI
import Supabase

/// The one source of truth for the app. Everything a screen shows comes from here; every change goes
/// through an RPC on the same Supabase project the web app and the shop desktop use, so both stay in
/// step without sharing any UI code.
@MainActor
final class AppModel: ObservableObject {
    enum Gate { case loading, signedOut, needsPhone, ready }

    @Published var gate: Gate = .loading
    @Published var session: Session?
    @Published var profile: CustomerProfile?
    @Published var vehicles: [Vehicle] = []
    @Published var appointments: [Appointment] = []
    @Published var messages: [Message] = []
    @Published var shops: [Shop] = []
    @Published var selectedVehicleIndex = 0
    @Published var busy = false
    @Published var error: String?
    @Published var toast: String?
    @Published var tab: Tab = .home

    enum Tab: Hashable { case home, vehicles, service, shop, history }

    private let client = Supa.client
    private var pollTask: Task<Void, Never>?
    private var authTask: Task<Void, Never>?

    var userName: String { (session?.user.userMetadata["name"]?.stringValue ?? profile?.name ?? "").split(separator: " ").first.map(String.init) ?? "" }
    var initials: String { let n = session?.user.userMetadata["name"]?.stringValue ?? profile?.name ?? ""; let i = n.split(separator: " ").prefix(2).compactMap { $0.first }.map(String.init).joined(); return i.isEmpty ? "R" : i.uppercased() }
    var vehicle: Vehicle? { vehicles.isEmpty ? nil : vehicles[min(selectedVehicleIndex, vehicles.count - 1)] }
    var shop: Shop? { shops.first(where: { $0.shop_id == Secrets.shopId }) ?? shops.first }
    /// The visit that matters now: in progress, checked in, booked, or done and not yet picked up.
    var active: Appointment? {
        let live = appointments.filter { $0.isActive }
        return live.first(where: { $0.status == "in_progress" }) ?? live.first(where: { $0.status == "arrived" }) ?? live.first(where: { $0.status == "done" }) ?? live.min(by: { ($0.starts_at ?? .distantFuture) < ($1.starts_at ?? .distantFuture) })
    }
    var activeVehicle: Vehicle? { guard let a = active else { return vehicle }; return vehicles.first(where: { $0.id == a.vehicle_id }) ?? vehicle }
    var history: [Appointment] { appointments.filter { $0.status == "done" || $0.status == "cancelled" } }
    var unread: Int { messages.filter { $0.sender == "shop" && $0.read != true }.count }

    // MARK: lifecycle

    func start() {
        guard authTask == nil else { return }
        authTask = Task { [weak self] in
            guard let self else { return }
            for await (event, session) in client.auth.authStateChanges {
                guard [.initialSession, .signedIn, .signedOut, .tokenRefreshed, .userUpdated].contains(event) else { continue }
                self.session = session
                if session == nil { self.gate = .signedOut; self.profile = nil; self.vehicles = []; self.appointments = []; self.messages = []; self.stopPolling() }
                else if event != .tokenRefreshed { await self.loadProfile() }
            }
        }
    }

    func loadProfile() async {
        guard let uid = session?.user.id else { return }
        do {
            let rows: [CustomerProfile] = try await client.from("customer_profiles").select().eq("user_id", value: uid.uuidString).limit(1).execute().value
            profile = rows.first
            if let p = profile, !p.phone.isEmpty { gate = .ready; await refresh(); startPolling() } else { gate = .needsPhone }
        } catch { self.error = error.localizedDescription; gate = profile == nil ? .needsPhone : .ready }
    }

    func savePhone(_ digits: String) async {
        guard let uid = session?.user.id, digits.count == 10 else { return }
        busy = true; defer { busy = false }
        let row = CustomerProfile(user_id: uid, phone: digits, name: session?.user.userMetadata["name"]?.stringValue ?? "", shop_id: Secrets.shopId)
        do {
            try await client.from("customer_profiles").upsert(row).execute()
            profile = row; gate = .ready; await refresh(); startPolling()
        } catch { self.error = error.localizedDescription }
    }

    func refresh() async {
        guard gate == .ready else { return }
        async let v: [Vehicle] = try client.rpc("my_vehicles").execute().value
        async let a: [Appointment] = try client.rpc("my_appointments").execute().value
        async let m: [Message] = try client.rpc("my_messages").execute().value
        async let s: [Shop] = try client.rpc("shops_public").execute().value
        do {
            let (vv, aa, mm, ss) = try await (v, a, m, s)
            vehicles = vv; appointments = aa; messages = mm; shops = ss
            if selectedVehicleIndex >= vehicles.count { selectedVehicleIndex = 0 }
        } catch { self.error = friendly(error) }
    }

    private func startPolling() {
        stopPolling()
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                let live = self?.active != nil
                try? await Task.sleep(for: .seconds(live ? 15 : 60))
                if Task.isCancelled { break }
                await self?.refresh()
            }
        }
    }
    private func stopPolling() { pollTask?.cancel(); pollTask = nil }

    // MARK: auth

    func signIn(email: String, password: String) async {
        busy = true; defer { busy = false }
        do { try await client.auth.signIn(email: email.trimmingCharacters(in: .whitespaces).lowercased(), password: password) } catch { self.error = friendly(error) }
    }
    func signUp(email: String, password: String, name: String) async {
        busy = true; defer { busy = false }
        do { try await client.auth.signUp(email: email.trimmingCharacters(in: .whitespaces).lowercased(), password: password, data: ["name": .string(name)]) } catch { self.error = friendly(error) }
    }
    func sendCode(email: String) async -> Bool {
        busy = true; defer { busy = false }
        do { try await client.auth.signInWithOTP(email: email.trimmingCharacters(in: .whitespaces).lowercased()); return true } catch { self.error = friendly(error); return false }
    }
    func verifyCode(email: String, code: String) async {
        busy = true; defer { busy = false }
        do { try await client.auth.verifyOTP(email: email.trimmingCharacters(in: .whitespaces).lowercased(), token: code, type: .email) } catch { self.error = friendly(error) }
    }
    func resetPassword(email: String) async {
        do { try await client.auth.resetPasswordForEmail(email.trimmingCharacters(in: .whitespaces).lowercased(), redirectTo: URL(string: "https://dealer-os-rosy.vercel.app/reset")); toast = "Check your email for the reset link." } catch { self.error = friendly(error) }
    }
    func signOut() async { try? await client.auth.signOut() }

    // MARK: actions (each one is an RPC the web app also uses)

    struct BookParams: Encodable { let p_starts_at: Date; let p_job: String; let p_visit: String; let p_vehicle: String; let p_plate: String; let p_notes: String; let p_vehicle_id: UUID? }
    func book(startsAt: Date, job: String, visit: String, vehicle: Vehicle?, notes: String) async -> Bool {
        busy = true; defer { busy = false }
        do {
            try await client.rpc("book_appointment", params: BookParams(p_starts_at: startsAt, p_job: job, p_visit: visit, p_vehicle: vehicle?.fullName ?? "", p_plate: vehicle?.plate ?? "", p_notes: notes, p_vehicle_id: vehicle?.id)).execute()
            await refresh(); toast = "Booked. See you " + startsAt.dayAndTime.lowercased() + "."; return true
        } catch { self.error = friendly(error); return false }
    }
    struct CancelParams: Encodable { let p_id: UUID }
    func cancel(_ a: Appointment) async { do { try await client.rpc("cancel_my_appointment", params: CancelParams(p_id: a.id)).execute(); await refresh() } catch { self.error = friendly(error) } }

    struct VehicleParams: Encodable { let p_year: Int?; let p_make: String; let p_model: String; let p_plate: String; let p_odometer: Int? }
    func addVehicle(year: Int?, make: String, model: String, plate: String, odometer: Int?) async -> Bool {
        busy = true; defer { busy = false }
        do { try await client.rpc("add_my_vehicle", params: VehicleParams(p_year: year, p_make: make, p_model: model, p_plate: plate, p_odometer: odometer)).execute(); await refresh(); selectedVehicleIndex = max(0, vehicles.count - 1); return true }
        catch { self.error = friendly(error); return false }
    }
    struct OdoParams: Encodable { let p_vehicle: UUID; let p_odometer: Int }
    func updateOdometer(_ v: Vehicle, miles: Int) async { do { try await client.rpc("update_my_odometer", params: OdoParams(p_vehicle: v.id, p_odometer: miles)).execute(); await refresh() } catch { self.error = friendly(error) } }

    struct DecideParams: Encodable { let p_approve: [UUID]; let p_decline: [UUID] }
    func decide(approve: [UUID], decline: [UUID]) async -> Bool {
        busy = true; defer { busy = false }
        do { try await client.rpc("decide_findings", params: DecideParams(p_approve: approve, p_decline: decline)).execute(); await refresh(); return true } catch { self.error = friendly(error); return false }
    }

    struct TextParams: Encodable { let p_text: String }
    func send(_ text: String) async {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines); guard !t.isEmpty else { return }
        messages.append(Message(id: UUID(), sender: "customer", text: t, created_at: Date(), read: true))
        do { try await client.rpc("send_my_message", params: TextParams(p_text: t)).execute(); await refresh() } catch { self.error = friendly(error) }
    }
    func markMessagesRead() async { guard unread > 0 else { return }; try? await client.rpc("mark_my_messages_read").execute(); messages = messages.map { var m = $0; if m.sender == "shop" { m.read = true }; return m } }

    struct PickupParams: Encodable { let p_id: UUID; let p_state: String }
    func setPickup(_ a: Appointment, state: String) async { do { try await client.rpc("set_my_pickup", params: PickupParams(p_id: a.id, p_state: state)).execute(); await refresh() } catch { self.error = friendly(error) } }

    struct RateParams: Encodable { let p_id: UUID; let p_stars: Int; let p_tags: [String]; let p_note: String }
    func rate(_ a: Appointment, stars: Int, tags: [String], note: String) async -> Bool {
        busy = true; defer { busy = false }
        do { try await client.rpc("rate_my_visit", params: RateParams(p_id: a.id, p_stars: stars, p_tags: tags, p_note: note)).execute(); await refresh(); toast = "Thanks. Your rating went to the team."; return true } catch { self.error = friendly(error); return false }
    }

    struct QuoteParams: Encodable { let p_id: UUID; let p_tier: String; let p_hazard: Bool }
    func acceptQuote(_ q: TireQuote, tier: String, hazard: Bool) async -> Bool {
        busy = true; defer { busy = false }
        do { try await client.rpc("accept_tire_quote", params: QuoteParams(p_id: q.id, p_tier: tier, p_hazard: hazard)).execute(); await refresh(); toast = "Tires accepted. They go on during this visit."; return true } catch { self.error = friendly(error); return false }
    }

    private func friendly(_ e: Error) -> String {
        let s = e.localizedDescription
        if s.localizedCaseInsensitiveContains("invalid login") { return "That email or password is not right." }
        if s.localizedCaseInsensitiveContains("network") || s.localizedCaseInsensitiveContains("offline") { return "You are offline. Showing what was last loaded." }
        return s
    }
}
