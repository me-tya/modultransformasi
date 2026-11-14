/* Aktivitas > Tim Pusmantap > Profil: export portable employee profiles/photos.
 * Native JSON schema is intentionally compatible with the Dashboard CM
 * Tim Pusmantap "Impor Profil & Foto" reader (cfg-master / cfg-kp / cfg-kp-*).
 * No unrelated activity records, private application credentials or auth state.
 */
(function(root){
'use strict';
if(root.MT_PROFILE_EXPORT)return;
const clone=x=>JSON.parse(JSON.stringify(x));
function build(input){
 const docs=Array.isArray(input&&input.docs)?input.docs:[];
 const original=docs.find(d=>d&&d.id==='cfg-master'&&d.master)||{};
 const profiles=Array.isArray(input?.master?.pic)?input.master.pic:
  Array.isArray(original.master?.pic)?original.master.pic:[];
 const cfg=input&&input.cfg&&typeof input.cfg==='object'&&!Array.isArray(input.cfg)?
  input.cfg:(docs.find(d=>d&&d.id==='cfg-kp')||{}).kp||{};
 const keep=[
  {id:'cfg-master',kind:'cfg',tahun:0,tw:0,master:{pic:clone(profiles)}},
  {id:'cfg-kp',kind:'cfg',tahun:0,tw:0,kp:clone(cfg)}
 ];
 const contacts=docs.filter(d=>d&&typeof d.id==='string'&&/^cfg-kp-[A-Za-z0-9_-]+$/.test(d.id)&&d.kp&&typeof d.kp==='object');
 for(const d of contacts){
  keep.push({id:d.id,kind:'cfg',tahun:0,tw:0,kp:clone(d.kp)});
 }
 const settings=docs.find(d=>d&&d.id==='cfg-tim'&&d.tim);
 if(settings)keep.push({id:'cfg-tim',kind:'cfg',tahun:0,tw:0,tim:clone(settings.tim)});
 const foto=profiles.filter(p=>p&&typeof p.foto==='string'&&p.foto.trim());
 const fotoData=foto.filter(p=>/^data:image\//i.test(p.foto));
 const contactsFoto=contacts.filter(d=>d.kp&&typeof d.kp.foto==='string'&&d.kp.foto.trim());
 return {
  kind:'mt-tim-pusmantap-profiles',
  schemaVersion:1,
  source:'Modul Transformasi · Aktivitas · Tim Pusmantap',
  exportedAt:new Date().toISOString(),
  summary:{
   profiles:profiles.length,photos:foto.length,embeddedProfilePhotos:fotoData.length,
   unitContacts:contacts.length,unitContactPhotos:contactsFoto.length,
   teams:Array.isArray(cfg.tims)?cfg.tims.length:0
  },
  oneonone:keep
 };
}
function download(input){
 const data=build(input),json=JSON.stringify(data,null,2);
 const blob=new Blob([json],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const date=new Date(),pad=n=>String(n).padStart(2,'0');
 const stamp=date.getFullYear()+pad(date.getMonth()+1)+pad(date.getDate())+'_'+pad(date.getHours())+pad(date.getMinutes());
 const filename='Tim_Pusmantap_Profil_Foto_'+stamp+'.json';
 try{
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
 }finally{setTimeout(()=>URL.revokeObjectURL(url),30000)}
 return {filename,size:blob.size,summary:data.summary};
}
root.MT_PROFILE_EXPORT={build,download};
})(window);
