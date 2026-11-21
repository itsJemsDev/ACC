/* =========================================================================
   COMMUNICARE — AAC Board controller
   Drives the category rail, phrase strip, Top-5 prediction bar, language
   toggle, context chip and speech output.
   ========================================================================= */
(function (global) {
  'use strict';

  var Store = global.CC.Store, UI = global.CC.UI, Speech = global.CC.Speech,
      Predict = global.CC.Predict;

  var el = {};
  var speaking = false;
  var activeMode = 'board';
  var drawingHasInk = false;
  var clearDrawing = function () {};
  var CORE_IDS = ['me','go','need','pay','buy','work','yes','want','you','no','hungry','eat','drink','play','sleep','stop','please','thanks','hug','help'];
  var CAT_TL = { basic: 'Pangunahin', people: 'Mga Tao', food: 'Pagkain', feelings: 'Damdamin', needs: 'Pangangailangan', actions: 'Gawain', places: 'Mga Lugar', others: 'Mga Bagay' };
  var CONTEXT_TL = { Home: 'Bahay', School: 'Paaralan', 'Therapy Clinic': 'Klinika' };

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
  function symbolArt(sym) {
    var src = sym.dataUrl || sym.imageUrl;
    return src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : sym.icon;
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
    var order = state.categoryOrder || [];
    var availableCategories = Store.categories();
    var categories = availableCategories.slice().sort(function (a, b) {
      var ai = order.indexOf(a.id), bi = order.indexOf(b.id);
      return (ai < 0 ? availableCategories.indexOf(a) : ai) - (bi < 0 ? availableCategories.indexOf(b) : bi);
    }).filter(function (c) { return (state.hiddenCategories || []).indexOf(c.id) < 0; });
    if (categories.length && !categories.some(function (c) { return c.id === state.category; })) {
      Store.set({ category: categories[0].id }); return;
    }
    el.rail.innerHTML =
      '<div class="rail__head"><span class="u-eyebrow">Categories</span></div>' +
      '<div class="rail__list" role="tablist">' +
      categories.map(function (c) {
        var on = c.id === state.category;
        return '<button class="cat" role="tab" data-cat="' + c.id + '"' +
          (on ? ' aria-current="true"' : '') + ' title="' + c.label + '">' +
          (global.CC.CAT_ART[c.id] || global.CC.CAT_ART.others) +
          '<span>' + esc(state.lang === 'tl' ? (CAT_TL[c.id] || c.label) : c.label) + '</span>' +
          '<span class="cat__n">' + (c.id === 'basic' ? CORE_IDS.length + Store.symbols().filter(function (s) { return s.cat === 'basic' && CORE_IDS.indexOf(s.id) < 0; }).length : Store.countIn(c.id)) + '</span>' +
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
    var allSymbols = Store.symbols();
    var list = state.category === 'basic'
      ? CORE_IDS.map(function (id) { return Store.symbol(id); }).filter(Boolean).concat(allSymbols.filter(function (s) { return s.cat === 'basic' && CORE_IDS.indexOf(s.id) < 0; }))
      : allSymbols.filter(function (s) { return s.cat === state.category; });
    var symbolOrder = state.symbolOrder || [];
    list = list.filter(function (symbol) { return (state.hiddenSymbols || []).indexOf(symbol.id) < 0; });
    list.sort(function (a, b) {
      var ai = symbolOrder.indexOf(a.id), bi = symbolOrder.indexOf(b.id);
      return (ai < 0 ? symbolOrder.length : ai) - (bi < 0 ? symbolOrder.length : bi);
    });
    var picked = {};
    state.phrase.forEach(function (id) { picked[id] = true; });

    if (!list.length) {
      el.grid.innerHTML = '<p class="grid__empty">No symbols in this category yet.</p>';
      return;
    }

    el.grid.innerHTML = list.map(function (s) {
      var l = Store.labels(s);
      return '<button class="sym sym--' + s.cat + (picked[s.id] ? ' is-picked' : '') + '" data-id="' + s.id + '" ' +
        'aria-label="' + esc(l.primary) + ', ' + esc(l.secondary) + '">' +
          (state.textOnly ? '' : '<span class="sym__art">' + symbolArt(s) + '</span>') +
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

    if (activeMode !== 'board') {
      el.slots.innerHTML =
        '<span class="strip__empty">' + UI.spark + '<span>' +
        (activeMode === 'keyboard'
          ? (state.lang === 'tl' ? 'I-type ang mensahe sa ibaba.' : 'Type your message below.')
          : (state.lang === 'tl' ? 'Gumuhit sa ibaba at piliin ang katugmang simbolo.' : 'Draw below, then choose a matching symbol.')) +
        '</span></span>';
      return;
    }
    if (!state.phrase.length) {
      el.slots.innerHTML =
        '<span class="strip__empty">' + UI.spark +
        '<span>' + (state.lang === 'tl' ? 'Pumili ng mga simbolo para bumuo ng pangungusap…' : 'Tap symbols to build a phrase…') + '</span></span>';
      return;
    }
    el.slots.innerHTML = state.phrase.map(function (id, i) {
      var s = Store.symbol(id);
      if (!s) return '';
      var l = Store.labels(s);
      return '<span class="slot slot--' + s.cat + '">' +
        '<span class="slot__i">' + (i + 1) + '</span>' + symbolArt(s) +
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
    if (routine && state.activeContext) {
      Store.geofence(routine.ctx) && (boost = boost.concat(Store.geofence(routine.ctx).boost));
    }

    var ids = Predict.predict(state.phrase, { boost: boost, history: state.history }, 5);
    ids = ids.filter(function (id) { return (state.hiddenSymbols || []).indexOf(id) < 0; });

    el.predictRow.innerHTML = ids.map(function (id) {
      var s = Store.symbol(id);
      if (!s) return '';
      var l = Store.labels(s);
      return '<button class="chip" data-id="' + id + '" aria-label="Add ' + esc(l.primary) + '">' +
        symbolArt(s) + '<span>' + esc(l.primary) + '</span></button>';
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
    el.ctxLabel.textContent = geo ? (state.lang === 'tl' ? (CONTEXT_TL[geo.label] || geo.label) : geo.label) : 'Auto';
    el.ctxMeta.textContent = !geo ? (state.lang === 'tl' ? 'Walang lugar' : 'No location') : (state.lang === 'tl' ? ({ Morning: 'Umaga', Afternoon: 'Hapon', Evening: 'Gabi' }[Store.partOfDay()] || Store.partOfDay()) : Store.partOfDay());
    var labels = activeMode === 'keyboard'
      ? (state.lang === 'tl' ? ['Burahin titik','Burahin mensahe','Magsalita','Sunod'] : ['Delete character','Clear message','Speak','Suggestions'])
      : activeMode === 'drawing'
        ? (state.lang === 'tl' ? ['Burahin','Linisin ang drawing','Magsalita ng simbolo','Sunod'] : ['Delete','Clear drawing','Speak symbol','Suggestions'])
        : (state.lang === 'tl' ? ['Burahin','Linisin','Magsalita','Sunod'] : ['Delete','Clear','Speak','Suggestions']);
    ['btn-back','btn-clear','btn-speak'].forEach(function (id, i) { var label = $(id).querySelector('span'); if (label) label.textContent = labels[i]; });
    $('btn-back').hidden = activeMode === 'drawing';
    $('btn-back').setAttribute('aria-label', activeMode === 'keyboard' ? (state.lang === 'tl' ? 'Burahin ang karakter bago ang cursor' : 'Delete character before cursor') : 'Backspace — remove last symbol');
    $('btn-clear').setAttribute('aria-label', activeMode === 'keyboard' ? (state.lang === 'tl' ? 'Burahin ang buong mensahe' : 'Clear the typed message') : activeMode === 'drawing' ? (state.lang === 'tl' ? 'Linisin ang drawing' : 'Clear drawing') : 'Clear the whole phrase');
    $('btn-speak').setAttribute('aria-label', activeMode === 'keyboard' ? (state.lang === 'tl' ? 'Basahin nang malakas ang mensahe' : 'Speak the typed message aloud') : activeMode === 'drawing' ? (state.lang === 'tl' ? 'Magsalita ng napiling simbolo' : 'Speak the selected symbol') : 'Speak the phrase aloud');
    var predictLabel = $('predict-label'); if (predictLabel) predictLabel.textContent = labels[3];
    var lockLabel = $('lock-label'); if (lockLabel) lockLabel.textContent = state.lang === 'tl' ? 'Pindutin nang matagal' : 'Hold for Settings';
    document.body.dataset.age = state.ageGroup;
    document.body.dataset.lang = state.lang;
    document.body.dataset.textOnly = String(!!state.textOnly);
    document.body.dataset.fontScale = state.fontScale || 'normal';
    document.body.dataset.symbolSize = state.symbolSize || 'medium';
  }

  function renderQuickTools() {
    var state = Store.get();
    var tools = state.communicationTools || ['symbols', 'sentences', 'keyboard', 'drawing'];
    var hasSymbolBoard = tools.indexOf('symbols') >= 0;
    var hasSentences = tools.indexOf('sentences') >= 0;
    var hasKeyboard = tools.indexOf('keyboard') >= 0;
    var hasDrawing = tools.indexOf('drawing') >= 0;
    var modes = [];
    if (hasSymbolBoard) modes.push('board');
    if (hasKeyboard) modes.push('keyboard');
    if (hasDrawing) modes.push('drawing');
    if (modes.indexOf(activeMode) < 0) activeMode = modes[0] || 'board';
    var modeLabels = state.lang === 'tl'
      ? { board: 'Board', keyboard: 'Mag-type ng Mensahe', drawing: 'Gumuhit ng Simbolo' }
      : { board: 'Board', keyboard: 'Type a Message', drawing: 'Draw a Symbol' };
    document.querySelectorAll('.mode-switch__btn').forEach(function (button) {
      var mode = button.dataset.mode;
      button.hidden = modes.indexOf(mode) < 0;
      button.setAttribute('aria-pressed', String(activeMode === mode));
      button.classList.toggle('is-active', activeMode === mode);
      button.textContent = modeLabels[mode];
    });
    $('mode-switch').hidden = modes.length < 2;
    $('draw-match').hidden = activeMode !== 'drawing' || !hasDrawing;
    $('sentence-tool').hidden = !hasSentences || activeMode !== 'board';
    $('keyboard-tool').hidden = !hasKeyboard || activeMode !== 'keyboard';
    $('drawing-tool').hidden = !hasDrawing || activeMode !== 'drawing';
    $('quick-tools').hidden = !hasSentences && !hasKeyboard && !hasDrawing;
    var boardActive = hasSymbolBoard && activeMode === 'board';
    var boardLayout = document.querySelector('.board');
    boardLayout.classList.toggle('board--single', !boardActive);
    boardLayout.classList.toggle('board--keyboard', activeMode === 'keyboard');
    boardLayout.classList.toggle('board--drawing', activeMode === 'drawing');
    var attribution = document.querySelector('.arasaac-credit');
    if (attribution) attribution.hidden = !boardActive;
    el.rail.hidden = !boardActive;
    document.querySelector('.toolbar').hidden = !hasSymbolBoard;
    document.querySelector('.strip').hidden = !hasSymbolBoard;
    document.querySelector('.predict').hidden = !boardActive;
    document.querySelector('.gridwrap').hidden = !boardActive;
    var phrases = state.quickPhrases || [];
    $('quick-phrases').innerHTML = phrases.map(function (p) {
      var label = state.lang === 'tl' ? p.tl : p.en;
      return '<button class="quick-phrase" data-en="' + esc(p.en) + '" data-tl="' + esc(p.tl) + '">' + esc(label) + '</button>';
    }).join('');
    $('quick-phrases').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { speakText(state.lang === 'tl' ? b.dataset.tl : b.dataset.en); });
    });
    var select = $('draw-match');
    select.innerHTML = '<option value="">Choose the closest symbol match…</option>' + Store.symbols().map(function (s) {
      return '<option value="' + s.id + '">' + esc(Store.labels(s).primary) + '</option>';
    }).join('');
    $('keyboard-title').textContent = state.lang === 'tl' ? 'Mag-type ng mensahe' : 'Type a message';
    $('drawing-title').textContent = state.lang === 'tl' ? 'Gumuhit ng simbolo' : 'Draw a symbol';
  }

  function speakText(text) {
    var state = Store.get();
    if (!text || !text.trim()) { toast('Type a message first'); return; }
    if (!state.speechOutput) { toast('Speech output is off'); return; }
    if (!Speech.available()) { toast('Speech is unavailable in this browser'); return; }
    Speech.speak(text.trim(), state.lang, { rate: state.speakRate });
  }

  function renderDrawMatch() {
    var sym = Store.symbol($('draw-match').value);
    if (!sym) { $('draw-preview').innerHTML = ''; return; }
    var label = Store.labels(sym).primary;
    $('draw-preview').innerHTML = '<div class="draw-match-result"><div><span class="draw-match-result__eyebrow">Selected symbol</span><span class="matched-symbol">' + (sym.dataUrl || sym.imageUrl ? '<img src="' + esc(sym.dataUrl || sym.imageUrl) + '" alt="">' : sym.icon) + '<strong>' + esc(label) + '</strong></span></div></div>';
  }

  function setupQuickTools() {
    var keyboard = $('virtual-keyboard');
    var keyRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    keyboard.innerHTML = keyRows.map(function (row) {
      return '<div class="virtual-keyboard__row">' + row.split('').map(function (key) {
        return '<button type="button" class="virtual-key" data-key="' + key + '" aria-label="' + key + '">' + key + '</button>';
      }).join('') + (row === 'zxcvbnm' ? '<button type="button" class="virtual-key virtual-key--wide" data-action="Delete" aria-label="Delete last character">⌫</button>' : '') + '</div>';
    }).join('') +
      '<div class="virtual-keyboard__row virtual-keyboard__row--bottom">' +
        '<button type="button" class="virtual-key virtual-key--wide" data-key="," aria-label="Comma">,</button>' +
        '<button type="button" class="virtual-key virtual-key--space" data-action="space">Space</button>' +
        '<button type="button" class="virtual-key virtual-key--wide" data-key="." aria-label="Period">.</button>' +
      '</div>';
    keyboard.addEventListener('click', function (event) {
      var key = event.target.closest('[data-key], [data-action]');
      if (!key) return;
      var input = $('type-message'), start = input.selectionStart, end = input.selectionEnd;
      var before = input.value.slice(0, start), after = input.value.slice(end);
      if (key.dataset.action === 'Delete') {
        if (start === end && start > 0) before = before.slice(0, -1);
        input.value = before + after;
        input.setSelectionRange(before.length, before.length);
      } else {
        var value = key.dataset.action === 'space' ? ' ' : key.dataset.key;
        input.value = before + value + after;
        input.setSelectionRange(before.length + value.length, before.length + value.length);
      }
      input.focus();
      var settings = Store.get();
      if (settings.hapticFeedback && navigator.vibrate) navigator.vibrate(12);
    });
    var canvas = $('draw-pad'), ctx = canvas.getContext('2d'), drawing = false;
    ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0f172a';
    function point(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX-r.left)*canvas.width/r.width, y: (e.clientY-r.top)*canvas.height/r.height }; }
    canvas.addEventListener('pointerdown', function (e) { drawing = true; drawingHasInk = true; canvas.setPointerCapture(e.pointerId); var p = point(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); });
    canvas.addEventListener('pointermove', function (e) { if (!drawing) return; var p = point(e); ctx.lineTo(p.x,p.y); ctx.stroke(); });
    ['pointerup','pointercancel'].forEach(function (n) { canvas.addEventListener(n, function () { drawing = false; }); });
    clearDrawing = function () { ctx.clearRect(0,0,canvas.width,canvas.height); drawingHasInk = false; $('draw-match').value = ''; $('draw-preview').innerHTML = ''; };
    $('draw-match').addEventListener('change', renderDrawMatch);
  }

  /* ------------------------------------------------------------ actions -- */
  function add(id) {
    var s = Store.get();
    if (s.hapticFeedback && navigator.vibrate) navigator.vibrate(18);
    Store.trackTap(id);
    Store.set({ phrase: s.phrase.concat(id) });
  }

  function Delete() {
    if (activeMode === 'keyboard') {
      var input = $('type-message');
      var start = input.selectionStart, end = input.selectionEnd;
      if (start === end && start > 0) start--;
      input.value = input.value.slice(0, start) + input.value.slice(end);
      input.setSelectionRange(start, start);
      input.focus();
      return;
    }
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
    if (activeMode === 'drawing') { clearDrawing(); return; }
    if (activeMode === 'keyboard') {
      $('type-message').value = '';
      $('type-message').focus();
      return;
    }
    var s = Store.get();
    if (!s.phrase.length) return;
    Store.trackPhrase(s.phrase);
    Predict.learn(s.phrase, 2);
    Store.set({ phrase: [] });
    toast('Phrase cleared', 'trash');
  }

  function speak() {
    if (activeMode === 'keyboard') {
      speakText($('type-message').value);
      return;
    }
    if (activeMode === 'drawing') {
      if (!drawingHasInk) { toast('Draw something first'); return; }
      var selected = Store.symbol($('draw-match').value);
      if (!selected) { toast('Choose the closest symbol match'); $('draw-match').focus(); return; }
      speakText(Store.labels(selected).primary);
      return;
    }
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
    if (e.key === 'Delete') { e.preventDefault(); Delete(); }
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
    setupQuickTools();
    document.querySelectorAll('.mode-switch__btn').forEach(function (button) {
      button.addEventListener('click', function () {
        activeMode = button.dataset.mode;
        renderHeader();
        renderQuickTools();
        renderStrip();
      });
    });

    el.langEn.addEventListener('click', function () { Store.set({ lang: 'en' }); });
    el.langTl.addEventListener('click', function () { Store.set({ lang: 'tl' }); });

    el.ctxLabel.closest('.ctx').addEventListener('click', openContextPicker);

    $('btn-back').addEventListener('click', Delete);
    $('btn-clear').addEventListener('click', clearAll);
    el.speak.addEventListener('click', speak);

    function openCaregiverSettings() {
      global.CC.Pin.open(function () { location.href = 'portal.html'; });
    }
    var lockHold;
    $('btn-lock').addEventListener('pointerdown', function () { lockHold = setTimeout(openCaregiverSettings, 650); });
    ['pointerup','pointercancel','pointerleave'].forEach(function (type) { $('btn-lock').addEventListener(type, function () { clearTimeout(lockHold); }); });
    $('btn-lock').addEventListener('click', function (event) { if (event.detail === 0) openCaregiverSettings(); });

    document.addEventListener('keydown', onKey);

    Store.subscribe(function () {
      renderHeader(); renderRail(); renderGrid(); renderStrip(); renderPredict(); renderQuickTools();
    });

    renderHeader(); renderRail(); renderGrid(); renderStrip(); renderPredict(); renderQuickTools();
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
          '<button class="geoitem' + (!state.activeContext ? ' is-on' : '') + '" data-g="" style="width:100%;text-align:left;cursor:pointer"><span class="geoitem__ic">' + UI.pin + '</span><span><span class="geoitem__t">' + (state.lang === 'tl' ? 'Auto · Walang lugar' : 'Auto · No location') + '</span><span class="geoitem__d">' + (state.lang === 'tl' ? 'Awtomatikong lokasyon' : 'Automatic location') + '</span></span>' + (!state.activeContext ? '<span class="pill pill--success"><span class="pill__dot"></span>Active</span>' : '') + '</button>' +
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
