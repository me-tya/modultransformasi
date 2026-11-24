'use strict';
/* 2026-11-24 — Standar kode kertas kerja CM: {modul}.{D|R|I|S|K|P}{nn}, tidak dipakai ulang. */
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
function load(role){
 const S={ui:{tahun:2026},modMeta:{},risks:[],
  sub:[{id:'a',modul:'OA-124',rr:2},{id:'b',modul:'OA-124'},{id:'c',modul:'CORE-9'}],
  ind:[{id:'i',modul:'OA-124'}],
  sh:[{id:'h1',modul:'OA-124',kom:true,pel:true},{id:'h2',modul:'OA-124',kom:true},{id:'h3',modul:'OA-124'}]};
 const base=['P','Proj','Modul','Change Management'];
 const w=(k,t,tail)=>({k,p:base.concat(tail),f:'2026-10-01'});
 const mod={kode:'OA-124',adp:w('OA-124','ADP',['Analisis Dampak Perubahan']),st:{Perencanaan:[w('OA-125','',['Analisis Pemangku Kepentingan']),w('OA-126','',['Analisis Kebutuhan Komunikasi'])],Implementasi:[w('OA-128','',['Implementasi','Implementasi Strategi Komunikasi'])]}};
 const ctx={window:{},S,ME:{role},RISK:[['rr','Resistensi'],['ro','Operasional']],modOf:k=>k==='OA-124'?mod:null,yrOf:x=>+String(x.f).slice(0,4),deliv:x=>x.p[x.p.length-1],short:(s)=>s};
 vm.createContext(ctx);vm.runInContext(R('mt-cm-codes.js'),ctx);return {C:ctx.window.MTCC,S};
}
test('kode dibuat per modul, berurutan, unik antarmodul',()=>{
 const {C,S}=load('CMOK');assert.equal(C.ensure(),true);
 assert.deepEqual(S.sub.map(x=>x.cc),['D01','D02','D01']);
 assert.equal(C.full('OA-124','D02'),'OA-124.D02');
 assert.deepEqual(S.sh.map(x=>[x.cc,x.ck||'',x.cp||'']),[['S01','K01','P01'],['S02','K02',''],['S03','','']]);
 assert.equal(S.ind[0].cc,'I01');
 assert.equal(C.rCode('OA-124','a:rr'),'R01');
 assert.equal(C.ensure(),false,'tidak ada perubahan kedua kali');
});
test('nomor tidak dipakai ulang setelah baris dihapus; kode ganda diberi nomor baru',()=>{
 const {C,S}=load('CMOK');C.ensure();
 S.sub=S.sub.filter(x=>x.id!=='b');S.sub.push({id:'d',modul:'OA-124'});C.ensure();
 assert.equal(S.sub.find(x=>x.id==='d').cc,'D03');
 S.sh.push(Object.assign({},S.sh[0],{id:'copy'}));C.ensure();
 const cp=S.sh.find(x=>x.id==='copy');assert.equal(cp.cc,'S04');assert.equal(cp.ck,'K03');assert.equal(cp.cp,'P02');
});
test('peran tanpa hak tulis tidak mengubah data',()=>{
 const {C,S}=load('PMOU');assert.equal(C.ensure(),false);assert.equal(S.sub[0].cc,undefined);
 assert.match(C.chip('OA-124',''),/—/);
});
test('kode WBS rujukan mengikuti tahap',()=>{
 const {C}=load('CMOK');
 assert.equal(C.wbsFor('OA-124','ADP').k,'OA-124');assert.equal(C.wbsFor('OA-124','S').k,'OA-125');
 assert.equal(C.wbsFor('OA-124','K').k,'OA-126');assert.equal(C.wbsFor('OA-124','P'),null);
 assert.equal(C.wbsFor('OA-124','KI').k,'OA-128');
 assert.match(C.wbsCell('OA-124','P'),/belum ada item WBS/);
 assert.equal(C.started('Terlaksana'),true);assert.equal(C.started('Terjadwal'),false);
});
