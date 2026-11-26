/* Bantu isi estimasi proyek — v20261127-est1
   - Biaya: hanya BELANJA BARANG (pro hire/tenaga ahli, vendor, lisensi, infrastruktur, lainnya). Gaji PNS = belanja pegawai, tidak dihitung.
   - SDM (orang-bulan): tenaga PNS inhouse + pro hire tim tetap = orang × bulan × porsi waktu.
   Melekat otomatis pada isian estimasi di form Usulan Non-ISTK (#kn-*) dan form Usulan Proyek ISTK ([data-scope-field]). */
(function(){
'use strict';
const COST='#kn-cost,[data-scope-field="estimatedCostMillions"]',SDM='#kn-estimatedStaffMonths,[data-scope-field="estimatedStaffMonths"]',DUR='#kn-durationMonths,[data-scope-field="durationMonths"]';
const ITEMS=[['prohire','Pro hire / tenaga ahli kontrak'],['vendor','Jasa pengembangan (vendor)'],['lisensi','Lisensi & langganan'],['infra','Infrastruktur / cloud'],['lain','Lainnya (pelatihan, dsb.)']];
const nf=v=>Number(v).toLocaleString('id-ID',{maximumFractionDigits:2});
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return isFinite(n)&&n>=0?n:0};
function setVal(inp,v){inp.value=String(Math.round(v*100)/100);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}
function costBox(){return '<details class="esth"><summary>🧮 Hitung dari rincian belanja barang</summary><div class="esth-b">'+
 '<p class="esth-n">Isi hanya <b>belanja barang</b>. Gaji/tunjangan PNS tidak dihitung karena termasuk <b>belanja pegawai</b> — tenaga PNS dicatat di <b>Kebutuhan SDM</b>.</p>'+
 ITEMS.map(i=>'<label class="esth-r"><span>'+i[1]+'</span><span class="esth-in"><em>Rp</em><input type="number" min="0" step="any" data-esth-c="'+i[0]+'" placeholder="0"><em>jt</em></span></label>').join('')+
 '<div class="esth-t"><span>Total belanja barang</span><b data-esth-ctot>Rp 0 jt</b><button type="button" data-esth-cuse>Pakai total</button></div></div></details>'}
function sdmRow(){return '<div class="esth-sr"><input type="text" data-esth-role placeholder="Peran, mis. Developer PNS"><input type="number" min="0" step="any" data-esth-n placeholder="orang" aria-label="Jumlah orang"><span>×</span><input type="number" min="0" step="any" data-esth-m placeholder="bulan" aria-label="Lama (bulan)"><span>×</span><input type="number" min="0" max="100" step="any" data-esth-p value="100" aria-label="Porsi waktu (%)"><em>%</em><button type="button" data-esth-del aria-label="Hapus baris">✕</button></div>'}
function sdmBox(){return '<details class="esth"><summary>🧮 Hitung orang-bulan</summary><div class="esth-b">'+
 '<p class="esth-n">Hitung <b>PNS inhouse</b> dan <b>pro hire tim tetap</b>. Pro hire yang direkrut khusus untuk proyek ini dicatat di <b>biaya</b> (belanja barang), bukan di sini.</p>'+
 '<div class="esth-sh"><span>Peran</span><span>Orang</span><span></span><span>Bulan</span><span></span><span>Porsi</span></div><div data-esth-rows>'+sdmRow()+'</div><button type="button" class="esth-add" data-esth-add>+ Tambah peran</button>'+
 '<div class="esth-t"><span>Total</span><b data-esth-stot>0 org-bln</b><button type="button" data-esth-suse>Pakai hasil</button></div><p class="esth-x">Contoh: 3 developer × 6 bulan × 50% = 9 org-bln.</p></div></details>'}
function scope(el){return el.closest('dialog,[role="dialog"],.ov,.modal,form,section')||document}

function attachNon(inp){
 const form=inp.closest('.ke-form.ke-three');if(!form||!inp.closest('.ke-ov')||!inp.id.startsWith('kn-'))return false;
 const cost=form.querySelector('#kn-cost'),sdm=form.querySelector('#kn-estimatedStaffMonths'),dur=form.querySelector('#kn-durationMonths');
 if(!cost||!sdm||!dur||cost.disabled||sdm.disabled||cost.readOnly||sdm.readOnly)return false;
 if(form.dataset.esth2)return true;
 form.dataset.esth2='1';cost.dataset.esth=sdm.dataset.esth='1';
 const p=document.createElement('div');p.className='est2';p.hidden=true;
 p.innerHTML='<div class="est2-top"><b data-e2-title></b><button type="button" data-e2-close aria-label="Tutup kalkulator">✕</button></div>'+
 '<section data-e2-panel="cost" hidden><p class="est2-guide"><b>Rumus:</b> volume × tarif satuan. Isi belanja barang proyek; gaji/tunjangan PNS tidak dihitung. Jangan menghitung dua kali biaya yang sudah termasuk kontrak lain. Gunakan penawaran, kontrak sejenis, atau standar biaya yang berlaku. Tarif dalam <b>Rp juta</b>.</p><div class="est2-scroll"><div class="est2-grid cost"><strong>Komponen biaya</strong><strong>Volume</strong><strong>Satuan</strong><strong>Tarif (Rp jt)</strong><strong>Subtotal (Rp jt)</strong><span></span><div data-e2-cost-rows class="est2-rows"></div></div></div><button type="button" data-e2-add="cost">+ Tambah komponen</button><div class="est2-total"><span>Estimasi biaya</span><b data-e2-total="cost">Rp 0 jt</b><button type="button" data-e2-use="cost">Gunakan hasil</button></div><p class="est2-hint">Contoh ilustrasi: 2 tenaga ahli × 4 bulan = 8 orang-bulan; tarif Rp 15 juta/orang-bulan = Rp 120 juta. Bukan tarif resmi.</p></section>'+
 '<section data-e2-panel="sdm" hidden><p class="est2-guide"><b>Rumus:</b> jumlah orang × bulan keterlibatan × alokasi waktu (%). Hitung kapasitas PNS in-house dan pro hire tim tetap. Tenaga kontrak khusus proyek/vendor dicatat di biaya, bukan kapasitas internal (sesuai definisi estimasi yang ada).</p><div class="est2-scroll"><div class="est2-grid sdm"><strong>Peran / fungsi</strong><strong>Orang</strong><strong>Bulan</strong><strong>Alokasi (%)</strong><strong>Orang-bulan</strong><span></span><div data-e2-sdm-rows class="est2-rows"></div></div></div><button type="button" data-e2-add="sdm">+ Tambah peran</button><button type="button" data-e2-duration>Isi bulan kosong dari durasi proyek</button><div class="est2-total"><span>Kebutuhan SDM</span><b data-e2-total="sdm">0 org-bln</b><button type="button" data-e2-use="sdm">Gunakan hasil</button></div><p class="est2-hint">Contoh: 2 developer × 6 bulan × 50% = 6 orang-bulan. Satu orang-bulan setara satu orang bekerja penuh selama satu bulan.</p></section>';
 form.insertAdjacentElement('afterend',p);
 const q=s=>p.querySelector(s),qa=s=>Array.from(p.querySelectorAll(s));
 const number=(key,lab,step='any',extra='')=>'<input type="number" min="0" step="'+step+'" data-e2-'+key+' aria-label="'+lab+'" '+extra+'>';
 function add(type,name='',unit=''){
  const r=document.createElement('div');r.className='est2-row';r.dataset.e2Row=type;
  r.innerHTML='<input type="text" data-e2-name aria-label="'+(type==='cost'?'Komponen biaya':'Peran')+'" placeholder="'+(type==='cost'?'Nama komponen':'Contoh: Developer')+'">'+(type==='cost'?number('n','Volume')+'<input type="text" data-e2-unit aria-label="Satuan" placeholder="paket">'+number('rate','Tarif Rp juta'):number('n','Jumlah orang','1')+number('months','Bulan')+number('pct','Alokasi waktu (%)','any','max="100" value="100"'))+'<output data-e2-sub>—</output><button type="button" data-e2-del aria-label="Hapus baris">×</button>';
  r.querySelector('[data-e2-name]').value=name;if(type==='cost')r.querySelector('[data-e2-unit]').value=unit;
  q('[data-e2-'+type+'-rows]').appendChild(r);
 }
 [['Pro hire / tenaga ahli','orang-bulan'],['Jasa pengembangan / vendor','paket'],['Lisensi / langganan','lisensi'],['Infrastruktur / cloud','bulan'],['Pelatihan / lainnya','paket']].forEach(a=>add('cost',...a));
 ['Project Manager / Koordinator','Business Analyst','Developer','Tester / QA','Change Management'].forEach(n=>add('sdm',n));
 const parse=e=>{if(!e||e.value.trim()===''||!e.validity.valid)return null;const n=Number(e.value);return Number.isFinite(n)&&n>=0?n:null};
 function calc(type){
  let total=0,valid=true,used=false;
  qa('[data-e2-row="'+type+'"]').forEach(r=>{
   const v=k=>r.querySelector('[data-e2-'+k+']'),fields=type==='cost'?['n','rate']:['n','months','pct'];
   const active=(type==='cost'?fields:['n','months']).some(k=>v(k).value.trim()!==''||v(k).validity.badInput);
   const vals=fields.map(k=>parse(v(k)));
   const ok=active&&vals.every(x=>x!==null)&&(type==='cost'||(Number.isInteger(vals[0])&&vals[2]<=100))&&v('name').value.trim()&&(type!=='cost'||v('unit').value.trim());
   const sub=ok?(type==='cost'?vals[0]*vals[1]:vals[0]*vals[1]*vals[2]/100):null;
   if(active){used=true;if(sub===null||!Number.isFinite(sub))valid=false;else total+=sub}
   v('sub').textContent=sub===null?'—':nf(sub);r.classList.toggle('invalid',active&&sub===null);
  });
  q('[data-e2-total="'+type+'"]').textContent=(type==='cost'?'Rp ':'')+nf(total)+(type==='cost'?' jt':' org-bln');
  q('[data-e2-use="'+type+'"]').disabled=!used||!valid||!Number.isFinite(total);
  return {total,valid:used&&valid&&Number.isFinite(total)};
 }
 let mode='';
 function show(type){mode=type;p.hidden=false;q('[data-e2-title]').textContent=type==='cost'?'Kalkulator estimasi biaya':'Kalkulator kebutuhan SDM';qa('[data-e2-panel]').forEach(el=>el.hidden=el.dataset.e2Panel!==type);calc(type)}
 [[cost,'cost','Hitung estimasi biaya'],[sdm,'sdm','Hitung kebutuhan SDM']].forEach(([el,type,label])=>{
  const b=document.createElement('button');b.type='button';b.className='est2-trigger';b.textContent='▦ '+label;el.insertAdjacentElement('afterend',b);
  b.addEventListener('click',e=>{e.stopPropagation();if(!p.hidden&&mode===type)p.hidden=true;else show(type)});
 });
 p.addEventListener('input',e=>{e.stopPropagation();if(mode)calc(mode)});
 p.addEventListener('change',e=>{e.stopPropagation();if(mode)calc(mode)});
 p.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;e.stopPropagation();e.preventDefault();
  if(b.hasAttribute('data-e2-close')){p.hidden=true;return}
  if(b.dataset.e2Add){add(b.dataset.e2Add);calc(b.dataset.e2Add);return}
  if(b.hasAttribute('data-e2-del')){const r=b.closest('[data-e2-row]'),t=r.dataset.e2Row;r.remove();calc(t);return}
  if(b.hasAttribute('data-e2-duration')){if(parse(dur)>0)qa('[data-e2-row="sdm"]').forEach(r=>{const n=r.querySelector('[data-e2-n]'),m=r.querySelector('[data-e2-months]');if(n.value!==''&&m.value==='')m.value=dur.value});calc('sdm');return}
  if(b.dataset.e2Use){const t=b.dataset.e2Use,v=calc(t);if(v.valid){setVal(t==='cost'?cost:sdm,v.total);p.hidden=true}}
 });
 return true;
}

