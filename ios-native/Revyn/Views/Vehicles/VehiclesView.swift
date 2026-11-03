import SwiftUI

struct VehiclesView: View {
    @EnvironmentObject var model: AppModel
    @State private var showAdd = false
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    if model.vehicles.isEmpty {
                        VStack(spacing: 10) {
                            Text("Add your vehicle to get started.").font(.system(size: 24, weight: .semibold)).tracking(-0.5).multilineTextAlignment(.center)
                            Text("Service updates, photos from your technician, and every record in one place.").font(.system(size: 14.5)).foregroundStyle(Theme.dim).multilineTextAlignment(.center)
                            PrimaryButton(title: "Add a vehicle") { showAdd = true }.padding(.top, 10).frame(maxWidth: 260)
                        }.padding(.top, 120).padding(.horizontal, 30)
                    }
                    ForEach(Array(model.vehicles.enumerated()), id: \.element.id) { i, v in
                        NavigationLink { VehicleDetailView(vehicle: v, index: i) } label: {
                            Card {
                                HStack(spacing: 14) {
                                    Circle().fill(Theme.paint(for: v)).frame(width: 14, height: 14).overlay(Circle().stroke(.white.opacity(0.15)))
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(v.title).font(.system(size: 19, weight: .semibold))
                                        Text(v.subtitle).font(.system(size: 13.5)).foregroundStyle(Theme.dim)
                                        if let n = v.visits, n > 0 { Text("\(n) visit\(n == 1 ? "" : "s") recorded").font(.system(size: 12.5)).foregroundStyle(Theme.dimmer) }
                                        else if let lk = v.lastKnown { Text(lk).font(.system(size: 12.5)).foregroundStyle(Theme.dimmer) }
                                    }
                                    Spacer()
                                    if i == model.selectedVehicleIndex && model.vehicles.count > 1 { Image(systemName: "checkmark").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.dim) }
                                    Image(systemName: "chevron.right").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.dimmer)
                                }
                            }
                        }.buttonStyle(.plain).foregroundStyle(.white)
                    }
                    if !model.vehicles.isEmpty {
                        Button { showAdd = true } label: { Label("Add another vehicle", systemImage: "plus").font(.system(size: 15, weight: .medium)).frame(maxWidth: .infinity).frame(height: 52).background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.radius, style: .continuous)) }.buttonStyle(.plain).foregroundStyle(.white)
                    }
                }.padding(16)
            }
            .background(Theme.bg)
            .navigationTitle("Vehicles")
            .toolbarTitleDisplayMode(.large)
            .refreshable { await model.refresh() }
            .sheet(isPresented: $showAdd) { AddVehicleView() }
        }
    }
}

struct AddVehicleView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var year = ""
    @State private var make = ""
    @State private var vmodel = ""
    @State private var plate = ""
    @State private var odometer = ""
    @State private var color = ""
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 10) {
                    HStack(spacing: 10) {
                        TextField("Year", text: $year).keyboardType(.numberPad).field().frame(width: 110)
                        TextField("Make · Toyota", text: $make).textInputAutocapitalization(.words).field()
                    }
                    TextField("Model · 4Runner", text: $vmodel).textInputAutocapitalization(.words).field()
                    TextField("Color · Red, Silver, Black…", text: $color).textInputAutocapitalization(.words).field()
                    TextField("Plate (optional)", text: $plate).textInputAutocapitalization(.characters).autocorrectionDisabled().field()
                    TextField("Mileage (optional)", text: $odometer).keyboardType(.numberPad).field()
                    Text("Mileage is entered by you and recorded again by the shop at check-in. The app has no connection to the car.").font(.system(size: 12.5)).foregroundStyle(Theme.dimmer).frame(maxWidth: .infinity, alignment: .leading).padding(.top, 4)
                    PrimaryButton(title: "Add vehicle", enabled: !make.trimmingCharacters(in: .whitespaces).isEmpty && !vmodel.trimmingCharacters(in: .whitespaces).isEmpty, busy: model.busy) {
                        Task {
                            if await model.addVehicle(year: Int(year), make: make.trimmingCharacters(in: .whitespaces), model: vmodel.trimmingCharacters(in: .whitespaces), plate: plate.trimmingCharacters(in: .whitespaces), odometer: Int(odometer.digits)) {
                                if let v = model.vehicles.last, !color.trimmingCharacters(in: .whitespaces).isEmpty { _ = await model.updateVehicle(v, year: v.year, make: v.make ?? "", model: v.model ?? "", plate: v.plate ?? "", color: color.trimmingCharacters(in: .whitespaces), nickname: "") }
                                dismiss()
                            }
                        }
                    }.padding(.top, 12)
                }.padding(20)
            }
            .background(Theme.bg)
            .navigationTitle("Add a vehicle")
            .toolbarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
        .presentationDetents([.large])
    }
}

