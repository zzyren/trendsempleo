(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // Modo claro / oscuro (recuerda la elección; sin elección sigue al sistema)
  var themeBtn = document.getElementById('themeBtn');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : mq.matches;
  }
  function syncThemeBtn() {
    themeBtn.setAttribute('aria-label', isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('tema', next); } catch (e) {}
    syncThemeBtn();
  });
  if (mq.addEventListener) mq.addEventListener('change', syncThemeBtn);
  syncThemeBtn();

  // Menú móvil
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  menuBtn.addEventListener('click', function () {
    setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // Efecto onda al pulsar los botones
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('.btn');
    if (!b || reduce) return;
    var r = b.getBoundingClientRect();
    var size = Math.max(r.width, r.height);
    var s = document.createElement('span');
    s.className = 'ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  });

  // Desplazamiento suave a las secciones (con el foco para teclado y lectores)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (history.pushState) history.pushState(null, '', '#' + id);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  // Barra de progreso, barra superior y botón de volver arriba
  var progress = document.getElementById('progress');
  var topbar = document.getElementById('topbar');
  var toTop = document.getElementById('toTop');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    topbar.classList.toggle('stuck', y > 8);
    toTop.classList.toggle('show', y > 700);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  // Enlace activo según la sección visible
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  if (hasIO) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) spy.observe(s);
    });
  }

  // Aparición al hacer scroll, contadores y barras
  var bars = document.getElementById('bars');
  function fillBars() {
    bars.querySelectorAll('.bar').forEach(function (b, i) {
      var f = b.querySelector('i');
      f.style.transitionDelay = (i * 80) + 'ms';
      f.style.width = b.dataset.v + '%';
    });
  }
  function count(el) {
    var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', t0 = null, dur = 1300;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var reveals = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('[data-count]');
  if (reduce || !hasIO) {
    reveals.forEach(function (r) { r.classList.add('in'); });
    fillBars();
  } else {
    var io = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        o.unobserve(el);
        if (el.classList.contains('reveal')) {
          el.classList.add('in');
          var d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
          setTimeout(function () { el.classList.add('done'); }, (d + 0.85) * 1000);
          if (el.querySelector('#bars') || el.contains(bars)) fillBars();
        }
        if (el.hasAttribute('data-count')) count(el);
      });
    }, { threshold: 0.18 });
    reveals.forEach(function (r) { io.observe(r); });
    counters.forEach(function (c) { io.observe(c); });
  }
})();
