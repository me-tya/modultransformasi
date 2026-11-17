/* Modul Transformasi — existing compact Activity filter extension. */
(function(){
'use strict';
const W=window.ActivityWBS;if(!W)return;
W.mtFilterHtml=function(u,fsel){
 const g=u.actWbsGroup||'',k=u.actWbsLevel4||'';
 const four=g?W.l4(g):Object.keys(W.stages);
 const five=k?(W.stages[k]||[]):four.flatMap(x=>W.stages[x]||[]);
 return fsel('actWbsGroup','Semua PM / CM',[['PM','PM · Project Management'],['CM','CM · Change Management']],g)+
  fsel('actWbsLevel4','Semua WBS Level 4',four,k)+
  fsel('actWbsLevel5','Semua WBS Level 5',five,u.actWbsLevel5||'');
};
W.mtMatch=function(r,u){
 return W.matches(r,{wbsGroup:u.actWbsGroup,wbsLevel4:u.actWbsLevel4,wbsLevel5:u.actWbsLevel5},'tgl');
};
W.mtLastFiltered=[];
W.mtExport=function(){
 const items=W.mtLastFiltered||[];
 const head=['Tanggal','Nama Aktivitas','PM/CM','WBS Level 4','WBS Level 5','Kategori','Program','Unit Pemohon','PIC','Status','Undangan','Surat Tugas'];
 const rows=[head,...items.map(x=>[
 x.tgl||'',x.nama||x.tema||'',x.wbsGroup||'',x.wbsLevel4||'',x.wbsLevel5||'',
 x.kat||'',x.program||'',x.unitP||'',Array.isArray(x.pic)?x.pic.join('; '):x.pic||'',
 x.stat||'',x.undStatus||'',x.stStatus||''
 ])];
 const u=typeof S==='undefined'?{}:S.ui||{};
 W.csv('IKU-PM-CM-'+(u.actTahun||u.tahun||'Semua')+'-TW'+(u.oneTw||'Semua')+'.csv',rows);
};
document.addEventListener('change',function(ev){
 const t=ev.target;if(!t||!t.matches)return;
 if(typeof S==='undefined'||!S.ui)return;
 if(t.matches('[data-actf="actWbsGroup"]')){S.ui.actWbsLevel4='';S.ui.actWbsLevel5='';}
 if(t.matches('[data-actf="actWbsLevel4"]'))S.ui.actWbsLevel5='';
},true);
document.addEventListener('click',function(ev){
 const btn=ev.target.closest?.('[data-wbs-export]');if(!btn)return;
 ev.preventDefault();W.mtExport();
});
})();
