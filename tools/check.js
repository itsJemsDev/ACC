/* Dev-only sanity checks: validates the symbol catalogue + prediction model.
   Run with:  node tools/check.js                                        */
const fs = require('fs');
const vm = require('vm');

const root = __dirname + '/..';
const sandbox = { window: {}, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of ['assets/js/symbols.js', 'assets/js/store.js', 'assets/js/predict.js']) {
  vm.runInContext(fs.readFileSync(root + '/' + f, 'utf8'), sandbox, { filename: f });
}
const CC = sandbox.window.CC;
const S = sandbox.window.CC.SYMBOLS;

/* ---- 1. every symbol has artwork ------------------------------------- */
let bad = S.filter(s => !CC.ART[s.id]);
console.log('symbols:', S.length, '| categories:', CC.CATEGORIES.length, '| artwork:', Object.keys(CC.ART).length);
console.log(bad.length ? 'MISSING ART: ' + bad.map(s => s.id) : 'OK  every symbol has artwork');

/* ---- 2. artwork + icons must be well-formed XML ---------------------- */
function checkXml(name, svg) {
  const body = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const stack = [];
  const re = /<(\/?)([a-zA-Z0-9:]+)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let m;
  while ((m = re.exec(body))) {
    const [, close, tag, attrs] = m;
    if (close) {
      if (stack.pop() !== tag) throw new Error(`mismatched </${tag}>`);
    } else if (!/\/\s*$/.test(attrs)) {
      stack.push(tag);            // not self-closing -> needs a close tag
    }
  }
  if (stack.length) throw new Error('unclosed: ' + stack.join(','));
}
let xmlBad = [];
for (const [k, v] of Object.entries(CC.ART))  { try { checkXml(k, v); } catch (e) { xmlBad.push(k + ': ' + e.message); } }
for (const [k, v] of Object.entries(CC.CAT_ART)) { try { checkXml('cat:' + k, v); } catch (e) { xmlBad.push(k + ': ' + e.message); } }
for (const [k, v] of Object.entries(CC.UI))    { try { checkXml('ui:' + k, v); } catch (e) { xmlBad.push(k + ': ' + e.message); } }
console.log(xmlBad.length ? 'XML ERRORS:\n' + xmlBad.join('\n') : 'OK  all ' + (Object.keys(CC.ART).length + Object.keys(CC.CAT_ART).length + Object.keys(CC.UI).length) + ' svgs are well-formed');

/* ---- 3. catalogue integrity ------------------------------------------ */
const ids = S.map(s => s.id);
const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
console.log(dupes.length ? 'DUPLICATE IDS: ' + dupes : 'OK  no duplicate symbol ids');
const orphanArt = Object.keys(CC.ART).filter(k => !ids.includes(k));
console.log(orphanArt.length ? 'ORPHAN ART: ' + orphanArt : 'OK  no orphan artwork');
const noCat = S.filter(s => !CC.CATEGORIES.some(c => c.id === s.cat));
console.log(noCat.length ? 'BAD CATEGORY: ' + noCat.map(s => s.id) : 'OK  all symbols mapped to a category');
const noLabel = S.filter(s => !s.en || !s.tl);
console.log(noLabel.length ? 'MISSING LABEL: ' + noLabel.map(s => s.id) : 'OK  all symbols are bilingual (en + tl)');
const perCat = {};
S.forEach(s => perCat[s.cat] = (perCat[s.cat] || 0) + 1);
console.log('per category:', perCat);

/* ---- 4. prediction model ---------------------------------------------- */
const P = CC.Predict;
console.log('corpus sequences:', P.corpus.length);
console.log('  empty phrase ->', P.predict([], { boost: ['school', 'teacher', 'read'] }, 5));
console.log('  "yes"        ->', P.predict(['yes'], { boost: ['school', 'teacher', 'read'] }, 5));
console.log('  "go school"  ->', P.predict(['go', 'school'], { boost: ['school', 'teacher'] }, 5));
const dup = P.predict(['yes'], {}, 5);
console.log(dup.length === 5 && new Set(dup).size === 5 ? 'OK  5 unique predictions' : 'BAD  ' + dup);
console.log('  after learn("i want eat") ->', P.predict(['me', 'want'], {}, 5));