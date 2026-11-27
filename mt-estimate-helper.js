/* Bantu isi estimasi proyek — v20261127-est1
   - Biaya: hanya BELANJA BARANG (pro hire/tenaga ahli, vendor, lisensi, infrastruktur, lainnya). Gaji PNS = belanja pegawai, tidak dihitung.
   - SDM (orang-bulan): tenaga PNS inhouse + pro hire tim tetap = orang × bulan × porsi waktu.
   Melekat otomatis pada isian estimasi di form Usulan Non-ISTK (#kn-*) dan form Usulan Proyek ISTK ([data-scope-field]). */
(function(){
'use strict';
const COST='#kn-cost,[data-scope-field="estimatedCostMillions"]',SDM='#kn-estimatedStaffMonths,[data-scope-field="estimatedStaffMonths"]',DUR='#kn-durationMonths,[data-scope-field="durationMonths"]';
const ITEMS=[['prohire','Pro hire / tenaga ahli kontrak'],['vendor','Jasa pengembangan (vendor)'],['lisensi','Lisensi & langganan'],['infra','Infrastruktur / cloud'],['lain','Lainnya (pelatihan, dsb.)']];
// Template lintas modul: peran opsional, tanpa asumsi jumlah/durasi/alokasi.
const SDM_ROLES=['Pemilik Proses Bisnis / Product Owner','Project Manager / PMO','Business Analyst','UI/UX Designer','Technical Lead / Arsitek','Developer','Data / Integrasi','Tester / QA','Vulnerability Testing (VT)','Infrastruktur / Deployment','Operasional / Support','Change Management / CMO'];
const sdmEffort=(people,months,pct)=>people*months*pct/100;
const nf=v=>Number(v).toLocaleString('id-ID',{maximumFractionDigits:2});
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return isFinite(n)&&n>=0?n:0};
function setVal(inp,v){inp.value=String(Math.round(v*100)/100);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}
function costBox(){return '<details class="esth"><summary>🧮 Hitung dari rincian belanja barang</summary><div class="esth-b">'+
 '<p class="esth-n">Isi hanya <b>belanja barang</b>. Gaji/tunjangan PNS tidak dihitung karena termasuk <b>belanja pegawai</b> — tenaga PNS dicatat di <b>Kebutuhan SDM</b>.</p>'+
 ITEMS.map(i=>'<label class="esth-r"><span>'+i[1]+'</span><span class="esth-in"><em>Rp</em><input type="number" min="0" step="any" data-esth-c="'+i[0]+'" placeholder="0"><em>jt</em></span></label>').join('')+
 '<div class="esth-t"><span>Total belanja barang</span><b data-esth-ctot>Rp 0 jt</b><button type="button" data-esth-cuse>Pakai total</button></div></div></details>'}
function sdmRow(){return '<div class="esth-sr"><input type="text" data-esth-role placeholder="Peran, mis. Developer PNS"><input type="number" min="0" step="any" data-esth-n placeholder="orang" aria-label="Jumlah orang"><span>×</span><input type="number" min="0" step="any" data-esth-m placeholder="bulan" aria-label="Lama (bulan)"><span>×</span><input type="number" min="0" max="100" step="any" data-esth-p placeholder="%" aria-label="Porsi waktu (%)"><em>%</em><button type="button" data-esth-del aria-label="Hapus baris">✕</button></div>'}
function sdmBox(){return '<details class="esth"><summary>🧮 Hitung orang-bulan</summary><div class="esth-b">'+
 '<p class="esth-n">Hitung <b>PNS inhouse</b> dan <b>pro hire tim tetap</b>. Peran opsional; isi hanya yang terlibat. Alokasi sesuai porsi waktu nyata, bukan otomatis 100%. Pro hire khusus proyek dicatat di biaya.</p>'+
 '<button type="button" data-esth-template>Template umum</button><div class="esth-sh"><span>Peran</span><span>Orang</span><span></span><span>Bulan</span><span></span><span>Porsi</span></div><div data-esth-rows>'+sdmRow()+'</div><button type="button" class="esth-add" data-esth-add>+ Tambah peran</button>'+
 '<div class="esth-t"><span>Total</span><b data-esth-stot>0 org-bln</b><button type="button" data-esth-suse>Pakai hasil</button></div><p class="esth-x">Contoh: 3 developer × 6 bulan × 50% = 9 org-bln.</p></div></details>'}
function scope(el){return el.closest('dialog,[role="dialog"],.ov,.modal,form,section')||document}

function attachNon(inp){
 const istk=inp.matches('[data-scope-field]')&&!!inp.closest('.psbank-project-editor');
 const form=istk?inp.closest('.psbank-proj-editor-grid'):inp.closest('.ke-form.ke-three');
 if(!form||(!istk&&(!inp.closest('.ke-ov')||!inp.id.startsWith('kn-'))))return false;
 const cost=form.querySelector(COST),sdm=form.querySelector(SDM),dur=form.querySelector(DUR);
 if(!cost||!sdm||!dur||cost.disabled||sdm.disabled||cost.readOnly||sdm.readOnly)return false;
 if(form.dataset.esth2)return true;
 const originalCard=istk?form:form.closest('.kd2-card'),gateCard=istk?null:originalCard?.nextElementSibling;
 if(!originalCard||(!istk&&(!gateCard||!gateCard.querySelector('select'))))return false;
 const fieldBox=el=>el.closest(istk?'.psbank-scope-field':'.fld')||el;
 form.dataset.esth2='1';cost.dataset.esth=sdm.dataset.esth='1';
 const p=document.createElement('div');p.className='est2';p.hidden=true;
 p.innerHTML='<div class="est2-top"><div class="est2-title"><b data-e2-title></b><span data-e2-info></span></div><div class="est2-switch"><button type="button" data-e2-mode="cost">Biaya</button><button type="button" data-e2-mode="sdm">SDM</button></div><button type="button" class="est2-icon" data-e2-close aria-label="Tutup kalkulator" title="Tutup">✕</button></div>'+
 '<section data-e2-panel="cost" hidden><p class="est2-guide"><b>Rumus:</b> volume × tarif satuan. Isi belanja barang proyek; gaji/tunjangan PNS tidak dihitung. Jangan menghitung dua kali biaya yang sudah termasuk kontrak lain. Gunakan penawaran, kontrak sejenis, atau standar biaya yang berlaku. Tarif dalam <b>Rp juta</b>.</p><div class="est2-scroll"><div class="est2-grid cost"><strong>Komponen biaya</strong><strong>Volume</strong><strong>Satuan</strong><strong>Tarif (Rp jt)</strong><strong>Subtotal (Rp jt)</strong><span></span><div data-e2-cost-rows class="est2-rows"></div></div></div><button type="button" data-e2-add="cost">+ Tambah komponen</button><div class="est2-total"><span>Estimasi biaya</span><b data-e2-total="cost">Rp 0 jt</b><button type="button" data-e2-use="cost">Gunakan hasil</button></div><p class="est2-hint">Contoh ilustrasi: 2 tenaga ahli × 4 bulan = 8 orang-bulan; tarif Rp 15 juta/orang-bulan = Rp 120 juta. Bukan tarif resmi.</p></section>'+
 '<section data-e2-panel="sdm" hidden><p class="est2-guide"><b>Rumus:</b> jumlah orang × bulan keterlibatan × alokasi waktu (%). Hitung kapasitas PNS in-house dan pro hire tim tetap. Tenaga kontrak khusus proyek/vendor dicatat di biaya, bukan kapasitas internal. Template umum berisi peran opsional: isi jumlah, bulan dan alokasi hanya untuk peran yang terlibat; hapus atau tambah peran sesuai kebutuhan. Untuk tim lintas modul (PMO, CM, VT, operasional), gunakan porsi waktu aktual. Contoh VT: 1 orang × 0,5 bulan × 40% = 0,2 OB; CM: 2 orang × 12 bulan × 12,5% = 3 OB.</p><div class="est2-scroll"><div class="est2-grid sdm"><strong>Peran / fungsi</strong><strong>Orang</strong><strong>Bulan</strong><strong>Alokasi (%)</strong><strong>Orang-bulan</strong><span></span><div data-e2-sdm-rows class="est2-rows"></div></div></div><button type="button" data-e2-add="sdm">+ Tambah peran</button><button type="button" data-e2-duration>Isi bulan kosong dari durasi proyek</button><div class="est2-total"><span>Kebutuhan SDM</span><b data-e2-total="sdm">0 org-bln</b><button type="button" data-e2-use="sdm">Gunakan hasil</button></div><p class="est2-hint">Contoh: 2 developer × 6 bulan × 50% = 6 orang-bulan. Satu orang-bulan setara satu orang bekerja penuh selama satu bulan.</p></section>';
 if(istk){const shell=document.createElement('div');shell.className='ke estv-istk-shell';originalCard.before(shell);shell.append(p)}else originalCard.before(p);
 const q=s=>p.querySelector(s),qa=s=>Array.from(p.querySelectorAll(s));
 function info(title,items){
  const d=document.createElement('details');d.className='est2-info';const s=document.createElement('summary');s.textContent='i';s.title=title;s.setAttribute('aria-label',title);d.appendChild(s);
  const body=document.createElement('div');body.className='est2-info-body';const heading=document.createElement('b');heading.textContent=title;body.appendChild(heading);
  items.forEach(el=>{if(el)body.appendChild(el)});d.appendChild(body);return d;
 }
 const guides={};
 ['cost','sdm'].forEach(type=>{
  const sec=q('[data-e2-panel="'+type+'"]');guides[type]=info(type==='cost'?'Panduan estimasi biaya':'Panduan kebutuhan SDM',[sec.querySelector('.est2-guide'),sec.querySelector('.est2-hint')]);
  sec.querySelector('.est2-scroll').setAttribute('role','region');sec.querySelector('.est2-scroll').setAttribute('aria-label',type==='cost'?'Rincian biaya':'Rincian SDM');
 });
 p.addEventListener('toggle',e=>{const d=e.target;if(d.matches?.('.est2-info[open]'))qa('.est2-info[open]').forEach(other=>{if(other!==d)other.open=false})},true);
 p.addEventListener('keydown',e=>{if(e.key==='Escape'){const open=p.querySelector('.est2-info[open]');if(open){e.stopPropagation();open.open=false;open.querySelector('summary').focus()}}});
 p.addEventListener('click',e=>{if(!e.target.closest('.est2-info'))qa('.est2-info[open]').forEach(d=>d.open=false)},true);
 /* Layout mirrors the approved V2 mockup; keep the original form controls and IDs. */
 const svg=path=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
 const icons={sdm:svg('<circle cx="9" cy="7" r="3"/><path d="M3 19v-3a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v3M16 4a3 3 0 0 1 0 6m3 9v-3a5 5 0 0 0-3-4"/>'),cost:svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18M15 14h3"/>'),gate:svg('<path d="M7 3h10v3H7zM5 5H4v16h16V5h-1M8 13l2 2 5-5"/>'),trash:svg('<path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 10v7m4-7v7"/>')};
 const nav=document.createElement('aside');nav.className='estv-nav';
 nav.innerHTML='<div class="estv-kicker">DURASI PROYEK</div><div class="estv-duration"></div><div class="estv-kicker estv-nav-sub">'+(istk?'ESTIMASI':'ESTIMASI &amp; GATE')+'</div>'+[['sdm','Kebutuhan SDM'],['cost','Estimasi biaya'],...(!istk?[['gate','Gate penyaringan']]:[])].map(([t,l])=>'<button type="button" class="estv-link" data-e2-mode="'+t+'"><span class="estv-nav-icon">'+icons[t]+'</span><span class="estv-nav-text"><b>'+l+'</b><small data-estv-nav="'+t+'">Belum diisi</small></span><span class="estv-arrow">›</span></button>').join('');
 const workspace=document.createElement('div');workspace.className='estv-main';
 p.classList.add('estv');q('.est2-top').remove();p.prepend(nav);p.append(workspace);
 const durationBox=nav.querySelector('.estv-duration');durationBox.append(fieldBox(dur));
 const durationInfo=document.createElement('p');durationInfo.textContent='Durasi pelaksanaan proyek dalam bulan.';const durationLabel=durationBox.querySelector('label,.psbank-field-caption');(durationLabel||durationBox).append(info('Durasi proyek',[durationInfo]));
 ['sdm','cost'].forEach((t,i)=>{
  const sec=q('[data-e2-panel="'+t+'"]');workspace.append(sec);
  const title=document.createElement('div');title.className='estv-heading';title.innerHTML='<div><div class="estv-kicker">0'+(i+1)+' / ESTIMASI</div><h3>'+ (t==='sdm'?'Kebutuhan SDM':'Estimasi biaya')+'</h3><span class="estv-sub">'+(t==='sdm'?'Kapasitas internal proyek':'Rincian belanja proyek')+'</span></div><div class="estv-actions"></div>';sec.prepend(title);title.querySelector('h3').append(guides[t]);
  const grid=document.createElement('div');grid.className='estv-work';const editor=document.createElement('div');editor.className='estv-editor';
  const scroll=sec.querySelector('.est2-scroll');const table=scroll.querySelector('.est2-grid'),header=document.createElement('div');header.className='estv-table-head '+t;Array.from(table.children).filter(el=>!el.matches('.est2-rows')).forEach(el=>header.append(el));table.prepend(header);editor.append(scroll);
  const actions=document.createElement('div');actions.className='estv-row-actions';actions.append(sec.querySelector('[data-e2-add]'));const reset=document.createElement('button');reset.type='button';reset.dataset.estvReset=t;reset.textContent='↺ Reset';actions.append(reset);editor.append(actions);
  if(t==='sdm'){const tpl=document.createElement('button');tpl.type='button';tpl.dataset.estvTemplate='1';tpl.textContent='Template umum';tpl.title='Tambahkan peran standar yang belum ada tanpa menghapus isian';title.querySelector('.estv-actions').append(tpl)}
  const shortcut=sec.querySelector('[data-e2-duration]');if(shortcut){shortcut.innerHTML=svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/>')+' Isi durasi kosong';title.querySelector('.estv-actions').append(shortcut)}
  const result=sec.querySelector('.est2-total');result.className='estv-result';const total=result.querySelector('[data-e2-total]'),use=result.querySelector('[data-e2-use]');
  result.innerHTML='<div class="estv-result-top"><div class="estv-kicker">TOTAL ESTIMASI</div><div data-estv-amount></div><span>'+(t==='sdm'?'orang-bulan':'dalam rupiah juta')+'</span></div><div class="estv-result-details"><div><span>'+(t==='sdm'?'Peran terisi':'Komponen terisi')+'</span><b data-estv-count="'+t+'">0</b></div>'+(t==='sdm'?'<div><span data-estv-people-label>Orang (penugasan)</span><b data-estv-people>0</b></div><div><span data-estv-fte-label>Rata-rata FTE</span><b data-estv-fte>—</b></div>':'')+'<div class="estv-manual"><span>Nilai usulan</span></div></div><div class="estv-result-action"></div>';
  result.querySelector('[data-estv-amount]').append(total);result.querySelector('.estv-result-action').append(use);use.textContent='Gunakan hasil →';
  const target=t==='cost'?cost:sdm;result.querySelector('.estv-manual').append(fieldBox(target));
  const manualNote=document.createElement('p');manualNote.textContent='Nilai yang disimpan ke usulan. Terisi otomatis dari total rincian; bisa diubah manual (sesudah diubah manual tidak ditimpa lagi, kecuali lewat tombol Gunakan hasil). Rincian kalkulator ikut tersimpan saat usulan disimpan.';result.querySelector('.estv-manual>span').append(info('Nilai usulan',[manualNote]));
  if(t==='sdm'){const pn=document.createElement('p');pn.textContent='Jumlah orang pada baris yang lengkap. Orang yang mengisi lebih dari satu peran dapat terhitung lebih dari sekali; ini bukan jumlah pegawai unik.';result.querySelector('[data-estv-people-label]').append(info('Jumlah penugasan',[pn]));const note=document.createElement('p');note.textContent='FTE rata-rata = total orang-bulan dibagi durasi proyek. Ini bukan jumlah pegawai unik.';result.querySelector('[data-estv-fte-label]').append(info('Rata-rata FTE',[note]))}
  grid.append(editor,result);sec.append(grid);
 });
 if(gateCard){const gate=document.createElement('section');gate.dataset.e2Panel='gate';gate.innerHTML='<div class="estv-heading"><div><div class="estv-kicker">03 / PENYARINGAN</div><h3>Gate penyaringan</h3><span class="estv-sub">Kelengkapan persyaratan usulan</span></div></div>';const gateNote=document.createElement('p');gateNote.textContent='Jawab setiap persyaratan sesuai kondisi usulan. Hasil gate tetap dihitung oleh mekanisme yang sudah ada.';gate.querySelector('h3').append(info('Panduan gate',[gateNote]));const gh=gateCard.querySelector('h4');if(gh)gh.hidden=true;gate.append(gateCard);workspace.append(gate);originalCard.remove()}
 const actual=e=>e===dur||e===cost||e===sdm||!!gateCard?.contains(e);
 function closeInfos(){qa('.est2-info[open]').forEach(d=>d.open=false)}
 p.addEventListener('toggle',e=>{const d=e.target;if(!d.matches?.('.est2-info[open]'))return;const box=d.querySelector('.est2-info-body'),r=d.querySelector('summary').getBoundingClientRect();const width=Math.min(320,window.innerWidth-24);box.style.width=width+'px';box.style.left=Math.max(12,Math.min(r.left,window.innerWidth-width-12))+'px';box.style.right='auto';box.style.top='12px';const h=box.getBoundingClientRect().height;box.style.top=Math.max(12,Math.min(r.bottom+7,window.innerHeight-h-12))+'px'},true);
 p.closest('.kd2-body')?.addEventListener('scroll',closeInfos,{passive:true});
 p.addEventListener('scroll',closeInfos,true);
 function navRefresh(){q('[data-estv-nav="cost"]').textContent=cost.value===''?'Belum diisi':'Rp '+nf(num(cost.value))+' juta';q('[data-estv-nav="sdm"]').textContent=sdm.value===''?'Belum diisi':nf(num(sdm.value))+' OB';if(gateCard){const g=Array.from(gateCard.querySelectorAll('select'));q('[data-estv-nav="gate"]').textContent=g.filter(x=>x.value).length+' dari '+g.length+' dijawab'}}
 const number=(key,lab,step='any',extra='')=>'<input type="number" min="0" step="'+step+'" data-e2-'+key+' aria-label="'+lab+'" '+extra+'>';
 function add(type,name='',unit=''){
  const r=document.createElement('div');r.className='est2-row estv-row '+type;r.dataset.e2Row=type;
  r.innerHTML='<input type="text" data-e2-name aria-label="'+(type==='cost'?'Komponen biaya':'Peran')+'" placeholder="'+(type==='cost'?'Nama komponen':'Contoh: Developer')+'">'+(type==='cost'?number('n','Volume')+'<input type="text" data-e2-unit aria-label="Satuan" placeholder="paket">'+number('rate','Tarif Rp juta'):number('n','Jumlah orang','1')+number('months','Bulan')+number('pct','Alokasi waktu (%)','any','max="100" placeholder="%"'))+'<output data-e2-sub>—</output><button type="button" data-e2-del aria-label="Hapus baris" title="Hapus baris">'+icons.trash+'</button>';
  r.querySelector('[data-e2-name]').value=name;r.querySelector('[data-e2-name]').title=name;if(type==='cost')r.querySelector('[data-e2-unit]').value=unit;
  q('[data-e2-'+type+'-rows]').appendChild(r);
 }
 const defaults={cost:[['Pro hire / tenaga ahli','orang-bulan'],['Jasa pengembangan / vendor','paket'],['Lisensi / langganan','lisensi'],['Infrastruktur / cloud','bulan'],['Pelatihan / lainnya','paket']],sdm:SDM_ROLES.map(n=>[n])};
 function resetRows(t){q('[data-e2-'+t+'-rows]').replaceChildren();defaults[t].forEach(a=>add(t,...a));}
 resetRows('cost');resetRows('sdm');
 /* Rincian kalkulator disimpan bersama usulan (estimateDetail, JSON) dan dipulihkan saat formulir dibuka lagi. */
 const det=(istk?inp.closest('.psbank-project-editor'):inp.closest('.ke-ov'))?.querySelector('#kn-estimateDetail,[data-scope-field="estimateDetail"]');
 const KEYS={cost:['n','unit','rate'],sdm:['n','months','pct']};
 try{const saved=det&&det.value?JSON.parse(det.value):null;
  if(saved)['cost','sdm'].forEach(t=>{const L=Array.isArray(saved[t])?saved[t]:null;if(!L||!L.length)return;q('[data-e2-'+t+'-rows]').replaceChildren();
   L.forEach(a=>{add(t,String(a[0]||''),t==='cost'?String(a[2]||''):'');const r=q('[data-e2-'+t+'-rows]').lastElementChild;
    KEYS[t].forEach((k,i)=>{const e=r.querySelector('[data-e2-'+k+']');if(e&&a[i+1]!=null)e.value=String(a[i+1])})})})}catch(_){}
 function persist(){if(!det||det.disabled)return;const o={v:1};
  ['cost','sdm'].forEach(t=>{o[t]=qa('[data-e2-row="'+t+'"]').map(r=>[r.querySelector('[data-e2-name]').value.trim()].concat(KEYS[t].map(k=>{const e=r.querySelector('[data-e2-'+k+']');return e?e.value.trim():''})))});
  const v=JSON.stringify(o);if(det.value!==v)det.value=v}
 /* Nilai usulan mengikuti total rincian selama belum diubah manual (kosong/0/sama dengan hasil otomatis sebelumnya). */
 const lastAuto={cost:null,sdm:null};let quiet=true;
 const parse=e=>{if(!e||e.value.trim()===''||!e.validity.valid)return null;const n=Number(e.value);return Number.isFinite(n)&&n>=0?n:null};
 function calc(type){
  let total=0,valid=true,used=false,count=0,people=0;
  qa('[data-e2-row="'+type+'"]').forEach(r=>{
   const v=k=>r.querySelector('[data-e2-'+k+']'),fields=type==='cost'?['n','rate']:['n','months','pct'];
   const active=fields.some(k=>v(k).value.trim()!==''||v(k).validity.badInput);
   const vals=fields.map(k=>parse(v(k)));
   const ok=active&&vals.every(x=>x!==null)&&(type==='cost'||(Number.isInteger(vals[0])&&vals[2]<=100))&&v('name').value.trim()&&(type!=='cost'||v('unit').value.trim());
   const sub=ok?(type==='cost'?vals[0]*vals[1]:sdmEffort(vals[0],vals[1],vals[2])):null;
   if(active){used=true;if(sub===null||!Number.isFinite(sub))valid=false;else{total+=sub;count++;if(type==='sdm')people+=vals[0]}}
   v('sub').textContent=sub===null?'—':nf(sub);r.classList.toggle('invalid',active&&sub===null);
  });
  q('[data-e2-total="'+type+'"]').textContent=(type==='cost'?'Rp ':'')+nf(total)+(type==='cost'?' jt':' OB');q('[data-estv-count="'+type+'"]').textContent=count+(type==='cost'?' komponen':' peran');if(type==='sdm'){q('[data-estv-people]').textContent=valid?nf(people):'—';const d=parse(dur);q('[data-estv-fte]').textContent=d>0&&valid?nf(total/d):'—'}
  q('[data-e2-use="'+type+'"]').disabled=!used||!valid||!Number.isFinite(total);
  const ok=used&&valid&&Number.isFinite(total),target=type==='cost'?cost:sdm,cur=target.value.trim();
  if(quiet){if(ok&&cur!==''&&Math.abs(num(cur)-total)<1e-6)lastAuto[type]=total}
  else{persist();if(ok&&(cur===''||num(cur)===0||(lastAuto[type]!=null&&Math.abs(num(cur)-lastAuto[type])<1e-6))&&Math.abs(num(cur)-total)>=1e-6){lastAuto[type]=total;setVal(target,total)}}
  return {total,valid:ok};
 }

 /* Pro hire: role/level chips with explicitly identified salary or consulting references. */
 function proHire(){
  const host=document.createElement('div');host.className='est2-pro';
  host.innerHTML='<button type="button" class="est2-pro-toggle" data-ph-toggle aria-expanded="false"><span class="est2-plus">+</span><span>Tambah Pro Hire</span><span class="est2-pro-sub">Peran · level · tarif</span><span class="est2-chevron">⌄</span></button><div data-ph-body hidden><div class="est2-ph-line"><b>Peran</b><div data-ph-group="role"></div></div><div class="est2-ph-line"><b>Level</b><div data-ph-group="level"></div></div><div class="est2-ph-line"><b>Referensi</b><div data-ph-group="source"></div></div><div class="est2-ph-fields"><label>Pengalaman (tahun)<input type="number" min="0" max="60" step="1" data-ph-years value="2"></label><label>Orang<input type="number" min="1" step="1" data-ph-n value="1"></label><label>Bulan<input type="number" min="0.01" step="any" data-ph-m></label><label>Tarif (Rp juta/OB)<input type="number" min="0" step="any" data-ph-rate></label></div><div class="est2-ph-reference"><span>Tarif referensi</span><b data-ph-short>—</b><span data-ph-info></span><button type="button" data-ph-fill>Pakai tarif</button></div><p class="est2-guide" data-ph-ref></p><div class="est2-ph-actions"><div class="est2-ph-amount"><small>Subtotal pro hire</small><b data-ph-total>—</b></div><button type="button" data-ph-add>+ Tambah ke rincian</button></div><p class="est2-hint">Level adalah label perencanaan internal; tarif ditentukan dari pengalaman aktual dan sumber terpilih. Pastikan biaya jasa, pajak dan komponen kontrak yang belum termasuk dihitung sesuai kebutuhan.</p></div>';
  const dialog=document.createElement('dialog');dialog.className='estv-dialog';dialog.setAttribute('aria-label','Tambah Pro Hire');dialog.innerHTML='<div class="estv-dialog-head"><div><div class="estv-kicker">ESTIMASI BIAYA / TENAGA AHLI</div><h3>Tambah Pro Hire</h3></div><button type="button" data-estv-pro-close aria-label="Tutup">×</button></div>';dialog.append(host);p.append(dialog);
  const launch=document.createElement('button');launch.type='button';launch.className='estv-launch';launch.textContent='+ Pro Hire';q('[data-e2-panel="cost"] .estv-actions').append(launch);
  host.querySelector('[data-ph-toggle]').hidden=true;host.querySelector('[data-ph-body]').hidden=false;
  function closePro(){if(dialog.open)dialog.close();launch.focus()}
  launch.addEventListener('click',e=>{e.stopPropagation();if(h('[data-ph-m]').value===''&&parse(dur)>0)h('[data-ph-m]').value=dur.value;render();if(!dialog.open)dialog.showModal()});
  dialog.querySelector('[data-estv-pro-close]').addEventListener('click',e=>{e.stopPropagation();closePro()});
  dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closePro()});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();const opened=dialog.querySelector('.est2-info[open]');if(opened)opened.open=false;else closePro()}});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePro()}e.stopPropagation()});
  const h=s=>host.querySelector(s),ha=s=>Array.from(host.querySelectorAll(s));
  h('[data-ph-info]').appendChild(info('Dasar tarif & asumsi',[h('[data-ph-ref]'),h('.est2-hint')]));
  const groups={role:['Frontend','Backend','Fullstack','.NET Developer','Business Analyst','System Analyst','UI/UX Designer','QA','DevOps','Cloud Engineer','Project Manager','Data Engineer','Security Engineer','Mobile Developer','Lainnya'],level:['Junior','Middle','Senior'],source:['PERSOL 2026','INKINDO 2026','Kontrak / Manual']};
  const state={role:'Frontend',level:'Junior',source:'PERSOL 2026'};
  Object.keys(groups).forEach(k=>groups[k].forEach(v=>{const b=document.createElement('button');b.type='button';b.className='est2-chip';b.dataset.phGroup=k;b.dataset.phValue=v;b.textContent=v==='PERSOL 2026'?'Kelly / PERSOL 2026':v;h('[data-ph-group="'+k+'"]').appendChild(b)}));
  const market={'Frontend':['ReactJS Developer (IT)',2,4,10,12],'Backend':['Backend Developer (Credit Agency/Leasing)',1,3,8,10],'Fullstack':['Fullstack Developer (IT)',0,2,7.5,12],'.NET Developer':['.NET Developer (IT)',0,2,6,11],'Business Analyst':['Business Analyst (IT)',1,3,10.4,13],'System Analyst':['System Analyst (IT)',0,1,8,11],'UI/UX Designer':['UI/UX Designer (IT)',1,3,8.5,10.5],'QA':['Quality Assurance (IT)',3,5,10.5,14.5],'DevOps':['DevOps Engineer (IT)',2,4,18,20],'Cloud Engineer':['AWS Cloud Engineer (IT)',1,3,10,15],'Project Manager':['Junior Project Manager (IT)',1,3,10,15]};
  const ink=[28.85,30.6,32.3,34,35.7,37.4,39.15,40.85,42.55,44.25,46,47.7,49.4,51.1,52.8,54.55,56.25,57.95,59.65,61.35,63.1,64.8,66.5];
  const sourceLinks={'PERSOL 2026':'https://www.scribd.com/document/991716451/Indonesia-Salary-Guide-2026-v2','INKINDO 2026':'https://www.inkindo.org/documents/ikdweb-billing-rate-2026.pdf'};
  function reference(){
   const y=parse(h('[data-ph-years]'));if(y===null||!Number.isInteger(y))return {note:'Isi pengalaman kerja yang relevan.'};
   if(state.source==='PERSOL 2026'){
    const a=state.role==='.NET Developer'&&y>=5&&y<=7?['Senior .NET Developer (IT)',5,7,15,17]:market[state.role];
    if(!a||y<a[1]||y>a[2])return {note:'Tidak ada rentang PERSOL 2026 terverifikasi untuk kombinasi peran/pengalaman ini. Isi tarif manual atau gunakan sumber lain.'};
    return {rate:(a[3]+a[4])/2,note:a[0]+' · '+a[1]+'–'+a[2]+' tahun · Rp '+nf(a[3])+'–'+nf(a[4])+' jt/bulan. Titik tengah simulasi Rp '+nf((a[3]+a[4])/2)+' jt, bukan billing rate.'};
   }
   if(state.source==='INKINDO 2026'){
    if(y>=3&&y<=25)return {rate:ink[y-3],note:'Tabel 3-26, S1 tanpa SKK, NCB, badan usaha, DKI Jakarta · '+y+' tahun · Rp '+nf(ink[y-3])+' jt/bulan. Bukan tarif khusus FE/BE.'};
    if(y<=2&&['Frontend','Backend','Fullstack','.NET Developer','Mobile Developer'].includes(state.role))return {rate:17.6,note:'Tabel 4-26, pemrogram perangkat lunak (sub-professional), DKI Jakarta · Rp 17,6 jt/bulan. Asumsi S1/setara, pengalaman ≤2 tahun.'};
    return {note:'Referensi INKINDO otomatis belum tersedia untuk kualifikasi ini. Gunakan tarif manual sesuai tabel yang relevan.'};
   }
   return {note:'Masukkan tarif dari kontrak sebelumnya, survei pasar, atau penawaran penyedia.'};
  }
  function render(){
   ha('[data-ph-group][data-ph-value]').forEach(b=>{const on=state[b.dataset.phGroup]===b.dataset.phValue;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
   const ref=reference(),el=h('[data-ph-ref]');el.textContent=ref.note;
   if(sourceLinks[state.source]){const a=document.createElement('a');a.href=sourceLinks[state.source];a.target='_blank';a.rel='noopener noreferrer';a.textContent=' Lihat sumber ↗';el.appendChild(a)}
   h('[data-ph-short]').textContent=ref.rate==null?'Isi tarif manual':'Rp '+nf(ref.rate)+' jt/OB';
   h('[data-ph-short]').classList.toggle('est2-muted',ref.rate==null);
   h('[data-ph-fill]').disabled=ref.rate==null;
   const n=parse(h('[data-ph-n]')),m=parse(h('[data-ph-m]')),rate=parse(h('[data-ph-rate]'));const ok=n!==null&&n>=1&&Number.isInteger(n)&&m!==null&&m>0&&rate!==null&&Number.isFinite(n*m*rate);
   h('[data-ph-total]').textContent=ok?nf(n*m)+' OB · Rp '+nf(n*m*rate)+' jt':'—';h('[data-ph-add]').disabled=!ok;
  }
  host.addEventListener('input',e=>{if(e.target.matches('[data-ph-years]'))h('[data-ph-rate]').value='';render()});
  host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();e.preventDefault();
   if(b.hasAttribute('data-ph-toggle')){const panel=h('[data-ph-body]');panel.hidden=!panel.hidden;b.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden&&h('[data-ph-m]').value===''&&parse(dur)>0)h('[data-ph-m]').value=dur.value;render();return}
   if(b.dataset.phGroup){state[b.dataset.phGroup]=b.dataset.phValue;if(b.dataset.phGroup==='level')h('[data-ph-years]').value=({Junior:2,Middle:4,Senior:7})[state.level];h('[data-ph-rate]').value='';render();return}
   if(b.hasAttribute('data-ph-fill')){const ref=reference();if(ref.rate!=null)h('[data-ph-rate]').value=ref.rate;render();return}
   if(b.hasAttribute('data-ph-add')&&!b.disabled){
    const n=parse(h('[data-ph-n]')),m=parse(h('[data-ph-m]')),rate=parse(h('[data-ph-rate]'));if(n===null||m===null||rate===null)return;
    add('cost','Pro hire · '+state.role+' · '+state.level+' ('+state.source+')','orang-bulan');
    const row=qa('[data-e2-row="cost"]').slice(-1)[0];row.querySelector('[data-e2-n]').value=String(n*m);row.querySelector('[data-e2-rate]').value=String(rate);
    calc('cost');closePro();
   }
  });
  render();
 }
 proHire();

 let mode='sdm';
 function show(type){mode=type;p.hidden=false;qa('[data-e2-panel]').forEach(el=>el.hidden=el.dataset.e2Panel!==type);qa('.est2-info[open]').forEach(el=>el.open=false);qa('[data-e2-mode]').forEach(b=>{const active=b.dataset.e2Mode===type;b.classList.toggle('on',active);b.setAttribute('aria-pressed',String(active))});if(type!=='gate')calc(type);navRefresh()}
 p.addEventListener('input',e=>{if(actual(e.target)){navRefresh();if(e.target===dur)calc('sdm');return}e.stopPropagation();if(mode!=='gate')calc(mode)});
 p.addEventListener('change',e=>{if(actual(e.target)){navRefresh();return}e.stopPropagation();if(mode!=='gate')calc(mode)});
 p.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||gateCard?.contains(b)||b.closest('.mt-info-ic'))return;e.stopPropagation();e.preventDefault();
  if(b.dataset.e2Mode){show(b.dataset.e2Mode);return}
  if(b.hasAttribute('data-estv-template')){const existing=new Set(qa('[data-e2-row="sdm"] [data-e2-name]').map(x=>x.value.trim().toLowerCase()));SDM_ROLES.forEach(name=>{if(!existing.has(name.toLowerCase()))add('sdm',name)});calc('sdm');return}
  if(b.dataset.e2Add){add(b.dataset.e2Add);calc(b.dataset.e2Add);q('[data-e2-'+b.dataset.e2Add+'-rows]').lastElementChild?.querySelector('input')?.focus();return}
  if(b.dataset.estvReset){if(confirm('Reset rincian kalkulator? Nilai usulan tidak berubah.')){resetRows(b.dataset.estvReset);calc(b.dataset.estvReset)}return}
  if(b.hasAttribute('data-e2-del')){const r=b.closest('[data-e2-row]'),t=r.dataset.e2Row;r.remove();calc(t);return}
  if(b.hasAttribute('data-e2-duration')){if(parse(dur)>0)qa('[data-e2-row="sdm"]').forEach(r=>{const n=r.querySelector('[data-e2-n]'),m=r.querySelector('[data-e2-months]');if(n.value!==''&&m.value==='')m.value=dur.value});else dur.focus();calc('sdm');return}
  if(b.dataset.e2Use){const t=b.dataset.e2Use,v=calc(t);if(v.valid){setVal(t==='cost'?cost:sdm,v.total);navRefresh();b.textContent='✓ Hasil digunakan';setTimeout(()=>{b.textContent='Gunakan hasil →'},1600)}}
 });
 calc('cost');calc('sdm');quiet=false;
 show('sdm');
 return true;
}

