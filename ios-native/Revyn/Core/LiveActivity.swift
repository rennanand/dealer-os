import ActivityKit
import Foundation

/// Keeps one Live Activity in step with the active visit. Starts when the car is checked in, updates
/// on every refresh, ends once the car is picked up. Updates happen while the app runs (foreground or
/// recently backgrounded); push-driven updates can be added later with the activity's push token.
enum LiveActivity {
    static func sync(_ m: AppModel) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let current = Activity<ServiceActivityAttributes>.activities.first
        guard let a = m.active, a.started, a.pickup != "picked_up" else {
            if let c = current { Task { await c.end(c.content, dismissalPolicy: .default) } }
            return
        }
        let stage = a.stage >= 8 ? 3 : a.stage >= 2 ? 2 : 1
        let pending = a.pendingFindings.count
        let status = pending > 0 ? "Estimate ready" : stage == 3 ? "Ready for pickup" : stage == 2 ? "In service" : "Checked in"
        let bay = a.bay.map { "Bay 0\($0)" }
        let when = stage == 3 ? a.done_at : stage == 2 ? a.started_at : a.arrived_at
        let detail = [bay, when.map { (stage == 3 ? "ready " : "since ") + $0.clock }].compactMap { $0 }.joined(separator: " · ")
        let state = ServiceActivityAttributes.ContentState(stage: stage, status: status, detail: detail, pending: pending, since: when ?? Date())
        let content = ActivityContent(state: state, staleDate: Date().addingTimeInterval(60 * 60))
        if let c = current {
            if c.content.state != state { Task { await c.update(content) } }
        } else {
            let attrs = ServiceActivityAttributes(vehicle: m.activeVehicle?.title ?? a.vehicle ?? "Your car", job: a.job ?? "Service", shop: m.shop?.name.split(separator: " ").prefix(2).joined(separator: " ") ?? "the shop")
            _ = try? Activity.request(attributes: attrs, content: content, pushType: nil)
        }
    }
}
