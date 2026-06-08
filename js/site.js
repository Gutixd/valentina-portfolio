(function () {
  'use strict';
  function safe(fn, n) { try { fn(); } catch (e) { console.warn('init', n, e); } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P = window.PROJECTS || [];

  /* loaded */
  requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });

  /* ---- Render featured (home) ---- */
  safe(function () {
    var host = document.querySelector('[data-feat]'); if (!host) return;
    var feats = P.filter(function (p) { return p.featured; }).slice(0, 5);
    feats.forEach(function (p, i) {
      var a = el('a', 'fcard reveal'); a.href = 'proyecto.html?p=' + p.slug;
      a.innerHTML =
        '<div class="fcard__media"><span class="fcard__num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<img src="' + p.cover + '" alt="' + p.title + '" loading="lazy"></div>' +
        '<div class="fcard__info"><span class="fcard__cat">' + p.category + '</span>' +
        '<h3 class="fcard__title">' + p.title + '</h3>' +
        '<p class="fcard__sum">' + p.summary + '</p>' +
        '<span class="fcard__more">Ver caso <span>→</span></span></div>';
      host.appendChild(a);
    });
  }, 'feat');

  /* ---- Render grid + filters (trabajos) ---- */
  safe(function () {
    var host = document.querySelector('[data-grid]'); if (!host) return;
    var fhost = document.querySelector('[data-filters]');
    function card(p) {
      var a = el('a', 'pcard reveal'); a.href = 'proyecto.html?p=' + p.slug; a.setAttribute('data-cat', p.cat);
      a.innerHTML =
        '<div class="pcard__media"><span class="pcard__badge">' + p.category + '</span>' +
        '<img src="' + p.cover + '" alt="' + p.title + '" loading="lazy"></div>' +
        '<div class="pcard__body"><h3 class="pcard__title">' + p.title + '</h3>' +
        '<p class="pcard__client">' + p.client + (p.via ? ' · ' + p.via : '') + '</p></div>' +
        '<span class="pcard__arrow">→</span>';
      return a;
    }
    P.forEach(function (p) { host.appendChild(card(p)); });
    if (fhost && window.CATEGORIES) {
      window.CATEGORIES.forEach(function (c, i) {
        var b = el('button', 'filter' + (i === 0 ? ' active' : ''), c.label); b.setAttribute('data-f', c.id);
        b.addEventListener('click', function () {
          fhost.querySelectorAll('.filter').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          host.querySelectorAll('.pcard').forEach(function (card) {
            var show = c.id === 'all' || card.getAttribute('data-cat') === c.id;
            card.style.display = show ? '' : 'none';
          });
        });
        fhost.appendChild(b);
      });
    }
    rescanReveal();
  }, 'grid');

  /* ---- Nav scroll + mobile ---- */
  safe(function () {
    var nav = document.querySelector('.nav');
    if (nav) addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 30); }, { passive: true });
    var burger = document.querySelector('[data-burger]'), menu = document.querySelector('[data-mobilemenu]');
    if (burger && menu) {
      function tg(o) { var open = o != null ? o : !menu.classList.contains('is-open'); menu.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; }
      burger.addEventListener('click', function () { tg(); });
      menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { tg(false); }); });
    }
  }, 'nav');

  /* ---- Cursor ---- */
  safe(function () {
    if (matchMedia('(max-width:920px)').matches) return;
    var ring = document.querySelector('[data-cursor]'), dot = document.querySelector('[data-cursor-dot]');
    if (!ring) return;
    var rx = 0, ry = 0, dx = 0, dy = 0, mx = innerWidth / 2, my = innerHeight / 2;
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * .16; ry += (my - ry) * .16; dx += (mx - dx) * .5; dy += (my - dy) * .5;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a,button,[data-magnetic],.pcard,.fcard,.tool,.gitem')) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a,button,[data-magnetic],.pcard,.fcard,.tool,.gitem')) ring.classList.remove('is-hover');
    });
  }, 'cursor');

  /* ---- Reveal ---- */
  var io;
  function rescanReveal() {
    var els = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    if (!io) io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .08, rootMargin: '0px 0px -7% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  safe(rescanReveal, 'reveal');
  window.__rescanReveal = rescanReveal;

  /* ---- Marquee ---- */
  safe(function () {
    if (reduce) return;
    var tracks = [];
    document.querySelectorAll('[data-marquee]').forEach(function (t) { tracks.push({ el: t, dir: parseFloat(t.getAttribute('data-marquee')) || -1, x: 0, half: t.scrollWidth / 2 }); });
    if (!tracks.length) return;
    var vel = 0, last = scrollY;
    addEventListener('scroll', function () { vel = scrollY - last; last = scrollY; }, { passive: true });
    addEventListener('resize', function () { tracks.forEach(function (o) { o.half = o.el.scrollWidth / 2; }); });
    (function loop() {
      var boost = Math.min(Math.abs(vel) * .5, 32);
      tracks.forEach(function (o) { o.x += o.dir * (.6 + boost); if (o.half > 0) { o.x %= o.half; if (o.x > 0) o.x -= o.half; } o.el.style.transform = 'translateX(' + o.x + 'px)'; });
      vel *= .9; requestAnimationFrame(loop);
    })();
  }, 'marquee');

  /* ---- Progress ---- */
  safe(function () {
    var bar = document.querySelector('[data-progress]'); if (!bar) return;
    function up() { var max = document.documentElement.scrollHeight - innerHeight; bar.style.width = (max > 0 ? clamp(scrollY / max, 0, 1) * 100 : 0) + '%'; }
    addEventListener('scroll', up, { passive: true }); up();
  }, 'progress');

  /* ---- Fit display text ---- */
  function fitter(e, avail, cap) {
    if (!e) return; function f() { var a = avail(); if (a < 80) return; e.style.fontSize = '100px'; var w = e.scrollWidth; if (!w) return; e.style.fontSize = Math.min(100 * a * .98 / w, cap) + 'px'; }
    f(); addEventListener('resize', f, { passive: true }); if (document.fonts) document.fonts.ready.then(f); setTimeout(f, 400);
  }
  safe(function () {
    var t = document.querySelector('[data-fit]'); if (t) fitter(t, function () { return t.clientWidth; }, 240);
    var ft = document.querySelector('[data-fit-footer]'); if (ft) fitter(ft, function () { return ft.parentElement.clientWidth; }, 360);
  }, 'fit');

  /* ---- Count up ---- */
  safe(function () {
    var ns = document.querySelectorAll('[data-count]'); if (!ns.length || !('IntersectionObserver' in window)) return;
    var o = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return; o.unobserve(x.target);
        var node = x.target, end = parseFloat(node.getAttribute('data-count')), suf = node.getAttribute('data-suf') || '', t0 = null;
        function step(ts) { if (!t0) t0 = ts; var p = clamp((ts - t0) / 1400, 0, 1); node.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }, { threshold: .5 });
    ns.forEach(function (n) { o.observe(n); });
  }, 'count');

  /* ---- Smooth anchors ---- */
  safe(function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { var id = a.getAttribute('href'); if (id.length < 2) return; var t = document.querySelector(id); if (!t) return; e.preventDefault(); scrollTo({ top: t.getBoundingClientRect().top + scrollY - 20, behavior: 'smooth' }); });
    });
  }, 'anchors');

})();
