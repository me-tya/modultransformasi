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
 if(u.view==='quad'&&p.psPrioritize)h+=quadrant(p,filtered);
 else {
 h+='<section class="prio-list"><div class="prio-list-head"><h3>Peringkat prioritas</h3><span>Batang C1–C12: utility tiap kriteria · '+filtered.length+' proyek</span></div>';
 if(!filtered.length)h+='<div class="prio-empty">Belum ada proyek sesuai filter. Tambahkan calon proyek untuk memulai.</div>';
 filtered.forEach((z,i)=>{
  const x=z.x,r=z.r,on=(u.open||[]).includes(x.id),label=levelName(r),sel=included(x,p);
  h+='<article class="prio-row cat-'+level(r)+(on?' open':'')+'"><div class="prio-rank"><b>'+(i+1)+'</b><small>'+(!p.psPrioritize?'CALON':r.score==null?'—':'P'+(r.score>=70?1:r.score>=40?2:3))+'</small></div>'+
  '<div class="prio-main"><div class="prio-title"><h4>'+esc2(x.name)+'</h4></div><div class="prio-meta"><span class="prio-status">'+esc2(x.status||'Usulan')+'</span><span class="prio-ue">'+esc2(x.uic||p.uic||'—')+'</span><span class="prio-prog">'+esc2(p.nama)+'</span><span>Go-live: <b>'+esc2(x.goLive||'—')+'</b></span><span>PIC: '+esc2(x.pic||'—')+'</span><span>Pengguna: '+esc2(x.users||'—')+'</span>'+
  (sel?'<span class="pswf-picked">✓ Dipilih</span>':'<span class="pswf-rejected">Belum dipilih</span>')+'</div><div class="prio-utils">'+r.details.map(d=>'<span class="prio-u" title="'+esc2(d.c.code+' '+d.c.name)+'"><span class="prio-ub"><i style="height:'+Math.max(3,Math.round(d.u*100))+'%"></i></span><em>'+d.c.code+'</em></span>').join('')+'</div></div>'+
  '<div class="prio-score"><b>'+(p.psPrioritize?labelScore(r):'—')+'</b><div class="prio-bar"><i style="width:'+(r.score||0)+'%"></i></div><span class="prio-cat">'+(p.psPrioritize?'Prioritas '+label:'Seleksi manual')+'</span></div>'+
  '<div class="prio-actions"><button type="button" class="btn btn-outline btn-sm" data-pswf-detail="'+esc2(x.id)+'">'+(on?'Tutup':'Rincian')+'</button>'+
  (ownerOk(p)&&p.psStatus!=='Ditetapkan'?'<button type="button" class="btn btn-ghost btn-sm" title="Edit proyek" data-pswf-project="'+esc2(x.id)+'">✎</button><button type="button" class="btn btn-ghost btn-sm" title="Hapus calon proyek" data-pswf-remove="'+esc2(x.id)+'">✕</button>':'')+
  (!p.psPrioritize&&ownerOk(p)&&p.psStatus!=='Ditetapkan'?'<label class="pswf-select"><input type="checkbox" data-pswf-include="'+esc2(x.id)+'" '+(sel?'checked':'')+'> Pilih</label>':'')+'</div>'+
  (on?detail(p,x,r):'')+'</article>';
 });
 h+='</section>';
 }
 h+=decisionPanel(p);return h;
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
 h+='<div class="prio-card"><div class="prio-card-head"><h3>Ambang lolos ke pemilihan proyek</h3></div><p class="prio-sub">Ambang pada program <b>'+esc2(p.nama)+'</b>: skor absolut harus <b>&gt; '+p.psThreshold+'%</b>, berlaku hanya jika prioritisasi SMART diaktifkan.</p>'+
 '<div class="pswf-thresholds"><span>'+rowsFor(p).length+' calon proyek</span><span>'+chosen(p).length+' dipilih</span><span>Bobot aktif '+tot+'</span></div></div>';
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
function monevPage(p){
 const u=state(),arr=rowsFor(p),active=arr.find(x=>x.id===u.monevPid)||arr[0];if(active)u.monevPid=active.id;
 let h='<div class="mv-top"><div class="prio-seg"><button type="button" class="'+(u.monevView==='proj'?'on':'')+'" data-pswf-mv="proj">Per proyek</button><button type="button" class="'+(u.monevView==='port'?'on':'')+'" data-pswf-mv="port">Portofolio</button></div><span class="pswf-sp"></span><button type="button" class="btn pri" data-pswf="monev-report">▤ Laporan Monev</button></div>';
 if(!arr.length)return h+'<div class="pswf-empty">Belum ada proyek. Daftarkan proyek pada tab Proyek terlebih dahulu.</div>';
 if(u.monevView==='port'){
  const inds=arr.reduce((n,x)=>n+x.indicators.length,0),ben=arr.reduce((n,x)=>n+x.benefits.length,0);
  h+='<div class="mv-kpis"><div class="mv-k"><b>'+arr.length+'</b><small>Proyek</small></div><div class="mv-k"><b>'+inds+'</b><small>Indikator CM</small></div><div class="mv-k"><b>'+ben+'</b><small>Manfaat</small></div><div class="mv-k ok"><b>'+chosen(p).length+'</b><small>Proyek dipilih</small></div></div>';
  h+='<div class="prio-card"><h3>Register Indikator & Manfaat Portofolio</h3><div class="prio-likert-wrap"><table class="prio-kb-table"><thead><tr><th>Proyek</th><th>Jenis</th><th>Indikator / Manfaat</th><th>Baseline</th><th>Target</th><th>Realisasi</th><th>UIC</th></tr></thead><tbody>'+
  arr.map(x=>x.indicators.map(o=>'<tr><td>'+esc2(x.name)+'</td><td>Indikator</td><td>'+esc2(o.name)+'</td><td>'+esc2(o.base)+'</td><td>'+esc2(o.target)+'</td><td>'+esc2(o.actual||'—')+'</td><td>'+esc2(x.uic)+'</td></tr>').join('')+x.benefits.map(o=>'<tr><td>'+esc2(x.name)+'</td><td>Manfaat</td><td>'+esc2(o.name)+'</td><td>'+esc2(o.base)+'</td><td>'+esc2(o.target)+'</td><td>'+esc2(o.actual||'—')+'</td><td>'+esc2(x.uic)+'</td></tr>').join('')).join('')+'</tbody></table></div></div>';
  return h;
 }
 h+='<div class="mv-bar"><label>Proyek <select id="pswf-mv-project">'+arr.map(x=>'<option value="'+esc2(x.id)+'"'+(x.id===u.monevPid?' selected':'')+'>'+esc2(x.name)+'</option>').join('')+'</select></label><span class="pswf-sp"></span><span>Go-live: '+esc2(active.goLive||'Belum ditentukan')+'</span></div>';
 const indicators=active.indicators, benefits=active.benefits;
 h+='<div class="mv-kpis"><div class="mv-k"><b>'+indicators.length+'</b><small>Indikator CM</small></div><div class="mv-k"><b>'+benefits.length+'</b><small>Manfaat diregister</small></div><div class="mv-k"><b>'+indicators.filter(x=>x.actual!==''&&x.actual!=null).length+'</b><small>Indikator terealisasi</small></div><div class="mv-k"><b>'+benefits.filter(x=>x.actual!==''&&x.actual!=null).length+'</b><small>Manfaat terealisasi</small></div></div>';
 for(const type of ['indicators','benefits']){
  const list=active[type],title=type==='indicators'?'Indikator Keberhasilan CM':'Register Manfaat';
  h+='<div class="prio-card"><div class="prio-card-head"><h3>'+title+'</h3>'+(ownerOk(p)?'<button class="btn btn-outline btn-sm" type="button" data-pswf-mvadd="'+type+'">+ Tambah</button>':'')+'</div>';
  if(!list.length)h+='<p class="prio-sub">Belum ada data. Penilaian manfaat dilakukan setelah target dan baseline ditetapkan.</p>';
  else h+='<div class="prio-likert-wrap"><table class="prio-kb-table"><thead><tr><th>Indikator</th><th>Baseline</th><th>Target</th><th>Realisasi</th><th>Satuan</th><th>Tenggat</th><th>Aksi</th></tr></thead><tbody>'+
   list.map((o,i)=>'<tr><td>'+esc2(o.name)+'</td><td>'+esc2(o.base||'—')+'</td><td>'+esc2(o.target||'—')+'</td><td>'+esc2(o.actual||'—')+'</td><td>'+esc2(o.unit||'—')+'</td><td>'+esc2(o.due||'—')+'</td><td>'+(ownerOk(p)?'<button type="button" class="btn btn-outline btn-sm" data-pswf-mvedit="'+type+':'+i+'">Ubah</button>':'')+'</td></tr>').join('')+'</tbody></table></div>';
  h+='</div>';
 }
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

})();
