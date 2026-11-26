/* Project Selection › Prioritasi — Metode Kertas Kerja A (Pusakti) "Prioritas Pengembangan SI/Modul".
   Diturunkan dari workbook Kertas_Kerja_A_Prioritas_SI_2027 (sheet Petunjuk, Kriteria, Rubrik, Daftar, Usulan, Penilaian,
   Ringkasan, Analisis, Referensi). Aturan bisnis (untuk dibangun ulang .NET/Angular):
   - Metode dipilih per program: p.psMethod = 'manual' | 'smart' | 'kka'. Portofolio KKA = seluruh proyek pada program tahun
     terpilih yang memakai metode 'kka' (peringkat lintas program & lintas UE I, satu pagu dan satu kapasitas SDM).
   - Data per proyek (tersimpan di p.psProjects[], koleksi programs): kkaG1..kkaG4 ('Ya'|'Tidak'|''), kka:{K1..K7: 1..5},
     estimatedCost (Rp), durationMonths, estimatedStaffMonths (orang-bulan), uic (UE I), initiativeType.
   - Gate: Lolos bila G1–G4 semua Ya; ada Tidak = Tinjau Ulang; ada kosong = Lengkapi. G4 = kajian kebutuhan sudah dikirim ke Pusakti.
   - Skor Tertimbang (0–100) = Σ(skor × bobot) ÷ 5 × 100 (dibulatkan 2 desimal); K7 sudah terbalik (5 = risiko terendah).
   - Diranking bila 7 skor lengkap DAN (onlyPassed='Tidak' ATAU gate Lolos). Seri: urutan program lalu urutan proyek.
   - Kategori: ≥P1 Utama, ≥P2 Tinggi, ≥P3 Menengah, selain itu Rendah/Tunda (ambang di pengaturan).
   - Roadmap greedy (peringkat seluruh UE I): biaya/SDM kosong = "Lengkapi biaya/SDM"; muat pagu DAN SDM kumulatif = "Didanai <tahun>";
     selain itu "Cadangan / Tunda" (usulan berikutnya yang masih muat tetap dapat didanai).
   - Analisis: skor & peringkat per 3 profil, Stabil bila rentang ≤ toleransi; Nilai Manfaat = K1–K5, Kemudahan = K6–K7 (diboboti profil aktif);
     kuadran Quick Win / Proyek Strategis / Pelengkap / Tunda / Kaji Ulang (ambang kuadran); WSJF = (K2+K4+K5) ÷ (6−K7); Konsisten bila |rank WSJF − rank| ≤ toleransi.
   - Pengaturan & Repositori Hasil per tahun di S.psKka (koleksi Firestore 'psKka'): 'cfg-<tahun>' dan 'snap-<tahun>-<id>'.
     Hak ubah pengaturan/repositori: SA, PMOK. Skor & gate: pengelola program (sesuai Project Selection). */
