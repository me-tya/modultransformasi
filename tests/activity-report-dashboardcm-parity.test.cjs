'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const report=fs.readFileSync(path.join(__dirname,'..','mt-activity-reports.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','mt-activity-reports.css'),'utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).find(x=>x.includes('function editOneOnOne'));

test('Dasar Surat dan Metode: struktur sama dengan referensi DashboardCM, Hal & Tanggal undangan serta Nomor ST tampil setelah ada berkas',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(html,/act-letter-section/);assert.match(html,/act-method-section/);
 assert.match(html,/sl-letter/);assert.match(html,/sl-pending-input/);
 assert.match(html,/data-slk="link"/);assert.match(html,/data-slk="file"/);assert.match(html,/data-slk="tog"/);
 assert.match(html,/hiddenNo:true/);assert.match(html,/id="one-undHal"/);assert.match(html,/id="one-undTgl"/);assert.match(html,/data-slno=/);assert.match(html,/data-slmeta hidden/);
 assert.doesNotMatch(html,/class="sl-summary"/);
 assert.match(html,/function actLetterMetadata\(/);
 assert.match(html,/undExtractText\(file\)/);
 assert.match(html,/data-slpv/);
 assert.match(html,/x\.undStatus/);
});
test('Nomor undangan pada Daftar Aktivitas unduh berkas terbaru; status free text ditampilkan',()=>{
 assert.match(html,/data-act="oneUnd"/);
 assert.match(html,/it\[it\.length-1\]/);
 assert.match(html,/inv-badge pending/);
 assert.match(html,/into\.undStatus=V\('undStatus'\)/);
});
test('Laporan kegiatan, filter dan kompilasi memakai modal dan pratinjau fungsional',()=>{
 assert.doesNotThrow(()=>new vm.Script(report));
 assert.match(html,/data-act="oneReportFilter"|hib\('oneReportFilter'/);
 assert.match(html,/data-act="oneReportCompile"|hib\('oneReportCompile'/);
 assert.match(html,/ib\('oneReport'/);
 assert.match(html,/mt-activity-reports\.js/);
 assert.match(html,/mt-activity-reports\.css/);
 for(const field of ['ACT.oneReport=','ACT.oneReportFilter=','ACT.oneReportCompile=','function filtered()','function form(','function preview(','function word(','function aiAnalysis','function mtArLoadGallery','function mtArFeedbackOpen'])assert.ok(report.includes(field),'Missing '+field);
 for(const k of ['summary','charts','docs','list','gallery','analysis','overview','monev','calendar','status','matrix'])assert.ok(report.includes("'"+k+"'"),'Missing '+k);
 assert.match(report,/data-rpttte/);
 assert.match(report,/data-rptlang/);
 assert.match(report,/data-rptai/);
 assert.match(report,/dxPack\(body\)/);
 assert.match(report,/mtRptDownloadBlob\(doc,file\)/);
 assert.match(css,/\.mt-ar-ttegrid/);
 assert.match(css,/\.mt-ar-gallery/);
 assert.match(css,/\.mt-ar-feedback-btn/);
});
