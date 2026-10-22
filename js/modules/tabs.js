/* Tabs (Proyectos and Sobre mí). Markup: [data-tabs] > [role=tablist] > [role=tab],
   and one [role=tabpanel] per tab. Without JavaScript every panel stays visible.

   Links to anything inside a hidden panel (#caso-minero, #documentos…) open
   the right tab first and then scroll to it, so old links keep working. */

export function initTabs() {
  document.querySelectorAll("[data-tabs]").forEach(setup);

  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = decodeURIComponent(link.getAttribute("href").slice(1));
    if (id && openTarget(id)) {
      e.preventDefault();
      if (history.pushState) history.pushState(null, "", "#" + id);
    }
  });

  window.addEventListener("hashchange", function () {
    openTarget(decodeURIComponent(location.hash.slice(1)));
  });

  if (location.hash) {
    var initial = decodeURIComponent(location.hash.slice(1));
    /* Wait one frame so the page has its final layout before scrolling. */
    requestAnimationFrame(function () { openTarget(initial); });
  }
}

function setup(container) {
  var tabs = Array.prototype.slice.call(container.querySelectorAll('[role="tab"]'));
  if (!tabs.length) return;
  container.classList.add("is-ready");
  activate(tabs, tabs[0], false);

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { activate(tabs, tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        activate(tabs, next, true);
      }
    });
  });
  container._tabs = tabs;
}

function activate(tabs, selected, focus) {
  tabs.forEach(function (tab) {
    var on = tab === selected;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    var panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (panel) panel.hidden = !on;
  });
  if (focus) selected.focus({ preventScroll: true });
  /* Keep the selected tab visible inside a tab bar that scrolls sideways,
     without moving the page itself. */
  var bar = selected.parentElement;
  if (bar.scrollWidth > bar.clientWidth) {
    var left = selected.offsetLeft - bar.offsetLeft;
    if (left < bar.scrollLeft) bar.scrollLeft = left;
    else if (left + selected.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollLeft = left + selected.offsetWidth - bar.clientWidth;
    }
  }
}

/* Opens the tab that contains #id and scrolls to it.
   Returns true when it handled the link (the target lives inside tabs). */
function openTarget(id) {
  if (!id) return false;
  var target = document.getElementById(id);
  if (!target) return false;
  var panel = target.closest('[role="tabpanel"]');
  if (!panel) return false;
  var container = panel.closest("[data-tabs]");
  var tabs = container && container._tabs;
  if (!tabs) return false;
  var tab = tabs.filter(function (t) { return t.getAttribute("aria-controls") === panel.id; })[0];
  if (tab) activate(tabs, tab, false);
  /* A whole panel scrolls to its tab bar; anything inside scrolls to itself. */
  var scrollTo = target === panel ? container : target;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scrollTo.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  return true;
}
