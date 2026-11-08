'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {Script}=require('node:vm');
const html=readFileSync('index.html','utf8');
const docs=readFileSync('project-selection-documents.js','utf8');
const planning=readFileSync('charter-planning-report.js','utf8');

test('Six document cover labels are retained, with module-specific project titles',()=>{
 for(const label of [
  'DOKUMEN PORTOFOLIO','DOKUMEN PROGRAM',
  'DOKUMEN PERENCANAAN PROYEK','DOKUMEN PELAKSANAAN PROYEK',
  'DOKUMEN MONITORING DAN EVALUASI PROYEK','DOKUMEN PENUTUPAN PROYEK'
 ])assert.ok((html+docs+planning).includes(label),label);
 assert.match(html,/P1\?\.n\|\|c\.spec\.j\|\|c\.name/);
 assert.match(planning,/knownModules\.length===1\?knownModules\[0\]\.name/);
 assert.match(docs,/title:name/);
});

test('Document covers omit draft labels and redundant section lists but preserve metadata',()=>{
 assert.doesNotMatch(docs,/cover:\{kicker:[^\n]*DRAFT/i);
 assert.doesNotMatch(planning,/cover:\{kicker:[^\n]*DRAFT/i);
 assert.match(docs,/scope:\[\],meta:\[\['Kode Program'/);
 assert.match(planning,/\['Program Induk',String\(p\.nama/);
 assert.match(html,/\['Program Induk',one\?/);
 assert.match(html,/\['UIC Utama',String\(P1\?/);
});

test('QR is visibly a placeholder for official digital signature in HTML DOCX PDF',()=>{
 assert.match(html,/aria-label="Placeholder QR Digital Signature"/);
 assert.match(html,/mtDxRuns\('QR TTE'/);
 assert.match(docs,/pdf\.text\('QR TTE'/);
 assert.match(html,/Ditandatangani secara elektronik/);
 assert.match(docs,/Ditandatangani secara elektronik/);
 assert.match(html,/inc\.toc=1;inc\.tte=1;return inc/);
 assert.match(docs,/cover:true,toc:true,sign:true/);
});

test('Final report continues to use original iframe with page scrolling',()=>{
 assert.match(docs,/\/\/ installFinalReportPreview\(\);/);
 assert.doesNotMatch(docs,/^installFinalReportPreview\(\);/m);
 assert.match(html,/<iframe id="rpt-if" title="Pratinjau laporan"/);
 assert.match(html,/\.rpt2-frame iframe\{flex:1;width:100%;border:0;display:block\}/);
});

test('The document JavaScript remains syntactically valid',()=>{
 for(const [filename,source] of [['project-selection-documents.js',docs],['charter-planning-report.js',planning]])
  assert.doesNotThrow(()=>new Script(source,{filename}));
});
