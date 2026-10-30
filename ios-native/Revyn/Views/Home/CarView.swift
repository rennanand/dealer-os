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

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> SCNView {
        let v = SCNView()
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
        context.coordinator.view = v
        context.coordinator.apply(paint: UIColor(paint), angle: angle, animated: false)
        context.coordinator.autoRotate = autoRotate
        context.coordinator.startSpin()
        return v
    }

    func updateUIView(_ v: SCNView, context: Context) {
        context.coordinator.autoRotate = autoRotate
        context.coordinator.apply(paint: UIColor(paint), angle: angle, animated: true)
    }

    static func dismantleUIView(_ v: SCNView, coordinator: Coordinator) { coordinator.stop() }

    final class Coordinator: NSObject {
        let scene = SCNScene()
        let pivot = SCNNode()          // yaw
        let cameraNode = SCNNode()
        weak var view: SCNView?
        var autoRotate = true
        private var paintMats: [SCNMaterial] = []
        private var yaw: Float = 0.75, targetYaw: Float = 0.75
        private var dragging = false
        private var link: CADisplayLink?
        private var lastPaint: UIColor?
        private var lastAngle: CarView.Angle?

        override init() {
            super.init()
            build()
        }

        private func build() {
            scene.background.contents = UIColor.clear
            scene.lightingEnvironment.contents = Coordinator.studioEnvironment()
            scene.lightingEnvironment.intensity = 1.6

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
            pivot.addChildNode(car)
            scene.rootNode.addChildNode(pivot)

            // Ground shadow catcher.
            let floor = SCNFloor(); floor.reflectivity = 0.06; floor.reflectionFalloffEnd = 3
            let fm = SCNMaterial(); fm.lightingModel = .shadowOnly; fm.writesToDepthBuffer = false
            floor.firstMaterial = fm
            let floorNode = SCNNode(geometry: floor); floorNode.position.y = 0.005
            scene.rootNode.addChildNode(floorNode)

            let key = SCNLight(); key.type = .directional; key.intensity = 900; key.castsShadow = true; key.shadowRadius = 8; key.shadowSampleCount = 8; key.shadowColor = UIColor(white: 0, alpha: 0.6); key.shadowMode = .deferred
            let keyNode = SCNNode(); keyNode.light = key; keyNode.eulerAngles = SCNVector3(-1.05, 0.6, 0)
            scene.rootNode.addChildNode(keyNode)
            let rim = SCNLight(); rim.type = .directional; rim.intensity = 500; rim.color = UIColor(red: 0.87, green: 0.91, blue: 1, alpha: 1)
            let rimNode = SCNNode(); rimNode.light = rim; rimNode.eulerAngles = SCNVector3(-0.7, 2.6, 0)
            scene.rootNode.addChildNode(rimNode)
            let amb = SCNLight(); amb.type = .ambient; amb.intensity = 120
            let ambNode = SCNNode(); ambNode.light = amb; scene.rootNode.addChildNode(ambNode)

            let cam = SCNCamera(); cam.fieldOfView = 26; cam.wantsHDR = true; cam.exposureOffset = -0.2; cam.averageGray = 0.18; cam.whitePoint = 1.0; cam.bloomIntensity = 0.35; cam.bloomThreshold = 0.9; cam.bloomBlurRadius = 12
            cameraNode.camera = cam
            scene.rootNode.addChildNode(cameraNode)
        }

        private func applyMaterials(to node: SCNNode) {
            node.enumerateChildNodes { n, _ in
                guard let g = n.geometry else { return }
                let name = ((n.name ?? "") + " " + (g.name ?? "") + " " + (g.firstMaterial?.name ?? "")).lowercased()
                let m = SCNMaterial(); m.lightingModel = .physicallyBased
                switch name {
                case let s where s.contains("glass"):
                    m.diffuse.contents = UIColor(red: 0.09, green: 0.13, blue: 0.17, alpha: 1); m.metalness.contents = 0.9; m.roughness.contents = 0.08; m.transparency = 0.9
                case let s where s.contains("chrome"):
                    m.diffuse.contents = UIColor(white: 0.95, alpha: 1); m.metalness.contents = 1.0; m.roughness.contents = 0.1
                case let s where s.contains("rubber"):
                    m.diffuse.contents = UIColor(white: 0.08, alpha: 1); m.metalness.contents = 0; m.roughness.contents = 0.95
                case let s where s.contains("satin"):
                    m.diffuse.contents = UIColor(white: 0.07, alpha: 1); m.metalness.contents = 0.3; m.roughness.contents = 0.6
                case let s where s.contains("underbody"):
                    m.diffuse.contents = UIColor(white: 0.04, alpha: 1); m.metalness.contents = 0.1; m.roughness.contents = 0.9
                case let s where s.contains("interior"):
                    m.diffuse.contents = UIColor(red: 0.1, green: 0.09, blue: 0.07, alpha: 1); m.roughness.contents = 0.9
                case let s where s.contains("headlamp"):
                    m.diffuse.contents = UIColor(red: 1, green: 0.95, blue: 0.8, alpha: 1); m.emission.contents = UIColor(red: 1, green: 0.76, blue: 0.29, alpha: 1); m.emission.intensity = 2.0; m.roughness.contents = 0.15
                case let s where s.contains("taillamp"):
                    m.diffuse.contents = UIColor(red: 1, green: 0.23, blue: 0.16, alpha: 1); m.emission.contents = UIColor(red: 1, green: 0.09, blue: 0.03, alpha: 1); m.emission.intensity = 2.6; m.roughness.contents = 0.25
                case let s where s.contains("amber"):
                    m.diffuse.contents = UIColor(red: 0.85, green: 0.52, blue: 0.16, alpha: 1); m.emission.contents = UIColor(red: 0.85, green: 0.52, blue: 0.16, alpha: 1); m.emission.intensity = 0.5
                default:
                    m.diffuse.contents = UIColor(red: 0.73, green: 0.74, blue: 0.76, alpha: 1); m.metalness.contents = 0.85; m.roughness.contents = 0.12; m.clearCoat.contents = 1.0; m.clearCoatRoughness.contents = 0.05
                    paintMats.append(m)
                }
                g.materials = [m]
            }
        }

        /// A dark studio with bright light panels, so chrome and clear coat have something to reflect.
        static func studioEnvironment() -> UIImage {
            let size = CGSize(width: 512, height: 256)
            let r = UIGraphicsImageRenderer(size: size)
            return r.image { ctx in
                UIColor(white: 0.07, alpha: 1).setFill(); ctx.fill(CGRect(origin: .zero, size: size))
                // Ceiling softbox band + two side panels; brighter above the horizon.
                UIColor(white: 0.95, alpha: 1).setFill(); ctx.fill(CGRect(x: 0, y: 20, width: 512, height: 36))
                UIColor(white: 0.5, alpha: 1).setFill(); ctx.fill(CGRect(x: 60, y: 90, width: 120, height: 50)); ctx.fill(CGRect(x: 330, y: 90, width: 120, height: 50))
                UIColor(white: 0.12, alpha: 1).setFill(); ctx.fill(CGRect(x: 0, y: 128, width: 512, height: 128))
                UIColor(white: 0.3, alpha: 1).setFill(); ctx.fill(CGRect(x: 0, y: 150, width: 512, height: 10))
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
                let (y, h, d): (Float, Float, Float) = switch angle {
                case .orbit: (0.75, 2.2, 7.6)
                case .rear: (2.55, 2.0, 7.4)
                case .side: (1.57, 1.5, 7.2)
                case .front: (0.25, 1.6, 7.0)
                }
                targetYaw = y
                SCNTransaction.begin(); SCNTransaction.animationDuration = animated ? 0.9 : 0
                SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
                cameraNode.position = SCNVector3(0, h, d)
                cameraNode.look(at: SCNVector3(0, 0.62, 0))
                SCNTransaction.commit()
            }
            view?.setNeedsDisplay()
        }

        func startSpin() {
            link?.invalidate()
            link = CADisplayLink(target: self, selector: #selector(tick))
            link?.preferredFrameRateRange = CAFrameRateRange(minimum: 15, maximum: 30, preferred: 30)
            link?.add(to: .main, forMode: .common)
        }
        func stop() { link?.invalidate(); link = nil }

        @objc private func tick() {
            guard let v = view, v.window != nil else { return }
            if !dragging {
                if autoRotate { targetYaw += 0.0025 }
                yaw += (targetYaw - yaw) * 0.08
            }
            pivot.eulerAngles.y = yaw
            v.setNeedsDisplay()
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
