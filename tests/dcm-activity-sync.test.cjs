const test=require('node:test');const assert=require('node:assert');
const M=require('../mt-dcm-activity-sync.js');
const base=()=>({id:'AGD-1',no:7,namaKegiatan:'One on One Forum Transformasi Digital HRIS Kemenkeu DJKN',tglMulai:'2026-11-17',tglSelesai:'2026-11-17',jamMulai:'09:00',jamSelesai:'12:00',waktu:'',
 kategori:'T-Lab',layanan:'Yes',unitPemohon:'BATII',programTerkait:'DOA',tujuanOutput:'Kesepakatan rencana',catatan:'Catatan rapat',pesertaTarget:'Tim HRIS',unitAsalNarsum:'Pusmantap',
 picTimCM:'K. Jabar Malik, Atitya Pritasari',meetingMode:'offline',meetingLocation:'Ruang Rapat Linus Torvald',meetingLink:'',lokasiChannel:'',status:'',undangan:'UND-341/TI.4/2026',undanganUrl:'',
 suratTugas:'',suratTugasUrl:'',materi:'',notulaTeks:'<p>Notula</p>',ringkasanHasil:'Ringkas',tindakLanjut:'TL',undanganFiles:JSON.stringify([{refId:'FILE-a',name:'Undangan.pdf',mime:'application/pdf'}]),
 suratTugasFiles:'[]',materiFiles:'[]',dokumentasi:JSON.stringify([{refId:'IMG-1',name:'foto.jpg'}]),notula:'[]',eoEnabled:true,eoChecklist:'[{"t":"Konsumsi"}]',estimasiBiaya:500000,updatedAt:'2026-11-10T01:00:00.000Z',statusNorm:'Scheduled'});

test('DCM → MT menghasilkan sidik yang sama',()=>{const a=base();const x=M.applyToMt({id:'cm-import-AGD-1'},a);
 assert.deepStrictEqual(M.canonM(x),M.canonD(a));assert.strictEqual(x.cmDashboardId,'AGD-1');assert.deepStrictEqual(x.pic,['K. Jabar Malik','Atitya Pritasari']);
 assert.strictEqual(x.und.items[0].externalRefId,'FILE-a');assert.strictEqual(x.und.no,'UND-341/TI.4/2026');assert.strictEqual(x.mode,'Offline');assert.strictEqual(x.layanan,'Ya')});

test('MT → DCM tanpa perubahan tidak mengubah data & mempertahankan field khusus DCM',()=>{const a=base();const x=M.applyToMt({id:'x'},a);const a2=M.applyToDcm(a,x,{at:'2026-11-15T00:00:00Z',by:'b@kemenkeu.go.id'});
 assert.deepStrictEqual(M.canonD(a2),M.canonD(a));assert.strictEqual(a2.eoChecklist,a.eoChecklist);assert.strictEqual(a2.estimasiBiaya,500000);assert.strictEqual(a2.eoEnabled,true);
 assert.deepStrictEqual(JSON.parse(a2.undanganFiles),[{refId:'FILE-a',name:'Undangan.pdf',mime:'application/pdf'}]);assert.strictEqual(a2.updatedBy,'b@kemenkeu.go.id')});

test('Perubahan di MT terbawa ke DCM',()=>{const a=base();const x=M.applyToMt({id:'x'},a);
 x.nama='Forum HRIS (revisi)';x.pic=['Atitya Pritasari'];x.stat='Selesai';x.jam='13:30 - 17:00';x.link='https://teams.microsoft.com/x';x.dok.items.push({t:'l',link:'https://drive.example/foto',nama:'Album'});
 const a2=M.applyToDcm(a,x,{});assert.deepStrictEqual(M.canonD(a2),M.canonM(x));assert.strictEqual(a2.status,'Completed');assert.strictEqual(a2.jamMulai,'13:30');assert.strictEqual(a2.meetingMode,'offline');assert.strictEqual(a2.meetingLink,'https://teams.microsoft.com/x');
 assert.strictEqual(a2.picTimCM,'Atitya Pritasari')});

