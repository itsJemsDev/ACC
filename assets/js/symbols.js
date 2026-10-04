/* =========================================================================
   COMMUNICARE — Symbol library
   -------------------------------------------------------------------------
   Style guide (Task 4 of the brief):
     · 48x48 viewBox, flat fills, no gradients
     · one consistent outline weight (2.2) + round caps/joins
     · neutral white card background, colour lives in the artwork only
     · every symbol is bilingual: `en` is the primary label, `tl` secondary
   ========================================================================= */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------ palette -- */
  var C = {
    blue: '#2563eb', blueL: '#bfdbfe', blueXL: '#dbeafe',
    sky: '#38bdf8', skyL: '#bae6fd',
    green: '#16a34a', greenL: '#86efac', greenXL: '#dcfce7',
    amber: '#f59e0b', amberL: '#fcd34d', amberXL: '#fef3c7',
    red: '#dc2626', redL: '#fca5a5', redXL: '#fee2e2',
    purple: '#7c3aed', purpleL: '#c4b5fd', purpleXL: '#ede9fe',
    teal: '#0d9488', tealL: '#5eead4', tealXL: '#ccfbf1',
    pink: '#db2777', pinkL: '#f9a8d4', pinkXL: '#fce7f3',
    lime: '#65a30d', limeL: '#bef264', limeXL: '#ecfccb',
    ink: '#0f172a', grey: '#94a3b8', greyL: '#e2e8f0', greyXL: '#f1f5f9',
    skin: '#f5c9a0', skinD: '#e0ab7c', white: '#ffffff',
    hair: '#3f2a20', hair2: '#7c4a21', hair3: '#1f2937', hair4: '#c2410c'
  };

  var K = 'stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

  function S(inner) {
    return '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" ' +
      'aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  /* ----------------------------------------------------------- helpers -- */
  /* A simple front-facing person. shirt/hair drive visual differentiation. */
  function person(hair, shirt, extra) {
    return '' +
      '<path d="M24 41c-7.7 0-13.5-4.5-13.5-10C10.5 25.4 16.7 21 24 21s13.5 4.4 13.5 10C37.5 36.5 31.7 41 24 41z" fill="' + shirt + '" ' + K + '/>' +
      '<circle cx="24" cy="16.2" r="8.6" fill="' + C.skin + '" ' + K + '/>' +
      '<path d="M15.4 15.6c0-5.9 3.7-10.1 8.6-10.1s8.6 4.2 8.6 10.1c0 1-.1 1.9-.3 2.6-1.1-4.6-3.8-7.3-8.3-7.3s-7.2 2.7-8.3 7.3c-.2-.7-.3-1.6-.3-2.6z" fill="' + hair + '" ' + K + '/>' +
      (extra || '');
  }

  /* A head-and-shoulders silhouette inside a tinted disc — for feelings. */
  function face(fill, mouth, extra) {
    return '<circle cx="24" cy="24" r="16" fill="' + fill + '" ' + K + '/>' + (extra || '') + mouth;
  }

  var smile = '<path d="M17.5 27.5c1.6 2.6 3.9 3.9 6.5 3.9s4.9-1.3 6.5-3.9" ' + K + ' stroke="#0f172a" stroke-width="2.6"/>';
  var frown = '<path d="M17.5 31.5c1.6-2.6 3.9-3.9 6.5-3.9s4.9 1.3 6.5 3.9" ' + K + ' stroke="#0f172a" stroke-width="2.6"/>';
  var flatM = '<path d="M18 30h12" ' + K + ' stroke="#0f172a" stroke-width="2.6"/>';
  var eyes = '<circle cx="19.4" cy="22.4" r="1.9" fill="#0f172a"/><circle cx="28.6" cy="22.4" r="1.9" fill="#0f172a"/>';
  var eyesUp = '<path d="M17.4 23.4c1-1.4 3-1.4 4 0M26.6 23.4c1-1.4 3-1.4 4 0" ' + K + '/>';

  /* ------------------------------------------------------------- icons -- */
  var ART = {};

  /* === BASIC =========================================================== */
  ART.yes = S('<circle cx="24" cy="24" r="16" fill="' + C.greenXL + '" ' + K + '/>' +
    '<path d="M15.5 24.4l5.8 5.8L32.8 18" stroke="' + C.green + '" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>');

  ART.no = S('<circle cx="24" cy="24" r="16" fill="' + C.redXL + '" ' + K + '/>' +
    '<path d="M17.4 17.4l13.2 13.2M30.6 17.4L17.4 30.6" stroke="' + C.red + '" stroke-width="4.4" stroke-linecap="round"/>');

  ART.maybe = S('<circle cx="24" cy="24" r="16" fill="' + C.amberXL + '" ' + K + '/>' +
    '<path d="M19.4 19.4a4.9 4.9 0 119.2 3.4c-1.6 1.7-4.6 2.4-4.6 4.8" stroke="' + C.amber + '" stroke-width="3.6" stroke-linecap="round" fill="none"/>' +
    '<circle cx="24" cy="32.4" r="2.2" fill="' + C.amber + '"/>');

  ART.please = S('<path d="M13.2 29.6c-.5-1.5.3-3.2 1.9-3.6 1.4-.4 2.9.4 3.5 1.7l1.2 2.7v-15a2.3 2.3 0 014.6 0v11.2h1.3V13.4a2.3 2.3 0 014.6 0v13.2h1.3V15.6a2.3 2.3 0 014.6 0v11h1.3v-3.2a2.3 2.3 0 014.6 0V30c0 5.4-3.9 9.4-9.4 9.4h-3.4c-3.6 0-6-1.7-7.7-4.7l-2.4-4.1z" fill="' + C.skin + '" ' + K + '/>' +
    '<path d="M20.6 18.6l1.4-1.4M26 14.6l1.4-1.4M31.4 18.6l1.4-1.4" ' + K + ' stroke="' + C.amber + '" stroke-width="2"/>');

  ART.thanks = S('<path d="M24 38.6s-12.8-7.7-12.8-16.2a7.2 7.2 0 0112.8-4.4 7.2 7.2 0 0112.8 4.4c0 8.5-12.8 16.2-12.8 16.2z" fill="' + C.pinkL + '" ' + K + '/>' +
    '<path d="M9 10.5l1.1 2.6 2.6 1.1-2.6 1.1L9 18l-1.1-2.7-2.6-1.1 2.6-1.1z" fill="' + C.amber + '"/>' +
    '<path d="M38.4 17.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z" fill="' + C.amber + '"/>');

  ART.sorry = S('<circle cx="24" cy="20" r="7.4" fill="' + C.skin + '" ' + K + '/>' +
    '<path d="M11 38c0-6 5.8-9.6 13-9.6S37 32 37 38" fill="' + C.blueL + '" ' + K + '/>' +
    '<path d="M6.5 27.5c-1.6 2.6-1.8 5.4-.4 7.8M41.5 27.5c1.6 2.6 1.8 5.4.4 7.8" ' + K + ' stroke="' + C.blue + '" stroke-width="3.4"/>' +
    '<path d="M21.2 18.6h5.6" ' + K + '/>');

  ART.help = S('<circle cx="24" cy="24" r="16" fill="' + C.blueXL + '" ' + K + '/>' +
    '<path d="M18.6 18.8a5.6 5.6 0 1110.4 3c-1.4 1.9-5 2.6-5 5.4" stroke="' + C.blue + '" stroke-width="3.8" stroke-linecap="round" fill="none"/>' +
    '<circle cx="24" cy="33" r="2.4" fill="' + C.blue + '"/>');

  ART.stop = S('<circle cx="24" cy="24" r="16" fill="' + C.redXL + '" ' + K + '/>' +
    '<rect x="16.6" y="16.6" width="14.8" height="14.8" rx="3.4" fill="' + C.red + '" stroke="' + C.red + '" stroke-width="2.2"/>');

  /* === PEOPLE ========================================================== */
  ART.me = S(person(C.hair, C.blue,
    '<path d="M24 41c-7.7 0-13.5-4.5-13.5-10C10.5 25.4 16.7 21 24 21" fill="' + C.blueL + '"/>' +
    '<path d="M24 9.6c1.6 2.4 1.4 4.6-.4 6.2" ' + K + ' stroke="' + C.white + '"/>') +
    '<path d="M31 5.5l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6L27.2 9.3l2.6-1.2z" fill="' + C.amber + '" stroke="' + C.amber + '" stroke-width="1"/>');

  ART.you = S(person(C.hair4, C.green,
    '<path d="M34 24.5c2.6.6 4.4 1.2 5.6 2.4" ' + K + '/>') +
    '<path d="M39.6 26.9l2.8 1.4-1-3" fill="' + C.ink + '" stroke="' + C.ink + '" stroke-width="1.4" stroke-linejoin="round"/>');

  ART.mom = S(person(C.hair, C.pink,
    '<path d="M15.6 18.4c-1.6 4.6-1.8 9.6-.4 14M32.4 18.4c1.6 4.6 1.8 9.6.4 14" ' + K + ' stroke="' + C.hair + '" stroke-width="2.6"/>' +
    '<circle cx="24" cy="30" r="2.6" fill="' + C.amber + '" ' + K + '/>'));

  ART.dad = S(person(C.hair3, C.teal,
    '<path d="M18.6 10.2h10.8" ' + K + ' stroke="' + C.hair3 + '" stroke-width="2.6"/>' +
    '<path d="M21.4 10.2V6.6h5.2v3.6" fill="' + C.greyL + '" ' + K + '/>'));

  ART.sister = S(person(C.hair2, C.redL,
    '<path d="M15.4 15.6c0-5.9 3.7-10.1 8.6-10.1" fill="' + C.hair2 + '"/>' +
    '<path d="M14 10c1.6-3.4 4.6-5 8-5.2" ' + K + ' stroke="' + C.hair2 + '" stroke-width="2.6"/>'));

  ART.brother = S(person(C.hair3, C.sky,
    '<path d="M17.6 8.6h12.8" ' + K + ' stroke="' + C.hair3 + '" stroke-width="2.6"/>' +
    '<path d="M20 8.6c1-2.4 6.9-2.4 8 0" fill="' + C.hair3 + '" ' + K + '/>'));

  ART.friend = S('<circle cx="17" cy="19" r="7.4" fill="' + C.skin + '" ' + K + '/>' +
    '<path d="M9.6 18.6c0-5.2 3.2-8.8 7.4-8.8s7.4 3.6 7.4 8.8c0 .9-.1 1.7-.3 2.4-1-4-3.3-6.2-7.1-6.2s-6.1 2.2-7.1 6.2c-.2-.7-.3-1.5-.3-2.4z" fill="' + C.hair4 + '" ' + K + '/>' +
    '<path d="M17 40c-6.6 0-12-4-12-9 0-4.6 5.4-8.6 12-8.6" fill="' + C.amberL + '" ' + K + '/>' +
    '<circle cx="31" cy="19" r="7.4" fill="' + C.skinD + '" ' + K + '/>' +
    '<path d="M23.6 18.6c0-5.2 3.2-8.8 7.4-8.8s7.4 3.6 7.4 8.8c0 .9-.1 1.7-.3 2.4-1-4-3.3-6.2-7.1-6.2" fill="' + C.hair + '" ' + K + '/>' +
    '<path d="M31 40c6.6 0 12-4 12-9 0-4.6-5.4-8.6-12-8.6" fill="' + C.blueL + '" ' + K + '/>');

  ART.teacher = S(person(C.hair, C.blueL,
    '<path d="M14.6 10.4L24 5.6l9.4 4.8L24 15.2z" fill="' + C.ink + '" ' + K + '/>' +
    '<path d="M18 12.6v3.8c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2v-3.8" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M36 12v6.4" ' + K + '/>'));

  /* === FOOD ============================================================ */
  ART.eat = S('<circle cx="24" cy="24" r="16" fill="' + C.amberXL + '" ' + K + '/>' +
    '<path d="M8.5 26.5h31c0 7.6-7 13-15.5 13s-15.5-5.4-15.5-13z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M14 26.5c0-4.4 4.4-8 10-8s10 3.6 10 8" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M12 18.6l3 5M20 16.4l2 5.4M28 16.4l2 5.4M36 18.6l3 5" ' + K + ' stroke="' + C.amber + '" stroke-width="2.2"/>');

  ART.drink = S('<circle cx="24" cy="24" r="16" fill="' + C.skyXL + '" ' + K + '/>' +
    '<path d="M14.6 12h18.8l-2.4 27.4H17z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M15.8 22.6h16.4l-.9 10.2H16.7z" fill="' + C.sky + '" stroke="' + C.sky + '" stroke-width="1.6"/>' +
    '<path d="M33.4 15.6l4.4-2.4" ' + K + ' stroke="' + C.sky + '" stroke-width="2.4"/>');

  ART.water = S('<circle cx="24" cy="24" r="16" fill="' + C.skyXL + '" ' + K + '/>' +
    '<path d="M24 8.6c5.6 6.6 8.6 10.8 8.6 14.6A8.6 8.6 0 0115.4 23.2c0-3.8 3-8 8.6-14.6z" fill="' + C.sky + '" ' + K + '/>' +
    '<path d="M20.4 24.6a3.6 3.6 0 003.2 3.6" ' + K + ' stroke="' + C.white + '" stroke-width="2.2"/>');

  ART.rice = S('<circle cx="24" cy="24" r="16" fill="' + C.greyXL + '" ' + K + '/>' +
    '<path d="M8 26.6h32c0 7.4-7.2 12.6-16 12.6S8 34 8 26.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M24 24.6c-4.6-1.4-6.6-4-6.6-6.6 0-2.4 1.8-4.4 4-4.4 1.4 0 2.2.8 2.6 1.6.4-.8 1.2-1.6 2.6-1.6 2.2 0 4 2 4 4.4 0 2.6-2 5.2-6.6 6.6z" fill="' + C.white + '" ' + K + '/>');

  ART.fruit = S('<circle cx="24" cy="24" r="16" fill="' + C.greenXL + '" ' + K + '/>' +
    '<circle cx="19" cy="27" r="8.4" fill="' + C.red + '" ' + K + '/>' +
    '<circle cx="29.6" cy="29.6" r="6.4" fill="' + C.amber + '" ' + K + '/>' +
    '<path d="M19 18.6c0-3.4 1.4-5.4 4.4-6" ' + K + ' stroke="' + C.lime + '" stroke-width="2.6"/>' +
    '<path d="M20.6 13.4c2.6-2 6-2.4 8.6-1.2-1 3-4 4.6-7 4.2z" fill="' + C.limeL + '" ' + K + '/>');

  ART.milk = S('<circle cx="24" cy="24" r="16" fill="' + C.blueXL + '" ' + K + '/>' +
    '<path d="M18 10.6h12v5l3.4 4.6v18.2a3.4 3.4 0 01-3.4 3.4H18a3.4 3.4 0 01-3.4-3.4V20.2L18 15.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M14.6 22.6h18.8" ' + K + '/>' +
    '<path d="M18 28.4h12v9.4H18z" fill="' + C.blueL + '" stroke="' + C.blueL + '" stroke-width="1.6"/>');

  ART.bread = S('<circle cx="24" cy="24" r="16" fill="' + C.amberXL + '" ' + K + '/>' +
    '<path d="M9.6 25.6a7.4 7.4 0 017.4-7.4h14a7.4 7.4 0 010 14.8H17a7.4 7.4 0 01-7.4-7.4z" fill="' + C.amber + '" ' + K + '/>' +
    '<path d="M9.6 25.6h28.8M17 21.6h20M17 29.6h20" ' + K + ' stroke="' + C.amberL + '" stroke-width="2"/>');

  ART.hungry = S(face(C.amberXL, frown,
    '<circle cx="19.4" cy="22.4" r="1.9" fill="#0f172a"/><circle cx="28.6" cy="22.4" r="1.9" fill="#0f172a"/>' +
    '<path d="M9.6 30.6c2.6 2.4 5 3.6 7.2 3.6" ' + K + ' stroke="' + C.amber + '" stroke-width="2.4"/>'));

  /* === FEELINGS ======================================================== */
  ART.happy = S(face(C.greenXL, smile, eyes +
    '<path d="M9.6 18.4l2.6-2.6M38.4 18.4l-2.6-2.6" ' + K + ' stroke="' + C.green + '" stroke-width="2.4"/>'));

  ART.sad = S(face(C.skyXL, frown, eyes +
    '<path d="M15.4 11.6c2.2 1.6 4 2.2 5.4 2.2" ' + K + ' stroke="' + C.sky + '" stroke-width="2.4"/>' +
    '<path d="M34.6 40.4c1.4-1.8 2.6-2.6 3.6-2.6" ' + K + ' stroke="' + C.sky + '" stroke-width="2.4"/>'));

  ART.angry = S(face(C.redXL,
    '<path d="M17.4 30.6c1.6-2.6 3.9-3.9 6.6-3.9s5 1.3 6.6 3.9" ' + K + ' stroke="#0f172a" stroke-width="2.6"/>',
    '<path d="M16.6 18.6l6 2.6M31.4 18.6l-6 2.6" ' + K + ' stroke="' + C.red + '" stroke-width="3"/>' +
    '<circle cx="19.6" cy="23.6" r="1.9" fill="#0f172a"/><circle cx="28.4" cy="23.6" r="1.9" fill="#0f172a"/>'));

  ART.tired = S(face(C.purpleXL, flatM,
    '<path d="M16 22.6h6M26 22.6h6" ' + K + ' stroke="#0f172a" stroke-width="2.6"/>' +
    '<path d="M11.6 15.4l3.4-3M36.4 15.4l-3.4-3" ' + K + ' stroke="' + C.purple + '" stroke-width="2.2"/>'));

  ART.scared = S(face(C.amberXL,
    '<ellipse cx="24" cy="31.6" rx="4" ry="5" fill="#0f172a"/>',
    '<circle cx="19.4" cy="21.4" r="2.4" fill="#0f172a"/><circle cx="28.6" cy="21.4" r="2.4" fill="#0f172a"/>' +
    '<path d="M24 4.6c.8 3 .8 4.6 0 5.6" ' + K + ' stroke="' + C.amber + '" stroke-width="2.4"/>'));

  ART.sick = S(face(C.greenXL, flatM, eyes +
    '<path d="M14.4 12.6l4.4 4.4M18.8 12.6l-4.4 4.4" ' + K + ' stroke="' + C.green + '" stroke-width="2.6"/>' +
    '<path d="M29.6 12.6l4.4 4.4M34 12.6l-4.4 4.4" ' + K + ' stroke="' + C.green + '" stroke-width="2.6"/>'));

  ART.love = S('<circle cx="24" cy="24" r="16" fill="' + C.pinkXL + '" ' + K + '/>' +
    '<path d="M24 35.4s-9.4-5.6-9.4-11.8a5.3 5.3 0 019.4-3.2 5.3 5.3 0 019.4 3.2c0 6.2-9.4 11.8-9.4 11.8z" fill="' + C.red + '" ' + K + '/>');

  ART.excited = S(face(C.amberXL,
    '<path d="M17.4 28.4a7.4 7.4 0 0013.2 0z" fill="#0f172a"/>',
    '<path d="M16.6 20.6l5.4 1.4M31.4 20.6L26 22" ' + K + ' stroke="' + C.amber + '" stroke-width="3"/>' +
    '<path d="M12 8.6l1.4 3.2 3.2 1.4-3.2 1.4L12 18l-1.4-3.4-3.2-1.4 3.2-1.4zM36 8.6l1.4 3.2 3.2 1.4-3.2 1.4L36 18l-1.4-3.4-3.2-1.4 3.2-1.4z" fill="' + C.amber + '" stroke="none"/>'));

  /* === NEEDS ============================================================ */
  ART.toilet = S('<circle cx="24" cy="24" r="16" fill="' + C.tealXL + '" ' + K + '/>' +
    '<rect x="13.4" y="9.6" width="21.2" height="10.6" rx="2.6" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M16.6 14.6h14.8" ' + K + ' stroke="' + C.teal + '" stroke-width="2.2"/>' +
    '<path d="M15.4 20.2h17.2l1.6 15.4a3 3 0 01-3 3.2H16.8a3 3 0 01-3-3.2z" fill="' + C.white + '" ' + K + '/>' +
    '<circle cx="24" cy="28.4" r="3.4" fill="' + C.tealL + '" ' + K + '/>');

  ART.bath = S('<circle cx="24" cy="24" r="16" fill="' + C.skyXL + '" ' + K + '/>' +
    '<path d="M6.6 24.6h34.8v3.6a9.6 9.6 0 01-9.6 9.6H16.2a9.6 9.6 0 01-9.6-9.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M6.6 27.6h34.8" ' + K + ' stroke="' + C.sky + '" stroke-width="2.2"/>' +
    '<path d="M10.6 24.6l4.6-9.6h17.6l4.6 9.6z" fill="' + C.skyL + '" ' + K + '/>' +
    '<circle cx="18" cy="10.4" r="2.4" fill="' + C.white + '" ' + K + '/>' +
    '<circle cx="30" cy="8.6" r="1.8" fill="' + C.white + '" ' + K + '/>');

  ART.medicine = S('<circle cx="24" cy="24" r="16" fill="' + C.redXL + '" ' + K + '/>' +
    '<rect x="9.6" y="18.6" width="28.8" height="17.4" rx="4" fill="' + C.white + '" ' + K + '/>' +
    '<rect x="9.6" y="18.6" width="14.4" height="17.4" rx="4" fill="' + C.redL + '" ' + K + '/>' +
    '<path d="M24 22.6v9.4M19.4 27.4h9.2" ' + K + ' stroke="' + C.red + '" stroke-width="3"/>');

  ART.sleep = S('<circle cx="24" cy="24" r="16" fill="' + C.purpleXL + '" ' + K + '/>' +
    '<path d="M31.4 32.6A12 12 0 0116 13.4a12.6 12.6 0 1015.4 19.2z" fill="' + C.amberL + '" ' + K + '/>' +
    '<path d="M33.6 13.4h5M36.1 10.9v5M40.4 19.6h4M42.4 17.6v4" ' + K + ' stroke="' + C.purple + '" stroke-width="2"/>');

  ART.clothes = S('<circle cx="24" cy="24" r="16" fill="' + C.blueXL + '" ' + K + '/>' +
    '<path d="M17.6 9.6l6.4 4 6.4-4 8 5-3.4 6.4-3.4-1.6V39H16V19.4l-3.4 1.6L9.2 14.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M24 13.6V39" ' + K + ' stroke="' + C.blue + '" stroke-width="2.2"/>');

  ART.diaper = S('<circle cx="24" cy="24" r="16" fill="' + C.amberXL + '" ' + K + '/>' +
    '<path d="M12.6 14.6h22.8l-2 17.6a8 8 0 01-8 6.6h-2.8a8 8 0 01-8-6.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M12.6 14.6h22.8" ' + K + ' stroke="' + C.amber + '" stroke-width="3"/>' +
    '<rect x="19" y="22.6" width="10" height="7" rx="3" fill="' + C.skyL + '" ' + K + '/>');

  ART.clean = S('<circle cx="24" cy="24" r="16" fill="' + C.greenXL + '" ' + K + '/>' +
    '<path d="M28.6 6.6l-2 8.4h-4.2l-1.4-5.6z" fill="' + C.amberL + '" ' + K + '/>' +
    '<path d="M12.6 19.6h22.8l-1.4 14.4a7 7 0 01-7 6.4h-6a7 7 0 01-7-6.4z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M16.4 28.4c3 2 6.4 3 9.4 3" ' + K + ' stroke="' + C.green + '" stroke-width="2.2"/>');

  ART.break = S('<circle cx="24" cy="24" r="16" fill="' + C.skyXL + '" ' + K + '/>' +
    '<path d="M18.6 9.6h10.8a13.4 13.4 0 110 26.8H18.6z" fill="' + C.amberL + '" ' + K + '/>' +
    '<path d="M18.6 9.6v26.8" ' + K + ' stroke="' + C.amber + '" stroke-width="2.4"/>' +
    '<path d="M24 17.6v6M24 29v1.4" ' + K + ' stroke="' + C.white + '" stroke-width="2.6"/>');

  /* === ACTIONS ========================================================== */
  ART.go = S('<circle cx="24" cy="24" r="16" fill="' + C.blueXL + '" ' + K + '/>' +
    '<path d="M11 25.6h18.4" ' + K + ' stroke="' + C.blue + '" stroke-width="3.4"/>' +
    '<path d="M25.6 20.4l5.2 5.2-5.2 5.2" ' + K + ' stroke="' + C.blue + '" stroke-width="3.4"/>');

  ART.come = S('<circle cx="24" cy="24" r="16" fill="' + C.tealXL + '" ' + K + '/>' +
    '<path d="M37 25.6H18.6" ' + K + ' stroke="' + C.teal + '" stroke-width="3.4"/>' +
    '<path d="M22.4 20.4L17.2 25.6l5.2 5.2" ' + K + ' stroke="' + C.teal + '" stroke-width="3.4"/>');

  ART.play = S('<circle cx="24" cy="24" r="16" fill="' + C.greenXL + '" ' + K + '/>' +
    '<circle cx="24" cy="24" r="10.4" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M20.4 18.6l10.6 5.4-10.6 5.4z" fill="' + C.green + '" stroke="' + C.green + '" stroke-width="2.2" stroke-linejoin="round"/>');

  ART.read = S('<circle cx="24" cy="24" r="16" fill="' + C.purpleXL + '" ' + K + '/>' +
    '<path d="M24 13.6c-3.6-2.4-8-3-11.4-2.4v22c3.4-.6 7.8 0 11.4 2.4 3.6-2.4 8-3 11.4-2.4v-22c-3.4-.6-7.8 0-11.4 2.4z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M24 13.6v22.4" ' + K + '/>' +
    '<path d="M16.6 18.6h4.4M16.6 23h4.4M27 18.6h4.4M27 23h4.4" ' + K + ' stroke="' + C.purple + '" stroke-width="1.8"/>');

  ART.write = S('<circle cx="24" cy="24" r="16" fill="' + C.amberXL + '" ' + K + '/>' +
    '<path d="M12.6 35.4l3.4-9.6L32 9.8l6.2 6.2-16 16z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M16 25.8l6.2 6.2M12.6 35.4l7.4-2" ' + K + ' stroke="' + C.amber + '" stroke-width="2.2"/>' +
    '<path d="M9.6 39.6h29.8" ' + K + ' stroke="' + C.amber + '" stroke-width="2.6"/>');

  ART.walk = S('<circle cx="24" cy="24" r="16" fill="' + C.limeXL + '" ' + K + '/>' +
    '<circle cx="26" cy="10.6" r="3.6" fill="' + C.skin + '" ' + K + '/>' +
    '<path d="M26 15.4l-4.4 8.6 3.4 3.4-1.6 9.6" ' + K + ' stroke="' + C.ink + '" stroke-width="2.8"/>' +
    '<path d="M25 27.4l6.6 3.4M21.6 24l-6.4 3.4" ' + K + ' stroke="' + C.ink + '" stroke-width="2.8"/>' +
    '<path d="M23.4 37l-3.4 3.6M27.4 37l3.4 3.6" ' + K + ' stroke="' + C.ink + '" stroke-width="2.8"/>');

  ART.give = S('<circle cx="24" cy="24" r="16" fill="' + C.greenXL + '" ' + K + '/>' +
    '<path d="M32.6 10.6H15.4a2.6 2.6 0 00-2.6 2.6v21.2a2.6 2.6 0 002.6 2.6h17.2a2.6 2.6 0 002.6-2.6V13.2a2.6 2.6 0 00-2.6-2.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M21.6 17.4h9.8M21.6 24h9.8M21.6 30.6h6.4" ' + K + ' stroke="' + C.green + '" stroke-width="2.4"/>');

  ART.take = S('<circle cx="24" cy="24" r="16" fill="' + C.purpleXL + '" ' + K + '/>' +
    '<path d="M15.4 17.6h17.2v4.8H15.4z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M15.4 24.4h17.2v11a2.6 2.6 0 01-2.6 2.6H18a2.6 2.6 0 01-2.6-2.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M19.6 10.6h8.8" ' + K + ' stroke="' + C.purple + '" stroke-width="2.8"/>' +
    '<path d="M19.6 30h8.8" ' + K + ' stroke="' + C.purple + '" stroke-width="2.4"/>');

  /* === PLACES ========================================================== */
  ART.home = S('<circle cx="24" cy="24" r="16" fill="' + C.blueXL + '" ' + K + '/>' +
    '<path d="M8.6 22.6L24 10l15.4 12.6" ' + K + ' stroke="' + C.red + '" stroke-width="3"/>' +
    '<path d="M12.6 21.4v18.4h22.8V21.4" fill="' + C.white + '" ' + K + '/>' +
    '<rect x="20.4" y="28.4" width="7.2" height="11.4" rx="1.4" fill="' + C.blueL + '" ' + K + '/>');

  ART.school = S('<circle cx="24" cy="24" r="16" fill="' + C.amberXL + '" ' + K + '/>' +
    '<path d="M24 9.6L9.4 17v3.6h29.2V17z" fill="' + C.red + '" ' + K + '/>' +
    '<path d="M12.6 20.6h22.8v18.8H12.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M7.6 20.6h3.6M36.8 20.6h3.6M24 9.6v-4" ' + K + ' stroke="' + C.red + '" stroke-width="2.4"/>' +
    '<rect x="20.6" y="28.4" width="6.8" height="11" rx="1.4" fill="' + C.amberL + '" ' + K + '/>');

  ART.hospital = S('<circle cx="24" cy="24" r="16" fill="' + C.redXL + '" ' + K + '/>' +
    '<rect x="12.6" y="10.6" width="22.8" height="30.8" rx="3.4" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M24 17v14M17 24h14" ' + K + ' stroke="' + C.red + '" stroke-width="3.4"/>' +
    '<path d="M9.6 16.6h3M35.4 16.6h3" ' + K + ' stroke="' + C.red + '" stroke-width="2.6"/>');

  ART.park = S('<circle cx="24" cy="24" r="16" fill="' + C.greenXL + '" ' + K + '/>' +
    '<path d="M24 8.6c5.4 0 9.4 4 9.4 9 0 3.4-2 6.4-5 8H19.6c-3-1.6-5-4.6-5-8 0-5 4.2-9 9.4-9z" fill="' + C.green + '" ' + K + '/>' +
    '<path d="M24 25.6V38" ' + K + ' stroke="' + C.hair2 + '" stroke-width="3"/>' +
    '<path d="M11 39.4h26" ' + K + ' stroke="' + C.hair2 + '" stroke-width="3"/>');

  ART.store = S('<circle cx="24" cy="24" r="16" fill="' + C.amberXL + '" ' + K + '/>' +
    '<path d="M11.4 18.6h25.2l-1.6 20.8H13z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M10.6 11.6h26.8l-1.4 7H12z" fill="' + C.red + '" ' + K + '/>' +
    '<path d="M15.6 11.6l1.4-4M24 11.6V7M32.4 11.6l-1.4-4" ' + K + ' stroke="' + C.red + '" stroke-width="2.4"/>');

  ART.church = S('<circle cx="24" cy="24" r="16" fill="' + C.blueXL + '" ' + K + '/>' +
    '<path d="M22.4 26.6h3.2v13h-3.2z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M17.4 39.6h13.2" ' + K + ' stroke="' + C.white + '" stroke-width="3"/>' +
    '<path d="M22.6 15.4h2.8v11.4h-2.8z" fill="' + C.amber + '" ' + K + '/>' +
    '<path d="M19 18.4h10M21.4 21.4h5.2" ' + K + ' stroke="' + C.amber + '" stroke-width="2"/>');

  ART.market = S('<circle cx="24" cy="24" r="16" fill="' + C.limeXL + '" ' + K + '/>' +
    '<path d="M9.6 17.6h28.8l-2 4.4H11.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M12.6 22.6h22.8v15.8H12.6z" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M9.6 17.6l2.4-6.4h24l2.4 6.4" ' + K + ' stroke="' + C.green + '" stroke-width="2.6"/>' +
    '<circle cx="18" cy="29.4" r="3" fill="' + C.red + '" ' + K + '/>' +
    '<circle cx="29.4" cy="29.4" r="3" fill="' + C.amber + '" ' + K + '/>');

  ART.therapy = S('<circle cx="24" cy="24" r="16" fill="' + C.tealXL + '" ' + K + '/>' +
    '<path d="M24 35.4s-9.4-5.6-9.4-11.8a5.3 5.3 0 019.4-3.2 5.3 5.3 0 019.4 3.2c0 6.2-9.4 11.8-9.4 11.8z" fill="' + C.red + '" ' + K + '/>' +
    '<path d="M34.6 12.6l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2zM13.4 18.6l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill="' + C.teal + '" stroke="none"/>');

  /* === OTHERS =========================================================== */
  ART.time = S('<circle cx="24" cy="24" r="16" fill="' + C.blueXL + '" ' + K + '/>' +
    '<circle cx="24" cy="24" r="10.4" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M24 17.4V24l4.6 3" ' + K + ' stroke="' + C.blue + '" stroke-width="2.8"/>');

  ART.number = S('<circle cx="24" cy="24" r="16" fill="' + C.purpleXL + '" ' + K + '/>' +
    '<rect x="8.6" y="12.6" width="12.6" height="10.6" rx="2.6" fill="' + C.white + '" ' + K + '/>' +
    '<rect x="26.8" y="12.6" width="12.6" height="10.6" rx="2.6" fill="' + C.white + '" ' + K + '/>' +
    '<rect x="8.6" y="26.8" width="12.6" height="10.6" rx="2.6" fill="' + C.white + '" ' + K + '/>' +
    '<rect x="26.8" y="26.8" width="12.6" height="10.6" rx="2.6" fill="' + C.white + '" ' + K + '/>');

  ART.color = S('<circle cx="24" cy="24" r="16" fill="' + C.greyXL + '" ' + K + '/>' +
    '<path d="M24 24l-11 8.6a16 16 0 0111-8.6z" fill="' + C.blue + '" stroke="' + C.ink + '" stroke-width="1.6"/>' +
    '<path d="M24 24l11 8.6a16 16 0 00-11-8.6z" fill="' + C.red + '" stroke="' + C.ink + '" stroke-width="1.6"/>' +
    '<path d="M24 24v15.4a16 16 0 000-15.4z" fill="' + C.amber + '" stroke="' + C.ink + '" stroke-width="1.6"/>');

  ART.question = S('<circle cx="24" cy="24" r="16" fill="' + C.amberXL + '" ' + K + '/>' +
    '<path d="M18.6 18.8a5.6 5.6 0 1110.4 3c-1.4 1.9-5 2.6-5 5.4" stroke="' + C.ink + '" stroke-width="3.6" stroke-linecap="round" fill="none"/>' +
    '<circle cx="24" cy="33" r="2.4" fill="#0f172a"/>');

  ART.today = S('<rect x="8.6" y="12.6" width="30.8" height="26.8" rx="4" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M8.6 20.6h30.8" ' + K + '/>' +
    '<path d="M16 8.6v6.6M32 8.6v6.6" ' + K + ' stroke="' + C.blue + '" stroke-width="2.8"/>' +
    '<rect x="14.6" y="25.6" width="8" height="7.6" rx="1.8" fill="' + C.blue + '" stroke="' + C.blue + '" stroke-width="1.4"/>');

  ART.tomorrow = S('<rect x="8.6" y="12.6" width="30.8" height="26.8" rx="4" fill="' + C.white + '" ' + K + '/>' +
    '<path d="M8.6 20.6h30.8" ' + K + '/>' +
    '<path d="M16 8.6v6.6M32 8.6v6.6" ' + K + ' stroke="' + C.blue + '" stroke-width="2.8"/>' +
    '<path d="M29 26.6l4.6 4.6L29 35.8" ' + K + ' stroke="' + C.green + '" stroke-width="2.8"/>');

  ART.more = S('<circle cx="24" cy="24" r="16" fill="' + C.skyXL + '" ' + K + '/>' +
    '<circle cx="15.6" cy="24" r="3.4" fill="' + C.blue + '" stroke="' + C.ink + '" stroke-width="1.8"/>' +
    '<circle cx="24" cy="24" r="3.4" fill="' + C.blue + '" stroke="' + C.ink + '" stroke-width="1.8"/>' +
    '<circle cx="32.4" cy="24" r="3.4" fill="' + C.blue + '" stroke="' + C.ink + '" stroke-width="1.8"/>');

  ART.sos = S('<circle cx="24" cy="24" r="16" fill="' + C.redXL + '" ' + K + '/>' +
    '<circle cx="24" cy="24" r="9.6" fill="' + C.red + '" ' + K + '/>' +
    '<path d="M12 24h5M31 24h5" ' + K + ' stroke="' + C.red + '" stroke-width="3"/>' +
    '<path d="M19.4 24h9.2M24 19.4v9.2" ' + K + ' stroke="#fff" stroke-width="2.6"/>');

  /* -------------------------------------------------------- categories -- */
  var CAT_ART = {
    basic:    S('<circle cx="24" cy="24" r="16" fill="' + C.blueXL + '" ' + K + '/><path d="M16 17h16M16 24h16M16 31h10" ' + K + ' stroke="' + C.blue + '" stroke-width="3"/>'),
    people:   S('<circle cx="19" cy="19" r="6.4" fill="' + C.skin + '" ' + K + '/><circle cx="31" cy="21" r="5" fill="' + C.skinD + '" ' + K + '/><path d="M8 39c0-5.4 5-9.6 11-9.6S30 33.6 30 39z" fill="' + C.blueL + '" ' + K + '/><path d="M30 31.6c5.6.6 10 3.4 10 7.4H30z" fill="' + C.pinkL + '" ' + K + '/>'),
    food:     S('<path d="M14 8v12M14 8c-3 0-4.4 3-4.4 6s1.4 6 4.4 6M14 8v12M14 20v20" ' + K + ' stroke="' + C.ink + '" stroke-width="2.6"/><path d="M32 8c-4 3.4-6 7.4-6 11 0 3 2.4 5 6 5s6-2 6-5c0-3.6-2-7.6-6-11z" fill="' + C.amberL + '" ' + K + '/>'),
    feelings: S(face(C.greenXL, smile, eyes)),
    needs:    S('<path d="M24 8l3.6 8.4 9 1-6.8 6 2 8.8L24 27.8l-7.8 4.4 2-8.8-6.8-6 9-1z" fill="' + C.amberL + '" ' + K + '/>'),
    actions:  S('<circle cx="24" cy="24" r="16" fill="' + C.greenXL + '" ' + K + '/><path d="M20.4 18.6l10.6 5.4-10.6 5.4z" fill="' + C.green + '" stroke="' + C.green + '" stroke-width="2.2" stroke-linejoin="round"/>'),
    places:   S('<path d="M24 41c-8.4-5.6-12.6-10-12.6-14.6A8.4 8.4 0 0124 21a8.4 8.4 0 0112.6 5.4C36.6 31 32.4 35.4 24 41z" fill="' + C.red + '" ' + K + '/><circle cx="24" cy="26.4" r="4" fill="' + C.white + '"/>'),
    others:   S('<circle cx="24" cy="24" r="16" fill="' + C.greyXL + '" ' + K + '/><path d="M16 17h16M16 24h16M16 31h10" ' + K + ' stroke="' + C.grey + '" stroke-width="3"/>')
  };

  /* ------------------------------------------------------------- data -- */
  function sym(id, en, tl, cat) { return { id: id, en: en, tl: tl, cat: cat, icon: ART[id] }; }

  var SYMBOLS = [
    /* Basic */
    sym('yes', 'Yes', 'Oo', 'basic'),
    sym('no', 'No', 'Hindi', 'basic'),
    sym('maybe', 'Maybe', 'Baka', 'basic'),
    sym('please', 'Please', 'Pakiusap', 'basic'),
    sym('thanks', 'Thank You', 'Salamat', 'basic'),
    sym('sorry', 'Sorry', 'Pasensya', 'basic'),
    sym('help', 'Help', 'Tulong', 'basic'),
    sym('stop', 'Stop', 'Tigil', 'basic'),
    /* People */
    sym('me', 'Me', 'Ako', 'people'),
    sym('you', 'You', 'Ikaw', 'people'),
    sym('mom', 'Mom', 'Nanay', 'people'),
    sym('dad', 'Dad', 'Tatay', 'people'),
    sym('sister', 'Sister', 'Ate', 'people'),
    sym('brother', 'Brother', 'Kapatid', 'people'),
    sym('friend', 'Friend', 'Kaibigan', 'people'),
    sym('teacher', 'Teacher', 'Guro', 'people'),
    /* Food */
    sym('eat', 'Eat', 'Kain', 'food'),
    sym('drink', 'Drink', 'Inom', 'food'),
    sym('water', 'Water', 'Tubig', 'food'),
    sym('rice', 'Rice', 'Bigyan', 'food'),
    sym('fruit', 'Fruit', 'Fruits', 'food'),
    sym('milk', 'Milk', 'Suso', 'food'),
    sym('bread', 'Bread', 'Panis', 'food'),
    sym('hungry', 'Hungry', 'Gutom', 'food'),
    /* Feelings */
    sym('happy', 'Happy', 'Masaya', 'feelings'),
    sym('sad', 'Sad', 'Malungkot', 'feelings'),
    sym('angry', 'Angry', 'Matagalit', 'feelings'),
    sym('tired', 'Tired', 'Pagod', 'feelings'),
    sym('scared', 'Scared', 'Natatakot', 'feelings'),
    sym('sick', 'Sick', 'May sakit', 'feelings'),
    sym('love', 'Love', 'Mahal', 'feelings'),
    sym('excited', 'Excited', 'Nakuha', 'feelings'),
    /* Needs */
    sym('toilet', 'Toilet', 'CR', 'needs'),
    sym('bath', 'Bath', 'Palugo', 'needs'),
    sym('medicine', 'Medicine', 'Gamot', 'needs'),
    sym('sleep', 'Sleep', 'Tulog', 'needs'),
    sym('clothes', 'Clothes', 'Kasyaan', 'needs'),
    sym('diaper', 'Diaper', 'Pipi', 'needs'),
    sym('clean', 'Clean', 'Malinis', 'needs'),
    sym('break', 'Break', 'Pahinga', 'needs'),
    /* Actions */
    sym('go', 'Go', 'Pumunta', 'actions'),
    sym('come', 'Come', 'Dito', 'actions'),
    sym('play', 'Play', 'Laruin', 'actions'),
    sym('read', 'Read', 'Basahin', 'actions'),
    sym('write', 'Write', 'Sulatin', 'actions'),
    sym('walk', 'Walk', 'Lakad', 'actions'),
    sym('give', 'Give', 'Ibigay', 'actions'),
    sym('take', 'Take', 'Kunin', 'actions'),
    /* Places */
    sym('home', 'Home', 'Bahay', 'places'),
    sym('school', 'School', 'Paaralan', 'places'),
    sym('hospital', 'Hospital', 'Ospital', 'places'),
    sym('park', 'Park', 'Park', 'places'),
    sym('store', 'Store', 'Tindahan', 'places'),
    sym('church', 'Church', 'Simbahan', 'places'),
    sym('market', 'Market', 'Palengke', 'places'),
    sym('therapy', 'Therapy', 'Terapiya', 'places'),
    /* Others */
    sym('time', 'Time', 'Oras', 'others'),
    sym('number', 'Number', 'Numero', 'others'),
    sym('color', 'Color', 'Kulay', 'others'),
    sym('question', 'Question', 'Tanong', 'others'),
    sym('today', 'Today', 'Ngayon', 'others'),
    sym('tomorrow', 'Tomorrow', 'Bukas', 'others'),
    sym('more', 'More', 'Paano', 'others'),
    sym('sos', 'SOS', 'S.O.S.', 'others')
  ];

  var CATEGORIES = [
    { id: 'basic',    label: 'Basic' },
    { id: 'people',   label: 'People' },
    { id: 'food',     label: 'Food' },
    { id: 'feelings', label: 'Feelings' },
    { id: 'needs',    label: 'Needs' },
    { id: 'actions',  label: 'Actions' },
    { id: 'places',   label: 'Places' },
    { id: 'others',   label: 'Others' }
  ];

  /* ---------------------------------------------------------------- ui -- */
  var I = function (d, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      d + (extra || '') + '</svg>';
  };

  var UI = {
    backspace: I('<path d="M21 5H9L3 12l6 7h12a1 1 0 001-1V6a1 1 0 00-1-1z"/><path d="M17 9l-5 6M12 9l5 6"/>'),
    trash:     I('<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>'),
    speaker:   I('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19.5 6a9 9 0 010 12"/>'),
    lock:      I('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>'),
    pin:       I('<path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>'),
    back:      I('<path d="M15 18l-6-6 6-6"/>'),
    dash:      I('<rect x="3" y="3" width="7" height="8" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="15" width="7" height="6" rx="1.6"/>'),
    user:      I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
    book:      I('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M19 19v2H6"/>'),
    pin2:      I('<path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>'),
    chart:     I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    logout:    I('<path d="M15 17l5-5-5-5M20 12H9M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h5"/>'),
    plus:      I('<path d="M12 5v14M5 12h14"/>'),
    check:     I('<path d="M20 6L9 17l-5-5"/>'),
    close:     I('<path d="M18 6L6 18M6 6l12 12"/>'),
    upload:    I('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>'),
    image:     I('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5-5-6 6-2-2-5 5"/>'),
    spark:     I('<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>'),
    clock:     I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    cloud:     I('<path d="M7 18h10a4 4 0 000-8 5.5 5.5 0 00-10.6 1.6A3.2 3.2 0 007 18z"/>'),
    hdd:       I('<rect x="3" y="5" width="18" height="6" rx="2"/><rect x="3" y="13" width="18" height="6" rx="2"/><path d="M7 8h.01M7 16h.01"/>'),
    trend:     I('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    grid:      I('<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>'),
    home:      I('<path d="M4 11l8-7 8 7v8a1.6 1.6 0 01-1.6 1.6H5.6A1.6 1.6 0 014 19z"/><path d="M9.5 20.6v-6h5v6"/>'),
    globe:     I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.4 3 14.6 0 18M12 3c-3 3.4-3 14.6 0 18"/>')
  };

  var UI_SOLID = {
    speaker: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/></svg>'
  };

  global.CC = global.CC || {};
  global.CC.ART = ART;
  global.CC.CAT_ART = CAT_ART;
  global.CC.SYMBOLS = SYMBOLS;
  global.CC.CATEGORIES = CATEGORIES;
  global.CC.UI = UI;
  global.CC.UI_SOLID = UI_SOLID;
})(window);