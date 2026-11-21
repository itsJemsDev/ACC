(function (global) {
  'use strict';
  var Store = global.CC.Store, step = 0, draft = {}, pinEntry = '', onDone;
  var copy = {
    en: {
      welcome: 'Hello!', chooseLang: 'Choose the board language.', name: "What is the user's name?", nameSub: 'The person who will use the board to communicate.', age: 'How old is {name}?', ageSub: 'Enter the age in years. The age group is set from it.',
      buttonSize: 'Button size', buttonSizeSub: 'Fewer rows, larger buttons. You can change this later.', recommended: 'Recommended for {group}: selected below.', largeButtons: 'Large buttons', mediumButtons: 'Medium', moreWords: 'More words', recommendedTag: 'RECOMMENDED', pin: 'Create a caregiver PIN', pinSub: '4 digits. Needed to open settings.', confirm: 'Enter the PIN again', confirmSub: 'Confirm your PIN.', back: 'Back', next: 'Next', finish: 'Finish', child: 'Child', youth: 'Youth', adult: 'Adult', ageHint: 'The age group is set from the age.', mismatch: 'PINs did not match. Please try again.'
    },
    tl: {
      welcome: 'Hello!', chooseLang: 'Piliin ang wika ng board.', name: 'Ano ang pangalan ng gagamit?', nameSub: 'Ang taong gagamit ng board upang makipag-usap.', age: 'Ilang taon na si {name}?', ageSub: 'Ilagay ang edad. Awtomatikong itatakda ang pangkat ng edad.',
      buttonSize: 'Laki ng button', buttonSizeSub: 'Mas kaunting hanay, mas malaking button. Mapapalitan ito mamaya.', recommended: 'Inirerekomenda para sa {group}: napili na sa ibaba.', largeButtons: 'Malalaking button', mediumButtons: 'Katamtaman', moreWords: 'Mas maraming salita', recommendedTag: 'INIREREKOMENDA', pin: 'Gumawa ng caregiver PIN', pinSub: '4 na numero. Kailangan ito para buksan ang settings.', confirm: 'Ilagay muli ang PIN', confirmSub: 'Kumpirmahin ang iyong PIN.', back: 'Bumalik', next: 'Susunod', finish: 'Tapos na', child: 'Bata', youth: 'Kabataan', adult: 'Matanda', ageHint: 'Awtomatikong itatakda ang pangkat ng edad.', mismatch: 'Hindi magkatugma ang mga PIN. Subukan muli.'
    }
  };
  function t(key) { return (copy[draft.lang] || copy.en)[key]; }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  function ageGroup(age) { return age <= 12 ? 'early' : age <= 17 ? 'youth' : 'adult'; }
  function recommendedSize(age) { return age <= 12 ? 'large' : age <= 17 ? 'medium' : 'compact'; }
  function icon(name) {
    var paths = {
      chat: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-9.5A7.5 7.5 0 0 1 10.5 4h2A7.5 7.5 0 0 1 20 11.5Z"/><path d="M8 11h8M8 14.5h5"/>',
      english: '<path d="M4 6h12M10 4v2c0 6-3 9-6 11M7 10c1 3 4 5 7 6M14 20l4-10 4 10M15.5 17h5"/>',
      tagalog: '<path d="M4 6h12M10 4v2c0 6-3 9-6 11M7 10c1 3 4 5 7 6M16 16l3-7 3 7M17 14h4"/><path d="M17 20h.01"/>',
      child: '<path d="M5.2 12.2c0-4.3 3-7.4 7.1-7.4 3.7 0 6.4 2.4 6.9 5.7 1.3.4 2.1 1.4 2.1 2.7 0 1.2-.7 2.2-1.8 2.7-.9 2.8-3.6 4.6-7 4.6-4.3 0-7.3-2.9-7.3-7.1v-1.2Z"/><path d="M9 5.6c.1-1.2 1-2 2.2-2M13.3 4.8c.4-1 1.3-1.5 2.3-1.4M4.1 11.5c-1.1.4-1.7 1.3-1.7 2.4 0 1.2.7 2.1 1.8 2.4M9.2 12h.01M14.8 12h.01M10 16c1.2 1.1 2.8 1.1 4 0"/>',
      youth: '<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      backpack: '<path d="M9 6V5a3 3 0 0 1 6 0v1"/><rect x="6" y="6" width="12" height="16" rx="3"/><path d="M6 11h12M9 11v-2h6v2M9 15h6v7H9zM9 18h6M4.5 10v8M19.5 10v8"/>',
      adult: '<circle cx="12" cy="7.5" r="4"/><path d="M4 21v-2.5a8 8 0 0 1 16 0V21M8.5 14.5l3.5 3 3.5-3"/>',
      symbols: '<rect x="3" y="3" width="8" height="8" rx="2"/><circle cx="7" cy="7" r="1.5"/><path d="m4.5 10 2-2 2.5 2M14 4h7M14 8h7M3 15h8v6H3zM15 14l3 3 3-3M18 17v4"/>',
      sentences: '<path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h7"/>',
      keyboard: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M10 9h.01M13 9h.01M16 9h.01M19 9h.01M7 12h.01M10 12h.01M13 12h.01M16 12h.01M8 15h8"/>',
      drawing: '<path d="m4 16-1 5 5-1L20 8a2.1 2.1 0 0 0-3-3L4 18"/><path d="m14.5 6.5 3 3M12 21h9"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths[name] + '</svg>';
  }
  function draw() {
    var root = document.getElementById('onboarding-root'), name = draft.name || 'the user', title = '', sub = '', body = '';
    if (step === 0) {
      title = t('welcome'); sub = t('chooseLang');
      body = '<div class="ob-language"><button data-lang="en" class="ob-choice ' + (draft.lang === 'en' ? 'is-selected' : '') + '">' + icon('english') + '<span>English</span></button><button data-lang="tl" class="ob-choice ' + (draft.lang === 'tl' ? 'is-selected' : '') + '">' + icon('tagalog') + '<span>Tagalog</span></button></div>';
    } else if (step === 1) {
      title = t('name'); sub = t('nameSub'); body = '<input id="ob-name" class="ob-input" maxlength="40" placeholder="e.g. Juan" value="' + esc(draft.name) + '" autocomplete="name">';
    } else if (step === 2) {
      title = t('age').replace('{name}', esc(name)); sub = t('ageSub');
      body = '<label class="ob-label" for="ob-age">' + icon('child') + (draft.lang === 'tl' ? 'Edad' : 'Age in years') + '</label><input id="ob-age" class="ob-age" type="number" min="3" max="99" placeholder="e.g. 9" value="' + (draft.age || '') + '"><p class="ob-hint">' + t('ageHint') + '</p><div class="ob-age-groups">' + [['early','child','child','3–12'],['youth','backpack','youth','13–17'],['adult','adult','adult','18+']].map(function (x) { return '<span class="' + (draft.age && ageGroup(draft.age) === x[0] ? 'is-selected' : '') + '"><i>' + icon(x[1]) + '</i>' + t(x[2]) + '<small>' + x[3] + (draft.lang === 'tl' ? ' taon' : ' yrs') + '</small></span>'; }).join('') + '</div>';
    } else if (step === 3) {
      var groupName = draft.age <= 12 ? t('child') : draft.age <= 17 ? t('youth') : t('adult');
      title = t('buttonSize'); sub = t('buttonSizeSub');
      body = '<p class="ob-recommendation">' + t('recommended').replace('{group}', esc(groupName)) + '</p><div class="ob-density-options">' + [['large','largeButtons',3],['medium','mediumButtons',4],['compact','moreWords',5]].map(function (item) { return '<button type="button" aria-pressed="' + (draft.symbolSize === item[0]) + '" class="ob-density ' + (draft.symbolSize === item[0] ? 'is-selected' : '') + '" data-size="' + item[0] + '"><span class="ob-density__grid ob-density__grid--' + item[2] + '">' + Array.from({length:item[2] * 2}).map(function () { return '<i></i>'; }).join('') + '</span><strong>' + t(item[1]) + '</strong>' + (draft.recommendedSize === item[0] ? '<small>' + t('recommendedTag') + '</small>' : '') + '</button>'; }).join('') + '</div>';
    } else {
      var confirm = step === 5;
      title = confirm ? t('confirm') : t('pin'); sub = confirm ? t('confirmSub') : t('pinSub');
      body = '<div class="ob-pin-icon">' + icon('youth') + '</div><div class="ob-dots" aria-label="' + pinEntry.length + ' of 4 digits">' + [0,1,2,3].map(function (i) { return '<span class="' + (i < pinEntry.length ? 'is-filled' : '') + '"></span>'; }).join('') + '</div><div class="ob-keypad">' + ['1','2','3','4','5','6','7','8','9','','0','⌫'].map(function (n) { return n ? '<button class="ob-key" data-key="' + n + '" aria-label="' + (n === '⌫' ? 'Delete' : n) + '">' + n + '</button>' : '<span></span>'; }).join('') + '</div><p class="ob-error" aria-live="polite">' + esc(draft.error || '') + '</p>';
    }
    root.innerHTML = '<section class="onboarding" aria-label="Communicare setup"><div class="ob-card"><header class="ob-head"><div class="ob-brand"><span class="ob-mark">' + icon('chat') + '</span><strong>Communicare</strong></div><span class="ob-count">' + (step + 1) + ' / 6</span></header><div class="ob-progress">' + [0,1,2,3,4,5].map(function (i) { return '<span class="' + (i <= step ? 'is-done' : '') + '"></span>'; }).join('') + '</div><h1>' + title + '</h1><p class="ob-sub">' + sub + '</p><div class="ob-content">' + body + '</div><footer class="ob-footer">' + (step ? '<button class="ob-back" id="ob-back">‹ &nbsp;' + t('back') + '</button>' : '<span></span>') + (step < 4 ? '<button class="ob-next" id="ob-next">' + t('next') + ' &nbsp; ›</button>' : '') + (step === 5 ? '<button class="ob-next" id="ob-finish"' + (pinEntry.length < 4 ? ' disabled' : '') + '>' + t('finish') + ' &nbsp; ›</button>' : '') + '</footer></div></section>';
    wire();
  }
  function wire() {
    var root = document.getElementById('onboarding-root');
    root.querySelectorAll('[data-lang]').forEach(function (b) { b.onclick = function () { draft.lang = b.dataset.lang; Store.set({ lang: draft.lang }); draw(); }; });
    var next = document.getElementById('ob-next'); if (next) next.onclick = forward;
    var back = document.getElementById('ob-back'); if (back) back.onclick = function () { step--; pinEntry = ''; draft.error = ''; draw(); };
    var finish = document.getElementById('ob-finish'); if (finish) finish.onclick = complete;
    var nameInput = document.getElementById('ob-name'); if (nameInput) nameInput.oninput = function () { draft.name = nameInput.value; };
    var ageInput = document.getElementById('ob-age'); if (ageInput) ageInput.oninput = function () { draft.age = +ageInput.value; var group = ageGroup(draft.age || 0); root.querySelectorAll('.ob-age-groups span').forEach(function (n, i) { n.classList.toggle('is-selected', !!draft.age && ['early','youth','adult'][i] === group); }); };
    root.querySelectorAll('[data-size]').forEach(function (button) { button.onclick = function () { draft.symbolSize = button.dataset.size; draw(); }; });
    root.querySelectorAll('[data-key]').forEach(function (b) { b.onclick = function () { var k = b.dataset.key; pinEntry = k === '⌫' ? pinEntry.slice(0,-1) : (pinEntry.length < 4 ? pinEntry + k : pinEntry); draw(); if (pinEntry.length === 4) setTimeout(function () { if (step === 4) { draft.pin = pinEntry; step = 5; pinEntry = ''; draft.error = ''; draw(); } }, 160); }; });
  }
  function forward() {
    if (step === 1) { draft.name = (document.getElementById('ob-name').value || '').trim(); if (!draft.name) { document.getElementById('ob-name').focus(); return; } }
    if (step === 2) { var age = +document.getElementById('ob-age').value; if (!age || age < 3 || age > 99) { document.getElementById('ob-age').focus(); return; } draft.age = age; }
    if (step === 2) { draft.recommendedSize = recommendedSize(draft.age); draft.symbolSize = draft.recommendedSize; }
    step++; pinEntry = ''; draft.error = ''; draw();
  }
  function complete() {
    var entered = pinEntry;
    if (entered !== draft.pin) { draft.error = t('mismatch'); step = 4; pinEntry = ''; draw(); return; }
    var group = ageGroup(draft.age);
    Store.set({ onboardingComplete: true, lang: draft.lang, profile: { name: draft.name, age: draft.age, initials: draft.name.split(/\s+/).slice(0,2).map(function (w) { return w[0]; }).join('').toUpperCase() }, ageGroup: group, symbolSize: draft.symbolSize, gridDensity: draft.symbolSize, pin: draft.pin });
    if (new URLSearchParams(location.search).get('setup') === '1') history.replaceState(null, '', location.pathname);
    document.body.classList.remove('is-onboarding'); document.getElementById('onboarding-root').innerHTML = ''; onDone();
  }
  function init(done) {
    var state = Store.get(); onDone = done; step = 0; pinEntry = '';
    draft = { lang: state.lang || 'en', name: state.onboardingComplete ? state.profile.name : '', age: state.onboardingComplete ? state.profile.age : 0, symbolSize: state.onboardingComplete ? state.symbolSize : 'large', recommendedSize: recommendedSize(state.onboardingComplete ? state.profile.age : 0), pin: '', error: '' };
    document.body.classList.add('is-onboarding'); draw();
  }
  global.CC = global.CC || {}; global.CC.Onboarding = { init: init };
})(window);
