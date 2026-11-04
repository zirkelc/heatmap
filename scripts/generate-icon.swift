// Draws the app icon and the splash image.
// Usage: swift scripts/generate-icon.swift <output directory>
// Writes icon.png (1024x1024, no alpha) and splash-icon.png (1024x1024, transparent margin).

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let size = 1024
let outputDirectory = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets"

struct RGB { var r: Double; var g: Double; var b: Double }

func hex(_ value: UInt32) -> RGB {
  RGB(r: Double((value >> 16) & 0xFF) / 255, g: Double((value >> 8) & 0xFF) / 255, b: Double(value & 0xFF) / 255)
}

let background = hex(0x0E1A2B)
let street = hex(0x1C3048)
let mainStreet = hex(0x24405F)
let river = hex(0x15314F)

// Same gradient as the heatmap in the app
let gradient: [(Double, RGB)] = [
  (0.00, hex(0x79BC6A)),
  (0.25, hex(0xBBCF4C)),
  (0.50, hex(0xEEC20B)),
  (0.75, hex(0xF29305)),
  (1.00, hex(0xE50000)),
]

func color(at value: Double) -> RGB {
  for i in 0..<(gradient.count - 1) {
    let (p0, c0) = gradient[i]
    let (p1, c1) = gradient[i + 1]
    if value <= p1 {
      let t = max(0, (value - p0) / (p1 - p0))
      return RGB(r: c0.r + (c1.r - c0.r) * t, g: c0.g + (c1.g - c0.g) * t, b: c0.b + (c1.b - c0.b) * t)
    }
  }
  return gradient.last!.1
}

func mix(_ a: RGB, _ b: RGB, _ t: Double) -> RGB {
  RGB(r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t)
}

/// Distance from point p to the segment a-b
func distance(_ p: (Double, Double), _ a: (Double, Double), _ b: (Double, Double)) -> Double {
  let dx = b.0 - a.0, dy = b.1 - a.1
  let t = max(0, min(1, ((p.0 - a.0) * dx + (p.1 - a.1) * dy) / (dx * dx + dy * dy)))
  let x = a.0 + t * dx - p.0, y = a.1 + t * dy - p.1
  return (x * x + y * y).squareRoot()
}

// Streets in unit coordinates (0...1), with a line width in pixels
let streets: [((Double, Double), (Double, Double), Double, RGB)] = [
  ((-0.1, 0.30), (1.1, 0.22), 22, mainStreet),
  ((-0.1, 0.74), (1.1, 0.80), 22, mainStreet),
  ((0.28, -0.1), (0.20, 1.1), 22, mainStreet),
  ((0.70, -0.1), (0.78, 1.1), 22, mainStreet),
  ((-0.1, 0.52), (1.1, 0.50), 10, street),
  ((0.49, -0.1), (0.50, 1.1), 10, street),
  ((-0.1, 0.10), (0.6, -0.1), 10, street),
  ((0.05, 1.1), (1.1, 0.05), 10, street),
  ((-0.1, 0.92), (1.1, 0.96), 10, street),
  ((0.92, -0.1), (0.95, 1.1), 10, street),
  ((0.07, -0.1), (0.04, 1.1), 10, street),
]

// River as a polyline
let riverLine: [(Double, Double)] = [(-0.1, 0.62), (0.2, 0.66), (0.45, 0.60), (0.7, 0.68), (1.1, 0.64)]

// Heat: a walk from bottom left to top right, with two places where it stays longer
let walk: [(Double, Double)] = [
  (0.16, 0.84), (0.20, 0.76), (0.27, 0.66), (0.37, 0.58), (0.47, 0.53),
  (0.57, 0.50), (0.64, 0.42), (0.68, 0.33), (0.76, 0.26), (0.84, 0.18),
]
let hotSpots: [((Double, Double), Double)] = [((0.47, 0.53), 2.2), ((0.74, 0.28), 1.1), ((0.24, 0.72), 0.6)]

var heatSources: [((Double, Double), Double)] = []
for i in 0..<(walk.count - 1) {
  let steps = 14
  for s in 0..<steps {
    let t = Double(s) / Double(steps)
    let p = (walk[i].0 + (walk[i + 1].0 - walk[i].0) * t, walk[i].1 + (walk[i + 1].1 - walk[i].1) * t)
    heatSources.append((p, 0.07))
  }
}
heatSources.append(contentsOf: hotSpots)

let sigma = 0.06
var heat = [Double](repeating: 0, count: size * size)
var maxHeat = 0.0
for y in 0..<size {
  for x in 0..<size {
    let p = (Double(x) / Double(size), Double(y) / Double(size))
    var sum = 0.0
    for (c, w) in heatSources {
      let dx = p.0 - c.0, dy = p.1 - c.1
      sum += w * exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
    }
    heat[y * size + x] = sum
    maxHeat = max(maxHeat, sum)
  }
}

func render(transparentMargin: Double) -> CGImage {
  var pixels = [UInt8](repeating: 0, count: size * size * 4)
  let inner = Double(size) * (1 - 2 * transparentMargin)
  let offset = Double(size) * transparentMargin
  let cornerRadius = inner * 0.2237

  for y in 0..<size {
    for x in 0..<size {
      // Position inside the artwork square
      let ax = (Double(x) + 0.5 - offset) / inner
      let ay = (Double(y) + 0.5 - offset) / inner
      var alpha = 1.0
      if transparentMargin > 0 {
        // Rounded square mask with a soft edge
        let px = ax * inner, py = ay * inner
        let qx = max(cornerRadius - px, 0, px - (inner - cornerRadius))
        let qy = max(cornerRadius - py, 0, py - (inner - cornerRadius))
        let outside = (qx * qx + qy * qy).squareRoot() - cornerRadius
        alpha = max(0, min(1, 0.5 - outside))
        if px < 0 || py < 0 || px > inner || py > inner { alpha = 0 }
      }
      let index = (y * size + x) * 4
      if alpha == 0 { continue }

      let sx = min(size - 1, max(0, Int(ax * Double(size))))
      let sy = min(size - 1, max(0, Int(ay * Double(size))))
      let p = (ax, ay)

      var c = background
      var riverDistance = Double.greatestFiniteMagnitude
      for i in 0..<(riverLine.count - 1) {
        riverDistance = min(riverDistance, distance(p, riverLine[i], riverLine[i + 1]) * 1024)
      }
      if riverDistance < 30 { c = mix(c, river, min(1, (30 - riverDistance) / 2)) }
      for (a, b, width, streetColor) in streets {
        let d = distance(p, a, b) * 1024
        if d < width / 2 + 1 { c = mix(c, streetColor, min(1, width / 2 + 1 - d)) }
      }

      let value = pow(heat[sy * size + sx] / maxHeat, 1.7)
      if value > 0.01 {
        let heatAlpha = min(1, (value - 0.01) / 0.1) * 0.92
        c = mix(c, color(at: value), heatAlpha)
      }

      pixels[index] = UInt8(max(0, min(255, c.r * 255 * alpha)))
      pixels[index + 1] = UInt8(max(0, min(255, c.g * 255 * alpha)))
      pixels[index + 2] = UInt8(max(0, min(255, c.b * 255 * alpha)))
      pixels[index + 3] = UInt8(alpha * 255)
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
