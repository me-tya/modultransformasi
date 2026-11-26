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
const ui=()=>{S.ui.psKka=S.ui.psKka||{sub:'rank',scope:'program',mode:'all',ue:[],q:''};return S.ui.psKka};

/* ---------- wadah proyek di luar ISTK ----------
   Proyek SI yang tidak termapping ke program/ISTK disimpan di S.psKka['non-<tahun>'].projects (koleksi psKka).
   Ikut dinilai & diperingkat MCDA (berbagi pagu & SDM), tetapi tidak masuk Penetapan Program, Charter, Draft RKMK, WBS,
   dan tidak dipantau PMO Kemenkeu (pengelolaan oleh unit pemilik sesuai tata kelola SPBE). Ubah: SA & PMOK. */
const NONK=y=>'non-'+(y||year());
function nonP(y){const st=store(),k=NONK(y),d=st[k]&&Array.isArray(st[k].projects)?st[k]:{year:+(y||year()),projects:[]};
 return {id:'__nonistk',nama:'Di luar ISTK',nonIstk:true,psMethod:'kka',psProjects:d.projects,_doc:d,_keep:()=>{st[k]=d}}}
const roP=p=>p&&p.nonIstk?!canCfg():I.readonly(p);
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
function compute(y){
 y=y||year();const c=cfg(y),wA=wFrac(c,c.profile),progs=I.programs().filter(p=>method(p)==='kka');{const n=nonP(y);if(n.psProjects.length)progs.push(n)}
 const rows=[];let ord=0;
 progs.forEach(p=>(p.psProjects||[]).forEach(x=>{ord++;const s=KR.map(k=>sc(x,k.c)),n=s.filter(v=>v!=null).length,gate=gateOf(x);
  const full=n===7,score=full?weighted(s,wA):null,ranked=full&&(c.onlyPassed==='Tidak'||gate==='Lolos');
  const value=full?Math.round(s.slice(0,5).reduce((a,v,i)=>a+v*wA[i],0)/wA.slice(0,5).reduce((a,v)=>a+v,0)/5*100*10)/10:null;
  const ease=full?Math.round(s.slice(5).reduce((a,v,i)=>a+v*wA[5+i],0)/wA.slice(5).reduce((a,v)=>a+v,0)/5*100*10)/10:null;
  const quad=value==null?'':value>=c.quadThr?(ease>=c.quadThr?'Quick Win':'Proyek Strategis'):(ease>=c.quadThr?'Pelengkap':'Tunda / Kaji Ulang');
  rows.push({ord,p,x,id:x.id,code:x.psCode||'',name:x.name||'',uic:T(x.uic||p.uic),jenis:T(x.initiativeType),gate,g:GATES.map(z=>T(x[z[0]])),s,n,full,score,ranked,
   cat:category(score,c),value,ease,quad,cost:costM(x),dur:num(x.durationMonths),sdmN:num(x.estimatedStaffMonths),
   prof:ranked?PROFILES.map(pr=>weighted(s,wFrac(c,pr))):null,wsjf:ranked?Math.round((s[1]+s[3]+s[4])/(6-s[6])*100)/100:null})}));
 const R=rows.filter(r=>r.ranked);
 R.forEach(r=>{r.sAll=r.score});rankBy(R,'sAll');R.forEach(r=>{r.rank=r.r_sAll});
 const byUe={};R.forEach(r=>{(byUe[r.uic]=byUe[r.uic]||[]).push(r)});Object.values(byUe).forEach(g=>{g.forEach(r=>r.sUe=r.score);rankBy(g,'sUe');g.forEach(r=>r.rankUe=r.r_sUe)});
 PROFILES.forEach((pr,i)=>{R.forEach(r=>r['sp'+i]=r.prof[i]);rankBy(R,'sp'+i)});
 R.forEach(r=>{r.rp=[0,1,2].map(i=>r['r_sp'+i]);r.best=Math.min(...r.rp);r.worst=Math.max(...r.rp);r.stab=r.worst-r.best<=c.tol?'Stabil':'Sensitif bobot'});
 rankBy(R,'wsjf');R.forEach(r=>{r.rankW=r.r_wsjf;r.cons=Math.abs(r.rankW-r.rank)<=c.tol?'Konsisten':'Tinjau'});
 let cc=0,cs=0;R.slice().sort((a,b)=>a.rank-b.rank).forEach(r=>{
  if(r.cost==null||r.sdmN==null){r.rec='Lengkapi biaya/SDM'}else if(cc+r.cost<=c.pagu&&cs+r.sdmN<=c.sdm){r.rec='Didanai '+y;cc+=r.cost;cs+=r.sdmN}else r.rec='Cadangan / Tunda';
  r.cumC=cc;r.cumS=cs;r.appr=APPROACH[r.quad]||''});
 const funded=R.filter(r=>r.rec==='Didanai '+y);
 return {y,c,progs,rows,R,funded,sum:{total:rows.length,lolos:rows.filter(r=>r.gate==='Lolos').length,tinjau:rows.filter(r=>r.gate==='Tinjau Ulang').length,lengkapi:rows.filter(r=>r.gate==='Lengkapi').length,
  lengkap:rows.filter(r=>r.full).length,ranked:R.length,costRanked:R.reduce((a,r)=>a+(r.cost||0),0),costFunded:cc,sdmFunded:cs,nFunded:funded.length,avg:rows.filter(r=>r.full).length?rows.filter(r=>r.full).reduce((a,r)=>a+r.score,0)/rows.filter(r=>r.full).length:null}};
}

