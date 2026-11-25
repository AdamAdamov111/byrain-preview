/* BYRAIN · главная v2: карусель, появление блоков, счётчики, видео экспертов */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Появление */
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { ro.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }

  /* Герой-карусель: прокрутка со снапом, точки, автоплей */
  var hero = $('[data-hero]');
  if (hero) {
    var track = $('[data-hero-track]', hero), slides = $$('[data-hero-slide]', hero), dots = $('[data-hero-dots]', hero), count = $('[data-hero-count]', hero);
    var idx = 0, timer = null, DUR = 6500, hold = false, manual = false;
    /* На сенсорных экранах лента overflow:hidden и двигается transform-ом: нативный скролл со снапом на iOS мешал листать страницу вниз */
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    slides.forEach(function (_, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', 'Слайд ' + (i + 1));
      b.innerHTML = '<i></i>'; b.addEventListener('click', function () { go(i, true); }); dots.appendChild(b);
    });
    var ds = $$('button', dots);
    function paint() {
      ds.forEach(function (d, n) { d.setAttribute('aria-selected', String(n === idx)); d.classList.toggle('is-on', n === idx); });
      if (count) count.textContent = ('0' + (idx + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
      hero.setAttribute('data-slide', String(idx));
    }
    /* На сенсорных экранах высота ленты равна высоте текущего слайда: иначе короткие слайды тянутся до самого длинного и под кнопками остаётся пустота */
    function fit() { if (coarse) track.style.height = slides[idx].offsetHeight + 'px'; }
    function go(i, user) {
      idx = (i + slides.length) % slides.length;
      if (coarse) track.style.transform = 'translate3d(' + (-idx * 100) + '%,0,0)';
      else track.scrollTo({ left: slides[idx].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      paint(); fit(); if (user) stop(); else restart();
    }
    if (coarse) {
      fit(); window.addEventListener('resize', fit); window.addEventListener('load', fit);
      if ('ResizeObserver' in window) { var fitObs = new ResizeObserver(function () { fit(); }); slides.forEach(function (s) { fitObs.observe(s); }); }
    }
    /* после свайпа, точки или стрелки автоплей не возобновляется: слайдами управляет человек */
    function stop() { manual = true; clearInterval(timer); timer = null; ds.forEach(function (d) { d.classList.remove('is-anim'); }); }
    function restart() { if (manual) return; clearInterval(timer); timer = setInterval(function () { if (!hold && !document.hidden) go(idx + 1); }, DUR); hero.style.setProperty('--dur', DUR + 'ms'); ds.forEach(function (d) { d.classList.remove('is-anim'); void d.offsetWidth; }); ds[idx].classList.add('is-anim'); }
    $('[data-hero-prev]', hero).addEventListener('click', function () { go(idx - 1, true); });
    $('[data-hero-next]', hero).addEventListener('click', function () { go(idx + 1, true); });
    var raf = 0;
    /* На сенсорных экранах overflow:hidden стоит на секции (обрезка не должна ехать вместе с лентой): скролл там бывает только от фокуса с клавиатуры, переводим его в сдвиг transform */
    if (coarse) hero.addEventListener('scroll', function () { var l = hero.scrollLeft; if (l) { hero.scrollLeft = 0; go(idx + Math.round(l / hero.clientWidth), true); } }, { passive: true });
    else track.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var c = track.scrollLeft + track.clientWidth / 2, best = 0, bd = Infinity;
        slides.forEach(function (s, i) { var m = s.offsetLeft + s.offsetWidth / 2, d = Math.abs(m - c); if (d < bd) { bd = d; best = i; } });
        if (best !== idx) { idx = best; paint(); restart(); }
      });
    }, { passive: true });
    ['pointerdown', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, function () { hold = true; }, { passive: true }); });
    ['pointerup', 'touchend', 'pointercancel'].forEach(function (ev) { track.addEventListener(ev, function () { hold = false; restart(); }, { passive: true }); });
    /* Свайп: касанием лента не прокручивается (на сенсорных экранах overflow:hidden, на остальных touch-action:pan-y); слайды переключаем сами */
    var tx = 0, ty = 0, lx = 0, ly = 0, swiping = false;
    track.addEventListener('touchstart', function (e) { var t = e.touches[0]; tx = lx = t.clientX; ty = ly = t.clientY; swiping = true; }, { passive: true });
    track.addEventListener('touchmove', function (e) { if (!swiping) return; var t = e.touches[0]; lx = t.clientX; ly = t.clientY; }, { passive: true });
    track.addEventListener('touchend', function () { if (!swiping) return; swiping = false; var dx = lx - tx, dy = ly - ty; if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? idx + 1 : idx - 1, true); }, { passive: true });
    track.addEventListener('touchcancel', function () { swiping = false; }, { passive: true });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else restart(); });
    paint(); restart();
  }

  /* Сторис по задачам: кружки остаются обычными ссылками, по клику открываем слайды поверх страницы */
  var sData = document.getElementById('stories-data');
  if (sData) {
    var storiesList = [];
    try { storiesList = JSON.parse(sData.textContent || '[]'); } catch (e) { storiesList = []; }
    var sv = document.createElement('div');
    sv.className = 'sv'; sv.setAttribute('role', 'dialog'); sv.setAttribute('aria-modal', 'true'); sv.setAttribute('aria-label', 'Подбор по задаче'); sv.hidden = true;
    sv.innerHTML = '<div class="sv__frame">'
      + '<div class="sv__bars" data-sv-bars></div>'
      + '<div class="sv__head"><span data-sv-label></span><button type="button" class="sv__close" data-sv-close aria-label="Закрыть">×</button></div>'
      + '<img class="sv__img" alt="" data-sv-img><div class="sv__shade"></div>'
      + '<button type="button" class="sv__tap sv__tap--prev" data-sv-prev aria-label="Предыдущий слайд"></button>'
      + '<button type="button" class="sv__tap sv__tap--next" data-sv-next aria-label="Следующий слайд"></button>'
      + '<div class="sv__copy"><span class="label" data-sv-eyebrow></span><div class="sv__title" data-sv-title></div><p class="sv__text" data-sv-text></p><a class="btn sv__cta" data-sv-cta href="#">Открыть</a></div>'
      + '</div>';
    (document.querySelector('.v2') || document.body).appendChild(sv);
    var svBars = $('[data-sv-bars]', sv), svImg = $('[data-sv-img]', sv), svLabel = $('[data-sv-label]', sv), svEyebrow = $('[data-sv-eyebrow]', sv), svTitle = $('[data-sv-title]', sv), svText = $('[data-sv-text]', sv), svCta = $('[data-sv-cta]', sv);
    var curStory = null, curSlide = 0, svTimer = null, SV_DUR = 5000, lastFocus = null;
    function svRender() {
      var slide = curStory.slides[curSlide];
      svBars.innerHTML = '';
      curStory.slides.forEach(function (_, n) { var i = document.createElement('i'); if (n < curSlide) i.className = 'is-done'; if (n === curSlide) i.className = 'is-active'; svBars.appendChild(i); });
      svLabel.textContent = curStory.label; svImg.src = slide.img; svImg.alt = slide.alt || '';
      svEyebrow.textContent = slide.eyebrow; svTitle.textContent = slide.title; svText.textContent = slide.text;
      svCta.textContent = slide.cta.label; svCta.href = slide.cta.href;
      var nxt = curStory.slides[curSlide + 1]; if (nxt) { var pre = new Image(); pre.src = nxt.img; }
      clearTimeout(svTimer);
      if (!reduce) svTimer = setTimeout(svNext, SV_DUR);
    }
    function svOpen(story, index) {
      curStory = story; curSlide = index || 0; lastFocus = document.activeElement;
      sv.hidden = false; sv.classList.add('is-open'); document.documentElement.classList.add('sv-lock');
      svRender(); $('[data-sv-close]', sv).focus();
    }
    function svClose() {
      clearTimeout(svTimer); sv.classList.remove('is-open'); sv.hidden = true; document.documentElement.classList.remove('sv-lock'); curStory = null;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function svNext() {
      if (!curStory) return;
      if (curSlide + 1 < curStory.slides.length) { curSlide += 1; svRender(); return; }
      var k = storiesList.indexOf(curStory);
      if (k + 1 < storiesList.length) svOpen(storiesList[k + 1], 0); else svClose();
    }
    function svPrev() {
      if (!curStory) return;
      if (curSlide > 0) { curSlide -= 1; svRender(); return; }
      var k = storiesList.indexOf(curStory);
      if (k > 0) svOpen(storiesList[k - 1], storiesList[k - 1].slides.length - 1); else svRender();
    }
    $('[data-sv-close]', sv).addEventListener('click', svClose);
    $('[data-sv-next]', sv).addEventListener('click', svNext);
    $('[data-sv-prev]', sv).addEventListener('click', svPrev);
    sv.addEventListener('click', function (e) { if (e.target === sv) svClose(); });
    /* пауза, пока палец удерживает экран */
    ['pointerdown', 'touchstart'].forEach(function (ev) { sv.addEventListener(ev, function () { if (!curStory) return; sv.classList.add('is-paused'); clearTimeout(svTimer); }, { passive: true }); });
    ['pointerup', 'pointercancel', 'touchend', 'touchcancel'].forEach(function (ev) { sv.addEventListener(ev, function () { if (!curStory) return; sv.classList.remove('is-paused'); clearTimeout(svTimer); if (!reduce) svTimer = setTimeout(svNext, SV_DUR); }, { passive: true }); });
    /* свайп влево и вправо между слайдами, свайп вниз закрывает */
    var sx = 0, sy = 0;
    sv.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    sv.addEventListener('touchend', function (e) { var t = e.changedTouches[0]; var dx = t.clientX - sx, dy = t.clientY - sy; if (Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx)) { if (dy > 0) svClose(); return; } if (Math.abs(dx) > 50) { if (dx < 0) svNext(); else svPrev(); } }, { passive: true });
    document.addEventListener('keydown', function (e) { if (!curStory) return; if (e.key === 'Escape') svClose(); if (e.key === 'ArrowRight') svNext(); if (e.key === 'ArrowLeft') svPrev(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(svTimer); else if (curStory && !reduce) svTimer = setTimeout(svNext, SV_DUR); });
    $$('[data-story]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var story = null;
        storiesList.forEach(function (item) { if (item.id === link.getAttribute('data-story')) story = item; });
        if (!story || !story.slides || !story.slides.length) return;
        e.preventDefault(); link.classList.add('is-seen'); svOpen(story, 0);
      });
    });
  }

  /* Счётчики доказательств */
  $$('[data-count]').forEach(function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10), done = false;
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || done) return; done = true;
        if (reduce) { el.textContent = end; return; }
        var t0 = null;
        (function tick(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(performance.now());
        el.closest('[data-kpi]') && el.closest('[data-kpi]').classList.add('is-on');
      });
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* Видео экспертов: одно играет за раз */
  var vids = $$('.xvid video');
  $$('[data-video-toggle]').forEach(function (btn) {
    var v = $('video', btn.parentElement), fig = btn.closest('.xvid');
    btn.addEventListener('click', function () {
      if (v.paused) { vids.forEach(function (o) { if (o !== v) { o.pause(); o.closest('.xvid').classList.remove('is-playing'); } }); v.muted = false; v.play(); fig.classList.add('is-playing'); }
      else { v.pause(); fig.classList.remove('is-playing'); }
    });
    v.addEventListener('click', function () { btn.click(); });
    v.addEventListener('ended', function () { fig.classList.remove('is-playing'); });
  });
})();
