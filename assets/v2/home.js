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

  /* Герой-карусель. Слайды стоят в ряд, каждый сдвигается своим transform: текущий в кадре, соседи по бокам, остальные за кадром.
     Палец ведёт слайд за собой, после отпускания лента доезжает до ближайшего слайда. Круг замкнут: за последним идёт первый. */
  var hero = $('[data-hero]');
  if (hero) {
    var track = $('[data-hero-track]', hero), slides = $$('[data-hero-slide]', hero), dots = $('[data-hero-dots]', hero), count = $('[data-hero-count]', hero);
    var N = slides.length, idx = 0, timer = null, DUR = 6500, hold = false, manual = false, anim = 0;
    var EASE = 'cubic-bezier(.22,.61,.36,1)';
    var coarse = window.matchMedia('(pointer: coarse)').matches, narrowMq = window.matchMedia('(max-width: 860px)');
    hero.classList.add('is-ready');
    track.scrollLeft = 0;

    slides.forEach(function (_, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', 'Слайд ' + (i + 1));
      b.innerHTML = '<i></i>'; b.addEventListener('click', function () { go(i, true); }); dots.appendChild(b);
    });
    var ds = $$('button', dots);

    function mod(i) { return ((i % N) + N) % N; }
    /* место слайда на круге относительно текущего: 0 в кадре, 1 справа, -1 слева */
    function circ(i) { var half = Math.floor(N / 2), d = mod(i - idx); return d > half ? d - N : d; }
    function place(i, pos, px, ms) {
      var s = slides[i];
      s.style.transition = ms ? 'transform ' + ms + 'ms ' + EASE : 'none';
      s.style.transform = 'translate3d(calc(' + ((pos - i) * 100) + '% + ' + Math.round(px || 0) + 'px),0,0)';
    }
    function layout(px) { slides.forEach(function (_, i) { place(i, circ(i), px, 0); }); }
    function width() { return hero.clientWidth || window.innerWidth; }
    /* где сейчас текущий слайд: нужно, чтобы подхватить ленту пальцем посреди анимации */
    function offsetNow() { return slides[idx].getBoundingClientRect().left - hero.getBoundingClientRect().left; }
    function speed() { return reduce ? 0 : Math.round(Math.min(700, Math.max(420, width() * 0.5))); }

    function paint() {
      ds.forEach(function (d, n) { d.setAttribute('aria-selected', String(n === idx)); d.classList.toggle('is-on', n === idx); });
      if (count) count.textContent = ('0' + (idx + 1)).slice(-2) + ' / ' + ('0' + N).slice(-2);
      hero.setAttribute('data-slide', String(idx));
      hero.setAttribute('data-tone', slides[idx].getAttribute('data-hero-tone') || 'light');
    }
    /* Телефон и планшет: высота ленты равна высоте текущего слайда, иначе короткие слайды тянутся до самого длинного.
       Боковые стрелки встают по центру фотографии текущего слайда. */
    function fit() {
      var s = slides[idx];
      if (coarse || narrowMq.matches) track.style.height = s.offsetHeight + 'px'; else track.style.height = '';
      var a = $('[data-hero-anchor]', s), top = s.getBoundingClientRect().top, y;
      if (a) { var r = a.getBoundingClientRect(); y = r.top - top + r.height / 2; }
      else { var c = $('.hero-slide__copy', s), first = c && c.firstElementChild; y = first ? Math.max(40, (first.getBoundingClientRect().top - top) / 2) : s.offsetHeight / 2; }
      hero.style.setProperty('--arrow-y', Math.round(y) + 'px');
    }
    /* картинки соседних слайдов грузим заранее: ленивая загрузка не видит слайд за кадром, и при листании фото появлялось с задержкой */
    function prime(i) {
      $$('img', slides[mod(i)]).forEach(function (im) {
        if (im.loading === 'lazy') im.loading = 'eager';
        if (im.decode) im.decode().catch(function () {});
      });
    }
    function primeAround() { prime(idx + 1); prime(idx - 1); }

    /* dir: 1 — новый слайд приходит справа, -1 — слева. from: сдвиг ленты в пикселях, с которого начинается движение (после свайпа) */
    function go(i, user, dir, from, ms) {
      var target = mod(i), prev = idx, off = from || 0;
      if (user) { stop(); hero.classList.add('is-moved'); }
      if (ms == null) ms = speed();
      var t = ++anim;
      if (target === prev) {
        [prev - 1, prev, prev + 1].forEach(function (k) { place(mod(k), circ(mod(k)), off, 0); });
        void track.offsetWidth;
        [prev - 1, prev, prev + 1].forEach(function (k) { place(mod(k), circ(mod(k)), 0, ms); });
      } else {
        if (!dir) dir = target === mod(prev + 1) ? 1 : target === mod(prev - 1) ? -1 : target > prev ? 1 : -1;
        idx = target;
        /* остальные слайды без анимации встают на новые места по кругу: они за кадром */
        slides.forEach(function (_, k) { if (k !== prev && k !== target) place(k, circ(k), 0, 0); });
        place(target, dir, off, 0); place(prev, 0, off, 0);
        void track.offsetWidth;
        place(target, 0, 0, ms); place(prev, -dir, 0, ms);
        paint(); fit(); primeAround();
      }
      setTimeout(function () { if (t === anim) layout(0); }, ms + 40);
      if (!user) restart();
    }

    /* после свайпа, точки или стрелки автоплей не возобновляется: слайдами управляет человек */
    function stop() { manual = true; clearInterval(timer); timer = null; ds.forEach(function (d) { d.classList.remove('is-anim'); }); }
    function restart() { if (manual) return; clearInterval(timer); timer = setInterval(function () { if (!hold && !document.hidden) go(idx + 1, false, 1); }, DUR); hero.style.setProperty('--dur', DUR + 'ms'); ds.forEach(function (d) { d.classList.remove('is-anim'); void d.offsetWidth; }); ds[idx].classList.add('is-anim'); }

    $$('[data-hero-prev]', hero).forEach(function (b) { b.addEventListener('click', function () { go(idx - 1, true, -1); }); });
    $$('[data-hero-next]', hero).forEach(function (b) { b.addEventListener('click', function () { go(idx + 1, true, 1); }); });
    hero.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1, true, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1, true, -1); }
    });
    /* фокус с клавиатуры попал в слайд за кадром: показываем этот слайд; секцию браузер прокручивать не должен */
    hero.addEventListener('focusin', function (e) {
      var s = e.target.closest ? e.target.closest('[data-hero-slide]') : null, i = slides.indexOf(s);
      if (i >= 0 && i !== idx) go(i, true);
    });
    hero.addEventListener('scroll', function () { if (hero.scrollLeft) hero.scrollLeft = 0; if (hero.scrollTop) hero.scrollTop = 0; }, { passive: true });

    /* Свайп: слайд едет за пальцем. Направление жеста определяется по первым пикселям: вертикальный жест отдаём странице. */
    var touch = null;
    function velocity(samples) {
      var last = samples[samples.length - 1], first = last;
      for (var n = samples.length - 1; n >= 0; n--) { if (last.t - samples[n].t > 120) break; first = samples[n]; }
      return last.t === first.t ? 0 : (last.x - first.x) / (last.t - first.t);
    }
    track.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { touch = null; return; }
      var p = e.touches[0];
      hold = true;
      touch = { x: p.clientX, y: p.clientY, base: 0, off: 0, lock: '', w: width(), samples: [{ x: p.clientX, t: e.timeStamp }], raf: 0 };
    }, { passive: true });
    track.addEventListener('touchmove', function (e) {
      if (!touch || e.touches.length !== 1) return;
      var p = e.touches[0], dx = p.clientX - touch.x, dy = p.clientY - touch.y;
      if (!touch.lock) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        touch.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (touch.lock === 'x') {
          /* подхватываем ленту там, где она сейчас, и отсчитываем движение от этой точки */
          touch.base = offsetNow(); anim++; layout(touch.base); touch.x = p.clientX; dx = 0;
          stop(); hero.classList.add('is-moved', 'is-drag'); primeAround();
        }
      }
      if (touch.lock !== 'x') return;
      if (e.cancelable) e.preventDefault();
      touch.samples.push({ x: p.clientX, t: e.timeStamp }); if (touch.samples.length > 12) touch.samples.shift();
      touch.off = Math.max(-touch.w, Math.min(touch.w, touch.base + dx));
      if (!touch.raf) touch.raf = requestAnimationFrame(function () {
        if (!touch) return; touch.raf = 0;
        [idx - 1, idx, idx + 1].forEach(function (k) { place(mod(k), circ(mod(k)), touch.off, 0); });
      });
    }, { passive: false });
    function release(cancelled) {
      hold = false;
      var g = touch; touch = null;
      if (!g || g.lock !== 'x') { restart(); return; }
      if (g.raf) cancelAnimationFrame(g.raf);
      hero.classList.remove('is-drag');
      var v = cancelled ? 0 : velocity(g.samples), off = g.off, w = g.w, dir = 0;
      if (off < -w * 0.18 || (v < -0.3 && off < -10)) dir = 1;
      else if (off > w * 0.18 || (v > 0.3 && off > 10)) dir = -1;
      /* длительность доводки: остаток пути на скорости пальца, в разумных пределах */
      var rest = dir ? w - Math.abs(off) : Math.abs(off);
      var ms = reduce ? 0 : Math.round(Math.max(220, Math.min(520, rest / Math.max(Math.abs(v), 0.9))));
      go(idx + dir, true, dir, off, ms);
      /* после перетаскивания браузер не должен засчитать касание как клик по ссылке внутри слайда */
      if (Math.abs(off - g.base) > 8) {
        var block = function (ev) { ev.preventDefault(); ev.stopPropagation(); };
        track.addEventListener('click', block, true);
        setTimeout(function () { track.removeEventListener('click', block, true); }, 320);
      }
    }
    track.addEventListener('touchend', function () { release(false); }, { passive: true });
    track.addEventListener('touchcancel', function () { release(true); }, { passive: true });

    /* Трекпад и мышь с горизонтальной прокруткой: один жест листает один слайд */
    var wheelSum = 0, wheelLock = false, wheelTimer = 0;
    hero.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      clearTimeout(wheelTimer); wheelTimer = setTimeout(function () { wheelSum = 0; wheelLock = false; }, 160);
      if (wheelLock) return;
      wheelSum += e.deltaX;
      if (Math.abs(wheelSum) > 48) { wheelLock = true; go(idx + (wheelSum > 0 ? 1 : -1), true, wheelSum > 0 ? 1 : -1); }
    }, { passive: false });

    function refit() { fit(); }
    window.addEventListener('resize', refit); window.addEventListener('load', function () { fit(); primeAround(); });
    if ('ResizeObserver' in window) { var fitObs = new ResizeObserver(refit); slides.forEach(function (s) { fitObs.observe(s); }); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else restart(); });
    layout(0); paint(); fit(); restart();
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
