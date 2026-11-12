/* "Documentos y certificaciones": hidden until the visitor asks for them,
   paginated, and shown only as images (no download). Data: data/documents.json */
import { escapeHtml, fetchJSON, formatMonth, setCount, scrollToSection, showLoadError } from "./utils.js?v=202611120410";
import { paginate, renderPagination } from "./pagination.js?v=202611120410";
import { openViewer } from "./viewer.js?v=202611120410";

export function initDocuments() {
  var section = document.getElementById("documentos");
  var grid = document.getElementById("docGrid");
  var toggle = document.getElementById("docMore");
  var nav = document.getElementById("docPagination");
  if (!grid || !toggle) return;

  var pageSize = parseInt(grid.dataset.pageSize, 10) || 8;
  var docs = [];
  var page = 1;
  var visible = false;

  fetchJSON("data/documents.json").then(function (data) {
    if (!data) {
      toggle.hidden = true;
      showLoadError(grid, "No se pudieron cargar los documentos.");
      return;
    }
    docs = data.filter(function (d) { return d && d.title && d.pages && d.pages.length; });
    setCount("docs", docs.length);
    update(false);
  });

  toggle.addEventListener("click", function () {
    visible = !visible;
    page = 1;
    update(!visible);
  });

  grid.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function update(scroll) {
    toggle.hidden = docs.length === 0;
    toggle.textContent = visible ? "Ocultar documentos" : "Ver mis " + docs.length + " documentos";
    toggle.setAttribute("aria-expanded", String(visible));
    grid.hidden = !visible;

    if (!visible) {
      grid.innerHTML = "";
      renderPagination(nav, { page: 1, pages: 1 });
      if (scroll) scrollToSection(section);
      return;
    }

    var result = paginate(docs, page, pageSize);
    page = result.page;
    grid.innerHTML = result.items.map(cardHtml).join("");
    grid.querySelectorAll("[data-doc]").forEach(function (card) {
      card.addEventListener("click", function () { open(card.dataset.doc); });
    });
    renderPagination(nav, {
      page: result.page,
      pages: result.pages,
      label: "Páginas de documentos",
      onChange: function (p) { page = p; update(true); }
    });
    if (scroll) scrollToSection(section);
  }

  function open(id) {
    var doc = docs.filter(function (d) { return d.id === id; })[0];
    if (!doc) return;
    openViewer({
      title: doc.title,
      meta: doc.issuer + " · " + (doc.dateLabel || formatMonth(doc.date)),
      images: doc.pages.map(function (src, i) {
        return { src: src, alt: doc.title + (doc.pages.length > 1 ? " — página " + (i + 1) : "") };
      }),
      details: verifyLink(doc.verify),
      viewOnly: true
    });
  }
}

/* Only https links can become the "Verificar" button. */
function verifyLink(url) {
  if (!/^https:\/\//.test(url || "")) return "";
  return '<a class="timeline-link is-external" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6Z"/><path d="m9 12 2 2 4-4"/></svg>' +
    "Verificar en el sitio del emisor</a>";
}

function cardHtml(doc) {
  return '<button type="button" class="doc-card reveal in-view" data-doc="' + escapeHtml(doc.id) + '" aria-label="Ver ' + escapeHtml(doc.title) + '">' +
    '<span class="doc-thumb"><img src="' + escapeHtml(doc.thumb) + '" alt="" loading="lazy" draggable="false"></span>' +
    '<span class="doc-info">' +
      '<span class="doc-title">' + escapeHtml(doc.title) + "</span>" +
      '<span class="doc-issuer">' + escapeHtml(doc.issuer) + "</span>" +
      '<span class="doc-date">' + escapeHtml(doc.dateLabel || formatMonth(doc.date)) + "</span>" +
    "</span>" +
  "</button>";
}
