(function registerProjectSelectionTests(){
 'use strict';
 const {test}=require('node:test');
 const assert=require('node:assert/strict');
 const {readFileSync}=require('node:fs');
 const vm=require('node:vm');
 const index=readFileSync('index.html','utf8');
 const script=readFileSync('project-selection-ui.js','utf8');
 const source=readFileSync('dashboard-cm-shared.html','utf8');
 test('Project Selection loads Priority Dashboard CM and mounts its UI',()=>{
  assert.match(index,/project-selection-ui\.js\?v=20261107-1/);
  assert.match(index,/view==="project-selection"&&window\.MT_PROJECT_SELECTION/);
  assert.match(index,/window\.MT_PROJECT_SELECTION\.mount\(\)/);
  assert.match(script,/dashboard-cm-shared\.html\?mt_module=priority/);
  assert.match(source,/function renderPriority\(\)/);
  assert.match(source,/const PRIO_STORAGE_KEY='cm_priority_v1'/);
  assert.match(source,/function prioCompute\(opts=\{\}\)/);
 });
 test('Bantuan dan cheatsheet Project Selection dapat diakses dari header dan konten',()=>{
  assert.match(index,/VIEW==='project-selection'\?'selection'/);
  assert.match(index,/mode==='selection'&&window\.MT_PROJECT_SELECTION/);
  assert.match(index,/activeHelpView\(\)==='project-selection'/);
  assert.match(script,/data-ps-open="help"/);
  assert.match(script,/data-ps-open="sheet"/);
  assert.match(script,/data-ps-panel-tab/);
  assert.match(script,/data-ps-goto/);
  assert.match(script,/data-ps-close/);
  assert.match(script,/mtProjectSelectionTheme/);
 });
 test('SMART mempertahankan dua jenis utility, dua mode normalisasi dan klasifikasi',()=>{
  assert.match(source,/c\.type==='cost'\?\(max-v\)\/\(max-min\):\(v-min\)\/\(max-min\)/);
  assert.match(source,/normMode==='scale'/);
  assert.match(source,/const score=det\.reduce\(\(a,d\)=>a\+d\.contrib,0\)\*100/);
  assert.match(source,/score>=70/);
  assert.match(source,/score>=40/);
  const begin=source.indexOf('const PRIO_CRITERIA=['),end=source.indexOf('const PRIO_SCHEMA=',begin);
  assert.ok(begin>=0&&end>begin,'Kriteria asli tidak ditemukan');
  const weights=[...source.slice(begin,end).matchAll(/code:'C(\d+)'[\s\S]*?\bw:(\d+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  assert.deepEqual(weights.map(x=>x[0]),Array.from({length:12},(_,i)=>i+1));
  assert.equal(weights.reduce((n,x)=>n+x[1],0),55);
  assert.deepEqual(weights.map(x=>x[1]),[7,5,5,6,5,3,3,6,4,4,3,4]);
 });
 test('Javascript Project Selection sintaks valid dan styling modal scoped',()=>{
  assert.doesNotThrow(()=>new vm.Script(script,{filename:'project-selection-ui.js'}));
  for(const tab of ['projects','criteria','monev','reference']){
   assert.ok(script.includes("'"+tab+"'"),'Tab hilang: '+tab);
  }
  assert.match(script,/html\.mt-embedded #prioModal \.modal-head/);
  assert.match(script,/html\.mt-embedded \.prio-hero/);
  assert.match(script,/\.ps-dialog-head/);
  assert.match(script,/if\(e\.key==='Escape'\)/);
  assert.match(script,/if\(e\.key==='Tab'\)/);
 });
})();
