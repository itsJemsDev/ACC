/* =========================================================================
   COMMUNICARE — PIN security overlay (Task 3)
   4-digit keypad guarding the caregiver portal. Rendered on demand so it can
   be mounted from either the board (lock icon) or the portal itself.
   ========================================================================= */
(function (global) {
  'use strict';

  var UI = null, host = null, onSuccess = null, buffer = '', shakeTimer = null;

  function icon(name) { return (UI[name] || ''); }

  function render() {
    buffer = '';
    host.innerHTML =
      '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="pin-t">' +
        '<div class="modal">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
            '<span style="width:44px;height:44px;border-radius:12px;background:var(--c-primary-soft);' +
              'color:var(--c-primary);display:grid;place-items:center;flex:none">' + icon('lock') + '</span>' +
            '<div>' +
              '<h2 class="modal__title" id="pin-t">Caregiver access</h2>' +
            '</div>' +
          '</div>' +
          '<p class="modal__sub">Enter the 4-digit PIN to open the caregiver portal.</p>' +
          '<div class="keypad">' +
            '<div class="keypad__dots" id="pin-dots">' +
              '<span class="keypad__dot"></span><span class="keypad__dot"></span>' +
              '<span class="keypad__dot"></span><span class="keypad__dot"></span>' +
            '</div>' +
            '<div class="keypad__grid" id="pin-keys">' +
              [1,2,3,4,5,6,7,8,9].map(function (n) {
                return '<button class="key" data-k="' + n + '" aria-label="Digit ' + n + '">' + n + '</button>';
              }).join('') +
              '<button class="key key--fn" data-k="back" aria-label="Delete last digit">' + icon('backspace') + '</button>' +
              '<button class="key" data-k="0" aria-label="Digit 0">0</button>' +
              '<button class="key key--go" data-k="go" aria-label="Confirm PIN">' + icon('check') + '</button>' +
            '</div>' +
            '<p class="field__hint" style="text-align:center;margin-top:14px">' +
              'Demo PIN — <b id="pin-hint"></b></p>' +
          '</div>' +
        '</div>' +
      '</div>';

    var pad = host.querySelector('.keypad');
    host.querySelector('#pin-hint').textContent = global.CC.Store.get().pin;

    host.querySelector('#pin-keys').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-k]');
      if (!btn) return;
      var k = btn.dataset.k;
      if (k === 'back') buffer = buffer.slice(0, -1);
      else if (k === 'go') return submit(pad);
      else if (buffer.length < 4) buffer += k;
      paint(pad);
      if (buffer.length === 4) setTimeout(function () { submit(pad); }, 140);
    });

    /* keyboard support — caregivers use desktop too */
    host.onkeydown = function (e) {
      if (/^[0-9]$/.test(e.key)) { if (buffer.length < 4) { buffer += e.key; paint(pad); } }
      else if (e.key === 'Backspace') { buffer = buffer.slice(0, -1); paint(pad); }
      else if (e.key === 'Enter') { submit(pad); }
      else if (e.key === 'Escape') { close(); }
    };
    host.querySelector('.key').focus();
  }

  function paint(pad) {
    pad.querySelectorAll('.keypad__dot').forEach(function (d, i) {
      d.classList.toggle('is-on', i < buffer.length);
    });
  }

  function submit(pad) {
    if (buffer.length < 4) return;
    if (buffer === global.CC.Store.get().pin) { close(); onSuccess && onSuccess(); return; }
    pad.classList.add('is-error');
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(function () {
      pad.classList.remove('is-error');
      buffer = '';
      paint(pad);
    }, 420);
  }

  function close() { host.innerHTML = ''; host.onkeydown = null; }

  /** Mount the overlay. @param {Function} cb invoked on successful unlock */
  function open(cb) {
    UI = global.CC.UI;
    onSuccess = cb;
    if (!host) {
      host = document.createElement('div');
      host.id = 'pin-root';
      document.body.appendChild(host);
    }
    render();
  }

  function mount() {
    host = document.createElement('div');
    host.id = 'pin-root';
    document.body.appendChild(host);
  }

  global.CC = global.CC || {};
  global.CC.Pin = { open: open, mount: mount, close: close };
})(window);