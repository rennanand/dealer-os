import SwiftUI
import UIKit

/// Mark up an inspection photo before it goes to the customer: circle, arrow or pen, in red.
/// The drawing is flattened into the JPEG so it shows everywhere the photo does.
struct MarkupView: View {
    var image: UIImage
    var onDone: (UIImage) -> Void
    var onCancel: () -> Void
    enum Tool: String, CaseIterable { case circle = "Circle", arrow = "Arrow", pen = "Pen" }
    struct Shape: Identifiable { let id = UUID(); var tool: Tool; var points: [CGPoint] }   // normalized 0…1
    @State private var tool: Tool = .circle
    @State private var shapes: [Shape] = []
    @State private var current: Shape?

    var body: some View {
        VStack(spacing: 14) {
            HStack(spacing: 8) {
                ForEach(Tool.allCases, id: \.self) { t in
                    Button { tool = t } label: { Text(t.rawValue).font(.system(size: 14, weight: .medium)).padding(.horizontal, 14).padding(.vertical, 9).background(tool == t ? Color.white : Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 10, style: .continuous)).foregroundStyle(tool == t ? .black : .white) }.buttonStyle(.plain)
                }
                Button("Undo") { _ = shapes.popLast() }.font(.system(size: 14)).foregroundStyle(Theme.dim).padding(.horizontal, 8)
                Spacer()
            }
            GeometryReader { geo in
                let size = fitted(in: geo.size)
                ZStack {
                    Image(uiImage: image).resizable().scaledToFit()
                    Canvas { ctx, sz in draw(in: ctx, size: sz, shapes: shapes + (current.map { [$0] } ?? [])) }
                        .gesture(DragGesture(minimumDistance: 0)
                            .onChanged { v in
                                let p = CGPoint(x: v.location.x / size.width, y: v.location.y / size.height)
                                if current == nil { current = Shape(tool: tool, points: [p, p]) }
                                else if tool == .pen { current!.points.append(p) } else { current!.points[1] = p }
                            }
                            .onEnded { _ in if let c = current { shapes.append(c) }; current = nil })
                }
                .frame(width: size.width, height: size.height)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            HStack(spacing: 8) {
                PrimaryButton(title: shapes.isEmpty ? "Use photo" : "Use marked-up photo") { onDone(render()) }
                SecondaryButton(title: "Cancel") { onCancel() }.frame(width: 140)
            }
        }
        .padding(20)
        .background(Theme.bg)
    }

    private func fitted(in box: CGSize) -> CGSize {
        let k = min(box.width / image.size.width, box.height / image.size.height)
        return CGSize(width: image.size.width * k, height: image.size.height * k)
    }

    private func draw(in ctx: GraphicsContext, size: CGSize, shapes: [Shape]) {
        let w = max(4, size.width / 160)
        for s in shapes {
            let pts = s.points.map { CGPoint(x: $0.x * size.width, y: $0.y * size.height) }
            guard let a = pts.first, let b = pts.last else { continue }
            var path = Path()
            switch s.tool {
            case .pen: path.move(to: a); for p in pts.dropFirst() { path.addLine(to: p) }
            case .circle: path.addEllipse(in: CGRect(x: min(a.x, b.x), y: min(a.y, b.y), width: max(12, abs(b.x - a.x)), height: max(12, abs(b.y - a.y))))
            case .arrow:
                path.move(to: a); path.addLine(to: b)
                let ang = atan2(b.y - a.y, b.x - a.x), h = w * 4
                path.move(to: b); path.addLine(to: CGPoint(x: b.x - h * cos(ang - 0.5), y: b.y - h * sin(ang - 0.5)))
                path.move(to: b); path.addLine(to: CGPoint(x: b.x - h * cos(ang + 0.5), y: b.y - h * sin(ang + 0.5)))
            }
            ctx.stroke(path, with: .color(Theme.red), style: StrokeStyle(lineWidth: w, lineCap: .round, lineJoin: .round))
        }
    }

    /// Flatten the strokes into the photo at the photo's own size (capped at 1600px on the long side).
    private func render() -> UIImage {
        let k = min(1, 1600 / max(image.size.width, image.size.height))
        let size = CGSize(width: image.size.width * k, height: image.size.height * k)
        let r = UIGraphicsImageRenderer(size: size)
        return r.image { g in
            image.draw(in: CGRect(origin: .zero, size: size))
            let w = max(4, size.width / 160)
            UIColor(Theme.red).setStroke()
            for s in shapes {
                let pts = s.points.map { CGPoint(x: $0.x * size.width, y: $0.y * size.height) }
                guard let a = pts.first, let b = pts.last else { continue }
                let p = UIBezierPath(); p.lineWidth = w; p.lineCapStyle = .round; p.lineJoinStyle = .round
                switch s.tool {
                case .pen: p.move(to: a); for q in pts.dropFirst() { p.addLine(to: q) }
                case .circle: p.append(UIBezierPath(ovalIn: CGRect(x: min(a.x, b.x), y: min(a.y, b.y), width: max(12, abs(b.x - a.x)), height: max(12, abs(b.y - a.y)))))
                case .arrow:
                    p.move(to: a); p.addLine(to: b)
                    let ang = atan2(b.y - a.y, b.x - a.x), h = w * 4
                    p.move(to: b); p.addLine(to: CGPoint(x: b.x - h * cos(ang - 0.5), y: b.y - h * sin(ang - 0.5)))
                    p.move(to: b); p.addLine(to: CGPoint(x: b.x - h * cos(ang + 0.5), y: b.y - h * sin(ang + 0.5)))
                }
                p.stroke()
            }
        }
    }
}
