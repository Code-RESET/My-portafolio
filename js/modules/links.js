/* Makes it obvious where each link goes:
   - Links to other sites (Facebook, LinkedIn, WhatsApp, my website) get an
     "opens elsewhere" arrow (↗) and a hidden note for screen readers.
   - Links to an image on this site (chat captures) open in the in-page
     viewer instead of leaving the page.
   Runs after contact.js, which builds the WhatsApp links. */
import { openViewer } from "./viewer.js?v=202610310102";

var EXTERNAL_ICON = '<svg class="ext-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

export function initLinks() {
  document.querySelectorAll("a[href]").forEach(function (link) {
    var url;
    try { url = new URL(link.href, location.href); } catch (e) { return; }

    if (url.origin === location.origin && /\.(jpe?g|png|webp)$/i.test(url.pathname) && link.dataset.title) {
      link.classList.add("is-preview");
      link.removeAttribute("target");
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openViewer({
          title: link.dataset.title,
          meta: link.dataset.meta || "",
          images: [{ src: link.getAttribute("href"), alt: link.dataset.title }]
        });
      });
      return;
    }

    if (url.origin !== location.origin && /^https?:$/.test(url.protocol)) {
      link.classList.add("is-external");
      if (!link.target) link.target = "_blank";
      if (!/noopener/.test(link.rel)) link.rel = (link.rel + " noopener").trim();
      link.insertAdjacentHTML("beforeend", EXTERNAL_ICON + '<span class="sr-only"> (se abre en otra página)</span>');
      var site = siteName(url.hostname);
      if (site && !link.title) link.title = "Abre " + site;
    }
  });
}

function siteName(host) {
  if (/facebook\.com$/.test(host)) return "Facebook";
  if (/linkedin\.com$/.test(host)) return "LinkedIn";
  if (/wa\.me$|whatsapp\.com$/.test(host)) return "WhatsApp";
  if (/github\.io$/.test(host)) return "otro sitio web";
  return "";
}
