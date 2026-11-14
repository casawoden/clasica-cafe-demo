/* Clásica — interacciones (vanilla JS, sin dependencias) */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- Header ---- */
  var header = document.querySelector('.site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var toggle = document.querySelector('.menu-toggle');
  toggle.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) toggle.click();
  });

  /* ---- Hero: carrusel de bebidas ---- */
  var hero = document.querySelector('.hero');
  var themes = ['americana', 'frutilla', 'coffeechoc', 'coco'];
  var copies = hero.querySelectorAll('.slide-copy');
  var drinks = hero.querySelectorAll('.drink');
  var sets = hero.querySelectorAll('.ing-set');
  var words = hero.querySelectorAll('.bigword span');
  var thumbs = hero.querySelectorAll('.thumb');
  var counter = hero.querySelector('.counter b');
  var live = hero.querySelector('.live');
  var playBtn = hero.querySelector('.ctrl-play');
  var DURATION = 6500;
  var current = 0, timer = null, userPaused = reduce.matches, hoverPaused = false;
  hero.style.setProperty('--dur', DURATION + 'ms');

  function setState(list, i, prev) {
    list.forEach(function (el, k) {
      el.classList.toggle('is-active', k === i);
      el.classList.toggle('is-leaving', k === prev && prev !== i);
    });
  }

  function go(i, announce) {
    var n = themes.length;
    i = (i + n) % n;
    if (i === current && hero.dataset.theme === themes[i]) return;
    var prev = current;
    current = i;
    hero.dataset.theme = themes[i];
    [copies, drinks, sets, words].forEach(function (l) { setState(l, i, prev); });
    copies.forEach(function (el, k) { el.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    thumbs.forEach(function (t, k) { t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    counter.textContent = String(i + 1).padStart(2, '0');
    if (announce) live.textContent = copies[i].querySelector('.slide-title').textContent.replace(/\s+/g, ' ').trim() + ', ' + (i + 1) + ' de ' + n;
    restart();
  }

  function playing() { return !userPaused && !hoverPaused && !document.hidden; }
  function restart() {
    clearTimeout(timer);
    hero.classList.remove('is-playing');
    void hero.offsetWidth; // reinicia la barra de progreso
    if (playing()) {
      hero.classList.add('is-playing');
      hero.classList.remove('is-paused');
      timer = setTimeout(function () { go(current + 1, false); }, DURATION);
    } else {
      hero.classList.add('is-paused');
    }
  }
  function updatePlayBtn() {
    playBtn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
    playBtn.setAttribute('aria-label', userPaused ? 'Reproducir rotación automática' : 'Pausar rotación automática');
    playBtn.querySelector('.i-pause').style.display = userPaused ? 'none' : '';
    playBtn.querySelector('.i-play').style.display = userPaused ? '' : 'none';
  }

  hero.querySelector('.ctrl-prev').addEventListener('click', function () { go(current - 1, true); });
  hero.querySelector('.ctrl-next').addEventListener('click', function () { go(current + 1, true); });
  thumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k, true); }); });
  playBtn.addEventListener('click', function () { userPaused = !userPaused; updatePlayBtn(); restart(); });

  var stageArea = hero.querySelector('.hero-grid');
  stageArea.addEventListener('mouseenter', function () { hoverPaused = true; restart(); });
  stageArea.addEventListener('mouseleave', function () { hoverPaused = false; restart(); });
  hero.addEventListener('focusin', function () { hoverPaused = true; restart(); });
  hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) { hoverPaused = false; restart(); } });
  document.addEventListener('visibilitychange', restart);
  reduce.addEventListener && reduce.addEventListener('change', function (e) { if (e.matches) { userPaused = true; updatePlayBtn(); restart(); } });

  hero.addEventListener('keydown', function (e) {
    if (e.target.closest('a')) return;
    if (e.key === 'ArrowRight') { go(current + 1, true); }
    if (e.key === 'ArrowLeft') { go(current - 1, true); }
  });

  // swipe en móvil
  var sx = 0, sy = 0, tracking = false;
  hero.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; tracking = true; }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (!tracking) return; tracking = false;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) go(current + (dx < 0 ? 1 : -1), true);
  }, { passive: true });

  // parallax suave de ingredientes con el mouse
  if (!reduce.matches && window.matchMedia('(pointer:fine)').matches) {
    var ingWrap = hero.querySelector('.ingredients');
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      ingWrap.style.transform = 'translate3d(' + (x * -18) + 'px,' + (y * -14) + 'px,0)';
    });
  }

  updatePlayBtn();
  current = -1; go(0, false);

  /* ---- Carta: pestañas ---- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = document.querySelectorAll('.panel');
  var chipsWrap = document.querySelector('.chips');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    // chips de categorías del panel activo
    var panel = document.getElementById(tab.getAttribute('aria-controls'));
    chipsWrap.innerHTML = '';
    panel.querySelectorAll('.cat').forEach(function (c) {
      var a = document.createElement('a');
      a.href = '#' + c.id; a.textContent = c.querySelector('.cat-title').firstChild.textContent.trim();
      chipsWrap.appendChild(a);
    });
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () {
      selectTab(t, false);
      var menu = document.getElementById('carta');
      var tabsBar = document.querySelector('.tabs');
      if (tabsBar.getBoundingClientRect().top <= 80) window.scrollTo({ top: menu.querySelector('.tabs').offsetTop - 40, behavior: reduce.matches ? 'auto' : 'smooth' });
    });
    t.addEventListener('keydown', function (e) {
      var i = null;
      if (e.key === 'ArrowRight') i = (k + 1) % tabs.length;
      if (e.key === 'ArrowLeft') i = (k - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') i = 0;
      if (e.key === 'End') i = tabs.length - 1;
      if (i !== null) { e.preventDefault(); selectTab(tabs[i], true); }
    });
  });
  if (tabs.length) selectTab(tabs[0], false);

  /* ---- Revelado al scrollear ---- */
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- Nav activa ---- */
  if ('IntersectionObserver' in window) {
    var links = document.querySelectorAll('.nav-links a[href^="#"]');
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) links.forEach(function (l) { l.setAttribute('aria-current', l.getAttribute('href') === '#' + en.target.id ? 'true' : 'false'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { so.observe(s); });
  }

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
