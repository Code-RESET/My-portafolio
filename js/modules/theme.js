/* Light / dark theme toggle. Remembers the choice in this browser.
   The saved theme is applied by a small script in the <head> before the
   page paints; this module only handles the button. */
import { safeGet, safeSet } from "./utils.js?v=202611130515";

var STORAGE_KEY = "ldb_portfolio_theme";

export function initTheme() {
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var saved = safeGet(STORAGE_KEY);
  if (saved) root.setAttribute("data-theme", saved);
  if (!toggle) return;

  var media = window.matchMedia("(prefers-color-scheme: dark)");
  function effective() {
    return root.getAttribute("data-theme") || (media.matches ? "dark" : "light");
  }
  function updateLabel() {
    var dark = effective() === "dark";
    toggle.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
  }

  toggle.addEventListener("click", function () {
    var next = effective() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    safeSet(STORAGE_KEY, next);
    updateLabel();
  });
  if (media.addEventListener) media.addEventListener("change", updateLabel);
  updateLabel();
}
