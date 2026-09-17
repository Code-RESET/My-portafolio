(function () {
  "use strict";

  var STORAGE_THEME = "ldb_portfolio_theme";
  var STORAGE_DOCS = "ldb_portfolio_custom_docs";
  var STORAGE_HIDDEN = "ldb_portfolio_hidden_docs";
  var MAX_FILE_BYTES = 4 * 1024 * 1024;

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- CONTACT INFO (assembled at runtime to deter scraping) ---------- */
  var emailLink = document.getElementById("emailLink");
  var email = emailLink.dataset.user + "@" + emailLink.dataset.domain;
  emailLink.href = "mailto:" + email;
  document.getElementById("emailText").textContent = email;

  var phoneLink = document.getElementById("phoneLink");
  phoneLink.href = "tel:+" + phoneLink.dataset.cc + phoneLink.dataset.num;
  document.getElementById("phoneText").textContent = phoneLink.dataset.display;

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
  var docGrid = document.getElementById("docGrid");
  var docFilters = document.getElementById("docFilters");
  var hiddenNotice = document.getElementById("hiddenNotice");
  var activeFilter = "todos";
  var staticDocs = [];
  var customDocs = loadCustomDocs();
  var hiddenIds = loadHiddenIds();

  fetch("data/documents.json")
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (data) {
      staticDocs = data || [];
      renderDocs();
    })
    .catch(function () {
      staticDocs = [];
      renderDocs();
    });

  docFilters.addEventListener("click", function (e) {
    var btn = e.target.closest(".filter-chip");
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    docFilters.querySelectorAll(".filter-chip").forEach(function (c) {
      c.classList.toggle("active", c === btn);
    });
    renderDocs();
  });

  function renderDocs() {
    var all = customDocs.concat(staticDocs).filter(function (d) { return hiddenIds.indexOf(d.id) === -1; });
    var filtered = activeFilter === "todos" ? all : all.filter(function (d) { return d.category === activeFilter; });
    docGrid.innerHTML = "";
    filtered.forEach(function (doc) {
      docGrid.appendChild(buildDocCard(doc));
    });
    renderHiddenNotice();
  }

  function renderHiddenNotice() {
    if (!hiddenIds.length) {
      hiddenNotice.hidden = true;
      hiddenNotice.innerHTML = "";
      return;
    }
    hiddenNotice.hidden = false;
    var label = hiddenIds.length === 1 ? "1 documento oculto" : hiddenIds.length + " documentos ocultos";
    hiddenNotice.innerHTML = "<span>" + label + "</span>";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Mostrar de nuevo";
    btn.addEventListener("click", function () {
      hiddenIds = [];
      saveHiddenIds(hiddenIds);
      renderDocs();
    });
    hiddenNotice.appendChild(btn);
  }

  function buildDocCard(doc) {
    var card = document.createElement("div");
    card.className = "doc-card reveal in-view";

    var thumbWrap = document.createElement("div");
    if (doc.thumb) {
      thumbWrap.className = "doc-thumb";
      var img = document.createElement("img");
      img.src = doc.thumb;
      img.alt = doc.title;
      img.loading = "lazy";
      thumbWrap.appendChild(img);
    } else {
      thumbWrap.className = "doc-thumb no-image";
      thumbWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6"/></svg>';
    }
    if (doc.isLocal) {
      var badge = document.createElement("span");
      badge.className = "doc-badge local";
      badge.textContent = "Local";
      thumbWrap.appendChild(badge);
    }

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "doc-remove";
    removeBtn.setAttribute("aria-label", "Quitar documento");
    removeBtn.title = "Quitar documento";
    removeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      removeDocument(doc);
    });
    thumbWrap.appendChild(removeBtn);

    card.appendChild(thumbWrap);

    var info = document.createElement("div");
    info.className = "doc-info";
    info.innerHTML =
      "<h3>" + escapeHtml(doc.title) + "</h3>" +
      "<span class=\"doc-issuer\">" + escapeHtml(doc.issuer) + "</span>" +
      "<span class=\"doc-date\">" + escapeHtml(doc.dateLabel || formatDate(doc.date)) + "</span>";
    card.appendChild(info);

    card.addEventListener("click", function () { openLightbox(doc); });
    return card;
  }

  function removeDocument(doc) {
    if (doc.isLocal) {
      customDocs = customDocs.filter(function (d) { return d.id !== doc.id; });
      saveCustomDocs(customDocs);
    } else if (hiddenIds.indexOf(doc.id) === -1) {
      hiddenIds.push(doc.id);
      saveHiddenIds(hiddenIds);
    }
    renderDocs();
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

  function openLightbox(doc) {
    lightboxTitle.textContent = doc.title;
    lightboxMeta.textContent = doc.issuer + " · " + (doc.dateLabel || formatDate(doc.date));
    lightboxFrame.src = doc.file;
    lightboxDownload.href = doc.file;
    lightboxDownload.setAttribute("download", (doc.title || "documento") + ".pdf");
    openModal(lightbox);
  }

  lightboxClose.addEventListener("click", function () { closeModal(lightbox); lightboxFrame.src = ""; });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) { closeModal(lightbox); lightboxFrame.src = ""; } });

  /* ---------- UPLOAD MODAL ---------- */
  var uploadModal = document.getElementById("uploadModal");
  var openUploadBtn = document.getElementById("openUpload");
  var uploadClose = document.getElementById("uploadClose");
  var uploadForm = document.getElementById("uploadForm");
  var uploadError = document.getElementById("uploadError");
  var fileDrop = document.getElementById("fileDrop");
  var fileInput = document.getElementById("docFile");
  var fileDropLabel = document.getElementById("fileDropLabel");
  var exportBtn = document.getElementById("exportCatalog");
  var uploadedListEl = document.getElementById("uploadedList");

  openUploadBtn.addEventListener("click", function () { openModal(uploadModal); renderUploadedList(); });
  openUploadBtn.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openUploadBtn.click(); }
  });
  uploadClose.addEventListener("click", function () { closeModal(uploadModal); });
  uploadModal.addEventListener("click", function (e) { if (e.target === uploadModal) closeModal(uploadModal); });

  fileInput.addEventListener("change", function () {
    var file = fileInput.files[0];
    fileDropLabel.textContent = file ? file.name : "Arrastra un archivo aquí o haz clic para seleccionarlo (PDF o imagen, máx. 4 MB)";
  });
  ["dragover", "dragleave", "drop"].forEach(function (evt) {
    fileDrop.addEventListener(evt, function (e) {
      e.preventDefault();
      fileDrop.classList.toggle("dragover", evt === "dragover");
    });
  });
  fileDrop.addEventListener("drop", function (e) {
    var files = e.dataTransfer.files;
    if (files && files[0]) {
      fileInput.files = files;
      fileDropLabel.textContent = files[0].name;
    }
  });

  uploadForm.addEventListener("submit", function (e) {
    e.preventDefault();
    uploadError.textContent = "";

    var file = fileInput.files[0];
    var title = document.getElementById("docTitle").value.trim();
    var issuer = document.getElementById("docIssuer").value.trim();
    var date = document.getElementById("docDate").value;
    var category = document.getElementById("docCategory").value;

    if (!file) { uploadError.textContent = "Selecciona un archivo."; return; }
    if (file.size > MAX_FILE_BYTES) {
      uploadError.textContent = "El archivo supera 4 MB. Comprime el PDF o reduce la calidad de la imagen.";
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      var isImage = /^image\//.test(file.type);
      var newDoc = {
        id: "local-" + Date.now(),
        title: title,
        issuer: issuer,
        date: date,
        category: category,
        file: reader.result,
        thumb: isImage ? reader.result : null,
        fileName: file.name,
        isLocal: true
      };
      customDocs.unshift(newDoc);
      saveCustomDocs(customDocs);
      renderDocs();
      renderUploadedList();
      uploadForm.reset();
      fileDropLabel.textContent = "Arrastra un archivo aquí o haz clic para seleccionarlo (PDF o imagen, máx. 4 MB)";
    };
    reader.onerror = function () {
      uploadError.textContent = "No se pudo leer el archivo. Intenta de nuevo.";
    };
    reader.readAsDataURL(file);
  });

  function renderUploadedList() {
    uploadedListEl.innerHTML = "";
    if (!customDocs.length) return;
    var heading = document.createElement("p");
    heading.style.fontSize = "13px";
    heading.style.fontWeight = "600";
    heading.style.color = "var(--text-soft)";
    heading.textContent = "Documentos guardados en este navegador";
    uploadedListEl.appendChild(heading);

    customDocs.forEach(function (doc) {
      var row = document.createElement("div");
      row.className = "uploaded-row";
      var label = document.createElement("span");
      label.textContent = doc.title + " — " + doc.issuer;
      var del = document.createElement("button");
      del.type = "button";
      del.textContent = "Eliminar";
      del.addEventListener("click", function () {
        customDocs = customDocs.filter(function (d) { return d.id !== doc.id; });
        saveCustomDocs(customDocs);
        renderDocs();
        renderUploadedList();
      });
      row.appendChild(label);
      row.appendChild(del);
      uploadedListEl.appendChild(row);
    });
  }

  exportBtn.addEventListener("click", function () {
    var merged = customDocs.map(function (d) {
      return {
        id: d.id, title: d.title, issuer: d.issuer, date: d.date,
        category: d.category, file: "assets/documents/" + (d.fileName || d.id + ".pdf"),
        thumb: "assets/thumbs/" + (d.fileName || d.id) + ".jpg",
        note: "Reemplaza estas rutas por los archivos definitivos en assets/ antes de publicar."
      };
    }).concat(staticDocs);
    var blob = new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "documents.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ---------- MODAL HELPERS ---------- */
  function openModal(el) {
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal(el) {
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      [lightbox, uploadModal].forEach(function (m) {
        if (m.classList.contains("open")) closeModal(m);
      });
      lightboxFrame.src = "";
    }
  });

  /* ---------- STORAGE HELPERS ---------- */
  function loadCustomDocs() {
    try {
      var raw = localStorage.getItem(STORAGE_DOCS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveCustomDocs(docs) {
    try { localStorage.setItem(STORAGE_DOCS, JSON.stringify(docs)); } catch (e) { /* storage unavailable or full */ }
  }
  function loadHiddenIds() {
    try {
      var raw = localStorage.getItem(STORAGE_HIDDEN);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveHiddenIds(ids) {
    try { localStorage.setItem(STORAGE_HIDDEN, JSON.stringify(ids)); } catch (e) { /* storage unavailable or full */ }
  }
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }
})();
