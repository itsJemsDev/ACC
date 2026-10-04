/* =========================================================================
   COMMUNICARE — AAC Board controller
   Drives the category rail, phrase strip, Top-5 prediction bar, language
   toggle, context chip and speech output.
   ========================================================================= */
(function (global) {
  'use strict';

  var Store = global.CC.Store, UI = global.CC.UI, Speech = global.CC.Speech,
      Predict = global.CC.Predict, CATEGORIES = global.CC.CATEGORIES;

  var el = {};
  var speaking = false;

  function $(id) { return document.getElementById(id); }
  function h(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ------------------------------------------------------------- toast -- */
  function toast(msg, icon) {
    var box = $('toasts');
    var t = h('div', 'toast', (icon ? UI[icon] : '') + '<span>' + esc(msg) + '</span>');
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { t.remove(); }, 200);
    }, 2200);
  }

  /* ------------------------------------------------------- category rail -- */
  function renderRail() {
    var state = Store.get();
    el.rail.innerHTML =
      '<div class="rail__head"><span class="u-eyebrow">Categories</span></div>' +
      '<div class="rail__list" role="tablist">' +
      CATEGORIES.map(function (c) {
        var on = c.id === state.category;
        return '<button class="cat" role="tab" data-cat="' + c.id + '"' +
          (on ? ' aria-current="true"' : '') + ' title="' + c.label + '">' +
          global.CC.CAT_ART[c.id] +
          '<span>' + c.label + '</span>' +
          '<span class="cat__n">' + Store.countIn(c.id) + '</span>' +
          '</button>';
      }).join('') +
      '</div>';

    el.rail.querySelectorAll('.cat').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.set({ category: b.dataset.cat });
      });
    });
  }

  /* -------------------------------------------------------- symbol grid -- */
  function renderGrid() {
    var state = Store.get();
    var list = Store.symbols().filter(function (s) { return s.cat === state.category; });
    var picked = {};
    state.phrase.forEach(function (id) { picked[id] = true; });

    if (!list.length) {
      el.grid.innerHTML = '<p class="grid__empty">No symbols in this category yet.</p>';
      return;
    }

    el.grid.innerHTML = list.map(function (s) {
      var l = Store.labels(s);
      return '<button class="sym' + (picked[s.id] ? ' is-picked' : '') + '" data-id="' + s.id + '" ' +
        'aria-label="' + esc(l.primary) + ', ' + esc(l.secondary) + '">' +
        '<span class="sym__art">' + s.icon + '</span>' +
        '<span class="sym__l1">' + esc(l.primary) + '</span>' +
        '<span class="sym__l2">' + esc(l.secondary) + '</span>' +
        '</button>';
    }).join('');

    el.grid.querySelectorAll('.sym').forEach(function (b) {
      b.addEventListener('click', function () { add(b.dataset.id); });
    });
  }

  /* --------------------------------------------------------- phrase strip -- */
  function renderStrip() {
    var state = Store.get();

    if (!state.phrase.length) {
      el.slots.innerHTML =
        '<span class="strip__empty">' + UI.spark +
        '<span>Tap symbols to build a phrase</span></span>';
      return;
    }
    el.slots.innerHTML = state.phrase.map(function (id, i) {
      var s = Store.symbol(id);
      if (!s) return '';
      var l = Store.labels(s);
      return '<span class="slot">' +
        '<span class="slot__i">' + (i + 1) + '</span>' + s.icon +
        '<span>' + esc(l.primary) + '</span></span>';
    }).join('');
    el.slots.scrollLeft = el.slots.scrollWidth;
  }

  /* ------------------------------------------------------- prediction bar -- */
  function renderPredict() {
    var state = Store.get();
    var geo = Store.geofence(state.activeContext) || { boost: [] };
    var routine = Store.routineNow();

    var boost = (geo.boost || []).slice();
    /* time-of-day routine rules nudge related vocabulary too */
    if (routine) {
      Store.geofence(routine.ctx) && (boost = boost.concat(Store.geofence(routine.ctx).boost));
    }

    var ids = Predict.predict(state.phrase, { boost: boost, history: state.history }, 5);

    el.predictRow.innerHTML = ids.map(function (id) {
      var s = Store.symbol(id);
      if (!s) return '';
      var l = Store.labels(s);
      return '<button class="chip" data-id="' + id + '" aria-label="Add ' + esc(l.primary) + '">' +
        s.icon + '<span>' + esc(l.primary) + '</span></button>';
    }).join('');

    el.predictRow.querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () { add(b.dataset.id); });
    });
  }

  /* -------------------------------------------------------- header tools -- */
  function renderHeader() {
    var state = Store.get();
    var geo = Store.geofence(state.activeContext);
    el.langEn.setAttribute('aria-pressed', String(state.lang === 'en'));
    el.langTl.setAttribute('aria-pressed', String(state.lang === 'tl'));
    el.ctxLabel.textContent = geo ? geo.label : 'No location';
    el.ctxMeta.textContent = Store.partOfDay();
    document.body.dataset.age = state.ageGroup;
  }

  /* ------------------------------------------------------------ actions -- */
  function add(id) {
    var s = Store.get();
    Store.trackTap(id);
    Store.set({ phrase: s.phrase.concat(id) });
  }

  function backspace() {
    var s = Store.get();
    if (!s.phrase.length) return;
    var slots = el.slots.querySelectorAll('.slot');
    var last = slots[slots.length - 1];
    if (last) last.classList.add('is-out');
    setTimeout(function () {
      var cur = Store.get().phrase;
      Store.set({ phrase: cur.slice(0, -1) });
    }, 140);
  }

  function clearAll() {
    var s = Store.get();
    if (!s.phrase.length) return;
    Store.trackPhrase(s.phrase);
    Predict.learn(s.phrase, 2);
    Store.set({ phrase: [] });
    toast('Phrase cleared', 'trash');
  }

  function speak() {
    var s = Store.get();
    if (!s.phrase.length) { toast('Add a symbol first'); return; }
    if (!s.speechOutput) { toast('Speech output is off'); return; }
    if (!Speech.available()) { toast('Speech is unavailable in this browser'); return; }

    var text = s.phrase.map(function (id) {
      var sym = Store.symbol(id);
      return sym ? Store.labels(sym).primary : '';
    }).filter(Boolean).join(', ');

    speaking = true;
    el.speak.classList.add('is-busy');
    Speech.speak(text, s.lang, {
      rate: s.speakRate,
      onend: function () {
        speaking = false;
        el.speak.classList.remove('is-busy');
        Store.trackPhrase(s.phrase);
        Predict.learn(s.phrase, 2);
        Store.set({ phrase: [] });
      }
    });
  }

  /* ------------------------------------------------------------ keyboard -- */
  function onKey(e) {
    if (e.target.matches('input, textarea, select')) return;
    if (speaking && e.key === 'Escape') { Speech.cancel(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
    if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); speak(); }
    if (e.key === ' ' && e.target === document.body) { e.preventDefault(); speak(); }
  }

  /* ---------------------------------------------------------------- init -- */
  function init() {
    Store.init();

    el.rail = $('rail');
    el.grid = $('board-grid');
    el.slots = $('strip-slots');
    el.predictRow = $('predict-row');
    el.langEn = $('lang-en');
    el.langTl = $('lang-tl');
    el.ctxLabel = $('ctx-label');
    el.ctxMeta = $('ctx-meta');
    el.speak = $('btn-speak');

    el.langEn.addEventListener('click', function () { Store.set({ lang: 'en' }); });
    el.langTl.addEventListener('click', function () { Store.set({ lang: 'tl' }); });

    el.ctxLabel.closest('.ctx').addEventListener('click', openContextPicker);

    $('btn-back').addEventListener('click', backspace);
    $('btn-clear').addEventListener('click', clearAll);
    el.speak.addEventListener('click', speak);

    $('btn-lock').addEventListener('click', function () {
      global.CC.Pin.open(function () { location.href = 'portal.html'; });
    });

    document.addEventListener('keydown', onKey);

    Store.subscribe(function () {
      renderHeader(); renderRail(); renderGrid(); renderStrip(); renderPredict();
    });

    renderHeader(); renderRail(); renderGrid(); renderStrip(); renderPredict();
  }

  /* ------------------------------------------- context switcher (geofence) */
  function openContextPicker() {
    var state = Store.get();
    var root = $('ctx-root');
    root.innerHTML =
      '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="ctx-t">' +
        '<div class="modal" style="max-width:440px">' +
          '<h2 class="modal__title" id="ctx-t">Location context</h2>' +
          '<p class="modal__sub">Predictions adapt to where the communicator is.</p>' +
          '<div class="geolist" style="margin-top:20px">' +
          state.geofences.map(function (g) {
            var on = g.id === state.activeContext;
            return '<button class="geoitem' + (on ? ' is-on' : '') + '" data-g="' + g.id + '" ' +
              'style="width:100%;text-align:left;cursor:pointer">' +
              '<span class="geoitem__ic">' + UI.pin + '</span>' +
              '<span><span class="geoitem__t">' + esc(g.label) + '</span>' +
              '<span class="geoitem__d">' + esc(g.coords) + ' · ' + g.radius + ' m radius</span></span>' +
              (on ? '<span class="pill pill--success"><span class="pill__dot"></span>Active</span>' : '') +
              '</button>';
          }).join('') +
          '</div>' +
          '<div class="modal__foot"><button class="btn" data-close>Close</button></div>' +
        '</div>' +
      '</div>';

    root.querySelectorAll('[data-g]').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.set({ activeContext: b.dataset.g });
        root.innerHTML = '';
      });
    });
    root.querySelector('[data-close]').addEventListener('click', function () { root.innerHTML = ''; });
    root.querySelector('.scrim').addEventListener('click', function (e) {
      if (e.target === root.querySelector('.scrim')) root.innerHTML = '';
    });
  }

  global.CC = global.CC || {};
  global.CC.Board = { init: init };
})(window);