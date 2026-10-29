import PDFKit
import AppKit
// bands <pdf> <out.json> [from to]: per page: visual text lines found from the rendered image,
// each with its PDF-space box and the text PDFKit selects inside that box.
let args = CommandLine.arguments
let doc = PDFDocument(url: URL(fileURLWithPath: args[1]))!
let from = args.count > 3 ? Int(args[3])! : 1
let to = args.count > 4 ? Int(args[4])! : doc.pageCount
let scale: CGFloat = 2
var pages: [Any] = []
for p in from...to {
  let page = doc.page(at: p - 1)!
  let box = page.bounds(for: .mediaBox)
  let w = Int(box.width * scale), h = Int(box.height * scale)
  let cs = CGColorSpaceCreateDeviceGray()
  let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w, space: cs, bitmapInfo: CGImageAlphaInfo.none.rawValue)!
  ctx.setFillColor(gray: 1, alpha: 1); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  let buf = ctx.data!.bindMemory(to: UInt8.self, capacity: w * h)
  // row r=0 is top of image in memory? CGContext bitmap memory row 0 = top.
  var ink = [Int](repeating: 0, count: h); var minx = [Int](repeating: w, count: h); var maxx = [Int](repeating: -1, count: h)
  for r in 0..<h { for c in 0..<w { if buf[r * w + c] < 180 { ink[r] += 1; if c < minx[r] { minx[r] = c }; if c > maxx[r] { maxx[r] = c } } } }
  var bands: [Any] = []
  var r = 0
  while r < h {
    if ink[r] == 0 { r += 1; continue }
    var e = r; var x0 = w, x1 = -1
    while e < h && ink[e] > 0 { x0 = min(x0, minx[e]); x1 = max(x1, maxx[e]); e += 1 }
    // PDF coords: top = box.height - r/scale
    let top = box.height - CGFloat(r) / scale, bot = box.height - CGFloat(e) / scale
    let rect = CGRect(x: CGFloat(x0) / scale - 1, y: bot + 1, width: CGFloat(x1 - x0) / scale + 2, height: max(1, top - bot - 2))
    let t = page.selection(for: rect)?.string ?? ""
    // word clusters at several gap thresholds (px at scale 2)
    var ks = [0, 0, 0, 0]; let th = [4, 5, 6, 7]; var gap = 99
    for c in x0...max(x0, x1) {
      var inkc = false
      for rr in r..<e { if buf[rr * w + c] < 180 { inkc = true; break } }
      if inkc { for k in 0..<4 { if gap >= th[k] { ks[k] += 1 } }; gap = 0 } else { gap += 1 }
    }
    bands.append([Double(top), Double(bot), Double(x0) / Double(scale), Double(x1) / Double(scale), t.replacingOccurrences(of: "\n", with: " "), ks])
    r = e
  }
  pages.append([p, Double(box.width), Double(box.height), bands])
}
try! JSONSerialization.data(withJSONObject: pages).write(to: URL(fileURLWithPath: args[2]))
print("ok", pages.count)
