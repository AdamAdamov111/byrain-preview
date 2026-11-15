/* BYRAIN · блог: появление блоков, активный пункт оглавления, фильтр по темам */
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } }); }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { ro.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }

  /* Оглавление: подсвечиваем раздел, который читают */
  var toc = document.querySelector('[data-toc]');
  if (toc) {
    var links = $$('a', toc), heads = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var setActive = function () {
      var y = window.scrollY + 140, best = null;
      heads.forEach(function (h) { if (h.offsetTop <= y) best = h; });
      links.forEach(function (a) { a.classList.toggle('is-on', !!best && a.getAttribute('href') === '#' + best.id); });
    };
    window.addEventListener('scroll', setActive, { passive: true }); setActive();
  }

  /* Фильтр статей по темам */
  var filters = $$('.blog-filters [data-filter]'), cards = $$('[data-cards] .card');
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      filters.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      cards.forEach(function (c) { c.hidden = !(f === 'all' || c.getAttribute('data-category') === f); });
    });
  });

  /* FAQ: открыт один вопрос за раз */
  var ds = $$('.art-faq details');
  ds.forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) ds.forEach(function (o) { if (o !== d) o.open = false; }); }); });
})();
