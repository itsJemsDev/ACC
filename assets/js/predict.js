/* =========================================================================
   COMMUNICARE — Next-word prediction (Task 1: Dynamic Top-5 Prediction Bar)
   -------------------------------------------------------------------------
   A small, transparent n-gram model over the symbol catalogue:
     score = 0.50 · transition   bigram probability from the phrase tail
          + 0.20 · frequency     how common the symbol is overall
          + 0.22 · context       geofence / time-of-day routine boost
          + 0.08 · recency       recently used by this communicator
   The model learns from every phrase that gets spoken, so the Top-5 bar
   sharpens the more the board is used.
   ========================================================================= */
(function (global) {
  'use strict';

  /* -------------------------------------------------------- seed corpus -- */
  /* Common Filipino / English declaratives, expressed purely in catalogue
     symbol ids so every transition maps to a symbol the board can render. */
  var CORPUS = [
    /* wants & needs */
    ['me', 'want', 'eat'], ['me', 'want', 'drink'], ['me', 'want', 'play'],
    ['me', 'want', 'water'], ['me', 'want', 'toilet'], ['me', 'want', 'sleep'],
    ['me', 'want', 'home'], ['me', 'want', 'school'], ['me', 'want', 'medicine'],
    ['me', 'want', 'more'], ['me', 'want', 'break'], ['me', 'want', 'bath'],
    ['me', 'want', 'clothes'], ['me', 'want', 'bread'], ['me', 'want', 'clean'],

    /* feelings */
    ['me', 'happy'], ['me', 'sad'], ['me', 'tired'], ['me', 'angry'],
    ['me', 'scared'], ['me', 'sick'], ['me', 'excited'], ['me', 'love', 'mom'],
    ['me', 'love', 'dad'], ['me', 'love', 'you'], ['me', 'love', 'mom', 'dad'],
    ['me', 'sad', 'now'], ['me', 'tired', 'now'], ['me', 'happy', 'now'],

    /* eating & drinking */
    ['eat', 'rice'], ['eat', 'bread'], ['eat', 'fruit'], ['eat', 'now'],
    ['drink', 'milk'], ['drink', 'water'], ['drink', 'now'],
    ['eat', 'drink'], ['rice', 'and', 'water'],
    ['i', 'am', 'hungry'], ['hungry', 'now'],

    /* school context */
    ['go', 'school'], ['go', 'school', 'now'], ['school', 'today'],
    ['teacher', 'help'], ['teacher', 'good'], ['teacher', 'friend'],
    ['me', 'want', 'read'], ['read', 'now'], ['write', 'now'],
    ['classroom', 'clean'], ['school', 'clean'], ['school', 'today', 'happy'],
    ['break', 'now'], ['break', 'time'], ['study', 'now'], ['teacher', 'study'],
    ['school', 'and', 'play'], ['teacher', 'and', 'read'], ['school', 'teacher', 'read'],

    /* places */
    ['go', 'home'], ['go', 'home', 'now'], ['go', 'park'], ['go', 'park', 'now'],
    ['go', 'store'], ['go', 'market'], ['go', 'hospital'], ['go', 'toilet', 'now'],
    ['i', 'am', 'home'], ['i', 'am', 'school'], ['i', 'am', 'park'],
    ['home', 'now'], ['park', 'play'], ['market', 'with', 'mom'],
    ['store', 'with', 'mom'], ['hospital', 'medicine'],

    /* politeness */
    ['please', 'help'], ['please', 'help', 'me'], ['please', 'stop'],
    ['please', 'come'], ['please', 'give', 'water'], ['please', 'give', 'bread'],
    ['thanks'], ['thanks', 'mom'], ['thanks', 'dad'],
    ['thanks', 'teacher'], ['sorry', 'now'], ['sorry', 'please'],
    ['yes', 'please'], ['yes', 'thanks'], ['yes', 'me', 'want', 'play'],
    ['no', 'thanks'], ['no', 'stop'], ['no', 'no'],

    /* commands & safety */
    ['stop', 'now'], ['stop', 'please'], ['stop', 'no'],
    ['help', 'me', 'please'], ['help', 'now'], ['sos'], ['sos', 'now'], ['sos', 'help'],
    ['take', 'medicine'], ['take', 'break'], ['give', 'me', 'water'],
    ['give', 'me', 'bread'], ['come', 'now'], ['come', 'help'], ['come', 'mom'],

    /* personal care */
    ['bath', 'now'], ['clean', 'now'], ['clean', 'clothes'], ['clothes', 'now'],
    ['sleep', 'now'], ['sleep', 'good'], ['toilet', 'now'], ['medicine', 'now'],
    ['tired', 'sleep'], ['sick', 'medicine'],

    /* questions & misc */
    ['question', 'time'], ['question', 'today'], ['question', 'tomorrow'],
    ['question', 'time', 'now'], ['question', 'color'], ['question', 'number'],
    ['question', 'teacher'], ['time', 'now'], ['today', 'happy'], ['more', 'please'],
    ['more', 'more'], ['question', 'more'], ['friend', 'here'], ['mom', 'here'],
    ['dad', 'here'], ['brother', 'here'], ['sister', 'here'], ['color', 'today']
  ].filter(function (seq) {
    /* keep only sequences whose members all exist in the catalogue */
    return seq.every(function (id) { return !!global.CC.ART[id]; });
  });

  /* ------------------------------------------------------------ indexes -- */
  var freq = Object.create(null);   // id -> occurrences
  var trans = Object.create(null);  // "a>b" -> count
  var openers = Object.create(null);

  function bump(obj, key, n) { obj[key] = (obj[key] || 0) + (n || 1); }

  function build() {
    freq = Object.create(null);
    trans = Object.create(null);
    openers = Object.create(null);
    CORPUS.forEach(function (seq) {
      seq.forEach(function (id, i) {
        bump(freq, id);
        if (i === 0) bump(openers, id);
        if (i > 0) bump(trans, seq[i - 1] + '>' + id);
      });
    });
  }
  build();

  /* Learn from completed phrases — weighted so personal use outranks the seed. */
  function learn(ids, weight) {
    if (!ids || ids.length < 2) return;
    var w = weight || 2;
    ids.forEach(function (id, i) {
      bump(freq, id, w);
      if (i === 0) bump(openers, id, w);
      if (i > 0) bump(trans, ids[i - 1] + '>' + id, w);
    });
  }

  /* ------------------------------------------------------------- score -- */
  function maxOf(obj, keys) {
    var m = 0;
    keys.forEach(function (k) { m = Math.max(m, obj[k] || 0); });
    return m || 1;
  }

  /**
   * @param {string[]} phrase           current strip contents
   * @param {object}   ctx  { boost:string[], history:{ids:string[]}[] }
   * @param {number}   k                number of predictions
   * @returns {string[]} symbol ids, best first
   */
  function predict(phrase, ctx, k) {
    k = k || 5;
    ctx = ctx || {};
    var boost = ctx.boost || [];
    var history = ctx.history || [];
    var catalog = global.CC.SYMBOLS.map(function (s) { return s.id; });

    /* recency over the 25 most recent phrases */
    var recent = Object.create(null);
    history.slice(0, 25).forEach(function (h) {
      h.ids.forEach(function (id) { bump(recent, id); });
    });

    var last = phrase.length ? phrase[phrase.length - 1] : null;
    var inPhrase = Object.create(null);
    phrase.forEach(function (id) { inPhrase[id] = true; });

    var fMax = maxOf(freq, catalog);
    var rMax = maxOf(recent, catalog);
    var oMax = maxOf(openers, catalog);

    var succ = last
      ? Object.keys(trans).filter(function (key) { return key.indexOf(last + '>') === 0; })
          .map(function (key) { return key.split('>')[1]; })
      : [];
    var tMax = last ? maxOf(trans, succ) : 1;

    var scored = catalog.map(function (id) {
      var t = last ? (trans[last + '>' + id] || 0) / tMax
                   : (openers[id] || 0) / oMax;
      return {
        id: id,
        s: 0.50 * t +
           0.20 * ((freq[id] || 0) / fMax) +
           0.22 * (boost.indexOf(id) > -1 ? 1 : 0) +
           0.08 * ((recent[id] || 0) / rMax)
      };
    });

    /* Drop symbols already on the strip — suggesting something already
       visible is noise. Fall back to the full pool if that runs dry. */
    var fresh = scored.filter(function (o) { return !inPhrase[o.id]; });
    var pool = fresh.length >= k ? fresh : scored;

    return pool
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, k)
      .map(function (o) { return o.id; });
  }

  function reset() { build(); }

  global.CC = global.CC || {};
  global.CC.Predict = { predict: predict, learn: learn, reset: reset, corpus: CORPUS };
})(window);