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
function attach(root){
 (root||document).querySelectorAll(COST+','+SDM).forEach(inp=>{
  if(inp.dataset.esth||inp.disabled||inp.readOnly)return;inp.dataset.esth='1';
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
.esth-t button{background:#12275A!important;color:#fff!important;border-color:#12275A!important}`;document.head.appendChild(s)})();
window.MT_EST_HELPER={attach,version:'20261127-est1'};
})();
