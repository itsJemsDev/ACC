/* =========================================================================
   COMMUNICARE — Speech output
   Wraps the Web Speech API with graceful degradation + bilingual voice pick.
   ========================================================================= */
(function (global) {
  'use strict';

  var synth = global.speechSynthesis;
  var voices = [];

  var LOCALE = { en: 'en-PH', tl: 'fil-PH' };

  function load() {
    if (!synth) return;
    voices = synth.getVoices() || [];
  }
  if (synth) {
    load();
    synth.addEventListener('voiceschanged', load);
  }

  function pickVoice(lang) {
    if (!voices.length) load();
    var want = LOCALE[lang] || 'en-US';
    var base = want.split('-')[0];

    /* exact locale first, then same base language, then any Philippine voice */
    return voices.filter(function (v) { return v.lang && v.lang.toLowerCase() === want.toLowerCase(); })[0] ||
           voices.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(base) === 0; })[0] ||
           voices.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf('ph') > -1; })[0] ||
           null;
  }

  function available() { return !!synth; }

  /**
   * Speak a phrase.
   * @param {string} text
   * @param {'en'|'tl'} lang
   * @param {{rate?:number, onend?:Function}} opts
   * @returns {boolean} whether speech actually started
   */
  function speak(text, lang, opts) {
    opts = opts || {};
    if (!synth || !text) { if (opts.onend) opts.onend(); return false; }
    try { synth.cancel(); } catch (e) { /* noop */ }

    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice(lang);
    if (v) u.voice = v;
    u.lang = (v && v.lang) || LOCALE[lang] || 'en-US';
    u.rate = opts.rate || 1;
    u.pitch = 1;
    u.volume = 1;

    if (opts.onend) {
      u.addEventListener('end', opts.onend);
      u.addEventListener('error', opts.onend);
    }
    synth.speak(u);
    return true;
  }

  function cancel() { try { synth && synth.cancel(); } catch (e) {} }

  function listVoices() {
    load();
    return voices.filter(function (v) { return /^en|^fil/i.test(v.lang || ''); });
  }

  global.CC = global.CC || {};
  global.CC.Speech = { speak: speak, cancel: cancel, available: available, listVoices: listVoices };
})(window);