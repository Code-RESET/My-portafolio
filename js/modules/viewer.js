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
    else if (e.key === "ArrowLeft") show(state.index - 1, { instant: true });
    else if (e.key === "ArrowRight") show(state.index + 1, { instant: true });
    else if (e.key === "Tab") trapFocus(e);
  });

  /* Swipe on touch screens: the image follows the finger, and a quick
     flick is enough to change it (no need to drag far). */
  var startX = null, startY = null, startTime = 0, dx = 0, horizontal = null;
  stage.addEventListener("touchstart", function (e) {
    if (startX !== null || e.touches.length > 1 || state.images.length < 2) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    dx = 0;
    horizontal = null;
  }, { passive: true });
  stage.addEventListener("touchmove", function (e) {
    if (startX === null) return;
    var mx = e.touches[0].clientX - startX;
    var my = e.touches[0].clientY - startY;
    if (horizontal === null && (Math.abs(mx) > 6 || Math.abs(my) > 6)) horizontal = Math.abs(mx) > Math.abs(my);
    if (!horizontal) return;
    dx = mx;
    imgEl.classList.add("is-dragging");
    imgEl.style.transform = "translateX(" + dx + "px)";
  }, { passive: true });
  function endSwipe() {
    if (startX === null) return;
    var velocity = Math.abs(dx) / Math.max(1, Date.now() - startTime);
    var go = horizontal && (Math.abs(dx) > 60 || (Math.abs(dx) > 10 && velocity > 0.11));
    imgEl.classList.remove("is-dragging");
    imgEl.style.transform = "";
    if (go) show(state.index + (dx < 0 ? 1 : -1), { from: dx < 0 ? 1 : -1 });
    startX = null;
  }
  stage.addEventListener("touchend", endSwipe);
  stage.addEventListener("touchcancel", endSwipe);
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

/* Changes the slide. Clicks and swipes get a short fade (and slide in from
   the swipe side); keyboard arrows change instantly, since they repeat fast. */
function show(i, opts) {
  opts = opts || {};
  var n = state.images.length;
  if (!n) return;
  state.index = (i + n) % n;
  var image = state.images[state.index];
  if (imgEl.getAttribute("src") !== image.src) {
    var animate = !opts.instant && isOpen() &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) {
      imgEl.classList.add("is-swapping");
      imgEl.style.transform = opts.from ? "translateX(" + (opts.from * 24) + "px)" : "scale(0.98)";
      var reveal = function () {
        imgEl.onload = imgEl.onerror = null;
        void imgEl.offsetWidth; /* commit the start state before animating */
        imgEl.classList.remove("is-swapping");
        imgEl.style.transform = "";
      };
      imgEl.onload = imgEl.onerror = reveal;
      imgEl.src = image.src;
      if (imgEl.complete) reveal();
    } else {
      imgEl.onload = imgEl.onerror = null;
      imgEl.classList.remove("is-swapping");
      imgEl.style.transform = "";
      imgEl.src = image.src;
    }
  }
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