/* ---------- tampilan ---------- */
const catCls=c=>c===CATS[0]?'p1':c===CATS[1]?'p2':c===CATS[2]?'p3':c===CATS[3]?'p4':'';
const gateCls=g=>g==='Lolos'?'ok':g==='Tinjau Ulang'?'bad':'warn';
const METHODS=[['smart','SMART','Simple Multi-Attribute Rating Technique: 12 kriteria, skor absolut di atas ambang.'],['kka','MCDA','Multi-Criteria Decision Analysis: gate G1–G4, skor tertimbang 7 kriteria (3 profil bobot), peringkat, dan roadmap terhadap pagu & SDM.']];
function methodSelect(p,ro){const m=method(p);return '<div class="kka-method" role="radiogroup" aria-label="Metode prioritisasi"><span>Metode</span>'+(m==='manual'?'<em class="kka-mlegacy" title="Program ini dibuat dengan pemilihan manual (versi lama). Pilihan proyek tetap dipertahankan sampai metode SMART atau MCDA dipilih.">Manual (lama)</em>':'')+'<div class="kka-mseg">'+METHODS.map(o=>'<label title="'+E(o[2])+'" class="'+(m===o[0]?'on':'')+(ro?' dis':'')+'"><input type="radio" name="pswf-method" value="'+o[0]+'"'+(m===o[0]?' checked':'')+(ro?' disabled':'')+'>'+o[1]+'</label>').join('')+'</div></div>'}
const SUBS=[['rank','Penilaian & Peringkat'],['criteria','Kriteria & Bobot'],['roadmap','Roadmap & Analisis'],['repo','Repositori'],['ref','Referensi & Rubrik']];
function page(p,o){
 o=o||{};const u=ui(),sub=SUBS.some(s=>s[0]===u.sub)?u.sub:'rank',ro=!!o.readOnly;
 const head='<div class="ps27-priority-head"><nav class="ps27-minitabs" role="tablist" aria-label="Tab Prioritasi MCDA">'+SUBS.map(s=>'<button role="tab" type="button" data-kka-sub="'+s[0]+'" aria-selected="'+(sub===s[0])+'" class="'+(sub===s[0]?'on':'')+'">'+s[1]+'</button>').join('')+'</nav>'+
  '<div class="ps27-smart-actions">'+methodSelect(p,ro)+'</div></div>';
 const D=compute();
 const body=sub==='criteria'?criteriaView(D):sub==='roadmap'?roadmapView(D):sub==='repo'?repoView(D):sub==='ref'?refView():rankView(p,D,ro);
 return head+'<div class="kka">'+body+'</div>';
}
function kpis(D){const s=D.sum,c=D.c,k=(v,l,cl)=>'<div class="kka-kpi '+(cl||'')+'"><b>'+v+'</b><small>'+l+'</small></div>';
 return '<div class="kka-kpis">'+k(s.total,'Usulan terdaftar')+k(s.lolos+'<i>/'+s.total+'</i>','Lolos gate','ok')+k(s.lengkap,'Dinilai lengkap (K1–K7)')+k(s.ranked,'Diranking')+
  k(s.nFunded,'Rekomendasi didanai '+D.y,'fund')+k(fmt(s.costFunded)+'<i> / '+fmt(c.pagu)+'</i>','Biaya didanai / pagu (Rp juta)')+k(fmt(s.sdmFunded,1)+'<i> / '+fmt(c.sdm)+'</i>','SDM terpakai / kapasitas (org-bln)')+'</div>'}