test('Aktivitas baru dari MT membentuk agenda DCM lengkap',()=>{const x={id:'abc',keAkt:true,kat:'FGD',nama:'FGD Dampak',tgl:'2026-12-01',jam:'09:00 - 11:00',pic:['Bella'],layanan:'Tidak',unitP:'DJP',und:{no:'',items:[]}};
 const a=M.applyToDcm(null,x,{at:'2026-11-15T00:00:00Z',by:'b@x',no:156});assert.strictEqual(a.id,'MT-abc');assert.strictEqual(a.no,156);assert.strictEqual(a.layanan,'No');assert.strictEqual(a.sourceApp,'Modul Transformasi');
 assert.deepStrictEqual(M.canonD(a),M.canonM(x))});

test('Status DCM dipetakan, termasuk "Done"',()=>{assert.strictEqual(M.dcmStatus('Done'),'Selesai');assert.strictEqual(M.dcmStatus('Not Attended'),'Tidak Dihadiri');assert.strictEqual(M.dcmStatus('Scheduled'),'');
 const a=base();a.status='Done';const x=M.applyToMt({id:'x'},a);assert.strictEqual(x.stat,'Selesai');const a2=M.applyToDcm(a,x,{});assert.strictEqual(M.dcmStatus(a2.status),'Selesai')});

test('Berkas yang sudah ditarik ke MT tidak dianggap perubahan',()=>{const a=base();const x=M.applyToMt({id:'x'},a);const h=M.hash(M.canonM(x));
 x.dok.items[0]={t:'f',id:'f1',nama:'foto.jpg',sourceRefId:'IMG-1'};assert.strictEqual(M.hash(M.canonM(x)),h);
 const x2=M.applyToMt(x,a);assert.strictEqual(x2.dok.items[0].t,'f','berkas tersimpan dipertahankan saat DCM diterapkan ulang')});

test('Berkas MT yang belum terkirim tetap dipertahankan saat DCM diterapkan',()=>{const a=base();const x=M.applyToMt({id:'x'},a);x.dok.items.push({t:'f',id:'f9',nama:'baru.pdf'});
 M.applyToMt(x,a);assert.ok(x.dok.items.some(i=>i.id==='f9'))});

test('Keputusan arah sinkron',()=>{const a=base();const x=M.applyToMt({id:'x'},a);
 assert.strictEqual(M.decide(a,x,null).act,'same');
 const s={d:M.hash(M.canonD(a)),m:M.hash(M.canonM(x))};
 const aD=Object.assign(base(),{namaKegiatan:'Ubah di DCM'});assert.strictEqual(M.decide(aD,x,s).act,'toMt');
 const xM=Object.assign({},x,{nama:'Ubah di MT'});assert.strictEqual(M.decide(a,xM,s).act,'toDcm');
 assert.strictEqual(M.decide(aD,Object.assign({},xM,{hist:[{t:'2026-11-12T00:00:00Z'}]}),s).act,'toDcm','MT lebih baru');
 assert.strictEqual(M.decide(Object.assign({},aD,{updatedAt:'2026-11-13T00:00:00Z'}),Object.assign({},xM,{hist:[{t:'2026-11-12T00:00:00Z'}]}),s).act,'toMt','DCM lebih baru');
 assert.strictEqual(M.decide(aD,xM,s).act,'toMt','waktu MT tidak diketahui → DCM menang');
 assert.strictEqual(M.decide(aD,x,null).act,'toMt','pertama kali → DCM menang')});

test('Hanya aktivitas yang dikirim ke DCM',()=>{assert.ok(M.pushable({id:'a',kat:'FGD'}));assert.ok(M.pushable({id:'a',kat:'1-on-1 T-Program',keAkt:true}));
 assert.ok(!M.pushable({id:'a',kat:'1-on-1 T-Program'}));assert.ok(!M.pushable({id:'cfg-x',kind:'cfg'}));assert.ok(!M.pushable({id:'pub-tim',kat:'FGD'}))});