(function(){
'use strict';
const A=window.MT_PROJECT_SELECTION,I=A&&A.internals;if(!I)return;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const T=v=>String(v==null?'':v).trim();
const say=m=>{try{toast(m)}catch(_){}};
const me=()=>{try{return typeof ME!=='undefined'?ME:null}catch(_){return null}};
const canCfg=()=>!!me()&&['SA','PMOK'].includes(me().role);
const year=()=>I.year();
const ic=t=>typeof window.MT_INFO_ICON==='function'?window.MT_INFO_ICON(t):'';
const fmt=(n,d=0)=>n==null||n===''||!isFinite(n)?'—':Number(n).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

const KR=[
 {c:'K1',n:'Keselarasan Strategis',s:'Strategis',q:'Seberapa kuat kontribusi terhadap sasaran strategis/Renstra/IKU, Arsitektur SPBE, dan peta rencana EA organisasi?',ref:'TOGAF 10 (Architecture Vision; Opportunities & Solutions); COBIT 2019 APO02; Perpres 132/2022'},
 {c:'K2',n:'Nilai Bisnis & Dampak Layanan',s:'Nilai Bisnis',q:'Seberapa besar manfaat terukur: kualitas layanan, efisiensi waktu/biaya, kualitas data & keputusan, jumlah pengguna terdampak?',ref:'COBIT 2019 EDM02 (Benefits Delivery); Ward & Daniel, Benefits Management; PermenPANRB 59/2020'},
 {c:'K3',n:'Mandat Regulasi & Kepatuhan',s:'Regulasi',q:'Apakah ada kewajiban peraturan/kebijakan, temuan audit/evaluasi SPBE, atau kewajiban PDP & keamanan yang harus dipenuhi?',ref:'Perpres 82/2023; Perpres 132/2022; UU 27/2022 (PDP); PP 71/2019; Perpres 47/2023'},
 {c:'K4',n:'Urgensi & Biaya Penundaan',s:'Urgensi',q:'Seberapa besar kerugian/risiko bila ditunda ke tahun berikutnya (tenggat tetap, teknologi end-of-life, peluang hilang)?',ref:'WSJF – Time Criticality (Reinertsen; SAFe); COBIT 2019 APO12'},
 {c:'K5',n:'Reusability, Integrasi & Kesesuaian Arsitektur',s:'Reuse & Integrasi',q:'Seberapa besar sistem memakai ulang data/layanan bersama, interoperable, tidak duplikatif, dan sesuai arsitektur target?',ref:'TOGAF 10 (Building Blocks, Interoperability); Perpres 39/2019 (Satu Data); Perpres 132/2022'},
 {c:'K6',n:'Kesiapan Organisasi',s:'Kesiapan',q:'Seberapa siap proses bisnis, sponsor/pemilik, data, SDM, dan manajemen perubahan?',ref:'TOGAF 10 (Business Transformation Readiness Assessment); COBIT 2019 BAI05'},
 {c:'K7',n:'Risiko & Kompleksitas – skor 5 = terendah',s:'Risiko (5=rendah)',q:'Seberapa rendah risiko teknis, integrasi, ketergantungan vendor, dan kompleksitas pelaksanaan?',ref:'COBIT 2019 APO12, BAI01; TOGAF 10 (Risk Management); PMI Portfolio Management'}];
const RUB={
 K1:['Tidak terkait sasaran strategis/IKU.','Terkait tidak langsung; sekadar pendukung umum.','Mendukung satu sasaran/IKU tingkat unit.','Mendukung sasaran/IKU tingkat organisasi dan tercantum di peta rencana EA.','Kontribusi langsung & kritikal pada sasaran utama/program prioritas; ada di Arsitektur SPBE.'],
 K2:['Manfaat minim atau tidak terukur.','Manfaat terbatas pada satu unit kecil.','Manfaat jelas & terukur bagi satu unit/proses.','Manfaat signifikan lintas unit atau layanan eksternal.','Manfaat transformatif terukur: layanan prioritas, pengguna banyak, efisiensi besar.'],
 K3:['Tidak ada mandat.','Hanya praktik baik/rekomendasi.','Diwajibkan kebijakan internal.','Mandat peraturan dengan tenggat fleksibel, atau menindaklanjuti rekomendasi evaluasi SPBE/audit.','Mandat peraturan eksplisit bertenggat tahun anggaran, temuan audit, atau risiko sanksi (mis. PDP, keamanan).'],
 K4:['Dapat ditunda > 2 tahun tanpa dampak.','Dapat ditunda 1–2 tahun.','Penundaan menurunkan manfaat secara bertahap.','Penundaan menimbulkan risiko operasional/peluang hilang dalam 12 bulan.','Tenggat tetap, teknologi end-of-life, atau risiko tinggi bila tidak dikerjakan tahun ini.'],
 K5:['Berdiri sendiri, berpotensi duplikasi, data silo.','Integrasi minim.','Terintegrasi sebagian dengan sistem/data existing.','Memakai data master/layanan bersama dan standar arsitektur.','Menjadi shared service/building block yang dipakai ulang banyak sistem; selaras penuh dengan arsitektur target.'],
 K6:['Proses bisnis belum jelas; tanpa sponsor/data/SDM.','Kesiapan rendah; banyak prasyarat belum ada.','Sebagian siap: sponsor jelas, data/SDM terbatas.','Hampir siap penuh; sisa prasyarat kecil.','Siap penuh: proses terdokumentasi, sponsor aktif, data & SDM tersedia, rencana change management ada.'],
 K7:['Sangat tinggi: teknologi baru, banyak integrasi, ketergantungan vendor tunggal.','Tinggi.','Sedang.','Rendah: teknologi dikenal, ruang lingkup jelas.','Sangat rendah: pengembangan modul pada platform existing oleh tim berpengalaman.']};
const GATES=[['kkaG1','G1','Selaras strategi/EA','Selaras dengan Renstra/peta rencana EA/Arsitektur SPBE.'],['kkaG2','G2','Tidak duplikatif','Tidak duplikatif dengan aplikasi existing/shared service.'],['kkaG3','G3','Sponsor & pemilik jelas','Pemilik proses bisnis & sponsor jelas.'],['kkaG4','G4','Kajian kebutuhan ke Pusakti','Sudah mengirimkan dokumen kajian kebutuhan ke Pusakti.']];
const PROFILES=['Seimbang','Prioritas Kepatuhan','Prioritas Efisiensi'];
const DEFW={'Seimbang':[20,20,10,10,10,15,15],'Prioritas Kepatuhan':[15,15,25,15,10,10,10],'Prioritas Efisiensi':[15,30,5,10,15,10,15]};
const UE=['SETJEN','ITJEN','DJSEF','DJA','DJPK','DJPPR','DJSPSK','BPPK','BaTii'];
const CATS=['Prioritas 1 – Utama','Prioritas 2 – Tinggi','Prioritas 3 – Menengah','Prioritas 4 – Rendah/Tunda'];
const QUADS=['Quick Win','Proyek Strategis','Pelengkap','Tunda / Kaji Ulang'];
const APPROACH={'Quick Win':'Kerjakan awal (TW1–TW2); hasil cepat terlihat','Proyek Strategis':'Mulai awal, pecah menjadi fase/MVP, kelola risiko','Pelengkap':'Kerjakan bila kapasitas tersisa','Tunda / Kaji Ulang':'Perkuat business case sebelum dilanjutkan'};
const REFS=[['Perpres No. 132 Tahun 2022 tentang Arsitektur SPBE Nasional','Regulasi','Domain arsitektur; K1, K5.'],['Perpres No. 82 Tahun 2023 tentang Percepatan Transformasi Digital dan Keterpaduan Layanan Digital Nasional','Regulasi','K3 (mandat) dan K5 (keterpaduan layanan/data).'],['Perpres No. 95 Tahun 2018 tentang SPBE','Regulasi','Landasan tata kelola SPBE; K1, K3.'],['PermenPANRB No. 59 Tahun 2020 tentang Pemantauan dan Evaluasi SPBE','Regulasi','Sumber mandat/temuan untuk K2, K3.'],['UU No. 27 Tahun 2022 (PDP); PP No. 71 Tahun 2019 (PSTE)','Regulasi','K3 (kewajiban PDP dan keamanan).'],['Perpres No. 47 Tahun 2023 tentang Strategi Keamanan Siber Nasional','Regulasi','K3 dan K7 (risiko keamanan).'],['Perpres No. 39 Tahun 2019 tentang Satu Data Indonesia','Regulasi','K5 – reusability data & interoperabilitas.'],['TOGAF Standard, 10th Edition (2022)','Standar EA','Logika gate & penilaian (K1, K5, K6, K7).'],['COBIT 2019: EDM02; APO02; APO05; APO06; APO12; BAI01; BAI05','Standar tata kelola TI','Struktur kriteria dan prinsip portofolio investasi TI.'],['ISO/IEC 38500:2015 – Governance of IT','Standar','Evaluasi–arahan–pantau; keputusan akhir pada forum tata kelola.'],['PMI – The Standard for Portfolio Management','Standar','Seleksi & penyeimbangan portofolio terhadap pagu & kapasitas (roadmap).'],['Ward & Daniel (2006). Benefits Management','Literatur','K2 – manfaat bisnis.'],['Weill & Ross (2004). IT Governance','Literatur','Keselarasan investasi TI dengan strategi.'],['Saaty (1980). AHP; literatur MCDA','Metode','Skor tertimbang & uji sensitivitas bobot.'],['Reinertsen (2009); SAFe – WSJF','Metode','Pembanding WSJF (Cost of Delay ÷ Job Size).'],['Matriks Value vs Effort (Nilai–Kemudahan)','Metode','Kuadran Quick Win, Proyek Strategis, Pelengkap, Tunda.']];

/* ---------- penyimpanan ---------- */
const store=()=>{if(!S.psKka||typeof S.psKka!=='object')S.psKka={};return S.psKka};
const DEF={profile:'Seimbang',onlyPassed:'Ya',pagu:15000,sdm:160,quadThr:60,p1:75,p2:65,p3:50,tol:3};
function cfg(y){const st=store(),k='cfg-'+(y||year());const c=st[k]||{};const w={};PROFILES.forEach(p=>{const a=(c.weights||{})[p];w[p]=Array.isArray(a)&&a.length===7?a.map(Number):DEFW[p].slice()});
 return Object.assign({},DEF,c,{weights:w,year:+(y||year())})}
function setCfg(patch){const st=store(),k='cfg-'+year(),cur=cfg();const nx=Object.assign({},cur,patch);delete nx.year;nx.updatedAt=new Date().toISOString();nx.updatedBy=me()?.email||'';st[k]=nx;save()}
const ui=()=>{S.ui.psKka=S.ui.psKka||{sub:'usulan',scope:'non',mode:'all',ue:[],q:''};return S.ui.psKka};

/* ---------- wadah proyek di luar ISTK ----------
   Proyek SI yang tidak termapping ke program/ISTK disimpan di S.psKka['non-<tahun>'].projects (koleksi psKka).
   Ikut dinilai & diperingkat MCDA (berbagi pagu & SDM), tetapi tidak masuk Penetapan Program, Charter, Draft RKMK, WBS,
   dan tidak dipantau PMO Kemenkeu (pengelolaan oleh unit pemilik sesuai tata kelola SPBE). Ubah: SA & PMOK. */
const NONK=y=>'non-'+(y||year());
function nonP(y){const st=store(),k=NONK(y),d=st[k]&&Array.isArray(st[k].projects)?st[k]:{year:+(y||year()),projects:[]};
 return {id:'__nonistk',nama:'Di luar ISTK',nonIstk:true,psMethod:'kka',psProjects:d.projects,_doc:d,_keep:()=>{st[k]=d}}}
const roP=p=>p&&p.nonIstk?!canCfg():I.readonly(p);
/* SMART sebagai pembanding untuk usulan Non-ISTK: program semu yang menyimpan bobot/ambang di dokumen non-ISTK tahun ini. */
function nonSmartP(y){const n=nonP(y),d=n._doc;n._keep();const sm=d.smart||(d.smart={});const o={id:'__nonistk_smart',akr:'NON-ISTK',nama:'Usulan Non-ISTK',nonIstk:true,psDraft:true,psMethod:'smart',psPrioritize:true,psYear:+(y||year()),uic:'',psProjects:d.projects};
 ['psWeights','psThreshold','psRubrics','psSnapshots','psStatus','psNorm'].forEach(k=>Object.defineProperty(o,k,{enumerable:true,get:()=>sm[k],set:v=>{sm[k]=v}}));return o}
const nonMethod=y=>cfg(y).nonMethod==='smart'?'smart':'kka';
const allProgs=y=>{const a=I.programs().slice(),n=nonP(y);if(n.psProjects.length)a.push(n);return a};
/* ---------- perhitungan ---------- */
const method=p=>p.psMethod||(p.psPrioritize?'smart':'manual');
const costM=x=>{const v=x.estimatedCost;if(v===''||v==null||!isFinite(+v))return null;return +v/1e6};
const num=v=>v===''||v==null||!isFinite(+v)?null:+v;
const sc=(x,k)=>{const v=+((x.kka||{})[k]);return v>=1&&v<=5?v:null};
function gateOf(x){const g=GATES.map(z=>T(x[z[0]]));if(g.some(v=>!v))return 'Lengkapi';return g.every(v=>v==='Ya')?'Lolos':'Tinjau Ulang'}
const wFrac=(c,prof)=>c.weights[prof].map(v=>v/100);
const weighted=(s,w)=>Math.round(s.reduce((a,v,i)=>a+v*w[i],0)/5*100*100)/100;
function category(score,c){if(score==null)return '';return score>=c.p1?CATS[0]:score>=c.p2?CATS[1]:score>=c.p3?CATS[2]:CATS[3]}
function rankBy(arr,key){const v=arr.filter(r=>r[key]!=null);v.forEach(r=>{r['r_'+key]=v.filter(o=>o[key]>r[key]).length+v.filter(o=>o[key]===r[key]&&o.ord<=r.ord).length})}
/* ISTK diprioritaskan otomatis: proyek pada program ISTK tahun berjalan tidak dinilai MCDA; mereka mengambil pagu & SDM lebih dulu.
   Yang dinilai (gate, K1–K7, peringkat) hanya usulan Di luar ISTK, lalu mengisi sisa pagu & SDM. Proyek ISTK yang ikut:
   program metode MCDA → semua proyek (included !== false); program SMART/manual → proyek terpilih program itu. */
function istkList(p){if(method(p)==='kka')return (p.psProjects||[]).filter(x=>x.included!==false);try{return I.chosen?I.chosen(p):[]}catch(_){return []}}
function compute(y){
 y=y||year();const c=cfg(y),wA=wFrac(c,c.profile),istkP=I.programs().filter(p=>!p.arsip&&p.psListStatus!=='Arsip'),non=nonP(y),progs=istkP.slice();if(non.psProjects.length)progs.push(non);
 const rows=[],IST=[];let ord=0;
 istkP.forEach(p=>istkList(p).forEach(x=>{ord++;const r={ord,p,x,id:x.id,code:x.psCode||'',name:x.name||'',uic:T(x.uic||p.uic),jenis:T(x.initiativeType),istk:true,gate:'',g:['','','',''],s:[null,null,null,null,null,null,null],n:0,full:false,score:null,ranked:false,cat:'',value:null,ease:null,quad:'',cost:costM(x),dur:num(x.durationMonths),sdmN:num(x.estimatedStaffMonths)};rows.push(r);IST.push(r)}));
 non.psProjects.forEach(x=>{const p=non;ord++;const s=KR.map(k=>sc(x,k.c)),n=s.filter(v=>v!=null).length,gate=gateOf(x);
  const full=n===7,score=full?weighted(s,wA):null,ranked=full&&(c.onlyPassed==='Tidak'||gate==='Lolos');
  const value=full?Math.round(s.slice(0,5).reduce((a,v,i)=>a+v*wA[i],0)/wA.slice(0,5).reduce((a,v)=>a+v,0)/5*100*10)/10:null;
  const ease=full?Math.round(s.slice(5).reduce((a,v,i)=>a+v*wA[5+i],0)/wA.slice(5).reduce((a,v)=>a+v,0)/5*100*10)/10:null;
  const quad=value==null?'':value>=c.quadThr?(ease>=c.quadThr?'Quick Win':'Proyek Strategis'):(ease>=c.quadThr?'Pelengkap':'Tunda / Kaji Ulang');
  rows.push({ord,p,x,id:x.id,code:x.psCode||'',name:x.name||'',uic:T(x.uic||p.uic),jenis:T(x.initiativeType),istk:false,gate,g:GATES.map(z=>T(x[z[0]])),s,n,full,score,ranked,
   cat:category(score,c),value,ease,quad,cost:costM(x),dur:num(x.durationMonths),sdmN:num(x.estimatedStaffMonths),
   prof:ranked?PROFILES.map(pr=>weighted(s,wFrac(c,pr))):null,wsjf:ranked?Math.round((s[1]+s[3]+s[4])/(6-s[6])*100)/100:null})});
 const R=rows.filter(r=>r.ranked);
 R.forEach(r=>{r.sAll=r.score});rankBy(R,'sAll');R.forEach(r=>{r.rank=r.r_sAll});
 const byUe={};R.forEach(r=>{(byUe[r.uic]=byUe[r.uic]||[]).push(r)});Object.values(byUe).forEach(g=>{g.forEach(r=>r.sUe=r.score);rankBy(g,'sUe');g.forEach(r=>r.rankUe=r.r_sUe)});
 PROFILES.forEach((pr,i)=>{R.forEach(r=>r['sp'+i]=r.prof[i]);rankBy(R,'sp'+i)});
 R.forEach(r=>{r.rp=[0,1,2].map(i=>r['r_sp'+i]);r.best=Math.min(...r.rp);r.worst=Math.max(...r.rp);r.stab=r.worst-r.best<=c.tol?'Stabil':'Sensitif bobot'});
 rankBy(R,'wsjf');R.forEach(r=>{r.rankW=r.r_wsjf;r.cons=Math.abs(r.rankW-r.rank)<=c.tol?'Konsisten':'Tinjau'});
 let cc=0,cs=0;
 IST.forEach(r=>{cc+=r.cost||0;cs+=r.sdmN||0;r.rec=r.cost==null||r.sdmN==null?'ISTK · lengkapi biaya/SDM':'ISTK · prioritas otomatis';r.cumC=cc;r.cumS=cs;r.appr='Prioritas otomatis (program ISTK)'});
 const istkC=cc,istkS=cs;
 R.slice().sort((a,b)=>a.rank-b.rank).forEach(r=>{
  if(r.cost==null||r.sdmN==null){r.rec='Lengkapi biaya/SDM'}else if(cc+r.cost<=c.pagu&&cs+r.sdmN<=c.sdm){r.rec='Didanai '+y;cc+=r.cost;cs+=r.sdmN}else r.rec='Cadangan / Tunda';
  r.cumC=cc;r.cumS=cs;r.appr=APPROACH[r.quad]||''});
 const funded=R.filter(r=>r.rec==='Didanai '+y),NR=rows.filter(r=>!r.istk);
 return {y,c,progs,rows,IST,R,funded,sum:{total:NR.length,istk:IST.length,istkCost:istkC,istkSdm:istkS,lolos:NR.filter(r=>r.gate==='Lolos').length,tinjau:NR.filter(r=>r.gate==='Tinjau Ulang').length,lengkapi:NR.filter(r=>r.gate==='Lengkapi').length,
  lengkap:NR.filter(r=>r.full).length,ranked:R.length,costRanked:R.reduce((a,r)=>a+(r.cost||0),0),costFunded:cc,sdmFunded:cs,nFunded:funded.length,avg:NR.filter(r=>r.full).length?NR.filter(r=>r.full).reduce((a,r)=>a+r.score,0)/NR.filter(r=>r.full).length:null}};
}

/* ---------- tampilan ---------- */
const catCls=c=>c===CATS[0]?'p1':c===CATS[1]?'p2':c===CATS[2]?'p3':c===CATS[3]?'p4':'';
const gateCls=g=>g==='Lolos'?'ok':g==='Tinjau Ulang'?'bad':'warn';
const METHODS=[['smart','SMART','Simple Multi-Attribute Rating Technique: 12 kriteria, skor absolut di atas ambang.'],['kka','MCDA','Multi-Criteria Decision Analysis: gate G1–G4, skor tertimbang 7 kriteria (3 profil bobot), peringkat, dan roadmap terhadap pagu & SDM.']];
function methodSelect(p,ro){const m=method(p);return '<div class="kka-method" role="radiogroup" aria-label="Metode prioritisasi"><span>Metode</span>'+(m==='manual'?'<em class="kka-mlegacy" title="Program ini dibuat dengan pemilihan manual (versi lama). Pilihan proyek tetap dipertahankan sampai metode SMART atau MCDA dipilih.">Manual (lama)</em>':'')+'<div class="kka-mseg">'+METHODS.map(o=>'<label title="'+E(o[2])+'" class="'+(m===o[0]?'on':'')+(ro?' dis':'')+'"><input type="radio" name="pswf-method" value="'+o[0]+'"'+(m===o[0]?' checked':'')+(ro?' disabled':'')+'>'+o[1]+'</label>').join('')+'</div></div>'}
const SUBS=[['usulan','Usulan Non-ISTK'],['rank','Penilaian & Peringkat'],['criteria','Kriteria & Bobot'],['roadmap','Roadmap & Analisis'],['repo','Repositori'],['ref','Referensi & Rubrik']];
let NONONLY=false;
function page(p,o){
 o=o||{};const u=ui(),sub=SUBS.some(s=>s[0]===u.sub)?u.sub:'rank',ro=!!o.readOnly;NONONLY=!!o.nonOnly;if(NONONLY)u.scope='non';
 const head='<div class="ps27-priority-head"><nav class="ps27-minitabs" role="tablist" aria-label="Tab Prioritasi MCDA">'+SUBS.map(s=>'<button role="tab" type="button" data-kka-sub="'+s[0]+'" aria-selected="'+(sub===s[0])+'" class="'+(sub===s[0]?'on':'')+'">'+s[1]+'</button>').join('')+'</nav>'+
  '<div class="ps27-smart-actions">'+(o.methodHtml!=null?o.methodHtml:methodSelect(p,ro))+'</div></div>';
 const D=compute();
 const body=sub==='usulan'?usulanView(D):sub==='criteria'?criteriaView(D):sub==='roadmap'?roadmapView(D):sub==='repo'?repoView(D):sub==='ref'?refView():rankView(p,D,ro);
 return head+'<div class="kka">'+pendingBanner(D.y)+body+'</div>';
}
/* KPI filters use the same portfolio rows as the summary, without modifying scoring or source data. */
const KFILTER={
 istk:r=>r.istk, non:r=>!r.istk, passed:r=>!r.istk&&r.gate==='Lolos', ranked:r=>r.ranked,
 funded:(r,D)=>!r.istk&&r.rec==='Didanai '+D.y,
 cost:(r,D)=>(r.istk||r.rec==='Didanai '+D.y)&&r.cost>0,
 staff:(r,D)=>(r.istk||r.rec==='Didanai '+D.y)&&r.sdmN>0
};
const kpiScope=k=>['istk','cost','staff'].includes(k)?'all':'non';
function moduleTitle(r){
 const name=T(r.name),app=T(r.x&&r.x.applicationName);
 let clean=name.replace(/^Satu\s+Kemenkeu\s*(?:\/|[-–—:]|\|)\s*/i,'').trim();
 if(app&&clean.toLowerCase().startsWith(app.toLowerCase())){
  const suffix=clean.slice(app.length);if(/^\s*[/|:–—-]\s*\S/.test(suffix))clean=suffix.replace(/^\s*[/|:–—-]\s*/,'').trim();
 }
 return clean||name;
}
function kpis(D,rankPage=false){const s=D.sum,c=D.c,active=rankPage?ui().kpi:'';
 const pc=(n,d)=>d?fmt(n/d*100,1)+'%':'0%';
 const k=(key,v,l,tone,sub,hint)=>'<button type="button" class="kka-kpi kka-tone-'+tone+(active===key?' is-active':'')+'" data-kka-kpi="'+key+'" aria-pressed="'+(active===key)+'" title="'+E(active===key?'Klik kembali untuk melepas filter':hint)+'"><span class="kka-kpi-label">'+l+'</span><b>'+v+'</b><small>'+sub+'</small></button>';
 return '<div class="kka-kpis" role="group" aria-label="Filter indikator portofolio">'+
 k('istk',s.istk,'Proyek ISTK','navy','Otomatis · Rp '+fmt(s.istkCost)+' jt','Lihat seluruh proyek ISTK tahun ini')+
 k('non',s.total,'Usulan non-ISTK','violet','Usulan yang dinilai','Lihat semua usulan non-ISTK')+
 k('passed',s.lolos,'Lolos gate','green',pc(s.lolos,s.total)+' dari usulan','Lihat usulan dengan gate Lolos')+
 k('ranked',s.ranked,'Diranking','blue',pc(s.ranked,s.total)+' dari usulan','Lihat usulan yang masuk peringkat')+
 k('funded',s.nFunded,'Non-ISTK didanai','teal','Rekomendasi '+D.y,'Lihat usulan yang direkomendasikan didanai')+
 k('cost',fmt(s.costFunded),'Biaya terpakai','gold','dari pagu Rp '+fmt(c.pagu)+' jt','Lihat proyek dengan kontribusi biaya pada pagu')+
 k('staff',fmt(s.sdmFunded,1),'SDM terpakai','slate','dari kapasitas '+fmt(c.sdm)+' org-bln','Lihat proyek dengan kontribusi pada kapasitas SDM')+'</div>';
}
function rankView(p,D,ro){
 const u=ui(),scopeAll=u.scope==='all',ueSel=Array.isArray(u.ue)?u.ue:[],q=T(u.q).toLowerCase();
 if(!D.progs.length&&u.scope!=='non'&&!canCfg())return '<div class="kka-empty">Belum ada program tahun '+D.y+' yang memakai metode MCDA.</div>';
 const scopeNon=u.scope==='non';let rows=D.rows.filter(r=>scopeAll||(scopeNon?r.p.nonIstk:r.p===p));
 const activeKpi=Object.prototype.hasOwnProperty.call(KFILTER,u.kpi)?u.kpi:'';if(activeKpi)rows=rows.filter(r=>KFILTER[activeKpi](r,D));
 rows=rows.filter(r=>(!ueSel.length||ueSel.includes(r.uic))&&(!q||(r.name+' '+r.code+' '+r.uic+' '+r.p.nama).toLowerCase().includes(q)));
 const rk=r=>u.mode==='ue'?r.rankUe:r.rank;
 rows.sort((a,b)=>(b.istk-a.istk)||(rk(a)||1e9)-(rk(b)||1e9)||a.ord-b.ord);
 const ues=[...new Set([...UE,...D.rows.map(r=>r.uic).filter(Boolean)])];
 const tb='<div class="kka-toolbar">'+(NONONLY?'':'<div class="kka-seg" role="group" aria-label="Lingkup">'+[['non','Non-ISTK · dinilai'+(nonP().psProjects.length?' ('+nonP().psProjects.length+')':'')],['program','Program ini · ISTK'],['all','Portofolio '+D.y]].map(x=>'<button type="button" data-kka-scope="'+x[0]+'" class="'+((u.scope||'program')===x[0]?'on':'')+'">'+x[1]+'</button>').join('')+'</div>')+
  '<label class="kka-inl" title="Mode ranking"><select data-kka-mode aria-label="Mode ranking"><option value="all"'+(u.mode!=='ue'?' selected':'')+'>Ranking semua UE I</option><option value="ue"'+(u.mode==='ue'?' selected':'')+'>Ranking per UE I</option></select></label>'+
  '<details class="kka-uef"><summary>UE I: '+(ueSel.length?E(ueSel.join(', ')):'Semua')+'</summary><div>'+ues.map(v=>'<label><input type="checkbox" data-kka-ue="'+E(v)+'" '+(ueSel.includes(v)?'checked':'')+'> '+E(v)+'</label>').join('')+'<button type="button" class="btn btn-sm" data-kka-ue-clear>Semua</button></div></details>'+
  '<input class="kka-q" type="search" data-kka-q placeholder="Cari proyek, kode, UE I…" value="'+E(u.q||'')+'" aria-label="Cari proyek">'+
  '<span class="kka-sp"></span><label class="kka-inl" title="'+E(canCfg()?'Ganti profil bobot aktif; skor & peringkat langsung dihitung ulang. Angka bobot diubah di tab Kriteria & Bobot.':'Hanya Superadmin dan PMO Kemenkeu yang dapat mengganti profil bobot.')+'">Bobot <select data-kka-cfg="profile"'+(canCfg()?'':' disabled')+'>'+PROFILES.map(p=>'<option'+(p===D.c.profile?' selected':'')+'>'+E(p)+'</option>').join('')+'</select></label>'+
  (canCfg()&&(u.scope==='non'||u.scope==='all')?'<button type="button" class="btn btn-sm pri" data-kka-nonadd title="Tambah usulan proyek SI yang tidak termapping ke ISTK">+ Usulan</button>':'')+'<button type="button" class="btn btn-sm" data-kka-import title="Impor workbook Kertas Kerja A (Pusakti)" '+(ro&&!canCfg()?'disabled':'')+'>↑ Impor</button><button type="button" class="btn btn-sm" data-kka-xlsx>⇩ Excel</button></div>';
 const rubTxt=k=>k.n+' — '+k.q+'\n'+RUB[k.c].map((t,i)=>(i+1)+' = '+t).join('\n');
 const wAct=D.c.weights[D.c.profile],wMax=Math.max(30,...wAct);
 const hdK=KR.map((k,j)=>'<th class="kka-k'+(j?'':' div')+'" title="'+E(rubTxt(k))+'"><b>'+k.c+'</b><span>'+E(k.s)+'</span><i class="kka-wbar"><i style="width:'+Math.round(wAct[j]/wMax*100)+'%"></i></i><em>'+fmt(wAct[j])+'%</em></th>').join('');
 const GS=['Selaras','Tdk duplikat','Sponsor','Kajian'];
 const hdG=GATES.map((g,j)=>'<th class="kka-g'+(j?'':' div')+'" title="'+E(g[1]+' — '+g[3]+'\nDicentang = Ya; tidak dicentang = Tidak (Tinjau Ulang); kotak bergaris putus-putus = belum dijawab (Lengkapi).')+'"><b>'+g[1]+'</b><span>'+GS[j]+'</span></th>').join('');
 const roOf=r=>r.p.nonIstk?!canCfg():(ro||I.readonly(r.p));
 const sel=(r,attr,val,opts,lab,desc)=>{const cur=desc&&val!=null&&val!==''?desc[+val-1]:'';return '<select '+attr+' aria-label="'+E(lab)+'" title="'+E(cur?val+' = '+cur:lab)+'" '+(roOf(r)?'disabled':'')+'>'+opts.map(v=>'<option value="'+v+'"'+(String(val??'')===String(v)?' selected':'')+(desc&&v!==''?' title="'+E(desc[+v-1])+'" data-l="'+E(v+' – '+desc[+v-1])+'"':'')+'>'+(v===''?'–':v)+'</option>').join('')+'</select>'};
 const tr=rows.map(r=>'<tr class="'+(r.ranked?'':'kka-nr')+'"><td class="kka-rk">'+(r.istk?'<span class="kka-chip kka-istk">ISTK</span>':(rk(r)||'—'))+'</td><td class="kka-nm"><b class="kka-module-title">'+E(moduleTitle(r))+'</b>'+(r.p.nonIstk?'<div class="kka-module-meta"><span class="kka-chip kka-non" title="Tidak termapping ke ISTK: ikut peringkat & roadmap, tidak masuk Penetapan/RKMK/WBS dan tidak dipantau PMO Kemenkeu.">Non-ISTK</span><span class="kka-module-actions"><button type="button" class="kka-ib" data-kka-nondetail="'+E(r.id)+'" title="Lihat detail usulan">👁</button>'+(canCfg()?'<button type="button" class="kka-ib" data-kka-nonedit="'+E(r.id)+'" title="Ubah usulan">✎</button><button type="button" class="kka-ib" data-kka-nondel="'+E(r.id)+'" title="Hapus usulan">🗑</button>':'')+'</span></div>':'')+'<small>'+E([r.code,scopeAll&&!r.p.nonIstk?r.p.nama:'',activeKpi==='cost'?'Rp '+fmt(r.cost,2)+' jt':'',activeKpi==='staff'?fmt(r.sdmN,1)+' org-bln':''].filter(Boolean).join(' · '))+'</small></td><td>'+E(r.uic||'—')+'</td><td class="kka-sc">'+(r.istk?'<small>—</small>':r.score==null?'<small>'+r.n+'/7</small>':fmt(r.score,2))+'</td><td class="kka-cat">'+(r.cat?'<span class="kka-chip kka-pc '+catCls(r.cat)+'" title="'+E(r.cat)+'">'+catCls(r.cat).toUpperCase()+'</span>':'<small>—</small>')+(r.full&&!r.ranked?'<small title="Skor lengkap tetapi gate belum Lolos">tdk diranking</small>':'')+'</td>'+
  (r.istk?'<td colspan="12" class="kka-istk-note">Program ISTK · <b>prioritas otomatis</b>, tidak perlu dinilai. Biaya '+(r.cost==null?'—':'Rp '+fmt(r.cost,2)+' jt')+' · SDM '+(r.sdmN==null?'—':fmt(r.sdmN,1)+' org-bln')+' diperhitungkan lebih dulu pada roadmap.</td>':
  GATES.map((g,i)=>{const v=r.g[i];return '<td class="kka-g"><input type="checkbox" class="kka-cb'+(v?'':' unset')+'" data-kka-gatecb="'+E(r.id)+'|'+g[0]+'" '+(v==='Ya'?'checked ':'')+(roOf(r)?'disabled ':'')+'title="'+E(g[1]+' '+g[2]+': '+(v||'belum dijawab'))+'" aria-label="'+E(g[1]+' '+g[2]+' – '+r.name)+'"></td>'}).join('')+
  '<td><span class="kka-chip '+gateCls(r.gate)+'">'+r.gate+'</span></td>'+
  KR.map((k,i)=>'<td class="kka-k">'+sel(r,'data-kka-score="'+E(r.id)+'|'+k.c+'"',r.s[i],['',1,2,3,4,5],k.c+' '+r.name,RUB[k.c])+'</td>').join(''))+
  '</tr>').join('');
 return kpis(D,true)+tb+'<div class="kka-scroll"><table class="kka-t kka-pen"><thead><tr><th>'+(u.mode==='ue'?'Rank UE I':'Rank')+'</th><th>Proyek</th><th>UE I</th><th class="r" title="Σ(skor K × bobot aktif) ÷ 5 × 100">Skor<span>bobot aktif</span></th><th class="kka-cat" title="P1 Utama ≥ '+D.c.p1+' · P2 Tinggi ≥ '+D.c.p2+' · P3 Menengah ≥ '+D.c.p3+' · P4 Rendah/Tunda">Kat.</th>'+hdG+'<th>Hasil gate</th>'+hdK+'</tr></thead><tbody>'+(tr||'<tr><td colspan="18" class="kka-empty">Tidak ada proyek sesuai filter.</td></tr>')+'</tbody></table></div>'+
  (!scopeNon?'<p class="kka-note">Proyek pada program ISTK diprioritaskan otomatis (tidak dinilai MCDA) dan mengambil pagu & SDM lebih dulu; yang dinilai hanya usulan non-ISTK.</p>':'')+(scopeNon?'<p class="kka-note kka-warn">Proyek di luar ISTK ikut dinilai dan berbagi pagu & SDM pada roadmap, tetapi tidak masuk Penetapan Program, Charter, Draft RKMK, maupun WBS, dan tidak dipantau PMO Kemenkeu. Pengelolaannya oleh unit pemilik proses bisnis bersama unit TI sesuai tata kelola SPBE.</p>':'')+rubLegend()+'<p class="kka-note">Skor 1–5 per kriteria mengikuti rubrik di atas (juga pada ikon ⓘ judul kolom dan saat dropdown dibuka). K7 terbalik: 5 = risiko terendah. Gate dan estimasi biaya/SDM juga dapat diisi di Pemetaan Proyek › Usulan Proyek. Hasil adalah bahan keputusan; keputusan akhir pada forum tata kelola.</p>';
}
function rubLegend(){
 const open=!!ui().rubOpen;
 return '<details class="kka-card kka-rub" data-kka-rub'+(open?' open':'')+'><summary><b>Arti skor 1–5 tiap kriteria</b><small>5 = paling mendukung untuk diprioritaskan · K7 terbalik: 5 = risiko terendah</small></summary>'+
  '<div class="kka-scroll"><table class="kka-t kka-ref"><thead><tr><th>Kriteria</th><th>1 – Sangat rendah</th><th>2 – Rendah</th><th>3 – Sedang</th><th>4 – Tinggi</th><th>5 – Sangat tinggi</th></tr></thead><tbody>'+
  KR.map(k=>'<tr><td><b>'+k.c+' '+E(k.n)+'</b></td>'+RUB[k.c].map(t=>'<td>'+E(t)+'</td>').join('')+'</tr>').join('')+
  '<tr><td><b>Kategori</b></td><td colspan="5">'+(()=>{const c=cfg();return '<span class="kka-chip kka-pc p1">P1</span> Utama (skor ≥ '+c.p1+') · <span class="kka-chip kka-pc p2">P2</span> Tinggi (≥ '+c.p2+') · <span class="kka-chip kka-pc p3">P3</span> Menengah (≥ '+c.p3+') · <span class="kka-chip kka-pc p4">P4</span> Rendah/Tunda. Skor = Σ(skor K × bobot aktif) ÷ 5 × 100.'})()+'</td></tr><tr><td><b>Gate G1–G4</b></td><td colspan="5">☑ dicentang = Ya · ☐ tidak dicentang = Tidak → <b>Tinjau Ulang</b> · kotak bergaris putus-putus = belum dijawab → <b>Lengkapi</b>. Hanya usulan <b>Lolos</b> (G1–G4 semua Ya) yang diranking (sesuai pengaturan).</td></tr></tbody></table></div></details>';
}
const KCOL=['#3B6FD1','#6C8FE0','#C08B1F','#E0A82E','#2F8F6A','#1D3A78','#8E5BB8'];
const PDESC={'Seimbang':'Porsi merata antara strategi, manfaat, kesiapan, dan risiko.','Prioritas Kepatuhan':'Menonjolkan mandat regulasi & urgensi (K3, K4).','Prioritas Efisiensi':'Menonjolkan nilai bisnis & reusability (K2, K5).'};
function criteriaView(D){
 const c=D.c,ed=canCfg(),dis=ed?'':' disabled',sum=a=>a.reduce((x,y)=>x+(+y||0),0);
 const shortRef=r=>String(r||'').replace(/\s*\([^)]*\)/g,'').split(/;\s*/).map(x=>x.replace(/^COBIT 2019\s*/,'COBIT ').trim()).filter(Boolean).slice(0,3);
 const head='<div class="kkb-strip"><div><h3>Kriteria & Bobot · '+D.y+'</h3><p>Berlaku untuk seluruh usulan Non-ISTK tahun ini. Setiap perubahan langsung menghitung ulang skor dan peringkat.</p></div><span class="kkb-sp"></span>'+
  '<span class="kkb-saved">✓ Tersimpan otomatis</span>'+(ed?'<button type="button" class="btn btn-sm" data-kka-wreset>↺ Bobot bawaan</button>':'<span class="kkb-lock">🔒 Hanya Superadmin & PMO Kemenkeu yang dapat mengubah</span>')+'</div>';
 const profs='<div class="kkb-sech"><h4>Profil bobot</h4><small>'+(ed?'klik untuk menjadikan profil aktif · ':'')+'total tiap profil harus 100%</small></div><div class="kkb-profs">'+PROFILES.map(pr=>{const w=c.weights[pr],t=sum(w),on=pr===c.profile;
  return '<button type="button" class="kkb-prof'+(on?' on':'')+'" data-kka-setprof="'+E(pr)+'"'+(ed?'':' disabled')+'><span class="kkb-tot '+(t===100?'ok':'bad')+'">'+(t===100?'✓ 100%':fmt(t)+'%')+'</span><div class="kkb-pt"><b>'+E(pr)+'</b>'+(on?'<i>AKTIF</i>':'')+'</div><p>'+E(PDESC[pr]||'')+'</p><div class="kkb-stack">'+w.map((v,i)=>'<i style="width:'+(v/Math.max(100,t)*100)+'%;background:'+KCOL[i]+'" title="'+KR[i].c+' '+v+'%"></i>').join('')+'</div><div class="kkb-leg">'+KR.map((k,i)=>'<span>'+k.c+' '+fmt(w[i])+'</span>').join('')+'</div></button>'}).join('')+'</div>';
 const th='<thead><tr><th>Kriteria & pertanyaan penilaian</th>'+PROFILES.map(pr=>'<th class="kkb-pc'+(pr===c.profile?' on':'')+'">'+E(pr.replace('Prioritas ',''))+'<small>'+(pr===c.profile?'● profil aktif':'&nbsp;')+'</small></th>').join('')+'</tr></thead>';
 const tb='<tbody>'+KR.map((k,i)=>'<tr><td><div class="kkb-kc"><code style="background:'+KCOL[i]+'">'+k.c+'</code><div><b>'+E(k.n)+'</b><small>'+E(k.q)+'</small><div class="kkb-refs">'+shortRef(k.ref).map(r=>'<span title="'+E(k.ref)+'">'+E(r)+'</span>').join('')+'</div></div></div></td>'+
  PROFILES.map(pr=>{const v=c.weights[pr][i];return '<td class="kkb-pc'+(pr===c.profile?' on':'')+'"><span class="kkb-step">'+(ed?'<button type="button" data-kka-wstep="'+E(pr)+'|'+i+'|-5" aria-label="Turunkan bobot '+k.c+'">−</button>':'')+'<input type="number" min="0" max="100" step="1" data-kka-w="'+E(pr)+'|'+i+'" value="'+v+'"'+dis+' aria-label="Bobot '+E(k.c+' '+pr)+'"><em>%</em>'+(ed?'<button type="button" data-kka-wstep="'+E(pr)+'|'+i+'|5" aria-label="Naikkan bobot '+k.c+'">+</button>':'')+'</span><div class="kkb-mbar"><i style="width:'+Math.min(100,v*2.5)+'%;background:'+KCOL[i]+'"></i></div></td>'}).join('')+'</tr>').join('')+'</tbody>';
 const tf='<tfoot><tr><td>Total bobot</td>'+PROFILES.map(pr=>{const t=sum(c.weights[pr]);return '<td class="kkb-pc'+(pr===c.profile?' on':'')+'"><span class="kkb-chk '+(t===100?'ok':'bad')+'">'+(t===100?'✓ 100%':fmt(t)+'% · '+(t<100?'kurang '+fmt(100-t):'lebih '+fmt(t-100)))+'</span>'+(t!==100&&t>0&&ed?'<button type="button" class="kkb-fix" data-kka-wfix="'+E(pr)+'">Normalisasi ke 100%</button>':'')+'</td>'}).join('')+'</tr></tfoot>';
 const w=c.weights[c.profile],tA=sum(w),r=54,C=2*Math.PI*r;let acc=0;
 const donut='<svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="Komposisi bobot profil aktif"><circle cx="75" cy="75" r="'+r+'" fill="none" stroke="#EEF2F7" stroke-width="18"/>'+w.map((v,i)=>{const l=v/Math.max(tA,1)*C,o='<circle cx="75" cy="75" r="'+r+'" fill="none" stroke="'+KCOL[i]+'" stroke-width="18" stroke-dasharray="'+l+' '+(C-l)+'" stroke-dashoffset="'+(-acc)+'" transform="rotate(-90 75 75)"/>';acc+=l;return o}).join('')+'<text x="75" y="72" text-anchor="middle" font-size="22" font-weight="900" fill="'+(tA===100?'#0F2346':'#B42318')+'">'+fmt(tA)+'%</text><text x="75" y="90" text-anchor="middle" font-size="10" fill="#64748B">total bobot</text></svg>';
 const nv=sum(w.slice(0,5)),ke=sum(w.slice(5)),top=w.indexOf(Math.max(...w));
 const side='<aside class="kkb-side"><h4>Profil aktif · '+E(c.profile)+'</h4><p>Porsi tiap kriteria terhadap skor akhir (0–100).</p><div class="kkb-donut">'+donut+'</div><div class="kkb-dl">'+KR.map((k,i)=>'<div><i style="background:'+KCOL[i]+'"></i><b>'+k.c+'</b><span>'+E(k.n.replace(' – skor 5 = terendah',''))+'</span><em>'+fmt(w[i])+'%</em></div>').join('')+'</div>'+
  '<div class="kkb-grp"><small>Nilai vs Kemudahan (dipakai kuadran)</small><div class="kkb-gb"><div style="width:'+nv/Math.max(tA,1)*100+'%;background:#1D3A78">'+fmt(nv)+'%</div><div style="width:'+ke/Math.max(tA,1)*100+'%;background:#2F8F6A">'+fmt(ke)+'%</div></div><div class="kkb-gbl"><span>■ Nilai (K1–K5)</span><span style="color:#2F8F6A">Kemudahan (K6–K7) ■</span></div></div>'+
  '<div class="kkb-tip">'+(tA===100?'Kriteria paling berpengaruh: <b>'+KR[top].c+' '+E(KR[top].n.replace(' – skor 5 = terendah',''))+'</b> ('+fmt(w[top])+'%). Skor 5 pada kriteria ini menyumbang '+fmt(w[top])+' poin.':'⚠ Total profil aktif <b>'+fmt(tA)+'%</b>. Skor belum bisa dihitung dengan benar sampai total tepat 100%.')+'</div></aside>';
 const inp=(k,l,h,pre,suf)=>'<div class="kkb-fld"><label>'+l+ic(h)+'</label><div class="kkb-inp">'+(pre?'<span>'+pre+'</span>':'')+'<input type="number" min="0" step="any" data-kka-cfg="'+k+'" value="'+E(c[k])+'"'+dis+'>'+(suf?'<span class="r">'+suf+'</span>':'')+'</div></div>';
 const s=D.sum||{},usedC=+s.istkCost||0,usedS=+s.istkSdm||0,pc=(u,t)=>t>0?Math.min(100,u/t*100):0;
 const ord=c.p1>c.p2&&c.p2>c.p3&&c.p3>0&&c.p1<=100;
 const band=ord?'<div class="kkb-band"><div style="width:'+c.p3+'%;background:#F1F5F9;color:#475569">P4 &lt; '+fmt(c.p3)+'</div><div style="width:'+(c.p2-c.p3)+'%;background:#FFF0C2;color:#7A5300">P3</div><div style="width:'+(c.p1-c.p2)+'%;background:#D7F0E2;color:#0F5E3B">P2</div><div style="width:'+(100-c.p1)+'%;background:#0F7A4B;color:#fff">P1 ≥ '+fmt(c.p1)+'</div></div>':'<div class="kkb-err">⚠ Urutan ambang harus P1 &gt; P2 &gt; P3 (semua 1–100).</div>';
 const sets='<div class="kkb-sech"><h4>Pengaturan</h4><small>batas roadmap, kategori prioritas, dan analisis pendukung</small></div><div class="kkb-sets">'+
  '<div class="kkb-box"><h5><i>💰</i>Anggaran & kapasitas</h5><p>Batas pengisian roadmap. Proyek ISTK mengambil lebih dulu.</p>'+inp('pagu','Pagu anggaran pengembangan','Pagu indikatif/definitif; batas roadmap.','Rp','juta')+inp('sdm','Kapasitas SDM pengembangan','Jumlah personel pengembang/analis × bulan efektif.','','org-bln')+
   '<div class="kkb-util"><div class="kkb-meter"><small>Terpakai ISTK</small><b>Rp '+fmt(usedC)+' jt</b><div class="kkb-mbar w"><i style="width:'+pc(usedC,c.pagu)+'%;background:'+(usedC>=c.pagu?'#B42318':'#1D3A78')+'"></i></div></div><div class="kkb-meter"><small>Terpakai ISTK</small><b>'+fmt(usedS,1)+' org-bln</b><div class="kkb-mbar w"><i style="width:'+pc(usedS,c.sdm)+'%;background:'+(usedS>=c.sdm?'#B42318':'#1D3A78')+'"></i></div></div></div>'+
   (usedC>=c.pagu||usedS>=c.sdm?'<div class="kkb-warn">⚠ '+(usedC>=c.pagu?'Pagu':'Kapasitas SDM')+' sudah habis oleh proyek ISTK — usulan Non-ISTK akan menjadi Cadangan.</div>':'<div class="kkb-hint">Sisa untuk Non-ISTK: Rp '+fmt(Math.max(0,c.pagu-usedC))+' jt · '+fmt(Math.max(0,c.sdm-usedS),1)+' org-bln</div>')+'</div>'+
  '<div class="kkb-box"><h5><i>🏷</i>Kategori prioritas</h5><p>Ambang skor tertimbang untuk P1–P3; di bawah P3 = P4 (Rendah/Tunda).</p>'+band+'<div class="kkb-ticks"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div><div class="kkb-thr3">'+
   [['p1','#0F7A4B','P1 Utama ≥'],['p2','#7CC79F','P2 Tinggi ≥'],['p3','#F2C94C','P3 Menengah ≥']].map(x=>'<div class="kkb-fld"><label><span class="kkb-dot" style="background:'+x[1]+'"></span>'+x[2]+'</label><div class="kkb-inp"><input type="number" min="0" max="100" step="any" data-kka-cfg="'+x[0]+'" value="'+E(c[x[0]])+'"'+dis+'></div></div>').join('')+'</div></div>'+
  '<div class="kkb-box"><h5><i>⚙</i>Analisis</h5><p>Aturan ranking dan pembanding.</p><label class="kkb-toggle"><span><b>Ranking hanya usulan Lolos gate</b><small>'+(c.onlyPassed==='Ya'?'Usulan Tinjau Ulang/Lengkapi tidak ikut ranking':'Semua usulan berskor lengkap ikut ranking')+'</small></span><span class="kkb-sw"><input type="checkbox" data-kka-olsw'+(c.onlyPassed==='Ya'?' checked':'')+dis+' aria-label="Ranking hanya usulan Lolos gate"><i></i></span></label>'+
   inp('quadThr','Ambang kuadran Nilai & Kemudahan','Skor ≥ ambang dianggap tinggi (60 ≈ rata-rata 3 dari 5).','','/ 100')+inp('tol','Toleransi selisih peringkat',"Rentang peringkat antar-profil ≤ nilai ini → Stabil; selisih MCDA vs WSJF ≤ nilai ini → Konsisten.",'','peringkat')+'<div class="kkb-hint">≤ '+fmt(c.tol)+' → Stabil / Konsisten</div></div></div>';
 return '<div class="kkb">'+head+profs+'<div class="kkb-sech"><h4>Bobot kriteria</h4><small>skala skor 1–5 · K7 terbalik (5 = risiko terendah)</small></div><div class="kkb-wgrid"><div class="kkb-card"><table class="kkb-wt">'+th+tb+tf+'</table></div>'+side+'</div>'+sets+
  '<div class="kkb-foot">⚖ <span><b>Catatan.</b> Bobot dan ambang awal adalah asumsi penyusun Kertas Kerja A — sepakati melalui forum.</span></div></div>';
}
function quadSvg(D){
 const W=640,H=320,m=48,R=D.R.filter(r=>r.value!=null),t=D.c.quadThr,X=v=>m+(v/100)*(W-m-16),Y=v=>H-m-(v/100)*(H-m-16);
 let s='<svg class="kka-quad" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Kuadran Nilai–Kemudahan">';
 s+='<rect x="'+X(t)+'" y="'+Y(100)+'" width="'+(X(100)-X(t))+'" height="'+(Y(t)-Y(100))+'" fill="#E7F6EE"/><rect x="'+X(0)+'" y="'+Y(100)+'" width="'+(X(t)-X(0))+'" height="'+(Y(t)-Y(100))+'" fill="#E8F0FB"/><rect x="'+X(t)+'" y="'+Y(t)+'" width="'+(X(100)-X(t))+'" height="'+(Y(0)-Y(t))+'" fill="#FFF7E0"/><rect x="'+X(0)+'" y="'+Y(t)+'" width="'+(X(t)-X(0))+'" height="'+(Y(0)-Y(t))+'" fill="#F6F7F9"/>';
 [['Quick Win',X(100)-6,Y(100)+16,'end'],['Proyek Strategis',X(0)+6,Y(100)+16,'start'],['Pelengkap',X(100)-6,Y(0)-8,'end'],['Tunda / Kaji Ulang',X(0)+6,Y(0)-8,'start']].forEach(q=>s+='<text x="'+q[1]+'" y="'+q[2]+'" text-anchor="'+q[3]+'" class="kka-ql">'+q[0]+'</text>');
 s+='<line x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(100)+'" y2="'+Y(0)+'" stroke="#94A3B8"/><line x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(0)+'" y2="'+Y(100)+'" stroke="#94A3B8"/>';
 [0,20,40,60,80,100].forEach(v=>{s+='<text x="'+X(v)+'" y="'+(Y(0)+16)+'" text-anchor="middle" class="kka-ax">'+v+'</text><text x="'+(X(0)-6)+'" y="'+(Y(v)+4)+'" text-anchor="end" class="kka-ax">'+v+'</text>'});
 s+='<text x="'+((X(0)+X(100))/2)+'" y="'+(H-8)+'" text-anchor="middle" class="kka-at">Kemudahan (K6–K7)</text><text transform="translate(14 '+((Y(0)+Y(100))/2)+') rotate(-90)" text-anchor="middle" class="kka-at">Nilai Manfaat (K1–K5)</text>';
 R.forEach(r=>{const f=r.rec&&r.rec.indexOf('Didanai')===0;s+='<g><circle cx="'+X(r.ease)+'" cy="'+Y(r.value)+'" r="7" fill="'+(f?'#1F5FB8':'#fff')+'" stroke="#1F5FB8" stroke-width="2"><title>'+E(r.name+' · Nilai '+r.value+' · Kemudahan '+r.ease)+'</title></circle><text x="'+(X(r.ease)+10)+'" y="'+(Y(r.value)+4)+'" class="kka-pl">'+r.rank+'</text></g>'});
 return s+'</svg>';
}
function roadmapView(D){
 const R=D.IST.concat(D.R.slice().sort((a,b)=>a.rank-b.rank)),c=D.c,y=D.y,rest=c.pagu-D.sum.costFunded;
 const road=R.map(r=>'<tr'+(r.istk?' class="kka-istkrow"':'')+'><td class="kka-rk">'+(r.istk?'<span class="kka-chip kka-istk">ISTK</span>':r.rank)+'</td><td class="kka-nm"><b>'+E(r.name)+'</b><small>'+E([r.code,r.p.nama].filter(Boolean).join(' · '))+'</small></td><td>'+E(r.uic)+'</td><td><small>'+E(r.jenis||'—')+'</small></td><td class="kka-sc">'+(r.istk?'—':fmt(r.score,2))+'</td><td>'+(r.istk?'<small>Otomatis</small>':'<span class="kka-chip '+catCls(r.cat)+'">'+E(r.cat)+'</span>')+'</td><td>'+E(r.quad||'—')+'</td><td class="n">'+fmt(r.cost,2)+'</td><td class="n">'+fmt(r.dur,1)+'</td><td class="n">'+fmt(r.sdmN,1)+'</td><td><span class="kka-chip '+(r.rec.indexOf('Didanai')===0||r.rec==='ISTK · prioritas otomatis'?'ok':/lengkapi/i.test(r.rec)?'warn':'bad')+'">'+E(r.rec)+'</span></td><td class="n">'+fmt(r.cumC,2)+'</td><td class="n">'+fmt(r.cumS,1)+'</td><td><small>'+E(r.appr)+'</small></td><td class="n">'+(r.istk?'—':r.rankUe)+'</td></tr>').join('');
 const an=D.R.slice().sort((a,b)=>a.rank-b.rank).map(r=>'<tr><td class="kka-nm"><b>'+E(r.name)+'</b><small>'+E(r.code)+'</small></td>'+r.prof.map(v=>'<td class="n">'+fmt(v,2)+'</td>').join('')+r.rp.map(v=>'<td class="n">'+v+'</td>').join('')+'<td class="n">'+r.best+'–'+r.worst+'</td><td><span class="kka-chip '+(r.stab==='Stabil'?'ok':'warn')+'">'+r.stab+'</span></td><td class="n">'+fmt(r.value,1)+'</td><td class="n">'+fmt(r.ease,1)+'</td><td>'+E(r.quad)+'</td><td class="n">'+fmt(r.wsjf,2)+'</td><td class="n">'+r.rankW+'</td><td class="n">'+r.rank+'</td><td><span class="kka-chip '+(r.cons==='Konsisten'?'ok':'warn')+'">'+r.cons+'</span></td></tr>').join('');
 const qc=QUADS.map(q=>'<li><b>'+R.filter(r=>r.quad===q).length+'</b> '+q+'</li>').join('');
 return kpis(D)+'<div class="kka-card"><div class="kka-cardh"><h3>Roadmap Pengembangan '+y+ic('Proyek program ISTK diprioritaskan otomatis dan mengambil pagu & SDM lebih dulu. Sisa pagu & SDM diisi usulan non-ISTK mulai peringkat 1 (aturan greedy); bila biaya ATAU SDM kumulatif melampaui batas, usulan menjadi Cadangan / Tunda dan usulan berikutnya yang masih muat tetap dapat didanai. Biaya bukan kriteria skor.')+'</h3>'+
  (D.sum.istkCost>c.pagu||D.sum.istkSdm>c.sdm?'<span class="kka-chip bad" title="Biaya/SDM proyek ISTK saja sudah melampaui pagu/kapasitas; usulan non-ISTK tidak dapat didanai tanpa tambahan pagu/kapasitas.">ISTK melampaui '+(D.sum.istkCost>c.pagu?'pagu':'')+(D.sum.istkCost>c.pagu&&D.sum.istkSdm>c.sdm?' & ':'')+(D.sum.istkSdm>c.sdm?'kapasitas SDM':'')+'</span>':'')+
  '<span class="kka-sp"></span><small>Sisa pagu: <b>Rp '+fmt(rest,2)+' jt</b> · Profil: <b>'+E(c.profile)+'</b></small><button type="button" class="btn btn-sm" data-kka-xlsx>⇩ Excel</button>'+(canCfg()?'<button type="button" class="btn btn-sm pri" data-kka-snap>💾 Simpan ke Repositori</button>':'')+'</div>'+
  '<div class="kka-scroll"><table class="kka-t"><thead><tr><th>Rank</th><th>Proyek</th><th>UE I</th><th>Jenis Inisiatif</th><th>Skor</th><th>Kategori</th><th>Kuadran</th><th>Biaya (Rp jt)</th><th>Durasi (bln)</th><th>SDM (org-bln)</th><th>Rekomendasi '+y+'</th><th>Biaya kumulatif</th><th>SDM kumulatif</th><th>Saran pendekatan</th><th>Rank UE I</th></tr></thead><tbody>'+(road||'<tr><td colspan="15" class="kka-empty">Belum ada usulan yang diranking.</td></tr>')+'</tbody></table></div></div>'+
  '<div class="kka-grid2"><div class="kka-card"><h3>Kuadran Nilai–Kemudahan'+ic('Nilai Manfaat = K1–K5; Kemudahan = K6–K7, diboboti sesuai profil aktif. Titik biru penuh = rekomendasi didanai; angka = peringkat.')+'</h3>'+quadSvg(D)+'<ul class="kka-ql2">'+qc+'</ul></div>'+
  '<div class="kka-card"><h3>Distribusi Kategori Prioritas</h3><ul class="kka-bars">'+CATS.map(k=>{const n=D.rows.filter(r=>r.cat===k).length,t=Math.max(1,D.rows.filter(r=>r.full).length);return '<li><span>'+E(k)+'</span><i><em class="'+catCls(k)+'" style="width:'+Math.round(n/t*100)+'%"></em></i><b>'+n+'</b></li>'}).join('')+'<li><span>Belum dinilai lengkap</span><i><em style="width:0"></em></i><b>'+(D.sum.total-D.sum.lengkap)+'</b></li></ul>'+
  '<h3 style="margin-top:14px">Gate Penyaringan</h3><ul class="kka-bars">'+GATES.map((g,i)=>{const ya=D.rows.filter(r=>r.g[i]==='Ya').length,tdk=D.rows.filter(r=>r.g[i]==='Tidak').length;return '<li><span>'+g[1]+' – '+E(g[2])+'</span><b>Ya '+ya+' · Tidak '+tdk+' · Kosong '+(D.sum.total-ya-tdk)+'</b></li>'}).join('')+'</ul></div></div>'+
  '<div class="kka-card"><h3>Analisis Sensitivitas & Pembanding WSJF'+ic("Skor & peringkat dihitung ulang dengan tiap profil bobot. 'Stabil' = rentang peringkat ≤ toleransi. WSJF = (K2+K4+K5) ÷ (6−K7); 'Konsisten' bila selisih peringkat WSJF vs skor tertimbang ≤ toleransi.")+'</h3>'+
  '<div class="kka-scroll"><table class="kka-t"><thead><tr><th>Proyek</th>'+PROFILES.map(p=>'<th>Skor – '+E(p.replace('Prioritas ',''))+'</th>').join('')+PROFILES.map(p=>'<th>Rank – '+E(p.replace('Prioritas ',''))+'</th>').join('')+'<th>Rentang</th><th>Stabilitas</th><th>Nilai Manfaat</th><th>Kemudahan</th><th>Kuadran</th><th>WSJF</th><th>Rank WSJF</th><th>Rank skor aktif</th><th>MCDA vs WSJF</th></tr></thead><tbody>'+(an||'<tr><td colspan="15" class="kka-empty">Belum ada usulan yang diranking.</td></tr>')+'</tbody></table></div></div>';
}
/* ---------- repositori hasil ---------- */
const snaps=y=>{const st=store(),pre='snap-'+(y||year())+'-';return Object.keys(st).filter(k=>k.indexOf(pre)===0).map(k=>Object.assign({key:k},st[k])).sort((a,b)=>(b.version||0)-(a.version||0))};
function snapRows(D){return D.IST.concat(D.R.slice().sort((a,b)=>a.rank-b.rank)).map(r=>({istk:!!r.istk,rank:r.rank,rankUe:r.rankUe,pid:r.id,code:r.code,name:r.name,program:r.p.nama,uic:r.uic,jenis:r.jenis,gate:r.gate,g:r.g,s:r.s,score:r.score,cat:r.cat,quad:r.quad,value:r.value,ease:r.ease,cost:r.cost,dur:r.dur,sdm:r.sdmN,rec:r.rec,cumC:r.cumC,cumS:r.cumS,wsjf:r.wsjf,rankW:r.rankW,stab:r.stab,cons:r.cons,prof:r.prof,rp:r.rp}))}
function repoView(D){
 const L=snaps(D.y),ed=canCfg(),final=L.find(s=>s.status==='Final');
 const rows=L.map(s=>'<tr><td><b>v'+s.version+'</b></td><td class="kka-nm"><b>'+E(s.title)+'</b><small>'+E(s.note||'')+'</small></td><td>'+E(new Date(s.at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}))+'<small>'+E(s.byName||s.by||'')+'</small></td><td><span class="kka-chip '+(s.status==='Final'?'ok':'warn')+'">'+E(s.status)+'</span></td><td>'+E(s.cfg.profile)+'</td><td class="n">'+(s.rows||[]).filter(r=>!r.istk).length+'</td><td class="n">'+(s.sum?s.sum.nFunded:'—')+'</td><td class="n">'+(s.sum?fmt(s.sum.costFunded,2):'—')+'</td><td class="kka-act"><button type="button" class="btn btn-sm" data-kka-snapview="'+E(s.key)+'">Lihat</button><button type="button" class="btn btn-sm" data-kka-snapx="'+E(s.key)+'">⇩ Excel</button>'+
  (ed&&s.status!=='Final'?'<button type="button" class="btn btn-sm" data-kka-snapfinal="'+E(s.key)+'">Tandai Final</button>':'')+(ed&&s.status!=='Final'?'<button type="button" class="btn btn-sm dng" data-kka-snapdel="'+E(s.key)+'">Hapus</button>':'')+'</td></tr>').join('');
 return '<div class="kka-card"><div class="kka-cardh"><h3>Repositori Hasil Prioritasi · '+D.y+ic('Setiap penyimpanan membekukan pengaturan, bobot, skor, peringkat, dan roadmap pada saat itu menjadi versi baru. Versi Final menandai hasil yang dibahas/ditetapkan forum tata kelola; versi Final tidak dapat dihapus.')+'</h3><span class="kka-sp"></span>'+
  (final?'<small>Hasil final: <b>v'+final.version+' · '+E(final.title)+'</b></small>':'<small>Belum ada hasil final.</small>')+(ed?'<button type="button" class="btn btn-sm pri" data-kka-snap>💾 Simpan hasil saat ini</button>':'')+'</div>'+
  '<div class="kka-scroll"><table class="kka-t"><thead><tr><th>Versi</th><th>Judul & catatan</th><th>Disimpan</th><th>Status</th><th>Profil</th><th>Diranking</th><th>Didanai</th><th>Biaya didanai (Rp jt)</th><th>Aksi</th></tr></thead><tbody>'+(rows||'<tr><td colspan="9" class="kka-empty">Belum ada hasil prioritasi yang disimpan untuk tahun '+D.y+'.</td></tr>')+'</tbody></table></div>'+
  (FB_DENIED()?'<p class="kka-note kka-warn">Penyimpanan bersama (Firestore) untuk Repositori belum aktif: perbarui Firestore Rules melalui Pengaturan › Database. Sementara itu hasil hanya tersimpan di sesi ini.</p>':'')+'</div>';
}
const FB_DENIED=()=>{try{return typeof FB!=='undefined'&&!!(FB.optDenied&&FB.optDenied.psKka)}catch(_){return false}};
function snapDialog(){
 const D=compute();if(!D.R.length){say('Belum ada usulan yang diranking untuk disimpan.');return}
 const L=snaps(D.y),v=(L[0]?.version||0)+1,today=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
 modal('Simpan ke Repositori Hasil',`<div class="fgrid"><div class="fld wide"><label for="kka-st">Judul</label><input id="kka-st" value="${E('Hasil Prioritas SI '+D.y+' · '+today)}"></div>
 <div class="fld wide"><label for="kka-sn">Catatan</label><textarea id="kka-sn" rows="3" placeholder="Mis. bahan rapat forum tata kelola TI, perubahan bobot, dsb."></textarea></div>
 <div class="fld"><label for="kka-ss">Status</label><select id="kka-ss"><option>Draft</option><option>Final</option></select></div></div>
 <p class="s" style="margin:8px 0 0">Versi v${v}: ${D.R.length} usulan diranking, ${D.sum.nFunded} rekomendasi didanai, profil ${E(D.c.profile)}. Menandai Final akan menjadikan versi Final sebelumnya sebagai Draft.</p>`,'Simpan',o=>{
  const title=T(o.querySelector('#kka-st').value);if(!title){say('Judul wajib diisi.');return false}
  const status=o.querySelector('#kka-ss').value,id=uid(),st=store();
  if(status==='Final')L.forEach(s=>{if(s.status==='Final')st[s.key].status='Draft'});
  const c=Object.assign({},D.c);delete c.year;
  st['snap-'+D.y+'-'+id]={id,year:D.y,version:v,title,note:T(o.querySelector('#kka-sn').value),status,at:new Date().toISOString(),by:me()?.email||'',byName:me()?.nama||'',cfg:c,sum:D.sum,rows:snapRows(D)};
  try{log('Simpan hasil prioritasi KKA',D.y+' v'+v+' ('+status+')')}catch(_){}save();render();say('Hasil prioritasi tersimpan sebagai v'+v+'.')},{size:'sm'});
}
function snapView(key){
 const s=store()[key];if(!s)return;const now=compute(s.year),cur={};now.R.forEach(r=>cur[r.id]=r.rank);
 const tr=(s.rows||[]).map(r=>{const c=cur[r.pid],d=r.istk?'—':c==null?'<small>keluar</small>':c===r.rank?'=':c<r.rank?'<b class="up">▲'+(r.rank-c)+'</b>':'<b class="dn">▼'+(c-r.rank)+'</b>';
  return '<tr><td class="kka-rk">'+(r.istk?'<span class="kka-chip kka-istk">ISTK</span>':r.rank)+'</td><td class="kka-nm"><b>'+E(r.name)+'</b><small>'+E([r.code,r.program].filter(Boolean).join(' · '))+'</small></td><td>'+E(r.uic)+'</td><td class="kka-sc">'+(r.istk?'—':fmt(r.score,2))+'</td><td>'+(r.istk?'<small>Otomatis</small>':'<span class="kka-chip '+catCls(r.cat)+'">'+E(r.cat)+'</span>')+'</td><td>'+E(r.quad)+'</td><td class="n">'+fmt(r.cost,2)+'</td><td class="n">'+fmt(r.sdm,1)+'</td><td>'+E(r.rec)+'</td><td class="n">'+d+'</td></tr>'}).join('');
 modal('v'+s.version+' · '+s.title,`<p class="s" style="margin:0 0 8px">${E(s.status)} · disimpan ${E(new Date(s.at).toLocaleString('id-ID'))} oleh ${E(s.byName||s.by||'—')} · profil ${E(s.cfg.profile)} · pagu Rp ${fmt(s.cfg.pagu)} jt · kapasitas ${fmt(s.cfg.sdm)} org-bln${s.note?'<br>'+E(s.note):''}</p>
 <div class="kka-scroll" style="max-height:60vh"><table class="kka-t"><thead><tr><th>Rank</th><th>Proyek</th><th>UE I</th><th>Skor</th><th>Kategori</th><th>Kuadran</th><th>Biaya (Rp jt)</th><th>SDM</th><th>Rekomendasi</th><th>Rank sekarang</th></tr></thead><tbody>${tr}</tbody></table></div>`,'Tutup',()=>{},{size:'wide'});
}
/* ---------- Excel ---------- */
function workbook(data){
 const X=window.XLSX;if(!X)throw Error('Pustaka Excel belum termuat.');const wb=X.utils.book_new(),c=data.cfg;
 const add=(name,aoa,cols)=>{const ws=X.utils.aoa_to_sheet(aoa);if(cols)ws['!cols']=cols.map(w=>({wch:w}));X.utils.book_append_sheet(wb,ws,name)};
 add('Kriteria',[['Kriteria, Bobot, dan Pengaturan · '+data.year],[],['Profil bobot aktif',c.profile],["Hanya usulan 'Lolos' gate yang diranking?",c.onlyPassed],['Pagu anggaran pengembangan (Rp juta)',c.pagu],['Kapasitas SDM (orang-bulan)',c.sdm],['Ambang kuadran',c.quadThr],['Ambang P1',c.p1],['Ambang P2',c.p2],['Ambang P3',c.p3],['Toleransi peringkat',c.tol],[],
  ['Kode','Kriteria','Pertanyaan',...PROFILES,'Bobot aktif'],...KR.map((k,i)=>[k.c,k.n,k.q,...PROFILES.map(p=>c.weights[p][i]/100),c.weights[c.profile][i]/100])],[10,40,60,12,12,12,12]);
 add('Penilaian',[['Rank','Rank per UE I','Kode','Nama Sistem / Modul','Program','UE I','Jenis Inisiatif',...GATES.map(g=>g[1]+' '+g[2]),'Hasil Gate',...KR.map(k=>k.c+' '+k.s),'Skor Tertimbang (0–100)','Kategori Prioritas'],
  ...data.rows.filter(r=>!r.istk).map(r=>[r.rank??'',r.rankUe??'',r.code,r.name,r.program,r.uic,r.jenis,...r.g,r.gate,...r.s.map(v=>v??''),r.score??'',r.cat||''])],[6,8,18,40,30,10,24,10,10,10,10,12,8,8,8,8,8,8,8,12,22]);
 const R=data.rows.filter(r=>r.rank),RI=data.rows.filter(r=>r.istk).concat(R.slice().sort((a,b)=>a.rank-b.rank));
 add('Ringkasan',[['Ringkasan Prioritas & Roadmap Pengembangan '+data.year],[],['Proyek ISTK (prioritas otomatis)',data.sum?.istk??data.rows.filter(r=>r.istk).length],['Usulan non-ISTK diranking',R.length],['Pagu (Rp juta)',c.pagu],['Biaya didanai (Rp juta)',data.sum?.costFunded??''],['Sisa pagu (Rp juta)',c.pagu-(data.sum?.costFunded||0)],['Jumlah didanai',data.sum?.nFunded??''],['SDM terpakai (org-bln)',data.sum?.sdmFunded??''],['Kapasitas SDM',c.sdm],[],
  ['Rank','Kode','Nama Sistem / Modul','Program','UE I','Jenis Inisiatif','Skor','Kategori','Kuadran','Biaya (Rp juta)','Durasi (bln)','SDM (org-bln)','Rekomendasi','Biaya kumulatif','SDM kumulatif','Saran pendekatan','Rank per UE I'],
  ...RI.map(r=>[r.istk?'ISTK':r.rank,r.code,r.name,r.program,r.uic,r.jenis,r.istk?'':r.score,r.istk?'Otomatis':r.cat,r.quad||'',r.cost??'',r.dur??'',r.sdm??'',r.rec,r.cumC,r.cumS,r.istk?'Prioritas otomatis (program ISTK)':APPROACH[r.quad]||'',r.istk?'':r.rankUe])],[6,18,40,30,10,24,8,22,18,12,10,10,20,12,12,40,10]);
 add('Analisis',[['Kode','Nama Sistem / Modul',...PROFILES.map(p=>'Skor – '+p),...PROFILES.map(p=>'Rank – '+p),'Stabilitas','Nilai Manfaat','Kemudahan','Kuadran','WSJF','Rank WSJF','Rank skor aktif','MCDA vs WSJF'],
  ...R.map(r=>[r.code,r.name,...(r.prof||[]),...(r.rp||[]),r.stab,r.value,r.ease,r.quad,r.wsjf,r.rankW,r.rank,r.cons])],[18,40,12,12,12,10,10,10,14,12,12,18,8,10,10,14]);
 return wb;
}
function currentData(){const D=compute(),R={};const rows=D.rows.map(r=>({istk:!!r.istk,rank:r.rank,rankUe:r.rankUe,code:r.code,name:r.name,program:r.p.nama,uic:r.uic,jenis:r.jenis,gate:r.gate,g:r.g,s:r.s,score:r.score,cat:r.cat,quad:r.quad,value:r.value,ease:r.ease,cost:r.cost,dur:r.dur,sdm:r.sdmN,rec:r.rec,cumC:r.cumC,cumS:r.cumS,wsjf:r.wsjf,rankW:r.rankW,stab:r.stab,cons:r.cons,prof:r.prof,rp:r.rp}));
 const c=Object.assign({},D.c);return {year:D.y,cfg:c,sum:D.sum,rows}}
