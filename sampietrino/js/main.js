/* =========================================================
   SAMPIETRINO — main.js
   Smooth scroll for anchor links. Nothing else.
   ========================================================= */

(function () {
  'use strict';

  // Smooth scroll for all internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;

      var target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Update URL without triggering scroll
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', '#' + targetId);
      }
    });
  });

})();
