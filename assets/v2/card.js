/* BYRAIN · карточки /v2: галерея, лайтбокс, этапы результата, липкая панель, избранное, пометки. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var page = $('[data-source-product-page]');
  if (!page) return;

  /* Галерея */
  var main = $('#gallery-main'), badge = $('#gallery-badge');
  var tabs = $$('[data-gallery] [role="tab"]');
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-selected') === 'true') return;
      tabs.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
      b.setAttribute('aria-selected', 'true');
      main.classList.add('is-fading');
      setTimeout(function () {
        main.src = b.dataset.src;
        if (b.dataset.alt) main.alt = b.dataset.alt;
        if (badge) badge.textContent = b.dataset.cap;
        main.onload = function () { main.classList.remove('is-fading'); };
      }, 180);
    });
  });

  /* Лайтбокс галереи */
  var lb = $('#lightbox'), lbImg = $('#lightbox-img'), lbCap = $('#lightbox-cap'), cur = 0, lastFocus = null;
  function showLb(i) {
    cur = (i + tabs.length) % tabs.length;
    var b = tabs[cur]; lbImg.src = b.dataset.src; lbImg.alt = b.dataset.alt || ''; lbCap.textContent = (cur + 1) + ' / ' + tabs.length + ' · ' + b.dataset.cap;
  }
  function openLb() { lastFocus = document.activeElement; var i = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; }); showLb(i < 0 ? 0 : i); lb.hidden = false; document.body.style.overflow = 'hidden'; $('[data-lightbox-close]').focus(); }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  if (lb && tabs.length) {
    $$('[data-lightbox-open]').forEach(function (b) { b.addEventListener('click', openLb); });
    $('[data-lightbox-close]').addEventListener('click', closeLb);
    $('[data-lightbox-prev]').addEventListener('click', function () { showLb(cur - 1); });
    $('[data-lightbox-next]').addEventListener('click', function () { showLb(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') showLb(cur - 1); if (e.key === 'ArrowRight') showLb(cur + 1); });
    var sx = null; lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showLb(cur + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* Этапы результата: клик и автопрокрутка, пока блок виден */
  var stages = $$('[data-stages] .stage'), stageTimer = null, idx = 0;
  function setStage(i) { idx = i; stages.forEach(function (s, n) { s.classList.toggle('is-active', n === i); }); }
  stages.forEach(function (s, i) {
    s.addEventListener('click', function () { setStage(i); restart(); });
    s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStage(i); restart(); } });
  });
  function restart() { clearInterval(stageTimer); stageTimer = setInterval(function () { setStage((idx + 1) % stages.length); }, 4200); }
  if (stages.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) restart(); else clearInterval(stageTimer); }); }, { threshold: 0.4 });
    so.observe($('[data-stages]'));
  }

  /* Нижняя панель покупки появляется после первого экрана */
  var sticky = $('#sticky'), hero = $('.card-v2 .hero');
  if (sticky && hero) {
    var ho = new IntersectionObserver(function (es) {
      var on = !es[0].isIntersecting && es[0].boundingClientRect.top < 0;
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', String(!on));
    }, { threshold: 0, rootMargin: '-120px 0px 0px 0px' });
    ho.observe(hero);
  }

  /* Избранное: тот же ключ, что и на старой карточке */
  var toast = $('#toast'), tt = null;
  function say(msg) { if (!toast) return; toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('is-on'); }, 2600); }
  var favKey = 'byrain-favorite-' + (page.dataset.productSlug || 'product');
  var favs = $$('[data-product-favorite]', page);
  function paintFav(on) { favs.forEach(function (b) { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); b.style.background = on ? 'var(--field)' : ''; }); }
  function setFav(on) { paintFav(on); try { localStorage.setItem(favKey, String(on)); } catch (e) {} }
  var favOn = false; try { favOn = localStorage.getItem(favKey) === 'true'; } catch (e) {}
  paintFav(favOn);
  favs.forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; setFav(on); say(on ? 'Добавлено в избранное' : 'Убрано из избранного'); }); });

  /* Появление секций */
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { ro.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }

  /* FAQ: открыт один вопрос за раз */
  var ds = $$('.faq details');
  ds.forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) ds.forEach(function (o) { if (o !== d) o.open = false; }); }); });
})();

/* Карусель результатов: точки на мобильном */
(function () {
  var gal = document.querySelector('[data-rgal]'), dots = document.querySelector('[data-rgal-dots]'); if (!gal || !dots) return;
  var items = Array.prototype.slice.call(gal.children);
  items.forEach(function (_, i) { var d = document.createElement('i'); if (i === 0) d.className = 'is-on'; dots.appendChild(d); });
  var ds = Array.prototype.slice.call(dots.children), raf = 0;
  function update() {
    raf = 0; var best = 0, bd = Infinity, c = gal.scrollLeft + gal.clientWidth / 2;
    items.forEach(function (it, i) { var m = it.offsetLeft + it.offsetWidth / 2, d = Math.abs(m - c); if (d < bd) { bd = d; best = i; } });
    ds.forEach(function (d, n) { d.classList.toggle('is-on', n === best); });
  }
  gal.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update); update();
})();

/* Раскрытие details: явный обработчик (Safari) и ссылка «Полный состав INCI» */
(function () {
  document.querySelectorAll('.v2 details > summary').forEach(function (s) {
    s.addEventListener('click', function (e) { e.preventDefault(); var d = s.parentNode; d.open = !d.open; });
  });
  document.querySelectorAll('a[href="#inci"]').forEach(function (a) {
    a.addEventListener('click', function () { var d = document.getElementById('inci'); if (d && d.tagName === 'DETAILS') d.open = true; });
  });
})();
