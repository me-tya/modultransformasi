/* Rujukan kriteria dan rubrik: implementasi menu Priority Dashboard CM, 8 November 2026. */
const PS_GROUPS=[['SD','Strategis & Dampak','Strategy & Impact'],['UK','Urgensi & Kesiapan','Urgency & Readiness'],['UP','Upaya & Risiko Perubahan','Change Effort & Risk'],['BR','Benefit Realization','Benefit Realization']];
const PS_LIKERT=['Sangat Rendah','Rendah','Sedang','Tinggi','Sangat Tinggi'];
const PS_CRITERIA=[
 {code:'C1',note:'Acuan: WBS Program Transformasi & IKU',g:'SD',name:'Keselarasan Strategis',en:'Strategic Alignment',type:'benefit',w:7,desc:'Seberapa kuat proyek mendukung agenda Transformasi Kemenkeu / WBS Program Transformasi / IKU.',
  rubric:['Tidak terkait program transformasi','Pendukung tidak langsung','Terkait satu inisiatif WBS Transformasi','Inisiatif prioritas transformasi tingkat UE I','Prioritas Kementerian / nasional (IKU, arahan Menteri)']},
 {code:'C2',note:'Satuan: jumlah pengguna · otomatis dari isian',g:'SD',name:'Skala Dampak (Jumlah Pengguna)',en:'Impact Scale (Users)',type:'benefit',w:5,auto:'users',desc:'Jumlah pengguna/pihak yang terdampak. Otomatis dari isian jumlah pengguna.',
  rubric:['≤ 1.000 pengguna','1.001 – 10.000 pengguna','10.001 – 50.000 pengguna','50.001 – 100.000 pengguna','> 100.000 pengguna']},
 {code:'C3',note:'Cakupan organisasi pengguna',g:'SD',name:'Level Pengguna',en:'User Level',type:'benefit',w:5,desc:'Cakupan organisasi pengguna sistem/kebijakan.',
  rubric:['Internal unit Eselon II','Unit Eselon I','Kementerian (lintas Unit Eselon I)','Lintas Kementerian / Lembaga','Nasional (masyarakat, Pemda, dunia usaha)']},
 {code:'C4',note:'Satuan: hari menuju go-live · otomatis',g:'UK',name:'Urgensi Waktu',en:'Time Urgency',type:'benefit',w:6,auto:'golive',desc:'Kedekatan tanggal go-live / tenggat implementasi. Otomatis dari tanggal go-live.',
  rubric:['> 365 hari lagi / belum ditetapkan','181 – 365 hari lagi','91 – 180 hari lagi','31 – 90 hari lagi','≤ 30 hari lagi / sudah lewat & belum stabil']},
 {code:'C5',note:'Sumber: asesmen kesiapan organisasi atau CRA · otomatis',g:'UK',name:'Gap Kesiapan Perubahan',en:'Readiness Gap',type:'benefit',w:5,auto:'readiness',desc:'Makin rendah skor kesiapan, makin besar kebutuhan pendampingan. Otomatis dari asesmen kesiapan organisasi oleh Tim CM, atau dari hasil CRA bila unit memintanya.',
  rubric:['Kesiapan ≥ 80% (Ready)','Kesiapan 70 – 79% (Conditional)','Kesiapan 60 – 69%','Kesiapan 50 – 59% (Intervention)','Kesiapan < 50% (Not Ready)']},
 {code:'C6',note:'Rata-rata Likert POSTER (Proses, Organisasi, SDM, Teknologi, Regulasi) · otomatis',g:'UP',name:'Tingkat Perubahan (POSTER)',en:'Change Magnitude (POSTER)',type:'benefit',w:3,auto:'poster',desc:'Besarnya perubahan dari analisis dampak POSTER: Proses kerja, Organisasi, SDM, Teknologi, Regulasi — masing-masing Likert 1–5. Otomatis = rata-rata dibulatkan; bila ada dimensi bernilai 5, C6 minimal 3.',
  rubric:['Perubahan minor / tampilan (rata-rata POSTER ≈ 1)','Penyesuaian prosedur kecil (rata-rata POSTER ≈ 2)','Perubahan sebagian proses bisnis (rata-rata POSTER ≈ 3)','Perubahan proses + peran / organisasi (rata-rata POSTER ≈ 4)','Transformasi menyeluruh — proses, regulasi, budaya (rata-rata POSTER ≈ 5)']},
 {code:'C7',note:'Satuan: orang-hari/bulan · kriteria biaya',g:'UP',name:'Kebutuhan Sumber Daya Tim CM',en:'CM Team Effort',type:'cost',w:3,desc:'Beban narasumber/pendampingan Tim CM. Kriteria biaya: makin berat, utility makin kecil.',
  rubric:['< 5 orang-hari/bulan (sangat ringan)','5 – 10 orang-hari/bulan (ringan)','11 – 20 orang-hari/bulan (sedang)','21 – 40 orang-hari/bulan (berat)','> 40 orang-hari/bulan (sangat berat)']},
 {code:'C8',auto:'sdm',note:'Efisiensi waktu/biaya & kualitas layanan · tematik: otomatis dari target pengurangan SDM',g:'BR',name:'Nilai Manfaat (Efisiensi & Layanan)',en:'Benefit Value',type:'benefit',w:6,desc:'Besarnya manfaat yang diharapkan: penghematan waktu/biaya proses, peningkatan kualitas layanan.',
  rubric:['Manfaat belum teridentifikasi / sangat kecil','Efisiensi < 10% atau perbaikan layanan minor','Efisiensi 10 – 25% atau layanan meningkat terukur di satu unit','Efisiensi 26 – 50% atau layanan meningkat signifikan lintas unit','Efisiensi > 50%, penghematan anggaran besar, atau layanan publik meningkat nyata']},
 {code:'C9',note:'Indikator, baseline, target, benefit owner',g:'BR',name:'Keterukuran Manfaat',en:'Benefit Measurability',type:'benefit',w:4,desc:'Kesiapan manfaat untuk diukur: indikator, baseline, target, benefit owner, dan monitoring.',
  rubric:['Belum ada indikator manfaat','Indikator ada, baseline belum ada','Indikator & baseline ada, target belum ditetapkan','Baseline, target, dan benefit owner ditetapkan','Lengkap + monitoring manfaat berkala sudah berjalan']},
 {code:'C10',note:'Waktu sejak go-live hingga manfaat terasa',g:'BR',name:'Kecepatan Realisasi Manfaat',en:'Time to Benefit',type:'benefit',w:4,desc:'Seberapa cepat manfaat mulai dirasakan setelah go-live (quick win lebih tinggi).',
  rubric:['> 24 bulan setelah go-live','13 – 24 bulan setelah go-live','7 – 12 bulan setelah go-live','3 – 6 bulan setelah go-live','< 3 bulan setelah go-live (quick win)']},
 {code:'C11',note:'Temuan audit, profil risiko, mandat regulasi',g:'BR',name:'Mitigasi Risiko & Kepatuhan',en:'Risk & Compliance',type:'benefit',w:3,desc:'Kontribusi proyek menurunkan risiko atau memenuhi kewajiban regulasi/temuan audit.',
  rubric:['Tidak berkaitan dengan risiko/kepatuhan','Mengurangi risiko operasional minor','Menindaklanjuti rekomendasi/temuan internal','Menindaklanjuti temuan BPK/Itjen atau risiko tinggi pada profil risiko','Wajib karena regulasi/mandat hukum atau risiko kritikal']},
 {code:'C12',note:'Rata-rata risiko resistensi, operasional, ketergantungan, lainnya · otomatis · kriteria biaya',g:'UP',name:'Tingkat Risiko Implementasi',en:'Implementation Risk',type:'cost',w:4,auto:'risk',desc:'Tingkat risiko implementasi = rata-rata risiko resistensi, risiko operasional, risiko ketergantungan (regulasi, sistem lain, dll), dan risiko lainnya (bila ada). Kriteria biaya: makin rendah risikonya, makin tinggi prioritasnya.',
  rubric:['Risiko sangat rendah (seluruh dimensi rendah)','Risiko rendah','Risiko sedang','Risiko tinggi','Risiko sangat tinggi (seluruh dimensi tinggi)']},
];


