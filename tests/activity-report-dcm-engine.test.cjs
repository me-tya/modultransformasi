'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const js=read('mt-dcm-report.js'),html=read('index.html'),css=read('mt-dcm-report.css');
test('Mesin laporan DashboardCM termuat utuh dan terikat ke menu Aktivitas',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 for(const f of ['function cmRptBuildSingleModel(','function cmRptBuildRangeModel(','function cmRptHtml(','function cmRptDocx(','function cmRptPreviewModal(','function cmRptSingleSetup(','function cmOpenActivityReportBuilder('])assert.ok(js.includes(f),'hilang: '+f);
 assert.match(js,/ACT\.oneReport=el=>openSingle\(el\.dataset\.id\)/);
 assert.match(js,/ACT\.oneReportFilter=\(\)=>openFiltered\(\)/);
 assert.match(js,/const CM_DOCNUM_KEY='mt_doc_numbering_v1'/,'penomoran harus terpisah dari DashboardCM');
 assert.match(js,/id==='cfg-docnum'/);
 assert.match(js,/className='mtdcm modal-overlay cm-rpt2-modal'/);
 assert.match(css,/\.mtdcm\.cm-rpt2-modal \.modal-box\{max-width:1100px/);
});
test('Pustaka pendukung sama dengan DashboardCM dan dimuat setelah laporan lama',()=>{
 for(const lib of ['chart.js@4.4.4','chartjs-plugin-datalabels@2.2.0','dayjs@1.11.10/dayjs.min.js','dayjs@1.11.10/locale/id.js','qrcodejs@1.0.0'])assert.ok(html.includes(lib),lib);
 assert.ok(html.indexOf('mt-dcm-report.js')>html.indexOf('mt-activity-reports.js'));
});
test('Adapter memetakan aktivitas Modul Transformasi ke agenda DashboardCM',()=>{
 const ctx={window:{},S:{oneonone:[],ui:{}},ACT:{},console,
  attNorm:v=>v&&v.items?{no:v.no||'',items:v.items}:{no:'',items:[]},
  actSt:x=>[x.stat||'Terjadwal'],actName:x=>x.nama,actKatOf:x=>x.kat,actRows:()=>ctx.S.oneonone};
 vm.createContext(ctx);vm.runInContext(js,ctx);
 const a=ctx.window.MT_DCM_REPORT.mtToAgenda({id:'k1',nama:'Rapat A',kat:'Rapat',tgl:'2026-11-04',jam:'13:00 - 16:30',unitP:'BATII',program:'Program Transformasi',pic:['Atitya Pritasari','Sarah Khairina'],stat:'Selesai',
  und:{no:'UND-161/TI.2/2026',items:[{t:'l',link:'https://x.test/u.pdf',nama:'Undangan'}]},dok:{items:[{t:'d',data:'data:image/png;base64,AA',nama:'f.png'}]}});
 assert.equal(a.namaKegiatan,'Rapat A');assert.equal(a.tglMulai,'2026-11-04');assert.equal(a.jamMulai,'13:00');assert.equal(a.jamSelesai,'16:30');
 assert.equal(a.statusNorm,'Completed');assert.equal(a.picTimCM,'Atitya Pritasari, Sarah Khairina');assert.equal(a.undangan,'UND-161/TI.2/2026');
 assert.equal(JSON.parse(a.undanganFiles)[0].url,'https://x.test/u.pdf');assert.equal(JSON.parse(a.dokumentasi).length,1);
});
