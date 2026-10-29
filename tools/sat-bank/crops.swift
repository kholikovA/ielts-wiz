import PDFKit
import AppKit
// crops <jobs.json> <scale>: jobs = [[pdf, page, x0, top, x1, bot, out]] (PDF coords); 8-bit gray PNG.
let jobs = try! JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! [[Any]]
let scale = CGFloat(Double(CommandLine.arguments[2])!)
var docs: [String: PDFDocument] = [:]
var n = 0
for j in jobs {
  let path = j[0] as! String
  let doc = docs[path] ?? PDFDocument(url: URL(fileURLWithPath: path))!
  docs[path] = doc
  let page = doc.page(at: (j[1] as! Int) - 1)!
  let x0 = CGFloat(j[2] as! Double), top = CGFloat(j[3] as! Double), x1 = CGFloat(j[4] as! Double), bot = CGFloat(j[5] as! Double)
  let w = Int(((x1 - x0) * scale).rounded()), h = Int(((top - bot) * scale).rounded())
  if w <= 0 || h <= 0 { continue }
  let cs = CGColorSpaceCreateDeviceGray()
  let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: CGImageAlphaInfo.none.rawValue)!
  ctx.setFillColor(gray: 1, alpha: 1); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.scaleBy(x: scale, y: scale)
  ctx.translateBy(x: -x0, y: -bot)
  page.draw(with: .mediaBox, to: ctx)
  // raw: 8-byte header (w,h as UInt32 LE) + gray bytes; packed to a 4-bit PNG by pack.py
  let bpr = ctx.bytesPerRow
  let buf = ctx.data!.bindMemory(to: UInt8.self, capacity: bpr * h)
  var out = Data()
  var W = UInt32(w).littleEndian, H = UInt32(h).littleEndian
  out.append(Data(bytes: &W, count: 4)); out.append(Data(bytes: &H, count: 4))
  for r in 0..<h { out.append(UnsafeBufferPointer(start: buf + r * bpr, count: w)) }
  try! out.write(to: URL(fileURLWithPath: (j[6] as! String) + ".raw"))
  n += 1
}
print("crops", n)
