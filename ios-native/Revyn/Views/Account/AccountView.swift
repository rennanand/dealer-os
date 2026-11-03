import SwiftUI

struct AccountView: View {
    @EnvironmentObject var model: AppModel
    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                VStack(spacing: 8) {
                    Text(model.initials).font(.system(size: 20, weight: .semibold)).frame(width: 64, height: 64).background(Theme.control, in: Circle())
                    Text(model.session?.user.userMetadata["name"]?.stringValue ?? model.profile?.name ?? "").font(.system(size: 22, weight: .semibold))
                    Text([model.session?.user.email, model.profile?.phone.phoneFormatted].compactMap { $0 }.joined(separator: " · ")).font(.system(size: 13.5)).foregroundStyle(Theme.dim)
                }.padding(.top, 10)
                VStack(spacing: 0) {
                    Row(icon: "car", title: "Vehicles", subtitle: "\(model.vehicles.count) on file").onTapGesture { model.tab = .vehicles }
                    Divider().overlay(Theme.line)
                    Row(icon: "bell", title: "Notifications", subtitle: "Check-in, estimates, ready for pickup, replies").onTapGesture { if let u = URL(string: UIApplication.openNotificationSettingsURLString) { UIApplication.shared.open(u) } }
                    Divider().overlay(Theme.line)
                    Row(icon: "mappin.and.ellipse", title: model.shop?.name ?? "Your shop", subtitle: model.shop?.address).onTapGesture { model.tab = .shop }
                    Divider().overlay(Theme.line)
                    Row(icon: "wrench.and.screwdriver", title: "Technician mode", subtitle: "Shows the iPad technician app on this phone after a relaunch. Staff accounts only.").onTapGesture { let on = !UserDefaults.standard.bool(forKey: "revyn.techMode"); UserDefaults.standard.set(on, forKey: "revyn.techMode"); model.toast = on ? "Technician mode on — relaunch Revyn." : "Technician mode off — relaunch Revyn." }
                }.padding(.horizontal, 6).background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)).padding(.horizontal, 0)
                Button { Task { await model.signOut() } } label: {
                    Text("Sign out").font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.red).frame(maxWidth: .infinity).frame(height: 52).background(Theme.card, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }.buttonStyle(.plain).padding(.top, 10)
                Text("Your vehicles and visits stay with your mobile number. Sign back in any time.").font(.system(size: 12.5)).foregroundStyle(Theme.dimmer).multilineTextAlignment(.center)
                HStack(spacing: 14) {
                    ForEach(["Red", "Blue", "Silver", "Midnight Silver"], id: \.self) { w in
                        HStack(spacing: 6) { Circle().fill(Theme.paint(named: w)).frame(width: 12, height: 12); Text(w).font(.system(size: 11)).foregroundStyle(Theme.dimmer) }
                    }
                }.padding(.top, 16)
                Text("Revyn · " + (model.shop?.address ?? "")).font(.system(size: 11)).foregroundStyle(Theme.dimmer).padding(.top, 8)
            }.padding(16)
        }
        .background(Theme.bg)
        .navigationTitle("Account")
        .toolbarTitleDisplayMode(.inline)
    }
}
