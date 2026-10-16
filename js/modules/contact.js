/* Email, phone and WhatsApp links are assembled here instead of being
   written in the HTML, to make them harder for spam bots to collect. */

export function initContact() {
  var email = document.getElementById("emailLink");
  if (email) {
    var address = email.dataset.user + "@" + email.dataset.domain;
    email.href = "mailto:" + address;
    var emailText = document.getElementById("emailText");
    if (emailText) emailText.textContent = address;
  }

  var phone = document.getElementById("phoneLink");
  if (phone) {
    phone.href = "tel:+" + phone.dataset.cc + phone.dataset.num;
    var phoneText = document.getElementById("phoneText");
    if (phoneText) phoneText.textContent = phone.dataset.display;
  }

  document.querySelectorAll(".js-wa").forEach(function (link) {
    link.href = "https://wa.me/" + link.dataset.cc + link.dataset.num +
      "?text=" + encodeURIComponent(link.dataset.msg);
  });
}
