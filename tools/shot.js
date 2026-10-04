/* Headless smoke test + screenshot capture for the COMMUNICARE build.
   Usage: node tools/shot.js [outdir]                                        */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'preview');
fs.mkdirSync(OUT, { recursive: true });

/* Pixel targets measured off 1.png / 2.png. Anything that drifts by more
   than TOL is a fidelity regression worth failing on. */
const TARGETS = {
  shellW:   [1554, 1],   // content column, both mockups
  railW:    [293, 1],    // board left rail
  topbarH:  [81, 1],
  toolbarH: [52, 1],
  stripH:   [78, 1],
  chipW:    [238, 2],
  chipH:    [74, 2],
  symW:     [294, 2],
  symH:     [174, 3],
  gap:      [20, 0.5],   // symbol grid gutter — catches a self-referential
                         // --gap cycle, which silently resolves to 0
  navW:     [261, 1],    // portal rail
  statW:    [301, 2],
  statH:    [106, 2],
  splitX:   [1080, 2]    // portal 2-up pane divider
};
const fails = [];

function expect(kind, key, actual) {
  if (!(key in TARGETS)) return;
  const [want, tol] = TARGETS[key];
  if (Math.abs(actual - want) > tol) {
    fails.push(`${kind} ${key}: got ${round(actual)}px, want ${want}±${tol}`);
  }
}
function expectEq(kind, key, actual, want) {
  if (actual !== want) fails.push(`${kind} ${key}: got ${JSON.stringify(actual)}, want ${JSON.stringify(want)}`);
}
const round = n => Math.round(n * 10) / 10;

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
  const errors = [];
  const results = [];

  async function newPage(width, height) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce'
    });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });
    page.on('requestfailed', r => {
      const u = r.url();
      if (!u.includes('fonts.g')) errors.push(`[404] ${u} — ${r.failure()?.errorText}`);
    });
    return { ctx, page };
  }

  /* ───────────────────────────── BOARD ───────────────────────────── */
  {
    const { ctx, page } = await newPage(1835, 980);
    await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(600);

    const info = await page.evaluate(() => {
      const q = s => document.querySelector(s);
      const r = s => { const n = q(s); return n ? n.getBoundingClientRect() : null; };
      const g = document.getElementById('board-grid');
      return {
        cats: document.querySelectorAll('.cat').length,
        symbols: document.querySelectorAll('.sym').length,
        chips: document.querySelectorAll('.chip').length,
        gridCols: getComputedStyle(g).gridTemplateColumns.split(' ').length,
        colGap: parseFloat(getComputedStyle(g).columnGap),
        rowGap: parseFloat(getComputedStyle(g).rowGap),
        railW: r('#rail').width,
        railH: r('#rail').height,
        topbarH: r('.topbar').height,
        toolbarH: r('.toolbar').height,
        stripH: r('.strip').height,
        symW: r('.sym').width,
        symH: r('.sym').height,
        chipW: r('.chip').width,
        chipH: r('.chip').height,
        shellW: r('.shell').width,
        gridW: r('#board-grid').width,
        /* .shell is a border box (content 1554 + 24px gutters each side), so
           the mockup's column is measured on the content edge */
        shellInner: q('.shell').clientWidth
          - parseFloat(getComputedStyle(q('.shell')).paddingLeft)
          - parseFloat(getComputedStyle(q('.shell')).paddingRight),
        stripEmpty: !!q('.strip__empty'),
        labels: [...document.querySelectorAll('.sym')].slice(0, 4)
          .map(n => n.querySelector('.sym__l1').textContent + '/' + n.querySelector('.sym__l2').textContent)
      };
    });
    results.push(['BOARD 1835px', info]);

    /* numeric fidelity assertions */
    expect('BOARD', 'shellW', info.shellInner);
    expect('BOARD', 'railW', info.railW);
    expect('BOARD', 'topbarH', info.topbarH);
    expect('BOARD', 'toolbarH', info.toolbarH);
    expect('BOARD', 'stripH', info.stripH);
    expect('BOARD', 'symW', info.symW);
    expect('BOARD', 'symH', info.symH);
    expect('BOARD', 'chipW', info.chipW);
    expect('BOARD', 'chipH', info.chipH);
    expect('BOARD', 'gap', info.colGap);
    expect('BOARD', 'gap', info.rowGap);
    expectEq('BOARD', 'gridCols', info.gridCols, 4);
    expectEq('BOARD', 'categories', info.cats, 8);
    expectEq('BOARD', 'predictions', info.chips, 5);
    /* a 4-col grid of 294px cards + 3x20px gutters must exactly fill its column */
    expectEq('BOARD', 'card math',
      round(info.symW * 4 + info.colGap * 3), round(info.gridW));

    /* interaction: build a phrase */
    await page.click('.sym:nth-child(1)');
    await page.waitForTimeout(120);
    await page.click('.sym:nth-child(2)');
    await page.waitForTimeout(120);
    await page.click('.sym:nth-child(3)');
    await page.waitForTimeout(250);
    const afterAdd = await page.evaluate(() => ({
      slots: document.querySelectorAll('.slot').length,
      firstSlot: document.querySelector('.slot')?.textContent.trim(),
      chips: [...document.querySelectorAll('.chip')].map(c => c.textContent.trim())
    }));
    results.push(['BOARD phrase built', afterAdd]);
    await page.screenshot({ path: path.join(OUT, '01-board.png') });

    /* click a prediction chip */
    await page.click('.chip');
    await page.waitForTimeout(200);
    const afterChip = await page.evaluate(() => document.querySelectorAll('.slot').length);
    results.push(['BOARD chip appends', { slots: afterChip }]);

    /* backspace */
    await page.click('#btn-back');
    await page.waitForTimeout(320);
    results.push(['BOARD backspace', { slots: await page.evaluate(() => document.querySelectorAll('.slot').length) }]);

    /* language toggle */
    await page.click('#lang-tl');
    await page.waitForTimeout(250);
    results.push(['BOARD Tagalog toggle', await page.evaluate(() => [...document.querySelectorAll('.sym')]
      .slice(0, 3).map(n => n.querySelector('.sym__l1').textContent + '/' + n.querySelector('.sym__l2').textContent))]);
    await page.screenshot({ path: path.join(OUT, '02-board-tagalog.png') });
    await page.click('#lang-en');
    await page.waitForTimeout(150);

    /* category switch */
    await page.click('[data-cat="food"]');
    await page.waitForTimeout(200);
    results.push(['BOARD category switch', { symbols: await page.evaluate(() => document.querySelectorAll('.sym').length) }]);

    /* clear */
    await page.click('#btn-clear');
    await page.waitForTimeout(300);
    results.push(['BOARD clear', { slots: await page.evaluate(() => document.querySelectorAll('.slot').length),
      empty: await page.evaluate(() => !!document.querySelector('.strip__empty')) }]);

    /* context picker */
    await page.click('#btn-ctx');
    await page.waitForTimeout(250);
    results.push(['BOARD context modal', { items: await page.evaluate(() => document.querySelectorAll('#ctx-root .geoitem').length) }]);
    await page.screenshot({ path: path.join(OUT, '03-board-context.png') });
    await page.click('#ctx-root [data-close]');
    await page.waitForTimeout(150);

    /* PIN gate */
    await page.click('#btn-lock');
    await page.waitForTimeout(300);
    results.push(['BOARD PIN modal', { keys: await page.evaluate(() => document.querySelectorAll('#pin-root .key').length) }]);
    await page.screenshot({ path: path.join(OUT, '04-board-pin.png') });
    for (const d of ['1', '2', '3', '9']) { await page.click(`#pin-root [data-k="${d}"]`); await page.waitForTimeout(60); }
    await page.waitForTimeout(500);
    results.push(['BOARD wrong PIN rejected', { open: await page.evaluate(() => !!document.querySelector('#pin-root .modal')) }]);
    await ctx.close();
  }

  /* ─────────────────── BOARD age presets / responsive ─────────────────── */
  for (const [label, w, hgt, age] of [
    ['05-board-early', 1835, 980, 'early'],
    ['06-board-adult', 1835, 980, 'adult'],
    ['07-board-tablet', 900, 1100, 'youth'],
    ['08-board-phone', 414, 900, 'youth']
  ]) {
    const { ctx, page } = await newPage(w, hgt);
    await page.addInitScript(a => { localStorage.setItem('communicare.v1', JSON.stringify({ ageGroup: a })); }, age);
    await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const g = document.getElementById('board-grid');
      const cs = getComputedStyle(g);
      const cards = [...document.querySelectorAll('.sym')];
      return {
        cols: cs.gridTemplateColumns.split(' ').length,
        gap: parseFloat(cs.columnGap),
        rowGap: parseFloat(cs.rowGap),
        cardW: cards[0]?.getBoundingClientRect().width ?? 0,
        cardH: cards[0]?.getBoundingClientRect().height ?? 0,
        gridW: g.getBoundingClientRect().width,
        age: document.body.dataset.age,
        cardFloor: parseFloat(getComputedStyle(cards[0]).minHeight),
        // anything bleeding past the viewport means a track is floored by
        // min-content instead of minmax(0, …). Items inside a deliberately
        // scrollable container are excluded — they are meant to overhang.
        docScrollW: document.documentElement.scrollWidth,
        bleeders: [...document.querySelectorAll('body *')]
          .filter(el => {
            if (el.getBoundingClientRect().right <= document.documentElement.clientWidth + 1) return false;
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
              if (/auto|scroll|hidden/.test(getComputedStyle(p).overflowX)) return false;
            }
            return true;
          })
          .slice(0, 4)
          .map(el => (el.id ? '#' + el.id : el.tagName.toLowerCase() +
            (typeof el.className === 'string' && el.className.trim()
              ? '.' + el.className.trim().split(/\s+/)[0] : '')))
      };
    });
    const wantCols = age === 'early' ? 3 : age === 'adult' ? 5 : (w > 1040 ? 4 : w > 720 ? 3 : 2);
    results.push([`${label} cols`, { ...m, expect: wantCols }]);
    expectEq(label, 'gridCols', m.cols, wantCols);
    /* every preset must keep a real gutter — a zero here means the custom
       property resolved to a cycle instead of a length */
    if (!(m.gap > 0) || m.rowGap !== m.gap) {
      fails.push(`${label} gap: col ${m.gap}px / row ${m.rowGap}px, want a matching non-zero gutter`);
    }
    /* and the cards must exactly tile the grid: n*cardW + (n-1)*gap === gridW */
    expectEq(label, 'card math',
      round(m.cardW * m.cols + m.gap * (m.cols - 1)), round(m.gridW));
    /* no horizontal scroll, and the grid must fit inside the shell gutter */
    if (m.docScrollW > w + 1) {
      fails.push(`${label} overflow: scrollWidth ${m.docScrollW} > viewport ${w}; bleeding ` +
        (m.bleeders.join(', ') || '(unattributed)'));
    }
    if (m.gridW > w - 2 * 24 + 1) {
      fails.push(`${label} grid ${round(m.gridW)}px escapes the ${w - 48}px content column`);
    }
    /* AAC targets are pressed repeatedly and often imprecisely — every card
       must stay a comfortable touch target. Height is max(the mockup's
       294:174 ratio, the preset's --card-h floor): the floor deliberately
       wins on phones, squaring the card up for a bigger touch target. */
    if (m.cardW < 100 || m.cardH < 100) {
      fails.push(`${label} touch target ${round(m.cardW)}x${round(m.cardH)} is below 100px`);
    }
    const mockRatio = 294 / 174;
    const wantCardH = Math.max(m.cardW / mockRatio, m.cardFloor);
    if (Math.abs(m.cardH - wantCardH) > 1) {
      fails.push(`${label} card height ${round(m.cardH)}px, want ${round(wantCardH)}px ` +
        `(max of ${round(m.cardW / mockRatio)} ratio and ${round(m.cardFloor)} floor)`);
    }
    await page.screenshot({ path: path.join(OUT, label + '.png'), fullPage: w <= 1040 });
    await ctx.close();
  }

  /* ───────────────────────────── PORTAL ─────────────────────────── */
  {
    const { ctx, page } = await newPage(1901, 1000);
    await page.goto('file://' + path.join(ROOT, 'portal.html'), { waitUntil: 'load' });
    await page.waitForTimeout(400);

    results.push(['PORTAL PIN gate shown', { modal: await page.evaluate(() => !!document.querySelector('#pin-root .modal')) }]);
    await page.screenshot({ path: path.join(OUT, '09-portal-pin.png') });

    for (const d of ['1', '2', '3', '4']) { await page.click(`#pin-root [data-k="${d}"]`); await page.waitForTimeout(60); }
    await page.waitForTimeout(600);

    const dash = await page.evaluate(() => {
      const r = s => { const n = document.querySelector(s); return n ? n.getBoundingClientRect() : null; };
      return {
        unlocked: !!document.getElementById('view-dashboard').innerHTML.trim(),
        stats: document.querySelectorAll('.stat').length,
        cards: document.querySelectorAll('#view-dashboard .card').length,
        metricGroups: document.querySelectorAll('#view-dashboard .metrics').length,
        navW: r('.pnav').width,
        statW: r('.stat')?.width,
        statH: r('.stat')?.height,
        title: document.getElementById('page-title').textContent
      };
    });
    results.push(['PORTAL dashboard', dash]);
    expect('PORTAL', 'navW', dash.navW);
    expect('PORTAL', 'statW', dash.statW);
    expect('PORTAL', 'statH', dash.statH);
    expectEq('PORTAL', 'statCards', dash.stats, 5);
    await page.screenshot({ path: path.join(OUT, '10-portal-dashboard.png') });
    await page.screenshot({ path: path.join(OUT, '11-portal-dashboard-full.png'), fullPage: true });

    for (const [view, label, checks] of [
      ['profile', '12-portal-profile', '.choice'],
      ['vocabulary', '13-portal-vocabulary', '.dropzone, .vtile'],
      ['geofencing', '14-portal-geofencing', '.geoitem, .map__pin, .routine__row'],
      ['analytics', '15-portal-analytics', '.chart, .barrow']
    ]) {
      await page.click(`[data-view="${view}"]`);
      await page.waitForTimeout(450);
      const n = await page.evaluate(s => document.querySelectorAll(s).length, checks);
      const visible = await page.evaluate(v => !document.getElementById('view-' + v).hidden, view);
      results.push([`PORTAL ${view}`, { found: n, visible }]);
      await page.screenshot({ path: path.join(OUT, label + '.png'), fullPage: true });
    }

    /* profile: change age preset, verify board reacts */
    await page.click('[data-view="profile"]');
    await page.waitForTimeout(300);
    await page.click('[data-age="adult"]');
    await page.waitForTimeout(250);
    results.push(['PORTAL age preset saved', await page.evaluate(() => CC.Store.get().ageGroup)]);
    await page.click('#p-save');
    await page.waitForTimeout(300);

    /* vocabulary: add a symbol */
    await page.click('[data-view="vocabulary"]');
    await page.waitForTimeout(300);
    await page.fill('#v-en', 'Balloon');
    await page.fill('#v-tl', 'Balon');
    await page.selectOption('#v-cat', 'others');
    await page.click('#v-save');
    await page.waitForTimeout(400);
    results.push(['PORTAL custom symbol added', await page.evaluate(() => CC.Store.get().customSymbols.map(s => s.en + '/' + s.tl))]);

    /* geofencing: set active context */
    await page.click('[data-view="geofencing"]');
    await page.waitForTimeout(300);
    const setActive = await page.$('[data-act="make-active"]:not([disabled])');
    if (setActive) { await setActive.click(); await page.waitForTimeout(350); }
    results.push(['PORTAL active context', await page.evaluate(() => CC.Store.get().activeContext)]);

    await ctx.close();
  }

  /* ─────────────────── persistence across pages ─────────────────── */
  {
    const { ctx, page } = await newPage(1835, 980);
    await page.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    results.push(['STATE persisted to board', await page.evaluate(() => ({
      ageGroup: CC.Store.get().ageGroup,
      activeContext: CC.Store.get().activeContext,
      custom: CC.Store.get().customSymbols.length
    }))]);
    await page.screenshot({ path: path.join(OUT, '16-board-final.png') });
    await ctx.close();
  }

  await browser.close();

  console.log('\n' + '='.repeat(74));
  for (const [k, v] of results) console.log(k.padEnd(30), JSON.stringify(v));
  console.log('='.repeat(74));
  console.log(errors.length ? 'ERRORS (' + errors.length + '):\n' + [...new Set(errors)].join('\n') : 'NO CONSOLE / PAGE ERRORS');
  if (fails.length) {
    console.log(`\nLAYOUT REGRESSIONS (${fails.length}):\n` + fails.map(f => '  ✗ ' + f).join('\n'));
  } else {
    console.log('LAYOUT: all ' + Object.keys(TARGETS).length + ' measured targets within tolerance');
  }
  console.log('screenshots ->', OUT);

  if (errors.length || fails.length) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); process.exit(1); });