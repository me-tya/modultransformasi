'use strict';
/* Impor "Tabulasi Charter IS" → Charter Program, dan unduh plain RKMK (mt-charter-is.js). */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const src=readFileSync('mt-charter-is.js','utf8');
const html=readFileSync('index.html','utf8');
const wf=readFileSync('project-selection-workflow-2027.js','utf8');

const HEAD=['Kode','Klaster','Subisu','Proposisi LOM','Tanggapan','Masukan','Resume 1','Resume 2','Resume 3','Resume 4','Milestone 2027','Milestone 2028','Milestone 2029','Lead/UIC',
 'Program Transformasi','Tujuan Program','Latar Belakang','Terobosan','Output','Outcome','Key Milestones\n(2027–2029)','Risiko','Pendukung Kesuksesan','Initiative Champion','Initiative Owner','Milestones (Level 4) dan Kriteria Penyelesaian','Penanggung Jawab'];
const ROW=['3.3','3. Digitalisasi','HRIS','','','','','','','','','','','BaTii (lead); BPPK, DJKN',
 'HRIS Terintegrasi Hire-to-Retire','Satu HRIS untuk seluruh pegawai.','• Data SDM tersebar.\n• Proses manual.','• Satu data pegawai.\n• Layanan mandiri.','• Modul hire-to-retire.','• Keputusan SDM berbasis data.',
 '2027:\n• Desain HRIS ditetapkan\n• Pilot modul kinerja\n\n2028:\n• Rollout nasional','• Resistensi pengguna.','• Komitmen pimpinan.','Menteri Keuangan','Kepala Badan Teknologi, Informasi, dan Intelijen Keuangan',
 '1. Desain HRIS — Tersedianya desain HRIS yang ditetapkan.\n2. Pilot modul kinerja — Terlaksananya pilot di dua unit.','Utama: BaTii | Pendukung: BPPK, DJKN'];

function boot(role='SA',unit='BaTii',programs=[]){
 const S={ui:{psSelectedYear:2027},programs,wbs:[],charters:[]};
 const ctx=vm.createContext({S,ME:{role,unit,email:'u@kemenkeu.go.id'},ACT:{},window:{},console});
 vm.runInContext(src,ctx,{filename:'mt-charter-is.js'});
 return {S,ctx,X:ctx.window.MT_CHARTER_IS};
}

test('Aset dimuat di index.html dan tombol tersedia di Charter Program & Draft RKMK',()=>{
 assert.match(html,/mt-charter-is\.js\?v=/);
 assert.match(html,/mt-charter-is\.css\?v=/);
 assert.ok(html.indexOf('mt-charter-is.js')<html.indexOf('project-selection-workflow-2027.js'),'modul dimuat sebelum workflow');
 assert.match(wf,/data-act="mtCisImport"/);
 assert.match(wf,/data-act="mtCisPlain"/);
 const {ctx}=boot();
 assert.equal(typeof ctx.ACT.mtCisImport,'function');
 assert.equal(typeof ctx.ACT.mtCisPlain,'function');
});

test('Kolom dikenali dari judul dan setiap isian charter terpetakan',()=>{
 const {X}=boot();
 const r=X.fromAoa([['TABULASI'],HEAD,ROW,['','','','','','','','','','','','','','','']]);
 assert.equal(r.rows.length,1,'baris tanpa Program Transformasi diabaikan');
 assert.deepEqual([...r.missing],[]);
 const rec=r.rows[0];
 assert.equal(rec.kode,'3.3');
 const p={id:'p9',akr:'HRIS',nama:'HRIS',psYear:2027};
 const {charter:c}=X.toCharter(rec,p,2027,null,{file:'LOM.xlsx',sheet:'Tabulasi Charter IS'});
 assert.equal(c.judul,'HRIS Terintegrasi Hire-to-Retire');
 assert.equal(c.tujuan,'Satu HRIS untuk seluruh pegawai.');
 assert.deepEqual([...c.lb],['Data SDM tersebar.','Proses manual.']);
 assert.equal(c.tb,'Satu data pegawai.\nLayanan mandiri.');
 assert.deepEqual([...c.out],['Modul hire-to-retire.']);
 assert.equal(c.p1,2027);assert.equal(c.p2,2028);
 assert.deepEqual([...c.ms.map(m=>m.y+':'+m.t)],['2027:Desain HRIS ditetapkan','2027:Pilot modul kinerja','2028:Rollout nasional']);
 assert.equal(c.ch,'Menteri Keuangan');
 assert.deepEqual([...c.ow],['Kepala Badan Teknologi, Informasi, dan Intelijen Keuangan']);
 assert.deepEqual(JSON.parse(JSON.stringify(c.kp)),[{m:'Desain HRIS',k:['Tersedianya desain HRIS yang ditetapkan.']},{m:'Pilot modul kinerja',k:['Terlaksananya pilot di dua unit.']}]);
 assert.deepEqual(JSON.parse(JSON.stringify(c.rk.map(x=>[x.t,x.s,x.e,x.u,x.pd]))),[['Desain HRIS','','','BaTii','BPPK, DJKN'],['Pilot modul kinerja','','','BaTii','BPPK, DJKN']],'bulan tidak ditebak');
 assert.equal(c.st,'Draft');
 assert.equal(c.sumberImpor.kode,'3.3');
 assert.equal(c.sumberImpor.file,'LOM.xlsx');
});

