/* Generic pagination used by the apps and documents grids.

   paginate(items, page, size)  -> { items, page, pages }
   renderPagination(nav, { page, pages, label, onChange })
*/
import { escapeHtml } from "./utils.js?v=202610160406";

export function paginate(items, page, size) {
  var pages = Math.max(1, Math.ceil(items.length / size));
  var current = Math.min(Math.max(1, page), pages);
  var start = (current - 1) * size;
  return { items: items.slice(start, start + size), page: current, pages: pages };
}

export function renderPagination(nav, opts) {
  if (!nav) return;
  if (opts.pages <= 1) {
    nav.hidden = true;
    nav.innerHTML = "";
    return;
  }
  nav.hidden = false;
  nav.setAttribute("aria-label", opts.label || "Paginación");

  var html = '<button type="button" class="page-btn page-prev" data-page="' + (opts.page - 1) + '"' +
    (opts.page === 1 ? " disabled" : "") + ' aria-label="Página anterior">‹</button>';
  for (var p = 1; p <= opts.pages; p++) {
    html += '<button type="button" class="page-btn" data-page="' + p + '"' +
      (p === opts.page ? ' aria-current="page"' : "") +
      ' aria-label="Página ' + p + '">' + p + "</button>";
  }
  html += '<button type="button" class="page-btn page-next" data-page="' + (opts.page + 1) + '"' +
    (opts.page === opts.pages ? " disabled" : "") + ' aria-label="Página siguiente">›</button>';
  html += '<span class="page-status" aria-live="polite">Página ' + escapeHtml(opts.page) +
    " de " + escapeHtml(opts.pages) + "</span>";
  nav.innerHTML = html;

  nav.querySelectorAll(".page-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = parseInt(btn.dataset.page, 10);
      if (target >= 1 && target <= opts.pages && target !== opts.page) opts.onChange(target);
    });
  });
}
