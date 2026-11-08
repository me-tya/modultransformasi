'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {Script}=require('node:vm');
const index=readFileSync('index.html','utf8');
const selection=readFileSync('project-selection-program-bank.js','utf8');
const workflow=readFileSync('project-selection-workflow-2027.js','utf8');
const style=readFileSync('ui-tabs-unified.css','utf8');
const docs=readFileSync('project-selection-documents.js','utf8');
const experience=readFileSync('document-experience-v3.js','utf8');
const guide=readFileSync('ux-help-cheatsheet.js','utf8');

test('Filter icon Project Selection exactly matches PM SVG path, dimensions, color treatment',()=>{
 const path=/M3 5h18l-7 8v6l-4 2v-8z/;
 assert.match(index,path);assert.match(workflow,path);
 assert.match(workflow,/stroke-width="2\.2"/);
 assert.match(style,/\.ps27-filter-ic\{[\s\S]*?width:32px!important/);
});
test('Daftar Program uses click-row and map/edit/upload before conditional rightmost download',()=>{
 assert.match(selection,/Klik baris untuk melihat Dokumen Program/);
 assert.doesNotMatch(selection,/programAction\('document',p\.id/);
 assert.match(selection,/programAction\('map',p\.id[^\n]*programAction\('edit',p\.id[^\n]*programAction\('upload',p\.id/);
 assert.match(experience,/filter\(x=>x\.status==='uploaded'\|\|x\.status==='signed'\)/);
 assert.match(experience,/b\.dataset\.mtDownloadList='1'/);
 assert.match(experience,/b\.className='psbank-action-icon psbank-program-action download'/);
 assert.match(experience,/actions\.appendChild\(b\)/);
});
test('Project Planning table has Aksi header and two accessible icon actions',()=>{
 assert.match(index,/>AKSI<\/th>/);
 assert.match(index,/Lihat Detail Dokumen Perencanaan Proyek/);
 assert.match(index,/Ubah Detail Dokumen Perencanaan Proyek/);
 assert.match(index,/function pDocsActions\(/);
 assert.match(index,/data-act="chopen"/);
 assert.match(experience,/onAction\(\{dataset:\{mtDoc:'revision'\}\}\)/);
 assert.match(style,/\.pdocs-action-icon\.edit/);
});
test('Report number appears first in shared cover identity for HTML, Word and PPTX and PDF',()=>{
 assert.match(index,/function mtRptOrderedMeta\(/);
 assert.match(index,/\['Nomor Dokumen','Belum ditetapkan'\]/);
 assert.ok((index.match(/c\.meta=mtRptOrderedMeta\(c\.meta\)/g)||[]).length>=3);
 assert.match(docs,/mtRptOrderedMeta\(model\.cover\.meta\)/);
});
test('Help and map contain working tab shortcuts and clear upload guidance',()=>{
 assert.match(workflow,/data-ps27-jump/);
 assert.match(workflow,/usulan:detail:docs/);
 assert.match(guide,/menuPMDeep/);
 assert.match(guide,/project-selection\|usulan:detail/);
 assert.match(guide,/pmo-perencanaan\|rk/);
 assert.match(guide,/MT_PS_WORKFLOW\?\.navigate\(sub\)/);
 assert.match(guide,/MT_DOC_EXPERIENCE\?\.openProjectTab\(sub\)/);
 assert.match(experience,/openProjectTab:function\(tab\)/);
});
test('Program uploaded file preview and selected ZIP download are accessible',()=>{
 assert.match(selection,/data-doc-proof-preview/);
 assert.match(selection,/data-doc-proof-open/);
 assert.match(experience,/async function showProofPreview\(/);
 assert.match(experience,/window\.docx\.renderAsync/);
 assert.match(experience,/JSZip\.loadAsync\(file\)/);
 assert.match(experience,/data-mt-bulk-download/);
 assert.match(experience,/URL\.revokeObjectURL\(fileUrl\)/);
});
test('Changed external JavaScript remains parsable',()=>{
 for(const [name,src] of [
  ['selection',selection],['workflow',workflow],['documents',docs],
  ['experience',experience],['help',guide]
 ])assert.doesNotThrow(()=>new Script(src,{filename:name+'.js'}));
});
