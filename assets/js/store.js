/* =========================================================================
   COMMUNICARE — Application state
   Single store + localStorage persistence + tiny pub/sub. No dependencies.
   ========================================================================= */
(function (global) {
  'use strict';

  var KEY = 'communicare.v1';

  /* --- seeded analytics data --------------------------------------- */
  /* Analytics should be meaningful on first run, but the headline totals and
     the per-symbol tally must never disagree. So the tally is *derived* from
     weights and force-summed back to SEED_TOTAL. */
  var SEED_TOTAL = 1284;
  var SEED_WEIGHTS = [
    ['yes', 148], ['no', 132], ['please', 121], ['thanks', 114], ['help', 97],
    ['more', 84], ['eat', 79], ['drink', 68], ['water', 66], ['school', 61],
    ['teacher', 57], ['mom', 53], ['home', 47], ['sorry', 44], ['stop', 39],
    ['happy', 36], ['play', 33], ['toilet', 31], ['medicine', 26], ['sleep', 22],
    ['bath', 19], ['clean', 14], ['tired', 12], ['hungry', 11]
  ];

  function seedTally() {
    var sum = SEED_WEIGHTS.reduce(function (a, w) { return a + w[1]; }, 0);
    var out = {}, used = 0;
    SEED_WEIGHTS.forEach(function (w) {
      var v = Math.round(w[1] / sum * SEED_TOTAL);
      out[w[0]] = v;
      used += v;
    });
    out[SEED_WEIGHTS[0][0]] += SEED_TOTAL - used;   /* exact largest-remainder fix-up */
    return out;
  }

  /* ------------------------------------------------- default app state -- */
  function defaults() {
    return {
      /* --- communicator ------------------------------------------------ */
      lang: 'en',                 // 'en' | 'tl'
      ageGroup: 'youth',          // 'early' | 'youth' | 'adult'
      category: 'basic',
      symbolSize: 'large',        // large | medium | compact
      gridDensity: 'auto',        // auto | early | youth | adult
      speechOutput: true,
      speakRate: 1,
      voiceURI: '',
      profile: { name: 'Guest Child', age: 11, initials: 'GC' },

      /* --- session ----------------------------------------------------- */
      phrase: [],                 // array of symbol ids
      history: [],                // [{ ids:[], at:ts }] most-recent first

      /* --- caregiver content ------------------------------------------- */
      pin: '1234',
      customSymbols: [],          // [{id,en,tl,cat,dataUrl}]

      geofences: [
        { id: 'home',    label: 'Home',           coords: '14.6042, 120.9822', radius: 200, active: true,
          boost: ['home', 'bath', 'sleep', 'mom', 'dad', 'play', 'tv'] },
        { id: 'school',  label: 'School',         coords: '14.6091, 121.0007', radius: 350, active: true,
          boost: ['school', 'teacher', 'read', 'write', 'break', 'friend', 'eat', 'water', 'play', 'clean'] },
        { id: 'clinic',  label: 'Therapy Clinic', coords: '14.5996, 120.9712', radius: 150, active: false,
          boost: ['therapy', 'medicine', 'doctor', 'tired', 'happy', 'sad', 'toilet', 'drink'] }
      ],
      /* context chip shown in the board header */
      activeContext: 'school',

      /* --- routines: time-of-day rules per context ---------------------- */
      routines: [
        { id: 'r1', ctx: 'school', from: '06:00', to: '10:00', label: 'Morning arrival' },
        { id: 'r2', ctx: 'school', from: '12:00', to: '13:30', label: 'Lunch break' },
        { id: 'r3', ctx: 'school', from: '15:00', to: '17:00', label: 'Dismissal' },
        { id: 'r4', ctx: 'home',   from: '18:00', to: '20:00', label: 'Evening routine' }
      ],

      /* --- analytics --------------------------------------------------- */
      stats: {
        symbolsTapped: SEED_TOTAL,
        phrasesBuilt: 417,
        perSymbol: seedTally(),   // id -> count, sums exactly to symbolsTapped
        perHour: [3, 6, 14, 26, 38, 52, 74, 88, 96, 104, 118, 126, 121, 112, 130, 141, 152, 138, 96, 61, 38, 22, 12, 6],
        lastSync: Date.now() - 1000 * 60 * 22,
        pendingChanges: 0,
        storageBytes: 612,
        online: true,
        lastDetected: 'Today, 8:30 AM',
        insideZone: true
      }
    };
  }

  /* ------------------------------------------------------------- store -- */
  var state = load();     /* self-initialising: safe to read before init() */
  var listeners = [];

  function load() {
    var base = defaults();
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        /* shallow merge, then nested merge for the two nested objects we own */
        base = Object.assign(base, saved);
        base.profile = Object.assign(defaults().profile, saved.profile || {});
        base.stats   = Object.assign(defaults().stats,   saved.stats   || {});
      }
    } catch (e) { /* private mode / quota — run with defaults */ }
    return base;
  }

  function save() {
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* ignore quota errors; app keeps working in-memory */ }
  }

  var Store = {
    init: function () { return state; },
    get: function () { return state; },
    set: function (patch) {
      Object.assign(state, patch);
      save();
      emit();
    },
    subscribe: function (fn) { listeners.push(fn); return function () {
      listeners = listeners.filter(function (f) { return f !== fn; });
    }; },
    reset: function () { state = defaults(); save(); emit(); },
    /* --- derived helpers --------------------------------------------- */

    /** All symbols = built-in catalogue + caregiver uploads. */
    symbols: function () {
      return state.customSymbols.concat(global.CC.SYMBOLS);
    },

    symbol: function (id) {
      var all = this.symbols();
      for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
      return null;
    },

    /** Primary label in the active language, secondary in the other. */
    labels: function (sym) {
      var en = sym.en || sym.id, tl = sym.tl || sym.en || sym.id;
      return state.lang === 'en'
        ? { primary: en, secondary: tl }
        : { primary: tl, secondary: en };
    },

    countIn: function (cat) {
      return this.symbols().filter(function (s) { return s.cat === cat; }).length;
    },

    geofence: function (id) {
      return state.geofences.filter(function (g) { return g.id === id; })[0] || null;
    },

    routineNow: function () {
      var now = new Date();
      var mins = now.getHours() * 60 + now.getMinutes();
      var tod = function (hhmm) {
        var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]);
      };
      var hit = state.routines.filter(function (r) {
        return mins >= tod(r.from) && mins <= tod(r.to);
      });
      return hit.length ? hit[0] : null;
    },

    partOfDay: function () {
      var h = new Date().getHours();
      if (h < 12) return 'Morning';
      if (h < 17) return 'Afternoon';
      return 'Evening';
    },

    trackTap: function (id) {
      var s = state.stats;
      s.perSymbol[id] = (s.perSymbol[id] || 0) + 1;
      s.symbolsTapped += 1;
      s.pendingChanges += 1;
      save();
    },

    trackPhrase: function (ids) {
      var s = state.stats;
      s.phrasesBuilt += 1;
      s.pendingChanges += 1;
      state.history.unshift({ ids: ids.slice(), at: Date.now() });
      if (state.history.length > 60) state.history.length = 60;
      save();
    },

    markSynced: function () {
      var s = state.stats;
      s.lastSync = Date.now();
      s.pendingChanges = 0;
      save();
      emit();
    }
  };

  function emit() { listeners.forEach(function (f) { f(state); }); }
  Store._emit = emit;

  global.CC = global.CC || {};
  global.CC.Store = Store;
})(window);