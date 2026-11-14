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

  /* ---- Split titles into letters for reveal ---- */
  function splitTitle(el) {
    if (!el || el.dataset.split) return;
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    var delay = 0;
    text.split(/(\s+)/).forEach(function (part) {
      if (/^\s+$/.test(part)) {
        el.appendChild(document.createTextNode(' '));
        return;
      }
      var w = document.createElement('span');
      w.className = 'w';
      part.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.style.setProperty('--i', String(delay++));
        w.appendChild(s);
      });
      el.appendChild(w);
    });
    el.dataset.split = '1';
  }

  /* ---- Hero carousel (full-bleed photos) ---- */
  var hero = document.querySelector('.hero');
  var themes = ['cafeteria', 'desayuno', 'pasteleria', 'jugos'];
  var copies = hero.querySelectorAll('.slide-copy');
  var photos = hero.querySelectorAll('.hero-photo');
  var words = hero.querySelectorAll('.bigword span');
  var thumbs = hero.querySelectorAll('.thumb');
  var counter = hero.querySelector('.counter b');
  var live = hero.querySelector('.live');
  var playBtn = hero.querySelector('.ctrl-play');
  var DURATION = 6000;
  var current = 0, timer = null, userPaused = reduce.matches;
  hero.style.setProperty('--dur', DURATION + 'ms');
  copies.forEach(function (c) {
    var t = c.querySelector('.slide-title');
    if (t) splitTitle(t);
  });

  function setState(list, i, prev) {
    list.forEach(function (el, k) {
      el.classList.toggle('is-active', k === i);
      el.classList.toggle('is-leaving', k === prev && prev !== i);
    });
  }

  function restartKenBurns(i) {
    var img = photos[i] && photos[i].querySelector('img');
    if (!img || reduce.matches) return;
    img.style.animation = 'none';
    void img.offsetWidth;
    img.style.animation = '';
  }

  function go(i, announce) {
    var n = themes.length;
    i = (i + n) % n;
    if (i === current && hero.dataset.theme === themes[i]) return;
    var prev = current;
    current = i;
    hero.dataset.theme = themes[i];
    [copies, photos, words].forEach(function (l) { setState(l, i, prev); });
    restartKenBurns(i);
    copies.forEach(function (el, k) { el.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    thumbs.forEach(function (t, k) { t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    counter.textContent = String(i + 1).padStart(2, '0');
    if (announce) {
      var titleEl = copies[i].querySelector('.slide-title');
      live.textContent = (titleEl ? titleEl.textContent : '') + ', ' + (i + 1) + ' de ' + n;
    }
    restart();
  }

  function playing() { return !userPaused && !document.hidden && !reduce.matches; }
  function restart() {
    clearTimeout(timer);
    hero.classList.remove('is-playing');
    void hero.offsetWidth;
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

  // Autoplay stays on while looking at the hero (no hover-pause).
  document.addEventListener('visibilitychange', restart);
  if (reduce.addEventListener) {
    reduce.addEventListener('change', function (e) {
      if (e.matches) { userPaused = true; updatePlayBtn(); restart(); }
    });
  }

  hero.addEventListener('keydown', function (e) {
    if (e.target.closest('a,button')) return;
    if (e.key === 'ArrowRight') { go(current + 1, true); }
    if (e.key === 'ArrowLeft') { go(current - 1, true); }
  });

  var sx = 0, sy = 0, tracking = false;
  hero.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; tracking = true; }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (!tracking) return; tracking = false;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) go(current + (dx < 0 ? 1 : -1), true);
  }, { passive: true });

  /* Subtle mouse parallax + scroll parallax on the photo layer */
  var media = hero.querySelector('.hero-media');
  var px = 0, py = 0, sxv = 0, syv = 0, sp = 0;
  if (!reduce.matches) {
    if (window.matchMedia('(pointer:fine)').matches) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width - .5;
        py = (e.clientY - r.top) / r.height - .5;
      });
    }
    window.addEventListener('scroll', function () {
      var r = hero.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        sp = Math.max(-1, Math.min(1, -r.top / Math.max(r.height, 1)));
      }
    }, { passive: true });
    (function tick() {
      sxv += (px * 16 - sxv) * .06;
      syv += (py * 12 + sp * 28 - syv) * .06;
      media.style.transform = 'translate3d(' + sxv.toFixed(2) + 'px,' + syv.toFixed(2) + 'px,0) scale(1.04)';
      requestAnimationFrame(tick);
    })();
  }

  /* Optional: ?slide=0..3 pauses autoplay on that slide (used for captures). */
  var shot = new URLSearchParams(location.search).get('slide');
  if (shot !== null) userPaused = true;
  updatePlayBtn();
  current = -1;
  go(shot !== null ? Math.max(0, parseInt(shot, 10) || 0) : 0, false);

  /* ---- Carta: pestañas ---- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var chipsWrap = document.querySelector('.chips');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      var wasHidden = panel.hidden;
      panel.hidden = !on;
      if (on && !wasHidden) { /* keep */ }
      if (on) {
        panel.style.animation = 'none';
        void panel.offsetWidth;
        panel.style.animation = '';
      }
    });
    if (focus) tab.focus();
    var panel = document.getElementById(tab.getAttribute('aria-controls'));
    chipsWrap.innerHTML = '';
    panel.querySelectorAll('.cat').forEach(function (c) {
      var a = document.createElement('a');
      a.href = '#' + c.id;
      var title = c.querySelector('.cat-title');
      a.textContent = title.firstChild.textContent.trim();
      chipsWrap.appendChild(a);
    });
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () {
      selectTab(t, false);
      var tabsBar = document.querySelector('.tabs');
      if (tabsBar.getBoundingClientRect().top <= 80) {
        window.scrollTo({ top: tabsBar.getBoundingClientRect().top + window.scrollY - 40, behavior: reduce.matches ? 'auto' : 'smooth' });
      }
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

  /* ---- Revelado al scrollear (secciones, fotos, ítems de carta) ---- */
  document.querySelectorAll('.cat, .item, .place').forEach(function (el) {
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
  });
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          el.classList.add('is-in');
          if (el.classList.contains('cat')) {
            el.querySelectorAll('.item').forEach(function (item, i) {
              item.style.transitionDelay = (i * 45) + 'ms';
              item.classList.add('is-in');
            });
          }
          io.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
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
