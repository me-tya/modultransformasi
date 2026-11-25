'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');const vm=require('node:vm');const noop=()=>{};
function boot(){const S={ui:{psSelectedYear:2027},programs:[]};
 const ctx=vm.createContext({S,ME:{role:'SA',unit:'BaTii'},save:noop,render:noop,toast:noop,document:{addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[]},window:{}});
 ctx.window.MT_PS_SCOPE={normalizeProjectCodes:noop};
 vm.runInContext(readFileSync('project-selection-program-import.js','utf8'),ctx);vm.runInContext(readFileSync('rkmk-draft.js','utf8'),ctx);
 const I=ctx.window.MT_PS_IMPORT;I.apply(I.plan(JSON.parse(readFileSync('tests/fixtures-import-charter-is.json','utf8'))));return {S,R:ctx.window.MT_RKMK}}
test('Kerangka RKMK: diktum KEDUA memuat semua program, lampiran & milestone dari charter',()=>{
 const {S,R}=boot(),m=R.model();
 assert.equal(m.p1,2027);assert.equal(m.p2,2029);assert.equal(m.lamp.length,9);
 const kedua=m.diktum[1].find(x=>x&&x.items).items;assert.equal(kedua.length,9);
 assert.ok(m.lamp.every(x=>x.ruang.lb.length&&x.kegiatan.length));
 assert.equal(m.ms.reduce((n,g)=>n+g.rows.length,0),S.programs.reduce((n,p)=>n+p.psProgramCharter.ms.length,0));
 const x=R.docxXml(m);assert.match(x,/Bookman Old Style/);assert.match(x,/w:highlight w:val="yellow"/);assert.match(x,/KEPUTUSAN MENTERI KEUANGAN TENTANG PETA RENCANA/);
 assert.equal((x.match(/<w:tbl>/g)||[]).length,(x.match(/<\/w:tbl>/g)||[]).length);
});
test('Pilihan program membatasi lampiran',()=>{
 const {S,R}=boot();S.psRkmkDoc={2027:{title:'Judul Uji',programIds:[String(S.programs[0].id)],docs:[]}};
 const m=R.model();assert.equal(m.lamp.length,1);assert.equal(m.TTL,'JUDUL UJI');
});
