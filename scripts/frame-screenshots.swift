// Puts a caption above each App Store screenshot, on a dark background in the colors of the
// app icon. The input is the raw simulator screenshots from take-screenshots.sh.
// Usage: swiftc -O scripts/frame-screenshots.swift -o /tmp/frame-screenshots && /tmp/frame-screenshots <input dir> <output dir>
// Each output has the same size as the input (1320x2868 for the 6.9 inch iPhone).

import AppKit
import Foundation

struct Caption {
  let file: String
  /// Text of the caption. The part in `accent` gets the heat color.
  let text: String
  let accent: String
}

let captions = [
  Caption(file: "01-map", text: "Find the streets\nyou missed", accent: "you missed"),
  Caption(file: "02-recording", text: "Record every walk,\nalso in the background", accent: "every walk"),
  Caption(file: "03-history", text: "Every day of your\ntrip in one place", accent: "trip"),
  Caption(file: "04-series", text: "Your data stays\non your iPhone", accent: "on your iPhone"),
]

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
  print("Usage: frame-screenshots <input dir> <output dir>")
  exit(1)
}
let inputDirectory = URL(fileURLWithPath: arguments[1])
let outputDirectory = URL(fileURLWithPath: arguments[2])
try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> NSColor {
  NSColor(
    srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
    blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
}

let background = color(0x101722)
let coldDot = color(0x2A3647)
let accentColor = color(0xF29305)

/// Background: the dark color of the icon, a dot grid and a warm glow behind the caption
func drawBackground(_ size: CGSize, in context: CGContext) {
  background.setFill()
  context.fill(CGRect(origin: .zero, size: size))

  let glow = CGGradient(
    colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
    colors: [color(0xE50000, 0.28).cgColor, color(0xF29305, 0.10).cgColor, color(0x101722, 0).cgColor] as CFArray,
    locations: [0, 0.45, 1])!
  let center = CGPoint(x: size.width * 0.5, y: size.height * 0.86)
  context.drawRadialGradient(
    glow, startCenter: center, startRadius: 0, endCenter: center, endRadius: size.width * 0.95, options: [])

  let spacing = size.width / 11
  for row in 0...Int(size.height / spacing) {
    for column in 0...11 {
      let x = (CGFloat(column) + 0.5) * spacing
      let y = (CGFloat(row) + 0.5) * spacing
      coldDot.withAlphaComponent(0.55).setFill()
      context.fillEllipse(in: CGRect(x: x - 7, y: y - 7, width: 14, height: 14))
    }
  }
}

func drawCaption(_ caption: Caption, size: CGSize) {
  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = .center
  paragraph.lineHeightMultiple = 0.95
  let font = NSFont.systemFont(ofSize: 112, weight: .bold)
  let text = NSMutableAttributedString(
    string: caption.text,
    attributes: [.font: font, .foregroundColor: NSColor.white, .paragraphStyle: paragraph, .kern: -1.5])
  let range = (caption.text as NSString).range(of: caption.accent)
  if range.location != NSNotFound {
    text.addAttribute(.foregroundColor, value: accentColor, range: range)
  }
  let box = CGRect(x: 60, y: size.height - 560, width: size.width - 120, height: 380)
  let height = text.boundingRect(with: box.size, options: [.usesLineFragmentOrigin]).height
  text.draw(
    with: CGRect(x: box.minX, y: box.minY + (box.height - height) / 2, width: box.width, height: height),
    options: [.usesLineFragmentOrigin])
}

/// The screenshot, smaller, with round corners. Its bottom goes past the lower edge.
func drawScreenshot(_ image: NSImage, size: CGSize, in context: CGContext) {
  let width = size.width * 0.82
  let height = width * image.size.height / image.size.width
  let top = size.height - 640
  let frame = CGRect(x: (size.width - width) / 2, y: top - height, width: width, height: height)
  let path = NSBezierPath(roundedRect: frame, xRadius: 90, yRadius: 90)

  context.saveGState()
  context.setShadow(offset: CGSize(width: 0, height: -20), blur: 80, color: NSColor.black.withAlphaComponent(0.6).cgColor)
  background.setFill()
  path.fill()
  context.restoreGState()

  context.saveGState()
  path.addClip()
  image.draw(in: frame)
  context.restoreGState()

  color(0x3A475A).setStroke()
  path.lineWidth = 6
  path.stroke()
}

for caption in captions {
  let input = inputDirectory.appendingPathComponent("\(caption.file).png")
  guard let image = NSImage(contentsOf: input),
    let representation = image.representations.first
  else {
    print("Missing \(input.path)")
    continue
  }
  let size = CGSize(width: representation.pixelsWide, height: representation.pixelsHigh)
  image.size = size

  let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: Int(size.width), pixelsHigh: Int(size.height), bitsPerSample: 8,
    samplesPerPixel: 3, hasAlpha: false, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0,
    bitsPerPixel: 32)!
  bitmap.size = size
  NSGraphicsContext.saveGraphicsState()
  let graphics = NSGraphicsContext(bitmapImageRep: bitmap)!
  NSGraphicsContext.current = graphics
  let context = graphics.cgContext

  drawBackground(size, in: context)
  drawCaption(caption, size: size)
  drawScreenshot(image, size: size, in: context)

  NSGraphicsContext.restoreGraphicsState()
  let output = outputDirectory.appendingPathComponent("\(caption.file).png")
  try bitmap.representation(using: .png, properties: [:])!.write(to: output)
  print("Wrote \(output.path)")
}