function attach(root){
 (root||document).querySelectorAll(COST+','+SDM).forEach(inp=>{
  if(inp.dataset.esth||inp.disabled||inp.readOnly)return;if(attachNon(inp))return;inp.dataset.esth='1';
  const host=inp.closest('label')||inp,box=document.createElement('div');box.className='esth-wrap';box.innerHTML=inp.matches(COST)?costBox():sdmBox();
  box._target=inp;host.insertAdjacentElement('afterend',box);
  if(inp.matches(SDM)){fillFallbackTemplate(box)}
 })}
function fillFallbackTemplate(box){const rows=box.querySelector('[data-esth-rows]');if(!rows)return;const existing=new Set(Array.from(rows.querySelectorAll('[data-esth-role]')).map(x=>x.value.trim().toLowerCase()));const blank=Array.from(rows.querySelectorAll('.esth-sr')).find(r=>Array.from(r.querySelectorAll('input')).every(i=>i.value===''));SDM_ROLES.forEach((name,index)=>{if(existing.has(name.toLowerCase()))return;let row=index===0&&blank?blank:null;if(!row){rows.insertAdjacentHTML('beforeend',sdmRow());row=rows.lastElementChild}row.querySelector('[data-esth-role]').value=name});}
function calc(box){
 if(box.querySelector('[data-esth-c]')){const t=[...box.querySelectorAll('[data-esth-c]')].reduce((a,i)=>a+num(i.value),0);box.querySelector('[data-esth-ctot]').textContent='Rp '+nf(t)+' jt';return t}
 const t=[...box.querySelectorAll('.esth-sr')].reduce((a,r)=>a+sdmEffort(num(r.querySelector('[data-esth-n]').value),num(r.querySelector('[data-esth-m]').value),num(r.querySelector('[data-esth-p]').value)),0);
 box.querySelector('[data-esth-stot]').textContent=nf(t)+' org-bln';return t}
