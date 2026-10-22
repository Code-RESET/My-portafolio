/* Light / dark theme toggle. Remembers the choice in this browser. */
import { safeGet, safeSet } from "./utils.js?v=202610220440";

var STORAGE_KEY = "ldb_portfolio_theme";

export function initTheme() {
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var saved = safeGet(STORAGE_KEY);
  if (saved) root.setAttribute("data-theme", saved);
  if (!toggle) return;

  toggle.addEventListener("click", function () {
    var current = root.getAttribute("data-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var effective = current || (prefersDark ? "dark" : "light");
    var next = effective === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    safeSet(STORAGE_KEY, next);
  });
}
