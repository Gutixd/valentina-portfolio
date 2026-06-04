(function () {
  'use strict';

  function safe(fn, name) { try { fn(); } catch (e) { console.warn('init failed:', name, e); } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Page load (triggers hero choreography) ---- */
  safe(function () {
    requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });
    window.addEventListener('load', function () { document.body.classList.add('is-loaded'); });
  }, 'load');

  /* ---- Fit big display text to its container width ---- */
  function makeFitter(el, getAvail, cap) {
    if (!el) return function () {};
    function fit() {
      var avail = getAvail();
      if (avail < 80) return;
      el.style.fontSize = '100px';
      var w = el.scrollWidth;
      if (!w) { el.style.fontSize = ''; return; }
      el.style.fontSize = Math.min(100 * (avail * 0.98) / w, cap) + 'px';
    }
    fit();
    window.addEventListener('resize', fit, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    setTimeout(fit, 300); setTimeout(fit, 800);
    return fit;
  }
  safe(function () {
    var t = document.querySelector('.hero__title');
    if (t) makeFitter(t, function () { return t.clientWidth; }, 240);
    var f = document.querySelector('[data-fit-footer]');
    if (f) makeFitter(f, function () { return f.parentElement.clientWidth; }, 420);
  }, 'fit');

  /* ---- Custom cursor ---- */
  safe(function () {
    if (window.matchMedia('(max-width:900px)').matches) return;
    var ring = document.querySelector('[data-cursor]'), dot = document.querySelector('[data-cursor-dot]');
    if (!ring || !dot) return;
    var rx = 0, ry = 0, dx = 0, dy = 0, mx = innerWidth / 2, my = innerHeight / 2;
    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dx += (mx - dx) * 0.5; dy += (my - dy) * 0.5;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button,[data-magnetic],.case,.skillcard').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); });
    });
  }, 'cursor');

  /* ---- Magnetic buttons ---- */
  safe(function () {
    if (window.matchMedia('(max-width:900px)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.28 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.28 + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 500);
      });
    });
  }, 'magnetic');

  /* ---- Reveal on scroll ---- */
  safe(function () {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { el.classList.add('in'); }); }, 5000);
  }, 'reveal');

  /* ---- Mobile menu ---- */
  safe(function () {
    var burger = document.querySelector('[data-burger]'), menu = document.querySelector('[data-mobilemenu]');
    if (!burger || !menu) return;
    function toggle(open) {
      var willOpen = (open !== undefined) ? open : !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', willOpen);
      burger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      document.body.style.overflow = willOpen ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { toggle(); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { toggle(false); }); });
  }, 'mobilemenu');

  /* ---- Smooth anchors ---- */
  safe(function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var t = document.querySelector(id); if (!t) return;
        e.preventDefault();
        window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 20, behavior: 'smooth' });
      });
    });
  }, 'anchors');

  /* ---- Scroll velocity ---- */
  var lastY = window.pageYOffset, scrollVel = 0;
  window.addEventListener('scroll', function () { var y = window.pageYOffset; scrollVel = y - lastY; lastY = y; }, { passive: true });

  /* ---- Kinetic marquee (drift + scroll boost) ---- */
  safe(function () {
    if (reduce) return;
    var tracks = [];
    document.querySelectorAll('[data-marquee]').forEach(function (t) {
      tracks.push({ el: t, dir: parseFloat(t.getAttribute('data-marquee')) || -1, x: 0, half: t.scrollWidth / 2 });
    });
    if (!tracks.length) return;
    window.addEventListener('resize', function () { tracks.forEach(function (o) { o.half = o.el.scrollWidth / 2; }); });
    (function loop() {
      var boost = Math.min(Math.abs(scrollVel) * 0.55, 36);
      tracks.forEach(function (o) {
        o.x += o.dir * (0.7 + boost);
        if (o.half > 0) { o.x = o.x % o.half; if (o.x > 0) o.x -= o.half; }
        o.el.style.transform = 'translateX(' + o.x + 'px)';
      });
      scrollVel *= 0.9;
      requestAnimationFrame(loop);
    })();
  }, 'marquee');

  /* ---- Scroll progress + light parallax on collage scraps ---- */
  safe(function () {
    var bar = document.querySelector('[data-progress]');
    var doc = document.documentElement;
    var scraps = document.querySelectorAll('.hero__scrap, .hero__badge');
    function onScroll() {
      var y = window.pageYOffset, vh = window.innerHeight;
      if (bar) { var max = doc.scrollHeight - vh; bar.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + '%'; }
      if (!reduce) scraps.forEach(function (el, i) { el.style.translate = '0 ' + (y * (i % 2 ? -0.05 : 0.07)) + 'px'; });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }, 'progress');

})();
