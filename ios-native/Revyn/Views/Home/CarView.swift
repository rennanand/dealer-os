import SwiftUI
import SceneKit
import SceneKit.ModelIO
import ModelIO

/// The customer's car, rendered natively with SceneKit on Metal. Paint follows the color they
/// entered; head and tail lamps glow; the car turns slowly and can be dragged.
struct CarView: UIViewRepresentable {
    enum Angle { case orbit, rear, side, front }
    var paint: Color
    var angle: Angle = .orbit
    var autoRotate = true

    func makeCoordinator() -> Coordinator { Coordinator.shared }

    func makeUIView(context: Context) -> SCNView {
        let v = CarSCNView()
        v.backgroundColor = .clear
        v.antialiasingMode = .multisampling2X
        v.preferredFramesPerSecond = 30
        v.isJitteringEnabled = false
        v.rendersContinuously = false
        v.scene = context.coordinator.scene
        v.pointOfView = context.coordinator.cameraNode
        v.allowsCameraControl = false
        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.pan(_:)))
        v.addGestureRecognizer(pan)
        context.coordinator.views.add(v)
        let c = context.coordinator, p = UIColor(paint), a = angle, auto = autoRotate
        v.onAttach = { c.autoRotate = auto; c.apply(paint: p, angle: a, animated: c.lastAngle != nil) }   // each time this screen comes back, the camera flies to its angle
        context.coordinator.apply(paint: UIColor(paint), angle: angle, animated: context.coordinator.lastAngle != nil)
        context.coordinator.autoRotate = autoRotate
        context.coordinator.startSpin()
        return v
    }

    func updateUIView(_ v: SCNView, context: Context) {
        let c = context.coordinator, p = UIColor(paint), a = angle, auto = autoRotate
        (v as? CarSCNView)?.onAttach = { c.autoRotate = auto; c.apply(paint: p, angle: a, animated: true) }
        if v.window != nil { c.autoRotate = auto; c.apply(paint: p, angle: a, animated: true) }
    }

    static func dismantleUIView(_ v: SCNView, coordinator: Coordinator) { coordinator.views.remove(v) }

    final class Coordinator: NSObject {
        static let shared = Coordinator()
        let scene = SCNScene()
        let pivot = SCNNode()          // yaw
        let cameraNode = SCNNode()
        let views = NSHashTable<SCNView>.weakObjects()
        var autoRotate = true
        private var paintMats: [SCNMaterial] = []
        private var yaw: Float = 0.75, targetYaw: Float = 0.75
        private var dragging = false
        private var link: CADisplayLink?
        private var lastPaint: UIColor?
        var lastAngle: CarView.Angle?
        private var radius: Float = 3.0

        override init() {
            super.init()
            build()
        }

        private func build() {
            scene.background.contents = UIColor.clear
            scene.lightingEnvironment.contents = Coordinator.studioEnvironment()
            scene.lightingEnvironment.intensity = 0.9

            guard let url = Bundle.main.url(forResource: "hardtop", withExtension: "obj") else { return }
            let asset = MDLAsset(url: url)
            asset.loadTextures()
            let carScene = SCNScene(mdlAsset: asset)
            let car = SCNNode()
            for child in carScene.rootNode.childNodes { car.addChildNode(child) }
            // Center on the body and sit the tires on y = 0.
            let (minB, maxB) = car.boundingBox
            car.position = SCNVector3(-(minB.x + maxB.x) / 2, -minB.y, -(minB.z + maxB.z) / 2)
            applyMaterials(to: car)
            let dx = maxB.x - minB.x, dy = maxB.y - minB.y, dz = maxB.z - minB.z
            radius = 0.5 * (dx * dx + dy * dy + dz * dz).squareRoot()
            pivot.addChildNode(car)
            scene.rootNode.addChildNode(pivot)

            // Ground shadow catcher.
            let floor = SCNFloor(); floor.reflectivity = 0.03; floor.reflectionFalloffEnd = 3
            let fm = SCNMaterial(); fm.lightingModel = .shadowOnly; fm.writesToDepthBuffer = false
            floor.firstMaterial = fm
            let floorNode = SCNNode(geometry: floor); floorNode.position.y = 0.005
            scene.rootNode.addChildNode(floorNode)

            let key = SCNLight(); key.type = .directional; key.intensity = 450; key.castsShadow = true; key.shadowRadius = 8; key.shadowSampleCount = 8; key.shadowColor = UIColor(white: 0, alpha: 0.6); key.shadowMode = .deferred
            let keyNode = SCNNode(); keyNode.light = key; keyNode.eulerAngles = SCNVector3(-1.05, 0.6, 0)
            scene.rootNode.addChildNode(keyNode)
            let rim = SCNLight(); rim.type = .directional; rim.intensity = 260; rim.color = UIColor(red: 0.87, green: 0.91, blue: 1, alpha: 1)
            let rimNode = SCNNode(); rimNode.light = rim; rimNode.eulerAngles = SCNVector3(-0.7, 2.6, 0)
            scene.rootNode.addChildNode(rimNode)
            let amb = SCNLight(); amb.type = .ambient; amb.intensity = 60
            let ambNode = SCNNode(); ambNode.light = amb; scene.rootNode.addChildNode(ambNode)

            let cam = SCNCamera(); cam.fieldOfView = 26; cam.wantsHDR = true; cam.wantsExposureAdaptation = false; cam.exposureOffset = -1.6; cam.averageGray = 0.18; cam.whitePoint = 1.0; cam.bloomIntensity = 0.25; cam.bloomThreshold = 0.95; cam.bloomBlurRadius = 10
            cameraNode.camera = cam
            scene.rootNode.addChildNode(cameraNode)
        }

        private func applyMaterials(to node: SCNNode) {
            node.enumerateChildNodes { n, _ in
                guard let g = n.geometry else { return }
                // ModelIO keeps one geometry with a material slot per `usemtl` group; replace each slot by its name.
                let slots = g.materials.isEmpty ? [SCNMaterial()] : g.materials
                g.materials = slots.map { old in self.material(named: ((old.name ?? "") + " " + (n.name ?? "") + " " + (g.name ?? "")).lowercased()) }
            }
        }

        private func material(named name: String) -> SCNMaterial {
            let m = SCNMaterial(); m.lightingModel = .physicallyBased
            if name.contains("glass") {
                m.diffuse.contents = UIColor(red: 0.09, green: 0.13, blue: 0.17, alpha: 1); m.metalness.contents = 0.9; m.roughness.contents = 0.08; m.transparency = 0.9
            } else if name.contains("chrome") {
                m.diffuse.contents = UIColor(white: 0.85, alpha: 1); m.metalness.contents = 1.0; m.roughness.contents = 0.12
            } else if name.contains("rubber") {
                m.diffuse.contents = UIColor(white: 0.08, alpha: 1); m.metalness.contents = 0; m.roughness.contents = 0.95
            } else if name.contains("satin") {
                m.diffuse.contents = UIColor(white: 0.07, alpha: 1); m.metalness.contents = 0.3; m.roughness.contents = 0.6
            } else if name.contains("underbody") {
                m.diffuse.contents = UIColor(white: 0.04, alpha: 1); m.metalness.contents = 0.1; m.roughness.contents = 0.9
            } else if name.contains("interior") {
                m.diffuse.contents = UIColor(red: 0.1, green: 0.09, blue: 0.07, alpha: 1); m.roughness.contents = 0.9
            } else if name.contains("headlamp") {
                m.diffuse.contents = UIColor(red: 1, green: 0.95, blue: 0.8, alpha: 1); m.emission.contents = UIColor(red: 1, green: 0.76, blue: 0.29, alpha: 1); m.emission.intensity = 2.0; m.roughness.contents = 0.15
            } else if name.contains("taillamp") {
                m.diffuse.contents = UIColor(red: 1, green: 0.23, blue: 0.16, alpha: 1); m.emission.contents = UIColor(red: 1, green: 0.09, blue: 0.03, alpha: 1); m.emission.intensity = 2.6; m.roughness.contents = 0.25
            } else if name.contains("amber") {
                m.diffuse.contents = UIColor(red: 0.85, green: 0.52, blue: 0.16, alpha: 1); m.emission.contents = UIColor(red: 0.85, green: 0.52, blue: 0.16, alpha: 1); m.emission.intensity = 0.5
            } else {
                m.diffuse.contents = lastPaint ?? UIColor(red: 0.52, green: 0.54, blue: 0.58, alpha: 1); m.metalness.contents = 0.8; m.roughness.contents = 0.18; m.clearCoat.contents = 1.0; m.clearCoatRoughness.contents = 0.05
                paintMats.append(m)
            }
            return m
        }

        /// A dark studio with bright light panels, so chrome and clear coat have something to reflect.
        static func studioEnvironment() -> UIImage {
            let size = CGSize(width: 512, height: 256)
            let r = UIGraphicsImageRenderer(size: size)
            return r.image { ctx in
                UIColor(white: 0.07, alpha: 1).setFill(); ctx.fill(CGRect(origin: .zero, size: size))
                // Ceiling softbox band + two side panels; brighter above the horizon.
                UIColor(white: 0.8, alpha: 1).setFill(); ctx.fill(CGRect(x: 60, y: 24, width: 392, height: 30))
                UIColor(white: 0.3, alpha: 1).setFill(); ctx.fill(CGRect(x: 60, y: 90, width: 120, height: 40)); ctx.fill(CGRect(x: 330, y: 90, width: 120, height: 40))
                UIColor(white: 0.12, alpha: 1).setFill(); ctx.fill(CGRect(x: 0, y: 128, width: 512, height: 128))
                UIColor(white: 0.18, alpha: 1).setFill(); ctx.fill(CGRect(x: 0, y: 150, width: 512, height: 8))
            }
        }

        func apply(paint: UIColor, angle: CarView.Angle, animated: Bool) {
            if lastPaint != paint {
                lastPaint = paint
                SCNTransaction.begin(); SCNTransaction.animationDuration = animated ? 0.8 : 0
                paintMats.forEach { $0.diffuse.contents = paint }
                SCNTransaction.commit()
            }
            if lastAngle != angle {
                lastAngle = angle
                // Distance from the bounding sphere and the camera's field of view, so any model fits.
                let fov = Float((cameraNode.camera?.fieldOfView ?? 26) * .pi / 180)
                let fit = radius / sin(fov / 2) * 0.62
                let (y, h, d): (Float, Float, Float) = switch angle {
                case .orbit: (0.75, fit * 0.3, fit)
                case .rear: (2.55, fit * 0.27, fit * 0.97)
                case .side: (1.57, fit * 0.2, fit * 0.95)
                case .front: (0.25, fit * 0.22, fit * 0.92)
                }
                targetYaw = y; if animated && abs(targetYaw - yaw) < 0.3 { targetYaw += 0.6 }
                SCNTransaction.begin(); SCNTransaction.animationDuration = animated ? 1.1 : 0
                SCNTransaction.animationTimingFunction = CAMediaTimingFunction(controlPoints: 0.2, 0.8, 0.2, 1)
                cameraNode.position = SCNVector3(0, h, d)
                cameraNode.look(at: SCNVector3(0, 0.62, 0))
                SCNTransaction.commit()
            }
            redraw()
        }

        private func redraw() { for v in views.allObjects where v.window != nil { v.setNeedsDisplay() } }

        func startSpin() {
            link?.invalidate()
            link = CADisplayLink(target: self, selector: #selector(tick))
            link?.preferredFrameRateRange = CAFrameRateRange(minimum: 15, maximum: 30, preferred: 30)
            link?.add(to: .main, forMode: .common)
        }
        func stop() { link?.invalidate(); link = nil }

        @objc private func tick() {
            guard views.allObjects.contains(where: { $0.window != nil }) else { return }
            if !dragging {
                if autoRotate { targetYaw += 0.0025 }
                yaw += (targetYaw - yaw) * 0.08
            }
            pivot.eulerAngles.y = yaw
            redraw()
        }

        @objc func pan(_ g: UIPanGestureRecognizer) {
            switch g.state {
            case .began: dragging = true
            case .changed:
                let dx = Float(g.translation(in: g.view).x); g.setTranslation(.zero, in: g.view)
                yaw += dx * 0.008; targetYaw = yaw
            default: dragging = false
            }
        }
    }
}

/// An SCNView that tells the shared scene when it comes on screen.
final class CarSCNView: SCNView {
    var onAttach: (() -> Void)?
    override func didMoveToWindow() { super.didMoveToWindow(); if window != nil { onAttach?() } }
}
