/* =========================================================================
   COMMUNICARE — Caregiver portal controller
   Five screens behind a PIN: Dashboard · Profile · Vocabulary · Geofencing
   · Analytics.
   ========================================================================= */
(function (global) {
  'use strict';

  var Store = global.CC.Store, UI = global.CC.UI;
  var CORE_SYMBOLS = ['me','go','need','pay','buy','work','yes','want','you','no','hungry','eat','drink','play','sleep','stop','please','thanks','hug','help'];
  var CAT_LABEL_TL = { basic:'PANGUNAHIN', others:'MGA BAGAY', places:'MGA LUGAR', feelings:'DAMDAMIN', people:'MGA TAO', food:'PAGKAIN', needs:'PANGANGAILANGAN', actions:'GAWAIN' };
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
  function exportLogs() {
    var rows = [['Timestamp', 'Phrase', 'Symbols']];
    (Store.get().history || []).forEach(function (entry) {
      var words = (entry.ids || []).map(function (id) { var symbol = Store.symbol(id); return symbol ? Store.labels(symbol).primary : id; });
      rows.push([when(entry.at), words.join(' '), words.length]);
    });
    var csv = rows.map(function (row) { return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url; link.download = 'communicare-phrase-logs.csv'; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function saveZone(coordsText) {
    var parts = String(coordsText).split(',').map(function (part) { return Number(part.trim()); });
    if (parts.length !== 2 || !isFinite(parts[0]) || !isFinite(parts[1]) || Math.abs(parts[0]) > 90 || Math.abs(parts[1]) > 180) {
      toast('Enter valid latitude and longitude'); return;
    }
    var label = prompt('Name this location:', 'New location');
    if (!label || !label.trim()) return;
    var state = Store.get();
    var id = 'zone-' + Date.now().toString(36);
    state.geofences.push({ id: id, label: label.trim(), coords: parts[0].toFixed(4) + ', ' + parts[1].toFixed(4), radius: 200, active: true, boost: [] });
    Store.set({ geofences: state.geofences, activeContext: id });
    renderGeofencing();
    toast('Geofence zone added', 'check');
  }
  function densityLabel() {
    return { large: 'Large buttons', medium: 'Balanced', compact: 'More words' }[Store.get().symbolSize] || 'Balanced';
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
      ['Categories', String(Store.categories().length), ''],
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
  function renderDashboardReference() {
    var s = Store.get();
    var symbols = Store.symbols();
    var history = s.history || [];
    var name = (s.profile && s.profile.name) || 'your communicator';
    var popular = Object.keys(s.stats.perSymbol || {}).map(function (id) {
      return { symbol: Store.symbol(id), count: s.stats.perSymbol[id] };
    }).filter(function (x) { return x.symbol; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 4);
    var recent = history.slice(0, 4).map(function (entry) {
      var words = (entry.ids || []).map(function (id) { return Store.symbol(id); }).filter(Boolean).map(function (sym) { return Store.labels(sym).primary; });
      return '<div class="dash-phrase"><span>' + esc(words.join(' ')) + '</span><time>' + esc(when(entry.at)) + '</time></div>';
    }).join('');
    var geofenceCount = (s.geofences || []).filter(function (zone) { return zone.active; }).length;

    el.vDash.innerHTML =
      '<section class="caregiver-welcome"><div><span class="caregiver-welcome__eyebrow">CAREGIVER / SPED TEACHER WORKSPACE</span><h2>Welcome</h2><p>Here is a quick overview of ' + esc(name) + '\'s communication board.</p></div><div class="caregiver-welcome__actions"><a class="btn btn--primary" href="index.html">Open AAC board</a><button type="button" class="btn" data-go="settings">Settings</button></div></section>' +
      '<div class="dash-stats">' +
        '<article class="dash-stat"><div class="dash-stat__label dash-stat__label--blue">' + UI.book + ' PHRASES BUILT</div><strong>' + fx(s.stats.phrasesBuilt) + '</strong><p>Total phrases recorded</p></article>' +
        '<article class="dash-stat"><div class="dash-stat__label dash-stat__label--green">' + UI.book + ' SYMBOLS</div><strong>' + fx(symbols.length) + '</strong><p>' + fx((s.customSymbols || []).length) + ' custom symbols</p></article>' +
        '<article class="dash-stat"><div class="dash-stat__label dash-stat__label--purple">' + UI.spark + ' QUICK PHRASES</div><strong>' + fx((s.quickPhrases || []).length) + '</strong><p>Ready to speak on the board</p></article>' +
        '<article class="dash-stat"><div class="dash-stat__label dash-stat__label--orange">' + UI.pin + ' ACTIVE Geofencing</div><strong>' + fx(geofenceCount) + '</strong><p>Places used for suggestions</p></article>' +
      '</div>' +
      '<div class="dash-columns">' +
        '<section class="card dash-panel dash-recent"><div class="dash-panel__head"><h2>' + UI.clock + ' Recent phrases</h2><button class="dash-link" data-go="analytics">View history ' + UI.back + '</button></div>' +
          (recent || '<div class="dash-empty">Spoken phrases will appear here after the board is used.</div>') +
        '</section>' +
        '<div class="dash-side">' +
          '<section class="card dash-panel dash-popular"><div class="dash-panel__head"><h2>' + UI.spark + ' Most used symbols</h2></div>' +
            (popular.length ? '<div class="dash-popular__list">' + popular.map(function (item) { var label = Store.labels(item.symbol).primary; return '<div><span>' + esc(label) + '</span><b>' + fx(item.count) + '</b></div>'; }).join('') + '</div>' : '<div class="dash-empty">Symbol activity will appear here.</div>') +
          '</section>' +
          '<section class="card dash-panel dash-access"><h2>Quick links</h2>' +
            '<button class="dash-access__link" data-go="vocabulary"><span class="dash-access__icon dash-access__icon--green">' + UI.book + '</span><span><b>Vocabulary</b><small>Add symbols and organize categories</small></span><span class="dash-chevron">›</span></button>' +
            '<button class="dash-access__link" data-go="profile"><span class="dash-access__icon dash-access__icon--blue">' + UI.user + '</span><span><b>Profile</b><small>Name, age group, and language</small></span><span class="dash-chevron">›</span></button>' +
            '<button class="dash-access__link" data-go="settings"><span class="dash-access__icon dash-access__icon--purple">' + UI.settings + '</span><span><b>Settings</b><small>Board layout and accessibility</small></span><span class="dash-chevron">›</span></button>' +
            '<button class="dash-access__link" data-go="geofencing"><span class="dash-access__icon dash-access__icon--orange">' + UI.pin + '</span><span><b>Geofencing</b><small>Manage location based suggestions</small></span><span class="dash-chevron">›</span></button>' +
            '<button class="dash-access__link" data-go="analytics"><span class="dash-access__icon dash-access__icon--purple">' + UI.chart + '</span><span><b>Analytics</b><small>Review recent phrase activity</small></span><span class="dash-chevron">›</span></button>' +
          '</section>' +
        '</div>' +
      '</div>';
    el.vDash.querySelectorAll('[data-go]').forEach(function (button) { button.addEventListener('click', function () { go(button.dataset.go); }); });
  }

  function renderProfile() {
    var s = Store.get();
    var ageOptions = [['early', 'Child', '3–12 years'], ['youth', 'Youth', '13–17 years'], ['adult', 'Adult', '18+ years']];
    el.vProfile.innerHTML =
      '<section class="settings-intro"><div><span class="u-eyebrow">CAREGIVER / SPED TEACHER</span><h2>Communicator profile</h2><p>Keep the communicator’s basic details and language in one place.</p></div><span class="settings-save-note">Changes apply after you select Save profile.</span></section>' +
      '<section class="profile-form-card card"><div class="card__body"><h3 class="card__title">Basic information</h3>' +
        '<div class="profile-form-grid"><label class="field"><span class="field__label">Name</span><input class="input" id="p-name" value="' + esc(s.profile.name) + '" maxlength="40" autocomplete="name"></label>' +
        '<label class="field"><span class="field__label">Age (years)</span><input class="input" id="p-age" type="number" min="1" max="99" value="' + s.profile.age + '"></label>' +
        '<label class="field"><span class="field__label">Default language</span><select class="select" id="p-lang"><option value="en"' + (s.lang === 'en' ? ' selected' : '') + '>English</option><option value="tl"' + (s.lang === 'tl' ? ' selected' : '') + '>Tagalog</option></select></label></div>' +
        '<div class="profile-age-group"><h3 class="card__title">Age group</h3><p class="field__hint">This guides the recommended symbol grid size.</p><div class="choices age-choices">' +
        ageOptions.map(function (option) { return '<button type="button" class="choice choice--age" data-age="' + option[0] + '" aria-pressed="' + (s.ageGroup === option[0]) + '"><span class="choice__t">' + option[1] + '</span><span class="choice__d">' + option[2] + '</span></button>'; }).join('') +
        '</div></div><div class="profile-form-actions"><button class="btn btn--primary" id="p-profile-save">Save profile</button></div></div></section>';
    $('p-age').addEventListener('input', function () {
      var age = +$('p-age').value;
      var group = age <= 12 ? 'early' : age <= 17 ? 'youth' : 'adult';
      el.vProfile.querySelectorAll('[data-age]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.age === group)); });
    });
    el.vProfile.querySelectorAll('[data-age]').forEach(function (button) {
      button.addEventListener('click', function () { el.vProfile.querySelectorAll('[data-age]').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); }); });
    });
    $('p-profile-save').addEventListener('click', function () {
      var name = $('p-name').value.trim() || 'Guest Child';
      var age = Math.max(1, Math.min(99, +$('p-age').value || 10));
      var selected = el.vProfile.querySelector('[data-age][aria-pressed="true"]');
      var group = selected ? selected.dataset.age : (age <= 12 ? 'early' : age <= 17 ? 'youth' : 'adult');
      Store.set({
        profile: { name: name, age: age, initials: name.split(/\s+/).slice(0, 2).map(function (word) { return word[0]; }).join('').toUpperCase() },
        ageGroup: group,
        lang: $('p-lang').value
      });
      toast('Profile saved', 'check');
      renderProfile();
    });
  }

  function renderSettings() {
    var s = Store.get();
    var ages = [
      ['early', 'Bata', '3–12 taon', '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="23" r="15"/><path d="M19 21h.1M29 21h.1M19 29c2 3 8 3 10 0"/></svg>'],
      ['youth', 'Kabataan', '13–17 taon', '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="14" y="14" width="20" height="28" rx="5"/><path d="M19 14v-3a5 5 0 0110 0v3M14 24h20M20 24v18M28 24v18M20 31h8"/></svg>'],
      ['adult', 'Matanda', '18+ taon', UI.user]
    ];
    var sizes = [['large', '3x3'], ['medium', '4x4'], ['compact', '5x5']];
    var recommendedSize = { early: 'large', youth: 'medium', adult: 'compact' }[s.ageGroup] || 'medium';
    var visibleTools = s.communicationTools || ['symbols', 'sentences', 'keyboard', 'drawing'];

    el.vSettings.innerHTML =
      '<section class="settings-intro"><div><span class="u-eyebrow">CAREGIVER / SPED TEACHER</span><h2>Board settings</h2><p>Choose the tools and display options that work best for your communicator.</p></div><span class="settings-save-note">Changes apply after you select Save settings.</span></section>' +
      '<div class="formgrid">' +

        '<div class="col">' +
          '<div class="card" id="settings-profile"><div class="card__body">' +
            '<h3 class="card__title">User’s Name and Age</h3>' +
            '<p class="field__hint" style="margin-top:6px">Used to auto-select grid density and speech defaults.</p>' +
            '<div style="margin-top:22px">' +
              '<label class="field profile-name"><span class="field__label">User’s name</span>' +
                '<input class="input" id="p-name" value="' + esc(s.profile.name) + '" maxlength="40"></label>' +
                '<label class="field profile-age"><span class="field__label">Age (years)</span>' +
                '<input class="input" id="p-age" type="number" min="1" max="99" value="' + s.profile.age + '"></label>' +
              '<label class="field" style="margin-bottom:0"><span class="field__label">Default language</span>' +
                '<select class="select" id="p-lang">' +
                  '<option value="en"' + (s.lang === 'en' ? ' selected' : '') + '>English</option>' +
                  '<option value="tl"' + (s.lang === 'tl' ? ' selected' : '') + '>Tagalog</option>' +
                '</select></label>' +
            '</div>' +
          '</div></div>' +

          '<div class="card" id="settings-profile-age"><div class="card__body">' +
            '<h3 class="card__title">Age group</h3>' +
            '<div class="choices age-choices" style="margin-top:20px">' +
              ages.map(function (a) {
                return '<button class="choice choice--age" data-age="' + a[0] + '" aria-pressed="' + (s.ageGroup === a[0]) + '">' +
                  a[3] + '<span class="choice__t">' + a[1] + '</span><span class="choice__d">' + a[2] + '</span></button>';
              }).join('') +
            '</div>' +
          '</div></div>' +
        '</div>' +

        '<div class="col">' +
          '<div class="card" id="settings-layout"><div class="card__body">' +
            '<h3 class="card__title">Display &amp; AAC Board Density</h3>' +
            '<div style="margin-top:20px">' +
              '<div class="field__label" style="margin-bottom:4px">GRID DIMENSIONS</div>' +
              '<p class="field__hint">Columns of the category grid. Recommended for ' + (s.ageGroup === 'adult' ? 'Adult: 5x5.' : s.ageGroup === 'early' ? 'Child: 3x3.' : 'Youth: 4x4.') + '</p>' +
              '<div class="choices density-choices" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:12px">' +
                sizes.map(function (z) {
                  return '<button class="choice choice--density" data-size="' + z[0] + '" aria-pressed="' + (s.symbolSize === z[0]) + '" ' +
                    'style="justify-content:center;align-items:center;padding:14px">' +
                    '<span class="choice__t">' + z[1] + '</span>' + (z[0] === recommendedSize ? '<small>RECOMMENDED</small>' : '') + '</button>';
                }).join('') +
              '</div>' +
            '</div>' +
            '<hr class="card__rule" style="margin-top:24px">' +
            '<div style="margin-top:8px">' +
              '<div class="field__label" id="settings-tools">COMMUNICATION TOOLS</div>' +
              '<div class="switchrow"><span><span class="switchrow__t">Quick sentences</span><span class="switchrow__d">Show ready-made phrases on the board</span></span><label class="switch"><input type="checkbox" id="p-tool-sentences"' + (visibleTools.indexOf('sentences') >= 0 ? ' checked' : '') + '><span class="switch__track"><span class="switch__knob"></span></span></label></div>' +
              '<div class="switchrow"><span><span class="switchrow__t">On-screen keyboard</span><span class="switchrow__d">Show the text-to-speech keyboard</span></span><label class="switch"><input type="checkbox" id="p-tool-keyboard"' + (visibleTools.indexOf('keyboard') >= 0 ? ' checked' : '') + '><span class="switch__track"><span class="switch__knob"></span></span></label></div>' +
              '<div class="switchrow"><span><span class="switchrow__t">Drawing pad</span><span class="switchrow__d">Show the draw-and-match tool</span></span><label class="switch"><input type="checkbox" id="p-tool-drawing"' + (visibleTools.indexOf('drawing') >= 0 ? ' checked' : '') + '><span class="switch__track"><span class="switch__knob"></span></span></label></div>' +
              '<label class="field"><span class="field__label">Quick sentences (English | Tagalog, one per line)</span><textarea class="textarea" id="p-quick-phrases" rows="4">' + esc((s.quickPhrases || []).map(function (phrase) { return phrase.en + ' | ' + phrase.tl; }).join('\n')) + '</textarea></label>' +
              '<div class="settings-a11y" id="settings-accessibility"><h4>Accessibility</h4><div class="switchrow"><span><span class="switchrow__t">Text-only board</span><span class="switchrow__d">Hide pictures and show labels</span></span><label class="switch"><input type="checkbox" id="p-textonly"' + (s.textOnly ? ' checked' : '') + '><span class="switch__track"><span class="switch__knob"></span></span></label></div>' +
              '<div class="switchrow"><span><span class="switchrow__t">Haptic feedback</span><span class="switchrow__d">Vibrate on symbol selection when supported</span></span><label class="switch"><input type="checkbox" id="p-haptic"' + (s.hapticFeedback ? ' checked' : '') + '><span class="switch__track"><span class="switch__knob"></span></span></label></div>' +
              '<label class="field"><span class="field__label">Text size</span><select class="select" id="p-fontsize"><option value="normal"' + ((s.fontScale || 'normal') === 'normal' ? ' selected' : '') + '>Standard</option><option value="large"' + (s.fontScale === 'large' ? ' selected' : '') + '>Large</option><option value="xlarge"' + (s.fontScale === 'xlarge' ? ' selected' : '') + '>Extra large</option></select></label>' +
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
            '</div>' +
          '</div></div>' +

          '<div class="card" id="settings-security"><div class="card__body">' +
            '<h3 class="card__title">Security</h3>' +
            '<div style="margin-top:20px">' +
              '<label class="field" style="margin-bottom:0"><span class="field__label">Caregiver PIN</span>' +
                '<input class="input" id="p-pin" inputmode="numeric" maxlength="4" value="' + esc(s.pin) + '">' +
                '<span class="field__hint">4 digits. Required to leave the board for this portal.</span></label>' +
            '</div>' +
            '<hr class="card__rule" style="margin-top:24px">' +
            '<div class="rowend" style="margin-top:24px">' +
              '<button class="btn" id="p-reset">Reset board</button>' +
              '<button class="btn" id="p-onboarding">Preview setup</button>' +
              '<button class="btn btn--primary" id="p-save">Save settings</button>' +
            '</div>' +
          '</div></div>' +
        '</div>' +

      '</div>';

    var profileColumn = el.vSettings.querySelector('#settings-profile');
    if (profileColumn && profileColumn.parentNode) profileColumn.parentNode.remove();
    el.vSettings.querySelectorAll('[data-size]').forEach(function (b) {
      b.addEventListener('click', function () { Store.set({ symbolSize: b.dataset.size }); });
    });
    $('p-save').addEventListener('click', function () {
      var pin = ($('p-pin').value || '').replace(/\D/g, '').slice(0, 4);
      var communicationTools = ['symbols'];
      if ($('p-tool-sentences').checked) communicationTools.push('sentences');
      if ($('p-tool-keyboard').checked) communicationTools.push('keyboard');
      if ($('p-tool-drawing').checked) communicationTools.push('drawing');
      var quickPhrases = $('p-quick-phrases').value.split(/\r?\n/).map(function (line) {
        var pair = line.split('|');
        var en = (pair[0] || '').trim(), tl = (pair[1] || pair[0] || '').trim();
        return en ? { en: en, tl: tl || en } : null;
      }).filter(Boolean).slice(0, 12);
      Store.set({
        speechOutput: $('p-speech').checked,
        textOnly: $('p-textonly').checked,
        hapticFeedback: $('p-haptic').checked,
        fontScale: $('p-fontsize').value,
        communicationTools: communicationTools,
        quickPhrases: quickPhrases,
        pin: pin.length === 4 ? pin : Store.get().pin
      });
      toast('Settings saved', 'check');
      renderSettings();
    });

    $('p-reset').addEventListener('click', function () {
      if (!confirm('Reset the board? Phrase history and uploaded symbols will be cleared.')) return;
      Store.reset();
      toast('Board reset');
      go('dashboard');
    });
    $('p-onboarding').addEventListener('click', function () { location.href = 'index.html?setup=1'; });
  }

  /* ════════════════════════════════════════════════════ VOCABULARY ══ */
  function renderVocabulary() {
    var s = Store.get();
    var cats = Store.categories().slice();
    var categoryOrder = s.categoryOrder || [];
    var categoryBase = cats.slice();
    cats.sort(function (a, b) {
      var ai = categoryOrder.indexOf(a.id), bi = categoryOrder.indexOf(b.id);
      if (ai < 0) ai = categoryOrder.length + categoryBase.indexOf(a);
      if (bi < 0) bi = categoryOrder.length + categoryBase.indexOf(b);
      return ai - bi;
    });
    var symbols = Store.symbols().slice();
    var symbolOrder = s.symbolOrder || [];
    var symbolBase = symbols.slice();
    symbols.sort(function (a, b) {
      var ai = symbolOrder.indexOf(a.id), bi = symbolOrder.indexOf(b.id);
      if (ai < 0) ai = symbolOrder.length + symbolBase.indexOf(a);
      if (bi < 0) bi = symbolOrder.length + symbolBase.indexOf(b);
      return ai - bi;
    });
    var categoryFilters = [['all','All'],['core','Core']].concat(cats.map(function (c) {
      return [c.id, CAT_LABEL_TL[c.id] ? CAT_LABEL_TL[c.id].replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) : c.label];
    }));

    el.vVocab.innerHTML =
      '<div class="vocab-shortcuts" role="group" aria-label="Additional vocabulary tools">' +
        '<button type="button" class="btn" data-open-panel="vocab-manage" aria-controls="vocab-manage">' + UI.folderPlus + '<span>Board layout and categories</span></button>' +
        '<button type="button" class="btn" data-open-panel="vocab-uploader" aria-controls="vocab-uploader">' + UI.image + '<span>Custom vocabulary uploader</span></button>' +
      '</div>' +
      '<dialog class="vocab-dialog" id="vocab-dialog" aria-label="Vocabulary tools">' +
      '<section class="vocab-panel" id="vocab-manage" hidden><div class="card"><div class="card__body"><div class="vocab-panel__head"><div><h2>Manage categories</h2><p class="field__hint">Add categories, control which appear on the board, or change their order.</p></div><button type="button" class="btn vocab-panel__close" data-close-panel="vocab-manage">Close</button></div>' +
        '<div class="category-add"><input class="input" id="new-category-label" maxlength="24" placeholder="New category name"><button class="btn btn--primary" id="add-category">' + UI.plus + '<span>Add category</span></button></div><div class="category-manager">' +
        cats.map(function (c, i) { var hidden = (s.hiddenCategories || []).indexOf(c.id) >= 0; return '<div class="category-manager__row"><label><input type="checkbox" data-cat-visible="' + c.id + '"' + (hidden ? '' : ' checked') + '> ' + esc(c.label) + '</label><button class="btn" data-move="' + c.id + '" data-dir="-1" aria-label="Move ' + esc(c.label) + ' up"' + (i === 0 ? ' disabled' : '') + '>↑</button><button class="btn" data-move="' + c.id + '" data-dir="1" aria-label="Move ' + esc(c.label) + ' down"' + (i === cats.length - 1 ? ' disabled' : '') + '>↓</button></div>'; }).join('') +
      '</div></div></div></section>' +
      '<section class="vocab-panel" id="vocab-uploader" hidden>' +
        '<div class="card"><div class="card__body"><div class="vocab-panel__head"><div><h2>Add a symbol</h2><p class="field__hint">Upload a picture and add English and Tagalog labels.</p></div><button type="button" class="btn vocab-panel__close" data-close-panel="vocab-uploader">Close</button></div>' +
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
      '</section></dialog>' +
      '<section class="vocab-library">' +
        '<div class="vocab-toolbar"><label class="vocab-search">' + UI.search + '<input type="search" id="vocab-search" placeholder="Search symbol label..." aria-label="Search symbols"></label>' +
          '<div class="vocab-filters" role="group" aria-label="Filter symbols">' +
            categoryFilters.map(function (f, i) { return '<button type="button" class="vocab-filter' + (i === 0 ? ' is-active' : '') + '" data-filter="' + esc(f[0]) + '">' + esc(f[1]) + '</button>'; }).join('') +
          '</div></div>' +
        '<div class="vocabgrid" id="vocab-grid">' +
          symbols.map(function (x) {
            var l = Store.labels(x);
            var isCore = CORE_SYMBOLS.indexOf(x.id) >= 0;
            var isCustom = (s.customSymbols || []).some(function (custom) { return custom.id === x.id; });
            var hiddenSymbol = (s.hiddenSymbols || []).indexOf(x.id) >= 0;
            return '<div class="vtile' + (hiddenSymbol ? ' is-board-hidden' : '') + '" data-core="' + isCore + '" data-cat="' + esc(x.cat) + '" data-search="' + esc((l.primary + ' ' + l.secondary + ' ' + x.en + ' ' + x.tl).toLowerCase()) + '">' +
              '<div class="vtile__head"><span class="vtile__tag">' + (isCustom ? 'CUSTOM' : isCore ? 'CORE' : (CAT_LABEL_TL[x.cat] || esc(x.cat)).toUpperCase()) + '</span>' +
              (isCustom ? '<button type="button" class="vtile__remove" data-remove-symbol="' + esc(x.id) + '" aria-label="Remove ' + esc(l.primary) + '" title="Remove symbol">' + UI.trash + '</button>' : '') +
              '</div><div class="vocab-symbol-actions">' +
              '<button type="button" class="vocab-symbol-toggle" data-symbol-toggle="' + esc(x.id) + '" aria-pressed="' + String(!hiddenSymbol) + '" aria-label="' + (hiddenSymbol ? 'Show ' : 'Hide ') + esc(l.primary) + ' ' + (hiddenSymbol ? 'on' : 'from') + ' the board" title="' + (hiddenSymbol ? 'Show on board' : 'Hide from board') + '">' + (hiddenSymbol ? 'Show' : 'Hide') + '</button>' +
              '<span class="vocab-symbol-order"><button type="button" data-symbol-move="' + esc(x.id) + '" data-dir="-1" aria-label="Move ' + esc(l.primary) + ' earlier" title="Move earlier">↑</button><button type="button" data-symbol-move="' + esc(x.id) + '" data-dir="1" aria-label="Move ' + esc(l.primary) + ' later" title="Move later">↓</button></span></div>' +
              '<div class="vtile__art">' + (x.dataUrl || x.imageUrl ? '<img src="' + (x.dataUrl || x.imageUrl) + '" alt="">' : x.icon) + '</div>' +
              '<div class="vtile__l1">' + esc(l.primary) + '</div>' +
              '<div class="vtile__l2">' + esc(l.secondary) + '</div>' +
              '</div>';
          }).join('') +
        '</div>' +
        '<p class="vocab-no-results" id="vocab-empty" hidden>No symbols match your search.</p>' +
      '</section>';

    function openVocabularyTool(panelId) {
      var dialog = $('vocab-dialog');
      $('vocab-manage').hidden = panelId !== 'vocab-manage';
      $('vocab-uploader').hidden = panelId !== 'vocab-uploader';
      if (!dialog.open) dialog.showModal();
      var target = panelId === 'vocab-manage' ? $('new-category-label') : $('v-en');
      if (target) target.focus({ preventScroll: true });
    }
    var vocabDialog = $('vocab-dialog');
    vocabDialog.addEventListener('click', function (event) { if (event.target === vocabDialog) vocabDialog.close(); });
    el.vVocab.querySelectorAll('[data-cat-visible]').forEach(function (input) { input.addEventListener('change', function () { var hidden = Store.get().hiddenCategories.slice(); hidden = input.checked ? hidden.filter(function (id) { return id !== input.dataset.catVisible; }) : hidden.concat(input.dataset.catVisible); Store.set({ hiddenCategories: hidden }); renderVocabulary(); openVocabularyTool('vocab-manage'); }); });
    el.vVocab.querySelectorAll('[data-close-panel]').forEach(function (button) { button.addEventListener('click', function () { vocabDialog.close(); }); });
    el.vVocab.querySelectorAll('[data-open-panel]').forEach(function (button) { button.addEventListener('click', function () {
      openVocabularyTool(button.dataset.openPanel);
    }); });
    $('add-category').addEventListener('click', function () {
      var label = $('new-category-label').value.trim();
      if (!label) { $('new-category-label').focus(); return; }
      var current = Store.get().customCategories || [];
      if (Store.categories().some(function (category) { return category.label.toLowerCase() === label.toLowerCase(); })) { toast('That category already exists'); return; }
      current.push({ id: 'custom-' + Date.now().toString(36), label: label });
      Store.set({ customCategories: current });
      toast('Category added', 'check');
      renderVocabulary();
      openVocabularyTool('vocab-manage');
    });
    el.vVocab.querySelectorAll('[data-move]').forEach(function (button) { button.addEventListener('click', function () { var order = cats.map(function (c) { return c.id; }); var i = order.indexOf(button.dataset.move), j = i + (+button.dataset.dir); if (i < 0 || j < 0 || j >= order.length) return; var tmp = order[i]; order[i] = order[j]; order[j] = tmp; Store.set({ categoryOrder: order }); renderVocabulary(); openVocabularyTool('vocab-manage'); }); });
    el.vVocab.querySelectorAll('[data-remove-symbol]').forEach(function (button) { button.addEventListener('click', function () { var id = button.dataset.removeSymbol, st = Store.get(); Store.set({ customSymbols: st.customSymbols.filter(function (x) { return x.id !== id; }), hiddenSymbols: st.hiddenSymbols.filter(function (x) { return x !== id; }), symbolOrder: st.symbolOrder.filter(function (x) { return x !== id; }) }); renderVocabulary(); }); });
    el.vVocab.querySelectorAll('[data-symbol-toggle]').forEach(function (button) { button.addEventListener('click', function () {
      var hidden = Store.get().hiddenSymbols.slice(), id = button.dataset.symbolToggle;
      hidden = hidden.indexOf(id) >= 0 ? hidden.filter(function (item) { return item !== id; }) : hidden.concat(id);
      Store.set({ hiddenSymbols: hidden }); renderVocabulary();
    }); });
    el.vVocab.querySelectorAll('[data-symbol-move]').forEach(function (button) { button.addEventListener('click', function () {
      var allSymbols = Store.symbols(), order = Store.get().symbolOrder.slice();
      allSymbols.forEach(function (symbol) { if (order.indexOf(symbol.id) < 0) order.push(symbol.id); });
      var i = order.indexOf(button.dataset.symbolMove), j = i + Number(button.dataset.dir);
      if (i < 0 || j < 0 || j >= order.length) return;
      var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      Store.set({ symbolOrder: order }); renderVocabulary();
    }); });
    var activeFilter = 'all';
    function filterVocabulary() {
      var query = $('vocab-search').value.trim().toLowerCase();
      var visible = 0;
      el.vVocab.querySelectorAll('#vocab-grid .vtile').forEach(function (tile) {
        var categoryMatch = activeFilter === 'all' || (activeFilter === 'core' ? tile.dataset.core === 'true' : tile.dataset.cat === activeFilter);
        var searchMatch = !query || tile.dataset.search.indexOf(query) >= 0;
        tile.hidden = !(categoryMatch && searchMatch);
        if (!tile.hidden) visible++;
      });
      $('vocab-empty').hidden = visible > 0;
    }
    $('vocab-search').addEventListener('input', filterVocabulary);
    el.vVocab.querySelectorAll('[data-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        activeFilter = button.dataset.filter;
        el.vVocab.querySelectorAll('[data-filter]').forEach(function (filter) { filter.classList.toggle('is-active', filter === button); });
        filterVocabulary();
      });
    });
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
      $('pv-cat').textContent = (Store.categories().filter(function (x) { return x.id === c; })[0] || {}).label || c;
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
    var focusZone = Store.geofence(s.activeContext) || s.geofences[0];
    var focusParts = focusZone ? focusZone.coords.split(',').map(Number) : [14.5995, 120.9842];
    var focusLat = isFinite(focusParts[0]) ? focusParts[0] : 14.5995;
    var focusLng = isFinite(focusParts[1]) ? focusParts[1] : 120.9842;
    var mapBounds = [focusLng - 0.035, focusLat - 0.022, focusLng + 0.035, focusLat + 0.022].map(function (n) { return n.toFixed(5); }).join('%2C');
    var mapUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=' + mapBounds + '&layer=mapnik&marker=' + focusLat.toFixed(5) + '%2C' + focusLng.toFixed(5);

    el.vGeo.innerHTML =
      '<section class="psection">' +
        '<h2 class="psection__title">Geofence &amp; location context</h2>' +
        '<div class="card"><div class="card__body">' +
          '<div class="map"><iframe class="map__frame" title="OpenStreetMap geofencing map" src="' + mapUrl + '" loading="lazy" referrerpolicy="no-referrer"></iframe></div>' +
          '<p class="field__hint" style="margin-top:14px">Map tiles from OpenStreetMap. The active zone drives the board header and contextual word suggestions.</p>' +
        '</div></div>' +
      '</section>' +

      '<section class="psection">' +
        '<h2 class="psection__title">Saved Geofencing</h2>' +
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
           ['Categories', String(Store.categories().length)]]
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
  function renderAnalyticsReference() {
    var s = Store.get();
    var phrases = s.history || [];
    var historyRows = phrases.map(function (entry) {
      var words = (entry.ids || []).map(function (id) { var symbol = Store.symbol(id); return symbol ? Store.labels(symbol).primary : id; });
      return '<tr><td>' + esc(when(entry.at)) + '</td><td>' + esc(words.join(' ')) + '</td><td>' + words.length + ' / —</td><td>Not tracked</td></tr>';
    }).join('');
    el.vStats.innerHTML =
      '<div class="analytics-cards">' +
        '<article class="dash-stat"><div class="dash-stat__label dash-stat__label--purple">' + UI.spark + ' KEYSTROKE SAVINGS</div><strong>—</strong><p>No measured phrases yet.</p></article>' +
        '<article class="dash-stat"><div class="dash-stat__label dash-stat__label--purple">' + UI.spark + ' PREDICTION USE</div><strong>—</strong><p>Prediction usage is not tracked yet.</p></article>' +
        '<article class="dash-stat"><div class="dash-stat__label dash-stat__label--blue">' + UI.trend + ' TOTAL SPOKEN PHRASES</div><strong>' + fx(s.stats.phrasesBuilt) + '</strong><p>Total communication utterances recorded.</p></article>' +
        '<article class="dash-stat"><div class="dash-stat__label dash-stat__label--green">' + UI.chart + ' VOCABULARY</div><strong>' + fx(Store.symbols().length) + ' Symbols</strong><p>Total AAC symbols available in the board library.</p></article>' +
      '</div>' +
      '<section class="card analytics-logs"><div class="analytics-logs__title">' + UI.clock + '<h2>Full Communication Logs History</h2></div>' +
        '<div class="analytics-table-wrap"><table class="tbl analytics-table"><thead><tr><th>Timestamp</th><th>Phrase Output</th><th>Taps (with / without prediction)</th><th>Prediction Assisted</th></tr></thead>' +
          (historyRows ? '<tbody>' + historyRows + '</tbody>' : '<tbody><tr><td colspan="4" class="analytics-empty">No logs recorded yet. Speak a phrase on the AAC board to log session data!</td></tr></tbody>') +
        '</table></div></section>';
  }

  var RENDER = {
    dashboard: renderDashboardReference,
    profile: renderProfile,
    settings: renderSettings,
    vocabulary: renderVocabulary,
    geofencing: renderGeofencing,
    analytics: renderAnalyticsReference
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
    var headings = {
      dashboard: ['🏠', 'Caregiver & SPED Teacher Dashboard', 'Manage communication settings for ' + Store.get().profile.name + '.'],
      profile: ['👤', 'Profile', 'Update the communicator’s name, age group, and language.'],
      settings: ['⚙', 'Settings', 'Manage board layout, communication tools, accessibility, and security.'],
      vocabulary: ['📚', 'Vocabulary', 'Add symbols and organize the communication board.'],
      geofencing: ['📍', 'Geofencing', 'Set places that help personalize communication suggestions.'],
      analytics: ['📊', 'Analytics', 'Review phrase activity and communication patterns.']
    }[view];
    document.getElementById('page-title').innerHTML = '<span class="phead__icon" id="page-icon" aria-hidden="true">' + headings[0] + '</span>' + headings[1];
    document.getElementById('page-sub').textContent = headings[2];
    var headActions = {
      dashboard: '<button class="btn btn--primary" data-head-action="add-symbol">' + UI.plus + '<span>Add symbol</span></button>',
      profile: '',
      settings: '',
      vocabulary: '<button class="btn" data-head-action="categories" aria-controls="vocab-manage">' + UI.folderPlus + '<span>Manage categories</span></button><button class="btn btn--primary" data-head-action="add-symbol" aria-controls="vocab-uploader">' + UI.plus + '<span>Add symbol</span></button>',
      geofencing: '<button class="btn btn--primary" data-head-action="location">' + UI.pin + '<span>Use my location</span></button><button class="btn btn--success" data-head-action="add-zone">' + UI.plus + '<span>Add location</span></button>',
      analytics: '<button class="btn btn--primary" data-head-action="export">↓<span>Export CSV</span></button>'
    }[view];
    $('page-actions').className = 'phead__actions phead__actions--' + view;
    $('page-actions').innerHTML = headActions;
    $('page-actions').onclick = function (event) {
      var action = event.target.closest('[data-head-action]');
      if (!action) return;
      if (action.dataset.headAction === 'add-symbol') {
        if (view !== 'vocabulary') { go('vocabulary'); }
        var symbolTool = $('view-vocabulary').querySelector('[data-open-panel="vocab-uploader"]');
        if (symbolTool) symbolTool.click();
      }
      if (action.dataset.headAction === 'categories') {
        var categoryTool = $('view-vocabulary').querySelector('[data-open-panel="vocab-manage"]');
        if (categoryTool) categoryTool.click();
      }
      if (action.dataset.headAction === 'location') {
        if (!navigator.geolocation) { toast('Hindi available ang lokasyon sa device na ito'); return; }
        navigator.geolocation.getCurrentPosition(function (position) {
          saveZone(position.coords.latitude + ', ' + position.coords.longitude);
        }, function () { toast('Hindi makuha ang lokasyon. Maaari kang magdagdag ng zone gamit ang coordinates.'); });
      }
      if (action.dataset.headAction === 'add-zone') {
        var coords = prompt('Coordinates (latitude, longitude):', '14.5995, 120.9842');
        if (coords) saveZone(coords);
      }
      if (action.dataset.headAction === 'export') exportLogs();
    };
    RENDER[view]();
    if (location.hash.slice(1) !== view) history.replaceState(null, '', '#' + view);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ══════════════════════════════════════════════════════════ INIT ══ */
  function init() {
    Store.init();
    el.vDash = $('view-dashboard');
    el.vProfile = $('view-profile');
    el.vSettings = $('view-settings');
    el.vVocab = $('view-vocabulary');
    el.vGeo = $('view-geofencing');
    el.vStats = $('view-analytics');
    el.nav = $('pnav');

    el.nav.querySelectorAll('[data-view]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); go(a.dataset.view); });
    });

    document.getElementById('pnav-logout').addEventListener('click', function (event) {
      event.preventDefault();
      global.CC.Pin.open(function () { location.href = 'index.html'; });
    });

    global.addEventListener('hashchange', function () { go(location.hash.slice(1)); });

    var start = location.hash.slice(1);
    go(RENDER[start] ? start : 'dashboard');
  }

  global.CC = global.CC || {};
  global.CC.Portal = { init: init, go: go };
})(window);