function rankView(p,D,ro){
 const u=ui(),scopeAll=u.scope==='all',ueSel=Array.isArray(u.ue)?u.ue:[],q=T(u.q).toLowerCase();
 if(!D.progs.length&&u.scope!=='non'&&!canCfg())return '<div class="kka-empty">Belum ada program tahun '+D.y+' yang memakai metode MCDA.</div>';
 const scopeNon=u.scope==='non';let rows=D.rows.filter(r=>scopeAll||(scopeNon?r.p.nonIstk:r.p===p));
 rows=rows.filter(r=>(!ueSel.length||ueSel.includes(r.uic))&&(!q||(r.name+' '+r.code+' '+r.uic+' '+r.p.nama).toLowerCase().includes(q)));
 const rk=r=>u.mode==='ue'?r.rankUe:r.rank;
 rows.sort((a,b)=>(rk(a)||1e9)-(rk(b)||1e9)||a.ord-b.ord);
 const ues=[...new Set([...UE,...D.rows.map(r=>r.uic).filter(Boolean)])];
 const tb='<div class="kka-toolbar"><div class="kka-seg" role="group" aria-label="Lingkup">'+[['program','Program ini'],['non','Di luar ISTK'+(nonP().psProjects.length?' ('+nonP().psProjects.length+')':'')],['all','Portofolio '+D.y]].map(x=>'<button type="button" data-kka-scope="'+x[0]+'" class="'+((u.scope||'program')===x[0]?'on':'')+'">'+x[1]+'</button>').join('')+'</div>'+
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
 const tr=rows.map(r=>'<tr class="'+(r.ranked?'':'kka-nr')+'"><td class="kka-rk">'+(rk(r)||'—')+'</td><td class="kka-nm"><b>'+E(r.name)+(r.p.nonIstk?' <span class="kka-chip kka-non" title="Tidak termapping ke ISTK: ikut peringkat & roadmap, tidak masuk Penetapan/RKMK/WBS dan tidak dipantau PMO Kemenkeu.">Non-ISTK</span>'+(canCfg()?'<button type="button" class="kka-ib" data-kka-nonedit="'+E(r.id)+'" title="Ubah usulan">✎</button><button type="button" class="kka-ib" data-kka-nondel="'+E(r.id)+'" title="Hapus usulan">🗑</button>':''):'')+'</b><small>'+E([r.code,scopeAll&&!r.p.nonIstk?r.p.nama:''].filter(Boolean).join(' · '))+'</small></td><td>'+E(r.uic||'—')+'</td><td class="kka-sc">'+(r.score==null?'<small>'+r.n+'/7</small>':fmt(r.score,2))+'</td><td class="kka-cat">'+(r.cat?'<span class="kka-chip kka-pc '+catCls(r.cat)+'" title="'+E(r.cat)+'">'+catCls(r.cat).toUpperCase()+'</span>':'<small>—</small>')+(r.full&&!r.ranked?'<small title="Skor lengkap tetapi gate belum Lolos">tdk diranking</small>':'')+'</td>'+
  GATES.map((g,i)=>{const v=r.g[i];return '<td class="kka-g"><input type="checkbox" class="kka-cb'+(v?'':' unset')+'" data-kka-gatecb="'+E(r.id)+'|'+g[0]+'" '+(v==='Ya'?'checked ':'')+(roOf(r)?'disabled ':'')+'title="'+E(g[1]+' '+g[2]+': '+(v||'belum dijawab'))+'" aria-label="'+E(g[1]+' '+g[2]+' – '+r.name)+'"></td>'}).join('')+
  '<td><span class="kka-chip '+gateCls(r.gate)+'">'+r.gate+'</span></td>'+
  KR.map((k,i)=>'<td class="kka-k">'+sel(r,'data-kka-score="'+E(r.id)+'|'+k.c+'"',r.s[i],['',1,2,3,4,5],k.c+' '+r.name,RUB[k.c])+'</td>').join('')+
  '</tr>').join('');
 return kpis(D)+tb+'<div class="kka-scroll"><table class="kka-t kka-pen"><thead><tr><th>'+(u.mode==='ue'?'Rank UE I':'Rank')+'</th><th>Proyek</th><th>UE I</th><th class="r" title="Σ(skor K × bobot aktif) ÷ 5 × 100">Skor<span>bobot aktif</span></th><th class="kka-cat" title="P1 Utama ≥ '+D.c.p1+' · P2 Tinggi ≥ '+D.c.p2+' · P3 Menengah ≥ '+D.c.p3+' · P4 Rendah/Tunda">Kat.</th>'+hdG+'<th>Hasil gate</th>'+hdK+'</tr></thead><tbody>'+(tr||'<tr><td colspan="18" class="kka-empty">Tidak ada proyek sesuai filter.</td></tr>')+'</tbody></table></div>'+
  (scopeNon?'<p class="kka-note kka-warn">Proyek di luar ISTK ikut dinilai dan berbagi pagu & SDM pada roadmap, tetapi tidak masuk Penetapan Program, Charter, Draft RKMK, maupun WBS, dan tidak dipantau PMO Kemenkeu. Pengelolaannya oleh unit pemilik proses bisnis bersama unit TI sesuai tata kelola SPBE.</p>':'')+rubLegend()+'<p class="kka-note">Skor 1–5 per kriteria mengikuti rubrik di atas (juga pada ikon ⓘ judul kolom dan saat dropdown dibuka). K7 terbalik: 5 = risiko terendah. Gate dan estimasi biaya/SDM juga dapat diisi di Pemetaan Proyek › Usulan Proyek. Hasil adalah bahan keputusan; keputusan akhir pada forum tata kelola.</p>';
}
function rubLegend(){
 const open=!!ui().rubOpen;
 return '<details class="kka-card kka-rub" data-kka-rub'+(open?' open':'')+'><summary><b>Arti skor 1–5 tiap kriteria</b><small>5 = paling mendukung untuk diprioritaskan · K7 terbalik: 5 = risiko terendah</small></summary>'+
  '<div class="kka-scroll"><table class="kka-t kka-ref"><thead><tr><th>Kriteria</th><th>1 – Sangat rendah</th><th>2 – Rendah</th><th>3 – Sedang</th><th>4 – Tinggi</th><th>5 – Sangat tinggi</th></tr></thead><tbody>'+
  KR.map(k=>'<tr><td><b>'+k.c+' '+E(k.n)+'</b></td>'+RUB[k.c].map(t=>'<td>'+E(t)+'</td>').join('')+'</tr>').join('')+
  '<tr><td><b>Kategori</b></td><td colspan="5">'+(()=>{const c=cfg();return '<span class="kka-chip kka-pc p1">P1</span> Utama (skor ≥ '+c.p1+') · <span class="kka-chip kka-pc p2">P2</span> Tinggi (≥ '+c.p2+') · <span class="kka-chip kka-pc p3">P3</span> Menengah (≥ '+c.p3+') · <span class="kka-chip kka-pc p4">P4</span> Rendah/Tunda. Skor = Σ(skor K × bobot aktif) ÷ 5 × 100.'})()+'</td></tr><tr><td><b>Gate G1–G4</b></td><td colspan="5">☑ dicentang = Ya · ☐ tidak dicentang = Tidak → <b>Tinjau Ulang</b> · kotak bergaris putus-putus = belum dijawab → <b>Lengkapi</b>. Hanya usulan <b>Lolos</b> (G1–G4 semua Ya) yang diranking (sesuai pengaturan).</td></tr></tbody></table></div></details>';
}
function criteriaView(D){
 const c=D.c,ed=canCfg(),dis=ed?'':' disabled';
 const tot=PROFILES.map(pr=>c.weights[pr].reduce((a,v)=>a+v,0));
 const rows=KR.map((k,i)=>'<tr><td><b>'+k.c+'</b></td><td><b>'+E(k.n)+'</b><small>'+E(k.q)+'</small></td>'+PROFILES.map(pr=>'<td class="kka-w"><input type="number" min="0" max="100" step="1" data-kka-w="'+E(pr)+'|'+i+'" value="'+c.weights[pr][i]+'"'+dis+' aria-label="Bobot '+E(k.c+' '+pr)+'">%</td>').join('')+'<td class="kka-w on">'+c.weights[c.profile][i]+'%</td><td><small>'+E(k.ref)+'</small></td></tr>').join('');
 const f=(k,l,h,t,extra)=>'<label class="kka-set"><span>'+l+ic(h)+'</span>'+(t==='sel'?'<select data-kka-cfg="'+k+'"'+dis+'>'+extra.map(v=>'<option'+(String(c[k])===v?' selected':'')+'>'+v+'</option>').join('')+'</select>':'<input type="number" min="0" step="any" data-kka-cfg="'+k+'" value="'+E(c[k])+'"'+dis+'>')+'</label>';
 return '<div class="kka-card"><h3>A. Pengaturan · '+D.y+ic('Diambil dari sheet Kriteria bagian A. Berlaku untuk seluruh portofolio metode MCDA tahun ini.')+'</h3><div class="kka-sets">'+
  f('profile','Profil bobot aktif','Seimbang / Prioritas Kepatuhan / Prioritas Efisiensi.','sel',PROFILES)+
  f('onlyPassed',"Hanya usulan 'Lolos' gate yang diranking?",'Ya = usulan Tinjau Ulang/Lengkapi tidak ikut ranking. Tidak = semua usulan yang skornya lengkap diranking.','sel',['Ya','Tidak'])+
  f('pagu','Pagu anggaran pengembangan (Rp juta)','Pagu indikatif/definitif; batas roadmap.')+f('sdm','Kapasitas SDM pengembangan (orang-bulan)','Mis. jumlah personel pengembang/analis × bulan efektif.')+
  f('quadThr','Ambang kuadran Nilai & Kemudahan (0–100)','Skor ≥ ambang dianggap tinggi (60 ≈ rata-rata 3 dari 5).')+f('p1','Ambang Prioritas 1 – Utama (skor ≥)','Asumsi awal; sesuaikan dengan sebaran skor.')+
  f('p2','Ambang Prioritas 2 – Tinggi (skor ≥)','Asumsi awal.')+f('p3','Ambang Prioritas 3 – Menengah (skor ≥)','Di bawah ambang ini = Prioritas 4 (Rendah/Tunda).')+
  f('tol',"Toleransi selisih peringkat 'Stabil'/'Konsisten'",'Rentang peringkat antar-profil ≤ nilai ini → Stabil; selisih MCDA vs WSJF ≤ nilai ini → Konsisten.')+'</div></div>'+
  '<div class="kka-card"><h3>B. Kriteria dan Bobot (skala skor 1–5)'+ic('Bobot tiap profil harus berjumlah 100%. Bobot awal adalah asumsi penyusun; sesuaikan melalui diskusi pemangku kepentingan.')+'</h3>'+
  '<div class="kka-scroll"><table class="kka-t kka-wt"><thead><tr><th>Kode</th><th>Kriteria & pertanyaan penilaian</th>'+PROFILES.map(pr=>'<th>'+E(pr)+'</th>').join('')+'<th>Bobot aktif</th><th>Rujukan utama</th></tr></thead><tbody>'+rows+
  '<tr class="kka-tot"><td></td><td>Total bobot</td>'+tot.map(t=>'<td class="'+(t===100?'ok':'bad')+'">'+t+'%'+(t===100?' · OK':' · ≠ 100%')+'</td>').join('')+'<td>'+tot[PROFILES.indexOf(c.profile)]+'%</td><td></td></tr></tbody></table></div>'+
  (ed?'<div class="kka-actions"><button type="button" class="btn btn-sm" data-kka-wreset>↺ Bobot bawaan</button></div>':'<p class="kka-note">Hanya Superadmin dan PMO Kemenkeu yang dapat mengubah pengaturan.</p>')+'</div>';
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
 const R=D.R.slice().sort((a,b)=>a.rank-b.rank),c=D.c,y=D.y,rest=c.pagu-D.sum.costFunded;
 const road=R.map(r=>'<tr><td class="kka-rk">'+r.rank+'</td><td class="kka-nm"><b>'+E(r.name)+'</b><small>'+E([r.code,r.p.nama].filter(Boolean).join(' · '))+'</small></td><td>'+E(r.uic)+'</td><td><small>'+E(r.jenis||'—')+'</small></td><td class="kka-sc">'+fmt(r.score,2)+'</td><td><span class="kka-chip '+catCls(r.cat)+'">'+E(r.cat)+'</span></td><td>'+E(r.quad)+'</td><td class="n">'+fmt(r.cost,2)+'</td><td class="n">'+fmt(r.dur,1)+'</td><td class="n">'+fmt(r.sdmN,1)+'</td><td><span class="kka-chip '+(r.rec.indexOf('Didanai')===0?'ok':r.rec.indexOf('Lengkapi')===0?'warn':'bad')+'">'+E(r.rec)+'</span></td><td class="n">'+fmt(r.cumC,2)+'</td><td class="n">'+fmt(r.cumS,1)+'</td><td><small>'+E(r.appr)+'</small></td><td class="n">'+r.rankUe+'</td></tr>').join('');
 const an=R.map(r=>'<tr><td class="kka-nm"><b>'+E(r.name)+'</b><small>'+E(r.code)+'</small></td>'+r.prof.map(v=>'<td class="n">'+fmt(v,2)+'</td>').join('')+r.rp.map(v=>'<td class="n">'+v+'</td>').join('')+'<td class="n">'+r.best+'–'+r.worst+'</td><td><span class="kka-chip '+(r.stab==='Stabil'?'ok':'warn')+'">'+r.stab+'</span></td><td class="n">'+fmt(r.value,1)+'</td><td class="n">'+fmt(r.ease,1)+'</td><td>'+E(r.quad)+'</td><td class="n">'+fmt(r.wsjf,2)+'</td><td class="n">'+r.rankW+'</td><td class="n">'+r.rank+'</td><td><span class="kka-chip '+(r.cons==='Konsisten'?'ok':'warn')+'">'+r.cons+'</span></td></tr>').join('');
 const qc=QUADS.map(q=>'<li><b>'+R.filter(r=>r.quad===q).length+'</b> '+q+'</li>').join('');
 return kpis(D)+'<div class="kka-card"><div class="kka-cardh"><h3>Roadmap Pengembangan '+y+ic('Aturan greedy: usulan diambil dari peringkat 1 (seluruh UE I); bila biaya ATAU SDM kumulatif melampaui batas, usulan menjadi Cadangan / Tunda dan usulan berikutnya yang masih muat tetap dapat didanai. Biaya bukan kriteria skor.')+'</h3>'+
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
function snapRows(D){return D.R.slice().sort((a,b)=>a.rank-b.rank).map(r=>({rank:r.rank,rankUe:r.rankUe,pid:r.id,code:r.code,name:r.name,program:r.p.nama,uic:r.uic,jenis:r.jenis,gate:r.gate,g:r.g,s:r.s,score:r.score,cat:r.cat,quad:r.quad,value:r.value,ease:r.ease,cost:r.cost,dur:r.dur,sdm:r.sdmN,rec:r.rec,cumC:r.cumC,cumS:r.cumS,wsjf:r.wsjf,rankW:r.rankW,stab:r.stab,cons:r.cons,prof:r.prof,rp:r.rp}))}
function repoView(D){
 const L=snaps(D.y),ed=canCfg(),final=L.find(s=>s.status==='Final');
 const rows=L.map(s=>'<tr><td><b>v'+s.version+'</b></td><td class="kka-nm"><b>'+E(s.title)+'</b><small>'+E(s.note||'')+'</small></td><td>'+E(new Date(s.at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}))+'<small>'+E(s.byName||s.by||'')+'</small></td><td><span class="kka-chip '+(s.status==='Final'?'ok':'warn')+'">'+E(s.status)+'</span></td><td>'+E(s.cfg.profile)+'</td><td class="n">'+(s.rows||[]).length+'</td><td class="n">'+(s.sum?s.sum.nFunded:'—')+'</td><td class="n">'+(s.sum?fmt(s.sum.costFunded,2):'—')+'</td><td class="kka-act"><button type="button" class="btn btn-sm" data-kka-snapview="'+E(s.key)+'">Lihat</button><button type="button" class="btn btn-sm" data-kka-snapx="'+E(s.key)+'">⇩ Excel</button>'+
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
 const tr=(s.rows||[]).map(r=>{const c=cur[r.pid],d=c==null?'<small>keluar</small>':c===r.rank?'=':c<r.rank?'<b class="up">▲'+(r.rank-c)+'</b>':'<b class="dn">▼'+(c-r.rank)+'</b>';
  return '<tr><td class="kka-rk">'+r.rank+'</td><td class="kka-nm"><b>'+E(r.name)+'</b><small>'+E([r.code,r.program].filter(Boolean).join(' · '))+'</small></td><td>'+E(r.uic)+'</td><td class="kka-sc">'+fmt(r.score,2)+'</td><td><span class="kka-chip '+catCls(r.cat)+'">'+E(r.cat)+'</span></td><td>'+E(r.quad)+'</td><td class="n">'+fmt(r.cost,2)+'</td><td class="n">'+fmt(r.sdm,1)+'</td><td>'+E(r.rec)+'</td><td class="n">'+d+'</td></tr>'}).join('');
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
  ...data.rows.map(r=>[r.rank??'',r.rankUe??'',r.code,r.name,r.program,r.uic,r.jenis,...r.g,r.gate,...r.s.map(v=>v??''),r.score??'',r.cat||''])],[6,8,18,40,30,10,24,10,10,10,10,12,8,8,8,8,8,8,8,12,22]);
 const R=data.rows.filter(r=>r.rank);
 add('Ringkasan',[['Ringkasan Prioritas & Roadmap Pengembangan '+data.year],[],['Usulan diranking',R.length],['Pagu (Rp juta)',c.pagu],['Biaya didanai (Rp juta)',data.sum?.costFunded??''],['Sisa pagu (Rp juta)',c.pagu-(data.sum?.costFunded||0)],['Jumlah didanai',data.sum?.nFunded??''],['SDM terpakai (org-bln)',data.sum?.sdmFunded??''],['Kapasitas SDM',c.sdm],[],
  ['Rank','Kode','Nama Sistem / Modul','Program','UE I','Jenis Inisiatif','Skor','Kategori','Kuadran','Biaya (Rp juta)','Durasi (bln)','SDM (org-bln)','Rekomendasi','Biaya kumulatif','SDM kumulatif','Saran pendekatan','Rank per UE I'],
  ...R.map(r=>[r.rank,r.code,r.name,r.program,r.uic,r.jenis,r.score,r.cat,r.quad,r.cost??'',r.dur??'',r.sdm??'',r.rec,r.cumC,r.cumS,APPROACH[r.quad]||'',r.rankUe])],[6,18,40,30,10,24,8,22,18,12,10,10,20,12,12,40,10]);
 add('Analisis',[['Kode','Nama Sistem / Modul',...PROFILES.map(p=>'Skor – '+p),...PROFILES.map(p=>'Rank – '+p),'Stabilitas','Nilai Manfaat','Kemudahan','Kuadran','WSJF','Rank WSJF','Rank skor aktif','MCDA vs WSJF'],
  ...R.map(r=>[r.code,r.name,...(r.prof||[]),...(r.rp||[]),r.stab,r.value,r.ease,r.quad,r.wsjf,r.rankW,r.rank,r.cons])],[18,40,12,12,12,10,10,10,14,12,12,18,8,10,10,14]);
 return wb;
}
function currentData(){const D=compute(),R={};const rows=D.rows.map(r=>({rank:r.rank,rankUe:r.rankUe,code:r.code,name:r.name,program:r.p.nama,uic:r.uic,jenis:r.jenis,gate:r.gate,g:r.g,s:r.s,score:r.score,cat:r.cat,quad:r.quad,value:r.value,ease:r.ease,cost:r.cost,dur:r.dur,sdm:r.sdmN,rec:r.rec,cumC:r.cumC,cumS:r.cumS,wsjf:r.wsjf,rankW:r.rankW,stab:r.stab,cons:r.cons,prof:r.prof,rp:r.rp}));
 const c=Object.assign({},D.c);return {year:D.y,cfg:c,sum:D.sum,rows}}
