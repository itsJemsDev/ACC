/* =========================================================================
   COMMUNICARE — Caregiver portal controller
   Five screens behind a PIN: Dashboard · Profile · Vocabulary · Geofencing
   · Analytics.
   ========================================================================= */
(function (global) {
  'use strict';

  var Store = global.CC.Store, UI = global.CC.UI;
  var el = {};

  function $(id) { return document.getElementById(id); }
  function h(t, c, html) { var n = document.createElement(t); if (c) n.className = c; if (html != null) n.innerHTML = html; return n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function fx(n) { return Number(n || 0).toLocaleString('en-US'); }
  function when(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function bytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }
  function densityLabel() {
    return { early: '3 × 3', youth: '4 × 5', adult: '5 × 6' }[Store.get().ageGroup] || '4 × 5';
  }
  function toast(msg, icon) {
    var t = h('div', 'toast', (icon ? UI[icon] : '') + '<span>' + esc(msg) + '</span>');
    $('toasts').appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 200); }, 2200);
  }

  /* ══════════════════════════════════════════════════════ DASHBOARD ══ */
  function renderDashboard() {
    var s = Store.get();
    var geo = Store.geofence(s.activeContext) || { label: '—', coords: '—', radius: 0 };
    var routine = Store.routineNow();
    var total = Store.symbols().length;

    var stats = [
      ['Vocabulary items', fx(total), ''],
      ['Categories', String(global.CC.CATEGORIES.length), ''],
      ['Grid density', densityLabel(), ''],
      ['Symbols tapped', fx(s.stats.symbolsTapped), ''],
      ['Phrases built', fx(s.stats.phrasesBuilt), '']
    ];

    el.vDash.innerHTML =
      /* ── Quick Performance Summary ── */
      '<section class="psection">' +
        '<h2 class="psection__title">Quick Performance Summary</h2>' +
        '<div class="stats">' +
          stats.map(function (p) {
            return '<div class="card stat"><span class="stat__l">' + esc(p[0]) + '</span>' +
              '<span class="stat__v' + (p[2] ? ' stat__v--sm' : '') + '">' + esc(p[1]) + '</span></div>';
          }).join('') +
        '</div>' +
      '</section>' +

      /* ── Board configuration strip ── */
      '<section class="psection">' +
        '<div class="card"><div class="card__body">' +
          '<div class="metrics" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
            '<div><div class="metric__l">Symbol size</div>' +
              '<div class="metric__v">' + esc(s.symbolSize[0].toUpperCase() + s.symbolSize.slice(1)) + '</div></div>' +
            '<div><div class="metric__l">Speech output</div>' +
              '<div class="metric__v">' + (s.speechOutput ? 'Supported' : 'Disabled') + '</div></div>' +
          '</div>' +
        '</div></div>' +
      '</section>' +

      /* ── Users + sync ── */
      '<section class="psection">' +
        '<div class="card">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr">' +

            /* Current Users */
            '<div style="padding:22px 24px 26px;border-right:1px solid var(--c-line)">' +
              '<div class="card__head" style="padding:0"><h3 class="card__title">Current Users</h3></div>' +
              '<table class="tbl" style="margin-top:22px">' +
                '<thead><tr>' +
                  '<th>Active sessions</th><th>Last active</th><th>Profiles on this device</th>' +
                '</tr></thead>' +
                '<tbody><tr>' +
                  '<td><div class="who">' +
                    '<span class="who__av">' + esc(s.profile.initials) + '</span>' +
                    '<span><span class="who__name">' + esc(s.profile.name) + '</span>' +
                    '<span class="who__sub">' + (s.lang === 'tl' ? 'Tagalog' : 'English') + '</span></span>' +
                  '</div></td>' +
                  '<td>' + esc(when(s.stats.lastSync)) + '</td>' +
                  '<td>' + (s.history.length ? s.history.length + ' recent' : '1 of 1') + '</td>' +
                '</tr></tbody>' +
              '</table>' +
            '</div>' +

            /* Network and Sync Status */
            '<div style="padding:22px 24px 26px">' +
              '<div style="display:flex;align-items:center;gap:12px">' +
                '<h3 class="card__title">Network and Sync Status</h3>' +
                '<button class="btn btn--sm btn--primary" id="btn-sync" style="margin-left:auto">' +
                  UI.cloud + '<span>Sync now</span></button>' +
              '</div>' +
              '<div class="statusline" style="margin-top:22px">' +
                '<span class="pill pill--success"><span class="pill__dot"></span>Online</span>' +
                '<span class="statusline__note">• All changes synced</span>' +
              '</div>' +
              '<hr class="card__rule">' +
              '<div class="metrics" style="margin-top:20px">' +
                '<div><div class="metric__l">Last sync</div>' +
                  '<div class="metric__v">' + esc(when(s.stats.lastSync)) + '</div></div>' +
                '<div><div class="metric__l">Pending changes</div>' +
                  '<div class="metric__v">' + fx(s.stats.pendingChanges) + '</div></div>' +
                '<div><div class="metric__l">Local storage</div>' +
                  '<div class="metric__v">' + bytes(s.stats.storageBytes) + '</div></div>' +
              '</div>' +
            '</div>' +

          '</div>' +
        '</div>' +
      '</section>' +

      /* ── Active Location Context ── */
      '<section class="psection">' +
        '<div class="card">' +
          '<div class="card__body">' +
            '<h3 class="card__title">Active Location Context</h3>' +
            '<div class="lahead" style="margin-top:18px">' +
              '<span class="lahead__place">' + esc(geo.label) + '</span>' +
              '<span class="lahead__routine">Current: ' +
                (routine ? esc(routine.label) : Store.partOfDay()) + '</span>' +
              '<span class="pill pill--success"><span class="pill__dot"></span>Inside zone</span>' +
              '<span class="pill pill--warn">Simulated</span>' +
            '</div>' +
            '<hr class="card__rule">' +
            '<div class="metrics" style="margin-top:20px">' +
              '<div><div class="metric__l">Coordinates</div>' +
                '<div class="metric__v metric__v--mono">' + esc(geo.coords) + '</div></div>' +
              '<div><div class="metric__l">Radius</div>' +
                '<div class="metric__v">' + geo.radius + ' m</div></div>' +
              '<div><div class="metric__l">Last detected</div>' +
                '<div class="metric__v">' + esc(s.stats.lastDetected) + '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>';

    $('btn-sync').addEventListener('click', function () {
      Store.markSynced();
      toast('All changes synced', 'check');
      renderDashboard();
    });
  }

  /* ═══════════════════════════════════════════════════════ PROFILE ══ */
  function renderProfile() {
    var s = Store.get();
    var ages = [
      ['early', 'Early Childhood', 'Ages 3–8 · large icons, minimal clutter'],
      ['youth', 'Youth / Adolescent', 'Ages 9–17 · balanced density'],
      ['adult', 'Adult', 'Ages 18+ · compact, dense vocabulary']
    ];
    var sizes = [['large', 'Large'], ['medium', 'Medium'], ['compact', 'Compact']];

    el.vProfile.innerHTML =
      '<div class="formgrid">' +

        '<div class="col">' +
          '<div class="card"><div class="card__body">' +
            '<h3 class="card__title">Communicator profile</h3>' +
            '<p class="field__hint" style="margin-top:6px">Used to auto-select grid density and speech defaults.</p>' +
            '<div style="margin-top:22px">' +
              '<label class="field"><span class="field__label">Display name</span>' +
                '<input class="input" id="p-name" value="' + esc(s.profile.name) + '" maxlength="40"></label>' +
              '<label class="field"><span class="field__label">Age</span>' +
                '<input class="input" id="p-age" type="number" min="1" max="99" value="' + s.profile.age + '"></label>' +
              '<label class="field" style="margin-bottom:0"><span class="field__label">Default language</span>' +
                '<select class="select" id="p-lang">' +
                  '<option value="en"' + (s.lang === 'en' ? ' selected' : '') + '>English</option>' +
                  '<option value="tl"' + (s.lang === 'tl' ? ' selected' : '') + '>Tagalog</option>' +
                '</select></label>' +
            '</div>' +
          '</div></div>' +

          '<div class="card"><div class="card__body">' +
            '<h3 class="card__title">Age-adaptive grid</h3>' +
            '<p class="field__hint" style="margin-top:6px">Task 2 — three density presets that resize the board automatically.</p>' +
            '<div class="choices" style="margin-top:20px">' +
              ages.map(function (a) {
                return '<button class="choice" data-age="' + a[0] + '" aria-pressed="' + (s.ageGroup === a[0]) + '">' +
                  '<span class="choice__mark"></span>' +
                  '<span><span class="choice__t">' + a[1] + '</span>' +
                  '<span class="choice__d">' + a[2] + '</span></span></button>';
              }).join('') +
            '</div>' +
          '</div></div>' +
        '</div>' +

        '<div class="col">' +
          '<div class="card"><div class="card__body">' +
            '<h3 class="card__title">Board appearance</h3>' +
            '<div style="margin-top:20px">' +
              '<div class="field__label" style="margin-bottom:8px">Symbol size</div>' +
              '<div class="choices" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
                sizes.map(function (z) {
                  return '<button class="choice" data-size="' + z[0] + '" aria-pressed="' + (s.symbolSize === z[0]) + '" ' +
                    'style="justify-content:center;align-items:center;padding:14px">' +
                    '<span class="choice__t">' + z[1] + '</span></button>';
                }).join('') +
              '</div>' +
            '</div>' +
            '<hr class="card__rule" style="margin-top:24px">' +
            '<div style="margin-top:8px">' +
              '<div class="switchrow">' +
                '<span><span class="switchrow__t">Speech output</span>' +
                '<span class="switchrow__d">Speak each phrase aloud on Speak</span></span>' +
                '<label class="switch"><input type="checkbox" id="p-speech"' + (s.speechOutput ? ' checked' : '') +
                  '><span class="switch__track"><span class="switch__knob"></span></span></label>' +
              '</div>' +
              '<div class="switchrow">' +
                '<span><span class="switchrow__t">Show Tagalog subtitle</span>' +
                '<span class="switchrow__d">Display the second language under each symbol</span></span>' +
                '<label class="switch"><input type="checkbox" id="p-sub"' + (s.lang ? ' checked' : '') +
                  '><span class="switch__track"><span class="switch__knob"></span></span></label>' +
              '</div>' +
            '</div>' +
          '</div></div>' +

          '<div class="card"><div class="card__body">' +
            '<h3 class="card__title">Security</h3>' +
            '<div style="margin-top:20px">' +
              '<label class="field" style="margin-bottom:0"><span class="field__label">Caregiver PIN</span>' +
                '<input class="input" id="p-pin" inputmode="numeric" maxlength="4" value="' + esc(s.pin) + '">' +
                '<span class="field__hint">4 digits. Required to leave the board for this portal.</span></label>' +
            '</div>' +
            '<hr class="card__rule" style="margin-top:24px">' +
            '<div class="rowend" style="margin-top:24px">' +
              '<button class="btn" id="p-reset">Reset board</button>' +
              '<button class="btn btn--primary" id="p-save">Save changes</button>' +
            '</div>' +
          '</div></div>' +
        '</div>' +

      '</div>';

    el.vProfile.querySelectorAll('[data-age]').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.set({ ageGroup: b.dataset.age });
        toast('Grid preset: ' + b.querySelector('.choice__t').textContent, 'grid');
      });
    });
    el.vProfile.querySelectorAll('[data-size]').forEach(function (b) {
      b.addEventListener('click', function () { Store.set({ symbolSize: b.dataset.size }); });
    });

    $('p-save').addEventListener('click', function () {
      var name = $('p-name').value.trim() || 'Guest Child';
      var pin = ($('p-pin').value || '').replace(/\D/g, '').slice(0, 4);
      Store.set({
        profile: {
          name: name,
          age: Math.max(1, Math.min(99, +$('p-age').value || 10)),
          initials: name.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase()
        },
        lang: $('p-lang').value,
        speechOutput: $('p-speech').checked,
        pin: pin.length === 4 ? pin : Store.get().pin
      });
      toast('Settings saved', 'check');
      renderProfile();
    });

    $('p-reset').addEventListener('click', function () {
      if (!confirm('Reset the board? Phrase history and uploaded symbols will be cleared.')) return;
      Store.reset();
      toast('Board reset');
      go('dashboard');
    });
  }

  /* ════════════════════════════════════════════════════ VOCABULARY ══ */
  function renderVocabulary() {
    var s = Store.get();
    var cats = global.CC.CATEGORIES;

    el.vVocab.innerHTML =
      '<section class="psection">' +
        '<h2 class="psection__title">Custom vocabulary uploader</h2>' +
        '<div class="card"><div class="card__body">' +
          '<div class="formgrid" style="align-items:start">' +
            '<div>' +
              '<label class="field"><span class="field__label">Symbol image</span>' +
                '<div class="dropzone" id="drop" tabindex="0" role="button">' +
                  UI.image +
                  '<div class="dropzone__t">Drop an image, or browse</div>' +
                  '<div class="dropzone__d">PNG or JPG · square works best · stored on this device only</div>' +
                '</div>' +
                '<input type="file" id="file" accept="image/*" class="u-sr">' +
                '<div class="preview" id="prev">' +
                  '<img alt=""><span class="field__hint" style="margin:0">Ready to save</span></div>' +
              '</label>' +
              '<label class="field"><span class="field__label">English label</span>' +
                '<input class="input" id="v-en" placeholder="e.g. Balloon" maxlength="30"></label>' +
              '<label class="field"><span class="field__label">Tagalog label</span>' +
                '<input class="input" id="v-tl" placeholder="e.g. Balon" maxlength="30"></label>' +
              '<label class="field" style="margin-bottom:0"><span class="field__label">Category</span>' +
                '<select class="select" id="v-cat">' +
                  cats.map(function (c) { return '<option value="' + c.id + '">' + c.label + '</option>'; }).join('') +
                '</select></label>' +
              '<div class="rowend" style="margin-top:24px">' +
                '<button class="btn" id="v-clear">Clear</button>' +
                '<button class="btn btn--primary" id="v-save">' + UI.plus + '<span>Add to board</span></button>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="field__label" style="margin-bottom:12px">Preview</div>' +
              '<div class="vtile" style="cursor:default">' +
                '<div class="vtile__art" id="pv-art">' + global.CC.ART.more + '</div>' +
                '<div class="vtile__l1" id="pv-en">Balloon</div>' +
                '<div class="vtile__l2" id="pv-tl">Balon</div>' +
                '<span class="vtile__cat" id="pv-cat">Others</span>' +
              '</div>' +
              '<p class="field__hint" style="margin-top:16px">Uploaded symbols appear immediately in the matching ' +
                'category on the board, with the same bilingual labelling.</p>' +
            '</div>' +
          '</div>' +
        '</div></div>' +
      '</section>' +

      '<section class="psection">' +
        '<h2 class="psection__title">Board vocabulary <span class="u-muted" style="font-weight:400">' +
          '(' + Store.symbols().length + ' symbols)</span></h2>' +
        '<div class="vocabgrid">' +
          Store.symbols().map(function (x) {
            var l = Store.labels(x);
            return '<div class="vtile">' +
              '<div class="vtile__art">' + (x.dataUrl ? '<img src="' + x.dataUrl + '" alt="">' : x.icon) + '</div>' +
              '<div class="vtile__l1">' + esc(l.primary) + '</div>' +
              '<div class="vtile__l2">' + esc(l.secondary) + '</div>' +
              '<span class="vtile__cat">' + esc((cats.filter(function (c) { return c.id === x.cat; })[0] || {}).label || x.cat) + '</span>' +
              '</div>';
          }).join('') +
        '</div>' +
      '</section>';

    wireUploader();
  }

  function wireUploader() {
    var pending = null;
    var drop = $('drop'), file = $('file'), prev = $('prev');

    function read(f) {
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('That file is not an image'); return; }
      if (f.size > 1.5 * 1024 * 1024) { toast('Image is too large (max 1.5 MB)'); return; }
      var r = new FileReader();
      r.onload = function () {
        pending = r.result;
        prev.querySelector('img').src = pending;
        prev.classList.add('is-on');
        $('pv-art').innerHTML = '<img src="' + pending + '" alt="">';
        toast('Image loaded');
      };
      r.readAsDataURL(f);
    }

    drop.addEventListener('click', function () { file.click(); });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); }
    });
    file.addEventListener('change', function () { read(file.files[0]); });
    ['dragenter', 'dragover'].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) read(e.dataTransfer.files[0]);
    });

    function syncPreview() {
      $('pv-en').textContent = $('v-en').value.trim() || 'Balloon';
      $('pv-tl').textContent = $('v-tl').value.trim() || 'Balon';
      var c = $('v-cat').value;
      $('pv-cat').textContent = (global.CC.CATEGORIES.filter(function (x) { return x.id === c; })[0] || {}).label || c;
    }
    ['v-en', 'v-tl', 'v-cat'].forEach(function (id) {
      $(id).addEventListener('input', syncPreview);
      $(id).addEventListener('change', syncPreview);
    });

    $('v-clear').addEventListener('click', function () {
      pending = null; file.value = '';
      ['v-en', 'v-tl'].forEach(function (i) { $(i).value = ''; });
      prev.classList.remove('is-on');
      $('pv-art').innerHTML = global.CC.ART.more;
      syncPreview();
    });

    $('v-save').addEventListener('click', function () {
      var en = $('v-en').value.trim(), tl = $('v-tl').value.trim();
      if (!en && !tl) { toast('Add at least one label'); return; }
      var st = Store.get();
      var id = 'c' + Date.now().toString(36);
      st.customSymbols.push({
        id: id, en: en || tl, tl: tl || en, cat: $('v-cat').value, dataUrl: pending, icon: global.CC.ART.more
      });
      Store.set({ customSymbols: st.customSymbols });
      toast('“' + (en || tl) + '” added to the board', 'check');
      renderVocabulary();
    });
  }

  /* ═══════════════════════════════════════════════════ GEOFENCING ══ */
  function renderGeofencing() {
    var s = Store.get();

    /* schematic map — percent positions so no map tiles/network are needed */
    var spots = { home: [22, 68], school: [58, 34], clinic: [80, 66] };
    var pins = s.geofences.map(function (g) {
      var p = spots[g.id] || [50, 50];
      var on = g.id === s.activeContext;
      return '<div class="map__zone" style="left:' + p[0] + '%;top:' + p[1] + '%;width:' +
          Math.max(14, g.radius / 6) + '%;aspect-ratio:1"></div>';
    }).join('') + s.geofences.map(function (g) {
      var p = spots[g.id] || [50, 50];
      var on = g.id === s.activeContext;
      return '<div class="map__pin' + (on ? ' is-active' : '') + '" style="left:' + p[0] + '%;top:' + p[1] + '%">' +
        UI.pin + '<b>' + esc(g.label) + (on ? ' · active' : '') + '</b></div>';
    }).join('');

    el.vGeo.innerHTML =
      '<section class="psection">' +
        '<h2 class="psection__title">Geofence &amp; location context</h2>' +
        '<div class="card"><div class="card__body">' +
          '<div class="map">' + pins + '</div>' +
          '<p class="field__hint" style="margin-top:14px">Schematic preview. On device this reads live GPS; ' +
            'the active zone drives the board header chip and re-ranks the Top-5 predictions.</p>' +
        '</div></div>' +
      '</section>' +

      '<section class="psection">' +
        '<h2 class="psection__title">Saved locations</h2>' +
        '<div class="geolist">' +
          s.geofences.map(function (g) {
            return '<div class="geoitem' + (g.id === s.activeContext ? ' is-on' : '') + '" data-geo="' + g.id + '">' +
              '<span class="geoitem__ic">' + UI.pin + '</span>' +
              '<span><span class="geoitem__t">' + esc(g.label) + '</span>' +
              '<span class="geoitem__d u-mono">' + esc(g.coords) + ' · radius ' + g.radius + ' m · ' +
                (g.boost || []).length + ' boosted symbols</span></span>' +
              '<span class="geoitem__toggles">' +
                '<label class="switch"><input type="checkbox" data-act="active" data-id="' + g.id + '"' +
                  (g.active ? ' checked' : '') + '><span class="switch__track"><span class="switch__knob"></span></span></label>' +
                '<button class="btn btn--sm" data-act="make-active" data-id="' + g.id + '"' +
                  (g.id === s.activeContext ? ' disabled' : '') + '>' +
                  (g.id === s.activeContext ? 'Active' : 'Set active') + '</button>' +
              '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="psection">' +
        '<h2 class="psection__title">Time-of-day routine rules</h2>' +
        '<div class="card"><div class="card__body">' +
          '<div class="routine">' +
            s.routines.map(function (r, i) {
              return '<div class="routine__row">' +
                '<span class="routine__t">' + esc(r.label) + '</span>' +
                '<span class="u-muted" style="font-size:13px">' + esc((Store.geofence(r.ctx) || {}).label || r.ctx) + '</span>' +
                '<span style="display:flex;gap:8px">' +
                  '<input class="input" style="height:40px" type="time" data-r="' + i + '" data-f="from" value="' + r.from + '">' +
                  '<input class="input" style="height:40px" type="time" data-r="' + i + '" data-f="to" value="' + r.to + '">' +
                '</span>' +
                '<button class="iconbtn" data-del-r="' + i + '" aria-label="Remove rule">' + UI.trash + '</button>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<div class="rowend" style="margin-top:24px">' +
            '<button class="btn btn--sm" id="r-add">' + UI.plus + '<span>Add routine</span></button>' +
          '</div>' +
        '</div></div>' +
      '</section>';

    el.vGeo.querySelectorAll('[data-act="active"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var st = Store.get();
        st.geofences.forEach(function (g) { if (g.id === cb.dataset.id) g.active = cb.checked; });
        Store.set({ geofences: st.geofences });
      });
    });
    el.vGeo.querySelectorAll('[data-act="make-active"]').forEach(function (b) {
      b.addEventListener('click', function () {
        Store.set({ activeContext: b.dataset.id });
        toast('Active context: ' + (Store.geofence(b.dataset.id) || {}).label, 'pin');
        renderGeofencing();
      });
    });
    el.vGeo.querySelectorAll('[data-r]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var st = Store.get();
        st.routines[+inp.dataset.r][inp.dataset.f] = inp.value;
        Store.set({ routines: st.routines });
        toast('Routine updated', 'check');
      });
    });
    el.vGeo.querySelectorAll('[data-del-r]').forEach(function (b) {
      b.addEventListener('click', function () {
        var st = Store.get();
        st.routines.splice(+b.dataset.delR, 1);
        Store.set({ routines: st.routines });
        renderGeofencing();
      });
    });
    $('r-add').addEventListener('click', function () {
      var st = Store.get();
      st.routines.push({ id: 'r' + Date.now().toString(36), ctx: st.activeContext, from: '08:00', to: '09:00', label: 'New routine' });
      Store.set({ routines: st.routines });
      renderGeofencing();
    });
  }

  /* ════════════════════════════════════════════════════ ANALYTICS ══ */
  function renderAnalytics() {
    var s = Store.get();
    var per = s.stats.perSymbol;
    var rows = Object.keys(per).map(function (id) { return [id, per[id]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8);
    var max = rows.length ? rows[0][1] : 1;

    /* hourly sparkline/area chart */
    var H = 220, W = 900, pad = 28;
    var data = s.stats.perHour;
    var mx = Math.max.apply(null, data) || 1;
    var step = (W - pad * 2) / (data.length - 1);
    var pts = data.map(function (v, i) { return [pad + i * step, H - pad - (v / mx) * (H - pad * 2)]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - pad) +
               ' L' + pts[0][0].toFixed(1) + ' ' + (H - pad) + ' Z';
    var grid = [0, 1, 2, 3].map(function (i) {
      var y = pad + i * ((H - pad * 2) / 3);
      return '<line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y +
             '" stroke="#e2e8f0" stroke-width="1"/>';
    }).join('');
    var hours = [0, 6, 12, 18, 23].map(function (hh) {
      return '<text x="' + (pad + hh * step) + '" y="' + (H - 8) + '" font-size="11" fill="#94a3b8" ' +
             'text-anchor="middle">' + String(hh).padStart(2, '0') + ':00</text>';
    }).join('');

    el.vStats.innerHTML =
      '<section class="psection">' +
        '<h2 class="psection__title">Board performance</h2>' +
        '<div class="stats">' +
          [['Symbols tapped', fx(s.stats.symbolsTapped)],
           ['Phrases built', fx(s.stats.phrasesBuilt)],
           ['Avg. phrase length', (s.stats.phrasesBuilt ? (s.stats.symbolsTapped / s.stats.phrasesBuilt).toFixed(1) : '0') + ' sym'],
           ['Vocabulary size', fx(Store.symbols().length)],
           ['Categories', String(global.CC.CATEGORIES.length)]]
          .map(function (p) {
            return '<div class="card stat"><span class="stat__l">' + p[0] + '</span>' +
              '<span class="stat__v' + (String(p[1]).length > 6 ? ' stat__v--sm' : '') + '">' + esc(p[1]) + '</span></div>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="psection">' +
        '<div class="card"><div class="card__body">' +
          '<h3 class="card__title">Symbol taps by hour</h3>' +
          '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" ' +
            'aria-label="Line chart of symbol taps per hour">' +
            '<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="#2563eb" stop-opacity=".22"/>' +
              '<stop offset="100%" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs>' +
            grid + '<path d="' + area + '" fill="url(#ag)"/>' +
            '<path d="' + line + '" fill="none" stroke="#2563eb" stroke-width="2.5" ' +
              'stroke-linejoin="round" stroke-linecap="round"/>' + hours +
          '</svg>' +
        '</div></div>' +
      '</section>' +

      '<section class="psection">' +
        '<h2 class="psection__title">Most used symbols</h2>' +
        '<div class="card"><div class="card__body">' +
          (rows.length ? '<div class="bars">' + rows.map(function (r) {
            var sym = Store.symbol(r[0]);
            var l = sym ? Store.labels(sym) : { primary: r[0] };
            return '<div class="barrow"><span class="barrow__l">' + esc(l.primary) + '</span>' +
              '<span class="barrow__track"><span class="barrow__fill" style="width:' +
              Math.max(4, (r[1] / max) * 100) + '%"></span></span>' +
              '<span class="barrow__v">' + fx(r[1]) + '</span></div>';
          }).join('') + '</div>'
          : '<p class="u-muted">No symbol activity recorded yet — tap symbols on the board to start building stats.</p>') +
        '</div></div>' +
      '</section>';
  }

  /* ══════════════════════════════════════════════════════ ROUTING ══ */
  var RENDER = {
    dashboard: renderDashboard,
    profile: renderProfile,
    vocabulary: renderVocabulary,
    geofencing: renderGeofencing,
    analytics: renderAnalytics
  };

  function go(view) {
    if (!RENDER[view]) view = 'dashboard';
    Object.keys(RENDER).forEach(function (v) {
      document.getElementById('view-' + v).hidden = (v !== view);
    });
    el.nav.querySelectorAll('.navlink[data-view]').forEach(function (a) {
      if (a.dataset.view === view) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.getElementById('page-title').textContent = {
      dashboard: 'Caregiver Dashboard',
      profile: 'Age & Profile Settings',
      vocabulary: 'Custom Vocabulary',
      geofencing: 'Geofencing & Location',
      analytics: 'Board Analytics'
    }[view];
    document.getElementById('page-sub').textContent = {
      dashboard: 'Monitor the communicator, connection, location context and board performance.',
      profile: 'Set age group, grid density and symbol defaults for the communication board.',
      vocabulary: 'Upload your own symbols and label them in Tagalog and English.',
      geofencing: 'Configure GPS zones and time-of-day routine rules.',
      analytics: 'See how the board is being used over time.'
    }[view];
    RENDER[view]();
    if (location.hash.slice(1) !== view) history.replaceState(null, '', '#' + view);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ══════════════════════════════════════════════════════════ INIT ══ */
  function init() {
    Store.init();
    el.vDash = $('view-dashboard');
    el.vProfile = $('view-profile');
    el.vVocab = $('view-vocabulary');
    el.vGeo = $('view-geofencing');
    el.vStats = $('view-analytics');
    el.nav = $('pnav');

    el.nav.querySelectorAll('[data-view]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); go(a.dataset.view); });
    });

    document.getElementById('pnav-logout').addEventListener('click', function () {
      global.CC.Pin.open(function () { location.href = 'index.html'; });
    });

    global.addEventListener('hashchange', function () { go(location.hash.slice(1)); });

    var start = location.hash.slice(1);
    go(RENDER[start] ? start : 'dashboard');
  }

  global.CC = global.CC || {};
  global.CC.Portal = { init: init, go: go };
})(window);