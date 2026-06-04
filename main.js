(function () {
  'use strict';

  function safe(fn, name) { try { fn(); } catch (e) { console.warn('init failed:', name, e); } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = function () { return window.innerWidth <= 760; };

  /* ---- Page load ---- */
  safe(function () {
    requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });
  }, 'load');

  /* ---- Fit hero title to viewport width (so the full name always shows) ---- */
  safe(function () {
    var title = document.querySelector('.hero__title');
    if (!title) return;
    var words = title.querySelectorAll('.word');
    if (!words.length) return;
    function fit() {
      var avail = title.clientWidth;
      if (avail < 80) return; // guard: container not laid out / collapsed
      title.style.fontSize = '100px';
      var maxW = 0;
      words.forEach(function (w) { if (w.scrollWidth > maxW) maxW = w.scrollWidth; });
      if (maxW === 0) { title.style.fontSize = ''; return; }
      var fs = 100 * (avail * 0.985) / maxW;
      fs = Math.min(fs, 200); // cap on ultra-wide screens
      title.style.fontSize = fs + 'px';
    }
    fit();
    window.addEventListener('resize', fit, { passive: true });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fit); }
    setTimeout(fit, 400);
  }, 'fitHero');

  /* ---- Fit footer giant name to container ---- */
  safe(function () {
    var big = document.querySelector('.footer__big');
    if (!big) return;
    function fitBig() {
      var avail = big.parentElement ? big.parentElement.clientWidth : big.clientWidth;
      if (avail < 80) return;
      big.style.fontSize = '100px';
      var w = big.scrollWidth;
      if (!w) { big.style.fontSize = ''; return; }
      big.style.fontSize = Math.min(100 * (avail * 0.98) / w, 360) + 'px';
    }
    fitBig();
    window.addEventListener('resize', fitBig, { passive: true });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitBig); }
    setTimeout(fitBig, 400);
  }, 'fitFooter');

  /* ---- Splash safety ---- */
  safe(function () {
    var s = document.querySelector('[data-splash]');
    if (!s) return;
    setTimeout(function () { s.classList.add('is-gone'); }, 3000);
    setTimeout(function () { s.style.display = 'none'; }, 4200);
  }, 'splash');

  /* ---- Cursor ---- */
  safe(function () {
    if (window.matchMedia('(max-width:900px)').matches) return;
    var ring = document.querySelector('[data-cursor]'), dot = document.querySelector('[data-cursor-dot]');
    if (!ring || !dot) return;
    var rx = 0, ry = 0, dx = 0, dy = 0, mx = 0, my = 0;
    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15;
      dx += (mx - dx) * 0.5; dy += (my - dy) * 0.5;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button,[data-magnetic],[data-magnetic-card]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); });
    });
  }, 'cursor');

  /* ---- Magnetic ---- */
  safe(function () {
    if (window.matchMedia('(max-width:900px)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.3 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.3 + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'; el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 500);
      });
    });
  }, 'magnetic');

  /* ---- Reveal ---- */
  safe(function () {
    var els = document.querySelectorAll('.reveal, .reveal-line');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { el.classList.add('in'); }); }, 6000);
  }, 'reveal');

  /* ---- Count up ---- */
  safe(function () {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) { nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseInt(el.getAttribute('data-count'), 10) || 0, dur = 1400, start = null;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }, 'count');

  /* ---- Slideshow rotator ---- */
  safe(function () {
    document.querySelectorAll('[data-slideshow]').forEach(function (box) {
      var slides = box.querySelectorAll('.slide');
      if (slides.length < 2) return;
      var i = 0;
      setInterval(function () {
        slides[i].classList.remove('is-active');
        i = (i + 1) % slides.length;
        slides[i].classList.add('is-active');
      }, 2600);
    });
  }, 'slideshow');

  /* ---- Mobile menu ---- */
  safe(function () {
    var burger = document.querySelector('[data-burger]');
    var menu = document.querySelector('[data-mobilemenu]');
    if (!burger || !menu) return;
    function toggle(open) {
      var willOpen = (open !== undefined) ? open : !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', willOpen);
      burger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      document.body.style.overflow = willOpen ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { toggle(); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggle(false); });
    });
  }, 'mobilemenu');

  /* ---- Anchors ---- */
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

  /* ---- Scroll velocity tracker ---- */
  var lastY = window.pageYOffset, scrollVel = 0;
  window.addEventListener('scroll', function () {
    var y = window.pageYOffset;
    scrollVel = y - lastY; lastY = y;
  }, { passive: true });

  /* ---- Marquees (continuous drift + scroll boost) ---- */
  safe(function () {
    if (reduce) return;
    var tracks = [];
    document.querySelectorAll('[data-marquee]').forEach(function (t) {
      tracks.push({ el: t, dir: parseFloat(t.getAttribute('data-marquee')) || -1, x: 0, half: t.scrollWidth / 2 });
    });
    if (!tracks.length) return;
    window.addEventListener('resize', function () { tracks.forEach(function (o) { o.half = o.el.scrollWidth / 2; }); });
    (function loop() {
      var boost = Math.min(Math.abs(scrollVel) * 0.6, 40);
      tracks.forEach(function (o) {
        o.x += o.dir * (0.6 + boost);
        if (o.half > 0) { o.x = o.x % o.half; if (o.x > 0) o.x -= o.half; }
        o.el.style.transform = 'translateX(' + o.x + 'px)';
      });
      scrollVel *= 0.9;
      requestAnimationFrame(loop);
    })();
  }, 'marquee');

  /* ---- Horizontal scroll (work section) ---- */
  /* ---- + hero depth + 3D tilt + image zoom ---- */
  safe(function () {
    var hero = document.querySelector('.hero');
    var heroTitle = document.querySelector('.hero__title');
    var heroRole = document.querySelector('.hero__role');
    var stage3d = document.querySelector('[data-scroll3d]');
    var card3d = document.querySelector('[data-scroll3d-card]');
    var title3d = document.querySelector('[data-scroll3d-title]');
    var hwrap = document.querySelector('[data-hscroll]');
    var htrack = document.querySelector('[data-htrack]');
    var imgFx = document.querySelectorAll('[data-fx-img]');
    var parax = document.querySelectorAll('[data-parallax]');
    var zoom = document.querySelector('[data-zoom]');
    var zoomEls = document.querySelectorAll('.zoom__el');
    var progressBar = document.querySelector('[data-progress]');
    var docEl = document.documentElement;

    function onScroll() {
      var vh = window.innerHeight, vw = window.innerWidth, y = window.pageYOffset;

      // Scroll progress bar
      if (progressBar) {
        var max = docEl.scrollHeight - vh;
        progressBar.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + '%';
      }

      // Zoom parallax
      if (zoom && zoomEls.length) {
        var rz = zoom.getBoundingClientRect();
        var zt = zoom.offsetHeight - vh;
        var zp = clamp((-rz.top) / zt, 0, 1);
        for (var k = 0; k < zoomEls.length; k++) {
          var ze = zoomEls[k];
          var ts = parseFloat(ze.getAttribute('data-zoom-scale')) || 4;
          ze.style.transform = 'scale(' + (1 + zp * (ts - 1)) + ')';
        }
      }

      // Hero depth
      if (hero) {
        var p = clamp(y / vh, 0, 1);
        if (heroTitle) heroTitle.style.transform = 'translateY(' + (p * 60) + 'px)';
        if (heroRole) heroRole.style.transform = 'translateX(' + (p * 40) + 'px)';
        hero.style.opacity = String(1 - p * 0.55);
      }

      // Parallax bg
      parax.forEach(function (el) {
        var sp = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        el.style.transform = 'translateY(' + (y * sp) + 'px)';
      });

      // Image zoom
      for (var i = 0; i < imgFx.length; i++) {
        var el = imgFx[i], inner = el.querySelector('.ph') || el.firstElementChild;
        if (!inner) continue;
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        var prog = clamp((vh - r.top) / (vh + r.height), 0, 1);
        inner.style.transform = 'scale(' + (1.18 - prog * 0.18) + ')';
      }

      // 3D tilt card
      if (stage3d && card3d) {
        var rc = stage3d.getBoundingClientRect();
        var pr = clamp((vh - rc.top) / (vh + rc.height), 0, 1);
        var rot = 20 * (1 - pr);
        var sc = isMobile() ? (0.85 + pr * 0.15) : (1.05 - pr * 0.05);
        card3d.style.transform = 'rotateX(' + rot + 'deg) scale(' + sc + ')';
        if (title3d) title3d.style.transform = 'translateY(' + (-90 * pr) + 'px)';
      }

      // Horizontal scroll
      if (hwrap && htrack && !isMobile()) {
        var rw = hwrap.getBoundingClientRect();
        var total = hwrap.offsetHeight - vh;
        var hp = clamp((-rw.top) / total, 0, 1);
        var maxX = htrack.scrollWidth - vw;
        if (maxX > 0) htrack.style.transform = 'translateX(' + (-hp * maxX) + 'px)';
      } else if (htrack && isMobile()) {
        htrack.style.transform = '';
      }
    }

    if (!reduce) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      onScroll();
    }
  }, 'scrollFx');

})();