(function selectionFlow(){
'use strict';
/* Project Selection: tata kelola program -> calon proyek -> prioritisasi opsional
   -> penetapan -> RKMK -> lanjut ke Project Management/WBS.
   Visual Priority Dashboard CM; hanya data, login, dan navigasi Modul Transformasi. */
const esc2=v=>esc(String(v==null?'':v));
const editOk=()=>!!(ME&&['SA','PMOK','PMOU'].includes(ME.role));
const ownerOk=p=>editOk()&&(ME.role!=='PMOU'||!p.uic||p.uic===ME.unit);
const state=()=>S.ui.psFlow||(S.ui.psFlow={tab:'projects',prog:'',q:'',filter:'all',sort:'score',view:'list',open:[],params:true,formula:false,showChosen:false,monevView:'proj',monevPid:'',snapshot:0});
const allPrograms=()=>S.programs||[];
const year=()=>+S.ui.tahun||2027;
const uid2=t=>(t||'ps')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const clean=v=>String(v==null?'':v).trim();
const programs=()=>{
 const y=year(),a=allPrograms().filter(p=>+p.psYear===y);
 if(y===2026)allPrograms().filter(p=>!p.psYear&&+p.mulai<=y&&(String(p.periode||'').includes('2026')||+p.mulai===y)).forEach(p=>a.push(p));
 return a;
};
const norm=p=>{
 if(!Array.isArray(p.psProjects))p.psProjects=[];
 if(p.psThreshold==null)p.psThreshold=80;
 if(!p.psStatus)p.psStatus=p.psDraft?'Draft':'Berjalan (legacy)';
 if(!p.psWeights)p.psWeights={};
 if(!Array.isArray(p.psSnapshots))p.psSnapshots=[];
 if(!p.psNorm)p.psNorm='scale';
 if(p.psPrioritize==null)p.psPrioritize=false;
 p.psProjects.forEach(x=>{if(!x.scores)x.scores={};if(!x.poster)x.poster={};if(!x.risks)x.risks={};if(!Array.isArray(x.indicators))x.indicators=[];if(!Array.isArray(x.benefits))x.benefits=[]});
 return p;
};
const pickedProgram=()=>{const s=state(),arr=programs();if(!arr.length)return null;const p=arr.find(x=>x.id===s.prog||x.akr===s.prog)||arr[0];if(s.prog!==p.id)s.prog=p.id;return norm(p)};
const rowsFor=p=>p?(p.psProjects||[]):[];
const weight=(p,k)=>Math.min(7,Math.max(1,+((p.psWeights||{})[k]||PS_CRITERIA.find(c=>c.code===k).w)));
const util=(c,v)=>c.type==='cost'?(5-v)/4:(v-1)/4;
function scoreField(x,c){
 const given=+(x.scores||{})[c.code];if(given>=1&&given<=5)return given;
 if(c.code==='C2'&&Number.isFinite(+x.users)&&x.users!==''){const n=+x.users;return n<=1000?1:n<=10000?2:n<=50000?3:n<=100000?4:5}
 if(c.code==='C4'&&x.goLive){const n=Math.ceil((new Date(x.goLive+'T00:00:00')-new Date())/86400000);return n<=30?5:n<=90?4:n<=180?3:n<=365?2:1}
 if(c.code==='C5'&&x.readiness!==''&&x.readiness!=null){const n=+x.readiness;return n>=80?1:n>=70?2:n>=60?3:n>=50?4:5}
 if(c.code==='C6'){const v=['P','O','S','T','R'].map(k=>+(x.poster||{})[k]).filter(v=>v>=1&&v<=5);if(v.length===5){let n=Math.round(v.reduce((a,b)=>a+b,0)/5);if(v.includes(5))n=Math.max(3,n);return n}}
 if(c.code==='C12'){const v=['res','op','dep'].map(k=>+(x.risks||{})[k]).filter(v=>v>=1&&v<=3);if(v.length===3)return Math.round((v.reduce((a,b)=>a+b,0)/3-1)*2)+1}
 return null;
}
function calc(x,p){
 let sum=0,done=0,den=0;const details=[];
 PS_CRITERIA.forEach(c=>{const v=scoreField(x,c),w=weight(p,c.code);den+=w;
 if(v!=null){done++;sum+=util(c,v)*w}
 details.push({c,v,w,u:v!=null?util(c,v):0});
 });
 return {done,score:done===12&&den?Math.round(1000*sum/den)/10:null,details,den};
}
const labelScore=r=>r.score==null?'—':r.score.toFixed(1);
const level=r=>r.score==null?'pending':r.score>=70?'high':r.score>=40?'mid':'low';
const levelName=r=>r.score==null?'Belum dinilai':r.score>=70?'Tinggi':r.score>=40?'Sedang':'Rendah';
const included=(x,p)=>!p.psPrioritize?x.included!==false:calc(x,p).score!=null&&calc(x,p).score>+p.psThreshold;
const chosen=p=>rowsFor(p).filter(x=>included(x,p));
const readonly=p=>!ownerOk(p)||p.psStatus==='Ditetapkan';
const programsOpts=(selected)=>programs().map(p=>'<option value="'+esc2(p.id)+'"'+(selected===p.id?' selected':'')+'>'+esc2(p.nama)+' · '+esc2(p.psStatus||'Draft')+'</option>').join('');
function top(p){
 const y=year(),u=state(),num=programs().length,ct=p?rowsFor(p).length:0,approved=p?chosen(p).length:0;
 let h=vh('PS','pmo','Project Selection','Susun program dan calon proyek sebelum Work Breakdown Structure (WBS). Prioritisasi bersifat opsional.');
 h+='<section class="pswf" aria-label="Project Selection workflow"><div class="pswf-journey" role="list">'+
 [['1','Program & Calon Proyek'],['2','Prioritisasi Opsional'],['3','Penetapan'],['4','RKMK → WBS']].map((q,i)=>'<span role="listitem" class="'+(i===0?'on':'')+'"><b>'+q[0]+'</b>'+q[1]+'</span>').join('')+'</div>';
 h+='<div class="pswf-topbar"><label>Tahun Anggaran <select id="pswf-year">'+[2025,2026,2027,2028,2029].map(v=>'<option value="'+v+'"'+(y===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Program Transformasi <select id="pswf-program">'+(num?programsOpts(p&&p.id):'<option value="">Belum ada program '+y+'</option>')+'</select></label>'+
 (editOk()?'<button type="button" class="btn pri" data-pswf="add-program">+ Tambah Program</button>':'')+
 (p&&ownerOk(p)&&p.psStatus!=='Ditetapkan'?'<button type="button" class="btn" data-pswf="edit-program">Ubah Program</button>':'')+
 '<span class="pswf-sp"></span><span class="pswf-count">'+num+' program · '+ct+' calon proyek · '+approved+' dipilih</span></div>';
 if(p){
 h+='<div class="prio-hero"><div><h2>'+esc2(p.nama)+'</h2><p>'+esc2(p.kode||p.akr)+' · '+esc2(p.jenis||'Program')+' · UIC '+esc2(p.uic||'Belum ditetapkan')+' · '+esc2(p.psStatus)+'</p></div><div class="prio-hero-actions">'+
 (ownerOk(p)&&p.psStatus!=='Ditetapkan'?'<button type="button" class="btn btn-gold btn-sm" data-pswf="add-project">+ Tambah Proyek</button>':'')+
 '<button type="button" class="btn btn-outline btn-sm prio-btn-light" data-pswf="excel">⇩ Excel</button>'+
 '<button type="button" class="btn btn-outline btn-sm prio-btn-light" data-pswf="report">▤ Laporan</button></div></div>';
 }
 const tabs=[['projects','▤ Proyek',ct],['criteria','⚖ Kriteria & Bobot',12],['monev','📈 Monev Indikator & Manfaat',p?rowsFor(p).reduce((n,x)=>n+x.indicators.length+x.benefits.length,0):0],['reference','📘 Referensi & Formula',null]];
 h+='<nav class="pswf-tabs" role="tablist" aria-label="Tab Project Selection">'+tabs.map(q=>'<button type="button" role="tab" aria-selected="'+(u.tab===q[0])+'" class="'+(u.tab===q[0]?'on':'')+'" data-pswf-tab="'+q[0]+'">'+q[1]+(q[2]==null?'':' <em>'+q[2]+'</em>')+'</button>').join('')+'</nav>';
 return h;
}
function page(){
 const p=pickedProgram(),u=state();let h=top(p);
 if(!p){
 h+='<div class="pswf-empty"><h3>Belum ada Program Transformasi untuk Tahun '+year()+'</h3><p>Mulai dari mendaftarkan program, kemudian isi daftar calon proyek. WBS disusun setelah program dan proyek ditetapkan.</p>'+(editOk()?'<button type="button" class="btn pri" data-pswf="add-program">+ Tambah Program Transformasi '+year()+'</button>':'')+'</div>';
 }else if(u.tab==='projects')h+=projectsPage(p);
 else if(u.tab==='criteria')h+=criteriaPage(p);
 else if(u.tab==='monev')h+=monevPage(p);
 else h+=referencePage(p);
 h+='</section>';return h;
}
function projectsPage(p){
 const u=state(),arr=rowsFor(p),scored=arr.map(x=>({x,r:calc(x,p)})),ranks=scored.filter(z=>z.r.score!=null),high=ranks.filter(z=>z.r.score>=70),mid=ranks.filter(z=>z.r.score>=40&&z.r.score<70),low=ranks.filter(z=>z.r.score<40),top=ranks.slice().sort((a,b)=>b.r.score-a.r.score)[0];
 let h='<div class="pswf-process"><label class="pswf-check"><input type="checkbox" id="pswf-prioritize" '+(p.psPrioritize?'checked':'')+' '+(readonly(p)?'disabled':'')+'><span><b>Gunakan prioritisasi SMART</b><small>Opsional. Jika tidak diaktifkan, proyek dipilih manual tanpa skor.</small></span></label>'+
 (p.psPrioritize?'<label>Ambang pemilihan <span class="pswf-inline"><b>Skor &gt;</b><input type="number" id="pswf-threshold" min="0" max="99" step="1" value="'+esc2(p.psThreshold)+'" '+(readonly(p)?'disabled':'')+'><b>%</b></span></label>':'')+
 '<span class="pswf-sp"></span><span class="pswf-status">'+esc2(p.psStatus)+'</span></div>';
 h+='<div class="pswf-scope"><b>LINGKUP PERINGKAT</b><span class="pswf-chip on">Program: '+esc2(p.nama)+'</span><span class="pswf-chip">Tahun '+year()+'</span><span class="pswf-sp"></span><span>Program dan proyek tahun lain tidak tercampur.</span></div>';
 h+='<div class="prio-kpis"><div class="prio-kpi"><b>'+arr.length+'</b><small>Calon proyek</small></div><div class="prio-kpi k-high"><b>'+high.length+'</b><small>P1 Tinggi (≥70)</small></div><div class="prio-kpi k-mid"><b>'+mid.length+'</b><small>P2 Sedang (40–69)</small></div><div class="prio-kpi k-low"><b>'+low.length+'</b><small>P3 Rendah (&lt;40)</small></div><div class="prio-kpi k-top"><small>Prioritas teratas</small><b>'+(top?esc2(top.x.name):'—')+'</b><small>'+(top?labelScore(top.r):'Belum ada penilaian')+'</small></div></div>';
 h+='<div class="prio-toolbar"><input type="search" class="prio-search" id="pswf-search" value="'+esc2(u.q||'')+'" placeholder="Cari proyek, unit, PIC…">'+
 '<div class="prio-chips">'+[['all','Semua'],['Usulan','Usulan'],['Berjalan','Berjalan'],['high','P1 Tinggi'],['mid','P2 Sedang'],['low','P3 Rendah'],['selected','Terpilih']].map(t=>'<button type="button" class="prio-chip'+(u.filter===t[0]?' on':'')+'" data-pswf-filter="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'+
 '<span class="pswf-sp"></span><div class="prio-seg">'+[['score','Skor ↓'],['golive','Go-live'],['name','Nama']].map(t=>'<button type="button" class="'+(u.sort===t[0]?'on':'')+'" data-pswf-sort="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'+
 '<div class="prio-seg">'+[['list','☰ Daftar'],['quad','◫ Kuadran']].map(t=>'<button type="button" class="'+(u.view===t[0]?'on':'')+'" data-pswf-view="'+t[0]+'">'+t[1]+'</button>').join('')+'</div></div>';
 if(p.psPrioritize)h+='<div class="pswf-note">Proyek dipilih otomatis apabila 12 kriteria lengkap dan <b>skor absolut &gt; '+esc2(p.psThreshold)+'</b>. Bukan berdasarkan urutan ranking semata.</div>';
 const filtered=scored.filter(z=>{
  const x=z.x,r=z.r,st=x.status||'Usulan',sel=included(x,p);
  if(u.filter==='selected'&&!sel)return false;
  if(['Usulan','Berjalan'].includes(u.filter)&&st!==u.filter)return false;
  if(['high','mid','low'].includes(u.filter)&&level(r)!==u.filter)return false;
  const query=clean(u.q).toLowerCase();return !query||(x.name+' '+x.uic+' '+x.pic+' '+x.description).toLowerCase().includes(query);
 }).sort((a,b)=>u.sort==='name'?a.x.name.localeCompare(b.x.name):u.sort==='golive'?String(a.x.goLive||'9999').localeCompare(String(b.x.goLive||'9999')):(b.r.score??-1)-(a.r.score??-1));
 h+='<div class="pswf-snapshot"><label>Bandingkan dengan <select id="pswf-snapshot"><option value="">— tanpa pembanding —</option>'+p.psSnapshots.map(z=>'<option value="'+esc2(z.id)+'"'+(u.snapshot===z.id?' selected':'')+'>'+esc2(z.at.slice(0,16).replace('T',' '))+' · '+esc2(z.by||'PMO')+'</option>').join('')+'</select></label>'+(ownerOk(p)?'<button type="button" class="btn" data-pswf="save-snapshot">▣ Simpan snapshot</button>':'')+'</div>';
 if(u.view==='quad'&&p.psPrioritize)h+=quadrant(p,filtered);
 else {
 h+='<section class="prio-list"><div class="prio-list-head">'+(!p.psPrioritize&&ownerOk(p)&&p.psStatus!=='Ditetapkan'?'<button type="button" class="btn btn-outline btn-sm" data-pswf="select-all">☑ Pilih semua</button><button type="button" class="btn btn-outline btn-sm" data-pswf="clear-all">□ Kosongkan</button>':'')+'<h3>Peringkat prioritas</h3><span>Batang C1–C12: utility tiap kriteria · '+filtered.length+' proyek</span></div>';
 if(!filtered.length)h+='<div class="prio-empty">Belum ada proyek sesuai filter. Tambahkan calon proyek untuk memulai.</div>';
 filtered.forEach((z,i)=>{
  const x=z.x,r=z.r,on=(u.open||[]).includes(x.id),label=levelName(r),sel=included(x,p);
  h+='<article class="prio-row cat-'+level(r)+(on?' open':'')+'"><div class="prio-rank"><b>'+(i+1)+'</b><small>'+(!p.psPrioritize?'CALON':r.score==null?'—':'P'+(r.score>=70?1:r.score>=40?2:3))+'</small></div>'+
  '<div class="prio-main"><div class="prio-title"><h4>'+esc2(x.name)+'</h4></div><div class="prio-meta"><span class="prio-status">'+esc2(x.status||'Usulan')+'</span><span class="prio-ue">'+esc2(x.uic||p.uic||'—')+'</span><span class="prio-prog">'+esc2(p.nama)+'</span><span>Go-live: <b>'+esc2(x.goLive||'—')+'</b></span><span>PIC: '+esc2(x.pic||'—')+'</span><span>Pengguna: '+esc2(x.users||'—')+'</span>'+
  (sel?'<span class="pswf-picked">✓ Dipilih</span>':'<span class="pswf-rejected">Belum dipilih</span>')+'</div><div class="prio-utils">'+r.details.map(d=>'<span class="prio-u" title="'+esc2(d.c.code+' '+d.c.name)+'"><span class="prio-ub"><i style="height:'+Math.max(3,Math.round(d.u*100))+'%"></i></span><em>'+d.c.code+'</em></span>').join('')+'</div></div>'+
  '<div class="prio-score"><b>'+(p.psPrioritize?labelScore(r):'—')+'</b><div class="prio-bar"><i style="width:'+(r.score||0)+'%"></i></div><span class="prio-cat">'+(p.psPrioritize?'Prioritas '+label:'Seleksi manual')+'</span>'+snapshotDelta(p,x,r)+'</div>'+
  '<div class="prio-actions"><button type="button" class="btn btn-outline btn-sm" data-pswf-detail="'+esc2(x.id)+'">'+(on?'Tutup':'Rincian')+'</button>'+
  (ownerOk(p)&&p.psStatus!=='Ditetapkan'?'<button type="button" class="btn btn-ghost btn-sm" title="Edit proyek" data-pswf-project="'+esc2(x.id)+'">✎</button><button type="button" class="btn btn-ghost btn-sm" title="Hapus calon proyek" data-pswf-remove="'+esc2(x.id)+'">✕</button>':'')+
  (!p.psPrioritize&&ownerOk(p)&&p.psStatus!=='Ditetapkan'?'<label class="pswf-select"><input type="checkbox" data-pswf-include="'+esc2(x.id)+'" '+(sel?'checked':'')+'> Pilih</label>':'')+'</div>'+
  (on?detail(p,x,r):'')+'</article>';
 });
 h+='</section>';
 }
 h+=decisionPanel(p);return h;
}
function snapshotDelta(p,x,r){
 const id=state().snapshot,sp=id&&(p.psSnapshots||[]).find(z=>z.id===id);
 if(!sp||r.score==null)return '';
 const prev=(sp.rows||[]).find(z=>z.id===x.id);if(!prev||prev.score==null)return '<small class="pswf-delta">Baru sejak snapshot</small>';
 const delta=Math.round((r.score-prev.score)*10)/10;
 return '<small class="pswf-delta '+(delta>0?'up':delta<0?'down':'neutral')+'">'+(delta>0?'▲ +':delta<0?'▼ ':'● ')+delta.toFixed(1)+' vs snapshot</small>';
}
function saveSnapshot(p){
 if(!ownerOk(p))return;
 p.psSnapshots=p.psSnapshots||[];
 if(!rowsFor(p).length){toast('Tidak ada calon proyek untuk disimpan sebagai snapshot.');return}
 const snap={id:uid2('snap'),at:new Date().toISOString(),by:ME.email||'',
  rows:rowsFor(p).map(x=>({id:x.id,score:calc(x,p).score,selected:included(x,p)}))};
 p.psSnapshots.unshift(snap);p.psSnapshots=p.psSnapshots.slice(0,20);
 state().snapshot=snap.id;save();render();toast('Snapshot peringkat dan pemilihan disimpan.');
}
function detail(p,x,r){
 return '<div class="prio-detail"><div class="prio-prog-detail"><span><b>Program:</b> '+esc2(p.nama)+'</span><span><b>UIC:</b> '+esc2(x.uic||p.uic)+'</span><span><b>Deskripsi:</b> '+esc2(x.description||'—')+'</span></div>'+
 (r.done<12&&p.psPrioritize?'<p class="pswf-note">⚠ '+(12-r.done)+' kriteria belum terisi. Lengkapi dari tombol Edit.</p>':'')+
 '<table><thead><tr><th>Kriteria</th><th>Jenis</th><th>Nilai</th><th>Utility</th><th>Bobot</th><th>Kontribusi</th></tr></thead><tbody>'+
 r.details.map(d=>'<tr><td><b>'+d.c.code+'</b> '+esc2(d.c.name)+'</td><td>'+d.c.type+'</td><td>'+(d.v??'—')+'</td><td>'+d.u.toFixed(3)+'</td><td>'+d.w+'</td><td>'+(d.u*d.w/r.den*100).toFixed(2)+'%</td></tr>').join('')+
 '</tbody></table><p>'+esc2(x.notes||'')+'</p></div>';
}
function quadrant(p,filtered){
 const W=920,H=440,L=55,R=24,T=26,B=48;const px=n=>L+(n/50)*(W-L-R),py=n=>T+(1-n/100)*(H-T-B);
 let h='<div class="prio-quad"><svg viewBox="0 0 920 440" role="img" aria-label="Kuadran prioritas SMART berdasarkan skor dan perkiraan beban pendampingan">';
 const quad=(x0,y0,x1,y1,c,t)=>'<rect x="'+px(x0)+'" y="'+py(y1)+'" width="'+(px(x1)-px(x0))+'" height="'+(py(y0)-py(y1))+'" fill="'+c+'"/><text x="'+(px(x0)+10)+'" y="'+(py(y1)+20)+'" class="qt">'+t+'</text>';
 h+=quad(0,70,15,100,'#E9F6EF','Prioritas cepat')+quad(15,70,50,100,'#FFF6E3','Fokus utama')+quad(0,0,15,70,'#F4F6FB','Dukungan ringan')+quad(15,0,50,70,'#FDEEEC','Tinjau ulang');
 filtered.filter(z=>z.r.score!=null).forEach(z=>{const v=+(z.x.scores||{}).C7||3,load=[2,8,15,30,45][v-1];h+='<g data-pswf-detail="'+esc2(z.x.id)+'" role="button" tabindex="0" style="cursor:pointer"><title>'+esc2(z.x.name)+' · '+labelScore(z.r)+'</title><circle cx="'+px(load)+'" cy="'+py(z.r.score)+'" r="8" fill="'+(z.r.score>=70?'#C0392B':z.r.score>=40?'#C8A84B':'#5B8DD6')+'" stroke="#fff" stroke-width="2"/></g>'});
 return h+'</svg><p class="prio-sub">Sumbu vertikal = skor SMART; sumbu horizontal = perkiraan beban pendampingan C7.</p></div>';
}
function decisionPanel(p){
 const selected=chosen(p),total=rowsFor(p).length,valid=selected.length>0&&selected.every(x=>clean(x.name)&&clean(x.uic||p.uic)),fixed=p.psStatus==='Ditetapkan',can=ownerOk(p);
 let h='<div class="pswf-decision"><div><b>Penetapan Program & Proyek</b><p>'+selected.length+' dari '+total+' calon proyek '+(p.psPrioritize?'memenuhi ambang dan siap diusulkan':'dipilih secara manual')+'.'+(p.psPrioritize?' Hanya skor lengkap di atas '+p.psThreshold+'% yang dipilih.':'')+'</p></div><div class="pswf-decision-actions">';
 if(!fixed&&can)h+='<button type="button" class="btn pri" data-pswf="finalize" '+(!valid?'disabled':'')+'>✓ Tetapkan '+selected.length+' Proyek</button>';
 if(fixed)h+='<span class="pswf-done">✓ Proyek ditetapkan</span>'+(can?'<button type="button" class="btn" data-pswf="reopen">Buka Revisi</button>':'');
 h+='<button type="button" class="btn" data-pswf="template-word">⇩ Template RKMK Word</button>'+
 (fixed?'<button type="button" class="btn pri" data-pswf="generate-word">⇩ Generate RKMK Word</button><button type="button" class="btn" data-pswf="go-wbs">Lanjut ke WBS ›</button>':'')+
 '</div></div>';
 if(!valid)h+='<div class="pswf-note">Tambahkan minimal satu calon proyek terpilih beserta UIC sebelum penetapan.</div>';
 return h;
}
function criteriaPage(p){
 const grps=PS_GROUPS,cs=PS_CRITERIA,wgt=c=>weight(p,c.code),tot=cs.reduce((n,c)=>n+wgt(c),0),colors=['#1B3A73','#C8A84B','#8FA3C6','#C76B5A'];
 const groupPct=g=>cs.filter(c=>c.g===g[0]).reduce((n,c)=>n+wgt(c),0)/tot*100;
 let pos=0,seg=grps.map((g,i)=>{const q=groupPct(g);const t=colors[i]+' '+pos.toFixed(1)+'% '+(pos+q).toFixed(1)+'%';pos+=q;return t}).join(',');
 let h='<div class="prio-clayout"><aside class="prio-cside"><div class="prio-card"><h3>Komposisi bobot</h3><p class="prio-sub">Porsi 4 kelompok setelah normalisasi (Σ W = '+tot+')</p><div class="prio-donut" style="background:conic-gradient('+seg+')"><div><b>12</b><small>kriteria<br>4 kelompok</small></div></div><div class="prio-legend">'+grps.map((g,i)=>'<div><i style="background:'+colors[i]+'"></i><span>'+g[1]+'</span><b>'+groupPct(g).toFixed(1)+'%</b></div>').join('')+'</div>'+
 '<div class="prio-normbox"><b>Normalisasi skor</b><span>Skala absolut 1–5 untuk ambang seleksi; skor diperbandingkan antar tahun.</span></div><div class="prio-mini3"><div><b>12</b><small>kriteria</small></div><div><b>6</b><small>otomatis*</small></div><div><b>6</b><small>manual</small></div></div><small>*Nilai otomatis bergantung pada data sumber yang tersedia.</small></div></aside><section>';
 const yearPlans=programs().map(z=>norm(z));
 h+='<div class="prio-card"><div class="prio-card-head"><h3>Ambang lolos ke pemilihan proyek · Tahun '+year()+'</h3></div>'+
 '<p class="prio-sub">Proyek yang diprioritaskan otomatis dipilih bila <b>skor absolut > ambang program</b> dan seluruh 12 kriteria terisi. Program tanpa SMART menggunakan pilihan manual.</p>'+
 '<div class="prio-likert-wrap"><table class="prio-thr-t"><thead><tr><th>Program</th><th>Metode</th><th>Ambang</th><th>Terpilih / Calon</th><th>&gt;70</th><th>&gt;75</th><th>&gt;80</th><th>&gt;85</th></tr></thead><tbody>'+
 yearPlans.map(z=>{
  const pr=rowsFor(z),scores=pr.map(x=>calc(x,z).score);
  return '<tr'+(z.id===p.id?' class="chg"':'')+'><td><b>'+esc2(z.nama)+'</b></td><td>'+(z.psPrioritize?'SMART':'Manual')+'</td><td>'+(!z.psPrioritize?'—':'&gt;'+z.psThreshold)+'</td><td>'+chosen(z).length+' / '+pr.length+'</td>'+
  [70,75,80,85].map(t=>'<td class="c'+(z.psThreshold===t?' sim cur':'')+'">'+scores.filter(x=>x!=null&&x>t).length+'</td>').join('')+'</tr>';
 }).join('')+'</tbody></table></div>'+
 '<small class="prio-thr-note">Kolom &gt;70 sampai &gt;85 menyimulasikan jumlah calon proyek dengan skor lengkap yang lolos pada setiap ambang. Nilai belum lengkap tidak dihitung lolos.</small></div>';
 h+='<div class="pswf-thresholds"><span>Program aktif: '+esc2(p.nama)+'</span><span>Ambang: '+(p.psPrioritize?'&gt;'+p.psThreshold+'%':'Pemilihan manual')+'</span><span>Terpilih: '+chosen(p).length+'</span><span>Bobot aktif: '+tot+'</span></div>';
 h+='<div class="prio-editbar idle"><span>Bobot '+(readonly(p)?'terkunci':'dapat diubah sesuai kewenangan PMO')+'. Perubahan memengaruhi skor seluruh proyek di program ini.</span></div>';
 grps.forEach((g,gi)=>{
  h+='<div class="prio-grp"><div class="prio-grp-h" style="--gc:'+colors[gi]+'"><span>'+g[1].toUpperCase()+'</span><em>'+groupPct(g).toFixed(1)+'%</em></div><div class="prio-grp-b">';
  cs.filter(c=>c.g===g[0]).forEach(c=>{
   const w=wgt(c),pct=w/tot*100;
   h+='<div class="prio-cr"><div class="prio-cr-code">'+c.code+'</div><div class="prio-cr-name"><b>'+esc2(c.name)+'</b><small>'+esc2(c.note||'')+'</small><div class="prio-tags"><em class="'+c.type+'">'+(c.type==='cost'?'biaya':'benefit')+'</em>'+(c.auto?'<em class="auto">otomatis</em>':'')+'</div></div>'+
   '<div class="prio-cr-w">'+(readonly(p)?'<b>'+w+'</b>':'<input type="number" data-pswf-weight="'+c.code+'" min="1" max="7" value="'+w+'">')+'</div>'+
   '<div class="prio-cr-wv">W = '+w+' / 7<div class="prio-wbar"><i style="width:'+(w/7*100)+'%"></i></div></div><div class="prio-cr-pct">'+pct.toFixed(1)+'%</div>'+
   '<details class="pswf-rub"><summary>Lihat rubrik 1–5</summary>'+c.rubric.map((v,i)=>'<div><b>'+(i+1)+'</b> '+esc2(v)+'</div>').join('')+'</details></div>';
  });h+='</div></div>';
 });
 if(!readonly(p))h+='<div class="pswf-actions"><button type="button" class="btn pri" data-pswf="save-weights">Simpan Bobot</button><button type="button" class="btn" data-pswf="reset-weights">Bobot Default</button></div>';
 h+='</section></div>';return h;
}

function latest(o){
 const q=o.quarters||{};
 for(const k of ['Q4','Q3','Q2','Q1'])if(q[k]!==''&&q[k]!=null)return q[k];
 return o.actual==null?'':o.actual;
}
function metricPct(o){
 const raw=latest(o),target=Number(o.target),actual=Number(raw);
 if(raw===''||o.target===''||o.target==null||!Number.isFinite(target)||!Number.isFinite(actual)||actual<0)return null;
 const down=o.direction==='Turun';
 if((down&&actual<=0)||(!down&&target<=0))return null;
 return Math.round((down?target/actual:actual/target)*1000)/10;
}
function metricIndex(list){
 const vals=list.map(metricPct).filter(v=>v!=null);
 return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null;
}
function monevSummary(x){
 const ind=metricIndex(x.indicators||[]),today=new Date().toISOString().slice(0,10),ben=x.benefits||[];
 const evaluated=ben.filter(o=>(o.due&&o.due<=today)||latest(o)!=='');
 const success=evaluated.filter(o=>metricPct(o)!=null&&metricPct(o)>=100).length;
 const benefit=metricIndex(evaluated);
 return {ind,benefit,success,evaluated:evaluated.length,wait:ben.length-evaluated.length};
}
function trend(o){
 const vals=['Q1','Q2','Q3','Q4'].map(k=>(o.quarters||{})[k]).filter(v=>v!==''&&v!=null&&Number.isFinite(+v));
 if(vals.length<2)return '—';
 return +vals[vals.length-1]>+vals[vals.length-2]?'↗':+vals[vals.length-1]<+vals[vals.length-2]?'↘':'→';
}
function monevPage(p){
 const u=state(),arr=rowsFor(p),active=arr.find(x=>x.id===u.monevPid)||arr[0];if(active)u.monevPid=active.id;
 let h='<div class="mv-top"><div class="prio-seg"><button type="button" class="'+(u.monevView==='proj'?'on':'')+'" data-pswf-mv="proj">Per proyek</button><button type="button" class="'+(u.monevView==='port'?'on':'')+'" data-pswf-mv="port">Portofolio</button></div><span class="pswf-sp"></span><button type="button" class="btn pri" data-pswf="monev-report">▤ Laporan Monev</button></div>';
 if(!arr.length)return h+'<div class="pswf-empty">Belum ada proyek. Daftarkan proyek pada tab Proyek terlebih dahulu.</div>';
 if(u.monevView==='port'){
  const sm=arr.map(x=>({x,m:monevSummary(x)})),ad=sm.map(z=>z.m.ind).filter(v=>v!=null),bn=sm.map(z=>z.m.benefit).filter(v=>v!=null);
  const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length)+'%':'—';
  const warning=sm.filter(z=>(z.m.ind!=null&&z.m.ind<80)||(z.m.benefit!=null&&z.m.benefit<80));
  h+='<div class="mv-kpis">'+
   '<div class="mv-k"><b>'+arr.length+'</b><small>Proyek</small></div><div class="mv-k"><b>'+arr.reduce((n,x)=>n+x.indicators.length,0)+'</b><small>Indikator CM</small></div>'+
   '<div class="mv-k"><b>'+arr.reduce((n,x)=>n+x.benefits.length,0)+'</b><small>Manfaat diregister</small></div>'+
   '<div class="mv-k ok"><b>'+avg(ad)+'</b><small>Rerata indeks adopsi</small></div>'+
   '<div class="mv-k ok"><b>'+avg(bn)+'</b><small>Rerata indeks manfaat</small></div>'+
   '<div class="mv-k warn"><b>'+warning.length+'</b><small>Proyek perlu perhatian</small></div></div>';
  h+='<div class="prio-card"><h3>Matriks Adopsi × Manfaat</h3><p class="prio-sub">Titik menunjukkan proyek yang sudah memiliki pengukuran indeks adopsi dan indeks manfaat.</p>';
  const candidates=sm.filter(z=>z.m.ind!=null&&z.m.benefit!=null);
  if(!candidates.length)h+='<div class="pswf-empty">Belum ada proyek dengan kedua indeks yang terukur.</div>';
  else {
   const xp=v=>50+Math.min(100,Math.max(0,v))*4,yp=v=>450-Math.min(100,Math.max(0,v))*4;
   h+='<svg class="pswf-adoption-chart" viewBox="0 0 520 500" role="img" aria-label="Matriks adopsi dan realisasi manfaat"><rect x="50" y="50" width="400" height="400" fill="#F9FBFD" stroke="#DCE3EF"/>'+
    '<line x1="50" y1="'+yp(80)+'" x2="450" y2="'+yp(80)+'" stroke="#D2A73C" stroke-dasharray="5 5"/>'+
    '<line x1="'+xp(80)+'" y1="50" x2="'+xp(80)+'" y2="450" stroke="#D2A73C" stroke-dasharray="5 5"/>'+
    '<text x="250" y="486" text-anchor="middle" fill="#304D70" font-size="12">Indeks Adopsi (%)</text>'+
    '<text x="22" y="250" transform="rotate(-90 22 250)" text-anchor="middle" fill="#304D70" font-size="12">Indeks Manfaat (%)</text>'+
    candidates.map((z,i)=>'<g><title>'+esc2(z.x.name)+' · Adopsi '+z.m.ind+'% · Manfaat '+z.m.benefit+'%</title><circle cx="'+xp(z.m.ind)+'" cy="'+yp(z.m.benefit)+'" r="7" fill="'+(z.m.ind<80||z.m.benefit<80?'#C65A50':'#1C5C93')+'"/><text x="'+(xp(z.m.ind)+9)+'" y="'+(yp(z.m.benefit)-6)+'" font-size="10" fill="#25476B">'+esc2(z.x.name.slice(0,19))+'</text></g>').join('')+'</svg>';
  }
  h+='</div><div class="prio-card"><h3>Register Portofolio · Realisasi Manfaat dan Adopsi</h3><div class="prio-likert-wrap"><table class="prio-kb-table"><thead><tr><th>Proyek</th><th>Adopsi</th><th>Manfaat</th><th>Indikator</th><th>Manfaat</th><th>Perlu perhatian</th></tr></thead><tbody>'+
   sm.map(z=>'<tr><td>'+esc2(z.x.name)+'</td><td>'+(z.m.ind==null?'—':z.m.ind+'%')+'</td><td>'+(z.m.benefit==null?'—':z.m.benefit+'%')+'</td><td>'+z.x.indicators.length+'</td><td>'+z.x.benefits.length+'</td><td>'+((z.m.ind!=null&&z.m.ind<80)||(z.m.benefit!=null&&z.m.benefit<80)?'Ya':'Tidak')+'</td></tr>').join('')+'</tbody></table></div></div>';
  return h;
 }
 h+='<div class="mv-bar"><label>Proyek <select id="pswf-mv-project">'+arr.map(x=>'<option value="'+esc2(x.id)+'"'+(x.id===u.monevPid?' selected':'')+'>'+esc2(x.name)+'</option>').join('')+'</select></label><span class="pswf-sp"></span><span>Go-live: '+esc2(active.goLive||'Belum ditentukan')+'</span></div>';
 const m=monevSummary(active),inds=active.indicators||[],benefits=active.benefits||[];
 h+='<div class="mv-kpis">'+
  '<div class="mv-k"><b>'+(m.ind==null?'—':m.ind+'%')+'</b><small>Indeks adopsi (rata-rata capaian indikator CM)</small></div>'+
  '<div class="mv-k"><b>'+(m.benefit==null?'—':m.benefit+'%')+'</b><small>Indeks manfaat (yang telah dievaluasi)</small></div>'+
  '<div class="mv-k ok"><b>'+m.success+' / '+m.evaluated+'</b><small>Manfaat tercapai / sudah dievaluasi</small></div>'+
  '<div class="mv-k"><b>'+m.wait+'</b><small>Manfaat belum jatuh tempo</small></div></div>';
 if((m.ind!=null&&m.ind<80)||(m.benefit!=null&&m.benefit<80))
  h+='<div class="pswf-mv-alert"><b>! &nbsp;Adopsi atau manfaat masih di bawah target</b><small>Perkuat adopsi pengguna dan tindak lanjut capaian indikator agar manfaat program terealisasi.</small></div>';
 h+='<div class="prio-card"><div class="prio-card-head"><h3>■ Indikator Keberhasilan CM — Triwulanan</h3><span>Leading indicator · adopsi</span>'+(ownerOk(p)?'<button type="button" class="btn btn-outline btn-sm" data-pswf-mvadd="indicators">+ Indikator</button>':'')+'</div>';
 if(!inds.length)h+='<p class="prio-sub">Belum ada indikator CM. Tambahkan target, baseline dan capaian triwulanan.</p>';
 else h+='<div class="prio-likert-wrap"><table class="prio-kb-table pswf-mv-table"><thead><tr><th>Indikator</th><th>Baseline</th><th>Target</th>'+[1,2,3,4].map(i=>'<th>TW '+['I','II','III','IV'][i-1]+' '+year()+'</th>').join('')+'<th>Capaian</th><th>Tren</th><th>Aksi</th></tr></thead><tbody>'+
  inds.map((o,i)=>{const pct=metricPct(o),level=pct==null?'—':pct>=100?'Tercapai':pct>=80?'On track':'Perlu perhatian';
   return '<tr><td><b>'+esc2(o.name)+'</b><small>'+esc2(o.unit||'')+' · '+(o.direction==='Turun'?'turun lebih baik':'naik lebih baik')+'</small></td><td>'+esc2(o.base||'—')+'</td><td><b>'+esc2(o.target||'—')+'</b></td>'+
    ['Q1','Q2','Q3','Q4'].map(k=>'<td>'+esc2((o.quarters||{})[k]??'—')+'</td>').join('')+
    '<td><span class="pswf-mv-pct '+(pct!=null&&pct<80?'bad':'')+'">'+(pct==null?'Belum diukur':level+' · '+pct+'%')+'</span></td><td class="pswf-trend">'+trend(o)+'</td><td>'+(ownerOk(p)?'<button class="btn btn-outline btn-sm" data-pswf-mvedit="indicators:'+i+'">Ubah</button>':'')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
 h+='</div><div class="prio-card"><div class="prio-card-head"><h3>■ Register Manfaat & Evaluasi</h3><span>Lagging indicator · outcome</span>'+(ownerOk(p)?'<button type="button" class="btn btn-outline btn-sm" data-pswf-mvadd="benefits">+ Manfaat</button>':'')+'</div>';
 if(!benefits.length)h+='<p class="prio-sub">Belum ada manfaat terukur. Tetapkan baseline, target, satuan dan tenggat realisasinya.</p>';
 else h+='<div class="prio-likert-wrap"><table class="prio-kb-table"><thead><tr><th>Manfaat</th><th>Baseline</th><th>Target</th><th>Realisasi</th><th>Tenggat</th><th>Capaian</th><th>Aksi</th></tr></thead><tbody>'+
  benefits.map((o,i)=>{const pct=metricPct(o);
   return '<tr><td><b>'+esc2(o.name)+'</b><small>'+esc2(o.unit||'')+'</small></td><td>'+esc2(o.base||'—')+'</td><td>'+esc2(o.target||'—')+'</td><td>'+esc2(latest(o)||'—')+'</td><td>'+esc2(o.due||'—')+'</td>'+
    '<td><span class="pswf-mv-pct '+(pct!=null&&pct<80?'bad':'')+'">'+(pct==null?'Belum diukur':pct+'%')+'</span></td>'+
    '<td>'+(ownerOk(p)?'<button class="btn btn-outline btn-sm" data-pswf-mvedit="benefits:'+i+'">Ubah</button>':'')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
 h+='</div>';
 return h;
}
function referencePage(p){
 const u=state(),w=PS_CRITERIA.reduce((n,c)=>n+weight(p,c.code),0);
 let h='<div class="prio-card prio-t1"><div class="pswf-ref-head"><h3>Tabel 1 · Kriteria dan Bobot</h3><span class="pswf-sp"></span>'+
 '<label><input type="checkbox" id="pswf-formula" '+(u.formula?'checked':'')+'> Tampilkan formula</label>'+
 '<label><input type="checkbox" id="pswf-params" '+(u.params?'checked':'')+'> Tampilkan semua parameter</label>'+
 '<button type="button" class="btn btn-outline btn-sm" data-pswf="excel-reference">⇩ Excel</button></div>';
 if(u.formula)h+='<p class="pswf-note">Skor akhir = 100 × Σ (bobot normalisasi × utility). Utility manfaat = (nilai−1)/4; utility biaya = (5−nilai)/4. Bobot normalisasi = bobot / '+w+'.</p>';
 h+='<div class="prio-likert-wrap"><table class="prio-kb-table"><thead><tr><th>No</th><th>Variabel</th><th>Nama Kriteria</th><th>Parameter</th><th>Nilai Kriteria</th><th>Bobot Kriteria<br><small>Skala 1–7</small></th><th>Normalisasi Bobot</th></tr></thead><tbody>';
 PS_CRITERIA.forEach((c,i)=>{
  const n=u.params?5:1,v=weight(p,c.code),pct=(v/w*100).toFixed(1).replace('.',',')+'%',name=(PS_GROUPS.find(x=>x[0]===c.g)||[])[1]||c.g;
  for(let j=0;j<n;j++){const ri=u.params?4-j:0;
   h+='<tr class="'+(j===0?'kb-first':'')+'">'+(j===0?'<td rowspan="'+n+'" class="kb-no">'+(i+1)+'</td><td rowspan="'+n+'">'+esc2(name)+'</td><td rowspan="'+n+'" class="kb-name"><b>'+c.code+' · '+esc2(c.name)+'</b><small>'+esc2(c.note||'')+'</small><em class="'+c.type+'">'+c.type+'</em></td>':'')+
    '<td>'+esc2(u.params?c.rubric[ri]:c.desc)+'</td><td class="kb-val">'+(u.params?ri+1:'1–5')+'</td>'+(j===0?'<td rowspan="'+n+'" class="kb-w">'+v+'</td><td rowspan="'+n+'" class="kb-w">'+pct+'</td>':'')+'</tr>';
  }
 });
 h+='</tbody><tfoot><tr><td colspan="5">Jumlah bobot</td><td>'+w+'</td><td>100%</td></tr></tfoot></table></div></div>';
 h+='<div class="prio-card"><h3>Tabel 2 · Rubrik POSTER (dasar nilai C6)</h3><p class="prio-sub">Perubahan Proses, Organisasi, SDM, Teknologi, dan Regulasi dinilai 1–5. C6 dihitung dari rata-rata; apabila terdapat nilai 5, C6 minimal 3.</p></div>';
 h+='<div class="prio-card"><h3>Tabel 3 · Panduan Implementasi</h3><p>1. Susun program dan calon proyek untuk tahun terpilih.</p><p>2. Aktifkan SMART hanya jika perlu memilih proyek berdasarkan skor.</p><p>3. Tetapkan proyek final, generate rancangan RKMK, kemudian susun WBS pada Project Management.</p><p>4. Monev mengukur adopsi dan manfaat setelah implementasi.</p></div>';
 return h;
}

function mount(){
 const root=document.querySelector('#view .pswf');if(!root)return;
 root.addEventListener('click',e=>{
  const b=e.target.closest('button,[data-pswf-detail]');if(!b)return;
  const p=pickedProgram(),a=b.dataset.pswf;
  if(b.dataset.pswfTab){state().tab=b.dataset.pswfTab;save();render();return}
  if(b.dataset.pswfFilter){state().filter=b.dataset.pswfFilter;save();render();return}
  if(b.dataset.pswfSort){state().sort=b.dataset.pswfSort;save();render();return}
  if(b.dataset.pswfView){state().view=b.dataset.pswfView;save();render();return}
  if(b.dataset.pswfMv){state().monevView=b.dataset.pswfMv;save();render();return}
  if(b.dataset.pswfDetail){const u=state(),id=b.dataset.pswfDetail;u.open=u.open||[];u.open=u.open.includes(id)?u.open.filter(x=>x!==id):u.open.concat(id);save();render();return}
  if(b.dataset.pswfProject){if(p)projectModal(p,b.dataset.pswfProject);return}
  if(b.dataset.pswfRemove){if(p)removeProject(p,b.dataset.pswfRemove);return}
  if(b.dataset.pswfMvadd){if(p)monevModal(p,state().monevPid,b.dataset.pswfMvadd,-1);return}
  if(b.dataset.pswfMvedit){if(p){const t=b.dataset.pswfMvedit.split(':');monevModal(p,state().monevPid,t[0],+t[1])}return}
  switch(a){
   case 'add-program':programModal(null);return;
   case 'edit-program':if(p)programModal(p);return;
   case 'delete-program':if(p)deleteProgram(p);return;
   case 'add-project':if(p)projectModal(p,'');return;
   case 'save-snapshot':if(p)saveSnapshot(p);return;
   case 'select-all':if(p&&!p.psPrioritize&&!readonly(p)){rowsFor(p).forEach(x=>x.included=true);save();render()}return;
   case 'clear-all':if(p&&!p.psPrioritize&&!readonly(p)){rowsFor(p).forEach(x=>x.included=false);save();render()}return;
   case 'save-weights':if(p)saveWeights(p,root);return;
   case 'reset-weights':if(p)resetWeights(p);return;
   case 'finalize':if(p)finalize(p);return;
   case 'reopen':if(p)reopen(p);return;
   case 'go-wbs':if(p){S.ui.prog=p.akr;save();location.hash='#pmo-wbsplan'}return;
   case 'template-word':word(p,true);return;
   case 'generate-word':if(p)word(p,false);return;
   case 'excel':exportCsv(p,'projects');return;
   case 'excel-reference':exportCsv(p,'criteria');return;
   case 'report':printReport(p);return;
   case 'monev-report':exportCsv(p,'monev');return;
   case 'ambil-wbs':if(p)importLegacyProjects(p);return;
  }
 });
 root.addEventListener('change',e=>{
  const q=e.target,p=pickedProgram();
  if(q.id==='pswf-year'){S.ui.tahun=+q.value;state().prog='';state().q='';state().filter='all';save();render()}
  else if(q.id==='pswf-program'){state().prog=q.value;state().q='';state().filter='all';save();render()}
  else if(q.id==='pswf-prioritize'&&p&&!readonly(p)){p.psPrioritize=q.checked;save();render()}
  else if(q.id==='pswf-threshold'&&p&&!readonly(p)){const v=Number(q.value);if(v<0||v>99||!Number.isFinite(v)){toast('Ambang harus antara 0–99.');return}p.psThreshold=v;save();render()}
  else if(q.dataset.pswfInclude&&p&&!readonly(p)){const x=rowsFor(p).find(x=>x.id===q.dataset.pswfInclude);if(x){x.included=q.checked;save();render()}}
  else if(q.id==='pswf-snapshot'){state().snapshot=q.value;save();render()}
  else if(q.id==='pswf-mv-project'){state().monevPid=q.value;save();render()}
  else if(q.id==='pswf-formula'){state().formula=q.checked;save();render()}
  else if(q.id==='pswf-params'){state().params=q.checked;save();render()}
 });
 const search=root.querySelector('#pswf-search');
 if(search)search.addEventListener('input',()=>{state().q=search.value;const n=search.selectionStart;save();render();const next=document.querySelector('#pswf-search');if(next){next.focus();next.setSelectionRange(n,n)}});
}
function modal(title,body,saveFn,saveLabel){
 const overlay=document.createElement('div');overlay.className='pswf-overlay';
 overlay.innerHTML='<section class="pswf-modal" role="dialog" aria-modal="true" aria-label="'+esc2(title)+'"><header><h2>'+esc2(title)+'</h2><button type="button" data-close aria-label="Tutup">✕</button></header><main>'+body+'</main><footer><button class="btn" type="button" data-close>Batal</button><button class="btn pri" type="button" data-save>'+(saveLabel||'Simpan')+'</button></footer></section>';
 document.body.appendChild(overlay);
 const close=()=>overlay.remove();
 overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-close]'))close();else if(e.target.closest('[data-save]'))saveFn(overlay,close)});
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 overlay.querySelector('input,select,textarea,button')?.focus();
 return overlay;
}
const val=(root,key)=>{const el=root.querySelector('[data-f="'+key+'"]');return el?clean(el.value):''};
const field=(k,l,v='',type='text',need=false,extra='')=>'<label class="pswf-field"><span>'+l+(need?' *':'')+'</span><input type="'+type+'" data-f="'+k+'" value="'+esc2(v)+'" '+extra+'></label>';
const area=(k,l,v='')=>'<label class="pswf-field span2"><span>'+l+'</span><textarea data-f="'+k+'" rows="3">'+esc2(v)+'</textarea></label>';
const sel=(k,l,opts,v)=>'<label class="pswf-field"><span>'+l+'</span><select data-f="'+k+'">'+opts.map(x=>'<option value="'+esc2(x)+'"'+(x===v?' selected':'')+'>'+esc2(x)+'</option>').join('')+'</select></label>';
const units=()=>typeof UNITS!=='undefined'&&Array.isArray(UNITS)?UNITS:['Setjen','Itjen','DJA','DJP','DJBC','DJPb','DJPK','DJKN','DJPPR','DJSEF','DJSPSK','BPPK','BaTii','LNSW'];
function programModal(p){
 if(!editOk())return;
 if(p&&!ownerOk(p))return;
 if(p&&p.psStatus==='Ditetapkan'){toast('Buka revisi program terlebih dahulu.');return}
 const isNew=!p,y=year();
 const body='<div class="pswf-form-grid">'+
 field('nama','Nama Program Transformasi',p?.nama||'','text',true,'maxlength="180"')+
 field('kode','Kode Program',p?.kode||'','text',true,'maxlength="40"')+
 sel('jenis','Jenis Program',['Berkelanjutan','Tematik','Lainnya'],p?.jenis||'Berkelanjutan')+
 sel('uic','UIC Utama',units(),p?.uic||'BaTii')+
 field('pend','UIC Pendukung (pisahkan koma)',p?.pend||'')+
 field('sponsor','Sponsor / Penanggung Jawab',p?.sponsor||'')+
 area('objective','Tujuan / sasaran strategis program',p?.psObjective||'')+
 area('background','Latar belakang dan kebutuhan transformasi',p?.psBackground||'')+
 area('strategy','Terobosan / pendekatan pelaksanaan',p?.psStrategy||'')+
 area('outcome','Outcome yang diharapkan',p?.psOutcome||'')+
 area('risks','Risiko strategis program',p?.psRisks||'')+
 area('themes','Tema / keterkaitan kebijakan (opsional)',p?.psThemes||'')+
 '</div><p class="pswf-note">Program disimpan untuk Tahun '+y+'. Selama berstatus Draft, program tidak masuk daftar kerja Project Management/WBS.</p>';
 modal((isNew?'Tambah':'Ubah')+' Program Transformasi · '+y,body,(box,close)=>{
  const name=val(box,'nama'),code=val(box,'kode'),uic=val(box,'uic');
  if(!name||!code||!uic){toast('Nama, kode, dan UIC Utama wajib diisi.');return}
  const dup=allPrograms().some(o=>o!==p&&String(o.kode||'').toLowerCase()===code.toLowerCase()&&+o.psYear===y);
  if(dup){toast('Kode program sudah digunakan pada tahun '+y+'.');return}
  const target=p||{id:uid2('program'),akr:'PS'+y+'-'+uid2('p'),psYear:y,psDraft:true,psStatus:'Draft',psThreshold:80,psPrioritize:false,psProjects:[],psWeights:{},mulai:y,periode:y+'–'+y,status:'Perencanaan'};
  Object.assign(target,{nama:name,kode:code,jenis:val(box,'jenis'),uic,pend:val(box,'pend'),sponsor:val(box,'sponsor'),
   psObjective:val(box,'objective'),psBackground:val(box,'background'),psStrategy:val(box,'strategy'),
   psOutcome:val(box,'outcome'),psRisks:val(box,'risks'),psThemes:val(box,'themes'),psYear:y,
   psUpdatedAt:new Date().toISOString(),psUpdatedBy:ME.email||''});
  if(isNew)allPrograms().push(target);
  state().prog=target.id;save();close();render();toast('Program tersimpan. Tambahkan calon proyek di dalamnya.');
 },isNew?'Tambah Program':'Simpan Program');
}
function deleteProgram(p){
 if(!ownerOk(p)||p.psStatus==='Ditetapkan')return;
 if((S.wbs||[]).some(w=>w.prog===p.akr&&!w.arsip)){toast('Program yang sudah memiliki WBS tidak boleh dihapus.');return}
 if(!window.confirm('Hapus draf program '+p.nama+' beserta daftar calon proyek?'))return;
 S.programs=S.programs.filter(x=>x!==p);state().prog='';save();render();toast('Draf program dihapus.');
}
function projectModal(p,id){
 if(!ownerOk(p)||readonly(p))return;
 const x=id?rowsFor(p).find(x=>x.id===id):null; if(id&&!x)return;
 const g=(k,v)=>x&&x[k]!=null?x[k]:v||'';
 const body='<div class="pswf-form-grid">'+
 field('name','Nama Proyek / Modul',g('name'),'text',true,'maxlength="180"')+
 field('uic','UIC / Unit Pemilik',g('uic',p.uic),'text',true,'maxlength="140"')+
 field('pic','PIC / Project Owner',g('pic'))+
 sel('status','Status',['Usulan','Berjalan','Ditunda','Selesai'],g('status','Usulan'))+
 field('start','Rencana mulai',g('start'),'date')+
 field('goLive','Target go-live',g('goLive'),'date')+
 field('users','Jumlah pengguna terdampak (dasar C2)',g('users'),'number',false,'min="0"')+
 field('readiness','Skor kesiapan / CRA (%) (dasar C5)',g('readiness'),'number',false,'min="0" max="100"')+
 area('description','Latar belakang / Deskripsi proyek',g('description'))+
 area('outputs','Output / deliverable proyek',g('outputs'))+
 area('outcome','Outcome / manfaat strategis',g('outcome'))+
 area('accepted','Kriteria penyelesaian (acceptance criteria)',g('accepted'))+
 area('notes','Catatan penilaian dan keputusan',g('notes'))+'</div>'+
 '<details class="pswf-detail-form" '+(p.psPrioritize?'open':'')+'><summary>Penilaian SMART · 12 kriteria (opsional jika prioritisasi tidak digunakan)</summary>'+
 '<div class="pswf-score-grid">'+PS_CRITERIA.map(c=>{
  const chosen=+(x?.scores||{})[c.code]||0;
  return '<label><b>'+c.code+' · '+esc2(c.name)+'</b><small>'+esc2(c.note||'')+'</small><select data-score="'+c.code+'"><option value="">'+(c.auto?'Gunakan nilai otomatis / belum tersedia':'Belum dinilai')+'</option>'+
  [1,2,3,4,5].map((v,i)=>'<option value="'+v+'"'+(chosen===v?' selected':'')+'>'+v+' · '+esc2(c.rubric[i])+'</option>').join('')+'</select></label>';
 }).join('')+'</div>'+
 '<h4>POSTER (untuk C6 otomatis)</h4><div class="pswf-minigrid">'+[['P','Proses'],['O','Organisasi'],['S','SDM'],['T','Teknologi'],['R','Regulasi']].map(d=>'<label>'+d[1]+' <select data-poster="'+d[0]+'"><option value="">—</option>'+[1,2,3,4,5].map(v=>'<option value="'+v+'"'+(+(x?.poster||{})[d[0]]===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label>').join('')+'</div>'+
 '<h4>Risiko implementasi (untuk C12 otomatis)</h4><div class="pswf-minigrid">'+[['res','Resistensi'],['op','Operasional'],['dep','Ketergantungan']].map(d=>'<label>'+d[1]+' <select data-risk="'+d[0]+'"><option value="">—</option>'+[['1','Rendah'],['2','Sedang'],['3','Tinggi']].map(z=>'<option value="'+z[0]+'"'+(String((x?.risks||{})[d[0]])===z[0]?' selected':'')+'>'+z[1]+'</option>').join('')+'</select></label>').join('')+'</div></details>';
 modal((x?'Ubah':'Tambah')+' Calon Proyek · '+p.nama,body,(box,close)=>{
  if(!val(box,'name')||!val(box,'uic')){toast('Nama Proyek dan UIC wajib diisi.');return}
  const z=x||{id:uid2('proj'),included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[]};
  for(const k of ['name','uic','pic','status','start','goLive','users','readiness','description','outputs','outcome','accepted','notes'])z[k]=val(box,k);
  z.scores=z.scores||{};z.poster=z.poster||{};z.risks=z.risks||{};
  box.querySelectorAll('[data-score]').forEach(el=>{if(el.value)z.scores[el.dataset.score]=+el.value;else delete z.scores[el.dataset.score]});
  box.querySelectorAll('[data-poster]').forEach(el=>{if(el.value)z.poster[el.dataset.poster]=+el.value;else delete z.poster[el.dataset.poster]});
  box.querySelectorAll('[data-risk]').forEach(el=>{if(el.value)z.risks[el.dataset.risk]=+el.value;else delete z.risks[el.dataset.risk]});
  z.updatedAt=new Date().toISOString();z.updatedBy=ME.email||'';
  if(!x)p.psProjects.push(z);
  save();close();render();toast('Calon proyek tersimpan.');
 },x?'Simpan Perubahan':'Tambah Calon Proyek');
}
function removeProject(p,id){
 if(!ownerOk(p)||readonly(p))return;
 const x=rowsFor(p).find(z=>z.id===id);if(!x)return;
 if(!window.confirm('Hapus calon proyek "'+x.name+'"?'))return;
 p.psProjects=p.psProjects.filter(z=>z!==x);save();render();toast('Calon proyek dihapus.');
}
function importLegacyProjects(p){
 if(!ownerOk(p)||p.psStatus==='Ditetapkan'||+p.psYear>2026)return;
 const old=progProjects(p);if(!old.length){toast('Belum ada proyek WBS yang dapat diambil.');return}
 const existing=new Set(rowsFor(p).map(x=>x.name.toLowerCase()));
 let n=0;old.forEach(x=>{if(existing.has(x.n.toLowerCase()))return;
  rowsFor(p).push({id:uid2('proj'),name:x.n,uic:x.uic||p.uic,pic:'',users:'',goLive:x.f||'',start:x.s||'',status:'Berjalan',included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[]});n++;
 });p.psYear=year();save();render();toast(n+' proyek diambil dari WBS lama.');
}
function saveWeights(p,root){
 if(readonly(p))return;const w={};let valid=true;
 root.querySelectorAll('[data-pswf-weight]').forEach(q=>{const n=+q.value;if(!Number.isInteger(n)||n<1||n>7)valid=false;else w[q.dataset.pswfWeight]=n});
 if(!valid){toast('Bobot harus bilangan bulat 1–7.');return}
 p.psWeights=w;save();render();toast('Bobot SMART tersimpan.');
}
function resetWeights(p){if(readonly(p))return;p.psWeights={};save();render();toast('Bobot dikembalikan ke bawaan Priority.')}
function finalize(p){
 if(!ownerOk(p)||p.psStatus==='Ditetapkan')return;
 const list=chosen(p);
 if(!list.length){toast('Belum ada proyek yang dipilih untuk ditetapkan.');return}
 if(list.some(x=>!x.name||!x.uic)){toast('Lengkapi nama dan UIC semua proyek terpilih.');return}
 if(!window.confirm('Tetapkan '+list.length+' proyek untuk program '+p.nama+' tahun '+p.psYear+'? Proyek terpilih akan tampil di Project Management sebagai calon WBS.'))return;
 p.psStatus='Ditetapkan';p.psDraft=false;p.psFinalizedAt=new Date().toISOString();p.psFinalizedBy=ME.email||'';p.psSelectedProjectIds=list.map(x=>x.id);
 p.status='Perencanaan';S.ui.prog=p.akr;save();render();toast('Program dan proyek ditetapkan. RKMK Word siap digenerate; lanjutkan WBS setelah reviu.');
}
function reopen(p){
 if(!ownerOk(p)||p.psStatus!=='Ditetapkan')return;
 if((S.wbs||[]).some(w=>w.prog===p.akr&&!w.arsip)){toast('Program sudah memiliki WBS. Revisi perlu mengikuti mekanisme Change Request / pengendalian baseline.');return}
 if(!window.confirm('Buka kembali penetapan? Program akan sementara ditarik dari Project Management sampai ditetapkan ulang.'))return;
 p.psStatus='Draft';p.psDraft=true;delete p.psFinalizedAt;delete p.psFinalizedBy;save();render();toast('Program kembali ke status Draft.');
}
function monevModal(p,pid,type,index){
 if(!ownerOk(p))return;
 const project=rowsFor(p).find(x=>x.id===pid),list=project&&project[type];if(!list)return;
 const old=index>=0?list[index]:null;
 const body='<div class="pswf-form-grid">'+field('name','Nama indikator / manfaat',old?.name||'','text',true)+
 field('base','Baseline',old?.base||'')+field('target','Target',old?.target||'')+field('actual','Realisasi',old?.actual||'')+
 field('unit','Satuan',old?.unit||'')+field('due','Target selesai / evaluasi',old?.due||'','date')+
 sel('direction','Arah indikator (untuk menghitung capaian)',['Naik','Turun'],old?.direction||'Naik')+
 area('note','Catatan pemantauan',old?.note||'')+'</div>'+
 (type==='indicators'?'<div class="pswf-form-grid pswf-quarter-grid">'+[['Q1','TW I'],['Q2','TW II'],['Q3','TW III'],['Q4','TW IV']].map(t=>field('quarter'+t[0],t[1]+' '+year(),(old?.quarters||{})[t[0]]||'','number')).join('')+'</div>':'');
 modal((type==='indicators'?'Indikator Keberhasilan CM':'Register Manfaat')+' · '+project.name,body,(box,close)=>{
  if(!val(box,'name')){toast('Nama indikator/manfaat wajib diisi.');return}
  const obj=old||{id:uid2('mv')};
  for(const k of ['name','base','target','actual','unit','due','direction','note'])obj[k]=val(box,k);
  if(type==='indicators'){obj.quarters={};for(const q of ['Q1','Q2','Q3','Q4'])obj.quarters[q]=val(box,'quarter'+q);const recent=['Q4','Q3','Q2','Q1'].map(q=>obj.quarters[q]).find(v=>v!=='');if(recent!=='undefined'&&recent!=null)obj.actual=recent}
  if(!old)list.push(obj);save();close();render();toast('Data Monev tersimpan.');
 });
}
function exportCsv(p,type){
 if(!p){toast('Pilih program dahulu.');return}
 let data=[];
 if(type==='criteria')data=[['Kode','Kriteria','Kelompok','Jenis','Bobot','Normalisasi (%)'],...PS_CRITERIA.map(c=>[c.code,c.name,(PS_GROUPS.find(g=>g[0]===c.g)||[])[1],c.type,weight(p,c.code),(weight(p,c.code)/PS_CRITERIA.reduce((n,x)=>n+weight(p,x.code),0)*100).toFixed(1)])];
 else if(type==='monev')data=[['Tahun','Program','Proyek','Jenis','Indikator/Manfaat','Baseline','Target','Realisasi','Satuan','Arah','TW I','TW II','TW III','TW IV','Tenggat','Capaian (%)'],...rowsFor(p).flatMap(x=>['indicators','benefits'].flatMap(k=>x[k].map(o=>[year(),p.nama,x.name,k==='indicators'?'Indikator':'Manfaat',o.name,o.base,o.target,latest(o),o.unit,o.direction||'Naik',(o.quarters||{}).Q1,(o.quarters||{}).Q2,(o.quarters||{}).Q3,(o.quarters||{}).Q4,o.due,metricPct(o)??''])))];
 else data=[['Tahun','Program','Proyek','UIC','PIC','Status','Skor SMART','Terpilih','Go-live','Output','Acceptance Criteria'],...rowsFor(p).map(x=>[year(),p.nama,x.name,x.uic,x.pic,x.status,calc(x,p).score??'',included(x,p)?'Ya':'Tidak',x.goLive,x.outputs,x.accepted])];
 const csv='\ufeff'+data.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
 a.href=url;a.download='Project_Selection_'+type+'_'+year()+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function printReport(p){
 if(!p)return;const rows=rowsFor(p);
 const html='<h2>Laporan Project Selection · '+year()+'</h2><h3>'+esc2(p.nama)+'</h3><p>Prioritisasi: '+(p.psPrioritize?'SMART > '+p.psThreshold+'%':'Pemilihan manual')+' · '+esc2(p.psStatus)+'</p><table><thead><tr><th>No</th><th>Proyek</th><th>UIC</th><th>Skor</th><th>Dipilih</th></tr></thead><tbody>'+
 rows.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc2(x.name)+'</td><td>'+esc2(x.uic)+'</td><td>'+labelScore(calc(x,p))+'</td><td>'+(included(x,p)?'Ya':'Tidak')+'</td></tr>').join('')+'</tbody></table>';
 const w=window.open('','_blank');if(!w){toast('Izinkan pop-up untuk mencetak laporan.');return}
 w.document.write('<!doctype html><html lang="id"><meta charset="utf-8"><title>Laporan Project Selection</title><style>body{font:12px Arial;color:#17345e;margin:30px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}th{background:#e9eff6}</style><body>'+html+'</body></html>');w.document.close();w.focus();w.print();
}
function open(mode){
 const p=pickedProgram(),body='<p><b>Alur Project Selection</b>: tetapkan tahun, isi program dan daftar calon proyek, gunakan prioritisasi SMART bila diperlukan, kemudian tetapkan proyek dan generate RKMK Word. Setelah itu lanjutkan WBS di Project Management.</p>'+
 '<p><b>Ambang</b>: jika menggunakan SMART, skor harus lengkap dan lebih besar dari ambang yang dipilih (bawaan 80). Jika tidak menggunakan SMART, centang proyek secara manual.</p>'+
 '<p><b>Rujukan</b>: kriteria SMART dari menu Priority Dashboard CM; struktur dokumen rancangan RKMK mengacu pada Lampiran II KMK Nomor 132 Tahun 2025 (Charter, Acceptance Criteria, Rencana Kerja).</p>';
 const box=document.createElement('div');box.className='pswf-overlay';box.innerHTML='<section class="pswf-modal" role="dialog" aria-modal="true"><header><h2>'+(mode==='help'?'Bantuan Project Selection':'Cheatsheet Project Selection')+'</h2><button data-close>✕</button></header><main>'+body+'</main><footer><button class="btn pri" data-close>Tutup</button></footer></section>';
 document.body.appendChild(box);box.addEventListener('click',e=>{if(e.target===box||e.target.closest('[data-close]'))box.remove()});
}



/* DOCX OOXML generator: editable Word, not an HTML file renamed .docx.
   Draft format references KMK 132/2025 Lampiran II: Charter, acceptance criteria, work plan.
   The generated document is a proposal; it is NOT a ministerial decision. */
function wx(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function wp(txt,kind){
 const isTitle=kind==='title',isHead=kind==='head';
 const fs=isTitle?32:isHead?25:21,after=isTitle?250:isHead?180:90;
 return '<w:p><w:pPr><w:spacing w:before="0" w:after="'+after+'"/>'+(isHead?'<w:keepNext/>':'')+'</w:pPr><w:r><w:rPr>'+(isTitle||isHead?'<w:b/>':'')+'<w:sz w:val="'+fs+'"/><w:color w:val="'+(isTitle||isHead?'17365B':'233B57')+'"/></w:rPr><w:t xml:space="preserve">'+wx(txt)+'</w:t></w:r></w:p>';
}
function wt(rows){
 const out=rows.map((r,i)=>'<w:tr>'+r.map(v=>'<w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/><w:shd w:fill="'+(i===0?'DDE8F4':'FFFFFF')+'"/></w:tcPr><w:p><w:pPr><w:spacing w:after="30"/></w:pPr><w:r><w:rPr>'+(i===0?'<w:b/>':'')+'<w:sz w:val="19"/></w:rPr><w:t xml:space="preserve">'+wx(v)+'</w:t></w:r></w:p></w:tc>').join('')+'</w:tr>').join('');
 return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>'+
 ['top','left','bottom','right','insideH','insideV'].map(k=>'<w:'+k+' w:val="single" w:sz="4" w:color="CCD7E5"/>').join('')+'</w:tblBorders><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr>'+out+'</w:tbl>'+wp('');
}
function rkmkContent(p,blank){
 const selected=p&&!blank?chosen(p):[];
 const filler='[Diisi sesuai hasil penetapan/keputusan]';
 const y=p&&p.psYear||year();
 const prop=k=>p&&!blank&&clean(p[k])?p[k]:filler;
 const out=[];
 out.push(wp('RANCANGAN RKMK PROGRAM / INISIATIF STRATEGIS','title'));
 out.push(wp('KEMENTERIAN KEUANGAN · TAHUN '+y,'head'));
 out.push(wp('Template kerja untuk reviu PMO. Bukan dokumen keputusan atau pengesahan resmi.'));
 out.push(wp('A. IDENTITAS PROGRAM','head'));
 out.push(wt([
  ['Uraian','Informasi'],
  ['Nama Program/Inisiatif Strategis',p&&!blank?p.nama:filler],
  ['Kode Program',p&&!blank?p.kode:filler],
  ['Tahun/Periode',''+y],
  ['Jenis/Tema',p&&!blank?([p.jenis,p.psThemes].filter(Boolean).join(' · ')):filler],
  ['UIC Utama',prop('uic')],
  ['UIC Pendukung',prop('pend')],
  ['Sponsor/Penanggung Jawab',prop('sponsor')],
  ['Status Penyusunan',blank?'TEMPLATE BELUM DIISI':'DRAF berdasarkan proyek yang ditetapkan']
 ]));
 out.push(wp('B. CHARTER INISIATIF','head'));
 out.push(wt([
  ['Komponen Charter','Uraian'],
  ['Tujuan Inisiatif',prop('psObjective')],
  ['Latar Belakang',prop('psBackground')],
  ['Terobosan / Strategi',prop('psStrategy')],
  ['Output','Lihat daftar proyek/deliverable pada Bagian C.'],
  ['Outcome',prop('psOutcome')],
  ['Periode',''+y],
  ['Risiko',prop('psRisks')],
  ['Unit Pengelola',prop('uic')+'; pendukung: '+prop('pend')],
  ['Key Milestones','Diuraikan berdasarkan proyek terpilih; detail WBS disusun setelah penetapan.']
 ]));
 out.push(wp('C. DAFTAR PROYEK / MODUL YANG DITETAPKAN','head'));
 out.push(wp('Metode pemilihan: '+(p&&!blank?(p.psPrioritize?'SMART 12 kriteria; skor absolut > '+p.psThreshold+'%':'Pemilihan manual, tanpa SMART'):'[Diisi: SMART atau seleksi manual]')));
 out.push(wt([['No','Proyek/Modul','UIC','Output / Deliverable','Skor SMART'],...(selected.length?selected.map((x,i)=>[''+(i+1),x.name,x.uic||p.uic,x.outputs||filler,p.psPrioritize?labelScore(calc(x,p)):'Tidak digunakan']):[['1',filler,filler,filler,filler]])]));
 out.push(wp('D. KRITERIA PENYELESAIAN (ACCEPTANCE CRITERIA)','head'));
 out.push(wt([['No','Milestone/Proyek','Kriteria Penyelesaian','Bukti Penyelesaian'],...(selected.length?selected.map((x,i)=>[''+(i+1),x.name,x.accepted||filler,'[Dokumen/hasil uji/BA/persetujuan]']):[['1',filler,filler,filler]])]));
 out.push(wp('E. RENCANA KERJA INISIATIF','head'));
 out.push(wt([['No','Tindakan / Proyek','Mulai','Target/Go-live','Penanggung Jawab'],...(selected.length?selected.map((x,i)=>[''+(i+1),x.name,x.start||filler,x.goLive||filler,x.pic||x.uic||filler]):[['1',filler,filler,filler,filler]])]));
 out.push(wp('Catatan: tabel merupakan jadwal tingkat tinggi. WBS, milestone detail, bobot, dan realisasi ditetapkan pada menu Project Management setelah persetujuan rancangan.'));
 out.push(wp('F. REVIU DAN PENETAPAN','head'));
 out.push(wt([['Tahap','Pejabat/Unit','Tanggal & Catatan'],['Penyusunan',prop('uic'),filler],['Reviu PMO Kementerian','PMO Kementerian',filler],['Persetujuan/Penetapan','[Pejabat berwenang]',filler]]));
 out.push(wp('Referensi struktur: Lampiran II KMK Nomor 132 Tahun 2025 tentang Implementasi Inisiatif Strategis Kementerian Keuangan Tahun 2025.'));
 out.push(wp('Penyesuaian nomenklatur, kewenangan, dan format formal RKMK tahun '+y+' tetap memerlukan validasi terhadap ketentuan yang berlaku.'));
 return out.join('');
}
async function word(p,blank){
 if(!blank&&(!p||p.psStatus!=='Ditetapkan')){toast('Tetapkan proyek terlebih dahulu untuk generate RKMK.');return}
 try{
  if(!window.JSZip){
   if(typeof chLib==='function')await chLib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   else throw new Error('Pustaka Word belum tersedia.');
  }
  const z=new JSZip();
  const body=rkmkContent(p,blank);
  const wordXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
  '<w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>';
  z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?>'+
   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
   '<Default Extension="xml" ContentType="application/xml"/>'+
   '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?>'+
   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/document.xml',wordXml);
  const blob=await z.generateAsync({type:'blob',compression:'DEFLATE'});
  const a=document.createElement('a'),url=URL.createObjectURL(blob),code=p&&p.kode?p.kode:'KOSONG';
  a.href=url;a.download=(blank?'Template_':'Rancangan_')+'RKMK_IS_'+year()+'_'+code.replace(/[^A-Za-z0-9_-]/g,'_')+'.docx';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  toast((blank?'Template':'Rancangan')+' RKMK Word berhasil dibuat.');
 }catch(e){toast('Gagal membuat dokumen Word: '+(e.message||e))}
}

/* Export global API after all model/view/actions are initialized. */
window.MT_PROJECT_SELECTION={page,mount,open,version:'20261108-upstream-program-first-RKMK-v1',criteria:PS_CRITERIA.map(c=>({code:c.code,name:c.name,w:c.w}))};
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&ME)render();

})();
