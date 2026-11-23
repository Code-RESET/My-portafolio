"""Genera el PDF del CV a partir de tools/cv/cv.html.

Uso:  python3 tools/build_cv.py
Salida: assets/documents/luis-diaz-bernal-cv.pdf
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "cv" / "cv.html"
OUT = ROOT / "assets" / "documents" / "luis-diaz-bernal-cv.pdf"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(SRC.as_uri())
    page.pdf(path=str(OUT), format="Letter", print_background=True,
             margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
    browser.close()

print(f"CV generado: {OUT.relative_to(ROOT)}")
