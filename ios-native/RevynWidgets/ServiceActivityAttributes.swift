import ActivityKit
import Foundation

// Shared with the app target (Revyn/Core/ServiceActivityAttributes.swift is an identical copy).
struct ServiceActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var stage: Int          // 1 checked in · 2 in service · 3 ready
        var status: String      // "Checked in", "In service", "Estimate ready", "Ready for pickup"
        var detail: String      // "Bay 02 · since 1:42 PM"
        var pending: Int        // findings waiting for approval
        var since: Date
    }
    var vehicle: String
    var job: String
    var shop: String
}
