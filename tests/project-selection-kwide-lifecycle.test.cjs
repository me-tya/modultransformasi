'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const wf=read('project-selection-workflow-2027.js');
const bank=read('project-selection-program-bank.js');
const flow=read('project-selection-flow.js');
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const sample=()=>[
 {id:'new',psYear:2027,akr:'N27',kode:'B27-N',nama:'Program Baru',psStatus:'Draft',psDraft:true},
 {id:'legacy',psYear:2027,akr:'L27',kode:'B27-L',nama:'Program Legacy',psStatus:'Draft',psDraft:true,psCarry:{sourceYear:2026}}
];
const setup=()=>{
 const p=sample(),S={ui:{psSelectedYear:2027,ps27WideQuarter:1},programs:p,psWideTargets:{},wbs:[]},ME={role:'PMOK',email:'a@example.test'};
 const wideSrc=wf.slice(wf.indexOf('const quarterEnd='),wf.indexOf('const RKMK_FIELDS='));
 const wide=new Function('S','yr','list','E','ME','can','I',wideSrc+';return {widePanel,wideState,wideRow,wideSummary};')(S,()=>2027,()=>S.programs,esc,ME,()=>true,{});
 const lifeSrc=bank.slice(bank.indexOf('function labelStatus('),bank.indexOf('function programAction('));
 const life=new Function('S','ME','year','E',lifeSrc+';return {labelStatus,canDelete,isConcept};')(S,ME,()=>2027,esc);
 return {S,p,wide,life};
};
test('Penetapan Program is one submenu that includes project approval',()=>{
 const match=wf.match(/const TABS=\[([^\n]+)/);
 assert.ok(match);
 assert.match(match[1],/penetapan-program','Penetapan Program/);
 assert.doesNotMatch(match[1],/\['penetapan','Penetapan Proyek'\]/);
 assert.match(wf,/else if\(u\.tab==='penetapan-program'\)h\+=widePanel\(\)\+penetapan\(p\)/);
 assert.match(wf,/data-ps27-approval-program/);
 assert.match(wf,/data-pswf="finalize"/);
 assert.match(wf,/Tetapkan Program beserta /);
 assert.match(wf,/stage==='penetapan'\?'penetapan-program'/);
});
test('K-Wide form uses the source sheet quarterly output columns without importing 2026 actuals',()=>{
 const {wide}=setup(),html=wide.widePanel();
 for(const label of ['Target Output TW 1','Tanggal Cut-off','Jumlah Target Output','Jumlah Realisasi Output','Bukti Dukung'])assert.ok(html.includes(label),label);
 assert.equal((html.match(/data-wide-row=/g)||[]).length,2);
 assert.equal(wide.wideState().rows.length,0);
});
test('archived program keeps recorded TW1 output but not a new TW2 row',()=>{
 const {S,p,wide}=setup();
 wide.wideState().rows.push({programId:'legacy',quarter:1,targets:'1. Output',targetCount:'1',actualCount:'1'});
 p[1].psListStatus='Arsip';p[1].arsip=true;
 assert.match(wide.widePanel(),/Arsip \(histori\)/);
 S.ui.ps27WideQuarter=2;
 assert.doesNotMatch(wide.widePanel(),/Program Legacy/);
 assert.equal(wide.wideSummary(wide.wideState(),p)[0].pct,100);
});
test('concept deletion is blocked for established, archived and contract-recorded programs',()=>{
 const {S,p,life}=setup();
 assert.equal(life.canDelete(p[0]),true);
 p[0].psStatus='Ditetapkan';p[0].psDraft=false;assert.equal(life.canDelete(p[0]),false);
 p[0].psStatus='Draft';p[0].psDraft=true;p[0].psKwideRecordedAt='2027-03-31T00:00:00Z';
 assert.equal(life.canDelete(p[0]),false);
 assert.equal(life.canDelete(p[1]),true);
 p[1].psListStatus='Arsip';p[1].arsip=true;assert.equal(life.canDelete(p[1]),false);
 S.psWideTargets[2027]={contract:{status:'Ditetapkan',programIds:['legacy']}};
 p[1].psListStatus='Legacy';p[1].arsip=false;assert.equal(life.canDelete(p[1]),false);
});
test('official PMO project closing allows archive without deleting historical WBS',()=>{
 const {S,p}=setup();
 const id='new',name='Modul TKD';
 p[0].psProjects=[{id:'proj1',name,status:'Berjalan'}];
 S.wbs=[{k:'WBS-TKD',prog:'N27',arsip:false}];
 const from=bank.slice(bank.indexOf('function labelStatus('),bank.indexOf('function programAction('));
 const life=new Function('S','ME','year','E',from+';return {archiveReadiness};')(S,{role:'PMOK'},()=>2027,esc);
 assert.equal(life.archiveReadiness(p[0]).blocked,true);
 p[0].closing={'N27|Modul%20TKD|':{st:'Diajukan'}};
 assert.equal(life.archiveReadiness(p[0]).blocked,true);
 p[0].closing['N27|Modul%20TKD|'].st='Ditutup';
 assert.equal(life.archiveReadiness(p[0]).blocked,false);
 assert.equal(S.wbs.length,1);
});
test('program finalization is gated on an established K-Wide contract',()=>{
 assert.match(flow,/contract\?\.status!=='Ditetapkan'/);
 assert.match(flow,/contract\.programIds\?\.includes\(String\(p.id\)\)/);
});
test('new K-Wide revision preserves a snapshot of contract and output rows',()=>{
 assert.match(wf,/d\.history\.push\(\{revision:/);
 assert.match(wf,/contract:clone\(d\.contract\),rows:clone\(d\.rows\)/);
});
