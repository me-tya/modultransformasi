'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const src=readFileSync('project-selection-program-import.js','utf8');
const aoa=JSON.parse(readFileSync('tests/fixtures-import-charter-is.json','utf8'));
function boot(role='SA',unit='BaTii',programs=[]){
 const S={ui:{psSelectedYear:2027},programs};
 const noop=()=>{};
 const ctx=vm.createContext({S,ME:{role,unit,email:'t@kemenkeu.go.id'},save:noop,render:noop,toast:noop,
  document:{addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[]},window:{}});
 ctx.window.MT_PS_SCOPE={normalizeProjectCodes:p=>p.psProjects.forEach((x,i)=>{x.psCode='X-'+(i+1)})};
 vm.runInContext(src,ctx);return {S,I:ctx.window.MT_PS_IMPORT};
}
test('Konversi Tabulasi Charter IS terbaca: 9 program, 20 proyek, tanpa galat',()=>{
 const {I}=boot(),pl=I.plan(aoa);
 assert.equal(pl.errors.length,0);assert.equal(pl.warn.length,0);
 assert.equal(pl.items.length,9);
 assert.ok(pl.items.every(x=>x.action==='Baru'));
 assert.equal(pl.items.reduce((n,x)=>n+x.projects.length,0),20);
});
test('Terapkan: program Draft + charter + proyek terbentuk',()=>{
 const {S,I}=boot(),pl=I.plan(aoa),r=I.apply(pl,{file:'x.xlsx'});
 assert.equal(r.created,9);assert.equal(r.projects,20);
 const p=S.programs.find(p=>p.nama==='Rebranding Kemenkeu Terpercaya');
 assert.equal(p.psYear,2027);assert.equal(p.psStatus,'Draft');assert.equal(p.uic,'Setjen');
 assert.equal(p.psProjects.length,6);assert.equal(p.sponsor,'Menteri Keuangan');
 const c=p.psProgramCharter;
 assert.equal(c.st,'Draft');assert.equal(c.p1,2027);assert.equal(c.p2,2029);
 assert.ok(c.ms.length>=10&&c.ms.every(m=>m.y&&m.t));
 assert.ok(c.kp.length>=6&&c.kp.every(k=>k.m&&Array.isArray(k.k)));
 assert.ok(c.lb.length&&!c.lb[0].startsWith('•'));
 assert.equal(p.psImport.sourceIS,'2.1, 2.2, 2.3, 2.4, 2.5, 2.6');
});
test('Impor ulang memperbarui, tidak menggandakan; charter disahkan tidak ditimpa',()=>{
 const {S,I}=boot();I.apply(I.plan(aoa));
 const p=S.programs[0];p.psProgramCharter.st='Disahkan';p.psProgramCharter.tujuan='TETAP';
 const pl=I.plan(aoa);assert.ok(pl.items.every(x=>x.action==='Perbarui'));
 I.apply(pl);assert.equal(S.programs.length,9);
 assert.equal(p.psProgramCharter.tujuan,'TETAP');
 assert.equal(S.programs.reduce((n,x)=>n+x.psProjects.length,0),20);
});
test('Program ditetapkan dilewati; PMO Unit dibatasi unitnya',()=>{
 let m=boot('SA','BaTii',[{id:'a',nama:'HRIS Terintegrasi Hire-to-Retire',psYear:2027,psStatus:'Ditetapkan',psProjects:[]}]);
 assert.equal(m.I.plan(aoa).items.find(x=>x.src.nama.startsWith('HRIS')).action,'Dilewati');
 m=boot('PMOU','BaTii');const pl=m.I.plan(aoa);
 assert.equal(pl.items.filter(x=>x.action==='Baru').length,4);
 assert.ok(pl.items.filter(x=>x.action==='Galat').every(x=>x.src.uic!=='BaTii'));
});
test('Sheet Program hilang / kolom wajib hilang memberi galat',()=>{
 const {I}=boot();
 assert.ok(I.plan({Lain:[['a']]}).errors.length);
 assert.ok(I.plan({Program:[['Nama Program'],['x']]}).errors[0].includes('tahun'));
});
