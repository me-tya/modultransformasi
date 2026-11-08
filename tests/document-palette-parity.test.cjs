'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const mt=readFileSync('index.html','utf8');
const cm=readFileSync('dashboard-cm-shared.html','utf8');
const docs=readFileSync('project-selection-documents.js','utf8');
const css=readFileSync('project-selection-program-bank.css','utf8');
test('PMO and CMO report generators embed the identical five-color gradient masthead as editable-doc cover media',()=>{
 for(const [name,s] of [['PMO',mt],['CMO',cm]]){
  assert.match(s,/function (?:mt|cm)RptCoverBanner\(\)/,name+' missing banner generator');
  for(const color of ['#12275A','#1F3F86','#2F5BD3','#F2A93B','#E25563','#7C5CE0','#1BA7C9','#16A37F'])
   assert.ok(s.includes(color),name+' missing '+color);
  assert.match(s,/addImg\(coverBanner,W\)/,name+' missing image embedding in Word');
  assert.match(s,/model\.template!=='classic'\?/,name+' missing modern default');
  assert.match(s,/\.band\{background:#12275A!important\}/,name+' missing classic preview variation');
 }
});
test('Template selection is wired from UI to models and both preview and downloads',()=>{
 assert.match(mt,/id="rpt-template"/);
 assert.match(mt,/model\.template=ov\.querySelector\('#rpt-template'\)/);
 assert.match(cm,/id="cmRpt2Template"/);
 assert.match(cm,/model=await build\(o\);model\.template=o\.template/);
 assert.match(docs,/data-doc-template/);
 assert.match(docs,/data-port-template/);
 assert.match(docs,/if\(q\.dataset\.docTemplate!==undefined\)/);
 assert.match(docs,/if\(q\.dataset\.portTemplate!==undefined\)/);
 assert.equal((docs.match(/template:d\.template\|\|'activity'/g)||[]).length,2);
 assert.match(css,/\.psbank-template-picker/);
});
test('PDF cover uses the exact masthead artwork exported by Word',()=>{
 assert.match(docs,/const banner=typeof mtRptCoverBanner==='function'\?mtRptCoverBanner\(\):null/);
 assert.match(docs,/pdf\.addImage\(banner\.src,'PNG'/);
 assert.match(docs,/if\(model\.template==='classic'\)/);
});
test('Project Selection document JavaScript is syntactically valid',()=>{
 assert.doesNotThrow(()=>new vm.Script(docs,{filename:'project-selection-documents.js'}));
});
