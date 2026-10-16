"""Make the hero portrait assets from Yoav's photo, locally (no external service).

    python scripts/make-portrait.py scripts/yoav-source.webp

Writes public/assets/yoav.webp: the photo with the light wall faded to transparent (RGBA, under
400 KB). The WebGL tiles sample it, and it is the static image for reduced motion and no WebGL.

The wall is light and nearly grey; skin, hair and the shirt are not. A pixel counts as wall when it is
fairly bright and unsaturated (the wall and its shadow); skin is much more saturated. Only wall pixels connected to the image border are removed, so
bright spots inside the face (eyes, teeth) stay. The edge is then softened.
Needs Pillow and numpy (any venv that has them).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

src = Path(sys.argv[1] if len(sys.argv) > 1 else "scripts/yoav-source.webp")
out_dir = Path(__file__).resolve().parent.parent / "public" / "assets"
out_dir.mkdir(parents=True, exist_ok=True)

im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.int16)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mx, mn = a.max(axis=2), a.min(axis=2)
sat = (mx - mn) / np.maximum(mx, 1)
# Lit wall and its warm shadow: bright-ish, low saturation, little red over blue. Skin is far more saturated.
wall = (mx > 150) & (sat < 0.265) & ((r - b) < 58)
# Right of the shoulder the wall is in deeper, warmer shadow; only the dark shirt is there, so a looser
# rule is safe. It stays off the neck, whose shadowed skin is about as unsaturated.
ys, xs = np.mgrid[0 : a.shape[0], 0 : a.shape[1]]
low = (ys > 0.55 * a.shape[0]) & (xs > 0.66 * a.shape[1])
wall |= low & (mx > 150) & (sat < 0.40) & ((r - b) < 75)

# Flood fill from the border through wall pixels (repeated 4-neighbour dilation, constrained to wall).
seed = np.zeros_like(wall)
seed[0, :], seed[-1, :], seed[:, 0], seed[:, -1] = wall[0, :], wall[-1, :], wall[:, 0], wall[:, -1]
while True:
    grown = seed.copy()
    grown[1:, :] |= seed[:-1, :]
    grown[:-1, :] |= seed[1:, :]
    grown[:, 1:] |= seed[:, :-1]
    grown[:, :-1] |= seed[:, 1:]
    grown &= wall
    if (grown == seed).all():
        break
    seed = grown

person = Image.fromarray(((~seed) * 255).astype(np.uint8))
# Close small gaps, drop specks, then feather the edge.
person = person.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(3))
person = person.filter(ImageFilter.GaussianBlur(2.2))

# Fade the arms/shoulders out towards the bottom so the cut-out sits in the dark page.
h = im.height
fade = np.clip((h - np.arange(h)) / (0.16 * h), 0, 1)[:, None]
alpha = (np.asarray(person).astype(np.float32) * fade).astype(np.uint8)

rgba = im.copy()
rgba.putalpha(Image.fromarray(alpha))
rgba.save(out_dir / "yoav.webp", "WEBP", quality=86, method=6)
print("yoav.webp", (out_dir / "yoav.webp").stat().st_size // 1024, "KB")