function downloadXlsx(data,name){const wb=workbook(data);window.XLSX.writeFile(wb,name)}
/* ---------- impor workbook Kertas Kerja A ---------- */
const nk=s=>T(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
/* Import Non-ISTK: durable, account-scoped outbox, confirmed transaction, no replacement of the whole portfolio with stale browser data. */
const cloudKka=()=>typeof FB!=='undefined'&&FB.on;
const kkaAccount=()=>cloudKka()&&FB.auth?.currentUser?.email?String(FB.auth.currentUser.email).toLowerCase():'';
const kkaOutboxKey=y=>{const a=kkaAccount();return a?'mt_kka_import_v1:'+FB.cfg.projectId+':'+a+':'+y:''};
const pendingMem=new Map(),pendingBusy=new Set(),pendingErrors=new Map();
function pendingImport(y){const k=kkaOutboxKey(y);if(!k)return null;try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):pendingMem.get(k)||null}catch(_){return pendingMem.get(k)||null}}
function queueImport(y,ops){const k=kkaOutboxKey(y);if(!k)throw Error('Login Firebase belum siap. Masuk ulang sebelum impor.');if(pendingImport(y))throw Error('Masih ada impor tertunda. Sinkronkan cadangan tersebut dahulu.');const job={id:uid(),year:+y,ops,createdAt:new Date().toISOString()};localStorage.setItem(k,JSON.stringify(job));pendingMem.set(k,job);return job}
const cloneKka=v=>JSON.parse(JSON.stringify(v));
const sameKka=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const importNameKey=v=>nk(T(v).replace(/^Satu\s+Kemenkeu\s*[/|:–—-]\s*/i,''));
function matchNon(rows,x){const id=T(x.psOriginRef),n=importNameKey(x.name);return rows.find(r=>x.id&&r.id===x.id)||rows.find(r=>id&&T(r.psOriginRef)===id)||rows.find(r=>n&&importNameKey(r.name)===n)}
const fillKeys=new Set(['initiativeType','uic','businessOwner','spbeDomain','description','urgency','legalBasis','strategyAlignment','businessProcess','businessNarrative','features','psOriginRef']);
function importDelta(old,x){const set={};Object.keys(x).forEach(k=>{if(k==='id'||k==='name')return;if(!sameKka(old?.[k],x[k]))set[k]=x[k]});if(set.kka){const diff={};Object.entries(set.kka).forEach(([k,v])=>{if(old?.kka?.[k]!==v)diff[k]=v});set.kka=diff}return {id:x.id,name:x.name,psOriginRef:x.psOriginRef||'',create:!old,set}}
function mergeImport(doc,job){
 const out=cloneKka(doc||{year:job.year,projects:[]});if(!Array.isArray(out.projects))throw Error('Format dokumen Non-ISTK di Firebase tidak valid.');
 for(const op of job.ops){let x=matchNon(out.projects,op);if(!x){if(!op.create)throw Error('Usulan '+op.name+' sudah tidak ada di Firebase. Periksa data sebelum mengulang impor.');x={id:op.id,name:op.name,status:'Usulan',included:true,nonIstk:true};out.projects.push(x)}
  for(const [k,v] of Object.entries(op.set)){if(k==='kka'){x.kka=Object.assign({},x.kka||{},v);continue}if(fillKeys.has(k)&&T(x[k]))continue;if(op.create&&['status','included','scores','poster','risks','indicators','benefits','psOriginYear','nonIstk'].includes(k)&&Object.prototype.hasOwnProperty.call(x,k))continue;x[k]=v}
 }
 out.year=job.year;out.updatedAt=job.createdAt;return out;
}
function pendingBanner(y){if(!cloudKka()||!canCfg())return '';const k=kkaOutboxKey(y),job=pendingImport(y),running=pendingBusy.has(k),err=pendingErrors.get(k);
 if(!job&&!FB_DENIED())return '';
 return '<div class="kka-syncnotice" role="status"><div><b>'+(job?(running?'Sedang menyimpan ke Firebase…':'Impor Non-ISTK belum terkonfirmasi Firebase'):'Koleksi Non-ISTK belum dapat dibaca dari Firebase')+'</b><small>'+(job?job.ops.length+' baris tersimpan sebagai cadangan di browser ini. '+E(err||'Data baru akan masuk daftar resmi setelah Firebase mengonfirmasi. Jangan hapus data browser.'):'Periksa Security Rules psKka di Pengaturan › Database. Impor dapat dicadangkan lokal sampai akses pulih.')+'</small></div>'+(job?'<button type="button" class="btn btn-sm" data-kka-draft>Unduh cadangan JSON</button><button type="button" class="btn btn-sm pri" data-kka-retry '+(running?'disabled':'')+'>Coba sinkronkan</button>':'')+'</div>'
}
async function syncImport(y){
 const key=kkaOutboxKey(y),job=pendingImport(y);if(!key||!job||pendingBusy.has(key))return false;
 if(!canCfg()||!FB.db||!FB.ready){say('Firebase belum siap atau akun tidak berhak. Cadangan tetap tersedia.');return false}
 pendingBusy.add(key);pendingErrors.delete(key);render();
 try{
  const id=NONK(y),ref=FB.db.collection('psKka').doc(id);
  const account=kkaAccount(),prev=FB.last?.psKka?.[id];
  const result=await FB.db.runTransaction(async tx=>{const snap=await tx.get(ref);const d=mergeImport(snap.exists?snap.data():null,job);
   const bytes=new TextEncoder().encode(JSON.stringify(d)).length;if(bytes>900000)throw Error('Dokumen Non-ISTK mendekati batas 1 MB Firestore. Cadangan aman; perlu pemecahan dokumen sebelum impor.');
   tx.set(ref,d);return d});
  /* The transaction promise resolves only after server commit. Keep the listener's newer state if it already advanced. */
  if(kkaAccount()===account){FB.last.psKka=FB.last.psKka||{};if(FB.last.psKka[id]===prev||FB.last.psKka[id]===stab(result)){store()[id]=result;FB.last.psKka[id]=stab(result)}
   if(FB.optDenied?.psKka){say('Impor tersimpan di Firebase. Muat ulang untuk menyambungkan kembali listener psKka.')}else say('Impor Non-ISTK berhasil tersimpan di Firebase ('+job.ops.length+' baris).')}
  const active=pendingImport(y);if(kkaAccount()===account&&active?.id===job.id){localStorage.removeItem(key);pendingMem.delete(key)}
  return true;
 }catch(e){const msg=typeof fbErr==='function'?fbErr(e):String(e.message||e);pendingErrors.set(key,msg);say('Impor Non-ISTK belum tersimpan di Firebase: '+msg+'. Cadangan tetap tersedia.');return false}
 finally{pendingBusy.delete(key);if(kkaOutboxKey(y)===key)render()}
}
function downloadPending(y){const job=pendingImport(y);if(!job)return;const url=URL.createObjectURL(new Blob([JSON.stringify(job,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Non-ISTK-impor-tertunda-'+y+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

async function importFile(file){
 const importYear=year();if(cloudKka()&&pendingImport(importYear)){say('Ada impor Non-ISTK tertunda. Gunakan Coba sinkronkan dahulu.');return}
 const X=window.XLSX;if(!X){say('Pustaka Excel belum termuat.');return}
 let wb;try{wb=X.read(await file.arrayBuffer(),{type:'array'})}catch(e){say('Berkas tidak dapat dibaca sebagai Excel.');return}
 const us=wb.Sheets['Usulan'];if(!us){say("Sheet 'Usulan' tidak ditemukan. Gunakan workbook Kertas Kerja A.");return}
 const aoa=s=>X.utils.sheet_to_json(s,{header:1,raw:true,defval:''});
 const bad=v=>/^#(REF|N\/A|VALUE|DIV\/0|NAME)!?/i.test(T(v));
 const U=aoa(us).slice(7).filter(r=>(T(r[0])||T(r[1]))&&!bad(r[1]));
 /* Penilaian: cocokkan per ID, atau per nama bila ID rusak. Data mulai setelah baris judul 'ID'. */
 const P={},PN={};if(wb.Sheets['Penilaian']){const A=aoa(wb.Sheets['Penilaian']);const h=A.findIndex(r=>T(r[0])==='ID');A.slice(h+1).forEach(r=>{const sc=r.slice(3,10);if(!sc.some(v=>T(v)!==''&&!bad(v)))return;if(T(r[0])&&!bad(r[0]))P[T(r[0])]=sc;if(T(r[1])&&!bad(r[1]))PN[nk(r[1])]=sc})}
 const scoreOf=r=>P[T(r[0])]||PN[nk(r[1])]||[];
 const kr=wb.Sheets['Kriteria']?aoa(wb.Sheets['Kriteria']):null;
 const progs=allProgs(),all=[];progs.forEach(p=>(p.psProjects||[]).forEach(x=>all.push({p,x})));
 const match=r=>{const n=nk(r[1]),id=T(r[0]);if(!n)return null;return all.find(o=>o.p.nonIstk&&id&&!bad(id)&&T(o.x.psOriginRef)===id)||all.find(o=>nk(o.x.name)===n||(!o.p.nonIstk&&nk(o.x.applicationName)===n))||all.find(o=>o.p.nonIstk&&importNameKey(o.x.name)===importNameKey(r[1]))||all.find(o=>{const a=nk(o.x.name);return !o.p.nonIstk&&a&&a.length>4&&(a.includes(n)||n.includes(a))})||null};
 const plan=U.map(r=>({r,m:match(r)})),ok=plan.filter(z=>z.m),miss=plan.filter(z=>!z.m);
 const yn=v=>/^ya$/i.test(T(v))?'Ya':/^tidak$/i.test(T(v))?'Tidak':'';
 const sv=v=>{const n=+v;return T(v)!==''&&n>=1&&n<=5&&Number.isInteger(n)?n:null};
 const cur=I.pickedProgram(),canAdd=progs.filter(p=>!p.nonIstk&&(!I.readonly(p)||canCfg()));
 const nSkor=plan.filter(z=>scoreOf(z.r).map(sv).some(v=>v!=null)).length;
 modal('Impor Kertas Kerja A',`<p class="s" style="margin:0 0 8px">${U.length} baris usulan di berkas · <b>${ok.length} cocok</b> dengan proyek tahun ${year()} · <b>${miss.length} belum ada</b> di aplikasi · ${nSkor} baris memiliki skor K1–K7.</p>
 <div class="kka-scroll" style="max-height:40vh"><table class="kka-t"><thead><tr><th>Usulan di berkas</th><th>Proyek di aplikasi</th><th>Gate G1–G4</th><th>Skor K1–K7</th><th>Biaya (Rp jt) · Durasi · SDM</th></tr></thead><tbody>${plan.map(z=>{const s=scoreOf(z.r).map(sv);return '<tr><td><b>'+E(z.r[1])+'</b><small>'+E([T(z.r[0]),T(z.r[8])].filter(Boolean).join(' · '))+'</small></td><td>'+(z.m?E(z.m.x.name)+'<small>'+E(z.m.p.nama)+'</small>':'<span class="kka-chip warn">Baru</span>')+'</td><td>'+[21,22,23,24].map(i=>yn(z.r[i])||'–').join(' / ')+'</td><td>'+(s.some(v=>v!=null)?s.map(v=>v??'–').join(' '):'<small>belum ada</small>')+'</td><td>'+[18,19,20].map(i=>T(z.r[i])===''?'–':E(z.r[i])).join(' · ')+'</td></tr>'}).join('')}</tbody></table></div>
 ${miss.length?`<div style="margin-top:10px;padding:10px;border:1px solid #F2D58A;background:#FFFBEA;border-radius:8px"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="kka-imp-add" checked style="width:auto"> Tambahkan ${miss.length} usulan yang belum ada sebagai usulan baru ke</label>
  <select id="kka-imp-prog" style="margin-top:6px;width:100%">${canCfg()?'<option value="__nonistk" selected>Di luar ISTK (tidak termapping ke program ISTK)</option>':''}${canAdd.map(p=>'<option value="'+E(p.id)+'"'+(!canCfg()&&cur&&p.id===cur.id?' selected':'')+'>Program: '+E(p.nama)+'</option>').join('')}</select>
  <small style="display:block;margin-top:4px;color:#64748B">Usulan yang cocok dengan proyek ISTK yang sudah ada (mis. HRIS, Interoperabilitas) otomatis diperbarui di programnya. Sisanya default masuk <b>Di luar ISTK</b>; pilih program bila memang bagian ISTK. Isian Usulan (jenis inisiatif, UE I, unit pemilik, domain SPBE, deskripsi, urgensi, landasan hukum, strategi, proses bisnis, narasi, fitur) ikut disalin.</small></div>`:''}
 <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="kka-imp-est" checked style="width:auto"> Perbarui estimasi biaya, durasi, dan SDM dari berkas (bila terisi)</label>
 <label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="kka-imp-desc" checked style="width:auto"> Lengkapi isian Usulan proyek yang sudah ada bila masih kosong</label>
 ${kr&&canCfg()?'<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="kka-imp-cfg" style="width:auto"> Ambil juga pengaturan & bobot dari sheet Kriteria</label>':''}
 <label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="kka-imp-method" checked style="width:auto"> Set metode program terkait ke MCDA</label>
 <p class="s" style="margin:8px 0 0">Nilai rusak (#REF!) atau kosong diabaikan; isian lama di aplikasi tidak dihapus.</p>`,'Impor',o=>{
  const q=id=>o.querySelector(id),est=q('#kka-imp-est')?.checked,useCfg=q('#kka-imp-cfg')?.checked,setM=q('#kka-imp-method')?.checked,desc=q('#kka-imp-desc')?.checked,add=q('#kka-imp-add')?.checked,tp=q('#kka-imp-prog')?.value==='__nonistk'?nonP():progs.find(p=>p.id===q('#kka-imp-prog')?.value);
  if(+year()!==+importYear){say('Tahun aktif berubah. Buka ulang impor.');return false}
  const useCloud=cloudKka(),nonOps=[],deferred=[];let nG=0,nS=0,nNew=0;const touched=new Set();
  const DESC=[[7,'initiativeType'],[8,'uic'],[9,'businessOwner'],[10,'spbeDomain'],[11,'description'],[12,'urgency'],[13,'legalBasis'],[14,'strategyAlignment'],[15,'businessProcess'],[16,'businessNarrative'],[17,'features']];
  const apply=(r,x,p,isNew)=>{touched.add(p);
   GATES.forEach((g,i)=>{const v=yn(r[21+i]);if(v){x[g[0]]=v;nG++}});
   const s=scoreOf(r).map(sv);if(s.some(v=>v!=null)){x.kka=x.kka||{};s.forEach((v,i)=>{if(v!=null){x.kka['K'+(i+1)]=v;nS++}})}
   if(est||isNew){const cst=+r[18],du=+r[19],sd=+r[20];if(T(r[18])!==''&&isFinite(cst))x.estimatedCost=Math.round(cst*1e6);if(T(r[19])!==''&&isFinite(du))x.durationMonths=du;if(T(r[20])!==''&&isFinite(sd))x.estimatedStaffMonths=sd}
   if(desc||isNew)DESC.forEach(([c,k])=>{const v=T(r[c]);if(v&&!bad(v)&&!T(x[k]))x[k]=v});
   if(!T(x.psOriginRef)&&T(r[0])&&!bad(r[0]))x.psOriginRef=T(r[0])};
  if(add&&miss.length&&!tp){say('Pilih program tujuan untuk usulan baru.');return false}
  if(useCloud&&((add&&miss.length&&tp?.nonIstk)||ok.some(z=>z.m.p.nonIstk))&&!canCfg()){say('Hanya Superadmin atau PMO Kemenkeu dapat mengimpor Non-ISTK.');return false}
  const stage=(r,x,p,isNew)=>{if(useCloud&&p.nonIstk){const copy=cloneKka(x);apply(r,copy,p,isNew);nonOps.push(importDelta(isNew?null:x,copy));}else deferred.push(()=>{apply(r,x,p,isNew);if(isNew)p.psProjects.push(x)})};
  ok.forEach(({r,m})=>{if(roP(m.p)&&!canCfg())return;stage(r,m.x,m.p,false)});
  if(add&&miss.length){miss.forEach(({r})=>{const x={id:'proj-'+uid(),psFromImport:true,name:T(r[1]),status:'Usulan',included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[],psOriginYear:null};stage(r,x,tp,true);nNew++})}
  if(nonOps.length){try{queueImport(importYear,nonOps)}catch(e){say('Impor dibatalkan: '+(e.message||e)+'. Cadangan browser tidak dapat dibuat.');return false}}
  if(add&&miss.length&&tp&&!(useCloud&&tp.nonIstk)){if(tp.nonIstk)tp._keep();tp.psProjects=tp.psProjects||[]}
  deferred.forEach(fn=>fn());
  if(add&&miss.length&&tp&&!tp.nonIstk)try{window.MT_PS_SCOPE&&window.MT_PS_SCOPE.normalizeProjectCodes&&window.MT_PS_SCOPE.normalizeProjectCodes(tp)}catch(_){}
  if(setM)touched.forEach(p=>{if(!p.nonIstk){p.psMethod='kka';p.psPrioritize=false}});
  if(useCfg&&kr){const cell=(r,cI)=>(kr[r-1]||[])[cI];const w={};PROFILES.forEach((p,j)=>{const a=[0,1,2,3,4,5,6].map(i=>Math.round(+cell(17+i,3+j)*1000)/10);if(a.every(v=>isFinite(v)))w[p]=a});
   const pf=T(cell(4,2));setCfg({profile:PROFILES.includes(pf)?pf:cfg().profile,onlyPassed:T(cell(6,2))==='Tidak'?'Tidak':'Ya',pagu:+cell(7,2)||cfg().pagu,sdm:+cell(8,2)||cfg().sdm,quadThr:+cell(9,2)||cfg().quadThr,p1:+cell(10,2)||cfg().p1,p2:+cell(11,2)||cfg().p2,p3:+cell(12,2)||cfg().p3,tol:+cell(13,2)||cfg().tol,weights:Object.assign(cfg().weights,w)})}
  touched.forEach(p=>{if(p.nonIstk){if(!useCloud)p._doc.updatedAt=new Date().toISOString()}else p.psUpdatedAt=new Date().toISOString()});
  try{log('Impor Kertas Kerja A',ok.length+' diperbarui, '+nNew+' proyek baru')}catch(_){}save();render();
  if(nNew&&tp){ui().scope=tp.nonIstk?'non':'all';if(!tp.nonIstk){try{I.state().prog=tp.id}catch(_){}ui().scope='program'}save();render()}
  if(nonOps.length){say('Cadangan impor Non-ISTK dibuat. Menunggu konfirmasi Firebase.');void syncImport(importYear)}else say('Impor diproses: '+ok.length+' proyek diperbarui, '+nNew+' proyek baru'+(useCloud?'. Periksa indikator sinkronisasi Firestore.':'.'))},{size:'wide'});
}
/* Usulan non-ISTK: isian mengikuti sheet 'Usulan' Kertas Kerja A (ID, nama, jenis inisiatif, unit, domain, deskripsi & konteks, estimasi, gate). */
const UF=[
 ['Identitas',[['psOriginRef','ID usulan','text','Mis. kode proses bisnis/usulan dari Pusakti (01.03.12.01-021.001)'],['name','Nama sistem / modul *','text'],['category','Kategori','cat','Kategori portofolio yang sama dengan proyek ISTK, mis. Manajemen Transformasi → Manajemen Birokrasi.'],['spbeDomain','Domain arsitektur SPBE','dom'],['initiativeType','Jenis inisiatif','multi'],['uic','UE I','ue'],['businessOwner','Unit pemilik proses bisnis (Eselon II/unit)','text']]],
 ['Pemetaan Proses Bisnis EA',[['eaL1','Level 2 (Level 1 mengikuti)','eal1','Pilih proses Level 1 dari taksonomi Proses Bisnis EA (Domain 1 Pengelolaan APBN, 2 Pengelolaan Non APBN, 3 Dukungan Manajemen Birokrasi). Lihat Cheatsheet › Telaah SI & Proses Bisnis EA.'],['eaL2','Level 3 · proses utama','eal2'],['eaSupport','Proses pendukung (opsional)','easup']]],
 ['Deskripsi & Konteks Usulan',[['description','Deskripsi aplikasi/modul','area'],['urgency','Urgensi','area'],['legalBasis','Landasan hukum/regulasi','area'],['strategyAlignment','Strategi organisasi yang didukung','area'],['businessProcess','Proses bisnis terkait','area'],['businessNarrative','Penjelasan/narasi proses bisnis aplikasi','area'],['features','Fitur utama yang akan dikembangkan','area']]],
 ['Estimasi Biaya, Durasi & SDM',[['cost','Estimasi biaya (Rp juta)','num'],['durationMonths','Durasi (bulan)','num'],['estimatedStaffMonths','Kebutuhan SDM (orang-bulan)','num']]],
 ['Gate Penyaringan',GATES.map(g=>[g[0],g[1]+' – '+g[3],'gate'])]];
const KATEGORI=['Core APBN','Core Non APBN','Office Automation','APBN','Non APBN','Manajemen Birokrasi'];
const JENIS=['Aplikasi Baru','Modul Baru','Pengayaan Modul','Data Analytics / Dashboard / AI','Interoperabilitas'],DOMAIN=['Proses Bisnis','Data dan Informasi','Aplikasi','Infrastruktur','Keamanan','Layanan'];
const REQ=[['name','nama'],['category','kategori'],['eaL2','proses bisnis EA'],['initiativeType','jenis inisiatif'],['uic','UE I'],['businessOwner','unit pemilik'],['description','deskripsi'],['estimatedCost','biaya'],['durationMonths','durasi'],['estimatedStaffMonths','SDM']];
const validasi=x=>{const m=REQ.filter(([k])=>k==='eaL2'?!(window.MT_EA&&MT_EA.primary(x)):x[k]===''||x[k]==null||(typeof x[k]==='string'&&!T(x[k]))).map(z=>z[1]);return m.length?'Lengkapi: '+m.join(', '):'OK'};
/* Context navigation: keep the original navy/white/gold mockup styling, and scroll only the modal body. */
function kd2ContextNav(ov,attr,prefix){
 const body=ov.querySelector('.kd2-body'),buttons=[...ov.querySelectorAll('['+attr+']')],sections=buttons.map(b=>ov.querySelector('#'+prefix+b.getAttribute(attr)));
 let destination=null;
 const activate=i=>buttons.forEach((b,j)=>{b.classList.toggle('on',j===i);if(j===i)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current')});
 const update=()=>{
  if(!buttons[0]?.closest('.kd2-pane')?.classList.contains('on'))return;
  if(destination!==null){if(Math.abs(body.scrollTop-destination)<=2)destination=null;return}
  const edge=body.getBoundingClientRect().top+12;let i=0;
  sections.forEach((s,j)=>{if(s&&s.getBoundingClientRect().top<=edge)i=j});
  if(body.scrollTop>0&&body.scrollHeight-body.clientHeight-body.scrollTop<=2)i=buttons.length-1;
  activate(i);
 };
 body.addEventListener('scroll',update,{passive:true});
 ['wheel','touchstart','pointerdown','keydown'].forEach(ev=>body.addEventListener(ev,()=>{destination=null},{passive:true}));
 return {reset(){destination=null;activate(0)},go(key){
  const i=buttons.findIndex(b=>b.getAttribute(attr)===key),s=sections[i];if(!s)return;
  activate(i);
  const top=Math.max(0,Math.min(body.scrollHeight-body.clientHeight,body.scrollTop+s.getBoundingClientRect().top-body.getBoundingClientRect().top-8));
  destination=Math.abs(body.scrollTop-top)<=2?null:top;
  body.scrollTo({top,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }};
}
function nonEdit(id,view,initialTab){
 const n=nonP(),x=id?n.psProjects.find(z=>String(z.id)===String(id)):null;if(id&&!x)return;
 if(view||!canCfg()){if(x)nonDetail(id);return}
 const ro=false,EA=window.MT_EA,D=compute(),before=x?JSON.stringify(x):null,draft=x?JSON.parse(before):{id:'non-'+uid(),status:'Usulan',kka:{},nonIstk:true};
 const yr=year(),owner=me()?.email||'',cloud=cloudKka(),db=cloud?FB.db:null,ownerUid=cloud?FB.auth?.currentUser?.uid:null;
 let main=EA?.primary(draft)||'',sup=EA?.supports(draft)||[],changedEA=false,dirty=false,tab=initialTab||'ring',domain='all',depth='all',query='',role='main',focus=false;
 const val=k=>x?(k==='cost'?(x.estimatedCost==null||x.estimatedCost===''?'':x.estimatedCost/1e6):x[k]??''):'';
 const dis=ro?' disabled':'';
 const opt=(arr,v)=>['',...new Set([...arr,...(v&&!arr.includes(v)?[v]:[])])].map(o=>'<option'+(String(o)===String(v||'')?' selected':'')+' value="'+E(o)+'">'+E(o||'Pilih')+'</option>').join('');
 const fld=([k,l,t,h])=>{const v=val(k),lab='<label for="kn-'+k+'">'+E(l)+(h?ic(h):'')+'</label>';
  if(t==='area')return '<div class="fld">'+lab+'<textarea id="kn-'+k+'" rows="3"'+dis+'>'+E(v)+'</textarea></div>';
  if(t==='ue')return '<div class="fld">'+lab+'<select id="kn-'+k+'"'+dis+'>'+opt(UE,v)+'</select></div>';
  if(t==='cat')return '<div class="fld">'+lab+'<select id="kn-'+k+'"'+dis+'>'+opt([...new Set([...KATEGORI,...(v&&!KATEGORI.includes(v)?[v]:[])])],v)+'</select></div>';
  if(t==='dom')return '<div class="fld">'+lab+'<select id="kn-'+k+'"'+dis+'>'+opt(DOMAIN,v)+'</select></div>';
  if(t==='gate')return '<div class="fld">'+lab+'<select id="kn-'+k+'"'+dis+'><option value="">Belum dijawab</option>'+['Ya','Tidak'].map(o=>'<option'+(v===o?' selected':'')+'>'+o+'</option>').join('')+'</select></div>';
  if(t==='multi'){const sel=String(v||'').split(/[,;]+/).map(T).filter(Boolean);return '<div class="fld wide">'+lab+'<div class="kn-multi">'+[...new Set([...JENIS,...sel])].map(o=>'<label><input type="checkbox" data-kn-jenis value="'+E(o)+'"'+(sel.includes(o)?' checked':'')+dis+'> '+E(o)+'</label>').join('')+'</div></div>'}
  if(t==='num')return '<div class="fld">'+lab+'<input id="kn-'+k+'" type="number" min="0" step="any" value="'+E(v)+'"'+dis+'></div>';
  return '<div class="fld">'+lab+'<input id="kn-'+k+'" value="'+E(v)+'"'+dis+'></div>'};

 const scoreOptions=(code,value)=>'<option value="">Pilih skor &amp; kriteria</option>'+RUB[code].map((label,i)=>'<option value="'+(i+1)+'"'+(String(value??'')===String(i+1)?' selected':'')+'>'+E((i+1)+' — '+label)+'</option>').join('');
 const tabs=[['ring','Ringkasan'],['ctx','Deskripsi & Konteks'],['ea','Peta Proses Bisnis EA'],['gate','Estimasi & Gate'],['skor','Penilaian K1–K7']];
 const card=(h,v)=>'<div class="kd2-card"><h4>'+h+'</h4>'+v+'</div>';
 const fields=fs=>'<div class="ke-form">'+fs.map(fld).join('')+'</div>';
 const row=D.rows.find(z=>String(z.id)===String(id))||{};
 const panes={
 ring:'<div class="ke-grid">'+card('▦ Identitas',fields(UF[0][1]))+'<div>'+card('✓ Kelengkapan','<div class="kd2-meter"><i data-ke-meter></i></div><div class="kd2-checks" data-ke-checks></div>')+card('◔ Posisi di Roadmap '+D.y,'<div class="kd2-rm"><div class="row"><span>Pagu pengembangan</span><b>Rp '+fmt(D.c.pagu)+' jt</b></div><div class="kd2-bar"><i style="width:'+Math.max(0,Math.min(100,D.sum.istkCost/(D.c.pagu||1)*100))+'%;background:#1D3A78"></i></div><div class="row"><span>Usulan ini</span><b data-ke-cost>—</b></div><div class="row"><span>SDM</span><b data-ke-sdm>—</b></div><p class="ke-note">Roadmap dan peringkat resmi dihitung setelah simpan.</p></div>')+'</div></div>'+card('✎ Deskripsi singkat','<p data-ke-summary class="ke-summary"></p><button class="kd2-btn" data-ke-tab="ctx">Lengkapi deskripsi ›</button>'),
 ctx:'<div class="kd2-ctx"><nav>'+UF[2][1].map(([k,l])=>'<button data-ke-context="'+k+'">'+E(l)+'<em data-ke-cstat="'+k+'"></em></button>').join('')+'</nav><div>'+UF[2][1].map(f=>'<div class="kd2-blk" id="ke-'+f[0]+'">'+fld(f)+'</div>').join('')+'</div></div>',
 ea:'<div class="ke-tools"><input type="search" data-ke-search placeholder="Cari kode atau nama proses"><select data-ke-domain aria-label="Domain"><option value="all">Semua domain</option>'+(EA?EA.tree.map(z=>'<option value="'+E(z[0])+'">'+E(z[0]+'. '+z[1])+'</option>').join(''):'')+'</select><select data-ke-level aria-label="Level"><option value="all">Semua level</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></select><button class="kd2-btn" data-ke-focus>Fokus terpetakan</button></div><div class="ke-tools"><span class="ke-note">Pilih sesuai cakupan</span><button class="kd2-btn pri" data-ke-role="main">Pilih utama</button><button class="kd2-btn" data-ke-role="sup">Pilih pendukung</button><span class="kd2-sp"></span><span class="kd2-legend"><i class="m"></i>Utama <i class="s"></i>Pendukung</span></div><div data-ke-map></div><div class="kd2-eafoot" data-ke-selected></div><p class="ke-note">Induk mencakup turunannya. Utama dan pendukung dapat berbeda level dan domain. Pemetaan yang tumpang tindih tidak ditambahkan.</p>',
 gate:card('Estimasi '+D.y,'<div class="ke-form ke-three">'+UF[3][1].map(fld).join('')+'</div>')+card('⛨ Gate penyaringan','<div class="ke-form">'+UF[4][1].map(fld).join('')+'</div>'),
 skor:card('★ Penilaian K1–K7 · '+E(D.c.profile),'<div class="kd2-ks ke-score-list">'+KR.map((k,i)=>'<div class="kd2-k ke-k"><code>'+k.c+'</code><div class="nm"><b>'+E(k.n)+'</b><small>Bobot '+fmt(D.c.weights[D.c.profile][i])+'%</small><small data-ke-rub="'+k.c+'"></small></div><select data-ke-score="'+k.c+'" aria-label="'+E(k.n)+'">'+scoreOptions(k.c,draft.kka?.[k.c])+'</select><div class="w">/5</div></div>').join('')+'</div><p class="ke-note">Peringkat resmi dihitung setelah penyimpanan.</p>')};
 const ov=document.createElement('div');ov.className='kd2-ov ke-ov';ov.innerHTML='<section class="kd2 ke" role="dialog" aria-modal="true" aria-label="'+(x?'Ubah':'Tambah')+' Usulan Non-ISTK"><header class="kd2-hero"><button class="kd2-x" data-ke-close aria-label="Tutup">✕</button><div class="kd2-top"><div class="kd2-id"><div class="kd2-eye">'+(x?'Ubah':'Tambah')+' Usulan Non-ISTK <span data-ke-id></span> · '+D.y+'</div><h2 data-ke-name></h2><div class="kd2-tags" data-ke-tags></div></div><div class="kd2-score"><div class="kd2-ring" data-ke-ring><div><b data-ke-result>—</b><small>dari 100</small></div></div><div class="kd2-kv"><span>Prioritas</span><b data-ke-cat>—</b><span>Peringkat tersimpan</span><b>'+E(row.rank?'#'+row.rank:'—')+'</b><span>Hasil gate</span><b data-ke-gate>—</b><span>Roadmap tersimpan</span><b>'+E(row.rec||'—')+'</b></div></div></div><nav class="kd2-tb">'+tabs.map(([k,l])=>'<button data-ke-tab="'+k+'">'+l+'<i data-ke-count="'+k+'"></i></button>').join('')+'</nav></header><div class="kd2-step ke-strip" data-ke-strip></div><main class="kd2-body">'+tabs.map(([k])=>'<section class="kd2-pane" data-ke-pane="'+k+'">'+panes[k]+'</section>').join('')+'</main><footer class="kd2-foot"><span>Perubahan belum disimpan</span><span class="kd2-sp"></span><button class="kd2-btn" data-ke-close>Batal</button><button class="kd2-btn" data-ke-prev>‹ Sebelumnya</button><button class="kd2-btn" data-ke-next>Berikutnya ›</button><button class="kd2-btn pri" data-ke-save>'+(x?'Simpan':'Tambah')+'</button></footer></section>';
 document.body.appendChild(ov);
 const $=q=>ov.querySelector(q),$$=q=>[...ov.querySelectorAll(q)],put=(q,v)=>{const e=$(q);if(e)e.textContent=v};
 const g=k=>T($('#kn-'+k)?.value),numbers=k=>g(k)===''?'':Number(g(k));
 const scores=()=>KR.map(k=>{const v=$('[data-ke-score="'+k.c+'"]').value;return v===''?null:Number(v)});
 const ctxNav=kd2ContextNav(ov,'data-ke-context','ke-');
 const show=k=>{tab=tabs.some(z=>z[0]===k)?k:'ring';$$('.kd2-tb [data-ke-tab]').forEach(b=>b.classList.toggle('on',b.dataset.keTab===tab));$$('[data-ke-pane]').forEach(p=>p.classList.toggle('on',p.dataset.kePane===tab));$('.kd2-body').scrollTop=0;if(tab==='ctx')ctxNav.reset();$('[data-ke-prev]').disabled=tab==='ring';$('[data-ke-next]').disabled=tab==='skor'};
 const label=c=>EA?EA.label(c):c,chosen=c=>c===main?' kd2-mn':sup.includes(c)?' kd2-su':'';
 function drawMap(){
  if(!EA){put('[data-ke-map]','Master EA belum termuat. Pemetaan lama dipertahankan.');return}
  const matches=(c,n)=>(depth==='all'||EA.level(c)===+depth)&&(!query||(c+' '+n).toLowerCase().includes(query))&&(!focus||[main,...sup].some(z=>z===c||z.startsWith(c+'.')));
  const node=(c,n)=>'<button type="button" class="kd2-l2 ke-node'+chosen(c)+'" data-ke-node="'+E(c)+'"><code>'+E(c)+'</code>'+E(n)+' <small>L'+EA.level(c)+'</small></button>';
  $('[data-ke-map]').innerHTML=EA.tree.filter(z=>domain==='all'||z[0]===domain).map(z=>{const sub=z[2].map(a=>{const leaves=a[2].filter(b=>matches(b[0],b[1])).map(b=>node(b[0],b[1])).join('');if(!leaves&&!matches(a[0],a[1]))return '';return '<div class="kd2-l1">'+(matches(a[0],a[1])?node(a[0],a[1]):'<div class="kd2-t"><code>'+E(a[0])+'</code>'+E(a[1])+'</div>')+'<div class="kd2-l2s">'+leaves+'</div></div>'}).join('');if(!sub&&!matches(z[0],z[1]))return '';return '<div class="kd2-eamap"><div class="kd2-l0">'+(matches(z[0],z[1])?node(z[0],z[1]):'<small>LEVEL 1</small><b>'+E(z[0]+'. '+z[1])+'</b>')+'</div><div class="kd2-l1s">'+sub+'</div></div>'}).join('')||'<p class="kd2-empty">Tidak ada hasil.</p>';
  $('[data-ke-selected]').innerHTML='<span>Utama: <b>'+E(main?label(main):'Belum dipetakan')+'</b></span>'+(main?'<button class="kd2-btn" data-ke-clear>Hapus pemetaan</button>':'')+sup.map(c=>'<span class="ke-chip">'+E(label(c))+' · L'+EA.level(c)+' <button data-ke-remove="'+E(c)+'" aria-label="Hapus pendukung">×</button></span>').join('');
 }
 function refresh(){
  const sc=scores(),count=sc.filter(v=>v!=null).length,score=count===7?weighted(sc,wFrac(D.c,D.c.profile)):null,gs=GATES.map(z=>g(z[0])),gate=gs.some(v=>!v)?'Lengkapi':gs.every(v=>v==='Ya')?'Lolos':'Tinjau Ulang',types=$$('[data-kn-jenis]:checked').map(e=>e.value);
  const checks=[['Nama & ID',!!g('name')&&!!g('psOriginRef'),'ring'],['Kategori',!!g('category'),'ring'],['Jenis inisiatif',!!types.length,'ring'],['UE I & unit',!!g('uic')&&!!g('businessOwner'),'ring'],['Proses bisnis EA',!!main,'ea'],['Deskripsi',!!g('description'),'ctx'],['Biaya & durasi',g('cost')!==''&&g('durationMonths')!=='','gate'],['Kebutuhan SDM',g('estimatedStaffMonths')!=='','gate'],['Gate G1–G4',gs.every(Boolean),'gate'],['Skor K1–K7',count===7,'skor']];
  put('[data-ke-name]',g('name')||'Usulan baru');put('[data-ke-id]',g('psOriginRef'));$('[data-ke-tags]').innerHTML=[g('category'),...types,g('uic')].filter(Boolean).map((v,i)=>'<span class="kd2-tag'+(i===0&&g('category')?' gold':'')+'">'+E(v)+'</span>').join('')+'<span class="kd2-tag vio">Non-ISTK</span>';
  put('[data-ke-result]',score==null?'—':fmt(score,2));$('[data-ke-ring]').style.setProperty('--v',score||0);put('[data-ke-cat]',score==null?'—':category(score,D.c));put('[data-ke-gate]',gate);
  const p=EA?EA.path(main):[];$('[data-ke-strip]').innerHTML='<span class="kd2-steplab">Proses Bisnis EA</span>'+(p.length?p.map((z,i)=>(i?'<span class="kd2-ln"></span>':'')+'<div class="kd2-st2'+(i===p.length-1?' on':'')+'"><i>'+(i+1)+'</i><div><small>Level '+(i+1)+(i===p.length-1?' · utama':'')+'</small><b><code>'+E(z.c)+'</code>'+E(z.n)+'</b></div></div>').join(''):'<span class="kd2-stepmiss">Belum dipetakan</span>')+(sup.length?'<span class="kd2-sup">+'+sup.length+' pendukung</span>':'')+'<button class="kd2-btn" data-ke-tab="ea">✎ Ubah pemetaan</button>';
  const done=checks.filter(z=>z[1]).length;$('[data-ke-meter]').style.width=done*10+'%';$('[data-ke-checks]').innerHTML=checks.map(z=>'<div class="kd2-chk '+(z[1]?'y':'n')+'"><i>'+(z[1]?'✓':'!')+'</i>'+E(z[0])+(z[1]?'':'<button class="ke-link" data-ke-tab="'+z[2]+'">Isi ›</button>')+'</div>').join('');
  put('[data-ke-count="ring"]',done+'/10');put('[data-ke-count="ctx"]',UF[2][1].filter(f=>g(f[0])).length+'/7');put('[data-ke-count="ea"]',main?'L'+EA.level(main):'—');put('[data-ke-count="gate"]',gs.filter(Boolean).length+'/4');put('[data-ke-count="skor"]',count+'/7');
  put('[data-ke-summary]',g('description')||'Belum diisi.');put('[data-ke-cost]',g('cost')===''?'—':'Rp '+fmt(numbers('cost'))+' jt');put('[data-ke-sdm]',g('estimatedStaffMonths')===''?'—':fmt(numbers('estimatedStaffMonths'))+' org-bln');
  UF[2][1].forEach(([k])=>{const e=$('[data-ke-cstat="'+k+'"]');e.textContent=g(k)?'✓':'kosong';e.className=g(k)?'y':'n'});KR.forEach((k,i)=>put('[data-ke-rub="'+k.c+'"]',sc[i]?RUB[k.c][sc[i]-1]:'Belum dinilai'));
 }
 function choose(c){if(!EA?.get(c))return;if(role==='main'){const conflicts=sup.filter(z=>EA.overlap(c,z));if(conflicts.length&&!confirm('Lepas pendukung yang tumpang tindih: '+conflicts.join(', ')+'?'))return;main=c;sup=sup.filter(z=>!EA.overlap(c,z))}else{if(!main){say('Pilih utama terlebih dahulu.');return}if(sup.includes(c))sup=sup.filter(z=>z!==c);else if([main,...sup].some(z=>EA.overlap(c,z))){say('Pemetaan bertumpang tindih.');return}else sup.push(c)}dirty=changedEA=true;drawMap();refresh()}
 function close(force=false){if(!force&&dirty&&!confirm('Buang perubahan yang belum disimpan?'))return;ov.remove();document.removeEventListener('keydown',esc)}
 const esc=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',esc);
 function commit(){
  if(!canCfg()||year()!==yr||(me()?.email||'')!==owner||cloudKka()!==cloud||(cloud&&(FB.db!==db||FB.auth?.currentUser?.uid!==ownerUid||!FB.ready||FB.optDenied?.psKka||pendingImport(yr)))){say('Sesi, tahun, atau sinkronisasi berubah. Buka ulang sebelum menyimpan.');return}
  if(!g('name')){show('ring');say('Nama sistem/modul wajib diisi.');$('#kn-name').focus();return}
  const now=nonP(),live=x?now.psProjects.find(z=>String(z.id)===String(id)):null;
  if(x&&(!live||JSON.stringify(live)!==before)){say('Data berubah sejak form dibuka. Buka ulang agar tidak menimpa perubahan.');return}
  if(allProgs().flatMap(p=>p.psProjects||[]).some(z=>z!==live&&nk(z.name)===nk(g('name')))){show('ring');say('Nama proyek sudah ada.');return}
  const c=numbers('cost'),du=numbers('durationMonths'),sd=numbers('estimatedStaffMonths');if(['cost','durationMonths','estimatedStaffMonths'].some(k=>$('#kn-'+k)?.validity?.badInput)||[c,du,sd].some(v=>v!==''&&(!Number.isFinite(v)||v<0))){show('gate');say('Estimasi harus angka nonnegatif.');return}
  if(changedEA){try{Object.assign(draft,EA.mapping(main,sup))}catch(e){show('ea');say(e.message);return}}
  [UF[0],UF[2],UF[4]].forEach(([,fs])=>fs.forEach(([k,,ty])=>{if(ty!=='multi')draft[k]=g(k)}));
  draft.initiativeType=$$('[data-kn-jenis]:checked').map(e=>e.value).join(', ');draft.estimatedCost=c===''?'':Math.round(c*1e6);draft.durationMonths=du;draft.estimatedStaffMonths=sd;delete draft.cost;
  const sc=scores();draft.kka=draft.kka||{};KR.forEach((k,i)=>{if(sc[i]==null)delete draft.kka[k.c];else draft.kka[k.c]=sc[i]});
  if(live){Object.assign(live,draft);delete live.cost}else{now._keep();now.psProjects.push(draft)}
  now._doc.updatedAt=new Date().toISOString();try{log((x?'Ubah':'Tambah')+' usulan non-ISTK',draft.name)}catch(_){}save();close(true);render();say(cloud?'Perubahan diproses. Periksa status sinkronisasi Firebase.':'Usulan '+(x?'diperbarui':'ditambahkan')+'.');
 }
 ov.addEventListener('input',e=>{if(e.target.matches('[data-ke-search]')){query=e.target.value.toLowerCase().trim();drawMap();return}if(e.target.matches('input,textarea,select')&&!e.target.matches('[data-ke-domain],[data-ke-level]')){dirty=true;refresh()}});
 ov.addEventListener('change',e=>{const a=e.target.dataset;if('keDomain'in a){domain=e.target.value;drawMap()}else if('keLevel'in a){depth=e.target.value;drawMap()}else if(e.target.matches('input,textarea,select')&&!e.target.matches('[data-ke-search]')){dirty=true;refresh()}});
 ov.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset;if('keClose'in a)return close();if('keTab'in a)return show(a.keTab);if('kePrev'in a)return show(tabs[Math.max(0,tabs.findIndex(z=>z[0]===tab)-1)][0]);if('keNext'in a)return show(tabs[Math.min(tabs.length-1,tabs.findIndex(z=>z[0]===tab)+1)][0]);if('keContext'in a){ctxNav.go(a.keContext);return}if('keRole'in a){role=a.keRole;$$('[data-ke-role]').forEach(z=>z.classList.toggle('pri',z===b));return}if('keFocus'in a){focus=!focus;b.classList.toggle('pri',focus);drawMap();return}if('keNode'in a)return choose(a.keNode);if('keRemove'in a){sup=sup.filter(z=>z!==a.keRemove);dirty=changedEA=true;drawMap();refresh();return}if('keClear'in a){if(confirm('Hapus seluruh pemetaan?')){main='';sup=[];dirty=changedEA=true;drawMap();refresh()}return}if('keSave'in a)return commit()});
 drawMap();refresh();show(tab);
}
/* Detail usulan Non-ISTK (tampilan baca, desain v2): header navy (identitas, skor, status) + jalur Proses Bisnis EA (stepper putih)
   + tab Ringkasan · Deskripsi & Konteks · Peta Proses Bisnis EA · Estimasi & Gate · Penilaian K1–K7. Ubah melalui form (nonEdit). */
const CTX=[['description','Deskripsi aplikasi/modul'],['urgency','Urgensi'],['legalBasis','Landasan hukum/regulasi'],['strategyAlignment','Strategi organisasi yang didukung'],['businessProcess','Proses bisnis terkait'],['businessNarrative','Penjelasan/narasi proses bisnis aplikasi'],['features','Fitur utama yang akan dikembangkan']];
function nonDetail(id,tab){
 const n=nonP(),x=n.psProjects.find(z=>String(z.id)===String(id));if(!x)return;
 const D=compute(),r=D.rows.find(z=>String(z.id)===String(x.id))||{},g=gateOf(x),v=validasi(x),EA=window.MT_EA,c=D.c;
 const fill=k=>T(x[k])!=='';const filled=CTX.filter(([k])=>fill(k)).length;
 const tx=s=>{s=T(s);if(!s)return '';const lines=s.split(/\n+/).map(T).filter(Boolean);return lines.length>1&&lines.every(l=>/^\d+[.)]/.test(l))?'<ol>'+lines.map(l=>'<li>'+E(l.replace(/^\d+[.)]\s*/,''))+'</li>').join('')+'</ol>':lines.map(l=>'<p>'+E(l)+'</p>').join('')};
 const jenis=String(x.initiativeType||'').split(/[,;]+/).map(T).filter(Boolean);
 const cost=x.estimatedCost===''||x.estimatedCost==null?null:x.estimatedCost/1e6,dur=num(x.durationMonths),sdmV=num(x.estimatedStaffMonths);
 const main=EA?.primary(x)||'',p=EA?EA.path(main):[],sup=EA?.supports(x)||[];
 const checks=[['Nama & ID',!!T(x.name)],['Kategori',fill('category')],['Jenis inisiatif',fill('initiativeType')],['UE I & unit',fill('uic')&&fill('businessOwner')],['Proses bisnis EA',p.length>0],['Deskripsi',fill('description')],['Biaya & durasi',cost!=null&&dur!=null],['Kebutuhan SDM',sdmV!=null],['Gate G1–G4',GATES.every(z=>x[z[0]])],['Skor K1–K7',(r.n||0)===7]];
 const done=checks.filter(z=>z[1]).length;
 const stC=s=>/^Didanai|prioritas otomatis/.test(s)?'ok':/lengkapi/i.test(s)?'warn':'bad';
 const score=r.score!=null?r.score:null;
 /* hero */
 const hero='<header class="kd2-hero"><button type="button" class="kd2-x" data-kd2-close aria-label="Tutup">✕</button><div class="kd2-top"><div class="kd2-id"><div class="kd2-eye">Detail Usulan Non-ISTK '+(x.psOriginRef?'<span class="kd2-code">'+E(x.psOriginRef)+'</span>':'')+' · '+D.y+'</div><h2>'+E(x.name)+'</h2><div class="kd2-tags">'+(x.category?'<span class="kd2-tag gold">'+E(x.category)+'</span>':'<span class="kd2-tag warn">Kategori belum dipilih</span>')+jenis.map(j=>'<span class="kd2-tag">'+E(j)+'</span>').join('')+(x.uic?'<span class="kd2-tag">'+E(x.uic)+'</span>':'')+'<span class="kd2-tag vio">Non-ISTK</span></div></div>'+
  '<div class="kd2-score"><div class="kd2-ring" style="--v:'+(score||0)+'"><div><b>'+(score==null?'—':Math.round(score))+'</b><small>'+(score==null?(r.n||0)+'/7 dinilai':'dari 100')+'</small></div></div><div class="kd2-kv"><span>Kategori</span><b>'+(r.cat?'<span class="kd2-st p1 '+catCls(r.cat)+'">'+catCls(r.cat).toUpperCase()+' · '+E(r.cat.split('– ')[1]||'')+'</span>':'—')+'</b><span>Peringkat</span><b>'+(r.rank?'#'+r.rank+' dari '+D.R.length:'—')+'</b><span>Hasil gate</span><b><span class="kd2-st '+gateCls(g)+'">'+g+'</span></b><span>Roadmap</span><b>'+(r.rec?'<span class="kd2-st '+stC(r.rec)+'">'+E(r.rec)+'</span>':'—')+'</b></div></div></div>'+
  '<nav class="kd2-tb">'+[['ring','Ringkasan'],['ctx','Deskripsi & Konteks',filled+'/7'],['ea','Peta Proses Bisnis EA'],['gate','Estimasi & Gate'],['skor','Penilaian K1–K7',(r.n||0)+'/7']].map(t=>'<button type="button" data-kd2-tab="'+t[0]+'">'+t[1]+(t[2]?'<i>'+t[2]+'</i>':'')+'</button>').join('')+'</nav></header>';
 /* stepper EA */
 const step=p.length>0?'<div class="kd2-step"><span class="kd2-steplab">Proses Bisnis EA</span>'+p.map((z,k)=>(k?'<span class="kd2-ln"></span>':'')+'<div class="kd2-st2'+(k===p.length-1?' on':'')+'"><i>'+(k+1)+'</i><div><small>Level '+(k+1)+(k===p.length-1?' · utama':'')+'</small><b><code>'+E(z.c+(k?'':'.'))+'</code>'+E(z.n)+'</b></div></div>').join('')+(sup.length?'<span class="kd2-sup" title="'+E(sup.map(z=>EA.label(z)).join('\n'))+'">+'+sup.length+' pendukung</span>':'')+(canCfg()?'<button type="button" class="kd2-btn" data-kd2-edit>✎ Ubah pemetaan</button>':'')+'</div>':
  '<div class="kd2-step miss"><span class="kd2-steplab">Proses Bisnis EA</span><span class="kd2-stepmiss">Belum dipetakan ke Proses Bisnis EA.</span>'+(canCfg()?'<button type="button" class="kd2-btn pri" data-kd2-edit>+ Petakan sekarang</button>':'')+'</div>';
 /* panes */
 const card=(icon,title,body,extra)=>'<div class="kd2-card"><h4><span class="kd2-ic">'+icon+'</span>'+title+(extra||'')+'</h4>'+body+'</div>';
 const idl=rows=>'<div class="kd2-idl">'+rows.map(z=>'<div><span>'+z[0]+'</span><b>'+(z[1]||'<em class="kd2-empty">Belum diisi</em>')+'</b></div>').join('')+'</div>';
 const used=D.sum.istkCost,pagu=c.pagu||1,mine=cost||0,pct=v=>Math.max(0,Math.min(100,v/pagu*100));
 const usedS=D.sum.istkSdm,cap=c.sdm||1;
 const gatesHtml=full=>'<div class="kd2-gates">'+GATES.map(z=>{const a=x[z[0]];return '<div class="kd2-gate '+(a==='Ya'?'y':a==='Tidak'?'n':'u')+'"><div class="dot">'+(a==='Ya'?'✓':a==='Tidak'?'✕':'?')+'</div><b>'+z[1]+(full?' · '+E(z[2]):'')+'</b><p>'+E(full?z[3]:z[2])+'</p>'+(full?'<em>'+(a||'Belum dijawab')+'</em>':'')+'</div>'}).join('')+'</div>';
 const pRing='<section class="kd2-pane" data-kd2-pane="ring"><div class="kd2-g3">'+
  card('▦','Identitas',idl([['Kategori',E(x.category||'')],['Jenis inisiatif',E(x.initiativeType||'')],['UE I',E(x.uic||'')],['Unit pemilik probis',E(x.businessOwner||'')],['Domain arsitektur SPBE',E(x.spbeDomain||'')],['Proses bisnis EA',p.length?E(EA.label(main))+(sup.length?' <small>(+ '+E(sup.join(', '))+')</small>':''):'']]),'<span class="kd2-ct">Sheet Usulan</span>')+
  card('✓','Kelengkapan','<div class="kd2-meter"><i style="width:'+(done*10)+'%"></i></div><div class="kd2-checks">'+checks.map(z=>'<div class="kd2-chk '+(z[1]?'y':'n')+'"><i>'+(z[1]?'✓':'!')+'</i>'+z[0]+'</div>').join('')+'</div>','<span class="kd2-ct">'+done+' dari '+checks.length+'</span>')+
  card('◔','Posisi di Roadmap '+D.y,'<div class="kd2-rm"><div class="row"><span>Pagu pengembangan</span><b>Rp '+fmt(c.pagu)+' jt</b></div><div class="kd2-bar"><i style="width:'+pct(used)+'%;background:#1D3A78"></i><i style="width:'+pct(mine)+'%;background:#F2B92C"></i></div><div class="kd2-leg"><span style="--c:#1D3A78">ISTK Rp '+fmt(used)+' jt</span><span style="--c:#F2B92C">Usulan ini '+(cost==null?'—':'Rp '+fmt(cost)+' jt')+'</span></div><div class="row"><span>Kapasitas SDM</span><b>'+fmt(c.sdm)+' org-bln</b></div><div class="kd2-bar"><i style="width:'+Math.min(100,usedS/cap*100)+'%;background:#1D3A78"></i><i style="width:'+Math.min(100,(sdmV||0)/cap*100)+'%;background:#F2B92C"></i></div>'+(r.rec?'<p class="kd2-note '+stC(r.rec)+'">Rekomendasi: <b>'+E(r.rec)+'</b>'+(r.cumC!=null&&r.rank?' · biaya kumulatif Rp '+fmt(r.cumC)+' jt':'')+'</p>':'<p class="kd2-note warn">Belum masuk perhitungan roadmap.</p>')+'</div>')+
  '</div><div class="kd2-g2">'+card('✎','Deskripsi singkat',fill('description')?'<p class="kd2-clamp">'+E(x.description)+'</p>':'<p class="kd2-empty">Belum diisi.</p>','<button type="button" class="kd2-link" data-kd2-tab="ctx">Lihat konteks lengkap ›</button>')+card('⛨','Gate penyaringan',gatesHtml(false),'<button type="button" class="kd2-link" data-kd2-tab="gate">Detail ›</button>')+'</div></section>';
 const pCtx='<section class="kd2-pane" data-kd2-pane="ctx"><div class="kd2-ctx"><nav>'+CTX.map(([k,l])=>'<button type="button" data-kd2-ctx="'+k+'">'+l+'<em class="'+(fill(k)?'y':'n')+'">'+(fill(k)?'✓':'kosong')+'</em></button>').join('')+'</nav><div>'+CTX.map(([k,l])=>'<div class="kd2-blk'+(fill(k)?'':' miss')+'" id="kd2c-'+k+'"><h5>'+l+(fill(k)?'':' <span class="kd2-st warn">Belum diisi</span>')+'</h5>'+(fill(k)?tx(x[k]):'<p class="kd2-empty">Isian ini masih kosong.</p>'+(canCfg()?'<button type="button" class="kd2-btn" data-kd2-edit>✎ Isi sekarang</button>':''))+'</div>').join('')+'</div></div></section>';
 const mainL1=p[1]?.c||'',supL1=new Set(sup.map(z=>EA.path(z)[1]?.c).filter(Boolean));
 const doms=EA?EA.tree.filter(d=>p.length?d[0]===p[0].c||sup.some(z=>EA.path(z)[0]?.c===d[0]):d[0]==='3'):[];
 const pEa='<section class="kd2-pane" data-kd2-pane="ea">'+(EA?'<div class="kd2-eahead"><div class="kd2-dom">'+(EA.tree.map(d=>'<button type="button" data-kd2-dom="'+d[0]+'" class="'+(doms.some(z=>z[0]===d[0])?'on':'')+'">'+E(d[0]+'. '+d[1])+'</button>').join(''))+'</div><span class="kd2-legend"><i class="m"></i>Utama <i class="s"></i>Pendukung</span></div>'+
  EA.tree.map(d=>'<div class="kd2-eamap" data-kd2-dommap="'+d[0]+'"'+(doms.some(z=>z[0]===d[0])?'':' hidden')+'><div class="kd2-l0'+(main===d[0]?' kd2-mn':sup.includes(d[0])?' kd2-su':'')+'"><small>LEVEL 1</small><b>'+E(d[0]+'. '+d[1])+'</b></div><div class="kd2-l1s">'+d[2].map(a=>'<div class="kd2-l1'+(a[0]===main?' kd2-on ke-primary-l2':sup.includes(a[0])?' kd2-su ke-support-l2':a[0]===mainL1?' kd2-on':supL1.has(a[0])?' kd2-su':'')+'"><div class="kd2-t"><code>'+a[0]+'</code>'+E(a[1])+'</div><div class="kd2-l2s">'+a[2].map(b=>'<div class="kd2-l2'+(b[0]===main?' kd2-mn':sup.includes(b[0])?' kd2-su':'')+'"><code>'+b[0]+'</code>'+E(b[1])+'</div>').join('')+'</div></div>').join('')+'</div></div>').join('')+
  '<div class="kd2-eafoot">'+(p.length?'<span>Utama: <b>'+E(EA.label(main))+'</b></span>'+(sup.length?'<span>Pendukung: '+sup.map(z=>'<b>'+E(z)+'</b>').join(', ')+'</span>':''):'<span class="kd2-empty">Belum dipetakan.</span>')+'<span class="kd2-sp"></span>'+(canCfg()?'<button type="button" class="kd2-btn" data-kd2-edit>✎ Ubah pemetaan</button>':'')+'</div>':'<p class="kd2-empty">Taksonomi EA belum termuat.</p>')+'</section>';
 const est=(icon,val,lab,miss)=>'<div class="kd2-e'+(miss?' miss':'')+'"><span class="kd2-ic">'+icon+'</span><div><b>'+val+'</b><small>'+lab+'</small></div></div>';
 const pGate='<section class="kd2-pane" data-kd2-pane="gate">'+card('Rp','Estimasi '+D.y,'<div class="kd2-est">'+est('Rp',cost==null?'Belum diisi':'Rp '+fmt(cost,2)+' jt','Estimasi biaya',cost==null)+est('⏱',dur==null?'Belum diisi':fmt(dur,1)+' bulan','Durasi',dur==null)+est('👥',sdmV==null?'Belum diisi':fmt(sdmV,1)+' org-bln','Kebutuhan SDM',sdmV==null)+'</div>')+card('⛨','Gate penyaringan',gatesHtml(true),'<span class="kd2-ct">Semua Ya → Lolos</span>')+'</section>';
 const pSkor='<section class="kd2-pane" data-kd2-pane="skor">'+card('★','Penilaian K1–K7 · profil '+E(c.profile),'<div class="kd2-ks">'+KR.map((k,i)=>{const sv=(r.s||[])[i];return '<div class="kd2-k" data-kd2-k><code>'+k.c+'</code><div class="nm"><b>'+E(k.n)+'</b><small>bobot '+fmt(c.weights[c.profile][i])+'% · klik untuk arti skor</small></div><div class="pips">'+[1,2,3,4,5].map(q=>'<i class="'+(sv&&q<=sv?'on'+(sv===5?' hi':''):'')+'"></i>').join('')+'</div><div class="w"><b>'+(sv??'–')+'</b>/5</div><div class="rub">'+(sv?'<b>'+sv+' =</b> '+E(RUB[k.c][sv-1]):'Belum dinilai. Arti skor: '+RUB[k.c].map((t2,q)=>(q+1)+' = '+t2).join(' · '))+'</div></div>'}).join('')+'</div><div class="kd2-skfoot"><span>Skor tertimbang = Σ(skor × bobot) ÷ 5 × 100 = <b>'+(score==null?'—':fmt(score,2))+'</b></span><span class="kd2-sp"></span>'+(r.quad?'<span>Kuadran <b>'+E(r.quad)+'</b>'+(r.wsjf!=null?' · WSJF '+fmt(r.wsjf,2):'')+(r.stab?' · '+E(r.stab):'')+'</span>':'')+'</div>','<span class="kd2-ct">Diisi di Prioritasi › Penilaian & Peringkat</span>')+'</section>';
 const upd=n._doc.updatedAt?new Date(n._doc.updatedAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'';
 const foot='<footer class="kd2-foot"><span>'+(x.psFromImport?'Sumber: impor Kertas Kerja A':'Usulan Non-ISTK')+(upd?' · diperbarui '+upd:'')+'</span><span class="kd2-sp"></span>'+(canCfg()?'<button type="button" class="kd2-btn gold" data-kd2-map>↪ Petakan ke ISTK</button><button type="button" class="kd2-btn pri" data-kd2-edit>✎ Ubah</button>':'<button type="button" class="kd2-btn" data-kd2-close>Tutup</button>')+'</footer>';
 document.querySelector('.kd2-ov')?.remove();
 const ov=document.createElement('div');ov.className='kd2-ov';ov.innerHTML='<section class="kd2" role="dialog" aria-modal="true" aria-label="Detail usulan '+E(x.name)+'">'+hero+step+'<main class="kd2-body">'+pRing+pCtx+pEa+pGate+pSkor+'</main>'+foot+'</section>';
 document.body.appendChild(ov);
 const ctxNav=kd2ContextNav(ov,'data-kd2-ctx','kd2c-');
 const show=t=>{ov.querySelectorAll('[data-kd2-tab]').forEach(b=>b.classList.toggle('on',b.dataset.kd2Tab===t&&b.closest('.kd2-tb')));ov.querySelectorAll('[data-kd2-pane]').forEach(pn=>pn.classList.toggle('on',pn.dataset.kd2Pane===t));ov.querySelector('.kd2-body').scrollTop=0;if(t==='ctx')ctxNav.reset()};
 show(tab||'ring');
 const close=()=>{ov.remove();document.removeEventListener('keydown',esc)},esc=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',esc);
 ov.addEventListener('click',e=>{const t=e.target;
  if(t===ov||t.closest('[data-kd2-close]'))return close();
  const tb=t.closest('[data-kd2-tab]');if(tb)return show(tb.dataset.kd2Tab);
  const cx=t.closest('[data-kd2-ctx]');if(cx){ctxNav.go(cx.dataset.kd2Ctx);return}
  const dm=t.closest('[data-kd2-dom]');if(dm){dm.classList.toggle('on');ov.querySelectorAll('[data-kd2-dommap]').forEach(m=>{m.hidden=!ov.querySelector('[data-kd2-dom="'+m.dataset.kd2Dommap+'"]').classList.contains('on')});return}
  const k=t.closest('[data-kd2-k]');if(k)return k.classList.toggle('open');
  if(t.closest('[data-kd2-edit]')&&canCfg()){close();nonEdit(id,false,t.closest('.kd2-step,.kd2-eafoot')?'ea':ov.querySelector('.kd2-pane.on')?.dataset.kd2Pane||'ring');return}
  if(t.closest('[data-kd2-map]')&&canCfg()){close();nonMap(id);return}
 });
}
function usulanView(D){
 const L=nonP().psProjects,ed=canCfg(),q=T(ui().uq).toLowerCase();
 const rows=L.filter(x=>!q||[x.name,x.psOriginRef,x.uic,x.businessOwner,x.initiativeType].join(' ').toLowerCase().includes(q));
 const cm=x=>x.estimatedCost===''||x.estimatedCost==null?'—':fmt(x.estimatedCost/1e6,2);
 const tr=rows.map((x,i)=>{const g=gateOf(x),v=validasi(x);return '<tr class="kka-row-click" data-kka-nonview="'+E(x.id)+'" tabindex="0" title="Lihat detail usulan"><td class="n">'+(i+1)+'</td><td><small>'+E(x.psOriginRef||'—')+'</small></td><td class="kka-nm"><b>'+E(x.name)+'</b><small>'+E([x.category,x.initiativeType].filter(Boolean).join(' · '))+'</small></td><td>'+E(x.uic||'—')+'</td><td><small>'+E(x.businessOwner||'—')+'</small></td><td><small>'+E(x.spbeDomain||'—')+'</small></td><td class="n">'+cm(x)+'</td><td class="n">'+fmt(num(x.durationMonths),1)+'</td><td class="n">'+fmt(num(x.estimatedStaffMonths),1)+'</td>'+
  GATES.map(z=>'<td class="c">'+(x[z[0]]==='Ya'?'✓':x[z[0]]==='Tidak'?'✗':'·')+'</td>').join('')+'<td><span class="kka-chip '+gateCls(g)+'">'+g+'</span></td><td><span class="kka-chip '+(v==='OK'?'ok':'warn')+'" title="'+E(v)+'">'+(v==='OK'?'OK':'Lengkapi')+'</span></td>'+
  '<td class="kka-act"><button type="button" class="kka-ib" data-kka-nondetail="'+E(x.id)+'" title="Lihat detail usulan">👁</button>'+(ed?'<button type="button" class="kka-ib" data-kka-nonedit="'+E(x.id)+'" title="Ubah usulan">✎</button><button type="button" class="kka-ib" data-kka-nonmap="'+E(x.id)+'" title="Petakan ke program ISTK">↪</button><button type="button" class="kka-ib" data-kka-nondel="'+E(x.id)+'" title="Hapus usulan">🗑</button>':'')+'</td></tr>'}).join('');
 return '<div class="kka-card"><div class="kka-cardh"><h3>Usulan Pengembangan SI di Luar ISTK · '+D.y+ic('Daftar usulan mengikuti sheet Usulan Kertas Kerja A. Klik baris untuk melihat isian lengkap. Proyek program ISTK tidak dicatat di sini karena sudah diprioritaskan otomatis.')+'</h3><span class="kka-sp"></span>'+
  '<input class="kka-q" type="search" data-kka-uq placeholder="Cari usulan…" value="'+E(ui().uq||'')+'" aria-label="Cari usulan">'+
  (ed?'<button type="button" class="btn btn-sm pri" data-kka-nonadd>+ Tambah Usulan</button>':'')+'<button type="button" class="btn btn-sm" data-kka-import title="Impor workbook Kertas Kerja A (sheet Usulan)">↑ Impor</button><button type="button" class="btn btn-sm" data-kka-uxlsx>⇩ Excel</button></div>'+
  '<div class="kka-scroll"><table class="kka-t"><thead><tr><th>No</th><th>ID</th><th>Nama sistem / modul</th><th>UE I</th><th>Unit pemilik</th><th>Domain SPBE</th><th>Biaya (Rp jt)</th><th>Durasi (bln)</th><th>SDM (org-bln)</th>'+GATES.map(z=>'<th class="c" title="'+E(z[3])+'">'+z[1]+'</th>').join('')+'<th>Hasil gate</th><th>Validasi</th><th></th></tr></thead><tbody>'+
  (tr||'<tr><td colspan="17" class="kka-empty">Belum ada usulan di luar ISTK untuk '+D.y+'. Gunakan <b>+ Tambah Usulan</b> atau <b>↑ Impor</b> dari workbook Kertas Kerja A.</td></tr>')+'</tbody></table></div>'+
  '<p class="kka-note">Setelah usulan lengkap, beri skor K1–K7 di Prioritasi › <b>Penilaian & Peringkat</b> (MCDA). Tombol ↪ memetakan usulan ke program ISTK bila diputuskan.</p></div>';
}
/* Petakan usulan non-ISTK ke program ISTK: dipindah ke p.psProjects (isian ikut), kode proyek dibuat; selanjutnya prioritas otomatis & ikut alur Charter–Penetapan–WBS. */
function nonMap(id){
 const n=nonP(),i=n.psProjects.findIndex(z=>String(z.id)===String(id));if(i<0||!canCfg())return;const x=n.psProjects[i];
 const progs=I.programs().filter(p=>!p.arsip&&p.psListStatus!=='Arsip'&&p.psStatus!=='Ditetapkan');
 if(!progs.length){say('Belum ada program ISTK '+year()+' yang masih dapat diubah.');return}
 modal('Petakan ke Program ISTK',`<p style="margin:0 0 8px">Pindahkan <b>${E(x.name)}</b> ke program ISTK berikut. Setelah dipetakan, usulan menjadi proyek ISTK: diprioritaskan otomatis (tidak dinilai MCDA) dan ikut alur Charter, Penetapan Program, Draft RKMK, dan WBS.</p>
 <div class="fld"><label for="kn-map">Program ISTK tujuan</label><select id="kn-map">${progs.map(p=>'<option value="'+E(p.id)+'">'+E((p.kodeResmi||p.kode||'')+' · '+p.nama)+'</option>').join('')}</select></div>
 <p class="s" style="margin:8px 0 0">Isian usulan, estimasi, dan gate ikut dipindahkan; skor K1–K7 disimpan sebagai riwayat.</p>`,'Petakan',o=>{
  const p=progs.find(z=>String(z.id)===o.querySelector('#kn-map').value);if(!p)return false;
  if((p.psProjects||[]).some(z=>nk(z.name)===nk(x.name))){say('Nama proyek sudah ada pada program tersebut.');return false}
  const z=Object.assign({},x,{id:'proj-'+uid(),included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[],psOriginYear:null,psFromNonIstk:{id:x.id,at:new Date().toISOString(),by:me()?.email||''}});delete z.nonIstk;
  p.psProjects=p.psProjects||[];p.psProjects.push(z);n.psProjects.splice(i,1);
  try{window.MT_PS_SCOPE&&window.MT_PS_SCOPE.normalizeProjectCodes&&window.MT_PS_SCOPE.normalizeProjectCodes(p)}catch(_){}
  p.psUpdatedAt=new Date().toISOString();n._doc.updatedAt=p.psUpdatedAt;try{log('Petakan usulan non-ISTK ke program',x.name+' → '+p.nama)}catch(_){}save();render();say(x.name+' dipetakan ke '+p.nama+'.')},{size:'sm'});
}
/* Tampilan Pemetaan Proyek › Usulan Non-ISTK: mengikuti pola tab Usulan Proyek ISTK (header, panel accordion, tabel psbank, ikon aksi). */
const SVG={view:'<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',edit:'<path d="M12 20h9"/><path d="M16.8 3.8a2.2 2.2 0 0 1 3.1 3.1L9 17.8l-4.5 1 1-4.5z"/>',map:'<path d="M4 12h12"/><path d="m12 6 6 6-6 6"/><path d="M20 5v14"/>',delete:'<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'};
const ib=(kind,attr,id,title)=>'<button type="button" class="psbank-action-icon '+(kind==='map'?'view':kind)+'" '+attr+'="'+E(id)+'" title="'+E(title)+'" aria-label="'+E(title)+'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+SVG[kind]+'</svg></button>';
function usulanMapView(){
 const y=year(),L=nonP().psProjects,ed=canCfg(),q=T(ui().uq).toLowerCase(),open=ui().nonOpen!==false;
 const rows=L.filter(x=>!q||[x.name,x.psOriginRef,x.uic,x.businessOwner,x.initiativeType,x.description,x.category].join(' ').toLowerCase().includes(q));
 const est=x=>{const c=x.estimatedCost===''||x.estimatedCost==null?'—':'Rp '+fmt(x.estimatedCost/1e6,0)+' jt';return '<b>'+c+'</b><small>'+(x.durationMonths===''||x.durationMonths==null?'—':fmt(+x.durationMonths,0)+' bln')+' · '+(x.estimatedStaffMonths===''||x.estimatedStaffMonths==null?'—':fmt(+x.estimatedStaffMonths,0)+' org-bln')+'</small>'};
 const dots=x=>'<span class="kn-dots" title="'+E(GATES.map(z=>z[1]+': '+(x[z[0]]||'belum dijawab')).join(' · '))+'">'+GATES.map(z=>'<i class="'+(x[z[0]]==='Ya'?'y':x[z[0]]==='Tidak'?'n':'')+'">'+z[1].slice(1)+'</i>').join('')+'</span>';
 const tr=rows.map(x=>{const g=gateOf(x),v=validasi(x),d=T(x.description);return '<tr tabindex="0" class="psbank-clickrow" data-kka-nonview="'+E(x.id)+'" title="Lihat detail '+E(x.name)+'">'+
  '<td data-label="ID / EA"><b class="kn-id">'+E(x.psOriginRef||'—')+'</b>'+(window.MT_EA&&MT_EA.primary(x)?'<small class="kn-ea" title="'+E(MT_EA.path(MT_EA.primary(x)).map(z=>z.c+' '+z.n).join(' › '))+'">EA '+E(MT_EA.primary(x))+'</small>':'<small class="kn-ea none">EA belum dipetakan</small>')+'</td>'+
  '<td data-label="Nama Sistem / Modul"><b>'+E(x.name)+'</b><small class="kn-sub">'+(x.category?'<span class="kn-cat">'+E(x.category)+'</span> ':'<span class="kn-cat none">Kategori belum dipilih</span> ')+E(x.initiativeType||'')+'</small></td>'+
  '<td data-label="Deskripsi" class="psbank-proposal-description" title="'+E(d||'Belum diisi')+'"><span class="psbank-proposal-desc-text">'+E(d||'—')+'</span></td>'+
  '<td data-label="UE I / Unit Pemilik"><b>'+E(x.uic||'—')+'</b><small class="kn-sub">'+E(x.businessOwner||'—')+'</small></td>'+
  '<td data-label="Estimasi" class="kn-est">'+est(x)+'</td>'+
  '<td data-label="Gate">'+dots(x)+'<span class="psbank-status-chip kn-g '+gateCls(g)+'">'+g+'</span></td>'+
  '<td data-label="Validasi"><span class="psbank-status-chip kn-g '+(v==='OK'?'ok':'warn')+'" title="'+E(v)+'">'+(v==='OK'?'Lengkap':'Lengkapi')+'</span></td>'+
  '<td data-label="Aksi" class="psbank-actions">'+ib('view','data-kka-nondetail',x.id,'Lihat detail usulan')+(ed?ib('edit','data-kka-nonedit',x.id,'Ubah usulan')+ib('map','data-kka-nonmap',x.id,'Petakan ke program ISTK')+ib('delete','data-kka-nondel',x.id,'Hapus usulan'):'')+'</td></tr>'}).join('');
 return '<section class="psbank-proposals-detail psbank-proposal-groups">'+pendingBanner(y)+'<div class="psbank-proposal-head"><div><h3>Usulan Non-ISTK · '+y+ic('Usulan pengembangan SI yang tidak termapping ke program ISTK (isian sheet Usulan Kertas Kerja A). Dinilai MCDA di Prioritasi › Penilaian & Peringkat; dapat dipetakan ke program ISTK bila diputuskan.')+'</h3></div><div class="psbank-headright"><span class="psbank-count">'+L.length+' usulan'+(q?' · '+rows.length+' sesuai pencarian':'')+'</span>'+(ed?'<button type="button" class="btn" data-kka-import title="Impor dari workbook Kertas Kerja A (sheet Usulan)">↑ Impor</button>':'')+'<button type="button" class="btn" data-kka-uxlsx title="Unduh dalam format sheet Usulan" '+(L.length?'':'disabled')+'>↓ Excel</button></div></div>'+
  '<details class="psbank-accordion-program psbank-proposal-program kn-panel"'+(open?' open':'')+' data-kka-nonpanel><summary><span class="psbank-chevron" aria-hidden="true">▸</span><span class="psbank-accordion-name"><small>DI LUAR ISTK · tidak termapping ke program</small><b>Usulan Pengembangan SI Non-ISTK</b><small>'+y+' · dinilai MCDA · tidak masuk Penetapan, RKMK, WBS</small></span><span class="psbank-accordion-count">'+L.length+' usulan</span></summary>'+
  '<div class="psbank-accordion-body"><div class="psbank-proposal-programtools"><span>RINCIAN USULAN NON-ISTK</span>'+(ed&&L.length?'<button type="button" class="btn pri" data-kka-nonadd>+ Tambah Usulan Non-ISTK</button>':'')+'</div>'+
  (rows.length?'<div class="psbank-tablewrap"><table class="psbank-table psbank-proposal-table kn-table"><colgroup><col style="width:11%"><col style="width:19%"><col style="width:19%"><col style="width:13%"><col style="width:11%"><col style="width:10%"><col style="width:8%"><col style="width:180px"></colgroup><thead><tr><th>ID / Proses EA</th><th>Nama Sistem / Modul</th><th>Deskripsi</th><th>UE I / Unit Pemilik</th><th>Estimasi</th><th>Gate G1–G4</th><th>Validasi</th><th>Aksi</th></tr></thead><tbody>'+tr+'</tbody></table></div>':
   '<div class="kn-empty"><div class="kn-empty-ic" aria-hidden="true">＋</div><b>'+(q?'Tidak ada usulan yang sesuai pencarian.':'Belum ada usulan di luar ISTK untuk '+y+'.')+'</b><p>'+(q?'Ubah kata kunci pada kolom Cari.':'Tambahkan usulan satu per satu, atau impor sekaligus dari workbook Kertas Kerja A (sheet Usulan).')+'</p>'+(!q&&ed?'<div class="kn-empty-act"><button type="button" class="btn pri" data-kka-nonadd>+ Tambah Usulan Non-ISTK</button><button type="button" class="btn" data-kka-import>↑ Impor Kertas Kerja A</button></div>':'')+'</div>')+
  '</div></details></section>';
}
window.MT_TABSEARCH_SET=window.MT_TABSEARCH_SET||{};window.MT_TABSEARCH_SET['ps-nonistk']=v=>{ui().uq=v};
function usulanXlsx(){const X=window.XLSX;if(!X){say('Pustaka Excel belum termuat.');return}const L=nonP().psProjects;
 const head=['ID','Nama Sistem / Modul',...JENIS,'Jenis Inisiatif (ringkas)','UE I','Unit Pemilik Proses Bisnis (Eselon II/unit)','Domain Arsitektur SPBE','Deskripsi Aplikasi/Modul','Urgensi','Landasan Hukum/Regulasi','Strategi Organisasi yang Didukung','Proses Bisnis Terkait','Penjelasan/Narasi Proses Bisnis Aplikasi','Fitur Utama yang Akan Dikembangkan','Estimasi Biaya (Rp juta)','Durasi (bulan)','Kebutuhan SDM (orang-bulan)',...GATES.map(g=>g[1]+' '+g[2]),'Hasil Gate','Validasi','Kategori','Proses Bisnis EA Level 1','Proses Bisnis EA Level 2','Proses Bisnis EA Level 3','Proses Bisnis EA pendukung','Level pemetaan utama','Kode proses utama'];
 const rows=L.map(x=>{const j=String(x.initiativeType||'');return [x.psOriginRef||'',x.name,...JENIS.map(t=>j.includes(t)?'✓':''),j,x.uic||'',x.businessOwner||'',x.spbeDomain||'',x.description||'',x.urgency||'',x.legalBasis||'',x.strategyAlignment||'',x.businessProcess||'',x.businessNarrative||'',x.features||'',x.estimatedCost===''||x.estimatedCost==null?'':x.estimatedCost/1e6,x.durationMonths??'',x.estimatedStaffMonths??'',...GATES.map(g=>x[g[0]]||''),gateOf(x),validasi(x),x.category||'',...(()=>{const P=window.MT_EA&&MT_EA.primary(x)?MT_EA.path(MT_EA.primary(x)):[];return [0,1,2].map(i=>P[i]?P[i].c+' '+P[i].n:'')})(),(x.eaSupport||[]).map(c=>window.MT_EA?MT_EA.label(c):c).join('; '),window.MT_EA?MT_EA.level(MT_EA.primary(x))||'':'',window.MT_EA?MT_EA.primary(x):'']});
 const ws=X.utils.aoa_to_sheet([head,...rows]);ws['!cols']=head.map((h,i)=>({wch:i===1?36:i>=12&&i<=18?40:14}));const wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,'Usulan');X.writeFile(wb,'Usulan_Non-ISTK_'+year()+'.xlsx')}
/* ---------- event ---------- */
function findX(id){for(const p of allProgs())for(const x of (p.psProjects||[]))if(String(x.id)===String(id))return {p,x};return null}
document.addEventListener('click',ev=>{
 const t=ev.target;if(!t.closest||!t.closest('.kka,.ps27-priority-head,.kka-syncnotice'))return;
 {const rw=t.closest('[data-kka-nonview]');if(rw&&!t.closest('button')){nonDetail(rw.dataset.kkaNonview);return}}
 const b=t.closest('button');if(!b)return;const u=ui();
 if(b.hasAttribute('data-kka-retry')){void syncImport(year());return}
 if(b.hasAttribute('data-kka-draft')){downloadPending(year());return}
 if(b.dataset.kkaSub){u.sub=b.dataset.kkaSub;save();render();return}
 if(b.dataset.kkaKpi&&Object.prototype.hasOwnProperty.call(KFILTER,b.dataset.kkaKpi)){const key=b.dataset.kkaKpi;if(u.sub==='rank'&&u.kpi===key){u.kpi='';}else{u.kpi=key;u.scope=kpiScope(key);u.ue=[];u.q='';u.sub='rank';}render();return}
 if(b.dataset.kkaScope){u.kpi='';u.scope=b.dataset.kkaScope;save();render();return}
 if(b.hasAttribute('data-kka-ue-clear')){u.ue=[];save();render();return}
 if(b.hasAttribute('data-kka-xlsx')){try{const d=currentData();downloadXlsx(d,'Prioritas_SI_KertasKerjaA_'+d.year+'.xlsx');say('Excel hasil prioritasi diunduh.')}catch(e){say(e.message)}return}
 if(b.hasAttribute('data-kka-import')){const i=document.createElement('input');i.type='file';i.accept='.xlsx,.xlsm,.xls';i.onchange=()=>{if(i.files[0])importFile(i.files[0])};i.click();return}
 if(b.hasAttribute('data-kka-snap')&&canCfg()){snapDialog();return}
 if(b.hasAttribute('data-kka-nonadd')&&canCfg()){nonEdit('');return}
 if(b.hasAttribute('data-kka-uxlsx')){usulanXlsx();return}
 if(b.dataset.kkaNondetail){nonDetail(b.dataset.kkaNondetail);return}
 if(b.dataset.kkaNonmap&&canCfg()){nonMap(b.dataset.kkaNonmap);return}
 if(b.dataset.kkaNonedit&&canCfg()){nonEdit(b.dataset.kkaNonedit);return}
 if(b.dataset.kkaNondel&&canCfg()){const n=nonP(),i=n.psProjects.findIndex(z=>String(z.id)===String(b.dataset.kkaNondel));if(i<0)return;const nm=n.psProjects[i].name;const go=()=>{n.psProjects.splice(i,1);try{log('Hapus usulan di luar ISTK',nm)}catch(_){}save();render();say('Usulan dihapus.')};if(typeof window.MT_PS_CONFIRM==='function')window.MT_PS_CONFIRM('Hapus usulan?','"'+nm+'" akan dihapus dari daftar usulan di luar ISTK.',go);else go();return}
 if(b.dataset.kkaSnapview){snapView(b.dataset.kkaSnapview);return}
 if(b.dataset.kkaSnapx){const s=store()[b.dataset.kkaSnapx];if(s)try{downloadXlsx({year:s.year,cfg:s.cfg,sum:s.sum,rows:s.rows},'Prioritas_SI_'+s.year+'_v'+s.version+'.xlsx')}catch(e){say(e.message)}return}
 if(b.dataset.kkaSnapfinal&&canCfg()){const st=store();snaps().forEach(s=>{if(s.status==='Final')st[s.key].status='Draft'});st[b.dataset.kkaSnapfinal].status='Final';try{log('Tandai final hasil prioritasi',b.dataset.kkaSnapfinal)}catch(_){}save();render();return}
 if(b.dataset.kkaSnapdel&&canCfg()){const k=b.dataset.kkaSnapdel,s=store()[k];if(!s||s.status==='Final')return;const go=()=>{delete store()[k];save();render();say('Versi v'+s.version+' dihapus.')};if(typeof window.MT_PS_CONFIRM==='function')window.MT_PS_CONFIRM('Hapus v'+s.version+'?','Hasil "'+s.title+'" akan dihapus dari repositori.',go);else go();return}
 if(b.dataset.kkaSetprof&&canCfg()){if(cfg().profile!==b.dataset.kkaSetprof){setCfg({profile:b.dataset.kkaSetprof});render()}return}
 if(b.dataset.kkaWstep&&canCfg()){const[pr,i,d]=b.dataset.kkaWstep.split('|'),w=cfg().weights;w[pr][+i]=Math.max(0,Math.min(100,(+w[pr][+i]||0)+(+d)));setCfg({weights:w});render();return}
 if(b.dataset.kkaWfix&&canCfg()){const pr=b.dataset.kkaWfix,w=cfg().weights,t=w[pr].reduce((a,v)=>a+(+v||0),0);if(t>0){const n=w[pr].map(v=>Math.round(v/t*100));n[n.indexOf(Math.max(...n))]+=100-n.reduce((a,v)=>a+v,0);w[pr]=n;setCfg({weights:w});render();say('Bobot '+pr+' dinormalisasi ke 100%.')}return}
 if(b.hasAttribute('data-kka-wreset')&&canCfg()){setCfg({weights:JSON.parse(JSON.stringify(DEFW))});render();say('Bobot dikembalikan ke bawaan.');return}
});
document.addEventListener('change',ev=>{
 const t=ev.target;if(!t.closest||!t.closest('.kka'))return;const u=ui();
 if(t.matches('[data-kka-mode]')){u.mode=t.value;save();render();return}
 if(t.matches('[data-kka-ue]')){const v=t.dataset.kkaUe,a=new Set(u.ue||[]);t.checked?a.add(v):a.delete(v);u.ue=[...a];save();render();return}
 if(t.matches('[data-kka-gatecb]')){const[id,k]=t.dataset.kkaGatecb.split('|'),f=findX(id);if(!f||roP(f.p))return;f.x[k]=t.checked?'Ya':'Tidak';f.p.psUpdatedAt=new Date().toISOString();save();render();return}
 if(t.matches('[data-kka-score],[data-kka-gate]')){const[id,k]=(t.dataset.kkaScore||t.dataset.kkaGate).split('|'),f=findX(id);if(!f||roP(f.p))return;
  if(t.dataset.kkaScore){f.x.kka=f.x.kka||{};if(t.value==='')delete f.x.kka[k];else f.x.kka[k]=+t.value}else f.x[k]=t.value;
  f.p.psUpdatedAt=new Date().toISOString();save();render();return}
 if(!canCfg())return;
 if(t.matches('[data-kka-olsw]')){if(canCfg()){setCfg({onlyPassed:t.checked?'Ya':'Tidak'});render()}return}
 if(t.matches('[data-kka-cfg]')){const k=t.dataset.kkaCfg,v=t.tagName==='SELECT'?t.value:+t.value;if(t.tagName!=='SELECT'&&(!isFinite(v)||v<0)){say('Nilai harus angka nonnegatif.');return}setCfg({[k]:v});render();return}
 if(t.matches('[data-kka-w]')){const[pr,i]=t.dataset.kkaW.split('|'),v=+t.value;if(!isFinite(v)||v<0||v>100){say('Bobot 0–100%.');return}const w=cfg().weights;w[pr][+i]=v;setCfg({weights:w});render();return}
});
/* Dropdown skor: tertutup = angka saja; saat dibuka = angka + arti rubrik. */
const kkaLong=(t,on)=>{if(!t||!t.matches||!t.matches('select[data-kka-score]'))return;[...t.options].forEach(o=>{if(o.dataset.l)o.text=on?o.dataset.l:o.value})};
document.addEventListener('focusin',ev=>kkaLong(ev.target,true));document.addEventListener('mousedown',ev=>kkaLong(ev.target,true),true);
document.addEventListener('focusout',ev=>kkaLong(ev.target,false));document.addEventListener('change',ev=>kkaLong(ev.target,false),true);
document.addEventListener('toggle',ev=>{const t=ev.target;if(t&&t.matches&&t.matches('[data-kka-rub]'))ui().rubOpen=t.open;if(t&&t.matches&&t.matches('[data-kka-nonpanel]'))ui().nonOpen=t.open},true);
document.addEventListener('input',ev=>{const t=ev.target;if(!t.matches||!t.matches('[data-kka-q],[data-kka-uq]'))return;if(t.matches('[data-kka-uq]'))ui().uq=t.value;else ui().q=t.value;clearTimeout(window.__kkaQ);const pos=t.selectionStart;window.__kkaQ=setTimeout(()=>{render();const n=document.querySelector(t.matches('[data-kka-uq]')?'[data-kka-uq]':'[data-kka-q]');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}},260)});

/* ---------- gaya ---------- */
(function style(){if(document.getElementById('kka-style'))return;const s=document.createElement('style');s.id='kka-style';s.textContent=`
.kka-mseg{display:inline-flex;border:1px solid #C9D8EE;border-radius:9px;overflow:hidden;background:#fff}.kka-mseg label{position:relative;padding:0 14px;height:34px;display:flex;align-items:center;font-size:12.5px;font-weight:700;color:#334155;cursor:pointer;border-left:1px solid #E2E8F0;white-space:nowrap}.kka-mseg label:first-child{border-left:0}.kka-mseg label.on{background:#12275A;color:#fff}.kka-mseg label.dis{cursor:default;opacity:.7}.kka-mseg input{position:absolute;opacity:0;pointer-events:none;width:0;height:0}.kka-mlegacy{font-style:normal;font-size:11px;font-weight:700;color:#8A5A00;background:#FFF4D6;border-radius:999px;padding:3px 9px;white-space:nowrap}.kka-method{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:var(--ink-2,#334155)}.kka-method select{width:auto!important;min-height:0!important;line-height:32px!important;padding-top:0!important;padding-bottom:0!important;height:34px;border:1px solid #C9D8EE;border-radius:8px;padding:0 8px;font:inherit;font-weight:600;background:#fff}
.kka{display:flex;flex-direction:column;gap:12px;margin-top:12px}
.kka-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}.kka-kpi{background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:9px 11px}.kka-kpi b{display:block;font-size:20px;color:#0F2346}.kka-kpi b i{font-style:normal;font-size:12px;color:#64748B;font-weight:600}.kka-kpi small{font-size:11px;color:#64748B}.kka-kpi.ok b{color:#0F7A4B}.kka-kpi.fund b{color:#1F5FB8}
.kka-toolbar,.kka-cardh{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.kka-sp{flex:1}.kka-prof{font-size:12px;color:#475569}
.kka-seg{display:inline-flex;border:1px solid #C9D8EE;border-radius:9px;overflow:hidden}.kka-seg button{border:0;background:#fff;padding:6px 11px;font:600 12px inherit;cursor:pointer;color:#334155}.kka-seg button.on{background:#12275A;color:#fff}
.kka-inl{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#334155}.kka .kka-inl select,.kka .kka-q{height:32px!important;min-height:0!important;line-height:30px!important;padding-top:0!important;padding-bottom:0!important;width:auto!important;border:1px solid #C9D8EE;border-radius:8px;padding:0 8px;font:inherit;font-size:12.5px;background:#fff}.kka .kka-q{width:170px!important;min-width:0!important;flex:0 0 170px}
.kka-uef{position:relative;font-size:12px}.kka-uef summary{cursor:pointer;height:32px;display:flex;align-items:center;border:1px solid #C9D8EE;border-radius:8px;padding:0 10px;background:#fff;font-weight:600;list-style:none}.kka-uef>div{position:absolute;z-index:20;top:36px;left:0;background:#fff;border:1px solid #D6DEEA;border-radius:10px;padding:8px;box-shadow:0 10px 24px rgba(15,35,70,.12);display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;min-width:240px}.kka-uef label{display:flex;gap:6px;align-items:center}
.kka-card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:14px}.kka-card h3{margin:0 0 10px;font-size:14px;color:#0F2346;display:flex;align-items:center;gap:6px}.kka-cardh h3{margin:0}
.kka-scroll{overflow:auto;border:1px solid #E2E8F0;border-radius:10px;background:#fff}
.kka-t{width:100%;border-collapse:collapse;font-size:12.5px}.kka-t th{position:sticky;top:0;background:#F1F5FB;color:#1E3A66;font-size:11px;text-align:left;padding:7px 8px;border-bottom:1px solid #DCE4EF;white-space:nowrap;z-index:1}.kka-t th small{display:block;font-weight:500;color:#64748B}.kka-t th em{display:block;font-style:normal;color:#1F5FB8}
.kka-t td{padding:5px 6px;border-bottom:1px solid #EEF2F7;vertical-align:middle}.kka-t td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.kka-nm{min-width:220px}.kka-nm small,.kka-t td small{display:block;color:#64748B;font-size:11px}
.kka .kka-t select{height:28px!important;min-height:0!important;width:auto!important;min-width:48px!important;max-width:58px!important;border:1px solid #C9D8EE;border-radius:6px;font:inherit;font-size:12px;line-height:26px!important;padding:0 18px 0 6px!important;background-color:#FFFBEA}.kka .kka-t td.kka-g select{min-width:74px!important;max-width:80px!important}.kka-t th.kka-k{white-space:normal;min-width:58px;max-width:76px;line-height:1.2}.kka-t th.kka-g{text-align:center}.kka-t select:disabled{background:#F8FAFC;color:#334155}.kka-k,.kka-g{text-align:center}
.kka-rk{font-weight:800;color:#0F2346;text-align:center}.kka-sc{font-weight:800;color:#0F2346;text-align:right}.kka-nr td{color:#64748B}
.kka-chip{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;background:#EEF2F7;color:#334155}.kka-chip.ok{background:#E3F5EB;color:#0F7A4B}.kka-chip.bad{background:#FDE8E8;color:#B42318}.kka-chip.warn{background:#FFF4D6;color:#8A5A00}.kka-chip.p1{background:#0F7A4B;color:#fff}.kka-chip.p2{background:#D7F0E2;color:#0F5E3B}.kka-chip.p3{background:#FFF0C2;color:#7A5300}.kka-chip.p4{background:#F1F5F9;color:#475569}
.kka-note{font-size:12px;color:#64748B;margin:0}.kka-warn{color:#8A5A00}.kka-empty{padding:18px;text-align:center;color:#64748B}
.kka-sets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.kka-set span{display:flex;align-items:center;gap:4px;font-size:11.5px;font-weight:700;color:#1E3A66;margin-bottom:4px}.kka-set input,.kka-set select{width:100%;height:34px;border:1px solid #C9D8EE;border-radius:8px;padding:0 9px;font:inherit;background:#FFFBEA}.kka .kka-set select{line-height:32px!important;padding-top:0!important;padding-bottom:0!important;min-height:0!important}.kka-set input:disabled,.kka-set select:disabled{background:#F8FAFC}
.kka-wt td.kka-w{white-space:nowrap}.kka-wt input{width:58px;height:28px;border:1px solid #C9D8EE;border-radius:6px;padding:0 6px;font:inherit;background:#FFFBEA;text-align:right;margin-right:3px}.kka-wt td.on{font-weight:800;color:#1F5FB8}.kka-tot td{font-weight:800}.kka-tot td.ok{color:#0F7A4B}.kka-tot td.bad{color:#B42318}
.kka-actions{display:flex;justify-content:flex-end;margin-top:8px}.kka-act{white-space:nowrap}.kka-act .btn{margin-right:4px}
.kka-grid2{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:12px}.kka-quad{width:100%;height:auto}.kka-ql{font:700 12px Inter,Arial;fill:#475569}.kka-ax{font:10px Inter,Arial;fill:#64748B}.kka-at{font:600 11px Inter,Arial;fill:#334155}.kka-pl{font:700 11px Inter,Arial;fill:#0F2346}
.kka-ql2{display:flex;flex-wrap:wrap;gap:12px;list-style:none;padding:0;margin:6px 0 0;font-size:12px}.kka-bars{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px;font-size:12px}.kka-bars li{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:8px;align-items:center}.kka-bars i{height:8px;background:#EEF2F7;border-radius:6px;overflow:hidden}.kka-bars em{display:block;height:100%;background:#94A3B8}.kka-bars em.p1{background:#0F7A4B}.kka-bars em.p2{background:#5BBF8A}.kka-bars em.p3{background:#F2B92C}.kka-bars em.p4{background:#94A3B8}
.kka-cb{width:18px;height:18px;margin:0;cursor:pointer;accent-color:#0F7A4B;vertical-align:middle}.kka-cb.unset{appearance:none;-webkit-appearance:none;border:1.5px dashed #94A3B8;border-radius:4px;background:#FFFBEA}.kka-cb:disabled{cursor:default}.kka-t th.kka-g,.kka-t td.kka-g{padding-left:4px;padding-right:4px;min-width:40px}.kka-pen thead th{text-transform:none!important;letter-spacing:0!important;background:#12275A!important;color:#fff!important;font-size:11.5px;font-weight:700;vertical-align:middle;text-align:left;padding:9px 8px;border-bottom:0;white-space:nowrap}
.kka-pen thead th span{display:block;font-size:10px;font-weight:500;color:#C7D4EC;margin-top:2px}.kka-pen thead th b{display:block;font-size:12.5px}.kka-pen thead th.r{text-align:right}
.kka-pen thead th.kka-k{text-align:center;min-width:70px;max-width:none!important;white-space:nowrap}.kka-pen thead th.kka-k span{margin:2px 0 5px;white-space:nowrap}.kka-pen thead th.kka-k em{display:block;color:#F2B92C;font-style:normal;font-size:10.5px;font-weight:800;margin-top:3px}
.kka-wbar{display:block;height:5px;margin:0 4px;background:rgba(255,255,255,.18);border-radius:4px;overflow:hidden}.kka-wbar>i{display:block;height:100%;background:#F2B92C}
.kka-pen thead th.kka-g{text-align:center;min-width:44px}.kka-pen thead th.div{border-left:1px solid rgba(255,255,255,.22)}.kka-pen .kka-cat{text-align:center;width:56px}.kka-pen td.kka-cat small{display:block;font-size:10px}
.kd-head{display:flex;gap:16px;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #12275A}.kd-head small{color:#64748B;font-size:11.5px}.kd-head h3{margin:2px 0 6px;font-size:18px;color:#0F2346}.kd-tags{display:flex;flex-wrap:wrap;gap:5px}
.kd-status{display:grid;grid-template-columns:repeat(5,auto);gap:4px 14px;background:#F5F8FD;border:1px solid #E2E8F0;border-radius:10px;padding:8px 12px}.kd-kv span{display:block;font-size:10.5px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:.03em}.kd-kv b{font-size:13px;color:#0F2346;font-weight:700}
.kd-warn{margin:10px 0 0;padding:8px 12px;background:#FFF8E6;border:1px solid #F2D58A;border-radius:8px;color:#7A5300;font-size:12.5px}.kd-empty{color:#94A3B8;font-style:italic;font-weight:400}
.kd-sec{margin-top:14px}.kd-sec h4{margin:0 0 8px;font-size:12.5px;color:#12275A;text-transform:uppercase;letter-spacing:.04em}.kd-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.kd-text{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.kd-text>div{background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:8px 10px}.kd-text span{font-size:11px;font-weight:700;color:#475569}.kd-text p{margin:4px 0 0;font-size:12.5px;line-height:1.5;color:#1E293B}
.kd-gates{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.kd-gates>div{border:1px solid #E2E8F0;border-radius:8px;padding:8px 10px;font-size:12px}.kd-gates b{display:block;color:#0F2346}.kd-gates span{display:block;color:#64748B;margin:2px 0 4px}.kd-gates em{font-style:normal;font-weight:700}.kd-gates .ya{background:#F0FAF4;border-color:#BFE5CE}.kd-gates .ya em{color:#0F7A4B}.kd-gates .tdk{background:#FEF2F2;border-color:#F5C2C2}.kd-gates .tdk em{color:#B42318}.kd-gates .bl{background:#FFFBEA}
.kd-scores{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.kd-scores>div{text-align:center;border:1px solid #E2E8F0;border-radius:8px;padding:6px}.kd-scores b{display:block;font-size:12px;color:#12275A}.kd-scores span{display:block;font-size:10px;color:#64748B}.kd-scores em{display:block;font-style:normal;font-size:18px;font-weight:800;color:#0F2346}
.kka-inmap{margin-top:4px}
.kn-id{font-size:11.5px;color:#334155;font-family:ui-monospace,Consolas,monospace;font-weight:700;word-break:break-all}.kn-sub{display:block;font-size:11px;color:#64748B;margin-top:2px}
.kn-ea{display:inline-block;margin-top:3px;font-size:10.5px;font-weight:800;color:#12275A;background:#EEF2FB;border-radius:5px;padding:0 6px;cursor:help}.kn-ea.none{color:#8A5A00;background:#FFF4D6}.kn-cat{display:inline-block;background:#EEF2FB;color:#12275A;border-radius:5px;padding:0 6px;font-weight:700;font-size:10.5px;margin-right:3px}.kn-cat.none{background:#FFF4D6;color:#8A5A00}.kn-est b{display:block;font-size:12.5px}.kn-est small{display:block;font-size:11px;color:#64748B}
.kn-dots{display:flex;gap:3px;margin-bottom:4px}.kn-dots i{width:18px;height:18px;border-radius:5px;display:grid;place-items:center;font-style:normal;font-size:10px;font-weight:800;background:#FFFBEA;border:1px dashed #CBD5E1;color:#94A3B8}.kn-dots i.y{background:#0F7A4B;border:0;color:#fff}.kn-dots i.n{background:#B42318;border:0;color:#fff}
.kn-g{font-size:11px!important;display:inline-block;padding:2px 9px!important;border-radius:999px!important;font-weight:700;white-space:nowrap}.kn-table td.psbank-actions{white-space:nowrap}.kn-table td.psbank-actions .psbank-action-icon{display:inline-grid;margin-right:4px}.kn-g.ok{background:#E3F5EB!important;color:#0F7A4B!important}.kn-g.warn{background:#FFF4D6!important;color:#8A5A00!important}.kn-g.bad{background:#FDE8E8!important;color:#B42318!important}
.kn-empty{text-align:center;padding:30px 16px 26px;color:#475569}.kn-empty b{display:block;color:#0F2346;font-size:14px}.kn-empty p{margin:4px 0 0;font-size:12.5px}.kn-empty-ic{width:40px;height:40px;border-radius:12px;background:#EEF2FB;color:#4B3A8C;display:grid;place-items:center;margin:0 auto 10px;font-size:20px;font-weight:800}.kn-empty-act{display:flex;gap:8px;justify-content:center;margin-top:12px}
.kn-form section{margin-bottom:12px}.kn-form .fgrid{gap:8px 14px}.kn-form textarea{min-height:64px}.kka-card>.kka-note{margin-top:8px}.kn-form h4{margin:0 0 8px;font-size:12.5px;color:#12275A;border-bottom:1px solid #E2E8F0;padding-bottom:4px}.kn-multi{display:flex;flex-wrap:wrap;gap:6px 16px}.kn-multi label{display:flex;gap:6px;align-items:center;font-weight:500}.kn-multi input{width:auto}.kka-row-click{cursor:pointer}.kka-row-click:hover td{background:#F5F8FD}.kka-t td.c{text-align:center}.kka-istk{background:#12275A!important;color:#fff!important;font-size:10px!important;padding:1px 7px!important}.kka-istk-note{color:#475569;font-size:12px;background:#F8FAFD}.kka-istkrow td{background:#F8FAFD}.kka-kpi.istk b{color:#12275A}.kka-non{background:#EDE9FE!important;color:#5B21B6!important;font-size:10px!important;padding:1px 7px!important;vertical-align:1px;margin-left:4px}.kka .kka-ib{border:0!important;background:none!important;box-shadow:none!important;cursor:pointer;font-size:12px!important;padding:0 3px!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;color:#475569;vertical-align:1px;display:inline}.kka-ib:hover{color:#12275A}.kka-pc{min-width:32px;text-align:center}.kka-chip.p3{background:#FFF0C2;color:#7A5300}
.kka-thc{display:inline-flex;align-items:center;gap:3px}.kka-rub{padding:0}.kka-rub>summary{cursor:pointer;padding:11px 14px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;color:#0F2346;font-size:13px}.kka-rub>summary small{color:#64748B;font-size:11.5px}.kka-rub .kka-scroll{border:0;border-top:1px solid #E2E8F0;border-radius:0 0 12px 12px}.kka-rub td{font-size:12px}.kka-ref td{vertical-align:top}.kka-ref td:nth-child(n+3){min-width:150px}
b.up{color:#0F7A4B}b.dn{color:#B42318}
.kka-syncnotice{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 12px;border:1px solid #ead29b;border-radius:9px;background:#fff8e7;color:#805500;font-size:12px}.kka-syncnotice>div{flex:1;min-width:200px}.kka-syncnotice small{display:block;margin-top:3px;font-size:11px;color:#805500}.kka-syncnotice .btn{white-space:nowrap}
.kka .kka-kpi{--kc:#1f4b82;--kb:#cbdcf0;--kg:#eef5fd;appearance:none;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:5px;position:relative;text-align:left;font:inherit;min-width:0;min-height:77px;width:100%;padding:10px 12px;border:1px solid var(--kb);border-radius:10px;background:linear-gradient(135deg,var(--kg),#fff 140%);color:var(--kc);cursor:pointer;box-shadow:0 2px 5px #0b2d5909;transition:border-color .16s,box-shadow .16s,background .16s}
.kka .kka-kpi.kka-tone-navy{--kc:#173d72;--kb:#c7d9ef;--kg:#eaf2fc}.kka .kka-kpi.kka-tone-violet{--kc:#6346a3;--kb:#ded5f2;--kg:#f3effb}.kka .kka-kpi.kka-tone-green{--kc:#12764e;--kb:#c7e5d5;--kg:#eaf7ef}.kka .kka-kpi.kka-tone-blue{--kc:#215fa9;--kb:#cbdff7;--kg:#edf5ff}.kka .kka-kpi.kka-tone-teal{--kc:#087e83;--kb:#c4e7e5;--kg:#e9f8f7}.kka .kka-kpi.kka-tone-gold{--kc:#986300;--kb:#efdfb7;--kg:#fff7e5}.kka .kka-kpi.kka-tone-slate{--kc:#475e7b;--kb:#d5dfea;--kg:#f0f4f9}
.kka .kka-kpi-label{font-size:11.5px;line-height:1.25;font-weight:700;padding-right:13px;color:var(--kc)}.kka .kka-kpi b{font-size:23px;line-height:1.12;color:var(--kc);font-variant-numeric:tabular-nums}.kka .kka-kpi b i{font-size:12px;color:#53657b;white-space:nowrap}.kka .kka-kpi:after{content:'›';position:absolute;top:7px;right:9px;font-size:19px;font-weight:600;color:var(--kc);opacity:.7}.kka .kka-kpi:hover,.kka .kka-kpi:focus-visible{border-color:var(--kc);box-shadow:0 2px 9px #0b2d5922}.kka .kka-kpi.is-active{border-color:var(--kc);box-shadow:inset 0 0 0 1px var(--kc),0 2px 7px #0b2d5914}.kka .kka-kpi.is-active:after{content:'✓';font-size:13px;opacity:1}
.kka .kka-kpi{background:#fff;border:1px solid #d6e0ef;border-radius:13px;padding:12px 14px;min-height:94px;gap:2px;justify-content:flex-start;box-shadow:0 2px 6px #0b2d5910;transition:transform .16s,border-color .16s,box-shadow .16s}
.kka .kka-kpi:hover,.kka .kka-kpi:focus-visible{transform:translateY(-2px);border-color:#5c86ba;box-shadow:0 2px 6px #0b2d5910}
.kka .kka-kpi:after{content:none}.kka .kka-kpi .kka-kpi-label{color:#3c5174;font-size:12px;font-weight:800;padding-right:16px}
.kka .kka-kpi b{font-size:27px;line-height:1.25;font-weight:800}.kka .kka-kpi small{color:#5F6B85;font-size:11px;line-height:1.3;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kka .kka-kpi.kka-tone-navy{background:linear-gradient(135deg,#064781,#071e51);border-color:#0a4277}.kka .kka-kpi.kka-tone-navy .kka-kpi-label,.kka .kka-kpi.kka-tone-navy b,.kka .kka-kpi.kka-tone-navy small{color:#fff}
.kka .kka-kpi.kka-tone-violet b{color:#6346a3}.kka .kka-kpi.kka-tone-green b{color:#158653}.kka .kka-kpi.kka-tone-blue b{color:#1368d6}.kka .kka-kpi.kka-tone-teal b{color:#087e83}.kka .kka-kpi.kka-tone-gold b{color:#B07400}.kka .kka-kpi.kka-tone-slate b{color:#5F6B85}
.kka .kka-kpi.is-active{border-color:#13294b;box-shadow:inset 0 0 0 1px #13294b,0 4px 12px #0b2d5922}.kka .kka-kpi.kka-tone-navy.is-active{border-color:#0a4277;box-shadow:0 6px 16px #071e5140}
.kka .kka-kpi.is-active:after{content:'✓';position:absolute;top:9px;right:11px;font-size:13px;font-weight:900;color:#13294b;opacity:1}.kka .kka-kpi.kka-tone-navy.is-active:after{color:#fff}
.kka .kka-pen .kka-module-title{display:block;line-height:1.3;overflow-wrap:anywhere}.kka .kka-module-meta{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:3px}.kka .kka-module-meta .kka-non{margin-left:0;vertical-align:middle}.kka .kka-module-actions{display:inline-flex;align-items:center;gap:3px}.kka .kka-pen .kka-nm small:empty{display:none}
.kkb{color:#0F2346;font-size:13px}
.kkb-strip{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:12px 16px;margin-bottom:6px}.kkb-strip h3{margin:0;font-size:16px;color:#12275A}.kkb-strip p{margin:2px 0 0;color:#64748B;font-size:12px}.kkb-sp{flex:1}
.kkb-saved{white-space:nowrap;font-size:12px;font-weight:700;color:#0F7A4B;background:#E3F5EB;border-radius:999px;padding:4px 10px}.kkb-lock{font-size:11.5px;color:#64748B}
.kkb-sech{display:flex;align-items:baseline;gap:10px;margin:16px 0 10px}.kkb-sech h4{margin:0;font-size:15px;color:#12275A}.kkb-sech small{color:#64748B;font-size:12px}
.kkb-profs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.kkb-prof{appearance:none;position:relative;background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:14px 16px;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s;text-align:left;font:inherit;color:#0F2346}
.kkb-prof:not(:disabled):hover{border-color:#9DB3D8;transform:translateY(-2px);box-shadow:0 8px 18px rgba(18,39,90,.08)}.kkb-prof:disabled{cursor:default}
.kkb-prof.on{background:linear-gradient(135deg,#064781,#071e51);border-color:#0a4277;color:#fff}
.kkb-pt{display:flex;align-items:center;gap:8px;padding-right:64px}.kkb-pt b{font-size:14px}.kkb-pt i{font-style:normal;font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 8px;background:#F2B92C;color:#0F2346}
.kkb-prof p{margin:4px 0 10px;font-size:12px;color:#64748B;line-height:1.45}.kkb-prof.on p{color:#C7D4EC}
.kkb-stack{display:flex;height:12px;border-radius:6px;overflow:hidden;background:#EEF2F7}.kkb-stack i{display:block;height:100%}
.kkb-leg{display:flex;justify-content:space-between;gap:4px;margin-top:5px;font-size:10.5px;color:#64748B;font-variant-numeric:tabular-nums}.kkb-prof.on .kkb-leg{color:#C7D4EC}
.kkb-tot{position:absolute;top:12px;right:14px;font-size:11px;font-weight:800;border-radius:999px;padding:2px 8px}.kkb-tot.ok{background:#E3F5EB;color:#0F7A4B}.kkb-tot.bad{background:#FDE8E8;color:#B42318}.kkb-prof.on .kkb-tot.ok{background:rgba(255,255,255,.15);color:#B8F0D2}
.kkb-wgrid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;align-items:start}
.kkb-card{background:#fff;border:1px solid #E2E8F0;border-radius:14px;overflow:auto}
.kkb-wt{width:100%;border-collapse:separate;border-spacing:0}
.kkb-wt th{background:#12275A;color:#fff;font-size:11px;letter-spacing:.04em;text-transform:uppercase;padding:10px 12px;text-align:left;font-weight:800}
.kkb-wt th.kkb-pc{text-align:center;width:132px}.kkb-wt th.kkb-pc.on{background:#0A1C45;box-shadow:inset 0 -3px 0 #F2B92C}.kkb-wt th small{display:block;font-size:9.5px;text-transform:none;letter-spacing:.02em;color:#C7D4EC}
.kkb-wt td{padding:10px 12px;border-bottom:1px solid #EEF2F7;vertical-align:middle}.kkb-wt tbody tr:hover td{background:#FAFBFE}.kkb-wt td.kkb-pc{text-align:center}.kkb-wt td.kkb-pc.on{background:#F6F8FD}
.kkb-kc{display:flex;gap:10px;align-items:flex-start}.kkb-kc code{font-family:ui-monospace,Consolas,monospace;font-weight:900;font-size:12px;border-radius:7px;padding:4px 7px;color:#fff;flex:none}
.kkb-kc b{display:block;font-size:13px}.kkb-kc small{display:block;color:#64748B;font-size:11.5px;line-height:1.4;margin-top:2px}
.kkb-refs{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.kkb-refs span{font-size:10px;font-weight:700;border-radius:5px;padding:1px 6px;background:#EEF2FB;color:#12275A}
.kkb-step{display:inline-flex;align-items:center;border:1px solid #C9D8EE;border-radius:9px;overflow:hidden;background:#fff}
.kka .kkb-step button{width:24px!important;min-width:0!important;height:30px!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#F5F8FD!important;color:#12275A!important;font:800 14px inherit;cursor:pointer;padding:0!important;display:grid;place-items:center}.kka .kkb-step button:hover{background:#E6EDF8!important}
.kka .kkb-step input{width:42px!important;min-width:0!important;height:30px!important;border:0!important;text-align:center;font:800 13px inherit;color:#0F2346;padding:0!important;background:#fff!important;box-shadow:none!important;-moz-appearance:textfield}
.kkb-step input::-webkit-outer-spin-button,.kkb-step input::-webkit-inner-spin-button{-webkit-appearance:none}.kkb-step em{font-style:normal;font-size:11px;color:#64748B;padding-right:6px}
.kkb-mbar{height:4px;width:96px;margin:5px auto 0;border-radius:3px;background:#EEF2F7;overflow:hidden}.kkb-mbar i{display:block;height:100%}.kkb-mbar.w{width:100%;margin:0;height:5px}
.kkb-wt tfoot td{background:#FBFCFE;font-weight:800;border-bottom:0}
.kkb-chk{display:inline-flex;font-size:12px;border-radius:999px;padding:3px 9px}.kkb-chk.ok{background:#E3F5EB;color:#0F7A4B}.kkb-chk.bad{background:#FDE8E8;color:#B42318}
.kkb-fix{display:block;margin:5px auto 0;font:800 10.5px inherit;color:#1D3A78;background:none;border:0;cursor:pointer;text-decoration:underline}
.kkb-side{position:sticky;top:12px;background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:16px}.kkb-side h4{margin:0 0 2px;font-size:13px;color:#12275A}.kkb-side>p{margin:0 0 8px;color:#64748B;font-size:11.5px}
.kkb-donut{display:grid;place-items:center;margin:4px 0 10px}
.kkb-dl{display:flex;flex-direction:column;gap:6px}.kkb-dl div{display:grid;grid-template-columns:12px 28px minmax(0,1fr) 40px;gap:8px;align-items:center;font-size:12px}
.kkb-dl i{width:10px;height:10px;border-radius:3px}.kkb-dl b{font-family:ui-monospace,Consolas,monospace}.kkb-dl span{color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kkb-dl em{font-style:normal;font-weight:800;text-align:right}
.kkb-grp{margin-top:14px;padding-top:12px;border-top:1px dashed #E2E8F0}.kkb-grp small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#64748B;margin-bottom:6px}
.kkb-gb{display:flex;height:26px;border-radius:8px;overflow:hidden;font-size:11px;font-weight:800;color:#fff}.kkb-gb div{display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden}
.kkb-gbl{display:flex;justify-content:space-between;font-size:10.5px;font-weight:700;color:#1D3A78;margin-top:4px}
.kkb-tip{margin-top:12px;background:#FFF4D6;border-radius:10px;padding:9px 11px;font-size:11.5px;color:#5C4300;line-height:1.5}
.kkb-sets{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr) minmax(0,1fr);gap:12px}
.kkb-box{background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:14px 16px}.kkb-box h5{margin:0 0 2px;font-size:13.5px;color:#12275A;display:flex;align-items:center;gap:8px}.kkb-box h5 i{font-style:normal;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:#EEF2FB}
.kkb-box>p{margin:0 0 12px;color:#64748B;font-size:11.5px}
.kkb-fld{margin-bottom:10px;min-width:0}.kkb-fld label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px}
.kkb-inp{min-width:0;display:flex;align-items:center;border:1px solid #C9D8EE;border-radius:10px;background:#fff;overflow:hidden}.kkb-inp:focus-within{border-color:#12275A;box-shadow:0 0 0 3px rgba(29,58,120,.12)}
.kkb-inp span{padding:0 10px;font-size:11.5px;color:#64748B;background:#F5F8FD;align-self:stretch;display:flex;align-items:center;border-right:1px solid #E2E8F0;white-space:nowrap}.kkb-inp span.r{border-right:0;border-left:1px solid #E2E8F0}
.kka .kkb-inp input{flex:1;min-width:0!important;width:auto!important;border:0!important;height:36px!important;padding:0 10px!important;font:700 13px inherit;color:#0F2346;background:#fff!important;box-shadow:none!important}
.kkb-util{margin-top:4px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.kkb-meter{background:#F5F8FD;border-radius:10px;padding:8px 10px}.kkb-meter small{font-size:10.5px;color:#64748B;font-weight:700}.kkb-meter b{display:block;font-size:13px;margin:2px 0 4px}
.kkb-warn{font-size:11.5px;color:#B42318;font-weight:700;margin-top:6px}.kkb-hint{font-size:11px;color:#64748B;margin-top:4px}
.kkb-band{display:flex;height:40px;border-radius:10px;overflow:hidden;margin:6px 0 4px}.kkb-band div{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden}
.kkb-ticks{display:flex;justify-content:space-between;font-size:10px;color:#64748B}.kkb-err{font-size:12px;color:#B42318;font-weight:700;background:#FDE8E8;border-radius:10px;padding:10px 12px;margin:6px 0}
.kkb-thr3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.kkb-thr3 .kkb-fld{margin:0}.kkb-dot{width:10px;height:10px;border-radius:3px;display:inline-block}
.kkb-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#F5F8FD;border-radius:10px;padding:10px 12px;margin-bottom:10px;cursor:pointer}.kkb-toggle b{font-size:12px;display:block}.kkb-toggle small{font-size:11px;color:#64748B}
.kkb-sw{position:relative;width:42px;height:24px;flex:none}.kkb-sw input{position:absolute;opacity:0;width:0;height:0}.kkb-sw i{position:absolute;inset:0;border-radius:999px;background:#CBD5E1;transition:.2s}
.kkb-sw i:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}.kkb-sw input:checked+i{background:#12275A}.kkb-sw input:checked+i:before{transform:translateX(18px)}.kkb-sw input:disabled+i{opacity:.6}
.kkb-foot{margin-top:16px;display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #E2E8F0;border-left:4px solid #F2B92C;border-radius:12px;padding:12px 14px;font-size:12.5px;color:#334155}.kkb-foot b{color:#12275A}
@media(max-width:1200px){.kkb-wgrid,.kkb-sets{grid-template-columns:1fr}.kkb-side{position:static}}
@media(max-width:800px){.kkb-profs{grid-template-columns:1fr}}
@media(max-width:1200px){.kka-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.kka-grid2{grid-template-columns:1fr}.kka-sets{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.kka-kpis{grid-template-columns:1fr 1fr}.kka-sets{grid-template-columns:1fr}}`;document.head.appendChild(s)})();

function refView(){
 if(!window.MT_PS_REFX)return '<div class="kka-card">Memuat referensi…</div>';
 const c=cfg(),W=c.weights[c.profile],COL=['#7FA2E0','#A9BDF0','#E0A82E','#F5CE6B','#3FBF8A','#5FD0E0','#B58BE0'];
 const EV={K1:'Cek dokumen Renstra/IKU dan peta rencana EA; tunjukkan sasaran yang didukung.',K2:'Minta baseline & target manfaat (waktu, biaya, pengguna).',K3:'Sebutkan pasal/temuan dan tenggatnya.',K4:'Apa yang terjadi bila ditunda 12 bulan?',K5:'Cek data master & layanan bersama yang dipakai.',K6:'Cek SOP, sponsor, ketersediaan data, rencana change management.',K7:'Skala terbalik: makin rendah risiko, makin tinggi skor.'};
 const f1=v=>fmt(v,1);
 const crit=KR.map((k,i)=>({code:k.c,name:k.n.replace(' – skor 5 = terendah',' (5 = terendah)'),q:k.q,rub:RUB[k.c],wShort:fmt(W[i])+'%',wText:'bobot '+fmt(W[i])+'%',w:W[i],evidence:EV[k.c],refs:String(k.ref||'').split('; ').filter(Boolean),
  side:'<b>'+fmt(W[i])+'%</b><small>bobot · '+E(c.profile)+'</small>'}));
 const keyOf=t=>(String(t).match(/K[1-7]/g)||[]).filter((v,i,a)=>a.indexOf(v)===i);
 const col=(title,icon,test)=>({icon,title,items:REFS.filter(r=>test(r[1])).map(r=>({t:r[0],sub:r[2],tags:keyOf(r[2])}))});
 const flow=[
  {t:'Gate penyaringan',d:'Usulan disaring 4 syarat sebelum dinilai.',out:[['Lolos','ok'],['Tinjau Ulang','bad'],['Lengkapi','warn']],det:'<div><h5>Aturan</h5><ul><li><b>Lolos</b> bila G1–G4 semua Ya.</li><li><b>Tinjau Ulang</b> bila ada yang Tidak.</li><li><b>Lengkapi</b> bila ada yang belum dijawab.</li><li>'+(c.onlyPassed==='Ya'?'Hanya usulan Lolos yang diranking.':'Semua usulan diranking (pengaturan: tidak hanya yang Lolos).')+'</li></ul></div><div><h5>Empat gate</h5><ul>'+GATES.map(g=>'<li><b>'+E(g[1])+'</b> '+E(g[3])+'</li>').join('')+'</ul></div>'},
  {t:'Skor tertimbang',d:'7 kriteria berskala 1–5 dikalikan bobot profil aktif.',out:[['0–100','n'],[PROFILES.length+' profil bobot','n']],det:'<div><h5>Rumus</h5><p>Skor = Σ(skor K × bobot) ÷ 5 × 100, dibulatkan 2 desimal. Skor dihitung hanya bila 7 kriteria terisi. Bila skor seri, urutan usulan menjadi pemutus.</p><div class="rfx-tip">Profil aktif: <b>'+E(c.profile)+'</b>. Profil lain: '+PROFILES.filter(x=>x!==c.profile).map(E).join(', ')+'.</div></div><div><h5>Kuadran pendukung</h5><p>Nilai Manfaat = K1–K5, Kemudahan = K6–K7 (diboboti). ≥ '+fmt(c.quadThr)+' dianggap tinggi → Quick Win, Proyek Strategis, Pelengkap, Tunda / Kaji Ulang.</p></div>'},
  {t:'Peringkat & kategori',d:'Diurutkan semua UE I atau per UE I; dikelompokkan P1–P4.',out:[['P1','ok'],['P2','ok'],['P3','warn'],['P4','n']],det:'<div><h5>Kategori</h5><div class="rfx-cat"><span style="background:#0F7A4B;color:#fff">P1 ≥ '+fmt(c.p1)+'<br>Utama</span><span style="background:#D7F0E2;color:#0F5E3B">P2 ≥ '+fmt(c.p2)+'<br>Tinggi</span><span style="background:#FFF0C2;color:#7A5300">P3 ≥ '+fmt(c.p3)+'<br>Menengah</span><span style="background:#F1F5F9;color:#475569">P4<br>Rendah/Tunda</span></div></div><div><h5>Pengecekan</h5><ul><li><b>Sensitivitas:</b> peringkat dihitung ulang dengan '+PROFILES.length+' profil; Stabil bila rentang ≤ '+fmt(c.tol)+'.</li><li><b>WSJF</b> = (K2 + K4 + K5) ÷ (6 − K7) sebagai pembanding.</li><li>Proyek ISTK diprioritaskan otomatis, tidak dinilai.</li></ul></div>'},
  {t:'Roadmap pagu & SDM',d:'ISTK otomatis lebih dulu; non-ISTK mengisi sisa pagu & SDM.',out:[['Didanai','ok'],['Cadangan / Tunda','bad']],det:'<div><h5>Aturan greedy</h5><p>Proyek ISTK mengambil pagu & SDM lebih dulu. Usulan non-ISTK diambil mulai peringkat 1 selama biaya <b>dan</b> SDM kumulatif masih muat (pagu '+fmt(c.pagu)+' · SDM '+fmt(c.sdm)+'); yang melampaui menjadi Cadangan/Tunda, usulan berikutnya yang masih muat tetap didanai.</p></div><div><h5>Catatan</h5><ul><li>Biaya bukan kriteria skor.</li><li>Biaya/SDM kosong → "Lengkapi biaya/SDM".</li><li>Simpan hasil ke Repositori sebagai versi Draft/Final.</li></ul></div>'}];
 return '<div class="kka-ref-x">'+window.MT_PS_REFX.html({id:'mcda',eyebrow:'Metode prioritisasi · Kertas Kerja A',title:'MCDA — Skor tertimbang + gate',
  desc:'Usulan pengembangan SI di luar ISTK disaring dengan 4 gate, dinilai 7 kriteria berskala 1–5, diperingkat, lalu dimasukkan ke roadmap sesuai pagu dan kapasitas SDM. Hasilnya bahan keputusan forum tata kelola, bukan penetapan otomatis.',
  chips:['4 gate','7 kriteria',PROFILES.length+' profil bobot','P1–P4','Roadmap pagu & SDM','Uji sensitivitas · WSJF'],
  formula:{label:'Rumus skor tertimbang · profil '+c.profile,f:'Skor = Σ(<em>skor K</em> × <em>bobot</em>) ÷ 5 × 100'},
  wbar:KR.map((k,i)=>({pct:W[i]/Math.max(1,W.reduce((a,b)=>a+b,0))*100,color:COL[i],title:k.c+' '+W[i]+'%'})),
  wleg:KR.map((k,i)=>({color:COL[i],label:k.c,sub:fmt(W[i])+'%'})),
  flow,crit,tools:'',
  rubNote:'5 = paling mendukung untuk diprioritaskan · K7 terbalik (5 = risiko terendah)',searchPh:'Cari kata, mis. audit, shared service…',
  contribLabel:'Bukti yang dicek',
  contribHint:()=>'',
  contrib:(x,i)=>'<b>Skor dipilih: '+(i+1)+'</b>Kontribusi ke skor tertimbang: '+f1((i+1)*x.w/5)+' poin dari '+fmt(x.w)+'.',
  filters:KR.map((k,i)=>({key:k.c,label:k.c,color:COL[i]})),refNote:'klik chip kriteria untuk menyorot rujukannya',
  refCols:[col('Regulasi','⚖',t=>t==='Regulasi'),col('Standar','▦',t=>/Standar/.test(t)),col('Literatur & metode','✎',t=>t==='Literatur'||t==='Metode')],
  foot:'<b>Catatan metodologi.</b> Bobot awal dan ambang P1–P3 adalah asumsi penyusun kertas kerja — sepakati melalui forum. Mandat regulasi yang tidak dapat ditawar diberi K3 = 5 dan, bila perlu, dikunci dalam keputusan komite. Verifikasi versi terbaru regulasi sebelum dijadikan dasar resmi.'})+'</div>';
}
function isFunded(x){return x.included!==false} /* program ISTK bermetode MCDA: semua proyek diprioritaskan otomatis */

/* ---------- Detail Usulan Non-ISTK v2 ---------- */
(function(){if(document.getElementById('kd2-style'))return;const st=document.createElement('style');st.id='kd2-style';st.textContent=`
.kd2-ov{position:fixed;inset:0;z-index:1200;background:rgba(10,22,48,.55);display:flex;align-items:center;justify-content:center;padding:18px}
.kd2{width:min(1180px,100%);height:min(880px,calc(100vh - 36px));background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(10,22,48,.4);display:flex;flex-direction:column;overflow:hidden;color:#0F2346;font-size:13px}
.kd2-hero{position:relative;background:linear-gradient(115deg,#0E1F4A 0%,#1D3A78 62%,#24479A 100%);color:#fff;padding:18px 24px 0;overflow:hidden;flex:none}
.kd2-hero:after{content:"";position:absolute;right:-60px;top:-90px;width:330px;height:330px;border-radius:50%;border:1px solid rgba(242,185,44,.32);box-shadow:0 0 0 30px rgba(242,185,44,.05),0 0 0 70px rgba(242,185,44,.03);pointer-events:none}
.kd2-x{position:absolute;right:16px;top:14px;z-index:2;width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:15px;cursor:pointer}
.kd2-top{display:flex;justify-content:space-between;gap:18px;position:relative;z-index:1}
.kd2-id{min-width:0}.kd2-eye{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#C7D4EC;font-weight:800}
.kd2-code{font-family:ui-monospace,Consolas,monospace;letter-spacing:0;text-transform:none;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);padding:2px 8px;border-radius:6px;color:#fff}
.kd2-hero h2{font-size:23px;font-weight:800;margin:7px 0 8px;line-height:1.2;color:#fff}
.kd2-tags{display:flex;gap:6px;flex-wrap:wrap}.kd2-tag{font-size:11px;font-weight:700;border-radius:999px;padding:3px 10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}
.kd2-tag.gold{background:#F2B92C;color:#3D2A00;border-color:#F2B92C}.kd2-tag.vio{background:#EDE9FE;color:#5B21B6;border-color:#EDE9FE}.kd2-tag.warn{background:#FFF4D6;color:#8A5A00;border-color:#FFF4D6}
.kd2-score{display:flex;gap:14px;align-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:10px 14px;margin-right:44px;align-self:flex-start;flex:none}
.kd2-ring{width:72px;height:72px;border-radius:50%;background:conic-gradient(#F2B92C calc(var(--v)*1%),rgba(255,255,255,.15) 0);display:grid;place-items:center}
.kd2-ring>div{width:56px;height:56px;border-radius:50%;background:#16306A;display:grid;place-items:center;text-align:center;line-height:1}.kd2-ring b{font-size:19px;display:block}.kd2-ring small{display:block;font-size:8.5px;color:#C7D4EC;margin-top:2px}
.kd2-kv{display:grid;grid-template-columns:auto auto;gap:5px 14px;align-items:center}.kd2-kv span{color:#C7D4EC;text-transform:uppercase;letter-spacing:.04em;font-weight:800;font-size:9.5px}.kd2-kv b{font-size:12.5px}
.kd2-st{display:inline-block;border-radius:999px;padding:2px 9px;font-size:10.5px;font-weight:800;white-space:nowrap}.kd2-st.ok{background:#E3F5EB;color:#0F7A4B}.kd2-st.warn{background:#FFF4D6;color:#8A5A00}.kd2-st.bad{background:#FDE8E8;color:#B42318}
.kd2-st.p1.p1{background:#0F7A4B;color:#fff}.kd2-st.p1.p2{background:#D7F0E2;color:#0F5E3B}.kd2-st.p1.p3{background:#FFF0C2;color:#7A5300}.kd2-st.p1.p4{background:#F1F5F9;color:#475569}
.kd2-tb{position:relative;z-index:1;display:flex;gap:2px;margin-top:14px}
.kd2-tb button{border:0;background:transparent;color:#C7D4EC;font:700 12.5px inherit;padding:10px 14px;border-radius:10px 10px 0 0;cursor:pointer;display:flex;align-items:center;gap:7px}
.kd2-tb button i{font-style:normal;background:rgba(255,255,255,.14);border-radius:999px;font-size:10px;padding:1px 7px}.kd2-tb button.on{background:#fff;color:#0F2346}.kd2-tb button.on i{background:#FFF4D6;color:#8A5A00}
.kd2-step{display:flex;align-items:center;margin:14px 24px 0;padding:8px 12px;border:1px solid #E2E8F0;border-radius:14px;background:#fff;flex:none;gap:0}
.kd2-step.miss{border-style:dashed;background:#fff;border-color:#CBD5E1}
.kd2-steplab{font-size:10.5px;font-weight:900;letter-spacing:.06em;color:#12275A;text-transform:uppercase;margin-right:12px;display:flex;align-items:center;gap:7px;white-space:nowrap}
.kd2-steplab:before{content:"";width:9px;height:9px;border-radius:2px;transform:rotate(45deg);background:#F2B92C;box-shadow:0 0 0 3px #FFF4D6}
.kd2-stepmiss{color:#8A5A00;font-weight:600;font-size:12.5px}
.kd2-st2{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:10px;min-width:0;flex:1 1 0}.kd2-st2>div{min-width:0}
.kd2-st2 i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:10px;font-weight:900;background:#EEF2FB;color:#12275A;flex:none}
.kd2-st2 small{display:block;font-size:9.5px;color:#64748B;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
.kd2-st2 b{display:block;font-size:12.5px;line-height:1.25}.kd2-st2 b code{font-family:ui-monospace,Consolas,monospace;color:#B7791F;margin-right:4px}
.kd2-st2.on{background:#12275A}.kd2-st2.on i{background:#F2B92C;color:#3D2A00}.kd2-st2.on small{color:#C7D4EC}.kd2-st2.on b{color:#fff}.kd2-st2.on b code{color:#F2B92C}
.kd2-ln{flex:0 0 16px;height:2px;background:#E2E8F0;margin:0 3px}
.kd2-sup{flex:none;margin-left:8px;font-size:11px;font-weight:800;color:#8A5A00;background:#FFF4D6;border-radius:999px;padding:3px 9px;cursor:help}
.kd2-btn{flex:none;margin-left:10px;border:1px solid #C9D8EE;background:#fff;border-radius:10px;padding:7px 13px;font:700 12.5px inherit;color:#12275A;cursor:pointer;white-space:nowrap}
.kd2-btn.pri{background:#12275A;border-color:#12275A;color:#fff}.kd2-btn.gold{background:#F2B92C;border-color:#F2B92C;color:#3D2A00}
.kd2-body{flex:1;overflow:auto;padding:16px 24px 20px;scrollbar-gutter:stable}
.ke-primary-l2 .kd2-t{background:#12275A;color:#fff;border-radius:7px;padding:6px}.ke-primary-l2 .kd2-t code{color:#F2B92C!important}.ke-support-l2 .kd2-t{background:#FFF4D6;border-radius:7px;padding:6px}.ke .kd2-top{min-height:110px}.ke .kd2-id{min-width:0;flex:1}.ke .kd2-id h2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ke .kd2-tags{height:24px;overflow:hidden}.ke .kd2-tb button{flex:1;justify-content:center;white-space:nowrap;font-family:inherit}.ke-strip{min-height:69px}.ke-grid{display:grid;grid-template-columns:1.7fr 1fr;gap:12px;margin-bottom:12px}.ke-grid>div>.kd2-card+.kd2-card{margin-top:12px}.ke-form{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}.ke-form .wide{grid-column:1/-1}.ke-three{grid-template-columns:repeat(3,1fr)}.ke .fld{min-width:0;margin:0;display:flex;flex-direction:column;gap:5px}.ke .fld label{font-weight:650;font-size:12px}.ke input:not([type=checkbox]),.ke textarea,.ke select{min-width:0;width:100%;font:inherit;color:#12275A;background:#fff;border:1px solid #D2DDEB;border-radius:8px;padding:8px 10px;min-height:35px}.ke textarea{resize:vertical;line-height:1.55}.ke .kn-multi{display:flex;flex-wrap:wrap;gap:6px}.ke .kn-multi label{border:1px solid #D2DDEB;border-radius:7px;padding:6px 9px}.ke .kn-multi input{accent-color:#12275A}.ke-note{font-size:11px;color:#64748B;margin:8px 0}.ke-summary{text-align:justify;line-height:1.6;white-space:pre-wrap;margin:0 0 8px}.ke-tools{display:flex;align-items:center;gap:8px;margin-bottom:8px}.ke-tools input{flex:1}.ke-tools select{width:auto;max-width:32%}.ke-node{width:100%;font-family:inherit;text-align:left;cursor:pointer}.ke-node small{margin-left:auto;white-space:nowrap;font-size:10px}.ke-node.kd2-mn{background:#12275A;color:white}.ke-node.kd2-mn code{color:#F2B92C}.ke-node.kd2-su{background:#FFF4D6;color:#805500;border:1px solid #E9C46A}.ke-chip{display:inline-flex;gap:6px;align-items:center;border:1px solid #F2D58A;background:#FFF4D6;padding:4px 7px;border-radius:8px}.ke-chip button,.ke-link{border:0;background:none;cursor:pointer;color:#12275A;font:inherit;font-weight:700}.ke .kd2-eafoot{flex-wrap:wrap}.ke .ke-k{grid-template-columns:36px minmax(0,1fr) 100px 36px}.ke .ke-score-list{gap:0}.ke .ke-score-list .ke-k{grid-template-columns:36px minmax(0,1fr) minmax(0,55%) 24px;gap:10px;padding:10px 0;border-bottom:1px solid #E5EBF3;cursor:default}.ke .ke-score-list .ke-k:last-child{border-bottom:0}.ke .ke-score-list .ke-k>code{background:#FFF4D6;color:#12275A;border:1px solid #F4DFA5;border-radius:6px;padding:5px;text-align:center}.ke .ke-score-list select{font-size:12px;text-overflow:ellipsis;width:100%;min-width:0}.ke .ke-score-list .nm small[data-ke-rub]{line-height:1.45;overflow-wrap:anywhere}.ke .ke-score-list select:focus{outline:1px solid #D4A31B;outline-offset:1px}@media(max-width:700px){.ke .ke-score-list .ke-k{grid-template-columns:32px minmax(0,1fr) 24px;gap:6px}.ke .ke-score-list .ke-k select{grid-column:2;grid-row:2}.ke .ke-score-list .ke-k .w{grid-column:3;grid-row:2}}.ke-k .nm small{display:block}.ke .kd2-btn:disabled{opacity:.45;cursor:default}.ke .kd2-foot{min-height:58px}.ke .kd2-pane>.kd2-card+.kd2-card{margin-top:12px}
@media(max-width:900px){.ke-grid,.ke-form,.ke-three{grid-template-columns:1fr}.ke .kd2-tb{overflow-x:auto}.ke-tools{flex-wrap:wrap}.ke .kd2-foot{flex-wrap:wrap}.ke .kd2-top{min-height:95px}}
.kd2-step{box-shadow:inset 0 2px 0 #F2B92C}.kd2-st2:not(.on){border:1px solid #E2E8F0;border-left:3px solid #DCE5F3}.kd2-steplab{padding-right:12px;border-right:1px solid #E2E8F0}.kd2-l0.kd2-mn{background:#12275A;color:#fff}.kd2-l0.kd2-mn small{color:#F2B92C}.kd2-l0.kd2-su{border-color:#F2D58A;background:#FFF4D6}
.kd2-pane{display:none}.kd2-pane.on{display:block;animation:kd2f .18s ease}@keyframes kd2f{from{opacity:.4;transform:translateY(3px)}to{opacity:1;transform:none}}
.kd2-g3{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:14px}.kd2-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.kd2-card{border:1px solid #E2E8F0;border-radius:14px;padding:14px;background:#fff;margin-bottom:0}.kd2-pane>.kd2-card+.kd2-card{margin-top:14px}
.kd2-card h4{margin:0 0 10px;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#12275A;display:flex;align-items:center;gap:8px}
.kd2-ct{margin-left:auto;font-size:11px;color:#64748B;text-transform:none;letter-spacing:0;font-weight:600}
.kd2-link{margin-left:auto;border:0;background:none;color:#12275A;font:800 11.5px inherit;cursor:pointer;text-transform:none;letter-spacing:0}
.kd2-ic{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:#EEF2FB;color:#12275A;font-size:12px;flex:none;font-weight:800;letter-spacing:0}
.kd2-idl{display:grid;gap:9px}.kd2-idl>div{display:grid;grid-template-columns:130px 1fr;gap:8px}.kd2-idl span{font-size:11px;color:#64748B;font-weight:700}.kd2-idl b{font-size:12.5px}.kd2-idl small{color:#64748B;font-weight:600}
.kd2-empty{color:#94A3B8;font-style:italic;font-weight:500}
.kd2-meter{height:8px;background:#EEF2F7;border-radius:6px;overflow:hidden;margin:2px 0 10px}.kd2-meter i{display:block;height:100%;background:linear-gradient(90deg,#F2B92C,#F59E0B)}
.kd2-checks{display:grid;grid-template-columns:1fr 1fr;gap:5px 12px}.kd2-chk{display:flex;gap:7px;align-items:center;font-size:12px;color:#334155}
.kd2-chk i{width:16px;height:16px;border-radius:5px;display:grid;place-items:center;font-style:normal;font-size:10px;font-weight:900;flex:none}.kd2-chk.y i{background:#0F7A4B;color:#fff}.kd2-chk.n i{background:#FFF4D6;color:#8A5A00;border:1px dashed #E0B44D}.kd2-chk.n{color:#8A5A00;font-weight:600}
.kd2-rm{display:flex;flex-direction:column;gap:7px}.kd2-rm .row{display:flex;justify-content:space-between;font-size:12px}
.kd2-bar{height:10px;border-radius:6px;background:#EEF2F7;overflow:hidden;display:flex}.kd2-bar i{display:block;height:100%}
.kd2-leg{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#64748B}.kd2-leg span:before{content:"";display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:var(--c)}
.kd2-note{margin:4px 0 0;font-size:11.5px;border-radius:8px;padding:6px 9px}.kd2-note.ok{background:#E3F5EB;color:#0F5E3B}.kd2-note.warn{background:#FFF4D6;color:#8A5A00}.kd2-note.bad{background:#FDE8E8;color:#B42318}
.kd2-clamp{margin:0;line-height:1.6;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.kd2-gates{display:grid;grid-template-columns:repeat(4,1fr);position:relative}.kd2-gates:before{content:"";position:absolute;top:17px;left:12%;right:12%;height:3px;background:#E2E8F0}
.kd2-gate{text-align:center;position:relative;padding:0 6px}.kd2-gate .dot{width:36px;height:36px;border-radius:50%;margin:0 auto 6px;display:grid;place-items:center;font-weight:900;border:4px solid #fff;position:relative;background:#fff;color:#94A3B8;box-shadow:0 0 0 1px #CBD5E1}
.kd2-gate.y .dot{background:#0F7A4B;color:#fff;box-shadow:0 0 0 1px #BFE5CE}.kd2-gate.n .dot{background:#B42318;color:#fff;box-shadow:0 0 0 1px #F5C2C2}
.kd2-gate b{font-size:12px}.kd2-gate p{margin:3px 0 0;font-size:11px;color:#64748B;line-height:1.35}.kd2-gate em{display:inline-block;margin-top:5px;font-style:normal;font-size:10.5px;font-weight:800;border-radius:999px;padding:1px 8px;background:#F1F5F9;color:#475569}.kd2-gate.y em{background:#E3F5EB;color:#0F7A4B}.kd2-gate.n em{background:#FDE8E8;color:#B42318}
.kd2-ctx{display:grid;grid-template-columns:210px 1fr;gap:16px}.kd2-ctx>nav{display:flex;flex-direction:column;gap:3px;position:sticky;top:0;align-self:start}
.kd2-ctx>nav button{display:flex;justify-content:space-between;align-items:center;gap:6px;border:0;background:transparent;text-align:left;padding:8px 10px;border-radius:9px;font:600 12.5px inherit;color:#334155;cursor:pointer}
.kd2-ctx>nav button.on{background:#F2F5FA;color:#12275A;box-shadow:inset 3px 0 0 #F2B92C}.kd2-ctx>nav em{font-style:normal;font-size:10px;font-weight:800;border-radius:999px;padding:1px 7px;flex:none}.kd2-ctx>nav em.y{background:#E3F5EB;color:#0F7A4B}.kd2-ctx>nav em.n{background:#FFF4D6;color:#8A5A00}
.kd2-blk{border:1px solid #E2E8F0;border-radius:12px;padding:13px 16px;margin-bottom:10px;scroll-margin-top:8px}.kd2-blk h5{margin:0 0 6px;font-size:13px;color:#12275A;display:flex;gap:8px;align-items:center}
.kd2-blk p,.kd2-blk li{font-size:12.8px;line-height:1.6;color:#1E293B;margin:0 0 4px}.kd2-blk ol{margin:4px 0 0;padding-left:20px}.kd2-blk.miss{background:#FFFBEA;border-style:dashed;border-color:#E9C46A}.kd2-blk .kd2-btn{margin:6px 0 0}
.kd2-eahead{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.kd2-dom{display:flex;gap:6px;flex-wrap:wrap}
.kd2-dom button{border:1px solid #C9D8EE;background:#fff;border-radius:999px;padding:5px 12px;font:700 12px inherit;color:#334155;cursor:pointer}.kd2-dom button.on{background:#12275A;border-color:#12275A;color:#fff}
.kd2-legend{margin-left:auto;font-size:11.5px;color:#64748B;display:flex;align-items:center;gap:6px}.kd2-legend i{width:12px;height:12px;border-radius:3px;display:inline-block}.kd2-legend i.m{background:#12275A}.kd2-legend i.s{background:#FFF1C7;border:1px solid #F2D58A;margin-left:8px}
.kd2-eamap{margin-bottom:12px}.kd2-l0{background:#F5F8FD;border:1px solid #E2E8F0;border-radius:10px;padding:8px 12px;margin-bottom:8px}.kd2-l0 small{font-size:9.5px;font-weight:900;color:#64748B;letter-spacing:.06em;display:block}.kd2-l0 b{font-size:14px}
.kd2-l1s{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.kd2-l1{border:1px solid #E2E8F0;border-radius:12px;padding:9px;background:#fff}.kd2-l1 .kd2-t{display:flex;gap:7px;font-weight:800;font-size:12px;line-height:1.3}
.kd2-l1 code,.kd2-l2 code{font-family:ui-monospace,Consolas,monospace;font-size:10.5px;flex:none}.kd2-l1 .kd2-t code{background:#EEF2FB;color:#12275A;border-radius:5px;padding:1px 5px}
.kd2-l1.kd2-on{border:2px solid #12275A;box-shadow:0 8px 20px rgba(18,39,90,.12)}.kd2-l1.kd2-on .kd2-t code{background:#12275A;color:#fff}.kd2-l1.kd2-su{border-color:#F2D58A}
.kd2-l2s{display:flex;flex-direction:column;gap:4px;margin-top:7px}.kd2-l2{display:flex;gap:6px;font-size:11.5px;line-height:1.3;color:#475569;border-radius:7px;padding:5px 7px;background:#F8FAFC}.kd2-l2 code{color:#94A3B8}
.kd2-l2.kd2-mn{background:#12275A;color:#fff}.kd2-l2.kd2-mn code{color:#F2B92C}.kd2-l2.kd2-su{background:#FFF1C7;color:#5C4300}
.kd2-eafoot{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:10px 12px;border-radius:10px;background:#F5F8FD;font-size:12px}.kd2-eafoot .kd2-btn{margin-left:0}
.kd2-sp{flex:1}
.kd2-est{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.kd2-e{border:1px solid #E2E8F0;border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center}.kd2-e b{display:block;font-size:17px}.kd2-e small{color:#64748B;font-size:11px}.kd2-e.miss{background:#FFFBEA;border-style:dashed;border-color:#E9C46A}.kd2-e.miss b{color:#8A5A00;font-size:14px}
.kd2-ks{display:flex;flex-direction:column;gap:8px}.kd2-k{display:grid;grid-template-columns:36px 1fr 130px 46px;gap:10px;align-items:center;cursor:pointer}
.kd2-k code{font-family:ui-monospace,Consolas,monospace;font-weight:800;color:#12275A}.kd2-k .nm b{display:block;font-size:12.5px}.kd2-k .nm small{font-size:11px;color:#64748B}
.kd2-k .pips{display:flex;gap:3px}.kd2-k .pips i{flex:1;height:10px;border-radius:3px;background:#EEF2F7}.kd2-k .pips i.on{background:#1D3A78}.kd2-k .pips i.hi{background:#F2B92C}
.kd2-k .w{font-size:11px;color:#64748B;text-align:right}.kd2-k .w b{font-size:16px;color:#0F2346}
.kd2-k .rub{grid-column:2/-1;display:none;font-size:11.5px;color:#475569;background:#F5F8FD;border-radius:8px;padding:6px 9px}.kd2-k.open .rub{display:block}
.kd2-skfoot{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;font-size:12px;color:#64748B}.kd2-skfoot b{color:#0F2346}
.kd2-foot{display:flex;gap:8px;align-items:center;padding:12px 24px;border-top:1px solid #E2E8F0;background:#FBFCFE;font-size:11.5px;color:#64748B;flex:none}.kd2-foot .kd2-btn{margin-left:0}
.kn-sup{border:1px solid #C9D8EE;border-radius:9px;background:#fff}.kn-sup summary{cursor:pointer;padding:8px 10px;font-size:12.5px;color:#334155}.kn-sup>div{max-height:260px;overflow:auto;padding:8px 10px;border-top:1px solid #E2E8F0}.kn-sup input[type=search]{width:100%;height:32px;margin-bottom:6px}.kn-supg b{display:block;font-size:11.5px;color:#12275A;margin:6px 0 3px}.kn-supg label{display:flex;gap:6px;align-items:flex-start;font-size:12px;font-weight:500;padding:2px 0}.kn-supg input{width:auto;margin-top:2px}
@media(max-width:900px){.kd2-g3,.kd2-g2,.kd2-ctx,.kd2-est{grid-template-columns:1fr}.kd2-score{display:none}.kd2-step{flex-wrap:wrap;gap:6px}}
`;document.head.appendChild(st)})();
window.MT_PS_KKA={nonAdd:(arr,y)=>{const n=nonP(y);n._keep();arr.forEach(x=>n.psProjects.push(x))},page,nonSmartP,nonMethod,setNonMethod:v=>setCfg({nonMethod:v==='smart'?'smart':'kka'}),methodSelect,importFile,nonProjects:y=>nonP(y).psProjects,usulanHtml:()=>usulanMapView(),compute,cfg,method,isFunded,GATES,KR,version:'20261126-import16'};
})();
