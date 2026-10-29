import sys, os, struct, zlib, glob
# Pack *.raw gray crops into 4-bit grayscale PNGs (16 levels), trimming blank margins right/bottom.
def png(path, w, h, rows):
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    raw = b''.join(b'\x00' + r for r in rows)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 4, 0, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)
LUT = bytes(min(15, round(v / 17)) for v in range(256))
for f in sys.argv[1:]:
    b = open(f, 'rb').read(); w, h = struct.unpack('<II', b[:8]); px = b[8:]
    rows = []
    for r in range(h):
        line = px[r * w:(r + 1) * w].translate(LUT)
        if w % 2: line += b'\x0f'
        rows.append(bytes((line[i] << 4) | line[i + 1] for i in range(0, len(line), 2)))
    png(f[:-4], w, h, rows); os.remove(f)
