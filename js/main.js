/* Entry point. Each section of the page lives in its own module in js/modules/.
   After changing any CSS/JS file run:  python3 tools/bump_version.py  */
import { initTheme } from "./modules/theme.js?v=202611120410";
import { initNav } from "./modules/nav.js?v=202611120410";
import { initTabs } from "./modules/tabs.js?v=202611120410";
import { initReveal } from "./modules/reveal.js?v=202611120410";
import { initContact } from "./modules/contact.js?v=202611120410";
import { initViewer } from "./modules/viewer.js?v=202611120410";
import { initLinks } from "./modules/links.js?v=202611120410";
import { initApps } from "./modules/apps.js?v=202611120410";
import { initDocuments } from "./modules/documents.js?v=202611120410";

var year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

initTheme();
initNav();
initTabs();
initReveal();
initContact();
initLinks();
initViewer();
initApps();
initDocuments();
