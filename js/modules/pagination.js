/* Generic pagination used by the apps and documents grids.

   paginate(items, page, size)  -> { items, page, pages }
   renderPagination(nav, { page, pages, label, onChange })
*/
import { escapeHtml } from "./utils.js?v=202611130515";

export function paginate(items, page, size) {
  var pages = Math.max(1, Math.ceil(items.length / size));
  var current = Math.min(Math.max(1, page), pages);
  var start = (current - 1) * size;
  return { items: items.slice(start, start + size), page: current, pages: pages };
}

export function renderPagination(nav, opts) {
  if (!nav) return;
  /* One status line that stays in the page, so screen readers announce
     "Página 2 de 3" each time it changes (a freshly inserted live region
     usually isn't read). */
  var status = nav.querySelector(".page-status");
  if (!status) {
    status = document.createElement("span");
    status.className = "page-status";
    status.setAttribute("aria-live", "polite");
  }
  nav.querySelectorAll(".page-btn").forEach(function (btn) { btn.remove(); });

  if (opts.pages <= 1) {
    nav.hidden = true;
    status.textContent = "";
    if (!status.parentNode) nav.appendChild(status);
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
  nav.insertAdjacentHTML("afterbegin", html);
  status.textContent = "Página " + escapeHtml(opts.page) + " de " + escapeHtml(opts.pages);
  nav.appendChild(status);

  nav.querySelectorAll(".page-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = parseInt(btn.dataset.page, 10);
      if (!(target >= 1 && target <= opts.pages && target !== opts.page)) return;
      var kind = btn.classList.contains("page-prev") ? ".page-prev"
        : btn.classList.contains("page-next") ? ".page-next" : null;
      opts.onChange(target);
      /* The buttons were rebuilt: keep the keyboard focus where it was
         (same arrow if it still works, otherwise the current page). */
      var again = kind && nav.querySelector(kind + ":not(:disabled)");
      var focusTo = again || nav.querySelector('.page-btn[aria-current="page"]');
      if (focusTo) focusTo.focus({ preventScroll: true });
    });
  });
}
