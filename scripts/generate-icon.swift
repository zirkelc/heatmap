// Draws the app icon and the splash image: a dot matrix on a dark background, where the
// dots along a walk grow and change color with the heat.
// Usage: swiftc -O scripts/generate-icon.swift -o /tmp/generate-icon && /tmp/generate-icon assets
// Writes icon.png (1024x1024, no alpha) and splash-icon.png (1024x1024, transparent margin).

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let size = 1024
let outputDirectory = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets"

struct RGB { var r: Double; var g: Double; var b: Double }
typealias Point = (Double, Double)

func hex(_ value: UInt32) -> RGB {
  RGB(r: Double((value >> 16) & 0xFF) / 255, g: Double((value >> 8) & 0xFF) / 255, b: Double(value & 0xFF) / 255)
}
func clamp(_ x: Double) -> Double { max(0, min(1, x)) }
func mix(_ a: RGB, _ b: RGB, _ t: Double) -> RGB {
  let t = clamp(t)
  return RGB(r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t)
}
func smoothstep(_ e0: Double, _ e1: Double, _ x: Double) -> Double {
  let t = clamp((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}
func gauss(_ p: Point, _ c: Point, _ sigma: Double) -> Double {
  let dx = p.0 - c.0, dy = p.1 - c.1
  return exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
}

let background = hex(0x101722)
let coldDot = hex(0x2A3647)

// Same gradient as the heatmap in the app
let gradient: [(Double, RGB)] = [
  (0.00, hex(0x79BC6A)),
  (0.25, hex(0xBBCF4C)),
  (0.50, hex(0xEEC20B)),
  (0.75, hex(0xF29305)),
  (1.00, hex(0xE50000)),
]

func heatColor(_ value: Double) -> RGB {
  for i in 0..<(gradient.count - 1) where value <= gradient[i + 1].0 {
    let (p0, c0) = gradient[i]
    let (p1, c1) = gradient[i + 1]
    return mix(c0, c1, (value - p0) / (p1 - p0))
  }
  return gradient.last!.1
}

/// Samples a smooth Catmull-Rom curve through the control points
func curve(_ points: [Point], _ steps: Int) -> [Point] {
  var result: [Point] = []
  for i in 0..<(points.count - 1) {
    let p0 = points[max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[min(points.count - 1, i + 2)]
    for s in 0..<steps {
      let t = Double(s) / Double(steps), t2 = t * t, t3 = t2 * t
      func c(_ a: Double, _ b: Double, _ c: Double, _ d: Double) -> Double {
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      }
      result.append((c(p0.0, p1.0, p2.0, p3.0), c(p0.1, p1.1, p2.1, p3.1)))
    }
  }
  result.append(points.last!)
  return result
}

// A walk from bottom left to top right, with one place where it stays longer
let walk = curve([(0.12, 0.88), (0.25, 0.70), (0.45, 0.56), (0.58, 0.47), (0.72, 0.30), (0.88, 0.14)], 20)
let hotSpot: Point = (0.52, 0.51)

let gridSize = 9.0

/// Color of the artwork at a point in unit coordinates (0...1)
func artwork(_ p: Point) -> RGB {
  let cell = 1 / gridSize
  let center: Point = ((floor(p.0 / cell) + 0.5) * cell, (floor(p.1 / cell) + 0.5) * cell)
  var field = gauss(center, hotSpot, 0.09) * 1.2
  for q in walk { field += gauss(center, q, 0.07) * 0.06 }
  let heat = clamp(field / 1.6)

  let radius = cell * (0.14 + 0.32 * smoothstep(0, 0.7, heat))
  let dx = p.0 - center.0, dy = p.1 - center.1
  let distance = (dx * dx + dy * dy).squareRoot() - radius
  let dotColor = heat < 0.08 ? coldDot : heatColor(clamp((heat - 0.08) / 0.75))
  // Anti-aliased edge of about one pixel
  return mix(background, dotColor, clamp(0.5 - distance * Double(size)))
}

func render(transparentMargin: Double) -> CGImage {
  var pixels = [UInt8](repeating: 0, count: size * size * 4)
  let inner = Double(size) * (1 - 2 * transparentMargin)
  let offset = Double(size) * transparentMargin
  let cornerRadius = inner * 0.2237

  pixels.withUnsafeMutableBufferPointer { buffer in
    DispatchQueue.concurrentPerform(iterations: size) { y in
      for x in 0..<size {
        let px = Double(x) + 0.5 - offset, py = Double(y) + 0.5 - offset
        var alpha = 1.0
        if transparentMargin > 0 {
          // Rounded square mask with a soft edge
          let qx = max(cornerRadius - px, 0, px - (inner - cornerRadius))
          let qy = max(cornerRadius - py, 0, py - (inner - cornerRadius))
          alpha = clamp(0.5 - ((qx * qx + qy * qy).squareRoot() - cornerRadius))
          if px < 0 || py < 0 || px > inner || py > inner { alpha = 0 }
        }
        if alpha == 0 { continue }

        // 2x2 supersampling
        var c = RGB(r: 0, g: 0, b: 0)
        for sy in [0.25, 0.75] {
          for sx in [0.25, 0.75] {
            let sample = artwork(((px - 0.5 + sx) / inner, (py - 0.5 + sy) / inner))
            c.r += sample.r / 4; c.g += sample.g / 4; c.b += sample.b / 4
          }
        }

        let index = (y * size + x) * 4
        buffer[index] = UInt8(clamp(c.r * alpha) * 255)
        buffer[index + 1] = UInt8(clamp(c.g * alpha) * 255)
        buffer[index + 2] = UInt8(clamp(c.b * alpha) * 255)
        buffer[index + 3] = UInt8(alpha * 255)
      }
    }
  }

  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  let info: UInt32 = transparentMargin > 0
    ? CGImageAlphaInfo.premultipliedLast.rawValue
    : CGImageAlphaInfo.noneSkipLast.rawValue
  let context = CGContext(
    data: &pixels, width: size, height: size, bitsPerComponent: 8, bytesPerRow: size * 4,
    space: space, bitmapInfo: info)!
  return context.makeImage()!
}

func write(_ image: CGImage, to name: String) {
  let url = URL(fileURLWithPath: outputDirectory).appendingPathComponent(name)
  let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(destination, image, nil)
  CGImageDestinationFinalize(destination)
  print("Wrote \(url.path)")
}

write(render(transparentMargin: 0), to: "icon.png")
write(render(transparentMargin: 0.3), to: "splash-icon.png")