function attach(root){
 (root||document).querySelectorAll(COST+','+SDM).forEach(inp=>{
  if(inp.dataset.esth||inp.disabled||inp.readOnly)return;if(attachNon(inp))return;inp.dataset.esth='1';
  const host=inp.closest('label')||inp,box=document.createElement('div');box.className='esth-wrap';box.innerHTML=inp.matches(COST)?costBox():sdmBox();
  box._target=inp;host.insertAdjacentElement('afterend',box);
  if(inp.matches(SDM)){const d=scope(inp).querySelector(DUR);if(d&&num(d.value))box.querySelector('[data-esth-m]').value=num(d.value)}
 })}
function calc(box){
 if(box.querySelector('[data-esth-c]')){const t=[...box.querySelectorAll('[data-esth-c]')].reduce((a,i)=>a+num(i.value),0);box.querySelector('[data-esth-ctot]').textContent='Rp '+nf(t)+' jt';return t}
 const t=[...box.querySelectorAll('.esth-sr')].reduce((a,r)=>a+num(r.querySelector('[data-esth-n]').value)*num(r.querySelector('[data-esth-m]').value)*num(r.querySelector('[data-esth-p]').value)/100,0);
 box.querySelector('[data-esth-stot]').textContent=nf(t)+' org-bln';return t}
document.addEventListener('input',e=>{const b=e.target.closest&&e.target.closest('.esth-wrap');if(!b)return;e.stopPropagation();calc(b)},true);
document.addEventListener('change',e=>{if(e.target.closest&&e.target.closest('.esth-wrap'))e.stopPropagation()},true);
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.esth-wrap');if(!b)return;const t=e.target;
 if(t.closest('summary'))return;
 if(t.matches('[data-esth-cuse],[data-esth-suse]')){e.preventDefault();e.stopPropagation();const v=calc(b);setVal(b._target,v);b.querySelector('details').open=false;return}
 if(t.matches('[data-esth-add]')){e.preventDefault();e.stopPropagation();b.querySelector('[data-esth-rows]').insertAdjacentHTML('beforeend',sdmRow());return}
 if(t.matches('[data-esth-del]')){e.preventDefault();e.stopPropagation();const rows=b.querySelectorAll('.esth-sr');if(rows.length>1)t.closest('.esth-sr').remove();else t.closest('.esth-sr').querySelectorAll('input').forEach(i=>i.value=i.matches('[data-esth-p]')?'100':'');calc(b);return}
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
`;document.head.appendChild(s)})();
window.MT_EST_HELPER={attach,version:'20261127-est1'};
})();
