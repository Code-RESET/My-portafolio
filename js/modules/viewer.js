/* Shared image viewer (modal) used for app previews and documents.

   openViewer({
     title, meta,                 // header text
     images: [{ src, alt }],      // slides
     details: "<p>…</p>",         // optional HTML under the images (already escaped)
     viewOnly: true               // blocks the context menu on images (documents)
   })
*/

var backdrop, dialog, titleEl, metaEl, stage, imgEl, counterEl, prevBtn, nextBtn, thumbsEl, detailsEl, closeBtn;
var state = { images: [], index: 0, viewOnly: false, lastFocused: null };

export function initViewer() {
  backdrop = document.getElementById("viewer");
  if (!backdrop) return;
  dialog = backdrop.querySelector(".modal");
  titleEl = document.getElementById("viewerTitle");
  metaEl = document.getElementById("viewerMeta");
  stage = document.getElementById("viewerStage");
  imgEl = document.getElementById("viewerImage");
  counterEl = document.getElementById("viewerCounter");
  prevBtn = document.getElementById("viewerPrev");
  nextBtn = document.getElementById("viewerNext");
  thumbsEl = document.getElementById("viewerThumbs");
  detailsEl = document.getElementById("viewerDetails");
  closeBtn = document.getElementById("viewerClose");

  closeBtn.addEventListener("click", closeViewer);
  prevBtn.addEventListener("click", function () { show(state.index - 1); });
  nextBtn.addEventListener("click", function () { show(state.index + 1); });
  backdrop.addEventListener("click", function (e) { if (e.target === backdrop) closeViewer(); });
  stage.addEventListener("contextmenu", function (e) { if (state.viewOnly) e.preventDefault(); });

  document.addEventListener("keydown", function (e) {
    if (!isOpen()) return;
    if (e.key === "Escape") closeViewer();
    else if (e.key === "ArrowLeft") show(state.index - 1);
    else if (e.key === "ArrowRight") show(state.index + 1);
    else if (e.key === "Tab") trapFocus(e);
  });

  /* Swipe on touch screens */
  var startX = null;
  stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(state.index + (dx < 0 ? 1 : -1));
    startX = null;
  });
}

export function isOpen() {
  return !!backdrop && backdrop.classList.contains("open");
}

export function openViewer(opts) {
  if (!backdrop) return;
  state.images = opts.images || [];
  state.viewOnly = !!opts.viewOnly;
  state.lastFocused = document.activeElement;

  titleEl.textContent = opts.title || "";
  metaEl.textContent = opts.meta || "";
  metaEl.hidden = !opts.meta;
  detailsEl.innerHTML = opts.details || "";
  detailsEl.hidden = !opts.details;
  backdrop.classList.toggle("view-only", state.viewOnly);

  var multiple = state.images.length > 1;
  prevBtn.hidden = !multiple;
  nextBtn.hidden = !multiple;
  counterEl.hidden = !multiple;
  thumbsEl.hidden = !multiple;
  thumbsEl.innerHTML = "";
  if (multiple) {
    state.images.forEach(function (image, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "viewer-thumb";
      b.setAttribute("aria-label", "Ver imagen " + (i + 1));
      var t = document.createElement("img");
      t.src = image.src;
      t.alt = "";
      t.draggable = false;
      b.appendChild(t);
      b.addEventListener("click", function () { show(i); });
      thumbsEl.appendChild(b);
    });
  }

  show(opts.start || 0);
  backdrop.inert = false;
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  dialog.scrollTop = 0;
  closeBtn.focus();
}

export function closeViewer() {
  if (!isOpen()) return;
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.inert = true;
  document.body.style.overflow = "";
  imgEl.removeAttribute("src");
  if (state.lastFocused && state.lastFocused.focus) state.lastFocused.focus();
}

function show(i) {
  var n = state.images.length;
  if (!n) return;
  state.index = (i + n) % n;
  var image = state.images[state.index];
  imgEl.src = image.src;
  imgEl.alt = image.alt || "";
  counterEl.textContent = (state.index + 1) + " / " + n;
  thumbsEl.querySelectorAll(".viewer-thumb").forEach(function (t, k) {
    t.classList.toggle("active", k === state.index);
    if (k === state.index) t.setAttribute("aria-current", "true");
    else t.removeAttribute("aria-current");
  });
}

function trapFocus(e) {
  var focusable = Array.prototype.filter.call(
    dialog.querySelectorAll("button, a[href]"),
    function (el) { return !el.hidden && !el.disabled && el.offsetParent !== null; }
  );
  if (!focusable.length) return;
  var first = focusable[0];
  var last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
