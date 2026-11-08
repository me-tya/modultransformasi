'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');

const html=readFileSync('index.html','utf8');
const bank=readFileSync('project-selection-program-bank.js','utf8');
const docs=readFileSync('project-selection-documents.js','utf8');
const mod=readFileSync('document-experience-v3.js','utf8');

test('Riwayat dan Daftar Program: Kode Program tepat sebelum Nama Program',()=>{
 assert.match(bank,/<th>Tahun<\/th><th>Kode Program<\/th><th>Nama Program<\/th><th>UIC<\/th>/g);
 assert.equal((bank.match(/<th>Tahun<\/th><th>Kode Program<\/th><th>Nama Program<\/th><th>UIC<\/th>/g)||[]).length,2);
 assert.match(bank, /<td><b>'\+E\(p\.kode\|\|p\.akr\|\|'—'\)\+'<\/b><\/td><td><b>'\+E\(p\.nama\)/);
 assert.match(bank, /<td><b>'\+E\(p\.kode\|\|p\.akr\)\+'<\/b><\/td><td><b>'\+E\(p\.nama\)/);
});
test('Dokumen Program dan Portofolio selalu gunakan engine formal Laporan Akhir Proyek',()=>{
 assert.match(docs,/formal:true,template:d\.template\|\|'activity',toc:!!d\.toc,header:'Dokumen Perencanaan Program/);
 assert.match(docs,/return \{lang:'id',formal:true,template:d\.template\|\|'activity',toc:true,fileName:/);
 assert.match(docs,/const blob=await assertOfficialWordTemplate\(await mtRptDocx\(model\)\)/);
 assert.match(docs,/await assertOfficialWordTemplate\(await mtRptDocx\(model\)\)/);
 assert.match(docs,/Do not fall back to the deprecated plain XML document template/);
 assert.doesNotMatch(docs,/const zip=new window\.JSZip\(\);let body=''/);
 assert.match(docs,/showActualDocumentPreview\(root,programReportModel\(p\),d\.format\)/);
});
test('Ukuran Word A4, margin dan lebar tabel persis sesuai bidang cetak',()=>{
 assert.match(html,/const W=10318,EMU=635/);
 assert.match(html,/<w:pgSz w:w="11906" w:h="16838"\/>/);
 assert.match(html,/<w:pgMar w:top="794" w:right="794" w:bottom="907" w:left="794"/);
 assert.match(html,/ws\[ws\.length-1\]\+=W-ws\.reduce\(/);
 assert.match(html,/const weightSum=weights\.reduce\(/);
 assert.match(html,/@page\{size:A4;margin:14mm 14mm 16mm\}/);
});
test('Pratinjau Word diskalakan mengikuti panel, bukan mengganti ukuran kertas',()=>{
 assert.match(docs,/const scale=Math\.min\(1,room\/width\)/);
 assert.match(docs,/target\.style\.zoom=scale\.toFixed\(3\)/);
 assert.match(docs,/node\.replaceChildren\(target\)/);
});
test('Editor charter dan daftar dokumen menjaga generator yang sama',()=>{
 assert.match(mod,/const D=makeDeck\(active\.draft,active\.kind\)/);
 assert.match(mod,/await dkPptx\(D\)/);
 assert.match(mod,/parseImportedCharters\(file\)/);
 assert.match(mod,/data-mt-bulk-download/);
});
test('Semua JavaScript eksternal terkait dokumen tetap valid',()=>{
 for(const [name,code] of [['program-bank',bank],['documents',docs],['document-experience',mod]]){
  assert.doesNotThrow(()=>new vm.Script(code,{filename:name+'.js'}));
 }
});
