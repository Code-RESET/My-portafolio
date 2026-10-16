/* Shared helpers used by every module. */

export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Loads a JSON file from /data. Returns [] if it is missing or broken,
   so one bad file never breaks the rest of the page. */
export function fetchJSON(url) {
  return fetch(url, { cache: "no-cache" })
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (data) { return Array.isArray(data) ? data : []; })
    .catch(function () { return []; });
}

export function safeGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

export function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
}

export function formatMonth(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "long" });
}

/* Fills every [data-count="name"] with the given number,
   so counts in the text always match the data files. */
export function setCount(name, value) {
  document.querySelectorAll('[data-count="' + name + '"]').forEach(function (el) {
    el.textContent = value;
  });
}

export function scrollToSection(el) {
  if (!el) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
