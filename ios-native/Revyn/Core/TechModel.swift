import Foundation
import SwiftUI
import Supabase

// The technician's iPad: today's jobs, the clock, the inspection with photos, approved jobs.
// Same tables and RPCs as the web tech page (src/surfaces/tech/TechLive.jsx + shopLogic.js),
// read with the staff member's own session (row-level security does the gating).

struct Technician: Codable, Identifiable, Hashable { let id: UUID; var name: String; var role: String?; var bays: [Int]?; var active: Bool?; var user_id: UUID? }
struct TechAppointment: Codable, Identifiable, Hashable {
    let id: UUID; var customer_id: UUID?; var vehicle_id: UUID?; var starts_at: Date; var job: String?; var visit: String?; var status: String; var bay: Int?; var notes: String?; var concern: String?; var tech_id: UUID?; var pickup: String?; var online_checkin_at: Date?; var arrived_at: Date?; var started_at: Date?; var done_at: Date?
}
struct TechCustomer: Codable, Identifiable, Hashable { let id: UUID; var name: String; var phone: String? }
struct TechVehicle: Codable, Identifiable, Hashable {
    let id: UUID; var year: Int?; var make: String?; var model: String?; var plate: String?; var odometer: Int?; var vin: String?; var trim: String?; var engine: String?; var drive: String?; var color: String?
    var name: String { [year.map(String.init), make, model].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ") }
    var specs: String { [trim, engine, drive, color, plate, odometer.map { $0.formatted() + " mi" }].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ") }
}
struct TechFinding: Codable, Identifiable, Hashable { let id: UUID; var appointment_id: UUID; var tier: String?; var name: String?; var plain: String?; var price_cents: Int?; var status: String?; var lines: [JobLine]?; var techs: [UUID]?; var source: String?; var created_at: Date? }
struct InspItem: Codable, Hashable {
    var key: String; var label: String; var measLabel: String?; var hint: String?; var now_job: UUID?; var monitor_job: UUID?
    var status: String?; var meas: String?; var note: String?; var name: String?; var price: String?; var sent: Bool?
    var flagged: Bool { status == "now" || status == "monitor" }
}
struct InspectionRow: Codable, Hashable { var id: UUID?; var shop_id: String?; var appointment_id: UUID; var tech_id: UUID?; var template_id: UUID?; var items: [InspItem]; var status: String; var sent_at: Date?; var updated_at: Date? }
struct TimeEntry: Codable, Identifiable, Hashable { let id: UUID; var appointment_id: UUID; var tech_id: UUID; var finding_id: UUID?; var started_at: Date; var ended_at: Date? }
struct TechPhoto: Codable, Identifiable, Hashable { let id: UUID; var appointment_id: UUID; var finding_id: UUID?; var path: String; var caption: String?
    var url: URL? { URL(string: Secrets.supabaseURL + "/storage/v1/object/public/visit-photos/" + path) } }
struct TemplateItem: Codable, Hashable { var key: String?; var label: String; var measLabel: String?; var hint: String?; var now_job: UUID?; var monitor_job: UUID? }
struct InspectionTemplate: Codable, Identifiable, Hashable { let id: UUID; var name: String; var items: [TemplateItem]; var is_default: Bool?; var internal: Bool?; var sort: Int? }
struct CannedLine: Codable, Hashable { var kind: String?; var description: String?; var qty: Double?; var unit_cents: Int?; var cost_cents: Int?; var part_number: String?; var vendor: String? }
struct CannedJob: Codable, Identifiable, Hashable { let id: UUID; var name: String; var plain: String?; var lines: [CannedLine]?; var hours: Double?; var package_cents: Int? }
struct MatrixTier: Codable, Hashable { var upto_cents: Int?; var markup_pct: Double? }
struct TechShop: Codable { var shop_id: String; var name: String?; var labor_rate_cents: Int?; var parts_matrix: [MatrixTier]? }
struct MemberRow: Codable { var role: String; var name: String? }

@MainActor
final class TechModel: ObservableObject {
    enum Gate { case loading, signedOut, notStaff, ready }
    @Published var gate: Gate = .loading
    @Published var member: MemberRow?
    @Published var me: Technician?
    @Published var techs: [Technician] = []
    @Published var appointments: [TechAppointment] = []
    @Published var customers: [UUID: TechCustomer] = [:]
    @Published var vehicles: [UUID: TechVehicle] = [:]
    @Published var findings: [TechFinding] = []
    @Published var inspections: [InspectionRow] = []
    @Published var timeEntries: [TimeEntry] = []
    @Published var photos: [TechPhoto] = []
    @Published var templates: [InspectionTemplate] = []
    @Published var cannedJobs: [CannedJob] = []
    @Published var shop: TechShop?
    @Published var selected: UUID?
    @Published var busy = false
    @Published var error: String?
    @Published var toast: String?
    private let client = Supa.client
    private var authTask: Task<Void, Never>?
    private var pollTask: Task<Void, Never>?
    private var saveTasks: [UUID: Task<Void, Never>] = [:]
    private var session: Session?

    // MARK: lifecycle
    func start() {
        guard authTask == nil else { return }
        authTask = Task { [weak self] in
            guard let self else { return }
            for await (event, session) in client.auth.authStateChanges {
                guard [.initialSession, .signedIn, .signedOut, .tokenRefreshed, .userUpdated].contains(event) else { continue }
                self.session = session
                if session == nil { self.gate = .signedOut; self.member = nil; self.stopPolling() }
                else if event != .tokenRefreshed { await self.loadMember() }
            }
        }
    }
    func loadMember() async {
        guard let uid = session?.user.id else { return }
        do {
            let rows: [MemberRow] = try await client.from("shop_members").select("role,name").eq("user_id", value: uid.uuidString).eq("shop_id", value: Secrets.shopId).limit(1).execute().value
            member = rows.first
            if let m = member, ["tech", "advisor", "owner"].contains(m.role) { gate = .ready; await refresh(); pickRemembered(uid: uid); startPolling() } else { gate = .notStaff }
        } catch { self.error = error.localizedDescription; gate = .notStaff }
    }
    private func pickRemembered(uid: UUID) {
        if let s = UserDefaults.standard.string(forKey: "revyn.techMe"), let id = UUID(uuidString: s), let t = techs.first(where: { $0.id == id }) { me = t }
        else if let t = techs.first(where: { $0.user_id == uid }) { me = t }
    }
    func pick(_ t: Technician?) { me = t; UserDefaults.standard.set(t?.id.uuidString ?? "", forKey: "revyn.techMe") }
    func signOut() async { try? await client.auth.signOut() }
    private func startPolling() { stopPolling(); pollTask = Task { [weak self] in while !Task.isCancelled { try? await Task.sleep(for: .seconds(12)); await self?.refresh() } } }
    private func stopPolling() { pollTask?.cancel(); pollTask = nil }

    // MARK: data
    func refresh() async {
        guard gate == .ready else { return }
        let since = ISO8601DateFormatter().string(from: Calendar.current.startOfDay(for: Date()).addingTimeInterval(-2 * 86400))
        let sid = Secrets.shopId
        do {
            async let a: [TechAppointment] = try client.from("appointments").select("id,customer_id,vehicle_id,starts_at,job,visit,status,bay,notes,concern,tech_id,pickup,online_checkin_at,arrived_at,started_at,done_at").eq("shop_id", value: sid).gte("starts_at", value: since).order("starts_at").execute().value
            async let t: [Technician] = try client.from("technicians").select("id,name,role,bays,active,user_id").eq("shop_id", value: sid).order("created_at").execute().value
            async let f: [TechFinding] = try client.from("findings").select("id,appointment_id,tier,name,plain,price_cents,status,lines,techs,source,created_at").eq("shop_id", value: sid).gte("created_at", value: since).order("created_at").execute().value
            async let i: [InspectionRow] = try client.from("inspections").select("id,shop_id,appointment_id,tech_id,template_id,items,status,sent_at,updated_at").eq("shop_id", value: sid).gte("updated_at", value: since).execute().value
            async let te: [TimeEntry] = try client.from("time_entries").select("id,appointment_id,tech_id,finding_id,started_at,ended_at").eq("shop_id", value: sid).gte("started_at", value: since).execute().value
            async let ph: [TechPhoto] = try client.from("visit_photos").select("id,appointment_id,finding_id,path,caption").eq("shop_id", value: sid).gte("created_at", value: since).order("created_at").execute().value
            async let tp: [InspectionTemplate] = try client.from("inspection_templates").select("id,name,items,is_default,internal,sort").eq("shop_id", value: sid).order("sort").execute().value
            async let cj: [CannedJob] = try client.from("canned_jobs").select("id,name,plain,lines,hours,package_cents").eq("shop_id", value: sid).eq("active", value: true).order("sort").execute().value
            async let sh: [TechShop] = try client.from("shops").select("shop_id,name,labor_rate_cents,parts_matrix").eq("shop_id", value: sid).limit(1).execute().value
            let (aa, tt, ff, ii, tee, phh, tpp, cjj, shh) = try await (a, t, f, i, te, ph, tp, cj, sh)
            appointments = aa; techs = tt.filter { $0.active != false }; findings = ff; timeEntries = tee; photos = phh; templates = tpp; cannedJobs = cjj; shop = shh.first
            // keep unsaved local edits over what the server has
            var merged: [InspectionRow] = []
            for srv in ii {
                if saveTasks[srv.appointment_id] != nil, let loc = inspections.first(where: { $0.appointment_id == srv.appointment_id }) { merged.append(loc) } else { merged.append(srv) }
            }
            for loc in inspections where saveTasks[loc.appointment_id] != nil && !ii.contains(where: { $0.appointment_id == loc.appointment_id }) { merged.append(loc) }
            inspections = merged
            let cids = Set(aa.compactMap { $0.customer_id }).map { $0.uuidString }, vids = Set(aa.compactMap { $0.vehicle_id }).map { $0.uuidString }
            if !cids.isEmpty { let cs: [TechCustomer] = try await client.from("customers").select("id,name,phone").in("id", values: cids).execute().value; customers = Dictionary(uniqueKeysWithValues: cs.map { ($0.id, $0) }) }
            if !vids.isEmpty { let vs: [TechVehicle] = try await client.from("customer_vehicles").select("id,year,make,model,plate,odometer,vin,trim,engine,drive,color").in("id", values: vids).execute().value; vehicles = Dictionary(uniqueKeysWithValues: vs.map { ($0.id, $0) }) }
            if me == nil, let uid = session?.user.id { pickRemembered(uid: uid) }
        } catch { if self.error == nil { self.error = friendly(error) } }
    }
    private func friendly(_ e: Error) -> String { let s = e.localizedDescription; return s.isEmpty ? "Something went wrong." : s }

    // MARK: derived
    var live: [TechAppointment] {
        let today = Calendar.current.startOfDay(for: Date())
        return appointments.filter { ($0.starts_at >= today && ["booked", "arrived", "in_progress"].contains($0.status)) || ["arrived", "in_progress"].contains($0.status) }
            .sorted { ($0.bay ?? 9, $0.starts_at) < ($1.bay ?? 9, $1.starts_at) }
    }
    func customer(_ a: TechAppointment) -> TechCustomer? { a.customer_id.flatMap { customers[$0] } }
    func vehicle(_ a: TechAppointment) -> TechVehicle? { a.vehicle_id.flatMap { vehicles[$0] } }
    func openEntry(_ a: TechAppointment) -> TimeEntry? { timeEntries.first { $0.appointment_id == a.id && $0.ended_at == nil } }
    func openEntry(job: UUID) -> TimeEntry? { timeEntries.first { $0.finding_id == job && $0.ended_at == nil } }
    func hours(_ a: TechAppointment) -> Double { timeEntries.filter { $0.appointment_id == a.id }.reduce(0) { $0 + ($1.ended_at ?? Date()).timeIntervalSince($1.started_at) / 3600 } }
    func hours(job: UUID) -> Double { timeEntries.filter { $0.finding_id == job }.reduce(0) { $0 + ($1.ended_at ?? Date()).timeIntervalSince($1.started_at) / 3600 } }
    func jobs(_ a: TechAppointment) -> [TechFinding] { findings.filter { $0.appointment_id == a.id && $0.source != "booked" } }
    func photos(_ a: TechAppointment, key: String) -> [TechPhoto] { photos.filter { $0.appointment_id == a.id && $0.caption == key } }
    func techName(_ id: UUID) -> String { techs.first { $0.id == id }?.name.split(separator: " ").first.map(String.init) ?? "" }

    func template(for a: TechAppointment) -> InspectionTemplate? {
        if let row = inspections.first(where: { $0.appointment_id == a.id }), let tid = row.template_id, let t = templates.first(where: { $0.id == tid }) { return t }
        return templates.first { $0.is_default == true } ?? templates.first
    }
    func inspection(_ a: TechAppointment) -> InspectionRow {
        if let row = inspections.first(where: { $0.appointment_id == a.id }) { return row }
        let t = template(for: a)
        let items = (t?.items ?? []).enumerated().map { i, it in InspItem(key: it.key ?? "item\(i)", label: it.label, measLabel: it.measLabel ?? "Condition", hint: it.hint, now_job: it.now_job, monitor_job: it.monitor_job, status: "", meas: "", note: "", name: "", price: "", sent: false) }
        return InspectionRow(id: nil, shop_id: Secrets.shopId, appointment_id: a.id, tech_id: me?.id, template_id: t?.id, items: items, status: "open", sent_at: nil, updated_at: nil)
    }

    // MARK: actions
    struct ClockParams: Encodable { let p_appointment: UUID; let p_tech: UUID; let p_job: UUID? }
    func clockOn(_ a: TechAppointment, job: UUID? = nil) async {
        guard let me else { return }
        do { try await client.rpc("clock_on", params: ClockParams(p_appointment: a.id, p_tech: me.id, p_job: job)).execute(); Haptic.tap(); await refresh() } catch { self.error = friendly(error) }
    }
    struct OffParams: Encodable { let p_tech: UUID }
    func clockOff(tech: UUID) async { do { try await client.rpc("clock_off", params: OffParams(p_tech: tech)).execute(); Haptic.tap(); await refresh() } catch { self.error = friendly(error) } }
    func setStatus(_ a: TechAppointment, _ status: String) async {
        var patch: [String: AnyJSON] = ["status": .string(status)]
        let now = ISO8601DateFormatter().string(from: Date())
        if status == "arrived" { patch["arrived_at"] = .string(now) }
        if status == "in_progress" { patch["started_at"] = .string(now) }
        if status == "done" { patch["done_at"] = .string(now) }
        do { try await client.from("appointments").update(patch).eq("id", value: a.id.uuidString).execute(); Haptic.success(); await refresh() } catch { self.error = friendly(error) }
    }
    func finish(_ a: TechAppointment) async {
        if let e = openEntry(a) { await clockOff(tech: e.tech_id) }
        await setStatus(a, "done"); selected = nil
    }
    func setItem(_ a: TechAppointment, key: String, _ change: (inout InspItem) -> Void) {
        var row = inspection(a)
        guard let i = row.items.firstIndex(where: { $0.key == key }) else { return }
        change(&row.items[i]); row.tech_id = row.tech_id ?? me?.id
        inspections.removeAll { $0.appointment_id == a.id }; inspections.append(row)
        saveTasks[a.id]?.cancel()
        saveTasks[a.id] = Task { [weak self] in try? await Task.sleep(for: .milliseconds(700)); guard !Task.isCancelled else { return }; await self?.save(row); self?.saveTasks[a.id] = nil }
    }
    func useTemplate(_ a: TechAppointment, _ t: InspectionTemplate) async {
        let items = t.items.enumerated().map { i, it in InspItem(key: it.key ?? "item\(i)", label: it.label, measLabel: it.measLabel ?? "Condition", hint: it.hint, now_job: it.now_job, monitor_job: it.monitor_job, status: "", meas: "", note: "", name: "", price: "", sent: false) }
        var row = inspection(a); row.items = items; row.template_id = t.id; row.status = "open"
        inspections.removeAll { $0.appointment_id == a.id }; inspections.append(row)
        await save(row)
    }
    struct InspUpsert: Encodable { let shop_id: String; let appointment_id: UUID; let tech_id: UUID?; let template_id: UUID?; let items: [InspItem]; let status: String; let sent_at: Date?; let updated_at: Date }
    private func save(_ row: InspectionRow) async {
        let up = InspUpsert(shop_id: Secrets.shopId, appointment_id: row.appointment_id, tech_id: row.tech_id, template_id: row.template_id, items: row.items, status: row.status, sent_at: row.sent_at, updated_at: Date())
        do { try await client.from("inspections").upsert(up, onConflict: "appointment_id").execute() } catch { self.error = friendly(error) }
    }
    /// Retail from cost by the shop's parts matrix (same rule as the desk).
    func matrixPrice(_ cost: Int) -> Int {
        let m = shop?.parts_matrix ?? []
        let tier = m.first { ($0.upto_cents ?? 0) == 0 || cost <= ($0.upto_cents ?? 0) } ?? m.last
        return Int((Double(cost) * (1 + (tier?.markup_pct ?? 40) / 100)).rounded())
    }
    struct NewLine: Encodable { var kind: String; var description: String; var qty: Double; var unit_cents: Int; var cost_cents: Int; var part_number: String; var vendor: String }
    struct NewFinding: Encodable { let shop_id: String; let appointment_id: UUID; let tier: String; let name: String; let plain: String; let tech: String; let meas: String; let meas_label: String; let urgency: String; let price_cents: Int; let lines: [NewLine]; let source: String; let canned_job_id: UUID?; let status: String; let tech_id: UUID? }
    private func lines(from cj: CannedJob) -> [NewLine] {
        let rate = shop?.labor_rate_cents ?? 12500
        return (cj.lines ?? []).map { l in
            var unit = l.unit_cents ?? 0; let cost = l.cost_cents ?? 0; let kind = l.kind ?? "labor"
            if kind == "labor", unit == 0 { unit = rate }
            if kind == "part", unit == 0, cost > 0 { unit = matrixPrice(cost) }
            return NewLine(kind: kind, description: l.description ?? cj.name, qty: l.qty ?? 1, unit_cents: unit, cost_cents: cost, part_number: l.part_number ?? "", vendor: l.vendor ?? "")
        }
    }
    /// Flagged items go to the customer as jobs: the attached canned job's lines when there is one, else the typed price.
    func send(_ a: TechAppointment) async {
        var row = inspection(a); busy = true; defer { busy = false }
        do {
            for i in row.items.indices where row.items[i].flagged && row.items[i].sent != true {
                let it = row.items[i]; let now = it.status == "now"
                let cj = cannedJobs.first { $0.id == (now ? it.now_job : it.monitor_job) }
                let typed = Int(((Double((it.price ?? "").filter { "0123456789.".contains($0) }) ?? 0) * 100).rounded())
                let ls = (cj != nil && typed == 0) ? lines(from: cj!) : []
                let price = ls.isEmpty ? typed : ls.reduce(0) { $0 + Int(($1.qty * Double($1.unit_cents)).rounded()) }
                let name = (it.name ?? "").isEmpty ? (cj?.name ?? it.label) : it.name!
                let plain = (it.note ?? "").isEmpty ? (cj?.plain ?? "") : it.note!
                let f = NewFinding(shop_id: Secrets.shopId, appointment_id: a.id, tier: now ? "now" : "monitor", name: name, plain: plain, tech: it.note ?? "", meas: it.meas ?? "", meas_label: (it.meas ?? "").isEmpty ? "" : (it.measLabel ?? ""), urgency: now ? "Recommended before you drive far." : "No rush. Worth watching.", price_cents: price, lines: ls, source: "tech", canned_job_id: cj?.id, status: "pending", tech_id: me?.id)
                try await client.from("findings").insert(f).execute()
                row.items[i].sent = true
            }
            row.status = "sent"; row.sent_at = Date(); row.tech_id = me?.id
            inspections.removeAll { $0.appointment_id == a.id }; inspections.append(row)
            await save(row); Haptic.success(); toast = "Sent to the customer's phone."; await refresh()
        } catch { self.error = friendly(error) }
    }
    func markDone(_ f: TechFinding) async {
        do { try await client.from("findings").update(["status": AnyJSON.string("done"), "done_at": .string(ISO8601DateFormatter().string(from: Date()))]).eq("id", value: f.id.uuidString).execute(); Haptic.success(); await refresh() } catch { self.error = friendly(error) }
    }
    struct NewPhoto: Encodable { let shop_id: String; let appointment_id: UUID; let finding_id: UUID?; let path: String; let caption: String }
    func addPhoto(_ a: TechAppointment, key: String, image: UIImage) async {
        guard let data = image.jpegData(compressionQuality: 0.82) else { return }
        busy = true; defer { busy = false }
        let path = a.id.uuidString.lowercased() + "/" + String(Int(Date().timeIntervalSince1970 * 1000)) + ".jpg"
        do {
            _ = try await client.storage.from("visit-photos").upload(path, data: data, options: FileOptions(contentType: "image/jpeg"))
            try await client.from("visit_photos").insert(NewPhoto(shop_id: Secrets.shopId, appointment_id: a.id, finding_id: nil, path: path, caption: key)).execute()
            Haptic.tap(); await refresh()
        } catch { self.error = friendly(error) }
    }
}
