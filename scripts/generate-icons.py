"""Generate the PWA's football icons using only the Python standard library."""
import math
from pathlib import Path
import struct
import zlib

PUBLIC = Path(__file__).resolve().parents[1] / 'public'
BLUE = (35, 76, 205)
WHITE = (255, 255, 255)
POLYGON = [(24, 15), (33, 22), (29, 32), (19, 32), (15, 22)]
LINES = [((24, 8), (24, 15)), ((9, 19), (15, 22)), ((33, 22), (39, 19)), ((19, 32), (15, 38)), ((29, 32), (33, 38))]


def on_line(x, y, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)))
    return (x - a[0] - t * dx) ** 2 + (y - a[1] - t * dy) ** 2 < 1


def is_white(x, y):
    if abs(math.hypot(x - 24, y - 24) - 16) < 1:
        return True
    inside = False
    for a, b in zip(POLYGON, POLYGON[1:] + POLYGON[:1]):
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
            inside = not inside
    return inside or any(on_line(x, y, a, b) for a, b in LINES)


def write_png(name, size):
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            coverage = sum(is_white((x + dx) * 48 / size, (y + dy) * 48 / size) for dx, dy in [(0.25, 0.25), (0.75, 0.25), (0.25, 0.75), (0.75, 0.75)]) / 4
            rows.extend(round(bg + (fg - bg) * coverage) for bg, fg in zip(BLUE, WHITE))

    def chunk(kind, content):
        return struct.pack('!I', len(content)) + kind + content + struct.pack('!I', zlib.crc32(kind + content) & 0xFFFFFFFF)

    data = b'\x89PNG\r\n\x1a\n'
    data += chunk(b'IHDR', struct.pack('!2I5B', size, size, 8, 2, 0, 0, 0))
    data += chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b'')
    (PUBLIC / name).write_bytes(data)


for filename, dimension in [('icon-192.png', 192), ('icon-512.png', 512), ('icon-maskable-512.png', 512), ('apple-touch-icon.png', 180)]:
    write_png(filename, dimension)
