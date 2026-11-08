/* Project Selection — program/portfolio governance before Project Management.
   Adaptasi praktik PMI untuk Program Transformasi Kemenkeu; tidak mengubah register proyek/WBS. */
(function(){
'use strict';
const E=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const tidy=v=>String(v==null?'':v).trim();
const editable=p=>!!ME&&['SA','PMOK','PMOU'].includes(ME.role)&&(!p||ME.role!=='PMOU'||!p.uic||p.uic===ME.unit)&&(!p||p.psStatus!=='Ditetapkan');
const step=()=>{S.ui.psGov=S.ui.psGov||{step:'identity'};return S.ui.psGov};
const STEPS=[['identity','1 · Identitas'],['case','2 · Business Case'],['benefits','3 · Manfaat'],['stakeholders','4 · Stakeholder'],['risks','5 · Risiko'],['governance','6 · Tata Kelola'],['review','7 · Reviu']];
const regs={benefits:{key:'psBenefits',title:'Benefits Register',one:'Manfaat',fields:[
 ['name','Nama manfaat','text',true],['indicator','Indikator keberhasilan / KPI','text',true],['baseline','Baseline','text',true],['target','Target','text',true],['unit','Satuan','text',false],['owner','Benefit owner / UIC penerima','text',true],['due','Target realisasi','date',false]]},
 stakeholders:{key:'psStakeholders',title:'Stakeholder Register · Tingkat Program',one:'Stakeholder',fields:[
 ['name','Stakeholder / kelompok','text',true],['unit','Unit / institusi','text',false],['role','Kepentingan / peran','text',true],['power','Pengaruh (Rendah/Sedang/Tinggi)','select:Pengaruh Rendah|Pengaruh Sedang|Pengaruh Tinggi',false],['interest','Kepentingan (Rendah/Sedang/Tinggi)','select:Kepentingan Rendah|Kepentingan Sedang|Kepentingan Tinggi',false],['strategy','Strategi pelibatan','text',true],['owner','PIC koordinasi','text',false]]},
 risks:{key:'psRiskRegister',title:'Risk Register · Tingkat Program',one:'Risiko',fields:[
 ['title','Pernyataan risiko lintas proyek','text',true],['probability','Probabilitas (1–5)','select:1|2|3|4|5',false],['impact','Dampak (1–5)','select:1|2|3|4|5',false],['response','Mitigasi / respons','text',true],['owner','Risk owner','text',true],['due','Tenggat mitigasi','date',false]]}};
function items(p,k){if(!Array.isArray(p[k]))p[k]=[];return p[k]}
function checks(p){
 if(!p)return [];
 return [
 ['identity','Identitas & sponsor',!!(tidy(p.nama)&&tidy(p.kode)&&tidy(p.uic)&&tidy(p.sponsor)),true],
 ['case','Keselarasan strategis & business case',!!(tidy(p.psObjective)&&tidy(p.psAlignment)&&tidy(p.psBusinessCase)),true],
 ['benefits','Manfaat terukur dan benefit owner',items(p,'psBenefits').some(v=>tidy(v.name)&&tidy(v.indicator)&&tidy(v.target)&&tidy(v.owner)),true],
 ['stakeholders','Stakeholder & strategi engagement',items(p,'psStakeholders').some(v=>tidy(v.name)&&tidy(v.role)&&tidy(v.strategy)),true],
 ['risks','Risiko lintas proyek & rencana mitigasi',items(p,'psRiskRegister').some(v=>tidy(v.title)&&tidy(v.response)&&tidy(v.owner)),true],
 ['governance','Tata kelola & otoritas keputusan',!!(tidy(p.psManager)&&tidy(p.psDecisionAuthority)),false],
 ['governance','Roadmap & kebutuhan sumber daya',!!(tidy(p.psRoadmap)&&tidy(p.psResourcePlan)),false]
 ];
}
function readiness(p){const a=checks(p),req=a.filter(x=>x[3]);return {items:a,done:a.filter(x=>x[2]).length,total:a.length,missing:req.filter(x=>!x[2]).map(x=>x[1]),ok:req.every(x=>x[2]),applies:p&&p.psGovernanceV===1};}
function portfolioPage(p,programs,year){
 const arr=programs||[];let h='<section class="psgov" aria-label="Portofolio Program Transformasi"><div class="psgov-sectionhead"><div><h3>Portofolio Transformasi · '+year+'</h3><p>Inventaris, evaluasi, dan penetapan program. Pilih program untuk melengkapi business case dan register tingkat program.</p></div></div>';
 h+='<div class="psgov-metrics"><div><b>'+arr.length+'</b><span>Total program</span></div><div><b>'+arr.filter(x=>x.psStatus==='Ditetapkan'||x.psStatus==='Berjalan (legacy)').length+'</b><span>Ditetapkan / berjalan</span></div><div><b>'+arr.filter(x=>x.psStatus==='Draft').length+'</b><span>Draft</span></div><div><b>'+arr.reduce((n,x)=>n+(x.psProjects||[]).length,0)+'</b><span>Calon proyek</span></div></div>';
 if(!arr.length)return h+'<div class="psgov-empty"><b>Belum ada program tahun '+year+'</b><p>Daftarkan program lebih dulu. Lengkapi profil, manfaat, stakeholder, risiko, kemudian ajukan proyek untuk seleksi.</p></div></section>';
 h+='<div class="psgov-tablewrap"><table class="psgov-table"><thead><tr><th>Program & kode</th><th>UIC utama</th><th>Status</th><th>Kesiapan dokumen</th><th>Proyek</th><th>Aksi</th></tr></thead><tbody>';
 arr.forEach(x=>{const r=readiness(x);h+='<tr><td><b>'+E(x.nama)+'</b><small>'+E(x.kode||x.akr)+' · '+E(x.jenis||'Program')+'</small></td><td>'+E(x.uic||'—')+'</td><td><span class="psgov-state">'+E(x.psStatus||'Draft')+'</span></td><td><b>'+r.done+'/'+r.total+'</b><small>'+(r.ok?'Persyaratan usulan terpenuhi':'Perlu dilengkapi')+'</small></td><td>'+(x.psProjects||[]).length+'</td><td><button type="button" class="btn btn-outline btn-sm" data-gov-pick="'+E(x.id)+'">Buka Program</button></td></tr>'});
 return h+'</tbody></table></div><div class="psgov-info">Portofolio menghimpun program berdasarkan sasaran strategis; program mengoordinasikan proyek terkait untuk menghasilkan manfaat bersama. Capaian WBS dikelola pada Project Management.</div></section>';
}
function sectionHeader(title,desc,action){
 return '<div class="psgov-sectionhead"><div><h3>'+title+'</h3><p>'+desc+'</p></div>'+(action||'')+'</div>';
}
function coreCard(rows){return '<dl class="psgov-data">'+rows.map(r=>'<div><dt>'+E(r[0])+'</dt><dd>'+E(r[1]||'—')+'</dd></div>').join('')+'</dl>';}
function editFields(p,kind){
 const fields=kind==='case'?[
 ['psAlignment','Keselarasan Renstra, IKU, kebijakan/RAPBN','textarea',true],
 ['psBusinessCase','Business case: masalah, opsi, alasan program dibutuhkan','textarea',true],
 ['psAlternatives','Alternatif solusi dan alasan memilih pendekatan','textarea',false],
 ['psFinancialEstimate','Estimasi biaya dan sumber pendanaan','text',false],
 ['psSuccessCriteria','Kriteria keberhasilan program','textarea',false]]:
 [
 ['psManager','Manajer/koordinator program','text',false],
 ['psDecisionAuthority','Forum / pejabat pengambil keputusan','text',false],
 ['psGovernanceCadence','Mekanisme reviu dan periode pelaporan','text',false],
 ['psRoadmap','Roadmap dan milestone tingkat tinggi','textarea',false],
 ['psResourcePlan','Estimasi kebutuhan SDM dan kapasitas lintas UE I','textarea',false],
 ['psDependencies','Dependensi antarkomponen / antarunit','textarea',false],
 ['psAssumptions','Asumsi utama','textarea',false],
 ['psConstraints','Batasan program','textarea',false]
 ];
 return fields.map(f=>'<label class="psgov-field '+(f[2]==='textarea'?'wide':'')+'"><span>'+E(f[1])+(f[3]?' *':'')+'</span>'+(f[2]==='textarea'?'<textarea rows="3" data-gov-field="'+f[0]+'">'+E(p[f[0]]||'')+'</textarea>':'<input type="text" data-gov-field="'+f[0]+'" value="'+E(p[f[0]]||'')+'">')+'</label>').join('');
}
function registerPage(p,type){
 const d=regs[type],arr=items(p,d.key),can=editable(p);
 let h=sectionHeader(d.title,'Catat informasi tingkat program dan interdependensi lintas proyek, bukan duplikasi register di Workspace Proyek.',can?'<button type="button" class="btn pri" data-gov-add="'+type+'">+ Tambah '+d.one+'</button>':'');
 if(!arr.length)h+='<div class="psgov-empty"><b>Belum ada '+d.one.toLowerCase()+' tercatat.</b><p>Tambahkan minimal satu entri yang relevan untuk melengkapi usulan program.</p></div>';
 else {
 const cols=type==='benefits'?['Manfaat / KPI','Baseline → Target','Benefit owner','Realisasi']:type==='risks'?['Risiko','Skor','Respons','Risk owner']:['Stakeholder','Peran','Pengaruh / Kepentingan','Strategi'];
 h+='<div class="psgov-tablewrap"><table class="psgov-table"><thead><tr>'+cols.map(x=>'<th>'+x+'</th>').join('')+'<th>Aksi</th></tr></thead><tbody>';
 arr.forEach((v,i)=>{
  const values=type==='benefits'?[E(v.name)+'<small>'+E(v.indicator||'')+'</small>',E(v.baseline||'—')+' → '+E(v.target||'—')+' '+E(v.unit||''),E(v.owner||'—'),E(v.due||'—')]:
  type==='risks'?[E(v.title||'—'),String((+v.probability||0)*(+v.impact||0))+' / 25',E(v.response||'—'),E(v.owner||'—')]:
  [E(v.name||'—')+'<small>'+E(v.unit||'')+'</small>',E(v.role||'—'),E(v.power||'—')+' / '+E(v.interest||'—'),E(v.strategy||'—')];
  h+='<tr>'+values.map(c=>'<td>'+c+'</td>').join('')+'<td>'+(can?'<div class="psgov-act"><button class="btn btn-outline btn-sm" data-gov-edit="'+type+':'+i+'">Ubah</button><button class="btn btn-outline btn-sm" data-gov-delete="'+type+':'+i+'">Hapus</button></div>':'—')+'</td></tr>';
 });
 h+='</tbody></table></div>';
 }
 if(type==='risks'&&tidy(p.psRisks))h+='<p class="psgov-info">Catatan risiko lama: '+E(p.psRisks)+'</p>';
 return h;
}
function programPage(p){
 if(!p)return '<section class="psgov"><div class="psgov-empty"><b>Pilih program pada tab Portofolio.</b><p>Setelah program dibuat, tahap pengisian akan terbuka otomatis.</p></div></section>';
 const u=step(),key=STEPS.some(x=>x[0]===u.step)?u.step:'identity',r=readiness(p),ro=!editable(p);
 let h='<section class="psgov" aria-label="Pengelolaan program"><div class="psgov-summ"><div><strong>'+E(p.nama)+'</strong><span>'+E(p.kode||p.akr)+' · '+E(p.uic||'—')+' · '+E(p.psStatus||'Draft')+'</span></div><div class="psgov-progress"><b>'+r.done+'/'+r.total+'</b><span>komponen kesiapan</span></div></div>';
 h+='<nav class="psgov-steps" role="tablist" aria-label="Tahapan kelengkapan program">'+STEPS.map(x=>'<button type="button" role="tab" aria-selected="'+(key===x[0])+'" class="'+(key===x[0]?'on':'')+'" data-gov-step="'+x[0]+'">'+x[1]+'</button>').join('')+'</nav><div class="psgov-main">';
 if(key==='identity'){
 h+=sectionHeader('Identitas & Strategic Fit','Mulai dari tujuan, mandat, sponsor dan ruang lingkup. Setelah itu lengkapi business case.',ro?'':'<button class="btn btn-outline btn-sm" data-pswf="edit-program">✎ Ubah Identitas</button>');
 h+=coreCard([['Program',p.nama],['Kode',p.kode],['Jenis',p.jenis],['UIC utama',p.uic],['UIC pendukung',p.pend],['Sponsor',p.sponsor],['Tujuan strategis',p.psObjective],['Latar belakang',p.psBackground],['Outcome awal',p.psOutcome],['Pendekatan',p.psStrategy]]);
 }else if(key==='case'||key==='governance'){
 h+=sectionHeader(key==='case'?'Business Case & Nilai Strategis':'Tata Kelola, Roadmap & Kapasitas',key==='case'?'Jelaskan hubungan dengan Renstra/IKU, alternatif solusi, target nilai dan estimasi biaya.':'Tentukan siapa yang memutuskan, kebutuhan sumber daya, tahapan besar, asumsi dan ketergantungan.');
 h+='<div class="psgov-fields">'+editFields(p,key)+'</div>'+(ro?'<p class="psgov-info">Data hanya dapat dibaca pada status ini.</p>':'<div class="psgov-actions"><button type="button" class="btn pri" data-gov-save="'+key+'">Simpan & Lanjut</button></div>');
 }else if(regs[key])h+=registerPage(p,key);
 else if(key==='review'){
 h+=sectionHeader('Reviu Kesiapan Program','Enam komponen minimum digunakan sebagai gate usulan; tata kelola serta roadmap tetap direkomendasikan sebelum penetapan.');
 h+='<div class="psgov-review">'+r.items.map(c=>'<button type="button" class="psgov-check" data-gov-step="'+c[0]+'"><span class="'+(c[2]?'ok':'no')+'">'+(c[2]?'✓':'!')+'</span><span><b>'+E(c[1])+'</b><small>'+(c[3]?'Minimum pengusulan':'Penguatan tata kelola')+'</small></span><em>'+(c[2]?'Lengkap':'Lengkapi')+'</em></button>').join('')+'</div>';
 h+='<div class="psgov-info">'+(r.ok?'Dokumen minimum siap untuk dipertimbangkan. Lanjut tambahkan dan nilai calon proyek; penetapan tetap mengikuti otorisasi berwenang.':'Belum siap diajukan: '+E(r.missing.join('; '))+'.')+'</div>';
 }
 h+='</div><div class="psgov-footer"><span>Alur: identifikasi → kajian manfaat & risiko → seleksi proyek → penetapan → WBS.</span><div><button class="btn btn-outline btn-sm" data-gov-back="1" '+(key==='identity'?'disabled':'')+'>‹ Sebelumnya</button><button class="btn pri btn-sm" data-gov-next="1">'+(key==='review'?'Lanjut ke Calon Proyek ›':'Berikutnya ›')+'</button></div></div></section>';
 return h;
}
function overlay(title,body,saveFn){
 const d=document.createElement('div');d.className='psgov-overlay';d.innerHTML='<section class="psgov-modal" role="dialog" aria-modal="true" aria-label="'+E(title)+'"><header><h3>'+E(title)+'</h3><button type="button" data-gov-close>✕</button></header><main>'+body+'</main><footer><button class="btn" data-gov-close>Batal</button><button class="btn pri" data-gov-submit>Simpan</button></footer></section>';
 document.body.appendChild(d);d.addEventListener('click',ev=>{if(ev.target===d||ev.target.closest('[data-gov-close]'))d.remove();if(ev.target.closest('[data-gov-submit]'))saveFn(d,()=>d.remove())});d.addEventListener('keydown',ev=>{if(ev.key==='Escape')d.remove()});d.querySelector('input,select,textarea')?.focus();
}
function regModal(p,type,index){
 if(!editable(p)||!regs[type])return;
 const d=regs[type],old=index>=0?items(p,d.key)[index]:null;
 const body='<div class="psgov-fields">'+d.fields.map(f=>{
  const v=old?old[f[0]]||'':'';
  return '<label class="psgov-field"><span>'+E(f[1])+(f[3]?' *':'')+'</span>'+(f[2].startsWith('select:')?'<select data-gov-f="'+f[0]+'"><option value="">— Pilih —</option>'+f[2].slice(7).split('|').map(o=>'<option value="'+E(o)+'" '+(String(v)===o?'selected':'')+'>'+E(o)+'</option>').join('')+'</select>':'<input type="'+f[2]+'" data-gov-f="'+f[0]+'" value="'+E(v)+'">')+'</label>';
 }).join('')+'</div>';
 overlay((old?'Ubah ':'Tambah ')+d.one,body,(box,close)=>{
  const obj={id:old?.id||('reg-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7))};
  d.fields.forEach(f=>obj[f[0]]=tidy(box.querySelector('[data-gov-f="'+f[0]+'"]')?.value));
  if(d.fields.some(f=>f[3]&&!obj[f[0]])){toast('Lengkapi semua kolom bertanda * terlebih dahulu.');return}
  if(old)Object.assign(old,obj);else items(p,d.key).push(obj);
  save();close();render();toast(d.one+' program tersimpan.');
 });
}
function mount(pick,rerender){
 const root=document.querySelector('#view .pswf');if(!root)return;
 root.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-gov-pick],[data-gov-step],[data-gov-next],[data-gov-back],[data-gov-add],[data-gov-edit],[data-gov-delete],[data-gov-save]');if(!b)return;
  const p=pick();
  if(b.dataset.govPick){const x=(S.programs||[]).find(z=>z.id===b.dataset.govPick);if(x){S.ui.psFlow.prog=x.id;S.ui.psFlow.tab='program';step().step='identity';save();rerender()}return}
  if(b.dataset.govStep){step().step=b.dataset.govStep;save();rerender();return}
  if(b.dataset.govNext||b.dataset.govBack){const i=STEPS.findIndex(z=>z[0]===step().step),n=i+(b.dataset.govNext?1:-1);if(n>=STEPS.length){S.ui.psFlow.tab='projects';}else step().step=STEPS[Math.max(0,n)][0];save();rerender();return}
  if(!p||!editable(p))return;
  if(b.dataset.govAdd){regModal(p,b.dataset.govAdd,-1);return}
  if(b.dataset.govEdit){const a=b.dataset.govEdit.split(':');regModal(p,a[0],+a[1]);return}
  if(b.dataset.govDelete){const a=b.dataset.govDelete.split(':'),d=regs[a[0]];if(d)window.MT_PS_CONFIRM?.('Hapus Entri Register?','Entri '+d.one+' akan dikeluarkan dari program ini.',()=>{items(p,d.key).splice(+a[1],1);save();rerender()},'danger');return}
  if(b.dataset.govSave){
   const type=b.dataset.govSave,keys=type==='case'?['psAlignment','psBusinessCase','psAlternatives','psFinancialEstimate','psSuccessCriteria']:['psManager','psDecisionAuthority','psGovernanceCadence','psRoadmap','psResourcePlan','psDependencies','psAssumptions','psConstraints'];
   keys.forEach(k=>p[k]=tidy(root.querySelector('[data-gov-field="'+k+'"]')?.value));p.psUpdatedAt=new Date().toISOString();save();
   step().step=type==='case'?'benefits':'review';rerender();toast('Informasi program disimpan.');return;
  }
 });
}
window.MT_PS_GOV={portfolioPage,programPage,readiness,mount,version:'20261108-pmi-program-setup-v1'};
})();