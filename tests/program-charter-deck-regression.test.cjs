'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'project-selection-documents.js'), 'utf8');

function setup(sections, charter) {
  const calls = [];
  const S = {
    ui: { psSelectedYear: 2026, psBank: { doc: {
      format: 'pptx', sections, cover: true, sign: false, toc: true
    } } },
    charters: []
  };
  const window = { MT_PROJECT_SELECTION: { internals: {} } };
  const chDeck3 = data => {
    calls.push(data);
    return { slides: ['Charter Program', 'Kriteria Penyelesaian', 'Rencana Kerja']
      .map(n => ({ n, bg: 'FFFFFF', E: [{ t: 't', x: 0, y: 0, w: 5, h: 1, txt: n, s: 18, c: '12275A' }] })) };
  };
  const dkHtml = slide => '<div class="dk-s">' + slide.n + '</div>';
  const api = new Function('window', 'S', 'chDeck3', 'dkHtml',
    source + '\nreturn window.MT_PS_DOC;')(window, S, chDeck3, dkHtml);
  const program = { id: 25, akr: 'CORE', kode: 'B25-CORE',
    nama: 'Integrated Core System', mulai: 2026, periode: '2026–2029',
    psProgramCharter: charter };
  return { api, calls, S, program };
}

const charter = { prog: 'CORE', p1: 2026, p2: 2029,
  tujuan: 'End-to-end', ms: [{ y: 2029, t: 'Go live' }],
  rk: [{ t: 'Integrasi', s: '2027-01', e: '2028-01' }] };

test('charter checkbox contributes its three original slides to the composite PPT deck', () => {
  const { api, program, calls } = setup(['charter'], charter);
  const deck = api.programDeck(program);
  assert.deepEqual(deck.map(s => s.kind), ['cover', 'native-charter', 'native-charter', 'native-charter']);
  assert.deepEqual(deck.slice(1).map(s => s.title), ['Charter Program', 'Kriteria Penyelesaian', 'Rencana Kerja']);
  assert.equal(calls[0].rk[0].t, 'Integrasi');
  assert.equal(calls[0].p2, 2029);
  assert.match(api.programSlideHtml(program, deck[1], 1, deck.length, 1), /class="dk-s"/);
});

test('unchecking Charter Program excludes native charter slides', () => {
  const { api, program } = setup(['identity'], charter);
  const deck = api.programDeck(program);
  assert.ok(deck.every(s => s.kind !== 'native-charter'));
});

test('native PPTX export uses editable shapes and text, not screenshots', () => {
  assert.match(source, /if\(page\.kind==='native-charter'\)/);
  assert.match(source, /sl\.addShape\(/);
  assert.match(source, /sl\.addText\(/);
  assert.match(source, /fitNativeCharterPreview\(root\)/);
});
