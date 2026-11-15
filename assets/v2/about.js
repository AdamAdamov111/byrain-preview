/* BYRAIN · о бренде v2: появление блоков, разбивка заголовков, счётчики, параллакс героя, прогресс шагов */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Заголовки по словам */
  $$('[data-split]').forEach(function (h) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; s.style.setProperty('--wd', (i++ * 0.04) + 's'); frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    }
    walk(h);
    h.classList.add('is-split');
  });

  /* Появление */
  var targets = $$('.reveal, .is-split, .ab-hero');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } }); }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
    targets.forEach(function (el) { ro.observe(el); });
    var hero = $('.ab-hero'); if (hero) setTimeout(function () { hero.classList.add('is-in'); }, 80);
  } else { targets.forEach(function (el) { el.classList.add('is-in'); }); }

  /* Параллакс героя */
  var bg = $('.ab-hero__bg img');
  if (bg && !reduce) {
    window.addEventListener('scroll', function () { var y = window.scrollY; if (y < 1400) bg.style.setProperty('--py', (y * 0.16) + 'px'); }, { passive: true });
  }

  /* Счётчики */
  $$('[data-count]').forEach(function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10), done = false;
    if (!('IntersectionObserver' in window) || reduce) { el.textContent = end; return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || done) return; done = true;
        var t0 = null;
        (function tick(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(performance.now());
      });
    }, { threshold: 0.5 });
    o.observe(el);
  });

  /* Прогресс горизонтальной ленты шагов на мобильном */
  var steps = $('[data-steps]'), bar = $('[data-steps-bar]');
  if (steps && bar) {
    var upd = function () { var max = steps.scrollWidth - steps.clientWidth; if (max <= 0) { bar.style.setProperty('--x', '0'); return; } var p = steps.scrollLeft / max; bar.style.setProperty('--x', (p * 300) + '%'); };
    steps.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  }
})();
