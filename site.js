(function () {
  'use strict';
  var d = document, h = d.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function cssPx(name) { return parseFloat(getComputedStyle(h).getPropertyValue(name)) || 0; }

  /* opening veil (first visit) and plain hold (repeat visits) */
  (function () {
    var veiled = h.classList.contains('veiled'), hold = h.classList.contains('hold');
    if (!veiled && !hold) return;
    var el = veiled ? $('.veil') : $('.cover'), fill = $('.veil-line i');
    var min = veiled ? 1200 : 0, cap = veiled ? 2500 : 3000, t0 = Date.now(), finished = false, total = 0, count = 0;
    if (veiled) store('bp-intro', '1');
    function finish() {
      if (finished) return;
      finished = true;
      if (reduce || !el) { h.classList.remove('veiled', 'hold'); return; }
      el.classList.add('out');
      setTimeout(function () { h.classList.remove('veiled', 'hold'); }, veiled ? 850 : 450);
    }
    function tick() { count++; if (fill) fill.style.transform = 'scaleX(' + Math.min(1, count / total) + ')'; }
    function track(p) { total++; return p.then(tick, tick); }
    function imgReady(img) {
      if (img.decode) return img.decode();
      return img.complete ? Promise.resolve() : new Promise(function (r) { img.onload = img.onerror = r; });
    }
    var jobs = [track(d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve())];
    var hero = $('.hero-img');
    if (hero) jobs.push(track(imgReady(hero)));
    if (veiled) { var seal = $('.veil img'); if (seal) jobs.push(track(imgReady(seal))); }
    Promise.all(jobs).then(function () {
      var wait = Math.max(0, min - (Date.now() - t0));
      setTimeout(function () { setTimeout(finish, veiled ? 260 : 0); }, wait);
    });
    setTimeout(finish, cap);
    if (veiled) { el.addEventListener('click', finish); d.addEventListener('keydown', finish, { once: true }); }
  })();

  /* header: seal replaces the two-address label once the hero has gone */
  var hdr = $('#hdr'), hero = $('.hero');
  if (hdr) {
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { hdr.classList.toggle('past', !es[0].isIntersecting); }, { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
    } else { hdr.classList.add('past'); }
  }

  /* drawer */
  var burger = $('#burger'), drawer = $('#drawer');
  function setDrawer(open) {
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    burger.classList.toggle('open', open);
    h.classList.toggle('lock', open);
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () { setDrawer(drawer.hidden); });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setDrawer(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) { setDrawer(false); burger.focus(); } });
    matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setDrawer(false); });
  }

  /* Arabic pop-up */
  var ar = $('#ar-dialog'), art = $('#ar-toggle');
  if (ar && art) {
    art.addEventListener('click', function () { if (ar.showModal) ar.showModal(); else ar.setAttribute('open', ''); });
    $('#ar-close').addEventListener('click', function () { if (ar.close) ar.close(); else ar.removeAttribute('open'); });
    ar.addEventListener('click', function (e) {
      var r = ar.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) ar.close();
    });
  }

  /* whole-section fade, once, triggered early */
  var rv = $$('.rv');
  if (!('IntersectionObserver' in window) || reduce) { rv.forEach(function (n) { n.classList.add('in'); }); }
  else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); rio.unobserve(x.target); } });
    }, { rootMargin: '0px 0px 15% 0px', threshold: 0.01 });
    rv.forEach(function (n) { rio.observe(n); });
  }

  /* bottom bar: hides on scroll down, and over the form and the footer */
  var dock = $('#dock');
  if (dock) {
    var last = window.scrollY, queued = false, over = {};
    var upd = function () {
      queued = false;
      var y = window.scrollY;
      if (y > last + 6 && y > 160) dock.classList.add('hide');
      else if (y < last - 6 || y <= 160) dock.classList.remove('hide');
      last = y;
    };
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(upd); } }, { passive: true });
    if ('IntersectionObserver' in window) {
      var dio = new IntersectionObserver(function (es) {
        es.forEach(function (x) { over[x.target.id || x.target.className] = x.isIntersecting; });
        dock.classList.toggle('over', Object.keys(over).some(function (k) { return over[k]; }));
      });
      $$('#plan, .foot').forEach(function (n) { dio.observe(n); });
    }
  }

  /* plan your evening: a ready-written WhatsApp message */
  var form = $('#plan');
  if (form) {
    var branch = 'Maadi';
    var occ = $('#f-occ'), dateI = $('#f-date'), timeS = $('#f-time'), guests = $('#f-guests'), nameI = $('#f-name'), note = $('#f-note');
    var hint = $('#h-note'), upNote = $('#up-note');
    var p2 = function (n) { return n < 10 ? '0' + n : '' + n; };
    var now = new Date();
    dateI.min = now.getFullYear() + '-' + p2(now.getMonth() + 1) + '-' + p2(now.getDate());
    for (var hr = 9; hr <= 23; hr++) {
      [0, 30].forEach(function (mi) {
        var o = d.createElement('option'), hh = hr % 12 === 0 ? 12 : hr % 12;
        o.value = o.textContent = hh + ':' + p2(mi) + ' ' + (hr < 12 ? 'AM' : 'PM');
        if (hr === 21 && mi === 0) o.selected = true;
        timeS.appendChild(o);
      });
    }
    var live = occ.options[1];
    function setBranch(b) {
      branch = b;
      $$('.seg-b', form).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.b === b)); });
      var up = b === 'Uptown';
      upNote.hidden = !up;
      live.disabled = up;
      if (up && occ.selectedIndex === 1) occ.selectedIndex = 0;
      hint.textContent = up ? 'For example: a table on the terrace.' : 'For example: ask for the Crêpe Suzette for the birthday.';
    }
    $$('.seg-b', form).forEach(function (x) { x.addEventListener('click', function () { setBranch(x.dataset.b); }); });
    function fmtDate(v) {
      var p = v.split('-');
      return parseInt(p[2], 10) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(p[1], 10) - 1];
    }
    function bad(input, errId, on) {
      var e = $('#' + errId);
      e.hidden = !on;
      if (on) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      return on;
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var g = parseInt(guests.value, 10);
      var errs = [bad(dateI, 'e-date', !dateI.value), bad(guests, 'e-guests', !(g >= 1)), bad(nameI, 'e-name', !nameI.value.trim())];
      if (errs.some(Boolean)) {
        [dateI, guests, nameI][errs.indexOf(true)].focus();
        return;
      }
      var t = timeS.value.replace(':00', '');
      var msg = "Hello Bistro Paris, I'd like to book: " + branch + ', ' + occ.value + ', ' + fmtDate(dateI.value) + ', ' + t + ', ' + g + (g === 1 ? ' guest' : ' guests') + '. Name: ' + nameI.value.trim() + '.';
      if (note.value.trim()) msg += ' Note: ' + note.value.trim();
      var url = 'https://wa.me/201289994449?text=' + encodeURIComponent(msg);
      form.dataset.last = url;
      var w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;
    });
    [[dateI, 'e-date'], [guests, 'e-guests'], [nameI, 'e-name']].forEach(function (p) {
      p[0].addEventListener('input', function () { bad(p[0], p[1], false); });
    });
  }

  /* menu page: branch switch, section chips with scroll-spy */
  var body = $('#menu-body');
  if (body) {
    var cur = h.getAttribute('data-branch') === 'uptown' ? 'uptown' : 'maadi';
    var active = {}, spy = null, spyCat = null;
    var rail = $('.rail');
    function offset() { return cssPx('--hh') + cssPx('--bar'); }
    function paint(b) {
      $$('[data-branch-btn]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.branchBtn === b)); });
    }
    function mark(b, cat) {
      spyCat = cat;
      $$('.chips[data-for="' + b + '"] a').forEach(function (a) {
        var on = a.dataset.cat === cat;
        a.classList.toggle('on', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        if (on && rail) rail.scrollTo({ left: Math.max(0, a.offsetLeft - 8), behavior: reduce ? 'auto' : 'smooth' });
      });
    }
    function observe() {
      if (spy) spy.disconnect();
      active = {};
      if (!('IntersectionObserver' in window)) return;
      var order = $$('#pane-' + cur + ' .cat');
      spy = new IntersectionObserver(function (es) {
        es.forEach(function (x) { active[x.target.id] = x.isIntersecting; });
        for (var i = 0; i < order.length; i++) {
          if (active[order[i].id]) { mark(cur, order[i].dataset.cat); return; }
        }
        if (order.length && order[0].getBoundingClientRect().top > offset()) mark(cur, order[0].dataset.cat);
      }, { rootMargin: '-' + (offset() + 4) + 'px 0px -55% 0px' });
      order.forEach(function (n) { spy.observe(n); });
    }
    function setBranch(b, keep) {
      if (b === cur) return;
      var prev = spyCat, scrolled = body.getBoundingClientRect().top < offset();
      cur = b;
      h.setAttribute('data-branch', b);
      store('bp-branch', b);
      paint(b);
      try { history.replaceState(null, '', '?branch=' + b); } catch (e) {}
      observe();
      if (keep && scrolled) {
        var t = prev && $('#' + b + '-' + prev);
        var y = (t || body).getBoundingClientRect().top + window.scrollY - (t ? offset() + 12 : offset());
        window.scrollTo(0, Math.max(0, y));
      }
      var first = $('.chips[data-for="' + b + '"] a');
      if (first && !$('.chips[data-for="' + b + '"] a.on')) mark(b, first.dataset.cat);
      if (rail && !t) rail.scrollTo({ left: 0 });
      railState();
    }
    $$('[data-branch-btn]').forEach(function (x) { x.addEventListener('click', function () { setBranch(x.dataset.branchBtn, true); }); });
    if (rail) rail.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '?branch=' + cur + a.getAttribute('href')); } catch (_) {}
    });
    var rp = $('#rail-prev'), rn = $('#rail-next');
    function railState() {
      if (!rail || !rp) return;
      rp.disabled = rail.scrollLeft < 4;
      rn.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    }
    if (rail && rp) {
      rp.addEventListener('click', function () { rail.scrollBy({ left: -rail.clientWidth * 0.7, behavior: reduce ? 'auto' : 'smooth' }); });
      rn.addEventListener('click', function () { rail.scrollBy({ left: rail.clientWidth * 0.7, behavior: reduce ? 'auto' : 'smooth' }); });
      rail.addEventListener('scroll', railState, { passive: true });
      addEventListener('resize', railState);
      railState();
    }
    paint(cur);
    observe();
    var first0 = $('.chips[data-for="' + cur + '"] a');
    if (first0) mark(cur, first0.dataset.cat);
  }

  /* footer signature: writes itself on hover, or when it scrolls into view on touch screens */
  (function () { var a = document.querySelector('a.sig'); if (!a) return; function play() { a.classList.remove('on'); void a.getBoundingClientRect(); a.classList.add('on') } a.addEventListener('mouseenter', function () { if (!a.classList.contains('on')) play() }); if (!matchMedia('(hover: none)').matches || !('IntersectionObserver' in window)) return; var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(play, 400) } }, { threshold: .9 }); io.observe(a) })();
})();
