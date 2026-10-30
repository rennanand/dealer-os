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
                        Button { model.selectedVehicleIndex = i; model.tab = .home } label: {
                            Card {
                                HStack(spacing: 14) {
                                    Circle().fill(Theme.paint(for: v)).frame(width: 14, height: 14).overlay(Circle().stroke(.white.opacity(0.15)))
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(v.title).font(.system(size: 19, weight: .semibold))
                                        Text(v.subtitle).font(.system(size: 13.5)).foregroundStyle(Theme.dim)
                                        if let n = v.visits, n > 0 { Text("\(n) visit\(n == 1 ? "" : "s") recorded").font(.system(size: 12.5)).foregroundStyle(Theme.dimmer) }
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
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 10) {
                    HStack(spacing: 10) {
                        TextField("Year", text: $year).keyboardType(.numberPad).field().frame(width: 110)
                        TextField("Make · Toyota", text: $make).textInputAutocapitalization(.words).field()
                    }
                    TextField("Model · 4Runner", text: $vmodel).textInputAutocapitalization(.words).field()
                    TextField("Plate (optional)", text: $plate).textInputAutocapitalization(.characters).autocorrectionDisabled().field()
                    TextField("Mileage (optional)", text: $odometer).keyboardType(.numberPad).field()
                    Text("Mileage is entered by you and recorded again by the shop at check-in. The app has no connection to the car.").font(.system(size: 12.5)).foregroundStyle(Theme.dimmer).frame(maxWidth: .infinity, alignment: .leading).padding(.top, 4)
                    PrimaryButton(title: "Add vehicle", enabled: !make.trimmingCharacters(in: .whitespaces).isEmpty && !vmodel.trimmingCharacters(in: .whitespaces).isEmpty, busy: model.busy) {
                        Task { if await model.addVehicle(year: Int(year), make: make.trimmingCharacters(in: .whitespaces), model: vmodel.trimmingCharacters(in: .whitespaces), plate: plate.trimmingCharacters(in: .whitespaces), odometer: Int(odometer.digits)) { dismiss() } }
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
