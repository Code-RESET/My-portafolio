"""Browser checks with Chromium: errors, layout, pagination, previews, documents."""
import pytest

WIDTHS = [360, 390, 768, 1024, 1081, 1280, 1440]


@pytest.mark.parametrize("scheme", ["light", "dark"])
@pytest.mark.parametrize("width", [390, 1440])
def test_no_errors_while_loading(open_page, width, scheme):
    page = open_page(width, scheme=scheme)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(500)
    assert page.errors == []


@pytest.mark.parametrize("width", WIDTHS)
def test_no_horizontal_scroll(open_page, width):
    page = open_page(width)
    assert not page.evaluate("document.documentElement.scrollWidth > window.innerWidth")


def test_hero_collage_only_on_wide_screens(open_page):
    assert open_page(1440).locator(".hero-visual").is_visible()
    assert not open_page(390).locator(".hero-visual").is_visible()


def test_counts_filled_from_data(open_page, root):
    import json
    apps = json.loads((root / "data/apps.json").read_text(encoding="utf-8"))
    page = open_page()
    for text in page.locator('[data-count="apps"]').all_inner_texts():
        assert text == str(len(apps))


def test_apps_pagination(open_page, root):
    import json
    apps = json.loads((root / "data/apps.json").read_text(encoding="utf-8"))
    page = open_page()
    page.click("#tab-proyectos")
    size = int(page.get_attribute("#appsGrid", "data-page-size"))
    pages = -(-len(apps) // size)
    assert page.locator("#appsGrid .project-card").count() == min(size, len(apps))
    if pages > 1:
        assert page.locator("#appsPagination").is_visible()
        assert page.locator('#appsPagination [aria-current="page"]').inner_text() == "1"
        assert page.locator("#appsPagination .page-prev").is_disabled()
        page.click("#appsPagination .page-next")
        assert page.locator('#appsPagination [aria-current="page"]').inner_text() == "2"
        last = page.locator("#appsGrid .project-card h3").last.inner_text()
        page.click(f'#appsPagination .page-btn[data-page="{pages}"]')
        names = page.locator("#appsGrid .project-card h3").all_inner_texts()
        assert apps[-1]["name"] in names
        assert page.locator("#appsPagination .page-next").is_disabled()
        assert last  # page 2 rendered something


def test_every_app_preview_opens(open_page, root):
    import json
    apps = json.loads((root / "data/apps.json").read_text(encoding="utf-8"))
    page = open_page()
    page.click("#tab-proyectos")
    size = int(page.get_attribute("#appsGrid", "data-page-size"))
    for i, app in enumerate(apps):
        page_no = i // size + 1
        page.click(f'#appsPagination .page-btn[data-page="{page_no}"]') if len(apps) > size else None
        page.click(f'#appsGrid .project-link[data-app="{app["id"]}"]')
        viewer = page.locator("#viewer")
        assert "open" in viewer.get_attribute("class")
        assert page.locator("#viewerTitle").inner_text() == app["name"]
        page.wait_for_function("document.getElementById('viewerImage').complete && document.getElementById('viewerImage').naturalWidth > 0")
        if len(app["images"]) > 1:
            assert page.locator("#viewerCounter").inner_text() == f"1 / {len(app['images'])}"
            page.keyboard.press("ArrowRight")
            assert page.locator("#viewerCounter").inner_text() == f"2 / {len(app['images'])}"
            assert page.locator("#viewerThumbs .viewer-thumb").count() == len(app["images"])
        else:
            assert page.locator("#viewerPrev").is_hidden()
        page.keyboard.press("Escape")
        assert "open" not in viewer.get_attribute("class")
    assert page.errors == []


def test_viewer_returns_focus_and_closes_on_backdrop(open_page):
    page = open_page()
    page.click("#tab-proyectos")
    button = page.locator("#appsGrid .project-link").first
    button.click()
    assert page.evaluate("document.activeElement.id") == "viewerClose"
    page.mouse.click(5, 5)  # backdrop
    assert "open" not in page.get_attribute("#viewer", "class")
    assert page.evaluate("document.activeElement.classList.contains('project-link')")


def test_documents_hidden_until_requested(open_page, root):
    import json
    docs = json.loads((root / "data/documents.json").read_text(encoding="utf-8"))
    page = open_page()
    page.click("#tab-documentos")
    assert page.locator("#docGrid").is_hidden()
    assert page.locator("#docMore").inner_text() == f"Ver mis {len(docs)} documentos"
    page.click("#docMore")
    size = int(page.get_attribute("#docGrid", "data-page-size"))
    assert page.locator("#docGrid .doc-card").count() == min(size, len(docs))
    if len(docs) > size:
        page.click("#docPagination .page-next")
        assert page.locator("#docGrid .doc-card").count() == min(size, len(docs) - size)
    page.locator("#docGrid .doc-card").first.click()
    assert "view-only" in page.get_attribute("#viewer", "class")
    assert page.locator("#viewer a[download]").count() == 0
    page.keyboard.press("Escape")
    page.click("#docMore")
    assert page.locator("#docGrid").is_hidden()
    assert page.errors == []


def test_mobile_menu(open_page):
    page = open_page(390)
    page.click("#navToggle")
    assert page.get_attribute("#navToggle", "aria-expanded") == "true"
    page.click('#navLinks a[href="#contacto"]')
    page.wait_for_timeout(100)
    assert page.get_attribute("#navToggle", "aria-expanded") == "false"


def test_theme_toggle(open_page):
    page = open_page(scheme="light")
    page.click("#themeToggle")
    assert page.get_attribute("html", "data-theme") == "dark"
    page.click("#themeToggle")
    assert page.get_attribute("html", "data-theme") == "light"


def test_contact_links_are_built(open_page):
    page = open_page()
    assert page.get_attribute("#emailLink", "href").startswith("mailto:")
    assert page.get_attribute("#phoneLink", "href").startswith("tel:+52")
    for href in page.locator(".js-wa").evaluate_all("els => els.map(e => e.href)"):
        assert href.startswith("https://wa.me/52") and "text=" in href


def test_all_images_load(open_page):
    page = open_page()
    page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager')")
    page.wait_for_load_state("networkidle")
    broken = page.evaluate("""[...document.querySelectorAll('img[src]')]
        .filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'))""")
    assert broken == []


AXE_CANDIDATES = [
    "node_modules/axe-core/axe.min.js",
    "tests/node_modules/axe-core/axe.min.js",
]


@pytest.mark.parametrize("scheme", ["light", "dark"])
def test_accessibility_axe(open_page, root, scheme):
    """WCAG A/AA checks with axe-core (contrast, labels, ARIA).
    Needs:  npm install --prefix tests axe-core"""
    import os
    axe = os.environ.get("AXE_PATH") or next((str(root / c) for c in AXE_CANDIDATES if (root / c).exists()), None)
    if not axe:
        pytest.skip("axe-core no instalado (npm install --prefix tests axe-core)")
    page = open_page(scheme=scheme)
    page.add_style_tag(content=".reveal{opacity:1!important;transform:none!important;transition:none!important}")
    page.click("#tab-documentos")
    page.click("#docMore")
    page.add_script_tag(path=axe)
    result = page.evaluate("axe.run(document, {resultTypes: ['violations']})")
    problems = [f"{v['id']}: {[n['target'] for n in v['nodes'][:3]]}" for v in result["violations"]
                if v["impact"] in ("serious", "critical")]
    assert problems == []


def test_tabs_switch_panels_and_keyboard(open_page):
    page = open_page()
    assert page.get_attribute("#tab-instalaciones", "aria-selected") == "true"
    assert page.locator("#instalaciones").is_visible() and page.locator("#proyectos").is_hidden()
    page.click("#tab-proyectos")
    assert page.locator("#proyectos").is_visible() and page.locator("#instalaciones").is_hidden()
    page.focus("#tab-experiencia")
    page.keyboard.press("ArrowRight")
    assert page.get_attribute("#tab-habilidades", "aria-selected") == "true"
    assert page.evaluate("document.activeElement.id") == "tab-habilidades"
    page.keyboard.press("End")
    assert page.locator("#documentos").is_visible()


def test_page_does_not_jump_on_load(open_page):
    for width in (390, 1440):
        assert open_page(width).evaluate("window.scrollY") == 0


@pytest.mark.parametrize("target", ["caso-minero", "caso-casa", "proyectos", "documentos", "educacion", "testimonios"])
def test_deep_links_open_their_tab(browser, base_url, target):
    """Old links like #documentos or #caso-minero must still land on the right place."""
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.goto(base_url + "#" + target, wait_until="networkidle")
    page.wait_for_timeout(900)
    assert page.locator("#" + target).is_visible()
    top = page.evaluate(f"document.getElementById('{target}').getBoundingClientRect().top")
    assert 0 <= top < 844, f"#{target} quedó fuera de la pantalla (top={top})"
    ctx.close()


def test_in_page_links_to_tabs(open_page):
    page = open_page(390)
    page.click('.hero-tile[href="#proyectos"]')
    page.wait_for_timeout(800)
    assert page.get_attribute("#tab-proyectos", "aria-selected") == "true"
    page.click('.timeline-link[href="#caso-minero"]', force=True) if page.locator('.timeline-link[href="#caso-minero"]').is_visible() else None


def test_tab_bar_shows_more_content_arrow_on_small_screens(open_page):
    page = open_page(390)
    wrap = page.locator("#perfil .tablist-wrap")
    assert "more-right" in wrap.get_attribute("class")
    page.click("#perfil .tab-scroll-right")
    page.wait_for_timeout(600)
    assert "more-left" in wrap.get_attribute("class")
    assert "more-right" not in page.locator("#trabajo .tablist-wrap").get_attribute("class")


def test_panel_pager_moves_between_tabs(open_page):
    page = open_page()
    page.click("#instalaciones .tab-pager-next")
    assert page.get_attribute("#tab-proyectos", "aria-selected") == "true"
    page.click("#proyectos .tab-pager-prev")
    assert page.get_attribute("#tab-instalaciones", "aria-selected") == "true"
    assert page.locator("#documentos .tab-pager-next").count() == 0


def test_links_show_where_they_go(open_page):
    page = open_page()
    external = page.locator("a.is-external")
    assert external.count() >= 10
    for link in external.all():
        assert link.locator(".ext-icon").count() == 1
        assert link.get_attribute("target") == "_blank" and "noopener" in link.get_attribute("rel")
    hrefs = page.evaluate("[...document.querySelectorAll('a[href^=\"http\"]')].map(a => a.className)")
    assert all("is-external" in c for c in hrefs), "Hay enlaces a otros sitios sin marcar"


def test_chat_captures_open_in_viewer(open_page):
    page = open_page()
    page.locator("#testimonios a.is-preview").first.click()
    assert "open" in page.get_attribute("#viewer", "class")
    assert "Conversación original" in page.locator("#viewerTitle").inner_text()
    assert len(page.context.pages) == 1
