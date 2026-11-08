const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('program creation remains on Daftar Program', () => {
  const code = read('project-selection-flow.js');
  assert.match(code, /state\(\)\.prog=target\.id;state\(\)\.tab='usulan'/);
  assert.match(code, /S\.ui\.psBank\.tab='detail'/);
  assert.doesNotMatch(code, /state\(\)\.tab=isNew\?'mapping':'usulan'/);
});

test('search inputs defer rerender rather than replacing the focused input on every character', () => {
  const files = [
    ['project-selection-program-bank.js', 'liveSearch'],
    ['project-selection-workflow-2027.js', 'searchChange'],
    ['project-selection-flow.js', '__mtPswfSearchTimer'],
    ['project-selection-native.js', '__mtPsnvSearchTimer'],
    ['dashboard-executive-v2.js', '__mtDashboardSearchTimer'],
  ];
  for (const [name, identifier] of files) {
    const code = read(name);
    assert.ok(code.includes(identifier), name + ' must handle search refresh');
    assert.match(code, /clearTimeout\(/, name + ' must cancel stale refreshes');
    assert.match(code, /setTimeout\(/, name + ' must defer refresh');
    assert.match(code, /focus\(\{preventScroll:true\}\)/, name + ' must preserve scroll and focus');
  }
});

test('project history is first; redundant Pemetaan tab is absent', () => {
  const code = read('project-selection-scope-map.js');
  assert.match(code, /const MAPPING_TABS=\[\['history','Riwayat Proyek'/);
  assert.doesNotMatch(code, /\['mapping','Pemetaan'\]/);
  assert.match(code, /data-scope-history-search/);
});
