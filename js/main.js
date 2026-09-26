(function () {
  "use strict";

  var STORAGE_THEME = "ldb_portfolio_theme";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- CONTACT INFO (assembled at runtime to deter scraping) ---------- */
  var emailLink = document.getElementById("emailLink");
  var email = emailLink.dataset.user + "@" + emailLink.dataset.domain;
  emailLink.href = "mailto:" + email;
  document.getElementById("emailText").textContent = email;

  var phoneLink = document.getElementById("phoneLink");
  phoneLink.href = "tel:+" + phoneLink.dataset.cc + phoneLink.dataset.num;
  document.getElementById("phoneText").textContent = phoneLink.dataset.display;

  document.querySelectorAll(".js-wa").forEach(function (link) {
    link.href = "https://wa.me/" + link.dataset.cc + link.dataset.num +
      "?text=" + encodeURIComponent(link.dataset.msg);
  });

  /* ---------- THEME ---------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");
  var savedTheme = safeGet(STORAGE_THEME);
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", function () {
    var current = root.getAttribute("data-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var effectiveCurrent = current || (prefersDark ? "dark" : "light");
    var next = effectiveCurrent === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    safeSet(STORAGE_THEME, next);
  });

  /* ---------- NAV ---------- */
  var navbar = document.getElementById("navbar");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  window.addEventListener("scroll", function () {
    navbar.classList.toggle("scrolled", window.scrollY > 8);
  });

  navToggle.addEventListener("click", function () {
    var isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- SCROLL REVEAL ---------- */
  var revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- DOCUMENTS ---------- */
  var FEATURED_DOCS = 8;
  var docGrid = document.getElementById("docGrid");
  var docMore = document.getElementById("docMore");
  var showAllDocs = false;
  var docs = [];

  fetch("data/documents.json")
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (data) {
      docs = data || [];
      renderDocs();
    })
    .catch(function () {
      docs = [];
      renderDocs();
    });

  docMore.addEventListener("click", function () {
    showAllDocs = !showAllDocs;
    renderDocs();
    if (!showAllDocs) document.getElementById("documentos").scrollIntoView();
  });

  function renderDocs() {
    var visible = showAllDocs ? docs : docs.slice(0, FEATURED_DOCS);
    docGrid.innerHTML = "";
    visible.forEach(function (doc) {
      docGrid.appendChild(buildDocCard(doc));
    });
    docMore.hidden = docs.length <= FEATURED_DOCS;
    docMore.textContent = showAllDocs ? "Mostrar menos" : "Ver los " + docs.length + " documentos";
    docMore.setAttribute("aria-expanded", String(showAllDocs));
  }

  function buildDocCard(doc) {
    var card = document.createElement("div");
    card.className = "doc-card reveal in-view";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Ver " + doc.title);

    var thumbWrap = document.createElement("div");
    thumbWrap.className = "doc-thumb";
    var img = document.createElement("img");
    img.src = doc.thumb;
    img.alt = "";
    img.loading = "lazy";
    thumbWrap.appendChild(img);
    card.appendChild(thumbWrap);

    var info = document.createElement("div");
    info.className = "doc-info";
    info.innerHTML =
      "<h3>" + escapeHtml(doc.title) + "</h3>" +
      "<span class=\"doc-issuer\">" + escapeHtml(doc.issuer) + "</span>" +
      "<span class=\"doc-date\">" + escapeHtml(doc.dateLabel || formatDate(doc.date)) + "</span>";
    card.appendChild(info);

    card.addEventListener("click", function () { openLightbox(doc); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(doc); }
    });
    return card;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("es-MX", { year: "numeric", month: "long" });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  /* ---------- LIGHTBOX ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxFrame = document.getElementById("lightboxFrame");
  var lightboxTitle = document.getElementById("lightboxTitle");
  var lightboxMeta = document.getElementById("lightboxMeta");
  var lightboxDownload = document.getElementById("lightboxDownload");
  var lightboxClose = document.getElementById("lightboxClose");
  var lastFocused = null;

  function openLightbox(doc) {
    lastFocused = document.activeElement;
    lightboxTitle.textContent = doc.title;
    lightboxMeta.textContent = doc.issuer + " · " + (doc.dateLabel || formatDate(doc.date));
    lightboxFrame.src = doc.file;
    lightboxDownload.href = doc.file;
    lightboxDownload.setAttribute("download", (doc.title || "documento") + ".pdf");
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxFrame.src = "";
    if (lastFocused) lastFocused.focus();
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
  });

  /* ---------- STORAGE HELPERS ---------- */
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }
})();
