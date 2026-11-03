import ActivityKit
import WidgetKit
import SwiftUI

/// The visit on the Lock Screen and in the Dynamic Island: where the car is in the day, in one glance.
struct ServiceLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ServiceActivityAttributes.self) { ctx in
            LockScreenView(ctx: ctx)
                .activityBackgroundTint(Color.black)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(ctx.attributes.vehicle).font(.system(size: 15, weight: .semibold)).lineLimit(1)
                        Text(ctx.attributes.job).font(.system(size: 12)).foregroundStyle(.secondary)
                    }.padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(ctx.state.status).font(.system(size: 13, weight: .semibold)).foregroundStyle(tint(ctx.state)).padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 8) {
                        StageBar(stage: ctx.state.stage, pending: ctx.state.pending)
                        Text(ctx.state.detail).font(.system(size: 12)).foregroundStyle(.secondary)
                    }.padding(.horizontal, 4).padding(.bottom, 2)
                }
            } compactLeading: {
                Image(systemName: icon(ctx.state)).font(.system(size: 14, weight: .semibold)).foregroundStyle(tint(ctx.state))
            } compactTrailing: {
                Text(ctx.state.pending > 0 ? "Review" : "\(ctx.state.stage)/3").font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(tint(ctx.state))
            } minimal: {
                Image(systemName: icon(ctx.state)).font(.system(size: 13, weight: .semibold)).foregroundStyle(tint(ctx.state))
            }
            .keylineTint(tint(ctx.state))
        }
    }

    private func tint(_ s: ServiceActivityAttributes.ContentState) -> Color {
        if s.pending > 0 { return Color(red: 1, green: 0xd6 / 255, blue: 0x0a / 255) }
        if s.stage >= 3 { return Color(red: 0x30 / 255, green: 0xd1 / 255, blue: 0x58 / 255) }
        return Color(red: 0xe0 / 255, green: 0x31 / 255, blue: 0x2b / 255)
    }
    private func icon(_ s: ServiceActivityAttributes.ContentState) -> String {
        if s.pending > 0 { return "doc.text.magnifyingglass" }
        if s.stage >= 3 { return "checkmark.circle.fill" }
        return s.stage >= 2 ? "wrench.and.screwdriver.fill" : "car.fill"
    }
}

struct LockScreenView: View {
    var ctx: ActivityViewContext<ServiceActivityAttributes>
    private var tint: Color {
        if ctx.state.pending > 0 { return Color(red: 1, green: 0xd6 / 255, blue: 0x0a / 255) }
        if ctx.state.stage >= 3 { return Color(red: 0x30 / 255, green: 0xd1 / 255, blue: 0x58 / 255) }
        return Color(red: 0xe0 / 255, green: 0x31 / 255, blue: 0x2b / 255)
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(ctx.attributes.vehicle).font(.system(size: 17, weight: .semibold))
                    Text(ctx.attributes.job + " · " + ctx.attributes.shop).font(.system(size: 12.5)).foregroundStyle(.secondary).lineLimit(1)
                }
                Spacer()
                HStack(spacing: 6) {
                    Circle().fill(tint).frame(width: 7, height: 7)
                    Text(ctx.state.status).font(.system(size: 13, weight: .semibold)).foregroundStyle(tint)
                }
            }
            StageBar(stage: ctx.state.stage, pending: ctx.state.pending)
            HStack {
                Text(ctx.state.detail).font(.system(size: 12.5)).foregroundStyle(.secondary)
                Spacer()
                if ctx.state.pending > 0 { Text("\(ctx.state.pending) to approve").font(.system(size: 12.5, weight: .medium)).foregroundStyle(tint) }
                else if ctx.state.stage < 3 { Text(ctx.state.since, style: .timer).font(.system(size: 12.5, design: .monospaced)).foregroundStyle(.secondary).frame(width: 56, alignment: .trailing) }
            }
        }
        .padding(16)
        .foregroundStyle(.white)
    }
}

/// Three segments: Check-in · Service · Pickup.
struct StageBar: View {
    var stage: Int
    var pending: Int
    var body: some View {
        HStack(spacing: 6) {
            ForEach(1...3, id: \.self) { i in
                Capsule().fill(i <= stage ? (pending > 0 && i == 2 ? Color(red: 1, green: 0xd6 / 255, blue: 0x0a / 255) : Color.white) : Color.white.opacity(0.18)).frame(height: 4)
            }
        }
        .overlay(alignment: .leading) {
            HStack { Text("Check-in"); Spacer(); Text("Service"); Spacer(); Text("Pickup") }
                .font(.system(size: 10, weight: .medium)).foregroundStyle(.secondary).offset(y: 12)
        }
        .padding(.bottom, 12)
    }
}
