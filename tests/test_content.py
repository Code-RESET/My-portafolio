"""Static checks: data files, links, assets, counts and privacy. No browser needed."""
import json
import re
from collections import Counter
from html.parser import HTMLParser

import pytest


class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.imgs, self.blank_links, self.local_refs = [], [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "img":
            self.imgs.append(a)
        if tag == "a" and a.get("target") == "_blank" and "noopener" not in (a.get("rel") or ""):
            self.blank_links.append(a.get("href"))
        for key in ("src", "href"):
            v = a.get(key)
            if v and not v.startswith(("http", "#", "mailto:", "tel:", "data:")):
                self.local_refs.append(v.split("?")[0])


@pytest.fixture(scope="module")
def html(root):
    return (root / "index.html").read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def parsed(html):
    c = Collector()
    c.feed(html)
    return c


@pytest.fixture(scope="module")
def apps(root):
    return json.loads((root / "data/apps.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def docs(root):
    return json.loads((root / "data/documents.json").read_text(encoding="utf-8"))


def test_ids_are_unique(parsed):
    dupes = [k for k, v in Counter(parsed.ids).items() if v > 1]
    assert not dupes, f"IDs repetidos: {dupes}"


def test_internal_anchors_exist(html, parsed):
    targets = set(re.findall(r'href="#([^"]+)"', html))
    missing = sorted(t for t in targets if t not in parsed.ids)
    assert not missing, f"Enlaces internos sin destino: {missing}"


def test_local_files_referenced_in_html_exist(root, parsed):
    missing = [r for r in parsed.local_refs if not (root / r).exists()]
    assert not missing, f"Archivos que no existen: {missing}"


def test_images_have_alt_and_size(parsed):
    no_alt = [i.get("src") for i in parsed.imgs if "alt" not in i]
    no_size = [i.get("src") for i in parsed.imgs if i.get("src") and ("width" not in i or "height" not in i)]
    assert not no_alt, f"Imágenes sin alt: {no_alt}"
    assert not no_size, f"Imágenes sin width/height (la página brinca al cargar): {no_size}"


def test_external_links_open_safely(parsed):
    assert not parsed.blank_links, f"target=_blank sin rel=noopener: {parsed.blank_links}"


def test_structured_data_is_valid_json(html):
    block = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    assert block, "Falta el bloque JSON-LD"
    json.loads(block.group(1))


def test_apps_json_schema(root, apps):
    assert apps, "apps.json está vacío"
    ids = [a["id"] for a in apps]
    assert len(ids) == len(set(ids)), "Hay apps con id repetido"
    for app in apps:
        for field in ("id", "name", "tag", "description", "images"):
            assert app.get(field), f"{app.get('id')}: falta '{field}'"
        assert re.fullmatch(r"[a-z0-9-]+", app["id"]), f"id inválido: {app['id']}"
        for image in app["images"]:
            assert (root / image["src"]).exists(), f"{app['id']}: no existe {image['src']}"
            assert image.get("alt"), f"{app['id']}: imagen sin texto alternativo"


def test_documents_json_schema(root, docs):
    assert docs, "documents.json está vacío"
    ids = [d["id"] for d in docs]
    assert len(ids) == len(set(ids)), "Hay documentos con id repetido"
    for doc in docs:
        for field in ("id", "title", "issuer", "date", "pages", "thumb"):
            assert doc.get(field), f"{doc.get('id')}: falta '{field}'"
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", doc["date"]), f"{doc['id']}: fecha inválida"
        for path in doc["pages"] + [doc["thumb"]]:
            assert (root / path).exists(), f"{doc['id']}: no existe {path}"


def test_static_counts_match_data(html, apps, docs):
    """The numbers written in the HTML (shown before JS loads, and in search
    results) must match the data files."""
    for name, expected in (("apps", len(apps)), ("docs", len(docs))):
        values = re.findall(r'data-count="%s">(\d+)<' % name, html)
        assert values, f"No hay contadores data-count={name}"
        assert all(int(v) == expected for v in values), f"Contador {name}: {values} != {expected}"


def test_cache_version_is_consistent(root):
    """All ?v= numbers must be equal, or a module could load twice."""
    files = [root / "index.html"] + list((root / "js").rglob("*.js"))
    versions = set()
    for f in files:
        versions.update(re.findall(r"\.(?:css|js)\?v=(\d+)", f.read_text(encoding="utf-8")))
    assert len(versions) == 1, f"Versiones distintas: {versions}. Ejecuta tools/bump_version.py"


def test_only_cv_is_downloadable(root, html):
    pdfs = sorted(p.name for p in (root / "assets/documents").glob("*.pdf"))
    assert pdfs == ["luis-diaz-bernal-cv.pdf"], f"PDF publicados además del CV: {pdfs}"
    downloads = re.findall(r'<a [^>]*download[^>]*>', html)
    assert all("luis-diaz-bernal-cv.pdf" in d for d in downloads), "Hay enlaces de descarga que no son el CV"


PRIVATE_PATTERNS = {
    "CURP": r"\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b",
    "RFC": r"\b[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}\b",
    "usuario admin": r"admin@",
}


@pytest.mark.parametrize("label", PRIVATE_PATTERNS)
def test_no_private_data_in_text_files(root, label):
    pattern = re.compile(PRIVATE_PATTERNS[label])
    hits = []
    for f in [root / "index.html", *root.glob("data/*.json"), *root.glob("js/**/*.js")]:
        if pattern.search(f.read_text(encoding="utf-8")):
            hits.append(f.name)
    assert not hits, f"Posible {label} en: {hits}"


def test_no_unused_assets(root, html):
    text = html + "".join(p.read_text(encoding="utf-8") for p in root.glob("data/*.json"))
    used = set(re.findall(r"assets/[^\"'\s)?]+", text))
    unused = sorted(str(p.relative_to(root)) for p in (root / "assets").rglob("*") if p.is_file()
                    and str(p.relative_to(root)) not in used)
    assert not unused, f"Archivos que nadie usa (pesan en el sitio): {unused}"
