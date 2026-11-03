import SwiftUI
import UIKit

/// One job on the iPad: the car and the customer, the clock, the inspection with photos, what was
/// sent, the approved jobs with their own clocks, and Finish.
struct JobDetailView: View {
    @EnvironmentObject var tech: TechModel
    var appointment: TechAppointment
    var body: some View {
        let a = tech.appointments.first(where: { $0.id == appointment.id }) ?? appointment
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Header(a: a)
                ClockCard(a: a)
                InspectionSection(a: a)
                JobsSection(a: a)
                if a.status != "done" { SecondaryButton(title: "Finish — car is ready for pickup") { Task { await tech.finish(a) } }.padding(.top, 8) }
            }.padding(20).frame(maxWidth: 860)
        }
        .background(Theme.bg)
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await tech.refresh() }
    }
}

private struct Header: View {
    @EnvironmentObject var tech: TechModel
    var a: TechAppointment
    var body: some View {
        let c = tech.customer(a), v = tech.vehicle(a)
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(v?.name ?? "Vehicle").font(.system(size: 30, weight: .semibold)).tracking(-0.8)
                    Text([c?.name, c?.phone?.phoneFormatted, a.bay.map { "Bay 0\($0)" }].compactMap { $0 }.joined(separator: " · ")).font(.system(size: 14)).foregroundStyle(Theme.dim)
                    if let s = v?.specs, !s.isEmpty { Text(s).font(.system(size: 13)).foregroundStyle(Theme.dimmer) }
                    if let vin = v?.vin, !vin.isEmpty { Text("VIN " + vin).font(.system(size: 12, design: .monospaced)).foregroundStyle(Theme.dimmer) }
                }
                Spacer()
                Pill(text: status, color: color)
            }
        }
    }
    var status: String { switch a.status { case "arrived": "Checked in"; case "in_progress": "In service"; case "done": "Complete"; default: "Booked" } }
    var color: Color { switch a.status { case "arrived", "in_progress": Theme.yellow; case "done": Theme.green; default: Theme.red } }
}

private struct ClockCard: View {
    @EnvironmentObject var tech: TechModel
    var a: TechAppointment
    var body: some View {
        let open = tech.openEntry(a); let hrs = tech.hours(a)
        Card {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(a.job ?? "Service").font(.system(size: 18, weight: .semibold))
                    Text(concern).font(.system(size: 13.5)).foregroundStyle(Theme.dim)
                    if open != nil || hrs > 0 { Text((open.map { "On the clock since " + $0.started_at.formatted(date: .omitted, time: .shortened) + " · " + tech.techName($0.tech_id) } ?? "Clock off") + (hrs > 0 ? " · " + String(format: "%.1f h total", hrs) : "")).font(.system(size: 12.5)).foregroundStyle(Theme.dimmer).padding(.top, 2) }
                }
                Spacer()
                if a.status == "booked" { SecondaryButton(title: "Check in") { Task { await tech.setStatus(a, "arrived") } }.frame(width: 120) }
                if let e = open { SecondaryButton(title: "Clock off") { Task { await tech.clockOff(tech: e.tech_id) } }.frame(width: 120) }
                else if a.status != "done" { PrimaryButton(title: "Clock on") { Task { await tech.clockOn(a) } }.frame(width: 120) }
            }
        }
    }
    var concern: String {
        let c = (a.concern ?? "").isEmpty ? (a.notes ?? "") : a.concern!
        return c.isEmpty ? "No note from the customer." : "Customer: “" + c + "”"
    }
}

private struct InspectionSection: View {
    @EnvironmentObject var tech: TechModel
    var a: TechAppointment
    var body: some View {
        let insp = tech.inspection(a)
        let flagged = insp.items.filter { $0.flagged && $0.sent != true }.count
        let good = insp.items.filter { $0.status == "good" }.count
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("Inspection").font(.system(size: 22, weight: .semibold)).tracking(-0.4)
                Spacer()
                if tech.templates.count > 1, insp.status != "sent" {
                    Menu { ForEach(tech.templates) { t in Button(t.name) { Task { await tech.useTemplate(a, t) } } } } label: { Text(tech.template(for: a)?.name ?? "Template").font(.system(size: 13)).foregroundStyle(Theme.dim) }
                }
                Text("\(good) good · " + (flagged > 0 ? "\(flagged) to send" : insp.status == "sent" ? "sent " + (insp.sent_at?.formatted(date: .omitted, time: .shortened) ?? "") : "nothing flagged")).font(.system(size: 13)).foregroundStyle(Theme.dim)
            }
            ForEach(insp.items, id: \.key) { it in InspectionItemView(a: a, item: it) }
            if flagged > 0 { PrimaryButton(title: "Send \(flagged) item\(flagged == 1 ? "" : "s") to the customer", busy: tech.busy) { Task { await tech.send(a) } } }
            else { Text("Flag anything as Monitor or Now and it goes to the customer’s phone with the price for approval.").font(.system(size: 13)).foregroundStyle(Theme.dimmer) }
        }
    }
}

