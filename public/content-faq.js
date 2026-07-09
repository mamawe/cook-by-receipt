// Shared FAQ accordion — CSP-safe (no inline onclick handlers)
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.fc-faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      q.classList.toggle('open');
      var next = q.nextElementSibling;
      if (next) next.classList.toggle('open');
    });
  });
});
