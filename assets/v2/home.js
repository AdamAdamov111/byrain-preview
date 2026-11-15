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
    function go(i, user) {
      idx = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[idx].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      paint(); if (user) stop(); else restart();
    }
    /* после свайпа, точки или стрелки автоплей не возобновляется: слайдами управляет человек */
    function stop() { manual = true; clearInterval(timer); timer = null; ds.forEach(function (d) { d.classList.remove('is-anim'); }); }
    function restart() { if (manual) return; clearInterval(timer); timer = setInterval(function () { if (!hold && !document.hidden) go(idx + 1); }, DUR); hero.style.setProperty('--dur', DUR + 'ms'); ds.forEach(function (d) { d.classList.remove('is-anim'); void d.offsetWidth; }); ds[idx].classList.add('is-anim'); }
    $('[data-hero-prev]', hero).addEventListener('click', function () { go(idx - 1, true); });
    $('[data-hero-next]', hero).addEventListener('click', function () { go(idx + 1, true); });
    var raf = 0;
    track.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var c = track.scrollLeft + track.clientWidth / 2, best = 0, bd = Infinity;
        slides.forEach(function (s, i) { var m = s.offsetLeft + s.offsetWidth / 2, d = Math.abs(m - c); if (d < bd) { bd = d; best = i; } });
        if (best !== idx) { idx = best; paint(); restart(); }
      });
    }, { passive: true });
    ['pointerdown', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, function () { hold = true; }, { passive: true }); });
    ['pointerup', 'touchend', 'pointercancel'].forEach(function (ev) { track.addEventListener(ev, function () { hold = false; restart(); }, { passive: true }); });
    /* Свайп: касанием лента не прокручивается (touch-action:pan-y), чтобы страница листалась вниз без залипания; слайды переключаем сами */
    var tx = 0, ty = 0, lx = 0, ly = 0, swiping = false;
    track.addEventListener('touchstart', function (e) { var t = e.touches[0]; tx = lx = t.clientX; ty = ly = t.clientY; swiping = true; }, { passive: true });
    track.addEventListener('touchmove', function (e) { if (!swiping) return; var t = e.touches[0]; lx = t.clientX; ly = t.clientY; }, { passive: true });
    track.addEventListener('touchend', function () { if (!swiping) return; swiping = false; var dx = lx - tx, dy = ly - ty; if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? idx + 1 : idx - 1, true); }, { passive: true });
    track.addEventListener('touchcancel', function () { swiping = false; }, { passive: true });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else restart(); });
    paint(); restart();
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
