"""Shared fixtures: a local web server for the site and a Chromium browser.

Run all tests from the repository root:
    pip install pytest playwright
    python3 -m pytest tests -q

If Playwright cannot find Chromium, point CHROMIUM_PATH at the executable.
"""
import functools
import glob
import http.server
import os
import pathlib
import threading

import pytest

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Chromium copies that may already be on the machine (any version), used
# when the installed Playwright has no browser of its own.
CHROMIUM_GLOBS = ("/opt/pw-browsers/chromium*/chrome-linux*/chrome",)


def find_chromium():
    if os.environ.get("CHROMIUM_PATH"):
        return os.environ["CHROMIUM_PATH"]
    for pattern in CHROMIUM_GLOBS:
        found = sorted(glob.glob(pattern))
        if found:
            return found[-1]
    return None


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class QuietServer(http.server.ThreadingHTTPServer):
    def handle_error(self, request, client_address):
        pass  # the browser cancelling an image download is not a test failure


@pytest.fixture(scope="session")
def root():
    return ROOT


@pytest.fixture(scope="session")
def base_url():
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = QuietServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}/"
    server.shutdown()


@pytest.fixture(scope="session")
def browser():
    sync_api = pytest.importorskip("playwright.sync_api")
    with sync_api.sync_playwright() as p:
        try:
            if os.environ.get("CHROMIUM_PATH"):
                raise RuntimeError("use CHROMIUM_PATH")
            b = p.chromium.launch()
        except Exception:
            path = find_chromium()
            if not path:
                raise
            b = p.chromium.launch(executable_path=path)
        yield b
        b.close()


@pytest.fixture
def open_page(browser, base_url):
    """open_page(width, height=900, scheme="light") -> page with error tracking.
    page.errors collects console errors, JS exceptions and failed requests."""
    contexts = []

    def _open(width=1440, height=900, scheme="light"):
        ctx = browser.new_context(viewport={"width": width, "height": height}, color_scheme=scheme)
        contexts.append(ctx)
        page = ctx.new_page()
        page.errors = []
        page.on("console", lambda m: page.errors.append(f"console: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: page.errors.append(f"js: {e}"))
        page.on("requestfailed", lambda r: page.errors.append(f"failed: {r.url}"))
        page.on("response", lambda r: page.errors.append(f"http {r.status}: {r.url}") if r.status >= 400 else None)
        page.goto(base_url, wait_until="networkidle")
        page.wait_for_selector("#appsGrid .project-card", state="attached")
        return page

    yield _open
    for ctx in contexts:
        ctx.close()
