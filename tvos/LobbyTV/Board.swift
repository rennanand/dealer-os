import Foundation

struct Board: Decodable {
    struct Shop: Decodable { var name: String; var address: String; var phone: String; var hours: String }
    struct Rental: Decodable, Identifiable {
        var number: String; var status: String; var who: String; var vehicle: String?; var paint: String?
        var start_date: String; var end_date: String; var out_at: String?
        var id: String { number }
    }
    struct Vehicle: Decodable, Identifiable {
        var vehicle: String; var color: String; var paint: String; var status: String
        var id: String { vehicle + color }
    }
    struct Bay: Decodable, Identifiable {
        var bay: Int; var status: String; var job: String; var who: String; var vehicle: String?; var tech: String?; var pending: Int
        var started_at: String?; var done_at: String?
        var id: Int { bay }
    }
    var shop: Shop?; var rentals: [Rental]; var fleet: [Vehicle]; var bays: [Bay]?
}

@MainActor
final class BoardModel: ObservableObject {
    @Published var board: Board?
    @Published var error: String?
    @Published var now = Date()
    private var timer: Timer?

    func start() {
        Task { await load() }
        timer = Timer.scheduledTimer(withTimeInterval: 20, repeats: true) { _ in Task { await self.load() } }
    }
    func load() async {
        now = Date()
        var req = URLRequest(url: URL(string: SUPABASE_URL + "/rest/v1/rpc/board_by_token")!)
        req.httpMethod = "POST"
        req.setValue(SUPABASE_KEY, forHTTPHeaderField: "apikey")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["p_token": BOARD_TOKEN])
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            if String(data: data, encoding: .utf8) == "null" { error = "This display token is not valid."; return }
            board = try JSONDecoder().decode(Board.self, from: data)
            error = nil
        } catch { self.error = "Can't reach the shop right now." }
    }
}

func dayLabel(_ iso: String) -> String {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
    guard let d = f.date(from: iso) else { return iso }
    let o = DateFormatter(); o.dateFormat = "EEE, MMM d"
    return o.string(from: d)
}
func isToday(_ iso: String) -> Bool {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date()) == iso
}
