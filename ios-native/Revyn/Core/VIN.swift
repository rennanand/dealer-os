import Foundation
import SwiftUI
import VisionKit

/// VIN decode through NHTSA vPIC (public, no key). Same fields the web app stores.
struct DecodedVIN: Equatable {
    var vin: String; var year: Int?; var make: String; var model: String; var trim: String; var engine: String; var body: String; var drive: String; var fuel: String
    var summary: String { [year.map(String.init), make, model, trim].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ") + (engine.isEmpty ? "" : " · " + engine) + (drive.isEmpty ? "" : " · " + drive) }
}

enum VIN {
    static func clean(_ s: String) -> String { String(s.uppercased().filter { "ABCDEFGHJKLMNPRSTUVWXYZ0123456789".contains($0) }.prefix(17)) }
    static func isValid(_ s: String) -> Bool { clean(s).count == 17 }
    private static let nice = ["FORD": "Ford", "TOYOTA": "Toyota", "HONDA": "Honda", "CHEVROLET": "Chevrolet", "GMC": "GMC", "RAM": "Ram", "JEEP": "Jeep", "DODGE": "Dodge", "NISSAN": "Nissan", "SUBARU": "Subaru", "TESLA": "Tesla", "BMW": "BMW", "MERCEDES-BENZ": "Mercedes-Benz", "KIA": "Kia", "HYUNDAI": "Hyundai", "MAZDA": "Mazda", "LEXUS": "Lexus", "AUDI": "Audi", "VOLKSWAGEN": "Volkswagen", "ACURA": "Acura", "CADILLAC": "Cadillac", "BUICK": "Buick", "LINCOLN": "Lincoln", "CHRYSLER": "Chrysler", "VOLVO": "Volvo", "PORSCHE": "Porsche", "INFINITI": "Infiniti", "MITSUBISHI": "Mitsubishi", "RIVIAN": "Rivian", "GENESIS": "Genesis", "LAND ROVER": "Land Rover", "JAGUAR": "Jaguar", "MINI": "MINI"]

    static func decode(_ raw: String) async -> DecodedVIN? {
        let v = clean(raw); guard v.count == 17, let url = URL(string: "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/\(v)?format=json") else { return nil }
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let d = (json["Results"] as? [[String: Any]])?.first else { return nil }
        let s = { (k: String) -> String in (d[k] as? String ?? "").trimmingCharacters(in: .whitespaces) }
        guard !s("Make").isEmpty || !s("Model").isEmpty else { return nil }
        let makeRaw = s("Make").uppercased()
        let make = nice[makeRaw] ?? makeRaw.capitalized
        var drive = s("DriveType"); if let slash = drive.firstIndex(of: "/") { drive = String(drive[..<slash]) }
        drive = drive.replacingOccurrences(of: "All-Wheel Drive", with: "AWD").replacingOccurrences(of: "Front-Wheel Drive", with: "FWD").replacingOccurrences(of: "Rear-Wheel Drive", with: "RWD").replacingOccurrences(of: "4x2", with: "2WD")
        var engineParts: [String] = []
        if let l = Double(s("DisplacementL")) { engineParts.append(String(format: "%.1fL", l)) }
        if !s("EngineCylinders").isEmpty { engineParts.append((s("EngineConfiguration").uppercased().contains("V") ? "V" : "I") + s("EngineCylinders")) }
        if let hp = Double(s("EngineHP")) { engineParts.append("\(Int(hp.rounded())) hp") }
        if s("FuelTypePrimary").lowercased().contains("electric") { engineParts.append("Electric") }
        return DecodedVIN(vin: v, year: Int(s("ModelYear")), make: make, model: s("Model"), trim: s("Trim").isEmpty ? s("Series") : s("Trim"), engine: engineParts.joined(separator: " "), body: s("BodyClass"), drive: drive, fuel: s("FuelTypePrimary"))
    }
}

/// Camera scanner: reads the VIN barcode on the door jamb, or the printed VIN on the dash / sticker.
struct VINScanner: UIViewControllerRepresentable {
    var onFound: (String) -> Void
    static var isSupported: Bool { DataScannerViewController.isSupported && DataScannerViewController.isAvailable }

    func makeCoordinator() -> Coordinator { Coordinator(onFound: onFound) }
    func makeUIViewController(context: Context) -> DataScannerViewController {
        let s = DataScannerViewController(recognizedDataTypes: [.barcode(symbologies: [.code39, .code128, .dataMatrix, .qr]), .text(textContentType: nil)], qualityLevel: .accurate, recognizesMultipleItems: true, isHighFrameRateTrackingEnabled: true, isHighlightingEnabled: true)
        s.delegate = context.coordinator
        try? s.startScanning()
        return s
    }
    func updateUIViewController(_ v: DataScannerViewController, context: Context) {}
    static func dismantleUIViewController(_ v: DataScannerViewController, coordinator: Coordinator) { v.stopScanning() }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onFound: (String) -> Void
        private var done = false
        init(onFound: @escaping (String) -> Void) { self.onFound = onFound }
        func dataScanner(_ s: DataScannerViewController, didAdd added: [RecognizedItem], allItems: [RecognizedItem]) { check(allItems) }
        func dataScanner(_ s: DataScannerViewController, didUpdate updated: [RecognizedItem], allItems: [RecognizedItem]) { check(allItems) }
        private func check(_ items: [RecognizedItem]) {
            guard !done else { return }
            for it in items {
                let raw: String
                switch it { case .barcode(let b): raw = b.payloadStringValue ?? ""; case .text(let t): raw = t.transcript; @unknown default: raw = "" }
                // A VIN is 17 characters with no I, O or Q; take the first such run in the text.
                let candidates = raw.uppercased().replacingOccurrences(of: "[^A-Z0-9]", with: " ", options: .regularExpression).split(separator: " ").map(String.init)
                if let v = candidates.first(where: { $0.count == 17 && VIN.isValid($0) }) ?? (VIN.isValid(raw) ? VIN.clean(raw) : nil) {
                    done = true; Haptic.success(); onFound(v); return
                }
            }
        }
    }
}

struct VINScanSheet: View {
    @Environment(\.dismiss) private var dismiss
    var onFound: (String) -> Void
    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                if VINScanner.isSupported { VINScanner { v in onFound(v); dismiss() }.ignoresSafeArea() }
                else { Text("Scanning needs a camera. Type the VIN instead.").foregroundStyle(Theme.dim).padding() }
                Text("Point at the VIN on the door jamb sticker, the dash plate, or the barcode.").font(.system(size: 13)).foregroundStyle(.white).padding(14).background(.black.opacity(0.6), in: RoundedRectangle(cornerRadius: 14, style: .continuous)).padding(20)
            }
            .navigationTitle("Scan VIN").toolbarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }
}
