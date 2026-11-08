'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','project-selection-scope-map.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','project-selection-program-bank.css'),'utf8');
function setup(){
 const prev={id:'previous',akr:'DOA26',kode:'B26-DOA',nama:'Office Automation 2026',psYear:2026,
  psProjects:[{id:'old',name:'Modul Mekanisme Kerja',psAcronym:'MKER',status:'Selesai',uic:'BaTii'}]};
 const dst={id:'current',akr:'DOA',kode:'B27-DOA',nama:'Digitalisasi Office Automation',psYear:2027,psStatus:'Draft',uic:'BaTii',
  psProjects:[{id:'existing',name:'Modul Kesehatan',psAcronym:'MKES',status:'Usulan'}]};
 const S={programs:[prev,dst],wbs:[],ui:{psSelectedYear:2027,psBank:{target:dst.id,mappingTab:'history',filterScopes:{mapping:{allProgramsSelected:false}}},psFlow:{prog:dst.id}}};
 const I={programs:()=>[dst],pickedProgram:()=>dst,state:()=>S.ui.psFlow};
 const window={MT_PROJECT_SELECTION:{internals:I},render:()=>{}};
 const scope=new Function('window','S','ME','save','toast','document',src+';return window.MT_PS_SCOPE;')(
  window,S,{role:'PMOK',email:'test@example.com'},()=>{},()=>{},{});
 return {S,prev,dst,scope};
}
test('codes follow the destination program code and editable project acronym',()=>{
 const {scope,dst}=setup();
 assert.equal(scope.codeFor({kode:'B27-CORE'},{name:'FRSW'}),'B27-CORE-FRSW');
 assert.equal(scope.codeFor(dst,{psAcronym:'MKER'}),'B27-DOA-MKER');
 assert.equal(scope.codeFor(dst,{psAcronym:'MKES'}),'B27-DOA-MKES');
 assert.equal(scope.codeFor(dst,{psAcronym:'JFKN'}),'B27-DOA-JFKN');
 assert.equal(scope.suggestedAcronym('Modul Mekanisme Kerja'),'MKER');
});
test('Riwayat Proyek displays projects by source year and source code',()=>{
 const {scope}=setup(),html=scope.render();
 assert.match(html,/Riwayat Proyek/);
 assert.match(html,/B26-DOA-MKER/);
 assert.match(html,/data-scope-history-target/);
 assert.match(html,/data-scope-history-bulk/);
});
test('copy from project history produces new year code but does not mutate source',()=>{
 const {scope,S,prev,dst}=setup();
 scope.change({target:{dataset:{scopeHistoryCheck:'previous::2026::Modul%20Mekanisme%20Kerja'},checked:true}});
 const fakeButton={dataset:{scopeHistoryAdd:''}};
 scope.click({target:{closest:sel=>sel.includes('data-scope-history-bulk')?fakeButton:null}});
 assert.equal(dst.psProjects.length,2);
 assert.equal(dst.psProjects[1].psCode,'B27-DOA-MKER');
 assert.equal(dst.psProjects[1].psOriginYear,2026);
 assert.equal(prev.psProjects.length,1);
 assert.equal(prev.psProjects[0].psAcronym,'MKER');
 assert.equal(S.ui.psBank.mappingTab,'results');
});
test('programs display as native accordions with direct open-program actions',()=>{
 const {scope,S}=setup();S.ui.psBank.filterScopes.mapping.allProgramsSelected=true;S.ui.psBank.mappingTab='mapping';
 const html=scope.render();
 assert.match(html,/<details class="psbank-accordion-program"/);
 assert.match(html,/data-scope-program-toggle/);
 assert.match(html,/data-scope-choose/);
});
test('results use page scroll and right-aligned summary outside blue banner',()=>{
 const {scope,S}=setup();S.ui.psBank.mappingTab='results';
 const html=scope.render();
 assert.match(html,/psbank-tab-summary/);
 assert.match(html,/psbank-results-open/);
 assert.doesNotMatch(html,/psbank-workspace-banner/);
 assert.match(css,/\.psbank-results-tablewrap[^}]*overflow-y:visible/s);
});
test('existing year 2027 projects persist codes when rendered',()=>{
 const {scope,dst}=setup();
 scope.render();
 assert.equal(dst.psProjects[0].psCode,'B27-DOA-MKES');
});