function downloadXlsx(data,name){const wb=workbook(data);window.XLSX.writeFile(wb,name)}
/* ---------- impor workbook Kertas Kerja A ---------- */
const nk=s=>T(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
async function importFile(file){
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
 const match=r=>{const n=nk(r[1]);if(!n)return null;return all.find(o=>nk(o.x.name)===n||nk(o.x.applicationName)===n)||all.find(o=>{const a=nk(o.x.name);return a&&a.length>4&&(a.includes(n)||n.includes(a))})||null};
 const plan=U.map(r=>({r,m:match(r)})),ok=plan.filter(z=>z.m),miss=plan.filter(z=>!z.m);
 const yn=v=>/^ya$/i.test(T(v))?'Ya':/^tidak$/i.test(T(v))?'Tidak':'';
 const sv=v=>{const n=+v;return T(v)!==''&&n>=1&&n<=5&&Number.isInteger(n)?n:null};
 const cur=I.pickedProgram(),canAdd=progs.filter(p=>!p.nonIstk&&(!I.readonly(p)||canCfg()));
 const nSkor=plan.filter(z=>scoreOf(z.r).map(sv).some(v=>v!=null)).length;
 modal('Impor Kertas Kerja A',`<p class="s" style="margin:0 0 8px">${U.length} baris usulan di berkas · <b>${ok.length} cocok</b> dengan proyek tahun ${year()} · <b>${miss.length} belum ada</b> di aplikasi · ${nSkor} baris memiliki skor K1–K7.</p>
 <div class="kka-scroll" style="max-height:40vh"><table class="kka-t"><thead><tr><th>Usulan di berkas</th><th>Proyek di aplikasi</th><th>Gate G1–G4</th><th>Skor K1–K7</th><th>Biaya (Rp jt) · Durasi · SDM</th></tr></thead><tbody>${plan.map(z=>{const s=scoreOf(z.r).map(sv);return '<tr><td><b>'+E(z.r[1])+'</b><small>'+E([T(z.r[0]),T(z.r[8])].filter(Boolean).join(' · '))+'</small></td><td>'+(z.m?E(z.m.x.name)+'<small>'+E(z.m.p.nama)+'</small>':'<span class="kka-chip warn">Baru</span>')+'</td><td>'+[21,22,23,24].map(i=>yn(z.r[i])||'–').join(' / ')+'</td><td>'+(s.some(v=>v!=null)?s.map(v=>v??'–').join(' '):'<small>belum ada</small>')+'</td><td>'+[18,19,20].map(i=>T(z.r[i])===''?'–':E(z.r[i])).join(' · ')+'</td></tr>'}).join('')}</tbody></table></div>
 ${miss.length?`<div style="margin-top:10px;padding:10px;border:1px solid #F2D58A;background:#FFFBEA;border-radius:8px"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="kka-imp-add" checked style="width:auto"> Tambahkan ${miss.length} usulan yang belum ada sebagai proyek baru ke program</label>
  <select id="kka-imp-prog" style="margin-top:6px;width:100%">${canAdd.map(p=>'<option value="'+E(p.id)+'"'+(cur&&p.id===cur.id&&ui().scope!=='non'?' selected':'')+'>'+E(p.nama)+'</option>').join('')}${canCfg()?'<option value="__nonistk"'+(ui().scope==='non'?' selected':'')+'>Di luar ISTK (tidak termapping ke program)</option>':''}</select>
  <small style="display:block;margin-top:4px;color:#64748B">Isian Usulan (jenis inisiatif, UE I, unit pemilik, domain SPBE, deskripsi, urgensi, landasan hukum, strategi, proses bisnis, narasi, fitur) ikut disalin.</small></div>`:''}
 <label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="kka-imp-est" checked style="width:auto"> Perbarui estimasi biaya, durasi, dan SDM dari berkas (bila terisi)</label>
 <label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="kka-imp-desc" checked style="width:auto"> Lengkapi isian Usulan proyek yang sudah ada bila masih kosong</label>
 ${kr&&canCfg()?'<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="kka-imp-cfg" style="width:auto"> Ambil juga pengaturan & bobot dari sheet Kriteria</label>':''}
 <label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" id="kka-imp-method" checked style="width:auto"> Set metode program terkait ke MCDA</label>
 <p class="s" style="margin:8px 0 0">Nilai rusak (#REF!) atau kosong diabaikan; isian lama di aplikasi tidak dihapus.</p>`,'Impor',o=>{
  const q=id=>o.querySelector(id),est=q('#kka-imp-est')?.checked,useCfg=q('#kka-imp-cfg')?.checked,setM=q('#kka-imp-method')?.checked,desc=q('#kka-imp-desc')?.checked,add=q('#kka-imp-add')?.checked,tp=q('#kka-imp-prog')?.value==='__nonistk'?nonP():progs.find(p=>p.id===q('#kka-imp-prog')?.value);
  let nG=0,nS=0,nNew=0;const touched=new Set();
  const DESC=[[7,'initiativeType'],[8,'uic'],[9,'businessOwner'],[10,'spbeDomain'],[11,'description'],[12,'urgency'],[13,'legalBasis'],[14,'strategyAlignment'],[15,'businessProcess'],[16,'businessNarrative'],[17,'features']];
  const apply=(r,x,p,isNew)=>{touched.add(p);
   GATES.forEach((g,i)=>{const v=yn(r[21+i]);if(v){x[g[0]]=v;nG++}});
   const s=scoreOf(r).map(sv);if(s.some(v=>v!=null)){x.kka=x.kka||{};s.forEach((v,i)=>{if(v!=null){x.kka['K'+(i+1)]=v;nS++}})}
   if(est||isNew){const cst=+r[18],du=+r[19],sd=+r[20];if(T(r[18])!==''&&isFinite(cst))x.estimatedCost=Math.round(cst*1e6);if(T(r[19])!==''&&isFinite(du))x.durationMonths=du;if(T(r[20])!==''&&isFinite(sd))x.estimatedStaffMonths=sd}
   if(desc||isNew)DESC.forEach(([c,k])=>{const v=T(r[c]);if(v&&!bad(v)&&!T(x[k]))x[k]=v});
   if(!T(x.psOriginRef)&&T(r[0])&&!bad(r[0]))x.psOriginRef=T(r[0])};
  ok.forEach(({r,m})=>{if(roP(m.p)&&!canCfg())return;apply(r,m.x,m.p,false)});
  if(add&&miss.length){if(!tp){say('Pilih program tujuan untuk usulan baru.');return false}
   if(tp.nonIstk)tp._keep();tp.psProjects=tp.psProjects||[];miss.forEach(({r})=>{const x={id:'proj-'+uid(),name:T(r[1]),status:'Usulan',included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[],psOriginYear:null};apply(r,x,tp,true);tp.psProjects.push(x);nNew++});
   if(!tp.nonIstk)try{window.MT_PS_SCOPE&&window.MT_PS_SCOPE.normalizeProjectCodes&&window.MT_PS_SCOPE.normalizeProjectCodes(tp)}catch(_){}}
  if(setM)touched.forEach(p=>{if(!p.nonIstk){p.psMethod='kka';p.psPrioritize=false}});
  if(useCfg&&kr){const cell=(r,cI)=>(kr[r-1]||[])[cI];const w={};PROFILES.forEach((p,j)=>{const a=[0,1,2,3,4,5,6].map(i=>Math.round(+cell(17+i,3+j)*1000)/10);if(a.every(v=>isFinite(v)))w[p]=a});
   const pf=T(cell(4,2));setCfg({profile:PROFILES.includes(pf)?pf:cfg().profile,onlyPassed:T(cell(6,2))==='Tidak'?'Tidak':'Ya',pagu:+cell(7,2)||cfg().pagu,sdm:+cell(8,2)||cfg().sdm,quadThr:+cell(9,2)||cfg().quadThr,p1:+cell(10,2)||cfg().p1,p2:+cell(11,2)||cfg().p2,p3:+cell(12,2)||cfg().p3,tol:+cell(13,2)||cfg().tol,weights:Object.assign(cfg().weights,w)})}
  touched.forEach(p=>{if(p.nonIstk)p._doc.updatedAt=new Date().toISOString();else p.psUpdatedAt=new Date().toISOString()});
  try{log('Impor Kertas Kerja A',ok.length+' diperbarui, '+nNew+' proyek baru')}catch(_){}save();render();
  if(nNew&&tp){ui().scope=tp.nonIstk?'non':'all';if(!tp.nonIstk){try{I.state().prog=tp.id}catch(_){}ui().scope='program'}save();render()}
  say('Impor selesai: '+ok.length+' proyek diperbarui, '+nNew+' proyek baru'+(nNew&&tp?' di '+tp.nama:'')+', '+nG+' jawaban gate, '+nS+' skor.'+(nS?'':' Skor K1–K7 belum ada di berkas — isi di tabel penilaian.'))},{size:'wide'});
}
function nonEdit(id){
 const n=nonP(),x=id?n.psProjects.find(z=>String(z.id)===String(id)):null;if(id&&!x)return;const v=k=>E(x?(k==='cost'?(x.estimatedCost==null||x.estimatedCost===''?'':x.estimatedCost/1e6):x[k]??''):'');
 const opt=(arr,val)=>['',...arr].map(o=>'<option'+(String(o)===String(val||'')?' selected':'')+' value="'+E(o)+'">'+(o||'Pilih')+'</option>').join('');
 modal((x?'Ubah':'Tambah')+' Usulan di Luar ISTK',`<div class="fgrid">
 <div class="fld wide"><label for="kn-name">Nama sistem / modul *</label><input id="kn-name" value="${v('name')}"></div>
 <div class="fld"><label for="kn-uic">UE I</label><select id="kn-uic">${opt(UE,x&&x.uic)}</select></div>
 <div class="fld"><label for="kn-jenis">Jenis inisiatif</label><select id="kn-jenis">${opt(['Aplikasi Baru','Modul Baru','Pengayaan Modul','Data Analytics / Dashboard / AI','Interoperabilitas'],x&&x.initiativeType)}</select></div>
 <div class="fld wide"><label for="kn-owner">Unit pemilik proses bisnis</label><input id="kn-owner" value="${v('businessOwner')}"></div>
 <div class="fld"><label for="kn-cost">Estimasi biaya (Rp juta)</label><input id="kn-cost" type="number" min="0" step="any" value="${v('cost')}"></div>
 <div class="fld"><label for="kn-dur">Durasi (bulan)</label><input id="kn-dur" type="number" min="0" step="any" value="${v('durationMonths')}"></div>
 <div class="fld"><label for="kn-sdm">Kebutuhan SDM (orang-bulan)</label><input id="kn-sdm" type="number" min="0" step="any" value="${v('estimatedStaffMonths')}"></div>
 <div class="fld wide"><label for="kn-desc">Deskripsi & alasan tidak termapping ke ISTK</label><textarea id="kn-desc" rows="3">${v('description')}</textarea></div></div>
 <p class="s" style="margin:8px 0 0">Gate G1–G4 dan skor K1–K7 diisi di tabel penilaian. Proyek ini tidak masuk Penetapan Program/RKMK/WBS dan tidak dipantau PMO Kemenkeu.</p>`,x?'Simpan':'Tambah',o=>{
  const g=s=>T(o.querySelector(s).value),name=g('#kn-name');if(!name){say('Nama wajib diisi.');return false}
  const all=allProgs().flatMap(p=>p.psProjects||[]);if(all.some(z=>z!==x&&nk(z.name)===nk(name))){say('Nama proyek sudah ada pada tahun ini.');return false}
  const num=s=>{const t=g(s);if(t==='')return '';const n=+t;return isFinite(n)&&n>=0?n:NaN};const c=num('#kn-cost'),d=num('#kn-dur'),m=num('#kn-sdm');if([c,d,m].some(Number.isNaN)){say('Estimasi harus angka nonnegatif.');return false}
  const t=x||{id:'non-'+uid(),status:'Usulan',kka:{},nonIstk:true};Object.assign(t,{name,uic:g('#kn-uic'),initiativeType:g('#kn-jenis'),businessOwner:g('#kn-owner'),estimatedCost:c===''?'':Math.round(c*1e6),durationMonths:d,estimatedStaffMonths:m,description:g('#kn-desc')});
  if(!x){n._keep();n.psProjects.push(t)}n._doc.updatedAt=new Date().toISOString();try{log((x?'Ubah':'Tambah')+' usulan di luar ISTK',name)}catch(_){}ui().scope='non';save();render();say('Usulan di luar ISTK '+(x?'diperbarui':'ditambahkan')+'.')},{size:'sm'});
}
/* ---------- event ---------- */
function findX(id){for(const p of allProgs())for(const x of (p.psProjects||[]))if(String(x.id)===String(id))return {p,x};return null}
document.addEventListener('click',ev=>{
 const t=ev.target;if(!t.closest||!t.closest('.kka,.ps27-priority-head'))return;
 const b=t.closest('button');if(!b)return;const u=ui();
 if(b.dataset.kkaSub){u.sub=b.dataset.kkaSub;save();render();return}
 if(b.dataset.kkaScope){u.scope=b.dataset.kkaScope;save();render();return}
 if(b.hasAttribute('data-kka-ue-clear')){u.ue=[];save();render();return}
 if(b.hasAttribute('data-kka-xlsx')){try{const d=currentData();downloadXlsx(d,'Prioritas_SI_KertasKerjaA_'+d.year+'.xlsx');say('Excel hasil prioritasi diunduh.')}catch(e){say(e.message)}return}
 if(b.hasAttribute('data-kka-import')){const i=document.createElement('input');i.type='file';i.accept='.xlsx,.xlsm,.xls';i.onchange=()=>{if(i.files[0])importFile(i.files[0])};i.click();return}
 if(b.hasAttribute('data-kka-snap')&&canCfg()){snapDialog();return}
 if(b.hasAttribute('data-kka-nonadd')&&canCfg()){nonEdit('');return}
 if(b.dataset.kkaNonedit&&canCfg()){nonEdit(b.dataset.kkaNonedit);return}
 if(b.dataset.kkaNondel&&canCfg()){const n=nonP(),i=n.psProjects.findIndex(z=>String(z.id)===String(b.dataset.kkaNondel));if(i<0)return;const nm=n.psProjects[i].name;const go=()=>{n.psProjects.splice(i,1);try{log('Hapus usulan di luar ISTK',nm)}catch(_){}save();render();say('Usulan dihapus.')};if(typeof window.MT_PS_CONFIRM==='function')window.MT_PS_CONFIRM('Hapus usulan?','"'+nm+'" akan dihapus dari daftar usulan di luar ISTK.',go);else go();return}
 if(b.dataset.kkaSnapview){snapView(b.dataset.kkaSnapview);return}
 if(b.dataset.kkaSnapx){const s=store()[b.dataset.kkaSnapx];if(s)try{downloadXlsx({year:s.year,cfg:s.cfg,sum:s.sum,rows:s.rows},'Prioritas_SI_'+s.year+'_v'+s.version+'.xlsx')}catch(e){say(e.message)}return}
 if(b.dataset.kkaSnapfinal&&canCfg()){const st=store();snaps().forEach(s=>{if(s.status==='Final')st[s.key].status='Draft'});st[b.dataset.kkaSnapfinal].status='Final';try{log('Tandai final hasil prioritasi',b.dataset.kkaSnapfinal)}catch(_){}save();render();return}
 if(b.dataset.kkaSnapdel&&canCfg()){const k=b.dataset.kkaSnapdel,s=store()[k];if(!s||s.status==='Final')return;const go=()=>{delete store()[k];save();render();say('Versi v'+s.version+' dihapus.')};if(typeof window.MT_PS_CONFIRM==='function')window.MT_PS_CONFIRM('Hapus v'+s.version+'?','Hasil "'+s.title+'" akan dihapus dari repositori.',go);else go();return}
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
 if(t.matches('[data-kka-cfg]')){const k=t.dataset.kkaCfg,v=t.tagName==='SELECT'?t.value:+t.value;if(t.tagName!=='SELECT'&&(!isFinite(v)||v<0)){say('Nilai harus angka nonnegatif.');return}setCfg({[k]:v});render();return}
 if(t.matches('[data-kka-w]')){const[pr,i]=t.dataset.kkaW.split('|'),v=+t.value;if(!isFinite(v)||v<0||v>100){say('Bobot 0–100%.');return}const w=cfg().weights;w[pr][+i]=v;setCfg({weights:w});render();return}
});
/* Dropdown skor: tertutup = angka saja; saat dibuka = angka + arti rubrik. */
const kkaLong=(t,on)=>{if(!t||!t.matches||!t.matches('select[data-kka-score]'))return;[...t.options].forEach(o=>{if(o.dataset.l)o.text=on?o.dataset.l:o.value})};
document.addEventListener('focusin',ev=>kkaLong(ev.target,true));document.addEventListener('mousedown',ev=>kkaLong(ev.target,true),true);
document.addEventListener('focusout',ev=>kkaLong(ev.target,false));document.addEventListener('change',ev=>kkaLong(ev.target,false),true);
document.addEventListener('toggle',ev=>{const t=ev.target;if(t&&t.matches&&t.matches('[data-kka-rub]'))ui().rubOpen=t.open},true);
document.addEventListener('input',ev=>{const t=ev.target;if(!t.matches||!t.matches('[data-kka-q]'))return;ui().q=t.value;clearTimeout(window.__kkaQ);const pos=t.selectionStart;window.__kkaQ=setTimeout(()=>{render();const n=document.querySelector('[data-kka-q]');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}},260)});

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
.kka-non{background:#EDE9FE!important;color:#5B21B6!important;font-size:10px!important;padding:1px 7px!important;vertical-align:1px;margin-left:4px}.kka .kka-ib{border:0!important;background:none!important;box-shadow:none!important;cursor:pointer;font-size:12px!important;padding:0 3px!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;color:#475569;vertical-align:1px;display:inline}.kka-ib:hover{color:#12275A}.kka-pc{min-width:32px;text-align:center}.kka-chip.p3{background:#FFF0C2;color:#7A5300}
.kka-thc{display:inline-flex;align-items:center;gap:3px}.kka-rub{padding:0}.kka-rub>summary{cursor:pointer;padding:11px 14px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;color:#0F2346;font-size:13px}.kka-rub>summary small{color:#64748B;font-size:11.5px}.kka-rub .kka-scroll{border:0;border-top:1px solid #E2E8F0;border-radius:0 0 12px 12px}.kka-rub td{font-size:12px}.kka-ref td{vertical-align:top}.kka-ref td:nth-child(n+3){min-width:150px}
b.up{color:#0F7A4B}b.dn{color:#B42318}
@media(max-width:1200px){.kka-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.kka-grid2{grid-template-columns:1fr}.kka-sets{grid-template-columns:1fr 1fr}}
@media(max-width:700px){.kka-kpis{grid-template-columns:1fr 1fr}.kka-sets{grid-template-columns:1fr}}`;document.head.appendChild(s)})();

function refView(){
 return '<div class="kka-card"><h3>Metode MCDA (Multi-Criteria Decision Analysis)</h3><ul class="kka-bars" style="gap:6px">'+
  ['<b>Gate penyaringan:</b> usulan Lolos bila G1–G4 semua Ya; ada Tidak = Tinjau Ulang; ada kosong = Lengkapi. G1 selaras Renstra/peta rencana EA/Arsitektur SPBE; G2 tidak duplikatif; G3 pemilik proses bisnis & sponsor jelas; G4 dokumen kajian kebutuhan sudah dikirim ke Pusakti.',
   '<b>Skor Tertimbang (0–100)</b> = Σ(skor kriteria × bobot) ÷ 5 × 100. K7 diskalakan terbalik: skor 5 = risiko terendah. Bila skor seri, urutan usulan menjadi pemutus.',
   '<b>Peringkat</b> Semua UE I (satu pagu & kapasitas) atau Per UE I. Kategori: Prioritas 1 Utama / 2 Tinggi / 3 Menengah / 4 Rendah-Tunda sesuai ambang.',
   '<b>Roadmap</b> greedy dari peringkat 1: bila biaya ATAU SDM kumulatif melampaui batas → Cadangan / Tunda; usulan berikutnya yang masih muat tetap dapat didanai. Biaya bukan kriteria skor.',
   '<b>WSJF</b> = Cost of Delay ÷ Job Size; Cost of Delay = K2 + K4 + K5, Job Size = 6 − K7 (proksi) — pembanding terhadap skor tertimbang.',
   '<b>Catatan:</b> mandat regulasi yang tidak dapat ditawar beri skor K3 = 5 dan, bila perlu, kunci secara manual dalam keputusan komite. Hasil adalah bahan keputusan; keputusan akhir pada forum tata kelola.'].map(x=>'<li style="display:block">'+x+'</li>').join('')+'</ul></div>'+
  '<div class="kka-card"><h3>Rubrik Skala Penilaian 1–5'+ic('Semua kriteria searah: skor 5 = paling mendukung untuk diprioritaskan.')+'</h3><div class="kka-scroll"><table class="kka-t kka-ref"><thead><tr><th>Kode</th><th>Kriteria</th><th>1 – Sangat rendah</th><th>2 – Rendah</th><th>3 – Sedang</th><th>4 – Tinggi</th><th>5 – Sangat tinggi</th></tr></thead><tbody>'+
  KR.map(k=>'<tr><td><b>'+k.c+'</b></td><td><b>'+E(k.n)+'</b><small>'+E(k.q)+'</small></td>'+RUB[k.c].map(t=>'<td>'+E(t)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></div>'+
  '<div class="kka-card"><h3>Referensi & Literasi</h3><div class="kka-scroll"><table class="kka-t kka-ref"><thead><tr><th>No</th><th>Rujukan</th><th>Jenis</th><th>Dipakai untuk</th></tr></thead><tbody>'+REFS.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+E(r[0])+'</td><td>'+E(r[1])+'</td><td>'+E(r[2])+'</td></tr>').join('')+'</tbody></table></div><p class="kka-note" style="margin-top:8px">Verifikasi versi/perubahan terbaru setiap regulasi sebelum dijadikan dasar resmi.</p></div>';
}
let _fc=null;function isFunded(x){if(!_fc||_fc.t!==Date.now()>>8||_fc.y!==year()){const D=compute(),set=new Set(D.funded.map(r=>String(r.id)));_fc={t:Date.now()>>8,y:year(),set}}return _fc.set.has(String(x.id))}
window.MT_PS_KKA={page,methodSelect,importFile,compute,cfg,method,isFunded,GATES,KR,version:'20261127-kka1'};
})();
