/* "Aplicaciones desarrolladas": cards are built from data/apps.json.
   To add an app, add an entry to that file (see README). */
import { escapeHtml, fetchJSON, setCount, scrollToSection } from "./utils.js?v=202610160406";
import { paginate, renderPagination } from "./pagination.js?v=202610160406";
import { openViewer } from "./viewer.js?v=202610160406";

var EYE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
var STACK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-5 4 4 3-3 6 6"/></svg>';

export function initApps() {
  var section = document.getElementById("proyectos");
  var grid = document.getElementById("appsGrid");
  var nav = document.getElementById("appsPagination");
  if (!grid) return;

  var pageSize = parseInt(grid.dataset.pageSize, 10) || 6;
  var apps = [];
  var page = 1;

  fetchJSON("data/apps.json").then(function (data) {
    apps = data.filter(function (a) { return a && a.id && a.name && a.images && a.images.length; });
    setCount("apps", apps.length);
    render(false);
  });

  function render(scroll) {
    var result = paginate(apps, page, pageSize);
    page = result.page;
    grid.innerHTML = result.items.map(cardHtml).join("");
    grid.querySelectorAll("[data-app]").forEach(function (btn) {
      btn.addEventListener("click", function () { preview(btn.dataset.app); });
    });
    renderPagination(nav, {
      page: result.page,
      pages: result.pages,
      label: "Páginas de aplicaciones",
      onChange: function (p) { page = p; render(true); }
    });
    if (scroll) scrollToSection(section);
  }

  function preview(id) {
    var app = apps.filter(function (a) { return a.id === id; })[0];
    if (!app) return;
    openViewer({
      title: app.name,
      meta: app.tag,
      images: app.images,
      details: '<p class="viewer-text">' + escapeHtml(app.description) + "</p>" +
        (app.stack && app.stack.length
          ? '<p class="project-stack">' + app.stack.map(escapeHtml).join(" · ") + "</p>" : "")
    });
  }
}

function cardHtml(app) {
  var cover = app.images[0];
  var count = app.images.length;
  var label = "Vista previa de " + app.name;
  return '<article class="project-card reveal in-view">' +
    '<button type="button" class="project-shot" data-app="' + escapeHtml(app.id) + '" aria-label="' + escapeHtml(label) + '">' +
      '<img src="' + escapeHtml(cover.src) + '" alt="' + escapeHtml(cover.alt) + '" loading="lazy">' +
      (count > 1 ? '<span class="shot-count">' + STACK_ICON + count + "</span>" : "") +
    "</button>" +
    '<div class="project-info">' +
      "<h3>" + escapeHtml(app.name) + "</h3>" +
      '<p class="project-tag">' + escapeHtml(app.tag) + "</p>" +
      '<p class="project-desc">' + escapeHtml(app.description) + "</p>" +
      '<button type="button" class="timeline-link project-link" data-app="' + escapeHtml(app.id) + '">' +
        EYE_ICON + "Vista previa" + (count > 1 ? " · " + count + " capturas" : "") +
      "</button>" +
      (app.stack && app.stack.length
        ? '<p class="project-stack">' + app.stack.map(escapeHtml).join(" · ") + "</p>" : "") +
    "</div>" +
  "</article>";
}
