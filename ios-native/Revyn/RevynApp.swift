import SwiftUI

@main
struct RevynApp: App {
    @StateObject private var model = AppModel()
    @Environment(\.scenePhase) private var phase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
                .preferredColorScheme(.dark)
                .tint(.white)
                .onAppear { model.start() }
                .onChange(of: phase) { _, p in if p == .active { Task { await model.refresh() } } }
        }
    }
}

struct RootView: View {
    @EnvironmentObject var model: AppModel
    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            switch model.gate {
            case .loading: ProgressView().tint(.white)
            case .signedOut: SignInView()
            case .needsPhone: PhoneView()
            case .ready: MainTabs()
            }
        }
        .overlay(alignment: .top) { if let t = model.toast { ToastView(text: t).onAppear { Task { try? await Task.sleep(for: .seconds(3.2)); if model.toast == t { withAnimation { model.toast = nil } } } } } }
        .alert("Something went wrong", isPresented: Binding(get: { model.error != nil }, set: { if !$0 { model.error = nil } })) { Button("OK") { model.error = nil } } message: { Text(model.error ?? "") }
    }
}

/// The system tab bar: on iOS 26 and later this is Liquid Glass, drawn by UIKit, with the content
/// scrolling beneath it. Nothing here imitates it.
struct MainTabs: View {
    @EnvironmentObject var model: AppModel
    var body: some View {
        TabView(selection: $model.tab) {
            Tab("Home", systemImage: "house", value: AppModel.Tab.home) { HomeView() }
            Tab("Vehicles", systemImage: "car", value: AppModel.Tab.vehicles) { VehiclesView() }
            Tab("Service", systemImage: "wrench.and.screwdriver", value: AppModel.Tab.service) { ServiceView() }
                .badge(model.unread > 0 ? model.unread : 0)
            Tab("Shop", systemImage: "mappin.and.ellipse", value: AppModel.Tab.shop) { ShopView() }
            Tab("History", systemImage: "clock", value: AppModel.Tab.history) { HistoryView() }
        }
    }
}

struct ToastView: View {
    var text: String
    var body: some View {
        HStack(spacing: 12) {
            Image("Logo").resizable().scaledToFit().frame(height: 10).padding(.horizontal, 4)
            Text(text).font(.system(size: 14)).lineLimit(2)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .background(Theme.card2, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .padding(.horizontal, 14)
        .transition(.move(edge: .top).combined(with: .opacity))
    }
}
