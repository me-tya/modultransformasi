'use strict';
/* 2026-11-25 — Monev (deviasi otomatis, status ambang), Evaluasi Pasca (titik), Penutupan (syarat). */
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function load(S){const ctx={window:{},S,TODAY:'2026-11-24',CHIP:{},ACT:{},FORMEX:{},HELP:{},GUIDE:{},RISK:[['rr','Resistensi']],esc:x=>String(x),num:v=>{const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n},fmtD:d=>d||'—',capOf:i=>i.real/i.tg*100,console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','mt-cm-monev.js'),'utf8'),ctx);return ctx.window.MTMV}
const base=()=>({ui:{tahun:2026,sub:{}},pantau:[],tr:[],ind:[],sub:[],sh:[],impl:{},modMeta:{},adopsi:[]});
test('waktu rencana dibaca dari teks bebas',()=>{const M=load(base());
 assert.deepEqual({...M.planYM('Okt 2026')},{y:2026,m:10});assert.deepEqual({...M.planYM('April, Juli')},{y:2026,m:4});
 assert.deepEqual({...M.planYM('2026-09-15')},{y:2026,m:9});assert.equal(M.planYM('Sepanjang Tahun').rutin,true);assert.equal(M.planYM(''),null)});
test('deviasi otomatis',()=>{const M=load(base());
 assert.equal(M.devOf({rencana:'Okt 2026',status:'Terlaksana',tgl:'2026-10-14'}).d,'Sesuai');
 assert.equal(M.devOf({rencana:'Sep 2026',status:'Terlaksana',tgl:'2026-10-20'}).d,'Terlambat');
 assert.equal(M.devOf({rencana:'Des 2026',status:'Terlaksana',tgl:'2026-11-02'}).d,'Lebih cepat');
 assert.equal(M.devOf({rencana:'Sep 2026',status:'Terjadwal'}).d,'Belum terlaksana');
 assert.equal(M.devOf({rencana:'Des 2026',status:'Terjadwal'}).d,'Belum jatuh tempo');
 assert.equal(M.devOf({rencana:'Sep 2026',status:'Terjadwal',tglBaru:'2026-12-10'}).d,'Belum jatuh tempo','jadwal baru dipakai');
 assert.equal(M.devOf({rencana:'',status:'Batal'}).d,'Batal')});
test('status efektivitas dari ambang',()=>{const M=load(base());
 assert.equal(M.stAuto({hasil:86,tgt:80}),'On Track');assert.equal(M.stAuto({hasil:70,tgt:80}),'Required Action');
 assert.equal(M.stAuto({hasil:64,tgt:80}),'Off Track');assert.equal(M.stAuto({hasil:64,tgt:80,ambRA:60}),'Required Action');
 assert.equal(M.stAuto({hasil:'',tgt:80,stM:'On Track'}),'On Track')});
test('titik evaluasi mengikuti masa',()=>{const M=load(base());
 assert.deepEqual([...M.titikOf({goLive:'2026-08-05',akhir:'2026-11-05',titik:'Bulanan'})],['2026-09-05','2026-10-05','2026-11-05'])});
test('syarat penutupan',()=>{const S=base();S.ind=[{modul:'A',tg:80,real:85}];S.tr=[{modul:'A',st:'Disepakati'}];
 S.pantau=[{jenisCatatan:'EVAL-CM',modul:'A',tgl:'2026-11-05',kirim:true,kes:'Siap pengalihan'},{jenisCatatan:'ISU-PASCA',modul:'A',st:'Dialihkan'}];
 const M=load(S);assert.equal(M.syarat('A').ok,true);
 S.pantau.push({jenisCatatan:'EVAL-KEG',modul:'A',tl:'Coaching',stTl:'Proses'});assert.equal(M.syarat('A').ok,false,'TL terbuka menahan penutupan');
 S.pantau.pop();S.ind[0].real=70;assert.equal(M.syarat('A').L[0].ok,false)});