test('Rencana Kerja yang sudah berisi dan identitas charter lama dipertahankan',()=>{
 const {X}=boot();const rec=X.fromAoa([HEAD,ROW]).rows[0];
 const base={id:'program-charter-p1',ver:3,st:'Draft',asis:{pb:'As-is lama'},rk:[{t:'Rollout',s:'2027-02',e:'2027-09',u:'BaTii',pd:''}]};
 const {charter:c,keepRk}=X.toCharter(rec,{id:'p1',akr:'HRIS'},2027,base,{});
 assert.equal(keepRk,true);
 assert.equal(c.rk[0].s,'2027-02');
 assert.equal(c.ver,3);assert.equal(c.id,'program-charter-p1');assert.equal(c.asis.pb,'As-is lama');
 assert.equal(base.rk.length,1,'objek sumber tidak dimutasi');
});

test('Pencocokan otomatis: nama sama, nama pendek terkandung, dan satu program hanya sekali',()=>{
 const progs=[{id:'a',nama:'HRIS Terintegrasi Hire to Retire',psYear:2027},{id:'b',nama:'Spending Better',psYear:2027},{id:'c',nama:'Office Automation',psYear:2027}];
 const {X}=boot('SA','BaTii',progs);
 const rows=[{judul:'HRIS Terintegrasi Hire-to-Retire'},{judul:'APBN dan APBD sebagai Satu Kesatuan (Spending Better)'},{judul:'HRIS Terintegrasi Hire-to-Retire (tahap 2)'},{judul:'Keamanan Siber'}];
 const m=[...X.autoMatch(rows,progs).map(x=>x&&x.id)];
 assert.deepEqual(m,['a','b',null,null]);
});

test('Hak akses: PMO Unit hanya unitnya; program ditetapkan tidak bisa ditimpa',()=>{
 const {X}=boot('PMOU','DJP');
 assert.equal(X.canImport(),true);
 const {X:Y}=boot('CMOU','DJP');
 assert.equal(Y.canImport(),false);
});

test('Program baru dari baris IS berstatus Draft dengan UIC dari Penanggung Jawab',()=>{
 const {X}=boot();const rec=X.fromAoa([HEAD,ROW]).rows[0];
 const p=X.newProgram(rec,2027);
 assert.equal(p.psStatus,'Draft');assert.equal(p.psListStatus,'Baru');assert.equal(p.psYear,2027);
 assert.equal(p.uic,'BaTii');assert.equal(p.kodeResmi,'','kode resmi tidak ditebak');
 assert.equal(p.nama,'HRIS Terintegrasi Hire-to-Retire');
});

test('Model plain: tabel Charter, Kriteria, Rencana Kerja; Word lanskap dengan sel gabungan',()=>{
 const {X}=boot();const rec=X.fromAoa([HEAD,ROW]).rows[0];
 const p={id:'p1',akr:'HRIS',nama:'HRIS',psYear:2027};
 const {charter:c}=X.toCharter(rec,p,2027,null,{});
 c.rk[0].s='2027-03';c.rk[0].e='2027-05';
 const m=X.model(p,c);
 assert.equal(m.periode,'2027 s.d. 2028');
 const T=X.tables(m);
 assert.deepEqual([...T.map(t=>t.title.trim())],['Charter Program Transformasi:','Kriteria Penyelesaian Program Transformasi:','Rencana Kerja Program Transformasi:']);
 const rk=T[2];assert.equal(rk.gantt,12,'satu tahun = 12 kolom bulan');
 const filled=rk.rows[2].filter(x=>x&&x.fill==='404040').length;assert.equal(filled,3,'Maret–Mei terisi');
 const out=X.html([m]);
 assert.match(out,/Tujuan Program/);assert.match(out,/Initiative Champion/);assert.match(out,/rowspan="3"/);
 const xml=X.docxBody([m]);
 assert.match(xml,/w:orient="landscape"/);
 assert.match(xml,/<w:vMerge w:val="restart"\/>/);
 assert.match(xml,/<w:gridSpan w:val="3"\/>/);
 assert.doesNotMatch(xml,/[<]script/);
 /* jumlah sel tiap baris = jumlah kolom grid (dengan gridSpan) */
 for(const tbl of xml.split('<w:tbl>').slice(1)){
  const cols=(tbl.match(/<w:gridCol /g)||[]).length;
  for(const tr of tbl.split('<w:tr>').slice(1)){
   const cells=tr.split('<w:tc>').slice(1).reduce((a,tc)=>a+(+((tc.match(/<w:gridSpan w:val="(\d+)"/)||[])[1]||1)),0);
   assert.equal(cells,cols);
  }
 }
});

test('Lebih dari dua tahun memakai kolom triwulan',()=>{
 const {X}=boot();
 const m=X.model({id:'p',akr:'P',nama:'P'},{p1:2027,p2:2029,rk:[{t:'A',s:'2027-01',e:'2029-12'}]});
 assert.equal(m.gantt.quarter,true);
 assert.equal(X.tables(m)[2].gantt,12);
});
