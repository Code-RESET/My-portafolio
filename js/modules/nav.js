/* Top navigation: shadow on scroll and the mobile menu. */

export function initNav() {
  var navbar = document.getElementById("navbar");
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (!navbar || !toggle || !links) return;

  window.addEventListener("scroll", function () {
    navbar.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  function close() {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    var isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", close);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && links.classList.contains("open")) {
      close();
      toggle.focus();
    }
  });
}
