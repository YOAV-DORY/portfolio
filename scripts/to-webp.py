"""Convert captured PNGs (scripts/.raw/<project>/*.png) into webp files under public/media/<project>/.

    python scripts/to-webp.py

Desktop captures stay 1440 wide; phone captures (780 wide at 2x) are kept at that size so they stay
sharp inside the phone frames. Prints each output size so the page weight stays visible.
Needs Pillow with webp support.
"""
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent
raw = root / ".raw"
media = root.parent / "public" / "media"

for png in sorted(raw.glob("*/*.png")):
    project = png.parent.name
    if project.startswith("frames-"):  # video frame dumps from scripts/record.mjs
        continue
    out = media / project / (png.stem + ".webp")
    out.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(png).convert("RGB")
    quality = 78 if im.width < 1000 else 80
    im.save(out, "WEBP", quality=quality, method=6)
    print(f"{out.relative_to(root.parent)}  {im.width}x{im.height}  {out.stat().st_size // 1024} KB")
