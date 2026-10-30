import Foundation
import Supabase

// One client for the app. Dates from Postgres arrive as ISO strings with or without fractional seconds.
enum Supa {
    static let client: SupabaseClient = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { d in
            let s = try d.singleValueContainer().decode(String.self)
            if let date = Supa.parseDate(s) { return date }
            throw DecodingError.dataCorruptedError(in: try d.singleValueContainer(), debugDescription: "Unrecognized date \(s)")
        }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return SupabaseClient(
            supabaseURL: URL(string: Secrets.supabaseURL)!,
            supabaseKey: Secrets.supabaseKey,
            options: .init(db: .init(encoder: encoder, decoder: decoder))
        )
    }()

    private static let isoFrac: ISO8601DateFormatter = { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f }()
    private static let iso: ISO8601DateFormatter = { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime]; return f }()
    private static let pg: DateFormatter = { let f = DateFormatter(); f.locale = Locale(identifier: "en_US_POSIX"); f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSSxxx"; return f }()
    private static let pg2: DateFormatter = { let f = DateFormatter(); f.locale = Locale(identifier: "en_US_POSIX"); f.dateFormat = "yyyy-MM-dd'T'HH:mm:ssxxx"; return f }()
    private static let pgDate: DateFormatter = { let f = DateFormatter(); f.locale = Locale(identifier: "en_US_POSIX"); f.dateFormat = "yyyy-MM-dd"; return f }()

    static func parseDate(_ s: String) -> Date? {
        // Postgres writes "+00:00"; ISO8601DateFormatter wants it too, but fractional digits vary (1–6).
        if let d = isoFrac.date(from: s) ?? iso.date(from: s) { return d }
        var t = s.replacingOccurrences(of: " ", with: "T")
        if t.hasSuffix("+00") { t += ":00" }
        if let d = pg.date(from: t) ?? pg2.date(from: t) { return d }
        if let dot = t.firstIndex(of: "."), let tz = t.lastIndex(where: { $0 == "+" || $0 == "-" }), tz > dot {
            let frac = t[t.index(after: dot)..<tz]
            let padded = String(frac) + String(repeating: "0", count: max(0, 6 - frac.count))
            let fixed = t[..<t.index(after: dot)] + padded.prefix(6) + t[tz...]
            if let d = pg.date(from: String(fixed)) { return d }
        }
        return pgDate.date(from: s)
    }
}
