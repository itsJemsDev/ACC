/* Per-symbol artwork colour audit.
   ---------------------------------------------------------------------
   AAC users scan for a symbol by shape AND colour, so what matters is not
   the sheet's overall hue spread but whether individual symbols are
   distinguishable and whether neighbours in reading order collide.

   Usage: node tools/symbolcolors.js                                        */
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const report = await page.evaluate(async () => {
    const syms = CC.SYMBOLS;

    function analyse(svgText) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const N = 48, c = document.createElement('canvas');
          c.width = c.height = N;
          const g = c.getContext('2d', { willReadFrequently: true });
          g.drawImage(img, 0, 0, N, N);
          const d = g.getImageData(0, 0, N, N).data;
          // Ignore near-white and near-black: only artwork chroma matters.
          const hues = [], sats = [];
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
            const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
            const sat = mx === 0 ? 0 : (mx - mn) / mx;
            if (sat < 0.30 || mx > 0.97) continue;
            let h;
            if (mx === r) h = 60 * (((gg - b) / (mx - mn)) % 6);
            else if (mx === gg) h = 60 * ((b - r) / (mx - mn) + 2);
            else h = 60 * ((r - gg) / (mx - mn) + 4);
            hues.push((h + 360) % 360);
            sats.push(sat);
          }
          if (!hues.length) return { hue: null, share: 0, sat: 0 };
          const buckets = new Array(12).fill(0);
          for (const h of hues) buckets[Math.floor(h / 30) % 12]++;
          let dom = 0;
          for (const b of buckets) if (b > dom) dom = b;
          return {
            hue: hues.reduce((a, b) => a + b, 0) / hues.length,
            domBucket: Math.floor(hues[hues.indexOf(hues[Math.floor(hues.length / 2)])] / 30) % 12,
            share: dom / hues.length,
            sat: sats.reduce((a, b) => a + b, 0) / sats.length
          };
        };
        img.onerror = () => resolve({ hue: null, share: 0, sat: 0, failed: true });
        img.src = 'data:image/svg+xml;base64,' +
          btoa(unescape(encodeURIComponent(svgText.replace(/\s+/g, ' '))));
      });
    }

    const out = [];
    for (const s of syms) {
      const art = s.icon || CC.ART[s.id];
      if (!art) { out.push({ id: s.id, en: s.en, tl: s.tl, cat: s.cat, hue: null, share: 0, sat: 0, missing: true }); continue; }
      out.push({ id: s.id, en: s.en, tl: s.tl, cat: s.cat, ...(await analyse(art)) });
    }
    return out;
  });

  await browser.close();

  /* ---------------------------------------------------------- report -- */
  const NAME = ['red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan',
    'blue', 'indigo', 'violet', 'magenta', 'pink'];
  const bucketName = h => NAME[Math.round(((h % 360) + 360) % 360 / 30) % 12];

  const grey = report.filter(r => r.hue === null);
  console.log(`symbols analysed : ${report.length}`);
  console.log(`no chroma (grey) : ${grey.length}${grey.length ? ' -> ' + grey.map(r => r.id).join(', ') : ''}`);

  const spread = new Set(report.filter(r => r.hue !== null).map(r => bucketName(r.hue)));
  console.log(`distinct accent families used: ${spread.size} -> ${[...spread].join(', ')}`);

  // Per-category colour profile.
  const byCat = {};
  for (const r of report) (byCat[r.cat] ||= []).push(r);
  console.log('\nper category:');
  for (const [cat, list] of Object.entries(byCat)) {
    const fams = {};
    for (const r of list) if (r.hue !== null) fams[bucketName(r.hue)] = (fams[bucketName(r.hue)] || 0) + 1;
    const greyN = list.filter(r => r.hue === null).length;
    console.log(`  ${cat.padEnd(9)} ${Object.entries(fams).map(([k, v]) => `${k}:${v}`).join('  ') || '-'}` +
      (greyN ? `  (+${greyN} grey)` : ''));
  }

  // Collision check: symbols that share both an accent family and a category
  // are hard to tell apart at a glance.
  const collisions = [];
  const seen = new Map();
  for (const r of report) {
    const key = r.cat + '|' + (r.hue === null ? 'grey' : bucketName(r.hue));
    (seen.get(key) || seen.set(key, []).get(key)).push(r);
  }
  for (const [key, list] of seen) if (list.length > 2) collisions.push({ key, list });
  console.log(`\nsame category + same accent family (>2): ${collisions.length}` +
    (collisions.length ? '\n' + collisions.map(c => '  ' + c.key + ': ' + c.list.map(r => r.en).join(', ')).join('\n') : ''));

  console.log(errors.length ? '\nPAGE ERRORS:\n' + errors.join('\n') : '\nno page errors');
})().catch(e => { console.error('FATAL', e); process.exit(1); });