document.addEventListener('input',e=>{const b=e.target.closest&&e.target.closest('.esth-wrap');if(!b)return;e.stopPropagation();calc(b)},true);
document.addEventListener('change',e=>{if(e.target.closest&&e.target.closest('.esth-wrap'))e.stopPropagation()},true);
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.esth-wrap');if(!b)return;const t=e.target;
 if(t.closest('summary'))return;
 if(t.matches('[data-esth-cuse],[data-esth-suse]')){e.preventDefault();e.stopPropagation();const v=calc(b);setVal(b._target,v);b.querySelector('details').open=false;return}
 if(t.matches('[data-esth-template]')){e.preventDefault();e.stopPropagation();fillFallbackTemplate(b);calc(b);return}
 if(t.matches('[data-esth-add]')){e.preventDefault();e.stopPropagation();b.querySelector('[data-esth-rows]').insertAdjacentHTML('beforeend',sdmRow());return}
 if(t.matches('[data-esth-del]')){e.preventDefault();e.stopPropagation();const rows=b.querySelectorAll('.esth-sr');if(rows.length>1)t.closest('.esth-sr').remove();else t.closest('.esth-sr').querySelectorAll('input').forEach(i=>i.value='');calc(b);return}
 e.stopPropagation()},true);
let raf=0;new MutationObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;attach(document)})}).observe(document.documentElement,{childList:true,subtree:true});
(function css(){if(document.getElementById('esth-style'))return;const s=document.createElement('style');s.id='esth-style';s.textContent=`
.esth-wrap{margin:4px 0 8px}.esth>summary{cursor:pointer;font-size:11.5px;font-weight:700;color:#1D3A78;list-style:none;display:inline-flex;gap:4px;padding:2px 0}.esth>summary::-webkit-details-marker{display:none}.esth>summary:hover{text-decoration:underline}
.esth-b{margin-top:6px;background:#F5F8FD;border:1px solid #D6E0EF;border-radius:10px;padding:10px 12px;font-size:12px;color:#0F2346}
.esth-n{margin:0 0 8px;font-size:11.5px;line-height:1.5;color:#334155;background:#FFF4D6;border-radius:8px;padding:6px 8px}.esth-x{margin:6px 0 0;font-size:11px;color:#64748B}
.esth-r{display:grid!important;grid-template-columns:minmax(0,1fr) 150px;gap:8px;align-items:center;margin:0 0 5px!important;font-weight:600!important;font-size:12px!important}
.esth-in{display:flex;align-items:center;border:1px solid #C9D8EE;border-radius:8px;background:#fff;overflow:hidden}.esth-in em{font-style:normal;font-size:11px;color:#64748B;padding:0 6px}
.esth-wrap input{min-width:0!important;width:100%!important;height:30px!important;border:0!important;padding:0 6px!important;font:600 12.5px inherit;background:#fff!important;box-shadow:none!important;border-radius:0!important}
.esth-sh,.esth-sr{display:grid;grid-template-columns:minmax(0,1fr) 62px 10px 62px 10px 58px 14px 24px;gap:4px;align-items:center}.esth-sh{font-size:10.5px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
.esth-sr{margin-bottom:5px}.esth-sr input{border:1px solid #C9D8EE!important;border-radius:7px!important}.esth-sr span,.esth-sr em{font-style:normal;font-size:11px;color:#64748B;text-align:center}
.esth-wrap button{border:1px solid #C9D8EE;background:#fff;border-radius:8px;padding:4px 10px;font:700 11.5px inherit;color:#12275A;cursor:pointer;min-height:0;box-shadow:none}
.esth-sr button{padding:0;width:24px;height:24px;color:#B42318;border-color:#F3C6C6}.esth-add{margin:2px 0 6px}
.esth-t{display:flex;align-items:center;gap:10px;border-top:1px dashed #C9D8EE;padding-top:8px;margin-top:4px}.esth-t span{flex:1;font-weight:700;color:#334155}.esth-t b{font-size:13px}
.esth-t button{background:#12275A!important;color:#fff!important;border-color:#12275A!important}
 .est2[hidden],.est2 [hidden]{display:none!important}.est2-trigger{display:block;margin-top:5px;padding:3px 0;border:0;background:transparent;color:#1D3A78;font:inherit;font-size:12px;cursor:pointer;text-align:left}.est2-trigger:hover{text-decoration:underline}
 .est2{border:1px solid #D6E0EF;border-left:3px solid #F2B92C;border-radius:10px;background:#fff;margin:12px 0 0;padding:12px;font:inherit;color:#12275A}.est2-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.est2-guide,.est2-hint{font-size:12px;line-height:1.5;margin:6px 0 10px;color:#475569}.est2-scroll{overflow-x:auto}.est2-grid{display:grid;gap:6px;align-items:center;min-width:580px;font-size:12px}.est2-grid.cost{grid-template-columns:minmax(155px,2fr) minmax(70px,.7fr) minmax(90px,1fr) minmax(100px,1fr) minmax(100px,1fr) 28px}.est2-grid.sdm{grid-template-columns:minmax(155px,2fr) repeat(3,minmax(76px,1fr)) minmax(100px,1fr) 28px}.est2-rows,.est2-row{display:contents}.est2-grid strong{font-size:11px;color:#64748B}.est2 input{width:100%;min-width:0;box-sizing:border-box;border:1px solid #C9D8EE;border-radius:7px;background:#fff;height:32px;padding:5px 7px;font:inherit;color:#12275A}.est2 output{text-align:right;font-weight:600;padding-right:4px;font-variant-numeric:tabular-nums}.est2 button{border:1px solid #C9D8EE;background:#fff;border-radius:7px;color:#12275A;font:inherit;font-size:12px;padding:6px 10px;cursor:pointer}.est2 [data-e2-del]{padding:4px;color:#64748B}.est2 [data-e2-add],.est2 [data-e2-duration]{margin:9px 8px 0 0}.est2-total{display:flex;align-items:center;gap:12px;border-top:1px solid #E2E8F0;margin-top:10px;padding-top:10px}.est2-total span{flex:1}.est2-total b{font-size:16px}.est2-total button{background:#F2B92C;border-color:#F2B92C;font-weight:700}.est2-total button:disabled{opacity:.5;cursor:not-allowed}.est2-row.invalid input{border-color:#D97706}.est2-hint{margin-bottom:0}

 .est2-pro{border:1px solid #E2E8F0;border-radius:9px;padding:9px 10px;margin:0 0 12px;background:#fff}.est2 .est2-pro-toggle{border:0;padding:2px 0;color:#12275A;font-weight:700}.est2-ph-line{display:grid;grid-template-columns:78px minmax(0,1fr);align-items:start;gap:8px;margin-top:9px;font-size:12px}.est2-ph-line>b{padding-top:5px}.est2-ph-line>div{display:flex;flex-wrap:wrap;gap:5px}.est2 .est2-chip{border-radius:999px;padding:4px 10px;background:#F5F8FD;color:#334155;font-size:11.5px}.est2 .est2-chip.on{background:#12275A;border-color:#12275A;color:#fff;box-shadow:inset 3px 0 0 #F2B92C}.est2-ph-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.est2-ph-fields label{font-size:11px;color:#475569}.est2-ph-fields input{display:block;margin-top:4px}.est2-ph-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.est2-ph-actions b{margin-left:auto}.est2 .est2-ph-actions [data-ph-add]{background:#F2B92C;border-color:#F2B92C;font-weight:700}.est2-ph-actions button:disabled{opacity:.5;cursor:not-allowed}.est2-pro a{color:#1D3A78;text-decoration:underline}@media(max-width:650px){.est2-ph-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}

 .est2{padding:12px 14px;border-left:1px solid #D6E0EF;box-shadow:inset 3px 0 0 #F2B92C}
 .est2-top{gap:12px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:9px;border-bottom:1px solid #E2E8F0}
 .est2-title{display:flex;align-items:center;gap:6px;flex:1;min-width:160px}.est2-title>b{font-size:13px}.est2-switch{display:flex;gap:2px;background:#F2F5FA;border:1px solid #E2E8F0;border-radius:8px;padding:2px}.est2 .est2-switch button{border:0;background:transparent;border-radius:6px;font-weight:600;padding:5px 14px}.est2 .est2-switch button.on{background:#12275A;color:#fff;box-shadow:inset 2px 0 0 #F2B92C}.est2 .est2-icon{padding:3px 7px;color:#64748B}
 .est2-info{position:relative;display:inline-block;vertical-align:middle;line-height:1;flex:none}.est2-info>summary{display:grid;place-items:center;list-style:none;width:16px;height:16px;border:1px solid #94A3B8;border-radius:50%;color:#475569;font-size:11px;font-weight:700;cursor:pointer;background:#fff;box-sizing:border-box}.est2-info>summary::-webkit-details-marker{display:none}.est2-info[open]>summary,.est2-info>summary:hover{color:#12275A;border-color:#D4A31B;background:#FFF9E8}.est2-info-body{position:absolute;z-index:5;top:calc(100% + 7px);left:-8px;width:min(320px,65vw);padding:12px;background:#fff;border:1px solid #D6E0EF;border-top:2px solid #F2B92C;border-radius:8px;box-shadow:0 8px 24px #12275A20;font-size:12px;line-height:1.5;color:#334155}.est2-info-body>b{display:block;color:#12275A;font-size:12px}.est2-info-body .est2-guide,.est2-info-body .est2-hint{font-size:12px;line-height:1.5;margin:6px 0 0}
 .est2-grid{gap:5px 7px}.est2-grid strong{font-weight:600;background:#F2F5FA;padding:8px 5px;border-radius:4px;color:#334155}.est2 input{height:34px;font-size:12px}.est2 input:focus{outline:1px solid #1D3A78;border-color:#1D3A78}.est2 output{background:#F8FAFC;min-height:34px;display:flex;align-items:center;justify-content:flex-end;border-radius:5px;padding:0 7px}.est2-row.invalid output{color:#B45309}.est2 [data-e2-del]{border-color:transparent;background:transparent;font-size:15px}.est2 [data-e2-del]:hover{color:#B42318;background:#FFF1F0}
 .est2-pro{padding:9px 10px;border:1px solid #D6E0EF;margin-bottom:10px}.est2 .est2-pro-toggle{display:flex;width:100%;align-items:center;gap:7px;text-align:left}.est2-plus{display:grid;place-items:center;width:22px;height:22px;background:#12275A;color:#fff;border-radius:5px;font-size:16px;flex:none}.est2-pro-sub{font-size:11px;font-weight:400;color:#64748B}.est2-chevron{margin-left:auto;color:#64748B;font-size:16px}.est2-pro-toggle[aria-expanded=true] .est2-chevron{transform:rotate(180deg)}
 .est2 .est2-chip{padding:5px 9px;font-size:11.5px;border-radius:7px;background:#fff;border-color:#D6E0EF;white-space:nowrap}.est2 .est2-chip:hover{background:#F2F5FA}.est2 .est2-chip.on{background:#12275A;color:#fff;border-color:#12275A;box-shadow:inset 2px 0 0 #F2B92C}.est2-ph-line{grid-template-columns:72px minmax(0,1fr);gap:7px;margin-top:8px}.est2-ph-fields{margin:12px 0 8px}.est2-ph-fields label{font-weight:600;color:#334155}
 .est2-ph-reference{display:flex;align-items:center;gap:7px;flex-wrap:wrap;background:#F5F8FD;border:1px solid #E2E8F0;border-radius:7px;padding:6px 8px;font-size:11.5px}.est2-ph-reference>b{font-size:12px}.est2-muted{color:#64748B;font-weight:500}.est2-ph-reference>[data-ph-fill]{margin-left:auto;padding:4px 9px;font-weight:600}.est2-ph-reference>[data-ph-fill]:disabled{opacity:.5;cursor:not-allowed}
 .est2-ph-actions{justify-content:space-between;border-top:1px solid #E2E8F0;margin-top:9px;padding-top:9px}.est2-ph-amount{display:flex;flex-direction:column;gap:3px}.est2-ph-amount small{font-size:10.5px;color:#64748B}.est2-ph-actions .est2-ph-amount b{margin:0;font-size:14px;color:#12275A}.est2-total{background:#F2F5FA;border:1px solid #E2E8F0;padding:9px 10px;border-radius:8px;margin-top:10px}.est2-total b{font-size:17px;color:#12275A}.est2 button:focus-visible,.est2 summary:focus-visible{outline:2px solid #1D3A78;outline-offset:2px}
 @media(max-width:650px){.est2-top{gap:6px}.est2-title{min-width:120px}.est2-switch button{padding:4px 9px!important}.est2-pro-sub{display:none}.est2-total{gap:7px;flex-wrap:wrap}.est2-info-body{width:min(270px,70vw)}}

 /* Shared V2 workspace; ISTK keeps its original gate and scheduling fields. */
 .estv-istk-shell{grid-column:1/-1;min-width:0;margin:0 0 12px}.estv-istk-shell .estv-duration .psbank-scope-field{display:block;min-width:0}.estv-istk-shell .estv-duration .psbank-field-caption{display:flex;align-items:center;gap:5px;margin:0 0 5px;font-size:11px}.estv-istk-shell .estv-manual .psbank-field-caption{display:none}.estv-istk-shell .estv-manual input{width:100%;min-width:0;text-align:right;font:inherit}.estv-istk-shell .estv-manual .psbank-scope-field{display:block;min-width:0;margin-top:5px}.psbank-project-editor .estv-istk-shell .estv-duration input{max-width:100%}
 .ke .estv{--ev-navy:#152854;--ev-gold:#f2b827;--ev-line:#dfe6ef;--ev-muted:#738198;display:grid;grid-template-columns:202px minmax(0,1fr);gap:18px;align-items:start;border:0;box-shadow:none;border-radius:0;background:#fff;padding:4px 0 10px;margin:0;color:#263852;min-width:0}
 .estv *{box-sizing:border-box}.estv svg{width:16px;height:16px;flex:none;vertical-align:middle}.estv .estv-nav{display:flex;flex-direction:column;gap:5px;padding:6px 12px 8px 0;border-right:1px solid #e4eaf2;position:sticky;top:0;align-self:start;min-width:0}
 .estv .estv-kicker{font-size:10px;font-weight:700;letter-spacing:.07em;color:#738198}.estv .estv-nav>.estv-kicker{padding:0 8px}.estv .estv-nav-sub{margin-top:13px}.estv .estv-duration{background:#f5f7fb;border:1px solid #e1e7f0;border-radius:9px;padding:9px 11px;margin:2px 0 1px}.estv .estv-duration .fld{display:block;margin:0}.estv .estv-duration label{display:flex;align-items:center;gap:6px;font-size:11px;color:#63748c;margin:0 0 4px}.ke .estv .estv-duration input{height:34px;width:88px;font-size:20px;font-weight:650;border:1px solid #d7e0ef;border-radius:5px;color:#152854;background:white;text-align:center}
 .estv .estv-link{display:flex;align-items:center;gap:8px;width:100%;min-width:0;text-align:left;border:0;background:#fff;border-radius:8px;padding:10px 8px;white-space:normal;transition:background .12s}.estv .estv-link:hover{background:#f5f7fb}.estv .estv-link.on{background:#f0f4fa;box-shadow:inset 3px 0 0 #f2b827}.estv .estv-nav-icon{width:28px;height:28px;border-radius:6px;background:#f2f5f9;display:grid;place-items:center;color:#687b99;flex:none}.estv .estv-link.on .estv-nav-icon{background:#152854;color:#fff}.estv .estv-nav-text{flex:1;min-width:0}.estv .estv-nav-text b{display:block;font-size:12px;font-weight:650;color:#263b5b}.estv .estv-nav-text small{display:block;font-size:11px;color:#738198;margin-top:2px;overflow-wrap:anywhere}.estv .estv-arrow{font-size:17px;color:#8c9ab0}
 .estv .estv-main{min-width:0;padding:4px 0 0}.estv .estv-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 13px}.estv .estv-heading h3,.estv .estv-dialog-head h3{font-size:21px;font-weight:700;letter-spacing:-.025em;line-height:1.25;color:#152854;margin:3px 0;display:flex;align-items:center;gap:8px;text-transform:none}.estv .estv-sub{font-size:12px;color:#76859a}.estv .estv-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.estv .estv-actions button{display:flex;align-items:center;gap:6px;padding:7px 11px;font-size:12px;margin:0;white-space:nowrap}.estv .estv-actions .estv-launch{background:#152854;color:white;border-color:#152854;font-weight:650}
 .estv .estv-work{display:grid;grid-template-columns:minmax(0,1fr) 206px;gap:14px;align-items:start}.estv .estv-editor{min-width:0}.estv .est2-scroll{border:1px solid #dbe3ef;border-radius:10px;overflow:auto;max-width:100%}.estv .est2-grid{display:block;min-width:0}.estv .est2-rows{display:block}.estv .estv-table-head,.estv .estv-row{display:grid;gap:0 6px;padding:0 7px;align-items:center;min-width:0}.estv .estv-table-head.sdm,.estv .estv-row.sdm{grid-template-columns:minmax(100px,2.45fr) minmax(38px,.7fr) minmax(38px,.7fr) minmax(56px,.9fr) minmax(54px,.9fr) 28px}.estv .estv-table-head.cost,.estv .estv-row.cost{grid-template-columns:minmax(100px,2.1fr) minmax(38px,.65fr) minmax(54px,1fr) minmax(52px,.85fr) minmax(58px,.9fr) 28px}
 .estv .estv-table-head{background:#eef3f9;min-height:34px;border-bottom:1px solid #dbe3ef}.estv .estv-table-head strong{font-size:10.5px;color:#485d7d;background:transparent;padding:5px 0;font-weight:650;overflow-wrap:anywhere}.estv .estv-table-head strong:nth-child(n+2):nth-child(-n+4){text-align:center}.estv .estv-table-head strong:nth-child(5){text-align:right;padding-right:3px}.estv .estv-row{min-height:42px;border-top:1px solid #eaf0f6;background:white}.estv .estv-row:first-child{border-top:0}.estv .estv-row:hover{background:#f8fafd}.ke .estv .estv-row input{min-width:0;width:100%;height:30px;padding:5px 4px;font-size:12px;color:#334967;border:1px solid transparent;background:transparent;border-radius:5px;box-shadow:none}.ke .estv .estv-row input:first-child{font-weight:600}.ke .estv .estv-row input[type=number]{background:#f5f7fb;border-color:#e6ebf3;text-align:center;color:#152854;font-weight:600;appearance:textfield}.ke .estv .estv-row input::-webkit-inner-spin-button{appearance:none}.ke .estv .estv-row input:focus,.ke .estv .estv-row input:hover{border-color:#b5c7e3;background:white}.ke .estv .estv-row.invalid input{border-color:#e5a543}.estv .estv-row output{font-size:12px;font-weight:650;text-align:right;padding:0 3px;justify-content:flex-end;background:transparent;color:#152854;overflow-wrap:anywhere;min-width:0}.estv .estv-row [data-e2-del]{display:grid;place-items:center;width:26px;height:26px;min-width:0;padding:0;margin:0;border:0;background:transparent;color:#7a899f;border-radius:6px;box-shadow:none}.estv .estv-row [data-e2-del]:hover{color:#b32737;background:#fff0f1}.estv .estv-row [data-e2-del] svg{width:15px;height:15px}
 .estv .estv-row-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}.estv .estv-row-actions button{margin:0;font-size:11.5px;padding:6px 9px}.estv .estv-row-actions [data-e2-add]{border:1px dashed #aabbd5;background:#f8fafd}.estv .estv-row-actions [data-estv-reset]{margin-left:auto;border:0;color:#71829b;background:transparent}
 .estv .estv-result{border:1px solid #dce5f1;border-radius:11px;background:white;overflow:visible;min-width:0}.estv .estv-result-top{background:#152854;color:white;padding:14px 13px 13px;position:relative;border-radius:10px 10px 0 0}.estv .estv-result-top:before{content:'';position:absolute;left:0;top:15px;bottom:15px;width:3px;background:#f2b827;border-radius:0 3px 3px 0}.estv .estv-result-top .estv-kicker{color:#c3cfe5}.estv .estv-result-top [data-estv-amount]{margin:9px 0 2px;line-height:1.2;overflow-wrap:anywhere}.estv .estv-result-top [data-e2-total]{font-size:24px;letter-spacing:-.035em;font-variant-numeric:tabular-nums;color:#fff}.estv .estv-result-top>span{font-size:11px;color:#b8c7e1}.estv .estv-result-details{padding:4px 12px}.estv .estv-result-details>div{display:flex;align-items:center;justify-content:space-between;gap:6px;border-bottom:1px solid #edf1f6;padding:8px 0;font-size:11px;color:#64758e}.estv .estv-result-details>div>b{font-size:12px;color:#152854;white-space:nowrap}.estv .estv-result-details span{display:flex;align-items:center;gap:5px}.estv .estv-result-details .estv-manual{display:block;border:0}.estv .estv-manual .fld{display:block;margin-top:5px}.estv .estv-manual .fld label{display:none}.ke .estv .estv-manual input{height:31px;font-size:13px;border:1px solid #d7e0ef;border-radius:6px;background:#fff;text-align:right}.estv .estv-result-action{padding:4px 12px 12px}.estv .estv-result-action button{width:100%;background:#f2b827;border-color:#f2b827;color:#152854;font-weight:700;padding:8px 7px;white-space:normal}
 .estv .est2-info-body{position:fixed;z-index:100000;max-height:calc(100vh - 24px);overflow:auto;box-shadow:0 10px 35px #14265330;border-top:1px solid #d6dfec}.estv .est2-info>summary{width:17px;height:17px;line-height:1;border-color:#9daec4;color:#627894}.estv .est2-info-body p{white-space:normal;text-align:left}
 .estv .estv-dialog{width:min(690px,calc(100vw - 28px));max-width:690px;max-height:calc(100dvh - 30px);padding:0;overflow:auto;border:1px solid #dce5f1;border-radius:15px;background:white;color:#263852;box-shadow:0 24px 80px #15285455;font:inherit}.estv .estv-dialog::backdrop{background:#15285470}.estv .estv-dialog-head{display:flex;justify-content:space-between;align-items:center;padding:14px 19px 10px;border-bottom:1px solid #e1e7f0}.estv .estv-dialog-head h3{font-size:20px}.estv .estv-dialog-head button{padding:4px 9px;border:0;background:transparent;font-size:19px;color:#71829b}.estv .estv-dialog .est2-pro{border:0;padding:12px 19px 17px;margin:0;background:white}.estv .estv-dialog .est2-ph-line{grid-template-columns:82px minmax(0,1fr);margin-top:9px}.estv .estv-dialog .est2-chip{padding:6px 10px;border-radius:7px;font-size:11.5px}.estv .estv-dialog .est2-ph-fields{grid-template-columns:1fr .7fr .8fr 1.3fr;gap:9px}.estv .estv-dialog .est2-ph-reference{background:#f5f8fc}.estv .estv-dialog .est2-ph-actions{padding-top:12px}.estv .estv-dialog .est2-ph-actions [data-ph-add]{padding:8px 13px}
 .estv [data-e2-panel=gate]>.kd2-card{border:1px solid #dfe6ef;padding:14px;background:white}
 @media(max-width:1150px){.ke .estv{grid-template-columns:176px minmax(0,1fr);gap:12px}.estv .estv-work{grid-template-columns:minmax(0,1fr) 175px;gap:10px}.estv .estv-result-top [data-e2-total]{font-size:22px}}
 @media(max-width:950px){.ke .estv{grid-template-columns:164px minmax(0,1fr);gap:10px}.estv .estv-work{grid-template-columns:minmax(0,1fr)}.estv .estv-result{display:grid;grid-template-columns:1fr 1.2fr auto;align-items:center}.estv .estv-result-top{border-radius:10px 0 0 10px;height:100%}.estv .estv-result-action{padding:8px}.estv .est2-grid{min-width:390px}}
 @media(max-width:680px){.ke .estv{display:block}.estv .estv-nav{position:static;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:0;border-bottom:1px solid #e4eaf2;padding:0 0 10px;margin-bottom:10px}.estv .estv-nav>.estv-kicker,.estv .estv-arrow{display:none}.estv .estv-duration{grid-column:1/-1}.estv .estv-link{padding:6px;gap:4px}.estv .estv-nav-icon{display:none}.estv .estv-heading h3{font-size:18px}.estv .estv-result{grid-template-columns:1fr 1fr}.estv .estv-result-action{grid-column:1/-1}.estv .estv-dialog .est2-ph-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.estv .estv-dialog .est2-ph-line{grid-template-columns:1fr}.estv .estv-actions button{white-space:normal}}
`;document.head.appendChild(s)})();
window.MT_EST_HELPER={attach,version:'20261127-est-v3-template'};
})();
