import Foundation

// Records as the Supabase RPCs return them (my_vehicles, my_appointments, my_messages, shops_public).
// The app has no connection to the vehicle: mileage is entered by the customer, everything else is
// recorded by the shop at a visit.

struct Vehicle: Codable, Identifiable, Hashable {
    let id: UUID
    var year: Int?
    var make: String?
    var model: String?
    var plate: String?
    var odometer: Int?
    var visits: Int?
    var color: String?
    var nickname: String?

    var title: String {
        if let n = nickname, !n.isEmpty { return n.capitalizedWords }
        let t = [make, model].compactMap { $0 }.map(\.capitalizedWords).filter { !$0.isEmpty }.joined(separator: " ")
        return t.isEmpty ? "Your car" : t
    }
    var subtitle: String {
        var parts: [String] = []
        if let y = year { parts.append(String(y)) }
        if let o = odometer { parts.append(o.formatted() + " mi") } else { parts.append("Add your mileage") }
        if let p = plate, !p.isEmpty { parts.append(p) }
        return parts.joined(separator: " · ")
    }
    var fullName: String { [year.map(String.init), make?.capitalizedWords, model?.capitalizedWords].compactMap { $0 }.joined(separator: " ") }
}

struct Finding: Codable, Identifiable, Hashable {
    let id: UUID
    var tier: String?        // now | soon | monitor
    var name: String?
    var plain: String?
    var tech: String?
    var meas: String?
    var meas_label: String?
    var urgency: String?
    var wait_text: String?
    var price_cents: Int?
    var status: String?      // pending | approved | declined
    var created_at: Date?

    var price: String { ((Double(price_cents ?? 0)) / 100).formatted(.currency(code: "USD").precision(.fractionLength(0))) }
    var tierLabel: String { switch tier { case "now": "Recommended now"; case "soon": "Recommended soon"; default: "Monitor" } }
}

struct VisitPhoto: Codable, Identifiable, Hashable {
    let id: UUID
    var path: String?
    var caption: String?
    var meas: String?
    var finding_id: UUID?
    var created_at: Date?
}

struct TireOption: Codable, Hashable {
    var tier: String?
    var name: String?
    var warranty: String?
    var stock: String?
    var each_cents: Int?
}

struct TireQuote: Codable, Identifiable, Hashable {
    let id: UUID
    var size: String?
    var tread: String?
    var options: [TireOption]?
    var recommended: String?
    var hazard_offered: Bool?
    var fee_cents: Int?
    var status: String?
    var accepted_tier: String?
    var accepted_hazard: Bool?
    var total_cents: Int?
    var created_at: Date?
}

struct Appointment: Codable, Identifiable, Hashable {
    let id: UUID
    var starts_at: Date?
    var job: String?
    var visit: String?       // dropoff | wait | loaner
    var status: String?      // booked | arrived | in_progress | done | cancelled
    var bay: Int?
    var notes: String?
    var arrived_at: Date?
    var started_at: Date?
    var done_at: Date?
    var vehicle_id: UUID?
    var vehicle: String?
    var pickup: String?      // on_way | here | picked_up
    var rating: Int?
    var tech: String?
    var findings: [Finding]?
    var photos: [VisitPhoto]?
    var tire_quote: TireQuote?

    /// 0 booked · 1 arrived · 2 in progress · 8 done
    var stage: Int { switch status { case "arrived": 1; case "in_progress": 2; case "done": 8; default: 0 } }
    var isActive: Bool { ["booked", "arrived", "in_progress"].contains(status ?? "") || (status == "done" && pickup != "picked_up") }
    var pendingFindings: [Finding] { (findings ?? []).filter { $0.status == "pending" } }
    var started: Bool { stage >= 1 }
    var visitLabel: String { switch visit { case "wait": "Wait at the shop"; case "loaner": "Loaner"; default: "Drop off" } }
}

struct Message: Codable, Identifiable, Hashable {
    let id: UUID
    var sender: String?      // customer | shop
    var text: String?
    var created_at: Date?
    var read: Bool?
}

struct Shop: Codable, Identifiable, Hashable {
    var id: String { shop_id }
    let shop_id: String
    var name: String
    var address: String?
    var city: String?
    var phone: String?
    var hours: String?
    var lat: Double?
    var lng: Double?
    var open_days: [Int]?
    var open_from: String?
    var open_to: String?
}

struct CustomerProfile: Codable {
    var user_id: UUID
    var phone: String
    var name: String?
    var shop_id: String?
}

extension String {
    var capitalizedWords: String {
        split(separator: " ").map { w -> String in
            let s = String(w)
            if s.first?.isNumber == true || s.dropFirst().contains(where: { $0.isUppercase }) { return s }
            return s.prefix(1).uppercased() + s.dropFirst()
        }.joined(separator: " ")
    }
    var digits: String { filter(\.isNumber) }
    var phoneFormatted: String {
        let d = digits
        guard d.count == 10 else { return self }
        return "(\(d.prefix(3))) \(d.dropFirst(3).prefix(3))-\(d.suffix(4))"
    }
}

extension Date {
    var clock: String { formatted(date: .omitted, time: .shortened) }
    var dayAndTime: String {
        if Calendar.current.isDateInToday(self) { return "Today · " + clock }
        if Calendar.current.isDateInTomorrow(self) { return "Tomorrow · " + clock }
        return formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day()) + " · " + clock
    }
}
