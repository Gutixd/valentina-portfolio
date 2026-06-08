(function () {
  'use strict';
  var P = window.PROJECTS || [];
  var params = new URLSearchParams(location.search);
  var slug = params.get('p');
  var i = P.findIndex(function (x) { return x.slug === slug; });
  var p = i >= 0 ? P[i] : P[0];
  var next = P[(i + 1 + P.length) % P.length] || P[0];
  var host = document.querySelector('[data-proyecto]');
  if (!host || !p) return;

  document.title = p.title + ' · Valentina Bustamante';

  function esc(s) { return s; }
  function metaItem(k, v) { return '<div><div class="cs-meta__k">' + k + '</div><div class="cs-meta__v">' + v + '</div></div>'; }

  // HERO
  var meta = [
    metaItem('Cliente', p.client),
    p.via ? metaItem('Contexto', p.via) : '',
    metaItem('Año', p.year),
    metaItem('Rol', p.role.join(' · ')),
    metaItem('Herramientas', p.tools.join(' · '))
  ].join('');

  var hero =
    '<section class="cs-hero" data-cshero>' +
      '<div class="cs-hero__bg"><img src="' + p.cover + '" alt="' + p.title + '"></div>' +
      '<div class="cs-hero__inner wrap">' +
        '<span class="cs-hero__cat"><span class="dotcol" style="background:' + p.accent + '"></span>' + p.category + '</span>' +
        '<h1 class="cs-hero__title">' + p.title + '</h1>' +
        '<div class="cs-hero__meta">' + meta + '</div>' +
      '</div>' +
    '</section>';

  // INTRO
  var intro =
    '<section class="pad wrap"><div class="cs-introwrap reveal">' +
      '<div class="cs-intro">' + p.summary + '</div>' +
      '<div><span class="label">El proyecto</span>' +
      '<p>' + (p.blocks[0] ? p.blocks[0].t : '') + '</p></div>' +
    '</div></section>';

  // BLOCKS (skip first, used in intro? keep all for completeness)
  var blocks = '<section class="wrap" style="padding-bottom:clamp(2rem,6vh,4rem)"><div class="cs-blocks">';
  p.blocks.forEach(function (b) {
    blocks += '<div class="cs-block reveal' + (b.quote ? ' cs-block--quote' : '') + '">' +
      '<div class="cs-block__k"><span>Caso</span>' + b.k + '</div>' +
      '<div class="cs-block__t">' + b.t + '</div></div>';
  });
  blocks += '</div></section>';

  // GALLERY
  var gal = '<section class="pad wrap"><div class="shead reveal"><div><span class="kicker">Galería</span>' +
    '<h2 class="shead__title">Piezas del <span class="blue">proyecto</span></h2></div></div>' +
    '<div class="cs-gallery">';
  p.gallery.forEach(function (g, idx) {
    var wide = (g.type === 'video' && /board-full|board-1\b/.test(g.src)) ? '' : '';
    var isWide = g.wide || (idx === 0 && p.gallery.length % 2 === 1 && g.type !== 'video');
    if (g.type === 'video') {
      gal += '<div class="gitem gitem--video reveal" data-video>' +
        '<video src="' + g.src + '" poster="' + (g.poster || '') + '" preload="none" playsinline loop muted></video>' +
        '<span class="playbtn"></span>' +
        '<span class="gitem__cap">' + (g.title || '') + '</span></div>';
    } else {
      gal += '<div class="gitem reveal' + (isWide ? ' gitem--wide' : '') + '">' +
        '<img src="' + g.src + '" alt="' + (g.title || p.title) + '" loading="lazy">' +
        '<span class="gitem__cap">' + (g.title || '') + '</span></div>';
    }
  });
  gal += '</div></section>';

  // NEXT
  var nx = '<a class="cs-next" href="proyecto.html?p=' + next.slug + '">' +
    '<span class="cs-next__k">Siguiente proyecto</span>' +
    '<span class="cs-next__t">' + next.title + ' →</span></a>';

  host.innerHTML = hero + intro + blocks + gal + nx;

  // interactions
  requestAnimationFrame(function () {
    var csh = document.querySelector('[data-cshero]'); if (csh) setTimeout(function () { csh.classList.add('in'); }, 60);
    if (window.__rescanReveal) window.__rescanReveal();
    document.querySelectorAll('[data-video]').forEach(function (box) {
      var v = box.querySelector('video');
      box.addEventListener('click', function () {
        if (v.paused) { v.play(); box.classList.add('playing'); } else { v.pause(); box.classList.remove('playing'); }
      });
      v.addEventListener('ended', function () { box.classList.remove('playing'); });
    });
  });
})();