struct InspectionItemView: View {
    @EnvironmentObject var tech: TechModel
    var a: TechAppointment
    var item: InspItem
    @State private var camera = false
    var body: some View {
        let sent = item.sent == true
        Card(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 14) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.label + (sent ? " · sent" : "")).font(.system(size: 16, weight: .semibold))
                        Text(item.measLabel ?? "Condition").font(.system(size: 12.5)).foregroundStyle(Theme.dimmer)
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        Seg(label: "Good", on: item.status == "good", color: Theme.green, dark: true) { set("good") }
                        Seg(label: "Monitor", on: item.status == "monitor", color: Theme.yellow, dark: true) { set("monitor") }
                        Seg(label: "Now", on: item.status == "now", color: Theme.red, dark: false) { set("now") }
                    }.frame(width: 300)
                }
                if item.flagged && !sent {
                    HStack(spacing: 8) {
                        TextField("What needs doing · " + item.label.lowercased(), text: bind(\.name)).field()
                        TextField(item.measLabel ?? "Measured", text: bind(\.meas)).field().frame(width: 150)
                        TextField(job == nil ? "$ price" : "$ (or the job)", text: bind(\.price)).keyboardType(.decimalPad).field().frame(width: 150)
                    }
                    TextField("In plain words, for the customer", text: bind(\.note)).field()
                    if let j = job { Text("Quotes “" + j.name + "” from the library unless a price is typed.").font(.system(size: 12)).foregroundStyle(Theme.dimmer) }
                }
                let ph = tech.photos(a, key: item.key)
                if !ph.isEmpty || item.flagged {
                    HStack(spacing: 8) {
                        ForEach(ph) { p in AsyncImage(url: p.url) { img in img.resizable().scaledToFill() } placeholder: { Theme.card2 }.frame(width: 72, height: 54).clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous)) }
                        if item.flagged { Button { camera = true } label: { Text("+ Photo").font(.system(size: 12.5)).foregroundStyle(Theme.dim).frame(width: 72, height: 54).background(Theme.card2, in: RoundedRectangle(cornerRadius: 9, style: .continuous)) }.buttonStyle(.plain) }
                    }
                }
            }
        }
        .opacity(sent ? 0.6 : 1)
        .sheet(isPresented: $camera) { CameraView { img in Task { await tech.addPhoto(a, key: item.key, image: img) } }.ignoresSafeArea() }
    }
    private var job: CannedJob? { tech.cannedJobs.first { $0.id == (item.status == "now" ? item.now_job : item.monitor_job) } }
    private func set(_ st: String) { tech.setItem(a, key: item.key) { $0.status = $0.status == st ? "" : st }; Haptic.tap() }
    private func bind(_ kp: WritableKeyPath<InspItem, String?>) -> Binding<String> {
        Binding(get: { item[keyPath: kp] ?? "" }, set: { v in tech.setItem(a, key: item.key) { $0[keyPath: kp] = v } })
    }
}

private struct Seg: View {
    var label: String; var on: Bool; var color: Color; var dark: Bool; var action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(label).font(.system(size: 13.5, weight: .semibold)).frame(maxWidth: .infinity).frame(height: 40)
                .background(on ? color : Theme.card2, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                .foregroundStyle(on ? (dark ? .black : .white) : Theme.dim)
        }.buttonStyle(.plain)
    }
}

private struct JobsSection: View {
    @EnvironmentObject var tech: TechModel
    var a: TechAppointment
    var body: some View {
        let jobs = tech.jobs(a)
        if !jobs.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("SENT TO THE CUSTOMER").font(.system(size: 10.5, weight: .medium, design: .monospaced)).tracking(1.2).foregroundStyle(Theme.dimmer)
                ForEach(jobs) { f in JobLine(a: a, f: f) }
            }
        }
    }
}

private struct JobLine: View {
    @EnvironmentObject var tech: TechModel
    var a: TechAppointment
    var f: TechFinding
    var body: some View {
        let open = tech.openEntry(job: f.id); let jh = tech.hours(job: f.id)
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 3) {
                Text(f.name ?? "").font(.system(size: 15, weight: .medium))
                Text(statusText + (jh > 0 ? String(format: " · %.1f h", jh) : "") + (open != nil ? " · on the clock" : "")).font(.system(size: 12.5)).foregroundStyle(color)
                if let ls = f.lines, !ls.isEmpty { Text(ls.compactMap { $0.description }.joined(separator: ", ")).font(.system(size: 12)).foregroundStyle(Theme.dimmer).lineLimit(1) }
            }
            Spacer()
            Text(money(f.price_cents ?? 0)).font(.system(size: 14, design: .monospaced))
            if let e = open { SecondaryButton(title: "Clock off") { Task { await tech.clockOff(tech: e.tech_id) } }.frame(width: 110) }
            else if f.status == "approved" { PrimaryButton(title: "Clock on") { Task { await tech.clockOn(a, job: f.id) } }.frame(width: 110) }
            if f.status == "approved" { SecondaryButton(title: "Done") { Task { await tech.markDone(f) } }.frame(width: 90) }
        }
        .padding(.vertical, 12)
        .overlay(alignment: .bottom) { Divider().overlay(Theme.line) }
    }
    var statusText: String { switch f.status { case "approved": "Approved — go ahead"; case "declined": "Declined"; case "done": "Done"; default: "Waiting on customer" } }
    var color: Color { switch f.status { case "approved", "done": Theme.green; case "declined": Theme.dimmer; default: Theme.yellow } }
}

/// The iPad camera for inspection photos; falls back to the photo library where there is no camera.
struct CameraView: UIViewControllerRepresentable {
    var onImage: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let p = UIImagePickerController()
        p.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        p.delegate = context.coordinator
        return p
    }
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView
        init(_ p: CameraView) { parent = p }
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let img = (info[.editedImage] ?? info[.originalImage]) as? UIImage { parent.onImage(img) }
            parent.dismiss()
        }
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { parent.dismiss() }
    }
}
