'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');const vm=require('node:vm');
const noop=()=>{};
function boot(){const S={ui:{psSelectedYear:2027},programs:[]};
 const ctx=vm.createContext({S,ME:{role:'SA',unit:'BaTii',email:'t'},save:noop,render:noop,toast:noop,document:{addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[]},window:{}});
 ctx.window.MT_PS_SCOPE={normalizeProjectCodes:noop};
 vm.runInContext(readFileSync('project-selection-program-import.js','utf8'),ctx);
 vm.runInContext(readFileSync('charter-export.js','utf8'),ctx);
 const I=ctx.window.MT_PS_IMPORT;I.apply(I.plan(JSON.parse(readFileSync('tests/fixtures-import-charter-is.json','utf8'))));
 return {S,X:ctx.window.MT_CHX};}
test('Model memuat seluruh isian charter tanpa pemotongan',()=>{
 const {S,X}=boot(),p=S.programs.find(p=>p.nama==='Rebranding Kemenkeu Terpercaya'),c=p.psProgramCharter,m=X.model(c,p);
 assert.equal(m.sections.map(s=>s.key).join(),'charter,kp,rk');
 const rows=m.sections[0].blocks.filter(b=>b.t==='row');
 assert.equal(rows[0].cols[0][0].length,c.lb.length);assert.equal(rows[0].cols[2][0].length,c.out.length);
 const ms=rows[2].cols[0][0].filter(x=>!x.h);assert.equal(ms.length,c.ms.length);
 assert.equal(m.sections[1].blocks.filter(b=>b.t==='row').length,c.kp.length);
 const rk=m.sections[2].blocks.filter(b=>b.t==='rk');assert.equal(rk.length,c.ms.length);
 assert.ok(rk.every(r=>r.on.length===12&&r.on.filter(Boolean).length===4));
 assert.ok(!JSON.stringify(m).includes('…'));
});
test('Word XML valid dan memakai font 9 pt di dua mode',()=>{
 const {S,X}=boot(),p=S.programs[0];
 for(const mode of ['color','mono']){const m=X.model(p.psProgramCharter,p);m.mode=mode;const x=X.docxXml(m);
  assert.match(x,/w:orient="landscape"/);assert.match(x,/<w:sz w:val="18"\/>/);
  assert.equal((x.match(/<w:tbl>/g)||[]).length,3);assert.equal((x.match(/<w:tbl>/g)||[]).length,(x.match(/<\/w:tbl>/g)||[]).length);
  assert.ok(mode==='mono'?x.includes('Bookman Old Style'):x.includes('w:fill="1F2A44"'));}
});
test('Bar ekspor satu baris: chip mode + Export to dengan 4 format (dan grup Semua program)',()=>{
 const {X}=boot(),h=X.barFor({id:'a'},{year:2027,n:9});
 for(const k of ['color','mono'])assert.ok(h.includes('data-chx-mode="'+k+'"'));
 assert.equal((h.match(/data-chx-dd/g)||[]).length,1);assert.match(h,/Export to/);
 for(const k of ['pdf','docx','jpg','pptx'])assert.equal((h.match(new RegExp('data-chx-x="'+k+'"','g'))||[]).length,2);
 assert.match(h,/Semua program \(9\)/);assert.ok(!X.barFor({id:'a'}).includes('data-chx-scope'));
});
test('Unduh semua: satu berkas Word berisi seluruh program tahun aktif',()=>{
 const {S,X}=boot(),b=X.bundle(S.programs.map(p=>({c:p.psProgramCharter,p})),'Semua');b.mode='mono';
 const x=X.docxXml(b);assert.equal(b.all.length,9);assert.equal((x.match(/<w:tbl>/g)||[]).length,27);
 for(const p of S.programs)assert.ok(x.includes(p.nama.replace(/&/g,'&amp;')));
});
