"""Stitch viewport frames into a full-page PNG and crop per-section PNGs (used by scripts/verify.mjs).

    python scripts/stitch.py <manifest.json>

The manifest lists frames (path, scroll y), the page height and the section offsets.
"""
import json
import sys

from PIL import Image

m = json.load(open(sys.argv[1]))
first = Image.open(m["frames"][0]["path"])
w, vh = first.size
page = Image.new("RGB", (w, m["height"]), (5, 5, 5))
for f in m["frames"]:
    page.paste(Image.open(f["path"]).convert("RGB"), (0, f["y"]))
page.save(m["out"])
for s in m["sections"]:
    page.crop((0, s["top"], w, min(m["height"], s["top"] + s["height"]))).save(s["out"])
