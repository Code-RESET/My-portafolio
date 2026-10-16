#!/usr/bin/env python3
"""Updates the ?v= cache-busting number in index.html and in every JS import.

Run it after changing any file in css/ or js/, before publishing:
    python3 tools/bump_version.py

Phones keep old CSS/JS in memory; a new number forces them to download
the new files. All files get the SAME number so each module is loaded once.
"""
import pathlib
import re
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION = time.strftime("%Y%m%d%H%M")
PATTERN = re.compile(r"(\.(?:css|js))\?v=[0-9]+")

files = [ROOT / "index.html"] + sorted((ROOT / "js").rglob("*.js"))
for path in files:
    text = path.read_text(encoding="utf-8")
    new = PATTERN.sub(lambda m: f"{m.group(1)}?v={VERSION}", text)
    if new != text:
        path.write_text(new, encoding="utf-8")
        print(f"updated {path.relative_to(ROOT)}")
print(f"version {VERSION}")
