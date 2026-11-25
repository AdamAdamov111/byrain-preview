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

  /* Фильтр статей по темам и постепенный показ: сначала одна страница карточек, остальные по кнопке */
  var grid = document.querySelector('[data-cards]');
  var filters = $$('.blog-filters [data-filter]'), cards = $$('[data-cards] .card');
  var moreWrap = document.querySelector('[data-more-wrap]'), more = document.querySelector('[data-more]'), left = document.querySelector('[data-more-left]');
  var page = grid ? parseInt(grid.getAttribute('data-page'), 10) || 12 : 12, shown = page, current = 'all';
  function applyCards() {
    var total = 0, visible = 0;
    cards.forEach(function (c) {
      var match = current === 'all' || c.getAttribute('data-category') === current;
      if (match) total++;
      var show = match && visible < shown;
      if (show) visible++;
      c.hidden = !show;
    });
    if (moreWrap) {
      moreWrap.hidden = total <= visible;
      if (left) left.textContent = String(total - visible);
    }
  }
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      current = b.getAttribute('data-filter'); shown = page;
      filters.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      applyCards();
    });
  });
  if (more) more.addEventListener('click', function () { shown += page; applyCards(); });

  /* FAQ: открыт один вопрос за раз */
  var ds = $$('.art-faq details');
  ds.forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) ds.forEach(function (o) { if (o !== d) o.open = false; }); }); });
})();