/// One vehicle: pick it for Home, edit its details, or remove it.
struct VehicleDetailView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss
    var vehicle: Vehicle
    var index: Int
    @State private var year = ""
    @State private var make = ""
    @State private var vmodel = ""
    @State private var plate = ""
    @State private var color = ""
    @State private var nickname = ""
    @State private var confirmRemove = false
    private var live: Vehicle { model.vehicles.first(where: { $0.id == vehicle.id }) ?? vehicle }
    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                CarView(paint: Theme.paint(for: Vehicle(id: live.id, year: live.year, make: live.make, model: live.model, plate: live.plate, odometer: live.odometer, visits: live.visits, color: color.isEmpty ? live.color : color, nickname: live.nickname, last_visit_at: live.last_visit_at, last_service: live.last_service)), angle: .orbit, autoRotate: true).frame(height: 220)
                TextField("Nickname (optional) · The Falcon", text: $nickname).textInputAutocapitalization(.words).field()
                HStack(spacing: 10) {
                    TextField("Year", text: $year).keyboardType(.numberPad).field().frame(width: 110)
                    TextField("Make", text: $make).textInputAutocapitalization(.words).field()
                }
                TextField("Model", text: $vmodel).textInputAutocapitalization(.words).field()
                TextField("Color · Red, Silver, Black…", text: $color).textInputAutocapitalization(.words).field()
                TextField("Plate (optional)", text: $plate).textInputAutocapitalization(.characters).autocorrectionDisabled().field()
                PrimaryButton(title: "Save", enabled: !make.trimmingCharacters(in: .whitespaces).isEmpty && !vmodel.trimmingCharacters(in: .whitespaces).isEmpty, busy: model.busy) {
                    Task { if await model.updateVehicle(live, year: Int(year), make: make.trimmingCharacters(in: .whitespaces), model: vmodel.trimmingCharacters(in: .whitespaces), plate: plate.trimmingCharacters(in: .whitespaces), color: color.trimmingCharacters(in: .whitespaces), nickname: nickname.trimmingCharacters(in: .whitespaces)) { dismiss() } }
                }.padding(.top, 8)
                SecondaryButton(title: index == model.selectedVehicleIndex ? "Shown on Home" : "Show on Home") { model.selectedVehicleIndex = index; model.tab = .home }
                Button(role: .destructive) { confirmRemove = true } label: { Text("Remove vehicle").font(.system(size: 14, weight: .medium)).foregroundStyle(Theme.red).frame(maxWidth: .infinity).padding(.vertical, 14) }
                Text("Mileage is entered by you and recorded again by the shop at check-in. Color sets the paint on your car here.").font(.system(size: 12.5)).foregroundStyle(Theme.dimmer).multilineTextAlignment(.center)
            }.padding(20)
        }
        .background(Theme.bg)
        .navigationTitle(live.title)
        .toolbarTitleDisplayMode(.inline)
        .onAppear { year = live.year.map(String.init) ?? ""; make = live.make ?? ""; vmodel = live.model ?? ""; plate = live.plate ?? ""; color = live.color ?? ""; nickname = live.nickname ?? "" }
        .confirmationDialog("Remove this vehicle?", isPresented: $confirmRemove, titleVisibility: .visible) {
            Button("Remove", role: .destructive) { Task { if await model.removeVehicle(live) { dismiss() } } }
        } message: { Text("Its past visits stay in History. A vehicle with a visit in progress cannot be removed.") }
    }
}
