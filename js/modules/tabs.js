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
  addScrollHints(tabs[0].parentElement);
  addPagers(container, tabs);
  addSwipe(container, tabs);
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

var ARROW_LEFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>';
var ARROW_RIGHT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

/* Arrows and faded edges on a tab bar that is wider than the screen,
   so visitors can tell there are more tabs to the left or right. */
function addScrollHints(bar) {
  var wrap = document.createElement("div");
  wrap.className = "tablist-wrap reveal in-view";
  bar.parentNode.insertBefore(wrap, bar);
  wrap.appendChild(bar);
  bar.classList.remove("reveal");

  ["left", "right"].forEach(function (side) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-scroll tab-scroll-" + side;
    btn.tabIndex = -1;
    btn.setAttribute("aria-hidden", "true");
    btn.innerHTML = side === "left" ? ARROW_LEFT : ARROW_RIGHT;
    btn.addEventListener("click", function () {
      var step = Math.max(120, bar.clientWidth * 0.7);
      bar.scrollBy({ left: side === "left" ? -step : step, behavior: "smooth" });
    });
    wrap.appendChild(btn);
  });

  function update() {
    var max = bar.scrollWidth - bar.clientWidth;
    wrap.classList.toggle("more-left", bar.scrollLeft > 4);
    wrap.classList.toggle("more-right", bar.scrollLeft < max - 4);
  }
  bar.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  bar._updateHints = update;
  update();
}

/* "← Anterior · 2 de 4 · Siguiente →" at the end of each panel. */
function addPagers(container, tabs) {
  tabs.forEach(function (tab, i) {
    var panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (!panel) return;
    var prev = tabs[i - 1];
    var next = tabs[i + 1];
    var nav = document.createElement("nav");
    nav.className = "tab-pager";
    nav.setAttribute("aria-label", "Más secciones");
    nav.innerHTML =
      (prev ? '<button type="button" class="tab-pager-btn tab-pager-prev">' + ARROW_LEFT +
        '<span><small>Anterior</small>' + label(prev) + "</span></button>" : "<span></span>") +
      '<span class="tab-pager-dots" aria-hidden="true">' +
        tabs.map(function (_, k) { return '<i class="' + (k === i ? "on" : "") + '"></i>'; }).join("") +
      "</span>" +
      (next ? '<button type="button" class="tab-pager-btn tab-pager-next"><span><small>Siguiente</small>' +
        label(next) + "</span>" + ARROW_RIGHT + "</button>" : "<span></span>");
    panel.appendChild(nav);
    if (prev) nav.querySelector(".tab-pager-prev").addEventListener("click", function () { go(container, tabs, prev); });
    if (next) nav.querySelector(".tab-pager-next").addEventListener("click", function () { go(container, tabs, next); });
  });
}

function label(tab) {
  var name = tab.cloneNode(true);
  var count = name.querySelector(".tab-count");
  if (count) count.remove();
  return name.textContent.trim();
}

function go(container, tabs, tab) {
  activate(tabs, tab, false);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  container.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/* Swipe left/right on a panel to change tab (touch screens). */
function addSwipe(container, tabs) {
  var x = null, y = null;
  container.addEventListener("touchstart", function (e) {
    if (e.target.closest(".tablist, .viewer-thumbs")) { x = null; return; }
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  }, { passive: true });
  container.addEventListener("touchend", function (e) {
    if (x === null) return;
    var dx = e.changedTouches[0].clientX - x;
    var dy = e.changedTouches[0].clientY - y;
    x = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
    var current = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0];
    var i = tabs.indexOf(current) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < tabs.length) go(container, tabs, tabs[i]);
  });
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
  if (bar._updateHints) bar._updateHints();
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
