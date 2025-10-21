//utility to quickly create DOM elements - pass the object type + and object with its attributes (class, name, id, etc) in key value pairs
function createNode(object, attributes) {
  const el = document.createElement(object);
  for (let key in attributes) {
    el.setAttribute(key, attributes[key]);
  }
  return el;
}

$(document).ready(function () {
  // privacy modal
  $("#privacyModal").on("show.bs.modal", function (e) {
    const button = $(e.relatedTarget);
    const modal = $(this);
    modal.find(".modal-body").load(button.data("remote"));
  });

  // charitable solicitation modal
  $("#csModal").on("show.bs.modal", function (e) {
    const button = $(e.relatedTarget);
    const modal = $(this);
    modal.find(".modal-body").load(button.data("remote"));
  });

  // terms modal
  $("#termsModal").on("show.bs.modal", function (e) {
    const button = $(e.relatedTarget);
    const modal = $(this);
    modal.find(".modal-body").load(button.data("remote"));
    const openModal = $(".show");
    openModal.removeClass("show");
    openModal.hide();
    const body = document.getElementsByTagName("body")[0];
    $(body).addClass("modal-open");
  });
});
