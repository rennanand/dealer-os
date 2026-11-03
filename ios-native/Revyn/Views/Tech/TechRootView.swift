import SwiftUI

/// Revyn on iPad is the technician's app: today's jobs on the left, the job on the right.
/// Same account as the shop desktop; the technician picks their name once.
struct TechRootView: View {
    @EnvironmentObject var tech: TechModel
    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            switch tech.gate {
            case .loading: ProgressView().tint(.white)
            case .signedOut: SignInView()
            case .notStaff: NotStaffView()
            case .ready: if tech.me == nil { TechPickerView() } else { TechSplitView() }
            }
        }
        .overlay(alignment: .top) { if let t = tech.toast { ToastView(text: t).onAppear { Task { try? await Task.sleep(for: .seconds(3)); if tech.toast == t { withAnimation { tech.toast = nil } } } } } }
        .alert("Something went wrong", isPresented: Binding(get: { tech.error != nil }, set: { if !$0 { tech.error = nil } })) { Button("OK") { tech.error = nil } } message: { Text(tech.error ?? "") }
    }
}

struct NotStaffView: View {
    @EnvironmentObject var tech: TechModel
    var body: some View {
        VStack(spacing: 14) {
            Image("Logo").resizable().scaledToFit().frame(height: 13)
            Text("This account is not on the shop's team.").font(.system(size: 24, weight: .semibold)).tracking(-0.5).multilineTextAlignment(.center)
            Text("Ask the owner to add you under Team on the shop desktop, then sign in again.").font(.system(size: 14.5)).foregroundStyle(Theme.dim).multilineTextAlignment(.center)
            SecondaryButton(title: "Sign out") { Task { await tech.signOut() } }.frame(maxWidth: 240).padding(.top, 10)
        }.padding(40).frame(maxWidth: 480)
    }
}

struct TechPickerView: View {
    @EnvironmentObject var tech: TechModel
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Image("Logo").resizable().scaledToFit().frame(height: 13)
            Text("Who’s on the iPad?").font(.system(size: 32, weight: .semibold)).tracking(-0.8).padding(.top, 22)
            Text("Your jobs, your clock, your inspections. The desk sees everything the moment you tap it.").font(.system(size: 14.5)).foregroundStyle(Theme.dim).padding(.top, 8)
            VStack(spacing: 8) {
                ForEach(tech.techs) { t in
                    Button { tech.pick(t) } label: { Card { Text(t.name).font(.system(size: 18, weight: .semibold)).foregroundStyle(.white) } }.buttonStyle(.plain)
                }
                if tech.techs.isEmpty { Text("No technicians yet — add the crew on the shop desktop (Technicians).").font(.system(size: 13.5)).foregroundStyle(Theme.dimmer).padding(.top, 8) }
            }.padding(.top, 24)
            Button("Sign out") { Task { await tech.signOut() } }.font(.system(size: 13.5)).foregroundStyle(Theme.dim).padding(.top, 22)
        }
        .padding(32).frame(maxWidth: 480)
        .task { await tech.refresh() }
    }
}

struct TechSplitView: View {
    @EnvironmentObject var tech: TechModel
    var body: some View {
        NavigationSplitView {
            JobsList()
                .navigationTitle("Today")
                .toolbar { ToolbarItem(placement: .topBarTrailing) { Menu { Button("Switch technician") { tech.pick(nil) }; Button("Refresh") { Task { await tech.refresh() } }; Button("Sign out", role: .destructive) { Task { await tech.signOut() } } } label: { Text(tech.me?.name.split(separator: " ").first.map(String.init) ?? "Me").foregroundStyle(Theme.dim) } } }
        } detail: {
            if let id = tech.selected, let a = tech.appointments.first(where: { $0.id == id }) { JobDetailView(appointment: a).id(id) }
            else { VStack(spacing: 8) { Text("Pick a job.").font(.system(size: 22, weight: .semibold)); Text(Date().formatted(.dateTime.weekday(.wide).month(.wide).day())).font(.system(size: 14)).foregroundStyle(Theme.dim) }.frame(maxWidth: .infinity, maxHeight: .infinity).background(Theme.bg) }
        }
        .navigationSplitViewStyle(.balanced)
        .background(Theme.bg)
    }
}

struct JobsList: View {
    @EnvironmentObject var tech: TechModel
    var body: some View {
        List(selection: $tech.selected) {
            ForEach(tech.live) { a in JobRow(a: a).tag(a.id).listRowBackground(Theme.bg).listRowSeparatorTint(Theme.line) }
            if tech.live.isEmpty { Text("Nothing in the shop yet. Jobs appear as the desk checks customers in.").font(.system(size: 13.5)).foregroundStyle(Theme.dimmer).listRowBackground(Theme.bg) }
        }
        .listStyle(.plain).scrollContentBackground(.hidden).background(Theme.bg)
        .refreshable { await tech.refresh() }
    }
}

struct JobRow: View {
    @EnvironmentObject var tech: TechModel
    var a: TechAppointment
    var body: some View {
        let c = tech.customer(a), v = tech.vehicle(a)
        let mine = tech.me.map { a.tech_id == $0.id } ?? false
        let on = tech.openEntry(a) != nil
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 3) {
                Text(v?.name ?? "Vehicle").font(.system(size: 17, weight: .semibold))
                Text((c?.name ?? "Customer") + " · " + (a.job ?? "Service")).font(.system(size: 13)).foregroundStyle(Theme.dim).lineLimit(1)
                HStack(spacing: 8) {
                    Text(statusLabel).font(.system(size: 12, weight: .medium)).foregroundStyle(statusColor)
                    if a.bay != nil { Text("Bay 0\(a.bay!)").font(.system(size: 12)).foregroundStyle(Theme.dimmer) }
                    if a.online_checkin_at != nil { Text("Checked in online").font(.system(size: 12)).foregroundStyle(Theme.green) }
                    if on { Text("On the clock").font(.system(size: 12)).foregroundStyle(Theme.green) }
                    if mine { Text("Mine").font(.system(size: 12)).foregroundStyle(.white) }
                }
            }
            Spacer()
            Text(a.starts_at.formatted(date: .omitted, time: .shortened)).font(.system(size: 13, design: .monospaced)).foregroundStyle(Theme.dim)
        }.padding(.vertical, 8)
    }
    var statusLabel: String { switch a.status { case "arrived": "Checked in"; case "in_progress": "In service"; case "done": "Complete"; default: "Booked" } }
    var statusColor: Color { switch a.status { case "arrived", "in_progress": Theme.yellow; case "done": Theme.green; default: Theme.red } }
}
