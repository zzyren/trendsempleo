(function () {
  'use strict';

  // Menú móvil
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  btn.addEventListener('click', function () {
    setMenu(btn.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // Pestañas accesibles (flechas, Inicio, Fin)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function select(i) {
    tabs.forEach(function (t, j) {
      var on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, k = e.key;
      if (k === 'ArrowRight') { e.preventDefault(); select((i + 1) % n); }
      else if (k === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n); }
      else if (k === 'Home') { e.preventDefault(); select(0); }
      else if (k === 'End') { e.preventDefault(); select(n - 1); }
    });
  });

  // Enlace activo según la sección visible
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { if (s) spy.observe(s); });
  }

  // Barras del barómetro y contadores: se animan al entrar en pantalla
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fillBars(root) {
    root.querySelectorAll('.bar').forEach(function (b) {
      b.querySelector('i').style.width = b.dataset.v + '%';
    });
  }
  function count(el) {
    var end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    var suf = el.dataset.suffix || '', t0 = null, dur = 1200;
    function fmt(v) { return v.toFixed(dec).replace('.', ',') + suf; }
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var bars = document.getElementById('bars');
  var counters = document.querySelectorAll('[data-count]');
  if (reduce || !('IntersectionObserver' in window)) {
    fillBars(bars);
  } else {
    var io = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (en.target === bars) fillBars(bars); else count(en.target);
        o.unobserve(en.target);
      });
    }, { threshold: 0.3 });
    io.observe(bars);
    counters.forEach(function (c) { io.observe(c); });
  }
})();
